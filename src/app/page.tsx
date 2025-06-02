'use client'

import React, { useState, useEffect } from 'react'
import WarmRecsList from '../../components/WarmRecsList'
import { UserWithMutuals } from '../../utils/sort'

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
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 tracking-wider">
            🔍 FRIEND FINDER
          </h1>
          <p className="text-green-300 text-lg">
            Discover warm connections in your Farcaster network
          </p>
          <div className="border-t border-green-600 mt-4 w-32 mx-auto"></div>
        </div>

        {/* FID Input */}
        <form onSubmit={handleFidSubmit} className="mb-6">
          <div className="flex justify-center items-center gap-4">
            <label htmlFor="fid" className="text-green-300">
              Enter FID:
            </label>
            <input
              type="number"
              id="fid"
              value={userFid}
              onChange={handleFidChange}
              className="bg-black border border-green-600 text-green-400 px-3 py-2 rounded-md w-32 focus:outline-none focus:border-green-400"
              placeholder="Your FID"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-green-900 hover:bg-green-800 disabled:bg-gray-800 text-green-400 px-4 py-2 rounded-md border border-green-600 transition-colors"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </form>

        {/* Analysis Mode Controls */}
        <div className="mb-6 text-center">
          <div className="inline-flex gap-2 bg-gray-900 p-1 rounded-lg border border-green-600">
            <button
              onClick={handleStandardAnalysis}
              disabled={loading}
              className={`px-4 py-2 rounded-md transition-colors ${
                !isDeepAnalysis && !loading
                  ? 'bg-green-900 text-green-400 border border-green-600'
                  : 'text-green-600 hover:text-green-400'
              }`}
            >
              Standard Analysis
            </button>
            <button
              onClick={handleDeepAnalysis}
              disabled={loading}
              className={`px-4 py-2 rounded-md transition-colors ${
                isDeepAnalysis && !loading
                  ? 'bg-green-900 text-green-400 border border-green-600'
                  : 'text-green-600 hover:text-green-400'
              }`}
            >
              🚀 Deep Analysis
            </button>
          </div>
          <p className="text-xs text-green-600 mt-2">
            {isDeepAnalysis 
              ? 'Deep: Analyzes 300+ accounts, finds 8-15+ mutual connections (30-60s)'
              : 'Standard: Analyzes 100 accounts, finds 1+ mutual connections (3-10s)'
            }
          </p>
        </div>

        {/* Analysis Stats */}
        {analysisStats && (
          <div className="mb-6 p-4 bg-gray-900 border border-green-600 rounded-lg">
            <h3 className="text-green-400 font-bold mb-2">📊 Analysis Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-green-600">Total Following:</span>
                <div className="text-green-400 font-bold">{analysisStats.totalFollowing?.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-green-600">Analyzed:</span>
                <div className="text-green-400 font-bold">{analysisStats.analyzedAccounts}</div>
              </div>
              <div>
                <span className="text-green-600">Candidates:</span>
                <div className="text-green-400 font-bold">{analysisStats.totalCandidates?.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-green-600">Processing:</span>
                <div className="text-green-400 font-bold">{(analysisStats.processingTimeMs / 1000).toFixed(1)}s</div>
              </div>
            </div>
            {analysisStats.deepAnalysis && (
              <div className="mt-2 text-xs text-green-600">
                🚀 Deep analysis: {analysisStats.minMutuals}+ mutual connections required
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mb-4"></div>
            <div className="text-green-400 text-lg">
              {isDeepAnalysis ? '🚀 Running deep network analysis...' : '🔍 Analyzing your network...'}
            </div>
            <div className="text-green-600 text-sm mt-2">
              {isDeepAnalysis 
                ? 'Analyzing 200 high-potential accounts (~1-2 minutes)'
                : 'Analyzing 75 high-potential accounts (~30-45 seconds)'
              }
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="text-red-400 text-lg mb-2">❌ Error</div>
            <div className="text-red-300">{error}</div>
            <button
              onClick={() => fetchRecommendations(userFid, isDeepAnalysis)}
              className="mt-4 bg-red-900 hover:bg-red-800 text-red-400 px-4 py-2 rounded-md border border-red-600 transition-colors"
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
