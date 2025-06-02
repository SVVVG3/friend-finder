'use client'

import React, { useState, useEffect } from 'react'
import WarmRecsList from '../../components/WarmRecsList'
import { UserWithMutuals } from '../../utils/sort'

export default function Home() {
  const [recommendations, setRecommendations] = useState<UserWithMutuals[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userFid, setUserFid] = useState<number>(3) // Default to Dan Romero for demo

  const fetchRecommendations = async (fid: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/recs?fid=${fid}&debug=true`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.status}`)
      }
      
      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (err) {
      console.error('Error fetching recommendations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations(userFid)
  }, [userFid])

  const handleFollowUser = (fid: number) => {
    // For now, just show an alert - we'll integrate with Farcaster later
    alert(`Following user with FID: ${fid}`)
  }

  const handleFidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFid = parseInt(e.target.value)
    if (!isNaN(newFid) && newFid > 0) {
      setUserFid(newFid)
    }
  }

  return (
    <div className="app-container">
      <div className="app-content">
        <header className="app-header">
          <h1 className="app-title">
            🔍 Friend Finder
          </h1>
          <p className="app-subtitle">
            Discover warm connections through your Farcaster network
          </p>
          
          <div className="fid-input-section">
            <label htmlFor="fid-input" className="fid-label">
              Enter Farcaster ID (FID):
            </label>
            <input
              id="fid-input"
              type="number"
              value={userFid}
              onChange={handleFidChange}
              placeholder="e.g. 3"
              className="fid-input"
              min="1"
            />
            <button
              onClick={() => fetchRecommendations(userFid)}
              className="refresh-btn"
              disabled={loading}
            >
              {loading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </header>

        <main className="app-main">
          <WarmRecsList
            recommendations={recommendations}
            loading={loading}
            error={error || undefined}
            onFollowUser={handleFollowUser}
          />
        </main>

        <footer className="app-footer">
          <p>
            Built with ❤️ using{' '}
            <a href="https://neynar.com" target="_blank" rel="noopener noreferrer">
              Neynar API
            </a>
            {' '}and{' '}
            <a href="https://farcaster.xyz" target="_blank" rel="noopener noreferrer">
              Farcaster
            </a>
          </p>
        </footer>
      </div>

      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background: #000;
          color: #00ff00;
          font-family: 'Monaco', 'Menlo', monospace;
          padding: 20px;
        }

        .app-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .app-header {
          text-align: center;
          margin-bottom: 40px;
          padding: 20px;
          border: 1px solid #00ff00;
          border-radius: 8px;
          background: rgba(0, 255, 0, 0.05);
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
        }

        .app-title {
          font-size: 32px;
          margin: 0 0 8px 0;
          text-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
          animation: glow 2s ease-in-out infinite alternate;
        }

        .app-subtitle {
          font-size: 16px;
          color: #00cc00;
          margin: 0 0 24px 0;
          opacity: 0.9;
        }

        .fid-input-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        .fid-label {
          color: #00aa00;
          font-size: 14px;
        }

        .fid-input {
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid #00ff00;
          color: #00ff00;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: inherit;
          font-size: 16px;
          text-align: center;
          width: 200px;
        }

        .fid-input:focus {
          outline: none;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }

        .fid-input::placeholder {
          color: #00aa00;
          opacity: 0.7;
        }

        .refresh-btn {
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid #00ff00;
          color: #00ff00;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          transition: all 0.2s ease;
          min-width: 120px;
        }

        .refresh-btn:hover:not(:disabled) {
          background: rgba(0, 255, 0, 0.2);
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }

        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .app-main {
          margin-bottom: 40px;
        }

        .app-footer {
          text-align: center;
          padding: 20px;
          border-top: 1px solid #00ff00;
          color: #00aa00;
          font-size: 14px;
        }

        .app-footer a {
          color: #00ff00;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .app-footer a:hover {
          color: #00ffff;
          text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
        }

        @keyframes glow {
          from {
            text-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
          }
          to {
            text-shadow: 0 0 20px rgba(0, 255, 0, 1), 0 0 30px rgba(0, 255, 0, 0.5);
          }
        }

        @media (max-width: 768px) {
          .app-container {
            padding: 10px;
          }
          
          .app-title {
            font-size: 24px;
          }
          
          .fid-input-section {
            flex-direction: column;
            gap: 8px;
          }
          
          .fid-input {
            width: 100%;
            max-width: 200px;
          }
        }
      `}</style>
    </div>
  )
}
