import { NextRequest, NextResponse } from 'next/server'
import { getFollowing, getFollowers } from '../../../../lib/farcaster'
import { profileCache } from '../../../../utils/profileCache'
import { 
  sortWarmRecommendations, 
  getTopUsers, 
  UserWithMutuals,
  calculateRecommendationScore 
} from '../../../../utils/sort'

// API response interface
interface RecommendationsResponse {
  success: boolean
  userFid: number
  totalRecommendations: number
  recommendations: UserWithMutuals[]
  processingTime: number
  cacheStats?: {
    size: number
    totalAccesses: number
    avgAge: number
    oldestEntry: number
  }
  debug?: {
    userFollowingCount: number
    totalCandidates: number
    filteredCandidates: number
    topScores: Array<{
      username: string
      mutuals: number | undefined
      score: number | undefined
    }>
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Extract FID from query parameters
    const { searchParams } = new URL(request.url)
    const fidParam = searchParams.get('fid')
    const limitParam = searchParams.get('limit') || '50' // Increased default to 50
    const debugParam = searchParams.get('debug') === 'true'
    const deepParam = searchParams.get('deep') === 'true' // New: deep analysis flag
    
    if (!fidParam) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: fid',
        message: 'Please provide a user FID to get recommendations for'
      }, { status: 400 })
    }

    const userFid = parseInt(fidParam)
    const limit = Math.min(parseInt(limitParam), 100) // Cap at 100 recommendations
    
    if (isNaN(userFid) || userFid <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid FID',
        message: 'FID must be a positive integer'
      }, { status: 400 })
    }

    console.log(`🎯 Generating ${deepParam ? 'DEEP' : 'standard'} recommendations for FID ${userFid} (limit: ${limit})`)

    // Step 1: Get COMPLETE user's following list for accurate exclusion filter
    console.log('📋 Fetching COMPLETE user following list for exclusion filter...')
    let allFollowing: any[] = []
    let cursor: string | undefined = undefined
    let pageCount = 0
    const maxPagesForExclusion = 50 // Always load complete list for exclusion (up to 2500)
    
    do {
      try {
        const followingPage = await getFollowing(userFid, 50, cursor) // 50 per page
        allFollowing.push(...followingPage.data)
        cursor = followingPage.nextCursor
        pageCount++
        
        console.log(`📄 Page ${pageCount}: +${followingPage.data.length} users (total: ${allFollowing.length})`)
        
        if (pageCount >= maxPagesForExclusion) {
          console.log(`⏹️ Reached max pages (${maxPagesForExclusion}), stopping pagination`)
          break
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch page ${pageCount + 1}:`, error)
        break
      }
    } while (cursor && pageCount < maxPagesForExclusion)
    
    if (allFollowing.length === 0) {
      return NextResponse.json({
        success: true,
        userFid,
        recommendations: [],
        processingTime: Date.now() - startTime,
        message: 'User has no following connections to base recommendations on'
      })
    }

    console.log(`✅ Found ${allFollowing.length} total users that FID ${userFid} follows`)

    // Step 2: Smart account selection for analysis (PRODUCTION LIMITS)
    // Prioritize accounts with moderate follower counts (sweet spot for mutual discovery)
    let analysisSelection = allFollowing
      .filter(user => user.followerCount >= 100) // Only filter out bots (<100 followers)
      .sort((a, b) => {
        // Prioritize accounts with 1K-20K followers (best mutual discovery ratio)
        const aScore = a.followerCount >= 1000 && a.followerCount <= 20000 ? a.followerCount : a.followerCount * 0.5
        const bScore = b.followerCount >= 1000 && b.followerCount <= 20000 ? b.followerCount : b.followerCount * 0.5
        return bScore - aScore
      })
    
    // Apply PRODUCTION LIMITS for reasonable API usage and response times
    if (!deepParam) {
      analysisSelection = analysisSelection.slice(0, 75) // Standard: 75 accounts (was 300)
    } else {
      analysisSelection = analysisSelection.slice(0, 200) // Deep: 200 accounts (was unlimited)
    }

    console.log(`🧠 Smart selection: ${analysisSelection.length} high-potential accounts (filtered from ${allFollowing.length})`)
    console.log(`🔍 ${deepParam ? 'DEEP ANALYSIS: 200 account limit' : 'STANDARD: 75 account limit'} for production performance`)
    console.log(`⚡ Estimated API calls: ~${analysisSelection.length * 25} (${deepParam ? 'Deep' : 'Standard'} mode)`)

    // Create exclusion set for performance
    const userFollowingSet = new Set(allFollowing.map(user => user.fid))
    console.log(`🛡️ Exclusion filter ready: ${userFollowingSet.size} followed accounts to exclude`)

    // Step 3: Process accounts in batches with improved rate limiting
    const batchSize = 20 // Reduced batch size for better rate limiting (was 25)
    const mutualCandidates = new Map<number, UserWithMutuals>()
    let processedCount = 0
    let rateLimitHits = 0

    const totalBatches = Math.ceil(analysisSelection.length / batchSize)
    console.log(`📦 Processing ${analysisSelection.length} accounts in ${totalBatches} batches of ${batchSize}`)

    for (let i = 0; i < analysisSelection.length; i += batchSize) {
      const batch = analysisSelection.slice(i, i + batchSize)
      const batchCount = Math.floor(i / batchSize) + 1
      
      console.log(`📦 Processing batch ${batchCount}/${totalBatches} (${batch.length} accounts)`)

      for (const followedUser of batch) {
        try {
          processedCount++
          const progress = Math.round((processedCount / analysisSelection.length) * 100)
          
          // Progress reporting every 25 accounts or at milestones
          if (processedCount % 25 === 0 || processedCount === analysisSelection.length) {
            console.log(`🔗 [${progress}%] Progress: ${processedCount}/${analysisSelection.length} accounts processed`)
          }
          
          // Optimized following limits for faster processing (PRODUCTION SETTINGS)
          let followingLimit = 20 // Reduced default (was 30)
          if (followedUser.followerCount > 50000) followingLimit = 25 // Reduced (was 40)
          else if (followedUser.followerCount > 10000) followingLimit = 22 // Reduced (was 35)
          else if (followedUser.followerCount > 5000) followingLimit = 20 // Reduced (was 30)
          
          // CRITICAL FIX: Changed from getFollowers to getFollowing for trust-based discovery
          // User insight: Find people that your trusted network follows, not their fans
          const following = await getFollowing(followedUser.fid, followingLimit)
          
          for (const potentialRec of following.data) {
            if (!potentialRec.fid || potentialRec.fid === 0) continue
            if (potentialRec.fid === userFid || userFollowingSet.has(potentialRec.fid)) continue

            // Add or update mutual count
            if (mutualCandidates.has(potentialRec.fid)) {
              const existing = mutualCandidates.get(potentialRec.fid)!
              existing.mutualCount = (existing.mutualCount || 0) + 1
              
              // Track high mutual discoveries for logging
              if (existing.mutualCount === 20) {
                console.log(`🔥 HIGH MUTUAL: ${existing.username} now has ${existing.mutualCount} mutual connections!`)
              }
            } else {
              mutualCandidates.set(potentialRec.fid, {
                ...potentialRec,
                mutualCount: 1
              })
            }
          }
          
          // Smart rate limiting: Quick delay every 10 requests to prevent 429s
          if (processedCount % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay every 10 accounts
          }
          
        } catch (error) {
          if (error instanceof Error && error.message.includes('429')) {
            rateLimitHits++
            console.warn(`⚠️ Rate limit hit on ${followedUser.username || followedUser.fid}, backing off...`)
            await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second backoff on rate limit
          } else {
            console.warn(`⚠️ Failed to process ${followedUser.username || followedUser.fid}:`, error instanceof Error ? error.message : 'Unknown error')
          }
        }
      }
      
      // Check for early termination after each batch (only for standard analysis)
      if (!deepParam && processedCount >= 400 && mutualCandidates.size > limit * 15) {
        const highQualityCount = Array.from(mutualCandidates.values()).filter(u => (u.mutualCount || 0) >= 10).length
        if (highQualityCount >= limit * 5) {
          console.log(`🎯 Early termination (standard mode): Found ${highQualityCount} high-quality recommendations, stopping for performance`)
          break
        }
      }
      
      // Improved inter-batch delay for production stability
      if (i + batchSize < analysisSelection.length) {
        console.log(`⏸️ Batch ${batchCount} complete. Cooling down before next batch...`)
        await new Promise(resolve => setTimeout(resolve, 500)) // Increased to 500ms between batches
      }
    }

    console.log(`🎯 Found ${mutualCandidates.size} potential recommendations from ${processedCount} analyzed accounts`)
    console.log(`⚠️ Rate limits encountered: ${rateLimitHits} times during analysis`)
    console.log(`⚡ Processing optimized: ${totalBatches} batches completed with smart account selection`)

    // Step 4: Filter and enhance recommendations (require 2+ mutuals for deep analysis)
    const minMutuals = deepParam ? 2 : 1
    const recommendations: UserWithMutuals[] = Array.from(mutualCandidates.values())
      .filter(user => (user.mutualCount || 0) >= minMutuals)
      .filter(user => (user.followingCount || 0) >= 100) // Exclude business/project accounts (they follow <100 people)
      .map(user => ({
        ...user,
        score: calculateRecommendationScore(user)
      }))

    console.log(`📊 ${recommendations.length} candidates meet ${minMutuals}+ mutual requirement and 100+ following (real social accounts)`)

    // Report on high-mutual discoveries with optimized thresholds
    const mediumMutualCount = recommendations.filter(r => (r.mutualCount || 0) >= 15).length
    const highMutualCount = recommendations.filter(r => (r.mutualCount || 0) >= 30).length
    const veryhighMutualCount = recommendations.filter(r => (r.mutualCount || 0) >= 50).length
    
    if (mediumMutualCount > 0) {
      console.log(`🔍 DISCOVERY: ${mediumMutualCount} accounts with 15+ mutual connections found!`)
    }
    if (highMutualCount > 0) {
      console.log(`🔥 HIGH DISCOVERY: ${highMutualCount} accounts with 30+ mutual connections found!`)
    }
    if (veryhighMutualCount > 0) {
      console.log(`🚀 BREAKTHROUGH: ${veryhighMutualCount} accounts with 50+ mutual connections found!`)
    }

    // Step 5: Sort recommendations using our sorting utilities
    console.log('📊 Sorting recommendations by score...')
    const sortedRecommendations = sortWarmRecommendations(recommendations)
    
    // Step 6: Get top N recommendations
    const topRecommendations = getTopUsers(sortedRecommendations, limit)

    // Step 7: Enhanced profile data for recommendations
    console.log('🎨 Enriching recommendation profiles...')
    const enrichedRecommendations = await Promise.all(
      topRecommendations.map(async (rec) => {
        try {
          const profile = await profileCache.getProfile(rec.fid)
          return {
            ...rec,
            pfpUrl: profile.pfpUrl || rec.pfpUrl,
            bio: profile.bio || rec.bio
          }
        } catch (error) {
          console.warn(`Failed to enrich profile for FID ${rec.fid}:`, error)
          return rec
        }
      })
    )

    const endTime = Date.now()
    const totalTime = endTime - startTime

    // Log top results
    if (enrichedRecommendations.length > 0) {
      console.log(`🏆 Top recommendations:`)
      enrichedRecommendations.slice(0, 5).forEach((rec, i) => {
        console.log(`  ${i+1}. ${rec.username} - ${rec.mutualCount} mutuals (score: ${rec.score})`)
      })
    }

    console.log(`✅ Generated ${enrichedRecommendations.length} recommendations in ${totalTime}ms`)

    return NextResponse.json({
      success: true,
      recommendations: enrichedRecommendations,
      ...(debugParam && {
        debug: {
          userFid: userFid,
          totalFollowing: allFollowing.length,
          analyzedAccounts: processedCount,
          totalCandidates: mutualCandidates.size,
          filteredCandidates: recommendations.length,
          minMutuals: minMutuals,
          processingTimeMs: totalTime,
          deepAnalysis: deepParam,
          cacheStats: profileCache.getStats()
        }
      })
    })

  } catch (error) {
    console.error('Recommendations API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    }, { status: 500 })
  }
}

// POST endpoint for future bulk recommendations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fids } = body

    if (!Array.isArray(fids) || fids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        message: 'Expected array of FIDs'
      }, { status: 400 })
    }

    // For now, return mock data for bulk requests
    const mockRecommendations = fids.map((fid: number) => ({
      userFid: fid,
      recommendations: [
        {
          fid: 999,
          username: 'mock_user',
          displayName: 'Mock User',
          followerCount: 1000,
          followingCount: 500,
          mutualCount: 5,
          score: 500
        }
      ]
    }))

    return NextResponse.json({
      success: true,
      bulkRecommendations: mockRecommendations,
      message: 'Bulk recommendations (mock data)'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process bulk recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 