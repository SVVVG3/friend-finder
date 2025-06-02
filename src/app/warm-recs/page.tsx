'use client'

import React, { useState, useEffect } from 'react'
import WarmRecsList from '../../../components/WarmRecsList'
import { UserWithMutuals } from '../../../utils/sort'

export default function Home() {
  const [recommendations, setRecommendations] = useState<UserWithMutuals[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userFid, setUserFid] = useState<number>(466111) // Your FID
  const [isDeepAnalysis, setIsDeepAnalysis] = useState(false)
  const [analysisStats, setAnalysisStats] = useState<any>(null)

  const fetchRecommendations = async (fid: number, deep: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      setAnalysisStats(null)
      
      const deepParam = deep ? '&deep=true' : ''
      const response = await fetch(`/api/recs?fid=${fid}&limit=50&debug=true${deepParam}`)
      
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

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-3 sm:p-4 w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 w-full">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 tracking-wider">
            🔍 FRIEND FINDER
          </h1>
          <p className="text-green-300 text-base sm:text-lg">
            Discover warm connections in your Farcaster network
          </p>
          <div className="border-t border-green-600 mt-4 w-24 sm:w-32 mx-auto"></div>
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
                className="bg-black border border-green-600 text-green-400 px-3 py-3 sm:py-2 rounded-md flex-1 sm:w-28 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 text-base sm:text-sm min-h-[44px] min-w-0"
                placeholder="Your FID"
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-green-900 hover:bg-green-800 disabled:bg-gray-800 text-green-400 px-3 sm:px-4 py-3 sm:py-2 rounded-md border border-green-600 transition-colors whitespace-nowrap min-h-[44px] text-xs sm:text-base shrink-0"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
        </form>

        {/* Analysis Mode Controls - Mobile Optimized */}
        <div className="mb-6 text-center px-2 w-full">
          <div className="inline-flex gap-1 sm:gap-2 bg-gray-900 p-1 rounded-lg border border-green-600 w-full max-w-md sm:max-w-none sm:w-auto">
            <button
              onClick={handleStandardAnalysis}
              disabled={loading}
              className={`px-3 sm:px-4 py-2 sm:py-2 rounded-md transition-colors text-xs sm:text-sm flex-1 sm:flex-none min-h-[44px] whitespace-nowrap ${
                !isDeepAnalysis && !loading
                  ? 'bg-green-900 text-green-400 border border-green-600'
                  : 'text-green-600 hover:text-green-400'
              }`}
            >
              Standard<span className="hidden sm:inline"> Analysis</span>
            </button>
            <button
              onClick={handleDeepAnalysis}
              disabled={loading}
              className={`px-3 sm:px-4 py-2 sm:py-2 rounded-md transition-colors text-xs sm:text-sm flex-1 sm:flex-none min-h-[44px] whitespace-nowrap ${
                isDeepAnalysis && !loading
                  ? 'bg-green-900 text-green-400 border border-green-600'
                  : 'text-green-600 hover:text-green-400'
              }`}
            >
              🚀 Deep<span className="hidden sm:inline"> Analysis</span>
            </button>
          </div>
          <p className="text-xs text-green-600 mt-2 max-w-sm sm:max-w-none mx-auto leading-relaxed">
            {isDeepAnalysis 
              ? 'Deep: Analyzes ALL accounts with 1000+ followers for comprehensive results'
              : 'Standard: Analyzes accounts with 500+ followers for quick results (30-60s)'
            }
          </p>
        </div>

        {/* Analysis Stats - Mobile Responsive */}
        {analysisStats && (
          <div className="mb-6 p-3 sm:p-4 bg-gray-900 border border-green-600 rounded-lg mx-2 sm:mx-0 w-full max-w-full overflow-x-hidden">
            <h3 className="text-green-400 font-bold mb-3 text-center sm:text-left text-sm sm:text-base">📊 Analysis Results</h3>
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

        {/* Loading State - Mobile Optimized */}
        {loading && (
          <div className="text-center py-8 sm:py-12 px-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 sm:h-12 sm:w-12 border-b-2 border-green-400 mb-4"></div>
            <div className="text-green-400 text-base sm:text-lg font-bold">
              {isDeepAnalysis ? '🚀 Running deep network analysis...' : '🔍 Analyzing your network...'}
            </div>
            <div className="text-green-600 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
              {isDeepAnalysis 
                ? 'Analyzing ALL accounts with 1000+ followers with smart rate limiting'
                : 'Analyzing 150 accounts with 500+ followers with smart rate limiting (~30-60 seconds)'
              }
            </div>
          </div>
        )}

        {/* Error State - Mobile Optimized */}
        {error && (
          <div className="text-center py-8 px-4">
            <div className="text-red-400 text-lg sm:text-xl mb-2">❌ Error</div>
            <div className="text-red-300 text-sm sm:text-base mb-4 max-w-sm mx-auto leading-relaxed">{error}</div>
            <button
              onClick={() => fetchRecommendations(userFid, isDeepAnalysis)}
              className="bg-red-900 hover:bg-red-800 text-red-400 px-4 py-3 sm:py-2 rounded-md border border-red-600 transition-colors min-h-[44px] text-sm sm:text-base"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Recommendations */}
        {!loading && !error && (
          <>
            {recommendations.length > 0 ? (
              <>
                <div className="mb-4 text-center">
                  <h2 className="text-2xl font-bold text-green-400 mb-2">
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
                    <button
                      onClick={handleDeepAnalysis}
                      className="bg-green-900 hover:bg-green-800 text-green-400 px-6 py-3 rounded-lg border border-green-600 transition-colors font-bold"
                    >
                      🚀 Find More with Deep Analysis
                    </button>
                    <p className="text-xs text-green-600 mt-2">
                      Analyze your full network for stronger connections
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">
                  No recommendations found
                </div>
                <div className="text-gray-500 text-sm">
                  Try adjusting your FID or use Deep Analysis for more thorough search
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
