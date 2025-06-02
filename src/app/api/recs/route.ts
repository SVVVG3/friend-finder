import { NextRequest, NextResponse } from 'next/server'
import { getFollowing } from '../../../../lib/farcaster'
import { profileCache } from '../../../../utils/profileCache'
import { 
  sortWarmRecommendations, 
  getTopUsers, 
  UserWithMutuals,
  calculateRecommendationScore 
} from '../../../../utils/sort'

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
    const allFollowing: Array<{
      fid: number
      username: string
      displayName: string
      followerCount: number
      followingCount: number
      pfpUrl?: string
      bio?: string
    }> = []
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

    // Step 2: SMART account selection based on follower quality
    // Focus on accounts with meaningful follower counts for better mutual discovery
    let analysisSelection: Array<{
      fid: number
      username: string
      displayName: string
      followerCount: number
      followingCount: number
      pfpUrl?: string
      bio?: string
    }>
    
    if (!deepParam) {
      // Standard: Analyze accounts with 500+ followers (faster, broader reach)
      analysisSelection = allFollowing
        .filter(user => user.followerCount >= 500) // Good social accounts
        .sort((a, b) => b.followerCount - a.followerCount) // Sort by follower count
        .slice(0, 150) // Cap at 150 for reasonable speed
    } else {
      // Deep: Analyze ALL accounts with 1000+ followers (comprehensive analysis)
      analysisSelection = allFollowing
        .filter(user => user.followerCount >= 1000) // High-quality accounts only
        .sort((a, b) => b.followerCount - a.followerCount) // Sort by follower count descending
      // NO CAP - analyze all high-quality accounts
    }

    console.log(`🧠 Smart selection: ${analysisSelection.length} high-quality accounts (filtered from ${allFollowing.length})`)
    console.log(`🔍 ${deepParam ? 'DEEP ANALYSIS: ALL accounts with 1000+ followers' : 'STANDARD: Up to 150 accounts with 500+ followers'}`)
    console.log(`⚡ Estimated API calls: ~${analysisSelection.length * 22} (${deepParam ? 'Deep' : 'Standard'} mode)`)
    
    if (deepParam) {
      console.log(`📊 Deep analysis will process ${analysisSelection.length} accounts with 1000+ followers`)
    }

    // Create exclusion set for performance
    const userFollowingSet = new Set(allFollowing.map(user => user.fid))
    console.log(`🛡️ Exclusion filter ready: ${userFollowingSet.size} followed accounts to exclude`)

    // Step 3: SMART RATE LIMITING with exponential backoff
    const mutualCandidates = new Map<number, UserWithMutuals>()
    let processedCount = 0
    let rateLimitHits = 0
    let consecutiveErrors = 0

    console.log(`📦 Processing ${analysisSelection.length} accounts with SMART RATE LIMITING`)

    for (const followedUser of analysisSelection) {
      try {
        processedCount++
        const progress = Math.round((processedCount / analysisSelection.length) * 100)
        
        // Progress reporting every 20 accounts or at milestones
        if (processedCount % 20 === 0 || processedCount === analysisSelection.length) {
          console.log(`🔗 [${progress}%] Progress: ${processedCount}/${analysisSelection.length} accounts processed`)
        }
        
        // RESTORED following limits for quality (was reduced too much)
        let followingLimit = 25 // Restored from 20 (was 30 originally)
        if (followedUser.followerCount > 50000) followingLimit = 30 // Restored from 25 (was 40)
        else if (followedUser.followerCount > 10000) followingLimit = 28 // Restored from 22 (was 35)
        else if (followedUser.followerCount > 5000) followingLimit = 25 // Restored from 20 (was 30)
        
        // CRITICAL FIX: Trust-based discovery (getFollowing not getFollowers)
        const following = await getFollowing(followedUser.fid, followingLimit)
        
        for (const potentialRec of following.data as Array<{
          fid: number
          username: string
          displayName: string
          followerCount: number
          followingCount: number
          pfpUrl?: string
          bio?: string
        }>) {
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
        
        // SMART RATE LIMITING: Progressive delays based on consecutive errors
        consecutiveErrors = 0 // Reset on success
        
        // Base delay every 5 requests to prevent rate limits
        if (processedCount % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 300)) // 300ms every 5 requests
        }
        
        // Longer delay every 25 requests for sustained rate management
        if (processedCount % 25 === 0) {
          console.log(`⏸️ Checkpoint delay at ${processedCount} accounts...`)
          await new Promise(resolve => setTimeout(resolve, 1500)) // 1.5s every 25 accounts
        }
        
      } catch (error) {
        consecutiveErrors++
        
        if (error instanceof Error && error.message.includes('429')) {
          rateLimitHits++
          // EXPONENTIAL BACKOFF for rate limits
          const backoffDelay = Math.min(5000 * Math.pow(2, Math.min(consecutiveErrors - 1, 4)), 30000) // Max 30s
          console.warn(`⚠️ Rate limit hit on ${followedUser.username || followedUser.fid}, backing off for ${backoffDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
        } else {
          console.warn(`⚠️ Failed to process ${followedUser.username || followedUser.fid}:`, error instanceof Error ? error.message : 'Unknown error')
          // Short delay on other errors
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        // Break if too many consecutive errors
        if (consecutiveErrors >= 10) {
          console.warn(`🚨 Too many consecutive errors (${consecutiveErrors}), stopping analysis early`)
          break
        }
      }
    }

    console.log(`🎯 Found ${mutualCandidates.size} potential recommendations from ${processedCount} analyzed accounts`)
    console.log(`⚠️ Rate limits encountered: ${rateLimitHits} times during analysis`)
    console.log(`⚡ Processing completed with smart rate limiting and exponential backoff`)

    // Step 4: Filter and enhance recommendations (smart mutual requirements)
    const minMutuals = deepParam ? 2 : 1
    const recommendations: UserWithMutuals[] = Array.from(mutualCandidates.values())
      .filter(user => (user.mutualCount || 0) >= minMutuals)
      .filter(user => (user.followingCount || 0) >= 100) // Exclude business/project accounts
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