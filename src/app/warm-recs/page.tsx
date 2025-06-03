'use client'

import React, { useState, useEffect } from 'react'
import WarmRecsList from '../../../components/WarmRecsList'
import { UserWithMutuals } from '../../../utils/sort'
import { 
  NetworkAnalysisLoader, 
  CRTErrorState, 
  CRTEmptyState
} from '../../../components/LoadingStates'
import { useCache } from '../../components/CacheProvider'
import { useFrame } from '../../components/FrameProvider'

export default function Home() {
  const [recommendations, setRecommendations] = useState<UserWithMutuals[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisStats, setAnalysisStats] = useState<{
    totalRecommendations: number
    processingTime: number
    processingTimeMs: number
    analyzedAccounts?: number
    totalFollowing?: number
    totalCandidates?: number
    deepAnalysis?: boolean
    minMutuals?: number
  } | null>(null)
  const [loadingStage, setLoadingStage] = useState('Initializing...')
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Get cache functions and frame state
  const cache = useCache()
  const { isFrameReady, userFid } = useFrame()

  // Add component mount debugging
  useEffect(() => {
    console.log('🎯 Home component mounted successfully')
    console.log('🎯 React rendering working')
  }, [])

  // Check cache and load cached data if available
  const loadFromCacheIfValid = React.useCallback(() => {
    if (cache.isCacheValid() && (cache.userFid === userFid || !cache.userFid)) {
      console.log('🔄 Loading warm recs from cache - valid data found')
      
      // Use cached data
      setRecommendations(cache.warmRecs)
      // Use complete stats from cache if available
      if (cache.analysisStats) {
        setAnalysisStats({
          totalRecommendations: cache.warmRecs.length,
          processingTime: 0,
          processingTimeMs: 0,
          totalFollowing: cache.analysisStats.totalFollowing || 0,
          analyzedAccounts: cache.analysisStats.totalFollowing || 0,
          totalCandidates: cache.warmRecs.length,
          deepAnalysis: true,
          minMutuals: 2
        })
      }
      
      return true // Cache was used
    }
    return false // No valid cache
  }, [cache, userFid])

  const fetchRecommendations = React.useCallback(async (fid: number, deep: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      setAnalysisStats(null)
      setLoadingProgress(0)
      setLoadingStage('Initializing analysis...')
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev < 90) return prev + Math.random() * 15
          return prev
        })
      }, 1000)

      // Update stage messages
      setTimeout(() => setLoadingStage('Fetching your network...'), 500)
      setTimeout(() => setLoadingStage('Analyzing connections...'), 2000)
      setTimeout(() => setLoadingStage('Calculating recommendations...'), 4000)
      
      const deepParam = deep ? '&deep=true' : ''
      const response = await fetch(`/api/recs?fid=${fid}&limit=50&debug=true${deepParam}`)
      
      clearInterval(progressInterval)
      setLoadingProgress(100)
      setLoadingStage('Finalizing results...')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setRecommendations(data.recommendations || [])
        setAnalysisStats(data.debug)
        
        // Store warm recommendations in cache
        if (data.recommendations && data.recommendations.length > 0) {
          cache.setCache({
            userFid: fid.toString(),
            warmRecs: data.recommendations,
            analysisStats: {
              totalFollowing: data.debug?.totalFollowing || 0,
              totalFollowers: 0, // Not available from this API
              warmRecsCount: data.recommendations.length
            }
          })
          console.log('💾 Warm recommendations cached for future navigation')
        }
        
      } else {
        throw new Error(data.message || 'Failed to get recommendations')
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setRecommendations([])
    } finally {
      setLoading(false)
      setLoadingProgress(0)
      setLoadingStage('Initializing...')
    }
  }, [cache])

  // Load data when frame is ready and we have a user FID
  useEffect(() => {
    if (!isFrameReady) {
      console.log('⏳ Waiting for frame ready before loading data...')
      return
    }
    
    console.log('📊 Frame is ready, now loading data...')
    
    // Try cache first, then fetch if needed
    if (userFid && userFid.trim() !== '') {
      if (!loadFromCacheIfValid()) {
        fetchRecommendations(parseInt(userFid), true) // Always use deep analysis
      }
    } else {
      fetchRecommendations(parseInt(userFid) || 0, true) // Always use deep analysis
    }
  }, [isFrameReady, userFid, fetchRecommendations, loadFromCacheIfValid])

  const handleDeepAnalysis = () => {
    if (userFid) fetchRecommendations(parseInt(userFid), true)
  }

  const handleRetry = () => {
    if (userFid) {
      // Clear cache and retry
      cache.setCache({ lastAnalyzed: 0 })
      fetchRecommendations(parseInt(userFid), true) // Always use deep analysis
    }
  }

  // Show loading if frame is not ready
  if (!isFrameReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NetworkAnalysisLoader 
          stage="Initializing Farcaster frame..."
          progress={0}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-3 sm:p-4 w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 w-full pt-4 sm:pt-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 tracking-wider crt-text-glow">
            🔍 FRIEND FINDER
          </h1>
          <p className="text-green-300 text-base sm:text-lg">
            Discover warm connections in your Farcaster network
          </p>
          <div className="border-t border-green-600 mt-4 w-24 sm:w-32 mx-auto crt-glow"></div>
        </div>

        {/* Analyze Button - Clean UI */}
        {!loading && !error && recommendations.length === 0 && (
          <div className="mb-6 text-center px-2 w-full">
            <button
              onClick={handleDeepAnalysis}
              disabled={loading}
              className="bg-green-900 hover:bg-green-800 disabled:bg-gray-800 text-green-400 px-6 py-4 rounded-lg border border-green-600 transition-colors font-bold text-lg crt-glow hover:crt-glow-strong"
            >
              🚀 Analyze My Recommendations
            </button>
            <p className="text-green-600 text-sm mt-3 max-w-md mx-auto leading-relaxed">
              Deep analysis of your network to find warm connections through mutual follows. 
              <br />
              <strong>Takes 2-3 minutes</strong> for comprehensive results.
            </p>
          </div>
        )}

        {/* Analysis Stats - Mobile Responsive */}
        {analysisStats && !loading && (
          <div className="mb-6 p-3 sm:p-4 bg-gray-900 border border-green-600 rounded-lg mx-2 sm:mx-0 w-full max-w-full overflow-x-hidden crt-glow">
            <h3 className="text-green-400 font-bold mb-3 text-center sm:text-left text-sm sm:text-base crt-text-glow">📊 Analysis Results</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm w-full">
              <div className="text-center sm:text-left">
                <span className="text-green-600 block sm:inline">Total Following:</span>
                <div className="text-green-400 font-bold text-sm sm:text-base">{analysisStats.totalFollowing?.toLocaleString()}</div>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-green-600 block sm:inline">Analyzed:</span>
                <div className="text-green-400 font-bold text-sm sm:text-base">{analysisStats.analyzedAccounts}</div>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-green-600 block sm:inline">Candidates:</span>
                <div className="text-green-400 font-bold text-sm sm:text-base">{analysisStats.totalCandidates?.toLocaleString()}</div>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-green-600 block sm:inline">Processing:</span>
                <div className="text-green-400 font-bold text-sm sm:text-base">{(analysisStats.processingTimeMs / 1000).toFixed(1)}s</div>
              </div>
            </div>
            {analysisStats.deepAnalysis && (
              <div className="mt-2 text-xs text-green-600 text-center sm:text-left">
                🚀 Deep analysis: {analysisStats.minMutuals}+ mutual connections required
              </div>
            )}
          </div>
        )}

        {/* Enhanced Loading State */}
        {loading && (
          <NetworkAnalysisLoader
            stage={loadingStage}
            progress={loadingProgress}
            className="mb-6"
          />
        )}

        {/* Enhanced Error State */}
        {error && !loading && (
          <CRTErrorState
            title="Analysis Failed"
            message={error}
            onRetry={handleRetry}
            retryLabel="Try Again"
            className="mb-6"
          />
        )}

        {/* Recommendations */}
        {!loading && !error && (
          <>
            {recommendations.length > 0 ? (
              <>
                <div className="mb-4 text-center">
                  <h2 className="text-2xl font-bold text-green-400 mb-2 crt-text-glow">
                    🌟 {recommendations.length} Warm Recommendations
                  </h2>
                  <p className="text-green-600">
                    People with mutual connections in your network
                  </p>
                </div>
                <WarmRecsList recommendations={recommendations} />
              </>
            ) : (
              <CRTEmptyState
                icon="🤖"
                title="No Warm Recommendations Found"
                message="Try following more people or use Deep Analysis for more thorough search"
                action={handleRetry}
                actionLabel="🚀 Try Again"
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
