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
  startWarmRecsAnalysis: (fid: string) => Promise<void>
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

  // Basic analysis for one-way follows (automatic on load)
  const startAnalysis = useCallback(async (fid: string) => {
    // Prevent multiple concurrent analyses
    if (analysisState.isAnalyzing) {
      console.log('🔄 Analysis already running, skipping duplicate request')
      return
    }

    // Check cache first for basic analysis (excluding warm recs)
    if (cache.isCacheValid() && (cache.userFid === fid || !cache.userFid)) {
      console.log('🎯 Loading basic analysis from cache')
      setAnalysisData({
        oneWayIn: cache.oneWayIn || [],
        oneWayOut: cache.oneWayOut || [],
        warmRecs: cache.warmRecs || [], // Include cached warm recs if they exist
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

    console.log('🚀 Starting background basic analysis for FID:', fid)
    
    setAnalysisState({
      isAnalyzing: true,
      isComplete: false,
      error: null,
      progress: { step: 'Initializing...', current: 0, total: 3 }
    })

    try {
      // Step 1: Fetch followers using API route with timeout
      setAnalysisState(prev => ({
        ...prev,
        progress: { step: 'Fetching followers...', current: 1, total: 3 }
      }))
      
      const followersController = new AbortController()
      const followersTimeout = setTimeout(() => followersController.abort(), 60000) // 60 second timeout
      
      try {
        const followersResponse = await fetch(`/api/followers?fid=${fid}`, {
          signal: followersController.signal
        })
        clearTimeout(followersTimeout)
        
        if (!followersResponse.ok) {
          throw new Error(`Failed to fetch followers data: ${followersResponse.status} ${followersResponse.statusText}`)
        }
        const followersData = await followersResponse.json()
        
        if (!followersData.success) {
          throw new Error(`Invalid followers response: ${followersData.error || 'Unknown error'}`)
        }
        
        console.log(`✅ Followers fetched: ${followersData.followers?.length || 0} users`)

        // Step 2: Fetch following using API route with timeout
        setAnalysisState(prev => ({
          ...prev,
          progress: { step: 'Fetching following...', current: 2, total: 3 }
        }))
        
        const followingController = new AbortController()
        const followingTimeout = setTimeout(() => followingController.abort(), 60000) // 60 second timeout
        
        try {
          const followingResponse = await fetch(`/api/following?fid=${fid}`, {
            signal: followingController.signal
          })
          clearTimeout(followingTimeout)
          
          if (!followingResponse.ok) {
            throw new Error(`Failed to fetch following data: ${followingResponse.status} ${followingResponse.statusText}`)
          }
          const followingData = await followingResponse.json()
          
          if (!followingData.success) {
            throw new Error(`Invalid following response: ${followingData.error || 'Unknown error'}`)
          }
          
          console.log(`✅ Following fetched: ${followingData.following?.length || 0} users`)

          // Step 3: Calculate basic relationships (one-way follows only)
          setAnalysisState(prev => ({
            ...prev,
            progress: { step: 'Analyzing relationships...', current: 3, total: 3 }
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

          const analysisStats: AnalysisStats = {
            totalFollowing: following.length,
            totalFollowers: followers.length,
            oneWayInCount: oneWayIn.length,
            oneWayOutCount: oneWayOut.length,
            warmRecsCount: 0 // Not calculated in basic analysis
          }

          const completedData = {
            oneWayIn,
            oneWayOut,
            warmRecs: [], // Empty - not calculated in basic analysis
            analysisStats
          }

          // Save basic analysis to cache (warmRecs still empty)
          cache.setCache({
            userFid: fid,
            followers,
            following,
            oneWayIn,
            oneWayOut,
            warmRecs: [], // Empty for basic analysis
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

          console.log('✅ Basic analysis complete:', {
            oneWayIn: oneWayIn.length,
            oneWayOut: oneWayOut.length,
            warmRecs: 0
          })

        } catch (followingError: unknown) {
          clearTimeout(followingTimeout)
          if (followingError instanceof Error && followingError.name === 'AbortError') {
            throw new Error('Following data request timed out after 60 seconds. Please try again.')
          }
          throw followingError
        }

      } catch (followersError: unknown) {
        clearTimeout(followersTimeout)
        if (followersError instanceof Error && followersError.name === 'AbortError') {
          throw new Error('Followers data request timed out after 60 seconds. Please try again.')
        }
        throw followersError
      }

    } catch (error) {
      console.error('❌ Basic analysis failed:', error)
      setAnalysisState({
        isAnalyzing: false,
        isComplete: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
        progress: null
      })
    }
  }, [cache])

  // Separate warm recommendations analysis (manual trigger only)
  const startWarmRecsAnalysis = useCallback(async (fid: string) => {
    console.log('🌟 Starting warm recommendations analysis for FID:', fid)
    
    // Start with initial progress
    setAnalysisState({
      isAnalyzing: true,
      isComplete: false,
      error: null,
      progress: { step: 'Initializing warm connections analysis...', current: 0, total: 100 }
    })

    // Create a progressive loading experience
    const progressInterval = setInterval(() => {
      setAnalysisState(prev => {
        if (!prev.isAnalyzing || !prev.progress) return prev
        
        const newCurrent = Math.min(prev.progress.current + 1, 90) // Cap at 90% until complete
        let step = 'Analyzing warm connections...'
        
        if (newCurrent < 30) {
          step = 'Analyzing your network graph...'
        } else if (newCurrent < 60) {
          step = 'Finding mutual connections...'
        } else if (newCurrent < 85) {
          step = 'Calculating recommendation scores...'
        } else {
          step = 'Finalizing recommendations...'
        }
        
        return {
          ...prev,
          progress: { ...prev.progress, step, current: newCurrent }
        }
      })
    }, 2000) // Update every 2 seconds

    try {
      const response = await fetch(`/api/recs?fid=${fid}&limit=50&debug=true&deep=true`)
      
      // Clear the interval
      clearInterval(progressInterval)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch warm recommendations: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to get recommendations')
      }

      const warmRecs = data.recommendations || []
      
      // Show completion
      setAnalysisState({
        isAnalyzing: true,
        isComplete: false,
        error: null,
        progress: { step: 'Analysis complete!', current: 100, total: 100 }
      })
      
      // Brief delay to show completion, then finish
      setTimeout(() => {
        // Update analysis data with warm recs
        setAnalysisData(prev => ({
          ...prev,
          warmRecs,
          analysisStats: {
            ...prev.analysisStats,
            warmRecsCount: warmRecs.length,
          } as AnalysisStats
        }))

        // Update cache with warm recs
        cache.setCache({
          userFid: fid,
          followers: cache.followers,
          following: cache.following,
          oneWayIn: cache.oneWayIn,
          oneWayOut: cache.oneWayOut,
          warmRecs,
          analysisStats: {
            totalFollowing: cache.analysisStats?.totalFollowing || 0,
            totalFollowers: cache.analysisStats?.totalFollowers || 0,
            oneWayInCount: cache.analysisStats?.oneWayInCount || 0,
            oneWayOutCount: cache.analysisStats?.oneWayOutCount || 0,
            warmRecsCount: warmRecs.length
          }
        })
        
        setAnalysisState({
          isAnalyzing: false,
          isComplete: true,
          error: null,
          progress: null
        })

        console.log('✅ Warm recommendations analysis complete:', warmRecs.length)
      }, 500)

    } catch (error) {
      clearInterval(progressInterval)
      console.error('❌ Warm recommendations analysis failed:', error)
      setAnalysisState({
        isAnalyzing: false,
        isComplete: false,
        error: error instanceof Error ? error.message : 'Warm recommendations analysis failed',
        progress: null
      })
    }
  }, [cache])

  const getAnalysisData = useCallback(() => {
    return analysisData
  }, [analysisData])

  // Auto-start BASIC analysis only when frame is ready and we have a user FID
  useEffect(() => {
    if (isFrameReady && userFid && !analysisState.isAnalyzing && !analysisState.isComplete) {
      startAnalysis(userFid)
    }
  }, [isFrameReady, userFid, analysisState.isAnalyzing, analysisState.isComplete, startAnalysis])

  return (
    <AnalysisContext.Provider value={{
      analysisState,
      startAnalysis,
      startWarmRecsAnalysis,
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