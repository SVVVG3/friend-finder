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

// Individual user card component for one-way in
function OneWayInCard({ 
  user, 
  onFollowUser
}: { 
  user: FarcasterUser
  onFollowUser?: (fid: number) => void
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
    <div className="bg-black border border-green-400 rounded-lg p-4 mb-4 font-mono shadow-lg hover:shadow-green-400/20 hover:bg-green-400/5 transition-all duration-200 transform hover:-translate-y-0.5">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0">
          {pfpUrl && !imageError ? (
            <Image 
              src={pfpUrl} 
              alt={`${displayName} avatar`}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full border border-green-400"
              onError={() => setImageError(true)}
              unoptimized={true}
              priority={false}
            />
          ) : (
            <div className="w-12 h-12 rounded-full border border-green-400 bg-green-400/10 flex items-center justify-center text-green-400 font-bold text-lg">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h4 className="text-green-400 font-bold text-base mb-1">{displayName}</h4>
          <p className="text-green-300 text-sm mb-1">@{username}</p>
        </div>

        <div className="flex-shrink-0">
          <button 
            className="bg-green-400/10 border border-green-400 text-green-400 px-4 py-2 rounded text-sm hover:bg-green-400/20 hover:shadow-green-400/30 transition-all duration-200"
            onClick={() => onFollowUser?.(fid)}
            aria-label={`Follow ${displayName}`}
          >
            Follow Back
          </button>
        </div>
      </div>

      {bio && (
        <div className="mb-3 p-2 bg-green-400/5 rounded border-l-2 border-green-600">
          <p className="text-green-300 text-sm leading-relaxed">
            {bio.length > 100 ? `${bio.substring(0, 100)}...` : bio}
          </p>
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex flex-col">
          <span className="text-green-600 text-xs mb-1">Followers:</span>
          <span className="text-green-400 font-bold text-sm">{followerCount.toLocaleString()}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-green-600 text-xs mb-1">Following:</span>
          <span className="text-green-400 font-bold text-sm">{followingCount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

export default function OneWayInPage() {
  const [oneWayIn, setOneWayIn] = useState<FarcasterUser[]>([])
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
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 tracking-wider">
            ← People Who Follow You
          </h1>
          <p className="text-green-300 text-lg">
            But you don't follow back
          </p>
          <p className="text-green-600 text-sm mt-2 italic">
            📊 Fetches ALL followers and following for complete analysis
          </p>
          <div className="border-t border-green-600 mt-4 w-32 mx-auto"></div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex justify-center items-center gap-4">
            <label htmlFor="fid" className="text-green-300">
              Enter Farcaster FID:
            </label>
            <input
              id="fid"
              type="number"
              value={userFid}
              onChange={(e) => setUserFid(e.target.value)}
              placeholder="e.g. 3621"
              className="bg-black border border-green-600 text-green-400 px-3 py-2 rounded-md w-32 focus:outline-none focus:border-green-400"
              disabled={loading}
              min="1"
              required
            />
            <button 
              type="submit" 
              disabled={loading || !userFid.trim()}
              className="bg-green-900 hover:bg-green-800 disabled:bg-gray-800 text-green-400 px-4 py-2 rounded-md border border-green-600 transition-colors"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </form>

        {/* Analysis Stats */}
        {analysisStats && (
          <div className="mb-6 p-4 bg-gray-900 border border-green-600 rounded-lg">
            <h3 className="text-green-400 font-bold mb-2">📊 Analysis Results</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-green-600">You Follow:</span>
                <div className="text-green-400 font-bold">{analysisStats.totalFollowing.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-green-600">Follow You:</span>
                <div className="text-green-400 font-bold">{analysisStats.totalFollowers.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-blue-400">One-Way In:</span>
                <div className="text-blue-400 font-bold">{analysisStats.oneWayInCount.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mb-4"></div>
            <div className="text-green-400 text-lg">
              🔍 Analyzing one-way relationships...
            </div>
            <div className="text-green-600 text-sm mt-2">
              Finding accounts who follow you but you don't follow back
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="text-red-400 text-lg mb-2">⚠️ Error</div>
            <div className="text-red-300">{error}</div>
            <button
              onClick={() => analyzeOneWayIn(userFid)}
              className="mt-4 bg-red-900 hover:bg-red-800 text-red-400 px-4 py-2 rounded-md border border-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && oneWayIn.length > 0 && (
          <>
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold text-green-400 mb-2">
                🌟 {oneWayIn.length} accounts who follow you but you don't follow back
              </h2>
              <p className="text-green-600">
                Great opportunities to grow your network with interested followers
              </p>
            </div>
            
            <div className="space-y-0">
              {oneWayIn.map((user) => (
                <OneWayInCard
                  key={user.fid}
                  user={user}
                  onFollowUser={handleFollowUser}
                />
              ))}
            </div>
          </>
        )}

        {/* No Results */}
        {!loading && !error && oneWayIn.length === 0 && analysisStats && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">
              No one-way followers found
            </div>
            <div className="text-gray-500 text-sm">
              All your followers are accounts you already follow back!
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 