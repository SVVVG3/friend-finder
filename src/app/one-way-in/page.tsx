'use client'

import React, { useState } from 'react'
import OneWayList, { OneWayUser } from '../../../components/OneWayList'

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  followerCount: number
  followingCount: number
  pfpUrl?: string
  bio?: string
}

export default function OneWayInPage() {
  const [oneWayIn, setOneWayIn] = useState<OneWayUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userFid, setUserFid] = useState<string>('')
  const [analysisStats, setAnalysisStats] = useState<{
    totalFollowing: number
    totalFollowers: number
    oneWayInCount: number
  } | null>(null)

  // Calculate one-way IN relationships only
  const calculateOneWayIn = (
    following: FarcasterUser[], 
    followers: FarcasterUser[]
  ) => {
    const followingFids = new Set(following.map(u => u.fid))
    // One-way in: People who follow you but you don't follow back
    const oneWayInUsers = followers.filter(user => !followingFids.has(user.fid))
    return oneWayInUsers
  }

  // Analyze one-way IN relationships
  const analyzeOneWayIn = async (fid: string) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log(`🔍 Starting one-way IN analysis for FID: ${fid}`)
      
      // Fetch both followers and following in parallel
      const [followingResponse, followersResponse] = await Promise.all([
        fetch(`/api/following?fid=${fid}`),
        fetch(`/api/followers?fid=${fid}`)
      ])

      if (!followingResponse.ok) {
        throw new Error(`Failed to fetch following: ${followingResponse.statusText}`)
      }
      
      if (!followersResponse.ok) {
        throw new Error(`Failed to fetch followers: ${followersResponse.statusText}`)
      }

      const followingData = await followingResponse.json()
      const followersData = await followersResponse.json()

      if (!followingData.success) {
        throw new Error(followingData.error || 'Failed to fetch following')
      }
      
      if (!followersData.success) {
        throw new Error(followersData.error || 'Failed to fetch followers')
      }

      console.log(`📊 Fetched ${followingData.following.length} following, ${followersData.followers.length} followers`)

      // Calculate one-way IN relationships
      const oneWayInUsers = calculateOneWayIn(
        followingData.following,
        followersData.followers
      )

      console.log(`🔄 One-way IN analysis results: ${oneWayInUsers.length} accounts`)

      setOneWayIn(oneWayInUsers)
      setAnalysisStats({
        totalFollowing: followingData.following.length,
        totalFollowers: followersData.followers.length,
        oneWayInCount: oneWayInUsers.length
      })

    } catch (err) {
      console.error('❌ One-way IN analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze one-way relationships')
    } finally {
      setLoading(false)
    }
  }

  // Handle follow action (placeholder)
  const handleFollowUser = async (fid: number) => {
    console.log(`🔗 Follow user with FID: ${fid}`)
    alert(`Follow functionality would be implemented here for FID: ${fid}`)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userFid.trim()) {
      analyzeOneWayIn(userFid.trim())
    }
  }

  return (
    <div className="one-way-page">
      <div className="container">
        {/* Header */}
        <header className="header">
          <h1 className="title">← People Who Follow You (But You Don't Follow Back)</h1>
          <p className="subtitle">
            Discover potential connections who already follow you
          </p>
          <p className="api-note">
            📊 Fetches ALL followers and following for complete analysis
          </p>
        </header>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-group">
            <label htmlFor="fid" className="input-label">
              Enter Farcaster FID:
            </label>
            <div className="input-row">
              <input
                id="fid"
                type="number"
                value={userFid}
                onChange={(e) => setUserFid(e.target.value)}
                placeholder="e.g. 3621"
                className="fid-input"
                disabled={loading}
                min="1"
                required
              />
              <button 
                type="submit" 
                disabled={loading || !userFid.trim()}
                className="analyze-btn"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
        </form>

        {/* Analysis Stats */}
        {analysisStats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{analysisStats.totalFollowing.toLocaleString()}</div>
              <div className="stat-label">You Follow</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{analysisStats.totalFollowers.toLocaleString()}</div>
              <div className="stat-label">Follow You</div>
            </div>
            <div className="stat-card highlighted">
              <div className="stat-value">{analysisStats.oneWayInCount.toLocaleString()}</div>
              <div className="stat-label">One-Way In</div>
            </div>
          </div>
        )}

        {/* Results - Only show one-way IN */}
        <div className="results-section">
          {oneWayIn.length > 0 && (
            <div className="results-header">
              <h2>🌟 {oneWayIn.length} accounts who follow you but you don't follow back</h2>
              <p className="results-subtitle">Great opportunities to grow your network with interested followers</p>
            </div>
          )}
          
          <OneWayList
            oneWayOut={[]} // Empty for this page
            oneWayIn={oneWayIn}
            loading={loading}
            error={error || undefined}
            onFollowUser={handleFollowUser}
            className="one-way-results"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="spinner"></div>
              <p>Analyzing one-way relationships...</p>
              <p className="loading-detail">Finding accounts who follow you but you don't follow back</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .one-way-page {
          min-height: 100vh;
          background: #000000;
          color: #00ff00;
          font-family: 'Monaco', 'Menlo', monospace;
          padding: 20px;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 1px solid #00aa00;
        }

        .title {
          font-size: 24px;
          margin: 0 0 8px 0;
          color: #00ff00;
          text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }

        .subtitle {
          font-size: 14px;
          color: #00cc00;
          margin: 0;
          line-height: 1.4;
        }

        .api-note {
          font-size: 12px;
          color: #00aa00;
          margin: 8px 0 0 0;
          font-style: italic;
        }

        .input-form {
          margin-bottom: 32px;
        }

        .input-group {
          max-width: 500px;
          margin: 0 auto;
        }

        .input-label {
          display: block;
          color: #00ff00;
          font-size: 14px;
          margin-bottom: 8px;
          font-weight: bold;
        }

        .input-row {
          display: flex;
          gap: 12px;
        }

        .fid-input {
          flex: 1;
          background: rgba(0, 255, 0, 0.05);
          border: 1px solid #00aa00;
          border-radius: 4px;
          padding: 12px 16px;
          color: #00ff00;
          font-family: inherit;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .fid-input:focus {
          outline: none;
          border-color: #00ff00;
          background: rgba(0, 255, 0, 0.1);
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
        }

        .fid-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .fid-input::placeholder {
          color: #00aa00;
        }

        .analyze-btn {
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid #00ff00;
          color: #00ff00;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .analyze-btn:hover:not(:disabled) {
          background: rgba(0, 255, 0, 0.2);
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
          transform: translateY(-1px);
        }

        .analyze-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        .stat-card {
          background: rgba(0, 255, 0, 0.03);
          border: 1px solid #00aa00;
          border-radius: 6px;
          padding: 16px;
          text-align: center;
          transition: all 0.2s ease;
        }

        .stat-card.highlighted {
          background: rgba(0, 150, 255, 0.05);
          border-color: #0096ff;
        }

        .stat-card:hover {
          background: rgba(0, 255, 0, 0.06);
          box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
        }

        .stat-card.highlighted:hover {
          background: rgba(0, 150, 255, 0.08);
          box-shadow: 0 0 8px rgba(0, 150, 255, 0.3);
        }

        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #00ff00;
          margin-bottom: 4px;
        }

        .stat-card.highlighted .stat-value {
          color: #0096ff;
        }

        .stat-label {
          font-size: 12px;
          color: #00aa00;
        }

        .results-section {
          margin-top: 32px;
        }

        .results-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .results-header h2 {
          color: #00ff00;
          font-size: 18px;
          margin: 0 0 8px 0;
        }

        .results-subtitle {
          color: #00aa00;
          font-size: 12px;
          margin: 0;
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .loading-content {
          text-align: center;
          background: rgba(0, 255, 0, 0.05);
          border: 1px solid #00aa00;
          border-radius: 8px;
          padding: 32px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 2px solid #00aa00;
          border-top: 2px solid #00ff00;
          border-radius: 50%;
          margin: 0 auto 16px auto;
          animation: spin 1s linear infinite;
        }

        .loading-content p {
          color: #00ff00;
          margin: 8px 0;
          font-size: 14px;
        }

        .loading-detail {
          color: #00cc00 !important;
          font-size: 12px !important;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .one-way-page {
            padding: 16px;
          }

          .title {
            font-size: 20px;
          }

          .input-row {
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 12px;
          }

          .stat-card {
            padding: 12px;
          }

          .stat-value {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  )
} 