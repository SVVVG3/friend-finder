'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  NetworkAnalysisLoader, 
  CRTErrorState, 
  CRTEmptyState,
  CRTCardSkeleton
} from '../../../components/LoadingStates'
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
            className="bg-green-400/10 border border-green-400 text-green-400 px-2 sm:px-4 py-2 rounded text-xs sm:text-sm hover:bg-green-400/20 hover:shadow-green-400/30 transition-all duration-200 min-h-[44px] whitespace-nowrap crt-border-glow hover:crt-glow-strong"
            onClick={() => onFollowUser?.(fid)}
            aria-label={`Follow ${displayName}`}
          >
            <span className="hidden sm:inline">Follow Back</span>
            <span className="sm:hidden">Follow</span>
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
  const [loadingStage, setLoadingStage] = useState('Initializing...')

  // Initialize user FID from Farcaster SDK
  useEffect(() => {
    const initializeFid = async () => {
      try {
        const context = await sdk.context
        const currentUserFid = context.user.fid
        if (currentUserFid) {
          console.log(`🔍 Using current user's FID: ${currentUserFid}`)
          setUserFid(currentUserFid.toString())
        } else {
          console.log('⚠️ No user FID available from SDK context')
          // Fallback to allow manual input
          setUserFid('')
        }
      } catch (err) {
        console.error('❌ Failed to get user FID from SDK:', err)
        // Fallback to allow manual input
        setUserFid('')
      }
    }

    initializeFid()
  }, [])

  // Calculate one-way IN relationships only
  const calculateOneWayIn = React.useCallback((
    following: FarcasterUser[], 
    followers: FarcasterUser[]
  ) => {
    const followingFids = new Set(following.map(u => u.fid))
    // One-way in: People who follow you but you don't follow back
    const oneWayInUsers = followers.filter(user => !followingFids.has(user.fid))
    
    // Sort by follower count (highest first) to show most influential accounts at top
    return oneWayInUsers.sort((a, b) => b.followerCount - a.followerCount)
  }, [])

  // Analyze one-way IN relationships
  const analyzeOneWayIn = React.useCallback(async (fid: string) => {
    if (!fid || fid.trim() === '') {
      console.log('⚠️ No FID provided, skipping analysis')
      return
    }
    
    setLoading(true)
    setError(null)
    setLoadingStage('Initializing analysis...')
    
    try {
      console.log(`🔍 Starting one-way IN analysis for FID: ${fid}`)
      
      setLoadingStage('Fetching your network data...')
      
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

      setLoadingStage('Processing network data...')

      const followingData = await followingResponse.json()
      const followersData = await followersResponse.json()

      if (!followingData.success) {
        throw new Error(followingData.error || 'Failed to fetch following')
      }
      
      if (!followersData.success) {
        throw new Error(followersData.error || 'Failed to fetch followers')
      }

      console.log(`📊 Fetched ${followingData.following.length} following, ${followersData.followers.length} followers`)

      setLoadingStage('Calculating one-way relationships...')

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

      // Frame ready is now called immediately on mount, not here
    } catch (err) {
      console.error('❌ One-way IN analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze one-way relationships')
    } finally {
      setLoading(false)
      setLoadingStage('Initializing...')
    }
  }, [calculateOneWayIn])

  // Handle follow action (placeholder)
  const handleFollowUser = async (fid: number) => {
    console.log(`🔗 Follow user with FID: ${fid}`)
    alert(`Follow functionality would be implemented here for FID: ${fid}`)
  }

  // 🚀 Frame ready is now handled by home page - removed duplicate ready() call
  // Auto-load data on mount since frame ready was called by home page
  useEffect(() => {
    console.log('📊 Loading data (frame ready handled by home page)...')
    if (userFid && userFid.trim() !== '') {
      analyzeOneWayIn(userFid)
    }
  }, [userFid, analyzeOneWayIn]) // Load data immediately

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-3 sm:p-4 w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 w-full pt-4 sm:pt-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 tracking-wider crt-text-glow">
            🔍 FRIEND FINDER
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-green-300 crt-text-glow">
            ← People Who Follow You
          </h2>
          <p className="text-green-300 text-base sm:text-lg">
            But you don&apos;t follow back
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
                <span className="text-blue-400 block sm:inline">One-Way In:</span>
                <div className="text-blue-400 font-bold text-lg sm:text-base crt-text-glow">{analysisStats.oneWayInCount.toLocaleString()}</div>
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
            onRetry={() => analyzeOneWayIn(userFid)}
            retryLabel="Try Again"
            className="mb-6"
          />
        )}

        {/* Results - Mobile Optimized */}
        {!loading && !error && oneWayIn.length > 0 && (
          <>
            <div className="mb-4 text-center px-2">
              <h2 className="text-xl sm:text-2xl font-bold text-green-400 mb-2 crt-text-glow">
                🌟 {oneWayIn.length} accounts who follow you but you don&apos;t follow back
              </h2>
              <p className="text-green-600 text-sm sm:text-base leading-relaxed">
                Great opportunities to grow your network with interested followers
              </p>
              <p className="text-green-500 text-xs sm:text-sm mt-1">
                📊 Sorted by follower count (most influential first)
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

        {/* Enhanced Empty State */}
        {!loading && !error && oneWayIn.length === 0 && analysisStats && (
          <CRTEmptyState
            icon="✨"
            title="No One-Way Followers Found"
            message="No potential follows found. You&apos;re following everyone back!"
            className="mb-6"
          />
        )}
      </div>
    </div>
  )
} 