'use client'

import React, { useState, useEffect } from 'react'
import OneWayList, { OneWayUser } from '../../../components/OneWayList'
import { sdk } from '@farcaster/frame-sdk'

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  followerCount: number
  followingCount: number
  pfpUrl?: string
  bio?: string
}

export default function OneWayPage() {
  const [oneWayOut, setOneWayOut] = useState<OneWayUser[]>([])
  const [oneWayIn, setOneWayIn] = useState<OneWayUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userFid, setUserFid] = useState<string>('466111')
  const [analysisStats, setAnalysisStats] = useState<{
    totalFollowing: number
    totalFollowers: number
    mutualConnections: number
  } | null>(null)

  // 🚀 HIGHEST PRIORITY: Notify Farcaster frame is ready IMMEDIATELY
  useEffect(() => {
    const initializeFrame = async () => {
      try {
        console.log('🚀 PRIORITY 1: Calling frame ready FIRST')
        await sdk.actions.ready()
        console.log('✅ Frame ready called successfully - splash screen dismissed')
      } catch (error) {
        console.error('❌ Failed to call frame ready:', error)
      }
    }
    
    initializeFrame()
  }, []) // Run once on mount - HIGHEST PRIORITY

  // Calculate one-way relationships
  const calculateOneWayRelationships = (
    following: FarcasterUser[], 
    followers: FarcasterUser[]
  ) => {
    const followingFids = new Set(following.map(u => u.fid))
    const followerFids = new Set(followers.map(u => u.fid))

    // One-way out: People you follow who don't follow you back
    const oneWayOutUsers = following.filter(user => !followerFids.has(user.fid))
    
    // One-way in: People who follow you but you don't follow back
    const oneWayInUsers = followers.filter(user => !followingFids.has(user.fid))

    // Calculate mutual connections
    const mutualCount = following.filter(user => followerFids.has(user.fid)).length

    return {
      oneWayOut: oneWayOutUsers,
      oneWayIn: oneWayInUsers,
      mutualCount
    }
  }

  // Analyze one-way relationships
  const analyzeOneWayRelationships = async (fid: string) => {
    if (!fid || fid.trim() === '') {
      console.log('⚠️ No FID provided, skipping analysis')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      console.log(`🔍 Starting one-way analysis for FID: ${fid}`)
      
      // Fetch both followers and following in parallel
      const [followingResponse, followersResponse] = await Promise.all([
        fetch(`/api/following?fid=${fid.trim()}`),
        fetch(`/api/followers?fid=${fid.trim()}`)
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

      // Calculate one-way relationships
      const analysis = calculateOneWayRelationships(
        followingData.following,
        followersData.followers
      )

      console.log(`🔄 Analysis results:`)
      console.log(`   • One-way out: ${analysis.oneWayOut.length}`)
      console.log(`   • One-way in: ${analysis.oneWayIn.length}`)
      console.log(`   • Mutual connections: ${analysis.mutualCount}`)

      setOneWayOut(analysis.oneWayOut)
      setOneWayIn(analysis.oneWayIn)
      setAnalysisStats({
        totalFollowing: followingData.following.length,
        totalFollowers: followersData.followers.length,
        mutualConnections: analysis.mutualCount
      })

    } catch (err) {
      console.error('❌ One-way analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze one-way relationships')
    } finally {
      setLoading(false)
    }
  }

  // Handle follow action (placeholder - would integrate with Farcaster auth)
  const handleFollowUser = async (fid: number) => {
    console.log(`🔗 Follow user with FID: ${fid}`)
    // TODO: Integrate with Farcaster auth and follow API
    alert(`Follow functionality would be implemented here for FID: ${fid}`)
  }

  // Handle unfollow action (placeholder - would integrate with Farcaster auth)
  const handleUnfollowUser = async (fid: number) => {
    console.log(`🔗 Unfollow user with FID: ${fid}`)
    // TODO: Integrate with Farcaster auth and unfollow API
    alert(`Unfollow functionality would be implemented here for FID: ${fid}`)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userFid.trim()) {
      analyzeOneWayRelationships(userFid.trim())
    }
  }

  return (
    <div className="one-way-page">
      <div className="container">
        {/* Header */}
        <header className="header">
          <h1 className="title">↔️ One-Way Follow Analysis</h1>
          <p className="subtitle">
            Discover asymmetric follow relationships in your Farcaster network
          </p>
          <p className="api-note">
            📊 Fetches ALL followers and following for complete analysis (up to 1000 each)
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
              <div className="stat-label">Following</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{analysisStats.totalFollowers.toLocaleString()}</div>
              <div className="stat-label">Followers</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{analysisStats.mutualConnections.toLocaleString()}</div>
              <div className="stat-label">Mutual</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{oneWayOut.length.toLocaleString()}</div>
              <div className="stat-label">One-Way Out</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{oneWayIn.length.toLocaleString()}</div>
              <div className="stat-label">One-Way In</div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="results-section">
          <OneWayList
            oneWayOut={oneWayOut}
            oneWayIn={oneWayIn}
            loading={loading}
            error={error || undefined}
            onFollowUser={handleFollowUser}
            onUnfollowUser={handleUnfollowUser}
            className="one-way-results"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="spinner"></div>
              <p>Analyzing follow relationships...</p>
              <p className="loading-detail">Fetching complete follower and following data across multiple pages</p>
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
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 1px solid #00aa00;
        }

        .title {
          font-size: 28px;
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
          max-width: 600px;
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

        .stat-card:hover {
          background: rgba(0, 255, 0, 0.06);
          box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
        }

        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #00ff00;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #00aa00;
        }

        .results-section {
          margin-top: 32px;
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
            font-size: 22px;
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