import { neynar } from './neynar'

// Types for better type safety
export interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  followerCount: number
  followingCount: number
  pfpUrl?: string
  bio?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
}

// Helper function to safely extract user data
function extractUserData(user: unknown): FarcasterUser {
  const userData = user as Record<string, unknown>
  
  // Handle both direct user object and nested user object (from follow responses)
  const userObj = userData.user as Record<string, unknown> || userData
  
  return {
    fid: (userObj.fid as number) || 0,
    username: (userObj.username as string) || '',
    displayName: (userObj.display_name as string) || (userObj.displayName as string) || (userObj.username as string) || '',
    followerCount: (userObj.follower_count as number) || (userObj.followerCount as number) || 0,
    followingCount: (userObj.following_count as number) || (userObj.followingCount as number) || 0,
    pfpUrl: (userObj.pfp_url as string) || (userObj.pfpUrl as string) || undefined,
    bio: ((userObj.profile as Record<string, unknown>)?.bio as Record<string, unknown>)?.text as string || (userObj.bio as string) || undefined
  }
}

/**
 * Get followers for a user
 */
export async function getFollowers(
  fid: number, 
  limit: number = 25, 
  cursor?: string
): Promise<PaginatedResponse<FarcasterUser>> {
  try {
    const response = await neynar.fetchUserFollowers({ 
      fid, 
      limit, 
      cursor 
    })

    const followers = response.users.map(user => extractUserData(user))

    return {
      data: followers,
      nextCursor: response.next?.cursor || undefined,
      hasMore: !!response.next?.cursor
    }
  } catch (error) {
    console.error('Error fetching followers:', error)
    throw new Error(`Failed to fetch followers for FID ${fid}`)
  }
}

/**
 * Get following for a user
 */
export async function getFollowing(
  fid: number, 
  limit: number = 25, 
  cursor?: string
): Promise<PaginatedResponse<FarcasterUser>> {
  try {
    const response = await neynar.fetchUserFollowing({ 
      fid, 
      limit, 
      cursor 
    })

    const following = response.users.map(user => extractUserData(user))

    return {
      data: following,
      nextCursor: response.next?.cursor || undefined,
      hasMore: !!response.next?.cursor
    }
  } catch (error) {
    console.error('Error fetching following:', error)
    throw new Error(`Failed to fetch following for FID ${fid}`)
  }
}

/**
 * Get user profile by FID
 */
export async function getUserProfile(fid: number): Promise<FarcasterUser> {
  try {
    const response = await neynar.fetchBulkUsers({ fids: [fid] })
    
    if (!response.users || response.users.length === 0) {
      throw new Error(`User with FID ${fid} not found`)
    }

    return extractUserData(response.users[0])
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw new Error(`Failed to fetch profile for FID ${fid}`)
  }
}

/**
 * Get mutual connections between two users
 */
export async function getMutualConnections(
  userFid: number, 
  targetFid: number
): Promise<FarcasterUser[]> {
  try {
    // Get following lists for both users
    const [userFollowing, targetFollowing] = await Promise.all([
      getFollowing(userFid, 150), // Get more for better mutual detection
      getFollowing(targetFid, 150)
    ])

    // Find mutual connections (people both users follow)
    const userFollowingFids = new Set(userFollowing.data.map(u => u.fid))
    const mutuals = targetFollowing.data.filter(user => 
      userFollowingFids.has(user.fid)
    )

    return mutuals
  } catch (error) {
    console.error('Error finding mutual connections:', error)
    throw new Error(`Failed to find mutual connections between ${userFid} and ${targetFid}`)
  }
} 