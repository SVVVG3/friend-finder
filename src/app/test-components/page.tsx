'use client'

import React, { useState } from 'react'
import WarmRecsList from '../../../components/WarmRecsList'
import { UserWithMutuals } from '../../../utils/sort'

// Sample test data
const sampleRecommendations: UserWithMutuals[] = [
  {
    fid: 1,
    username: 'alice.eth',
    displayName: 'Alice Cooper',
    followerCount: 15000,
    followingCount: 800,
    mutualCount: 12,
    score: 1245.2,
    pfpUrl: 'https://avatar.vercel.sh/alice',
    bio: 'Building the future of social networks. Love crypto, DeFi, and connecting amazing people. Always down for good conversations! 🚀'
  },
  {
    fid: 2,
    username: 'bob_dev',
    displayName: 'Bob The Builder',
    followerCount: 8500,
    followingCount: 400,
    mutualCount: 8,
    score: 845.7,
    bio: 'Full-stack developer passionate about Web3 and decentralized systems.'
  },
  {
    fid: 3,
    username: 'charlie',
    displayName: 'Charlie',
    followerCount: 25000,
    followingCount: 1200,
    mutualCount: 15,
    score: 1534.8,
    pfpUrl: 'https://avatar.vercel.sh/charlie'
  },
  {
    fid: 4,
    username: 'diana_crypto',
    displayName: 'Diana Moon',
    followerCount: 5200,
    followingCount: 300,
    mutualCount: 6,
    score: 628.4
  },
  {
    fid: 5,
    username: 'eve',
    displayName: 'Eve 🌟',
    followerCount: 12000,
    followingCount: 600,
    mutualCount: 10,
    score: 1041.1,
    bio: 'NFT artist and community builder. Creating beautiful digital art and meaningful connections.'
  }
]

export default function TestComponentsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmpty, setShowEmpty] = useState(false)

  const toggleLoading = () => {
    setLoading(!loading)
    setError(null)
    setShowEmpty(false)
  }

  const toggleError = () => {
    setError(error ? null : 'Failed to load recommendations. Network error.')
    setLoading(false)
    setShowEmpty(false)
  }

  const toggleEmpty = () => {
    setShowEmpty(!showEmpty)
    setLoading(false)
    setError(null)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000', 
      padding: '20px',
      fontFamily: 'Monaco, Menlo, monospace'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        color: '#00ff00'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          textShadow: '0 0 20px rgba(0, 255, 0, 0.5)'
        }}>
          🧪 WarmRecsList Component Test
        </h1>

        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          justifyContent: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={toggleLoading}
            style={{
              background: loading ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 255, 0, 0.1)',
              border: '1px solid #00ff00',
              color: '#00ff00',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            {loading ? '✅ Loading ON' : '⏳ Test Loading'}
          </button>

          <button 
            onClick={toggleError}
            style={{
              background: error ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 0, 0.1)',
              border: '1px solid #00ff00',
              color: '#00ff00',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            {error ? '❌ Error ON' : '🚨 Test Error'}
          </button>

          <button 
            onClick={toggleEmpty}
            style={{
              background: showEmpty ? 'rgba(255, 255, 0, 0.2)' : 'rgba(0, 255, 0, 0.1)',
              border: '1px solid #00ff00',
              color: '#00ff00',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            {showEmpty ? '📭 Empty ON' : '📋 Test Empty'}
          </button>
        </div>

        <WarmRecsList
          recommendations={showEmpty ? [] : sampleRecommendations}
          loading={loading}
          error={error || undefined}
        />

        <div style={{ 
          marginTop: '40px', 
          padding: '20px',
          background: 'rgba(0, 255, 0, 0.05)',
          border: '1px solid #00ff00',
          borderRadius: '8px'
        }}>
          <h3>Component Features ✅</h3>
          <ul style={{ paddingLeft: '20px' }}>
            <li>✅ Displays recommendation cards with CRT theme</li>
            <li>✅ Shows profile avatars with fallback initials</li>
            <li>✅ Displays mutual connections, followers, and following counts</li>
            <li>✅ Shows recommendation scores</li>
            <li>✅ Includes bio text with truncation</li>
            <li>✅ Follow button navigates to user profiles</li>
            <li>✅ Loading state with skeleton animations</li>
            <li>✅ Error state with styled message</li>
            <li>✅ Empty state with helpful message</li>
            <li>✅ Responsive design for mobile</li>
            <li>✅ Scrollable container for long lists</li>
            <li>✅ Green CRT terminal theme</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 