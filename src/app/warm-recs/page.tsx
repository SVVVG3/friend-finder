'use client'

import React, { useState, useEffect } from 'react'
import WarmRecsList from '../../../components/WarmRecsList'
import { UserWithMutuals } from '../../../utils/sort'
import { 
  CRTSpinner, 
  NetworkAnalysisLoader, 
  CRTErrorState, 
  LoadingButton,
  CRTEmptyState 
} from '../../../components/LoadingStates'

export default function Home() {
  const [recommendations, setRecommendations] = useState<UserWithMutuals[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userFid, setUserFid] = useState<number>(466111) // Your FID
  const [isDeepAnalysis, setIsDeepAnalysis] = useState(false)
  const [analysisStats, setAnalysisStats] = useState<any>(null)
  const [loadingStage, setLoadingStage] = useState('Initializing...')
  const [loadingProgress, setLoadingProgress] = useState(0)

  const fetchRecommendations = async (fid: number, deep: boolean = false) => {
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
        setIsDeepAnalysis(deep)
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
  }

  // Load recommendations on mount
  useEffect(() => {
    fetchRecommendations(userFid)
  }, [userFid])

  const handleFidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFid = parseInt(e.target.value) || 466111
    setUserFid(newFid)
  }

  const handleFidSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchRecommendations(userFid, isDeepAnalysis)
  }

  const handleDeepAnalysis = () => {
    fetchRecommendations(userFid, true)
  }

  const handleStandardAnalysis = () => {
    fetchRecommendations(userFid, false)
  }

  const handleRetry = () => {
    fetchRecommendations(userFid, isDeepAnalysis)
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

        {/* FID Input - Mobile Optimized */}
        <form onSubmit={handleFidSubmit} className="mb-6 w-full">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 px-2 w-full">
            <label htmlFor="fid" className="text-green-300 text-sm sm:text-base text-center sm:text-left shrink-0">
              Enter FID:
            </label>
            <div className="flex gap-2 w-full max-w-sm sm:max-w-none sm:w-auto">
              <input
                type="number"
                id="fid"
                value={userFid}
                onChange={handleFidChange}
                className="bg-black border border-green-600 text-green-400 px-3 py-3 sm:py-2 rounded-md flex-1 sm:w-28 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 text-base sm:text-sm min-h-[44px] min-w-0 crt-border-glow"
                placeholder="Your FID"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={loading}
              />
              <LoadingButton
                type="submit"
                loading={loading}
                disabled={loading}
                className="bg-green-900 hover:bg-green-800 disabled:bg-gray-800 text-green-400 px-3 sm:px-4 py-3 sm:py-2 rounded-md border border-green-600 transition-colors whitespace-nowrap min-h-[44px] text-xs sm:text-base shrink-0 crt-glow hover:crt-glow-strong"
              >
                Analyze
              </LoadingButton>
            </div>
          </div>
        </form>

        {/* Analysis Mode Controls - Mobile Optimized */}
        <div className="mb-6 text-center px-2 w-full">
          <div className="inline-flex gap-1 sm:gap-2 bg-gray-900 p-1 rounded-lg border border-green-600 w-full max-w-md sm:max-w-none sm:w-auto crt-glow">
            <LoadingButton
              onClick={handleStandardAnalysis}
              loading={loading}
              disabled={loading}
              className={`px-3 sm:px-4 py-2 sm:py-2 rounded-md transition-colors text-xs sm:text-sm flex-1 sm:flex-none min-h-[44px] whitespace-nowrap ${
                !isDeepAnalysis && !loading
                  ? 'bg-green-900 text-green-400 border border-green-600 crt-glow'
                  : 'text-green-600 hover:text-green-400'
              }`}
            >
              Standard<span className="hidden sm:inline"> Analysis</span>
            </LoadingButton>
            <LoadingButton
              onClick={handleDeepAnalysis}
              loading={loading}
              disabled={loading}
              className={`px-3 sm:px-4 py-2 sm:py-2 rounded-md transition-colors text-xs sm:text-sm flex-1 sm:flex-none min-h-[44px] whitespace-nowrap ${
                isDeepAnalysis && !loading
                  ? 'bg-green-900 text-green-400 border border-green-600 crt-glow'
                  : 'text-green-600 hover:text-green-400'
              }`}
            >
              🚀 Deep<span className="hidden sm:inline"> Analysis</span>
            </LoadingButton>
          </div>
          <p className="text-xs text-green-600 mt-2 max-w-sm sm:max-w-none mx-auto leading-relaxed">
            {isDeepAnalysis 
              ? 'Deep: Analyzes ALL accounts with 1000+ followers for comprehensive results'
              : 'Standard: Analyzes accounts with 500+ followers for quick results (30-60s)'
            }
          </p>
        </div>

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
                
                {/* Show more button if we hit the limit */}
                {recommendations.length >= 50 && !isDeepAnalysis && (
                  <div className="text-center mt-6">
                    <LoadingButton
                      onClick={handleDeepAnalysis}
                      loading={loading}
                      className="bg-green-900 hover:bg-green-800 text-green-400 px-6 py-3 rounded-lg border border-green-600 transition-colors font-bold crt-glow hover:crt-glow-strong"
                    >
                      🚀 Find More with Deep Analysis
                    </LoadingButton>
                    <p className="text-xs text-green-600 mt-2">
                      Analyze your full network for stronger connections
                    </p>
                  </div>
                )}
              </>
            ) : (
              <CRTEmptyState
                icon="🤖"
                title="No Warm Recommendations Found"
                message="Try following more people or use Deep Analysis for more thorough search"
                action={isDeepAnalysis ? undefined : handleDeepAnalysis}
                actionLabel={isDeepAnalysis ? undefined : "🚀 Try Deep Analysis"}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
