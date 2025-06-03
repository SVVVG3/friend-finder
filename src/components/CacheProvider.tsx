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

// Cache context type
interface CacheContextType {
  userFid: string
  followers: FarcasterUser[]
  following: FarcasterUser[]
  oneWayIn: FarcasterUser[]
  oneWayOut: FarcasterUser[]
  warmRecs: UserWithMutuals[]
  analysisStats: any
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
    return cacheAge < maxAge && Boolean(cache.userFid)
  }

  const contextValue: CacheContextType = {
    userFid: cache.userFid || '',
    followers: cache.followers || [],
    following: cache.following || [],
    oneWayIn: cache.oneWayIn || [],
    oneWayOut: cache.oneWayOut || [],
    warmRecs: cache.warmRecs || [],
    analysisStats: cache.analysisStats,
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