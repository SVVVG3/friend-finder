'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  NetworkAnalysisLoader, 
  CRTErrorState, 
  CRTEmptyState,
  CRTCardSkeleton
} from '../../../components/LoadingStates'
import { useCache } from '../../components/CacheProvider'
import { useFrame } from '../../components/FrameProvider'

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
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
  const [oneWayOut, setOneWayOut] = useState<FarcasterUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisStats, setAnalysisStats] = useState<{
    totalFollowing: number
    totalFollowers: number
    oneWayOutCount: number
  } | null>(null)
  const [loadingStage, setLoadingStage] = useState('Initializing...')

  // Get cache functions and frame state
  const cache = useCache()
  const { isFrameReady, userFid } = useFrame()

  // Check cache and load cached data if available
  const loadFromCacheIfValid = React.useCallback(() => {
    if (cache.isCacheValid() && (cache.userFid === userFid || !cache.userFid)) {
      console.log('🔄 Loading from cache - valid data found')
      
      // Use cached data
      setOneWayOut(cache.oneWayOut)
      setAnalysisStats({
        totalFollowing: cache.analysisStats?.totalFollowing || 0,
        totalFollowers: cache.analysisStats?.totalFollowers || 0,
        oneWayOutCount: cache.oneWayOut.length
      })
      
      return true // Cache was used
    }
    return false // No valid cache
  }, [cache, userFid])

  const analyzeOneWayOut = React.useCallback(async (fid: string) => {
    if (!fid || fid.trim() === '') {
      console.log('⚠️ No FID provided, skipping analysis')
      return
    }

    // Check cache first
    if (loadFromCacheIfValid()) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      setAnalysisStats(null)
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
        throw new Error('Invalid response from API')
      }

      const followers: FarcasterUser[] = followersData.followers || []
      const following: FarcasterUser[] = followingData.following || []

      console.log(`📊 Fetched ${following.length} following, ${followers.length} followers`)

      // Calculate one-way OUT (people you follow but who don't follow you back)
      const followerFids = new Set(followers.map(u => u.fid))
      const oneWayOutResults = following.filter(user => !followerFids.has(user.fid))
        // Sort by follower count (highest first) to show most influential accounts at top
        .sort((a, b) => b.followerCount - a.followerCount)

      console.log(`🔄 One-way OUT analysis results: ${oneWayOutResults.length} accounts`)

      setOneWayOut(oneWayOutResults)
      setAnalysisStats({
        totalFollowing: following.length,
        totalFollowers: followers.length,
        oneWayOutCount: oneWayOutResults.length
      })

      // Store in cache, calculating one-way in as well for completeness
      const followingFids = new Set(following.map(u => u.fid))
      const oneWayInResults = followers.filter(user => !followingFids.has(user.fid))

      cache.setCache({
        userFid: fid,
        followers,
        following,
        oneWayIn: oneWayInResults,
        oneWayOut: oneWayOutResults,
        analysisStats: {
          totalFollowing: following.length,
          totalFollowers: followers.length,
          oneWayInCount: oneWayInResults.length,
          oneWayOutCount: oneWayOutResults.length
        }
      })
      console.log('💾 Data cached for future navigation')

    } catch (err) {
      console.error('❌ Error during one-way OUT analysis:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setOneWayOut([])
      setAnalysisStats(null)
    } finally {
      setLoading(false)
      setLoadingStage('Initializing...')
    }
  }, [cache, loadFromCacheIfValid])

  // Load data when frame is ready and we have a user FID
  useEffect(() => {
    if (!isFrameReady) {
      console.log('📊 Loading data (frame ready handled by home page)...')
      return
    }

    if (userFid && userFid.trim() !== '') {
      console.log(`🔍 Using current user's FID: ${userFid}`)
      
      // Try cache first, then fetch if needed
      if (!loadFromCacheIfValid()) {
        analyzeOneWayOut(userFid)
      }
    }
  }, [isFrameReady, userFid, analyzeOneWayOut, loadFromCacheIfValid])

  const handleUnfollowUser = async (fid: number) => {
    // TODO: Implement unfollow functionality using Farcaster actions
    console.log(`Unfollowing user with FID: ${fid}`)
  }

  const handleRetry = () => {
    if (userFid) {
      // Clear cache and retry
      cache.setCache({ lastAnalyzed: 0 })
      analyzeOneWayOut(userFid)
    }
  }

  // Show loading if frame is not ready
  if (!isFrameReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NetworkAnalysisLoader 
          stage="Initializing Farcaster frame..."
          progress={0}
        />
      </div>
    )
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
            📊 Automatically analyzing your complete network
          </p>
          <div className="border-t border-green-600 mt-4 w-24 sm:w-32 mx-auto crt-glow"></div>
        </div>

        {/* Analysis Stats - Mobile Responsive */}
        {analysisStats && !loading && (
          <div className="mb-6 p-3 sm:p-4 bg-gray-900 border border-green-600 rounded-lg mx-2 sm:mx-0 w-full max-w-full overflow-x-hidden crt-glow">
            <h3 className="text-green-400 font-bold mb-3 text-center sm:text-left text-sm sm:text-base crt-text-glow">📊 Analysis Results</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm w-full">
              <div className="text-center sm:text-left">
                <span className="text-green-600 block sm:inline">You Follow:</span>
                <div className="text-green-400 font-bold text-lg sm:text-base crt-text-glow">{analysisStats.totalFollowing.toLocaleString()}</div>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-green-600 block sm:inline">Follow You:</span>
                <div className="text-green-400 font-bold text-lg sm:text-base crt-text-glow">{analysisStats.totalFollowers.toLocaleString()}</div>
              </div>
              <div className="text-center sm:text-left">
                <span className="text-orange-400 block sm:inline">One-Way Out:</span>
                <div className="text-orange-400 font-bold text-lg sm:text-base crt-text-glow">{analysisStats.oneWayOutCount.toLocaleString()}</div>
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
        {!loading && !error && oneWayOut.length > 0 && (
          <>
            <div className="mb-4 text-center px-2">
              <h2 className="text-xl sm:text-2xl font-bold text-green-400 mb-2 crt-text-glow">
                👤 {oneWayOut.length} accounts you follow but don&apos;t follow back
              </h2>
              <p className="text-green-600 text-sm sm:text-base leading-relaxed">
                Consider unfollowing or wait to see if they follow back
              </p>
              <p className="text-green-500 text-xs sm:text-sm mt-1">
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

        {/* Enhanced Empty State */}
        {!loading && !error && oneWayOut.length === 0 && analysisStats && (
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