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
            className="bg-orange-400/10 border border-orange-400 text-orange-400 px-4 py-2 rounded text-sm hover:bg-orange-400/20 hover:shadow-orange-400/30 transition-all duration-200"
            onClick={() => onUnfollowUser?.(fid)}
            aria-label={`Unfollow ${displayName}`}
          >
            Unfollow
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
    
    // Sort by follower count (highest first) to show most influential accounts at top
    return oneWayOutUsers.sort((a, b) => b.followerCount - a.followerCount)
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
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 tracking-wider">
            → People You Follow
          </h1>
          <p className="text-green-300 text-lg">
            But don't follow you back
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
                <span className="text-orange-400">One-Way Out:</span>
                <div className="text-orange-400 font-bold">{analysisStats.oneWayOutCount.toLocaleString()}</div>
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
              Finding accounts you follow who don't follow back
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="text-red-400 text-lg mb-2">⚠️ Error</div>
            <div className="text-red-300">{error}</div>
            <button
              onClick={() => analyzeOneWayOut(userFid)}
              className="mt-4 bg-red-900 hover:bg-red-800 text-red-400 px-4 py-2 rounded-md border border-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && oneWayOut.length > 0 && (
          <>
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold text-green-400 mb-2">
                👤 {oneWayOut.length} accounts you follow but don't follow back
              </h2>
              <p className="text-green-600">
                Consider unfollowing or wait to see if they follow back
              </p>
              <p className="text-green-500 text-sm mt-1">
                📊 Sorted by follower count (most influential first)
              </p>
            </div>
            
            <div className="space-y-0">
              {oneWayOut.map((user) => (
                <OneWayOutCard
                  key={user.fid}
                  user={user}
                  onUnfollowUser={handleUnfollowUser}
                />
              ))}
            </div>
          </>
        )}

        {/* No Results */}
        {!loading && !error && oneWayOut.length === 0 && analysisStats && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">
              No one-way following found
            </div>
            <div className="text-gray-500 text-sm">
              All accounts you follow also follow you back!
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 