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
    const maxPages = deepParam ? 100 : 20 // Deep analysis: up to 100 pages (5000 users), standard: 20 pages (1000 users)
    
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

    // Step 2: Analyze ALL accounts in the network (no arbitrary follower count filtering)
    // For very large networks, we'll process in batches with rate limiting
    const totalToAnalyze = Math.min(allFollowing.length, deepParam ? 2000 : 500)
    const accountsToAnalyze = allFollowing
      .slice(0, totalToAnalyze) // Take first N accounts (chronological order, not biased by follower count)
    
    console.log(`🔍 Analyzing COMPLETE network: ${accountsToAnalyze.length} accounts (no follower count bias!)`)

    // Step 3: For each person, find people who also follow them (2nd degree connections)
    console.log('🔍 Finding mutual connections across your ENTIRE network...')
    
    const mutualCandidates = new Map<number, UserWithMutuals>()
    const userFollowsFids = new Set(allFollowing.map(u => u.fid))
    let processedCount = 0
    let rateLimitHits = 0
    
    // Process each followed user to find their followers (potential recommendations)
    for (const followedUser of accountsToAnalyze) {
      try {
        processedCount++
        const progress = Math.round((processedCount / accountsToAnalyze.length) * 100)
        console.log(`🔗 [${progress}%] Analyzing ${followedUser.username} (FID ${followedUser.fid}, ${followedUser.followerCount} followers)`)
        
        // Dynamic follower limit based on account size
        let followersLimit = 50
        if (followedUser.followerCount > 50000) followersLimit = 150
        else if (followedUser.followerCount > 20000) followersLimit = 100
        else if (followedUser.followerCount > 5000) followersLimit = 75
        
        const followers = await getFollowers(followedUser.fid, followersLimit)
        
        console.log(`📊 Found ${followers.data.length} followers for ${followedUser.username}`)
        
        for (const potentialRec of followers.data) {
          // Debug logging
          if (!potentialRec.fid || potentialRec.fid === 0) {
            console.warn(`⚠️ Invalid FID for potential recommendation:`, potentialRec)
            continue
          }
          
          // Skip if this is the original user or someone they already follow
          if (potentialRec.fid === userFid || userFollowsFids.has(potentialRec.fid)) {
            if (debugParam && potentialRec.fid === userFid) {
              console.log(`⏭️ Skipping ${potentialRec.username} (FID ${potentialRec.fid}) - is original user`)
            }
            continue
          }

          // Add or update mutual count for this potential recommendation
          if (mutualCandidates.has(potentialRec.fid)) {
            const existing = mutualCandidates.get(potentialRec.fid)!
            existing.mutualCount = (existing.mutualCount || 0) + 1
            if (debugParam && existing.mutualCount >= 10 && existing.mutualCount % 10 === 0) {
              console.log(`🔥 HIGH MUTUAL COUNT: ${potentialRec.username} now has ${existing.mutualCount} mutual connections!`)
            }
          } else {
            mutualCandidates.set(potentialRec.fid, {
              ...potentialRec,
              mutualCount: 1
            })
            if (debugParam && Math.random() < 0.1) { // Log 10% of new candidates to avoid spam
              console.log(`✨ New recommendation candidate: ${potentialRec.username} (FID ${potentialRec.fid})`)
            }
          }
        }
        
        // Rate limiting: small delay between requests to avoid hitting limits
        if (processedCount % 50 === 0) {
          console.log(`⏸️ Processed ${processedCount} accounts, taking brief pause to avoid rate limits...`)
          await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second pause every 50 requests
        }
        
      } catch (error) {
        if (error instanceof Error && error.message?.includes('429')) {
          rateLimitHits++
          console.warn(`⚠️ Rate limit hit for ${followedUser.username} (${rateLimitHits} total). Continuing...`)
          // Add longer delay on rate limit
          await new Promise(resolve => setTimeout(resolve, 2000))
        } else {
          console.warn(`⚠️ Failed to get mutuals for ${followedUser.username}:`, error)
        }
        // Continue with other users
      }
    }

    console.log(`🎯 Found ${mutualCandidates.size} potential recommendations from ${processedCount} analyzed accounts`)
    console.log(`⚠️ Rate limits encountered: ${rateLimitHits} times during analysis`)

    // Step 4: Filter and enhance recommendations (require 2+ mutuals for deep analysis)
    const minMutuals = deepParam ? 2 : 1
    const recommendations: UserWithMutuals[] = Array.from(mutualCandidates.values())
      .filter(user => (user.mutualCount || 0) >= minMutuals)
      .map(user => ({
        ...user,
        score: calculateRecommendationScore(user)
      }))

    console.log(`📊 ${recommendations.length} candidates meet ${minMutuals}+ mutual requirement`)

    // Report on high-mutual discoveries
    const highMutualCount = recommendations.filter(r => (r.mutualCount || 0) >= 50).length
    const veryhighMutualCount = recommendations.filter(r => (r.mutualCount || 0) >= 100).length
    
    if (highMutualCount > 0) {
      console.log(`🔥 DISCOVERY: ${highMutualCount} accounts with 50+ mutual connections found!`)
    }
    if (veryhighMutualCount > 0) {
      console.log(`🚀 BREAKTHROUGH: ${veryhighMutualCount} accounts with 100+ mutual connections found!`)
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