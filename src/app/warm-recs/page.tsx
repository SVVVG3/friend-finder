'use client'

import React, { useState, useEffect } from 'react'
import WarmRecsList from '../../../components/WarmRecsList'
import { 
  NetworkAnalysisLoader, 
  CRTErrorState, 
  CRTEmptyState
} from '../../../components/LoadingStates'
import { useFrame } from '../../components/FrameProvider'
import { useBackgroundAnalysis } from '../../components/BackgroundAnalysisIndicator'

export default function Home() {
  // Get frame state and background analysis data
  const { isFrameReady, userFid } = useFrame()
  const { isAnalyzing, error: analysisError, data, startWarmRecsAnalysis } = useBackgroundAnalysis()
  
  // Track if warm recs analysis has been attempted
  const [warmRecsAttempted, setWarmRecsAttempted] = useState(false)

  // Use background analysis data for warm recs
  const warmRecs = data.warmRecs
  const analysisStats = data.analysisStats

  // Check if we have cached warm recs results on load
  useEffect(() => {
    if (warmRecs.length > 0 || (analysisStats?.warmRecsCount !== undefined && analysisStats.warmRecsCount >= 0)) {
      setWarmRecsAttempted(true)
    }
  }, [warmRecs.length, analysisStats?.warmRecsCount])

  // Manual analysis trigger
  const handleAnalyzeRecommendations = () => {
    if (userFid && startWarmRecsAnalysis) {
      setWarmRecsAttempted(true)
      startWarmRecsAnalysis(userFid)
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

        {/* Analyze Button - Manual Trigger */}
        {!isAnalyzing && warmRecs.length === 0 && (
          <div className="mb-6 text-center px-2 w-full">
            <button
              onClick={handleAnalyzeRecommendations}
              disabled={isAnalyzing || !userFid}
              className="bg-green-900 hover:bg-green-800 disabled:bg-gray-800 text-green-400 px-6 py-4 rounded-lg border border-green-600 transition-colors font-bold text-lg crt-glow hover:crt-glow-strong disabled:opacity-50"
            >
              🚀 Analyze My Recommendations
            </button>
            <p className="text-green-600 text-sm mt-3 max-w-md mx-auto leading-relaxed">
              Takes 2-3 minutes to analyze your network and find warm connection opportunities
            </p>
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="mb-6">
            <NetworkAnalysisLoader
              stage="Analyzing warm connections..."
              progress={0}
              className="mb-4"
            />
          </div>
        )}

        {/* Error State */}
        {analysisError && !isAnalyzing && (
          <CRTErrorState
            title="Analysis Failed"
            message={analysisError}
            onRetry={handleAnalyzeRecommendations}
            retryLabel="Try Again"
            className="mb-6"
          />
        )}

        {/* Results */}
        {!isAnalyzing && !analysisError && warmRecs.length > 0 && (
          <>
            {/* Analysis Stats */}
            {analysisStats && (
              <div className="mb-6 p-3 sm:p-4 bg-gray-900 border border-green-600 rounded-lg mx-2 sm:mx-0 w-full max-w-full overflow-x-hidden crt-glow">
                <h3 className="text-green-400 font-bold mb-3 text-center sm:text-left text-sm sm:text-base crt-text-glow">📊 Analysis Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm w-full">
                  <div className="text-center sm:text-left">
                    <span className="text-green-600 block sm:inline">Network Size:</span>
                    <div className="text-green-400 font-bold text-lg sm:text-base crt-text-glow">{analysisStats.totalFollowing?.toLocaleString() || 0}</div>
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="text-green-600 block sm:inline">Recommendations:</span>
                    <div className="text-green-400 font-bold text-lg sm:text-base crt-text-glow">{warmRecs.length.toLocaleString()}</div>
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="text-green-600 block sm:inline">Quality Score:</span>
                    <div className="text-green-400 font-bold text-lg sm:text-base crt-text-glow">High</div>
                  </div>
                </div>
              </div>
            )}

            <WarmRecsList 
              recommendations={warmRecs}
              loading={false}
              error={undefined}
            />
          </>
        )}

        {/* Empty State - Only show if warm recs analysis was run and found nothing */}
        {!isAnalyzing && !analysisError && warmRecs.length === 0 && analysisStats && analysisStats.warmRecsCount === 0 && warmRecsAttempted && (
          <CRTEmptyState
            icon="🎯"
            title="No Warm Recommendations Found"
            message="Your network analysis is complete, but no strong warm connection opportunities were found at this time."
            className="mb-6"
          />
        )}
      </div>
    </div>
  )
}
