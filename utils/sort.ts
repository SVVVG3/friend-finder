import { FarcasterUser } from '../lib/farcaster'

// Extended user interface for recommendation data
export interface UserWithMutuals extends FarcasterUser {
  mutualCount?: number
  mutualConnections?: FarcasterUser[]
  score?: number
}

// Sort direction types
export type SortDirection = 'asc' | 'desc'

/**
 * Sort users by number of mutual connections (descending by default)
 */
export function sortByMutuals(
  users: UserWithMutuals[], 
  direction: SortDirection = 'desc'
): UserWithMutuals[] {
  return [...users].sort((a, b) => {
    const aMutuals = a.mutualCount || (a.mutualConnections?.length || 0)
    const bMutuals = b.mutualCount || (b.mutualConnections?.length || 0)
    
    const comparison = aMutuals - bMutuals
    return direction === 'desc' ? -comparison : comparison
  })
}

/**
 * Sort users by follower count (descending by default)
 */
export function sortByFollowerCount(
  users: FarcasterUser[], 
  direction: SortDirection = 'desc'
): FarcasterUser[] {
  return [...users].sort((a, b) => {
    const comparison = a.followerCount - b.followerCount
    return direction === 'desc' ? -comparison : comparison
  })
}

/**
 * Sort users by following count (descending by default)
 */
export function sortByFollowingCount(
  users: FarcasterUser[], 
  direction: SortDirection = 'desc'
): FarcasterUser[] {
  return [...users].sort((a, b) => {
    const comparison = a.followingCount - b.followingCount
    return direction === 'desc' ? -comparison : comparison
  })
}

/**
 * Sort users by username alphabetically (ascending by default)
 */
export function sortByUsername(
  users: FarcasterUser[], 
  direction: SortDirection = 'asc'
): FarcasterUser[] {
  return [...users].sort((a, b) => {
    const comparison = a.username.localeCompare(b.username, undefined, { 
      sensitivity: 'base' 
    })
    return direction === 'desc' ? -comparison : comparison
  })
}

/**
 * Sort users by display name alphabetically (ascending by default)
 */
export function sortByDisplayName(
  users: FarcasterUser[], 
  direction: SortDirection = 'asc'
): FarcasterUser[] {
  return [...users].sort((a, b) => {
    const comparison = a.displayName.localeCompare(b.displayName, undefined, { 
      sensitivity: 'base' 
    })
    return direction === 'desc' ? -comparison : comparison
  })
}

/**
 * Composite sort for warm recommendations
 * Prioritizes users with more mutual connections and higher follower counts
 */
export function sortWarmRecommendations(
  users: UserWithMutuals[]
): UserWithMutuals[] {
  return [...users].sort((a, b) => {
    const aMutuals = a.mutualCount || (a.mutualConnections?.length || 0)
    const bMutuals = b.mutualCount || (b.mutualConnections?.length || 0)
    
    // Primary sort: by mutual connections (more mutuals = higher priority)
    if (aMutuals !== bMutuals) {
      return bMutuals - aMutuals
    }
    
    // Secondary sort: by follower count (higher followers = higher priority)
    if (a.followerCount !== b.followerCount) {
      return b.followerCount - a.followerCount
    }
    
    // Tertiary sort: by username for consistent ordering
    return a.username.localeCompare(b.username, undefined, { 
      sensitivity: 'base' 
    })
  })
}

/**
 * Calculate a recommendation score based on multiple factors
 */
export function calculateRecommendationScore(user: UserWithMutuals): number {
  const mutuals = user.mutualCount || (user.mutualConnections?.length || 0)
  const followers = user.followerCount || 0
  
  // Weighted scoring:
  // - Mutual connections: 100 points each (most important)
  // - Follower count: logarithmic scaling to prevent follower count dominance
  const mutualScore = mutuals * 100
  const followerScore = followers > 0 ? Math.log10(followers) * 10 : 0
  
  return mutualScore + followerScore
}

/**
 * Sort users by calculated recommendation score (descending)
 */
export function sortByRecommendationScore(
  users: UserWithMutuals[]
): UserWithMutuals[] {
  return [...users]
    .map(user => ({
      ...user,
      score: calculateRecommendationScore(user)
    }))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
}

/**
 * Multi-criteria sorting with custom weights
 */
export interface SortCriteria {
  mutualWeight?: number
  followerWeight?: number
  followingWeight?: number
}

export function sortByMultipleCriteria(
  users: UserWithMutuals[],
  criteria: SortCriteria = { mutualWeight: 1, followerWeight: 0.1, followingWeight: 0.05 }
): UserWithMutuals[] {
  return [...users]
    .map(user => {
      const mutuals = user.mutualCount || (user.mutualConnections?.length || 0)
      const score = 
        (mutuals * (criteria.mutualWeight || 1)) +
        (user.followerCount * (criteria.followerWeight || 0.1)) +
        (user.followingCount * (criteria.followingWeight || 0.05))
      
      return { ...user, score }
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0))
}

/**
 * Utility to get top N users from a sorted array
 */
export function getTopUsers<T extends FarcasterUser>(
  users: T[], 
  count: number
): T[] {
  return users.slice(0, Math.max(0, count))
}

/**
 * Utility to shuffle array (for randomizing equal-scored users)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
} 