'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

// Types for cached data
interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  followerCount: number
  followingCount: number
  pfpUrl?: string
  bio?: string
}

interface UserWithMutuals {
  fid: number
  username: string
  displayName: string
  followerCount: number
  followingCount: number
  pfpUrl?: string
  bio?: string
  mutualConnectionCount: number
  mutualConnections: FarcasterUser[]
}

interface AnalysisStats {
  totalFollowing: number
  totalFollowers: number
  oneWayInCount?: number
  oneWayOutCount?: number
  warmRecsCount?: number
}

// Cache context type
interface CacheContextType {
  userFid: string
  followers: FarcasterUser[]
  following: FarcasterUser[]
  oneWayIn: FarcasterUser[]
  oneWayOut: FarcasterUser[]
  warmRecs: UserWithMutuals[]
  analysisStats: AnalysisStats | null
  lastAnalyzed: number
  setCache: (data: Partial<CacheContextType>) => void
  isCacheValid: () => boolean
}

// Create context
const CacheContext = createContext<CacheContextType | null>(null)

// Cache provider component
export function CacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<Partial<CacheContextType>>({
    lastAnalyzed: 0
  })

  const updateCache = (data: Partial<CacheContextType>) => {
    setCache(prev => ({
      ...prev,
      ...data,
      lastAnalyzed: Date.now()
    }))
  }

  const isCacheValid = (): boolean => {
    const cacheAge = Date.now() - (cache.lastAnalyzed || 0)
    const maxAge = 5 * 60 * 1000 // 5 minutes
    const hasValidTimeAndFid = cacheAge < maxAge && Boolean(cache.userFid)
    
    if (!hasValidTimeAndFid) {
      console.log('🔄 Cache invalid: expired or no FID')
      return false
    }
    
    // Cache is only truly valid if we have meaningful data
    // At minimum, we should have followers and following data
    const hasBasicData = Boolean(cache.followers && cache.followers.length > 0) || 
                        Boolean(cache.following && cache.following.length > 0)
    
    if (!hasBasicData) {
      console.log('🔄 Cache invalid: no meaningful data (empty followers/following)')
    }
    
    return hasBasicData
  }

  const contextValue: CacheContextType = {
    userFid: cache.userFid || '',
    followers: cache.followers || [],
    following: cache.following || [],
    oneWayIn: cache.oneWayIn || [],
    oneWayOut: cache.oneWayOut || [],
    warmRecs: cache.warmRecs || [],
    analysisStats: cache.analysisStats || null,
    lastAnalyzed: cache.lastAnalyzed || 0,
    setCache: updateCache,
    isCacheValid
  }

  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  )
}

// Hook to use cache
export function useCache() {
  const context = useContext(CacheContext)
  if (!context) {
    throw new Error('useCache must be used within CacheProvider')
  }
  return context
} 