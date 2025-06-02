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

    // Step 1: Get FULL user's following list with pagination
    console.log('📋 Fetching COMPLETE user following list...')
    let allFollowing: any[] = []
    let cursor: string | undefined = undefined
    let pageCount = 0
    const maxPages = deepParam ? 50 : 15 // Deep: 50 pages (2500), Standard: 15 pages (750)
    
    do {
      try {
        const followingPage = await getFollowing(userFid, 50, cursor) // 50 per page
        allFollowing.push(...followingPage.data)
        cursor = followingPage.nextCursor
        pageCount++
        
        console.log(`📄 Page ${pageCount}: +${followingPage.data.length} users (total: ${allFollowing.length})`)
        
        if (pageCount >= maxPages) {
          console.log(`⏹️ Reached max pages (${maxPages}), stopping pagination`)
          break
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch page ${pageCount + 1}:`, error)
        break
      }
    } while (cursor && pageCount < maxPages)
    
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

    // Step 2: Smart account selection for optimization
    // Prioritize accounts with moderate follower counts (sweet spot for mutual discovery)
    let smartSelection = allFollowing
      .filter(user => user.followerCount >= 100) // Only filter out bots (<100 followers)
      .sort((a, b) => {
        // Prioritize accounts with 1K-20K followers (best mutual discovery ratio)
        const aScore = a.followerCount >= 1000 && a.followerCount <= 20000 ? a.followerCount : a.followerCount * 0.5
        const bScore = b.followerCount >= 1000 && b.followerCount <= 20000 ? b.followerCount : b.followerCount * 0.5
        return bScore - aScore
      })
    
    // Apply limit only for standard analysis
    if (!deepParam) {
      smartSelection = smartSelection.slice(0, 300) // Standard: 300 accounts
    }
    // Deep analysis: use ALL filtered accounts for maximum accuracy
    
    console.log(`🧠 Smart selection: ${smartSelection.length} high-potential accounts (filtered from ${allFollowing.length})`)
    console.log(`🔍 ${deepParam ? 'DEEP ANALYSIS: Analyzing COMPLETE network including mega-accounts' : 'STANDARD: Analyzing subset'} for maximum ${deepParam ? 'accuracy' : 'speed'}`)

    // Step 3: For each selected account, find mutual connections with optimized batch processing
    console.log('🔍 Finding mutual connections with optimized processing...')
    
    const mutualCandidates = new Map<number, UserWithMutuals>()
    const userFollowsFids = new Set(allFollowing.map(u => u.fid))
    let processedCount = 0
    let rateLimitHits = 0
    let batchCount = 0
    
    // Process in smaller batches with dynamic delays
    const batchSize = 25 // Process 25 accounts per batch
    for (let i = 0; i < smartSelection.length; i += batchSize) {
      const batch = smartSelection.slice(i, i + batchSize)
      batchCount++
      
      console.log(`📦 Processing batch ${batchCount}/${Math.ceil(smartSelection.length / batchSize)} (${batch.length} accounts)`)
      
      // Process batch sequentially but with optimized delays
      for (const followedUser of batch) {
        try {
          processedCount++
          const progress = Math.round((processedCount / smartSelection.length) * 100)
          
          if (processedCount % 100 === 0 || (processedCount % 50 === 0 && processedCount <= 200)) {
            console.log(`🔗 [${progress}%] Progress: ${processedCount}/${smartSelection.length} accounts processed`)
          }
          
          // Optimized following limits for faster processing (trust-based discovery)
          let followingLimit = 30 // Reduced default
          if (followedUser.followerCount > 50000) followingLimit = 40
          else if (followedUser.followerCount > 10000) followingLimit = 35
          else if (followedUser.followerCount > 5000) followingLimit = 30
          
          // CRITICAL FIX: Changed from getFollowers to getFollowing for trust-based discovery
          // User insight: Find people that your trusted network follows, not their fans
          const following = await getFollowing(followedUser.fid, followingLimit)
          
          for (const potentialRec of following.data) {
            if (!potentialRec.fid || potentialRec.fid === 0) continue
            if (potentialRec.fid === userFid || userFollowsFids.has(potentialRec.fid)) continue

            // Add or update mutual count
            if (mutualCandidates.has(potentialRec.fid)) {
              const existing = mutualCandidates.get(potentialRec.fid)!
              existing.mutualCount = (existing.mutualCount || 0) + 1
              if (debugParam && existing.mutualCount >= 20 && existing.mutualCount % 20 === 0) {
                console.log(`🔥 HIGH MUTUAL: ${potentialRec.username} now has ${existing.mutualCount} mutual connections!`)
              }
            } else {
              mutualCandidates.set(potentialRec.fid, {
                ...potentialRec,
                mutualCount: 1
              })
            }
          }
          
          // Minimal delay to respect rate limits
          if (processedCount % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100)) // 100ms every 10 requests
          }
          
        } catch (error) {
          if (error instanceof Error && error.message?.includes('429')) {
            rateLimitHits++
            console.warn(`⚠️ Rate limit hit (${rateLimitHits} total). Adding delay...`)
            await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
          } else {
            console.warn(`⚠️ Failed to process ${followedUser.username}:`, error)
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
      
      // Small delay between batches
      if (i + batchSize < smartSelection.length) {
        console.log(`⏸️ Batch ${batchCount} complete. Brief pause before next batch...`)
        await new Promise(resolve => setTimeout(resolve, 200)) // 200ms between batches
      }
    }

    console.log(`🎯 Found ${mutualCandidates.size} potential recommendations from ${processedCount} analyzed accounts`)
    console.log(`⚠️ Rate limits encountered: ${rateLimitHits} times during analysis`)
    console.log(`⚡ Processing optimized: ${batchCount} batches completed with smart account selection`)

    // Step 4: Filter and enhance recommendations (require 2+ mutuals for deep analysis)
    const minMutuals = deepParam ? 2 : 1
    const recommendations: UserWithMutuals[] = Array.from(mutualCandidates.values())
      .filter(user => (user.mutualCount || 0) >= minMutuals)
      .map(user => ({
        ...user,
        score: calculateRecommendationScore(user)
      }))

    console.log(`📊 ${recommendations.length} candidates meet ${minMutuals}+ mutual requirement`)

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