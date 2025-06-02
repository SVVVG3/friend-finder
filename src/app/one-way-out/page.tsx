'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  NetworkAnalysisLoader, 
  CRTErrorState, 
  LoadingButton,
  CRTEmptyState,
  CRTCardSkeleton
} from '../../../components/LoadingStates'
import { notifyFrameReady } from '../../../lib/farcaster-sdk'

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  followerCount: number
  followingCount: number
  bio?: string
  verifiedAddresses?: {
    eth_addresses: string[]
    sol_addresses: string[]
  }
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
    <div className="bg-black border border-green-400 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 font-mono shadow-lg hover:shadow-green-400/20 hover:bg-green-400/5 transition-all duration-200 transform hover:-translate-y-0.5 mx-2 sm:mx-0 w-full max-w-full overflow-x-hidden crt-glow hover:crt-glow-strong">
      <div className="flex items-start gap-2 sm:gap-3 mb-3 w-full">
        <div className="flex-shrink-0">
          {pfpUrl && !imageError ? (
            <Image 
              src={pfpUrl} 
              alt={`${displayName} avatar`}
              width={48}
              height={48}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-green-400 crt-glow"
              onError={() => setImageError(true)}
              unoptimized={true}
              priority={false}
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-green-400 bg-green-400/10 flex items-center justify-center text-green-400 font-bold text-sm sm:text-lg crt-glow">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <h4 className="text-green-400 font-bold text-sm sm:text-base mb-1 truncate crt-text-glow">{displayName}</h4>
          <p className="text-green-300 text-xs sm:text-sm mb-1 truncate">@{username}</p>
        </div>

        <div className="flex-shrink-0">
          <button 
            className="bg-orange-400/10 border border-orange-400 text-orange-400 px-2 sm:px-4 py-2 rounded text-xs sm:text-sm hover:bg-orange-400/20 hover:shadow-orange-400/30 transition-all duration-200 min-h-[44px] whitespace-nowrap crt-border-glow hover:crt-glow-strong"
            onClick={() => onUnfollowUser?.(fid)}
            aria-label={`Unfollow ${displayName}`}
          >
            <span className="hidden sm:inline">Unfollow</span>
            <span className="sm:hidden">Unfollow</span>
          </button>
        </div>
      </div>

      {bio && (
        <div className="mb-3 p-2 sm:p-3 bg-green-400/5 rounded border-l-2 border-green-600 w-full overflow-x-hidden crt-border-glow">
          <p className="text-green-300 text-xs sm:text-sm leading-relaxed break-words">
            <span className="sm:hidden">
              {bio.length > 80 ? `${bio.substring(0, 80)}...` : bio}
            </span>
            <span className="hidden sm:inline">
              {bio.length > 100 ? `${bio.substring(0, 100)}...` : bio}
            </span>
          </p>
        </div>
      )}

      <div className="flex gap-4 sm:gap-6 w-full">
        <div className="flex flex-col flex-1">
          <span className="text-green-600 text-xs mb-1">Followers:</span>
          <span className="text-green-400 font-bold text-xs sm:text-sm crt-text-glow">{followerCount.toLocaleString()}</span>
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-green-600 text-xs mb-1">Following:</span>
          <span className="text-green-400 font-bold text-xs sm:text-sm crt-text-glow">{followingCount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

export default function OneWayOutPage() {
  const [oneWayUsers, setOneWayUsers] = useState<FarcasterUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userFid, setUserFid] = useState<number>(466111)
  const [stats, setStats] = useState<{
    totalFollowers: number
    totalFollowing: number
    oneWayOutCount: number
    mutualCount: number
  } | null>(null)
  const [loadingStage, setLoadingStage] = useState('Initializing...')

  const analyzeOneWayOut = React.useCallback(async (fid: number) => {
    try {
      setLoading(true)
      setError(null)
      setStats(null)
      setLoadingStage('Initializing...')
      
      // Stage progression 
      setTimeout(() => setLoadingStage('Fetching network data...'), 500)
      setTimeout(() => setLoadingStage('Processing relationships...'), 2000)
      setTimeout(() => setLoadingStage('Calculating asymmetric follows...'), 4000)
      
      console.log(`🔍 Analyzing one-way OUT for FID ${fid}...`)
      
      // Fetch both followers and following
      const [followersResponse, followingResponse] = await Promise.all([
        fetch(`/api/followers?fid=${fid}`),
        fetch(`/api/following?fid=${fid}`)
      ])

      if (!followersResponse.ok || !followingResponse.ok) {
        throw new Error('Failed to fetch network data')
      }

      const followersData = await followersResponse.json()
      const followingData = await followingResponse.json()

      if (!followersData.success || !followingData.success) {
        throw new Error(followersData.message || followingData.message || 'API error')
      }

      // Calculate one-way OUT (people you follow who don't follow you back)
      const followersSet = new Set(followersData.followers.map((user: FarcasterUser) => user.fid))
      const oneWayOut = followingData.following.filter((user: FarcasterUser) => !followersSet.has(user.fid))
      
      // Sort by follower count (most influential first)
      const sortedOneWayOut = oneWayOut.sort((a: FarcasterUser, b: FarcasterUser) => b.followerCount - a.followerCount)

      setOneWayUsers(sortedOneWayOut)
      setStats({
        totalFollowers: followersData.followers.length,
        totalFollowing: followingData.following.length,
        oneWayOutCount: sortedOneWayOut.length,
        mutualCount: followingData.following.length - sortedOneWayOut.length
      })
      
      console.log(`✅ One-way OUT analysis complete: ${sortedOneWayOut.length} asymmetric follows found`)
      
      // Notify Farcaster that frame is ready when content loads
      await notifyFrameReady()
    } catch (err) {
      console.error('❌ One-way OUT analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze relationships')
      setOneWayUsers([])
      setStats(null)
    } finally {
      setLoading(false)
      setLoadingStage('Initializing...')
    }
  }, [])

  // Load data on mount - single useEffect, no dependency loops
  useEffect(() => {
    // Only run if we have a valid FID
    if (userFid && userFid > 0) {
      analyzeOneWayOut(userFid)
    }
  }, [userFid, analyzeOneWayOut]) // Include dependencies but function is memoized

  // Handle unfollow action (placeholder)
  const handleUnfollowUser = async (fid: number) => {
    console.log(`🔗 Unfollow user with FID: ${fid}`)
    alert(`Unfollow functionality would be implemented here for FID: ${fid}`)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userFid) {
      analyzeOneWayOut(userFid)
    }
  }

  const handleRetry = () => {
    if (userFid) {
      analyzeOneWayOut(userFid)
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-3 sm:p-4 w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 w-full pt-4 sm:pt-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 tracking-wider crt-text-glow">
            🔍 FRIEND FINDER
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-green-300 crt-text-glow">
            → People You Follow
          </h2>
          <p className="text-green-300 text-base sm:text-lg">
            But don&apos;t follow you back
          </p>
          <p className="text-green-600 text-xs sm:text-sm mt-2 italic px-2">
            📊 Fetches ALL followers and following for complete analysis
          </p>
          <div className="border-t border-green-600 mt-4 w-24 sm:w-32 mx-auto crt-glow"></div>
        </div>

        {/* Input Form - Mobile Optimized */}
        <form onSubmit={handleSubmit} className="mb-6 w-full">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 px-2 w-full">
            <label htmlFor="fid" className="text-green-300 text-sm sm:text-base text-center sm:text-left shrink-0">
              Enter Farcaster FID:
            </label>
            <div className="flex gap-2 w-full max-w-sm sm:max-w-none sm:w-auto">
              <input
                id="fid"
                type="number"
                value={userFid}
                onChange={(e) => setUserFid(Number(e.target.value))}
                placeholder="e.g. 3621"
                className="bg-black border border-green-600 text-green-400 px-3 py-3 sm:py-2 rounded-md flex-1 sm:w-28 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 text-base sm:text-sm min-h-[44px] min-w-0 crt-border-glow"
                disabled={loading}
                min="1"
                required
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <LoadingButton 
                type="submit" 
                loading={loading}
                disabled={loading || !userFid}
                className="bg-green-900 hover:bg-green-800 disabled:bg-gray-800 text-green-400 px-3 sm:px-4 py-3 sm:py-2 rounded-md border border-green-600 transition-colors whitespace-nowrap min-h-[44px] text-xs sm:text-base shrink-0 crt-glow hover:crt-glow-strong"
              >
                Analyze
              </LoadingButton>
            </div>
          </div>
        </form>

        {/* Analysis Stats - Mobile Responsive */}
        {stats && !loading && (
          <div className="mb-6 p-3 sm:p-4 bg-gray-900 border border-green-600 rounded-lg mx-2 sm:mx-0 w-full max-w-full overflow-x-hidden crt-glow">
            <h3 className="text-green-400 font-bold mb-3 text-center sm:text-left text-sm sm:text-base crt-text-glow">📊 Analysis Results</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm w-full">
              <div className="text-center sm:text-left">
                <span className="text-green-600 block sm:inline">You Follow:</span>
                <div className="text-green-400 font-bold text-lg sm:text-base crt-text-glow">{stats.totalFollowing.toLocaleString()}</div>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-green-600 block sm:inline">Follow You:</span>
                <div className="text-green-400 font-bold text-lg sm:text-base crt-text-glow">{stats.totalFollowers.toLocaleString()}</div>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-orange-400 block sm:inline">One-Way Out:</span>
                <div className="text-orange-400 font-bold text-lg sm:text-base crt-text-glow">{stats.oneWayOutCount.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Loading State */}
        {loading && (
          <div className="mb-6">
            <NetworkAnalysisLoader
              stage={loadingStage}
              progress={0}
              className="mb-4"
            />
            
            {/* Show skeleton cards while loading */}
            <CRTCardSkeleton count={3} />
          </div>
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

        {/* Results - Mobile Optimized */}
        {!loading && !error && oneWayUsers.length > 0 && (
          <>
            <div className="mb-4 text-center px-2">
              <h2 className="text-xl sm:text-2xl font-bold text-green-400 mb-2 crt-text-glow">
                👤 {oneWayUsers.length} accounts you follow but don&apos;t follow back
              </h2>
              <p className="text-green-600 text-sm sm:text-base leading-relaxed">
                Consider unfollowing or wait to see if they follow back
              </p>
              <p className="text-green-500 text-xs sm:text-sm mt-1">
                📊 Sorted by follower count (most influential first)
              </p>
            </div>
            
            <div className="space-y-0">
              {oneWayUsers.map((user) => (
                <OneWayOutCard
                  key={user.fid}
                  user={user}
                  onUnfollowUser={handleUnfollowUser}
                />
              ))}
            </div>
          </>
        )}

        {/* Enhanced Empty State */}
        {!loading && !error && oneWayUsers.length === 0 && stats && (
          <CRTEmptyState
            icon="🎯"
            title="No One-Way Following Found"
            message="All accounts you follow also follow you back! Perfect mutual relationships."
            className="mb-6"
          />
        )}
      </div>
    </div>
  )
} 