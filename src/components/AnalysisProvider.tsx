'use client'
import React, { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react'
import { useFrame } from './FrameProvider'
import { useCache } from './CacheProvider'

// Using the same interface as the pages
interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  followerCount: number
  followingCount: number
  pfpUrl?: string
  bio?: string
}

interface AnalysisStats {
  totalFollowing: number
  totalFollowers: number
  oneWayInCount?: number
  oneWayOutCount?: number
  warmRecsCount?: number
  totalCandidates?: number
}

interface AnalysisState {
  isAnalyzing: boolean
  isComplete: boolean
  error: string | null
  progress: {
    step: string
    current: number
    total: number
  } | null
}

interface AnalysisContextType {
  analysisState: AnalysisState
  startAnalysis: (fid: string) => Promise<void>
  getAnalysisData: () => {
    oneWayIn: FarcasterUser[]
    oneWayOut: FarcasterUser[]
    warmRecs: FarcasterUser[]
    analysisStats: AnalysisStats | null
  }
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const { userFid, isFrameReady } = useFrame()
  const cache = useCache()
  
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isAnalyzing: false,
    isComplete: false,
    error: null,
    progress: null
  })

  // Store current analysis data
  const [analysisData, setAnalysisData] = useState<{
    oneWayIn: FarcasterUser[]
    oneWayOut: FarcasterUser[]
    warmRecs: FarcasterUser[]
    analysisStats: AnalysisStats | null
  }>({
    oneWayIn: [],
    oneWayOut: [],
    warmRecs: [],
    analysisStats: null
  })

  const startAnalysis = useCallback(async (fid: string) => {
    // Prevent multiple concurrent analyses
    if (analysisState.isAnalyzing) {
      console.log('🔄 Analysis already running, skipping duplicate request')
      return
    }

    // Check cache first
    if (cache.isCacheValid() && (cache.userFid === fid || !cache.userFid)) {
      console.log('🎯 Loading complete analysis from cache')
      setAnalysisData({
        oneWayIn: cache.oneWayIn || [],
        oneWayOut: cache.oneWayOut || [],
        warmRecs: cache.warmRecs || [],
        analysisStats: cache.analysisStats || null
      })
      setAnalysisState({
        isAnalyzing: false,
        isComplete: true,
        error: null,
        progress: null
      })
      return
    }

    console.log('🚀 Starting background network analysis for FID:', fid)
    
    setAnalysisState({
      isAnalyzing: true,
      isComplete: false,
      error: null,
      progress: { step: 'Initializing...', current: 0, total: 4 }
    })

    try {
      // Step 1: Fetch followers using API route
      setAnalysisState(prev => ({
        ...prev,
        progress: { step: 'Fetching followers...', current: 1, total: 4 }
      }))
      
      const followersResponse = await fetch(`/api/followers?fid=${fid}`)
      if (!followersResponse.ok) {
        throw new Error('Failed to fetch followers data')
      }
      const followersData = await followersResponse.json()
      
      if (!followersData.success) {
        throw new Error('Invalid followers response from API')
      }

      // Step 2: Fetch following using API route
      setAnalysisState(prev => ({
        ...prev,
        progress: { step: 'Fetching following...', current: 2, total: 4 }
      }))
      
      const followingResponse = await fetch(`/api/following?fid=${fid}`)
      if (!followingResponse.ok) {
        throw new Error('Failed to fetch following data')
      }
      const followingData = await followingResponse.json()
      
      if (!followingData.success) {
        throw new Error('Invalid following response from API')
      }

      // Step 3: Calculate relationships
      setAnalysisState(prev => ({
        ...prev,
        progress: { step: 'Analyzing relationships...', current: 3, total: 4 }
      }))

      const followers: FarcasterUser[] = followersData.followers || []
      const following: FarcasterUser[] = followingData.following || []

      // Create FID sets for efficient lookups
      const followerFids = new Set(followers.map((user: FarcasterUser) => user.fid))
      const followingFids = new Set(following.map((user: FarcasterUser) => user.fid))

      // Calculate one-way relationships
      const oneWayIn = followers
        .filter((user: FarcasterUser) => !followingFids.has(user.fid))
        .sort((a: FarcasterUser, b: FarcasterUser) => b.followerCount - a.followerCount)

      const oneWayOut = following
        .filter((user: FarcasterUser) => !followerFids.has(user.fid))
        .sort((a: FarcasterUser, b: FarcasterUser) => b.followerCount - a.followerCount)

      // Calculate warm recommendations (simplified for now)
      const warmRecs: FarcasterUser[] = []
      
      // For warm recs, we'd need to fetch networks of mutual follows
      // This would be a more complex analysis involving 2nd-degree connections

      // Step 4: Save to cache and state
      setAnalysisState(prev => ({
        ...prev,
        progress: { step: 'Saving results...', current: 4, total: 4 }
      }))

      const analysisStats: AnalysisStats = {
        totalFollowing: following.length,
        totalFollowers: followers.length,
        oneWayInCount: oneWayIn.length,
        oneWayOutCount: oneWayOut.length,
        warmRecsCount: warmRecs.length,
        totalCandidates: oneWayIn.length + oneWayOut.length + warmRecs.length
      }

      const completedData = {
        oneWayIn,
        oneWayOut,
        warmRecs,
        analysisStats
      }

      // Save to cache using existing cache structure
      // Note: warmRecs is empty for now since we're not implementing full warm recs analysis
      cache.setCache({
        userFid: fid,
        followers,
        following,
        oneWayIn,
        oneWayOut,
        warmRecs: [], // Empty array that matches expected UserWithMutuals[] type
        analysisStats
      })

      // Update local state
      setAnalysisData(completedData)
      
      setAnalysisState({
        isAnalyzing: false,
        isComplete: true,
        error: null,
        progress: null
      })

      console.log('✅ Background analysis complete:', {
        oneWayIn: oneWayIn.length,
        oneWayOut: oneWayOut.length,
        warmRecs: warmRecs.length
      })

    } catch (error) {
      console.error('❌ Background analysis failed:', error)
      setAnalysisState({
        isAnalyzing: false,
        isComplete: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
        progress: null
      })
    }
  }, [cache, analysisState.isAnalyzing])

  const getAnalysisData = useCallback(() => {
    return analysisData
  }, [analysisData])

  // Auto-start analysis when frame is ready and we have a user FID
  useEffect(() => {
    if (isFrameReady && userFid && !analysisState.isAnalyzing && !analysisState.isComplete) {
      startAnalysis(userFid)
    }
  }, [isFrameReady, userFid, analysisState.isAnalyzing, analysisState.isComplete, startAnalysis])

  return (
    <AnalysisContext.Provider value={{
      analysisState,
      startAnalysis,
      getAnalysisData
    }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis() {
  const context = useContext(AnalysisContext)
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider')
  }
  return context
} 