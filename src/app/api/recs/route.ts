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
    const limitParam = searchParams.get('limit') || '10'
    const debugParam = searchParams.get('debug') === 'true'
    
    if (!fidParam) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: fid',
        message: 'Please provide a user FID to get recommendations for'
      }, { status: 400 })
    }

    const userFid = parseInt(fidParam)
    const limit = Math.min(parseInt(limitParam), 50) // Cap at 50 recommendations
    
    if (isNaN(userFid) || userFid <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid FID',
        message: 'FID must be a positive integer'
      }, { status: 400 })
    }

    console.log(`🎯 Generating recommendations for FID ${userFid} (limit: ${limit})`)

    // Step 1: Get user's following list (people they already follow)
    console.log('📋 Fetching user following list...')
    const userFollowing = await getFollowing(userFid, 100) // Get first 100 follows
    
    if (userFollowing.data.length === 0) {
      return NextResponse.json({
        success: true,
        userFid,
        totalRecommendations: 0,
        recommendations: [],
        processingTime: Date.now() - startTime,
        message: 'User has no following connections to base recommendations on'
      })
    }

    console.log(`✅ Found ${userFollowing.data.length} users that FID ${userFid} follows`)

    // Step 2: For each person the user follows, find people who also follow them (2nd degree connections)
    console.log('🔍 Finding mutual connections for recommendations...')
    
    const mutualCandidates = new Map<number, UserWithMutuals>()
    const userFollowsFids = new Set(userFollowing.data.map(u => u.fid))
    
    // Process each followed user to find their followers (potential recommendations)
    for (const followedUser of userFollowing.data.slice(0, 20)) { // Limit to first 20 for performance
      try {
        console.log(`🔗 Checking mutuals for ${followedUser.username} (FID ${followedUser.fid})`)
        
        // Get followers of this person (people who also follow them = potential recommendations)
        const followers = await getFollowers(followedUser.fid, 50) // Get their followers for mutual connections
        
        console.log(`📊 Found ${followers.data.length} followers for ${followedUser.username}`)
        
        for (const potentialRec of followers.data) {
          // Debug logging
          if (!potentialRec.fid || potentialRec.fid === 0) {
            console.warn(`⚠️ Invalid FID for potential recommendation:`, potentialRec)
            continue
          }
          
          // Skip if this is the original user or someone they already follow
          if (potentialRec.fid === userFid || userFollowsFids.has(potentialRec.fid)) {
            console.log(`⏭️ Skipping ${potentialRec.username} (FID ${potentialRec.fid}) - ${potentialRec.fid === userFid ? 'is original user' : 'already following'}`)
            continue
          }

          // Add or update mutual count for this potential recommendation
          if (mutualCandidates.has(potentialRec.fid)) {
            const existing = mutualCandidates.get(potentialRec.fid)!
            existing.mutualCount = (existing.mutualCount || 0) + 1
            console.log(`➕ Updated mutual count for ${potentialRec.username}: ${existing.mutualCount}`)
          } else {
            mutualCandidates.set(potentialRec.fid, {
              ...potentialRec,
              mutualCount: 1
            })
            console.log(`✨ New recommendation candidate: ${potentialRec.username} (FID ${potentialRec.fid})`)
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to get mutuals for ${followedUser.username}:`, error)
        // Continue with other users
      }
    }

    console.log(`🎯 Found ${mutualCandidates.size} potential recommendations`)

    // Step 3: Filter and enhance recommendations
    const recommendations: UserWithMutuals[] = Array.from(mutualCandidates.values())
      .filter(user => (user.mutualCount || 0) >= 1) // Require at least 1 mutual connection for demo
      .map(user => ({
        ...user,
        score: calculateRecommendationScore(user)
      }))

    // Step 4: Sort recommendations using our sorting utilities
    console.log('📊 Sorting recommendations...')
    const sortedRecommendations = sortWarmRecommendations(recommendations)
    
    // Step 5: Get top N recommendations
    const topRecommendations = getTopUsers(sortedRecommendations, limit)

    // Enhanced profile data for recommendations
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

    console.log(`✅ Generated ${enrichedRecommendations.length} recommendations in ${totalTime}ms`)

    return NextResponse.json({
      success: true,
      recommendations: enrichedRecommendations,
      ...(debugParam && {
        debug: {
          userFid: userFid,
          totalFollowing: userFollowing.data.length,
          totalCandidates: mutualCandidates.size,
          filteredCandidates: recommendations.length,
          processingTimeMs: totalTime,
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