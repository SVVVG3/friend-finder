'use client'

import React, { useState } from 'react'
import Image from 'next/image'

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  followerCount: number
  followingCount: number
  pfpUrl?: string
  bio?: string
}

// Individual user card component for one-way out
function OneWayOutCard({ 
  user, 
  onUnfollowUser
}: { 
  user: FarcasterUser
  onUnfollowUser?: (fid: number) => void
}) {
  const [imageError, setImageError] = useState(false)
  
  const { 
    fid, 
    username, 
    displayName, 
    followerCount, 
    followingCount, 
    pfpUrl,
    bio 
  } = user

  return (
    <div className="user-card">
      <div className="user-header">
        <div className="user-avatar">
          {pfpUrl && !imageError ? (
            <Image 
              src={pfpUrl} 
              alt={`${displayName} avatar`}
              width={40}
              height={40}
              className="avatar-img"
              onError={() => setImageError(true)}
              unoptimized={true}
              priority={false}
            />
          ) : (
            <div className="avatar-placeholder">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="user-info">
          <h4 className="user-name">{displayName}</h4>
          <p className="user-username">@{username}</p>
        </div>

        <div className="user-actions">
          <button 
            className="unfollow-btn"
            onClick={() => onUnfollowUser?.(fid)}
            aria-label={`Unfollow ${displayName}`}
          >
            Unfollow
          </button>
        </div>
      </div>

      {bio && (
        <div className="user-bio">
          <p>{bio.length > 100 ? `${bio.substring(0, 100)}...` : bio}</p>
        </div>
      )}

      <div className="user-stats">
        <div className="stat">
          <span className="stat-value">{followerCount.toLocaleString()}</span>
          <span className="stat-label">followers</span>
        </div>
        <div className="stat">
          <span className="stat-value">{followingCount.toLocaleString()}</span>
          <span className="stat-label">following</span>
        </div>
      </div>
    </div>
  )
}

export default function OneWayOutPage() {
  const [oneWayOut, setOneWayOut] = useState<FarcasterUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userFid, setUserFid] = useState<string>('')
  const [analysisStats, setAnalysisStats] = useState<{
    totalFollowing: number
    totalFollowers: number
    oneWayOutCount: number
  } | null>(null)

  // Calculate one-way OUT relationships only
  const calculateOneWayOut = (
    following: FarcasterUser[], 
    followers: FarcasterUser[]
  ) => {
    const followerFids = new Set(followers.map(u => u.fid))
    // One-way out: People you follow who don't follow you back
    const oneWayOutUsers = following.filter(user => !followerFids.has(user.fid))
    return oneWayOutUsers
  }

  // Analyze one-way OUT relationships
  const analyzeOneWayOut = async (fid: string) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log(`🔍 Starting one-way OUT analysis for FID: ${fid}`)
      
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

      // Calculate one-way OUT relationships
      const oneWayOutUsers = calculateOneWayOut(
        followingData.following,
        followersData.followers
      )

      console.log(`🔄 One-way OUT analysis results: ${oneWayOutUsers.length} accounts`)

      setOneWayOut(oneWayOutUsers)
      setAnalysisStats({
        totalFollowing: followingData.following.length,
        totalFollowers: followersData.followers.length,
        oneWayOutCount: oneWayOutUsers.length
      })

    } catch (err) {
      console.error('❌ One-way OUT analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze one-way relationships')
    } finally {
      setLoading(false)
    }
  }

  // Handle unfollow action (placeholder)
  const handleUnfollowUser = async (fid: number) => {
    console.log(`🔗 Unfollow user with FID: ${fid}`)
    alert(`Unfollow functionality would be implemented here for FID: ${fid}`)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userFid.trim()) {
      analyzeOneWayOut(userFid.trim())
    }
  }

  return (
    <div className="one-way-page">
      <div className="container">
        {/* Header */}
        <header className="header">
          <h1 className="title">→ People You Follow (But Don't Follow Back)</h1>
          <p className="subtitle">
            Discover accounts you follow who haven't followed you back yet
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
              <div className="stat-value">{analysisStats.oneWayOutCount.toLocaleString()}</div>
              <div className="stat-label">One-Way Out</div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {error && (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
          </div>
        )}

        {oneWayOut.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h2>👤 {oneWayOut.length} accounts you follow but don't follow back</h2>
              <p className="results-subtitle">Consider unfollowing or wait to see if they follow back</p>
            </div>
            
            <div className="user-list">
              {oneWayOut.map((user) => (
                <OneWayOutCard
                  key={user.fid}
                  user={user}
                  onUnfollowUser={handleUnfollowUser}
                />
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="spinner"></div>
              <p>Analyzing one-way relationships...</p>
              <p className="loading-detail">Finding accounts you follow who don't follow back</p>
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
          background: rgba(255, 165, 0, 0.05);
          border-color: #ff9500;
        }

        .stat-card:hover {
          background: rgba(0, 255, 0, 0.06);
          box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
        }

        .stat-card.highlighted:hover {
          background: rgba(255, 165, 0, 0.08);
          box-shadow: 0 0 8px rgba(255, 165, 0, 0.3);
        }

        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #00ff00;
          margin-bottom: 4px;
        }

        .stat-card.highlighted .stat-value {
          color: #ff9500;
        }

        .stat-label {
          font-size: 12px;
          color: #00aa00;
        }

        .error-message {
          text-align: center;
          padding: 20px;
          border: 1px solid #ff4444;
          border-radius: 8px;
          background: rgba(255, 68, 68, 0.05);
          margin-bottom: 24px;
        }

        .error-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .error-message p {
          color: #ff4444;
          margin: 0;
          font-size: 14px;
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

        .user-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .user-card {
          background: rgba(0, 255, 0, 0.03);
          border: 1px solid #00aa00;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 12px;
          font-family: 'Monaco', 'Menlo', monospace;
          box-shadow: 0 0 5px rgba(0, 255, 0, 0.1);
          transition: all 0.2s ease;
        }

        .user-card:hover {
          background: rgba(0, 255, 0, 0.06);
          box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
          transform: translateY(-1px);
        }

        .user-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .user-avatar {
          flex-shrink: 0;
        }

        .avatar-img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #00aa00;
        }

        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #00aa00;
          background: rgba(0, 255, 0, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #00aa00;
          font-weight: bold;
          font-size: 14px;
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          color: #00ff00;
          margin: 0 0 2px 0;
          font-size: 14px;
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-username {
          color: #00cc00;
          margin: 0;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-actions {
          flex-shrink: 0;
        }

        .unfollow-btn {
          background: rgba(255, 100, 0, 0.1);
          border: 1px solid #ff6400;
          color: #ff6400;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .unfollow-btn:hover {
          background: rgba(255, 100, 0, 0.2);
          box-shadow: 0 0 5px rgba(255, 100, 0, 0.3);
        }

        .user-bio {
          margin-bottom: 8px;
          padding: 6px 8px;
          background: rgba(0, 255, 0, 0.02);
          border-radius: 4px;
          border-left: 2px solid #00aa00;
        }

        .user-bio p {
          color: #00cc00;
          font-size: 12px;
          margin: 0;
          line-height: 1.3;
        }

        .user-stats {
          display: flex;
          gap: 16px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .stat-value {
          color: #00ff00;
          font-weight: bold;
          font-size: 12px;
        }

        .stat-label {
          color: #00aa00;
          font-size: 10px;
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