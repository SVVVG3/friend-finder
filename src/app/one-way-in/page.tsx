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
import { useBackgroundAnalysis } from '../../components/BackgroundAnalysisIndicator'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get frame state and background analysis data
  const { isFrameReady } = useFrame()
  const { isAnalyzing, isComplete, error: analysisError, data } = useBackgroundAnalysis()

  // Use background analysis data
  const oneWayIn = data.oneWayIn
  const analysisStats = data.analysisStats

  // Follow user handler (placeholder)
  const handleFollowUser = async (fid: number) => {
    alert(`Follow user with FID: ${fid}`)
  }

  // Show loading state while frame is initializing or analysis is running
  if (!isFrameReady || isAnalyzing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <NetworkAnalysisLoader 
          stage={isAnalyzing ? "Running background analysis..." : "Initializing..."} 
        />
      </div>
    )
  }

  // Show error state
  if (analysisError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <CRTErrorState 
          message={analysisError}
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  // Show empty state if no data
  if (isComplete && oneWayIn.length === 0) {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 font-mono text-green-400 crt-text-glow">
              📨 One-Way Followers
            </h1>
            <p className="text-green-300 mb-6 font-mono text-sm sm:text-base">
              People who follow you but you don't follow back
            </p>
          </div>
          
          <CRTEmptyState 
            title="No one-way followers found!"
            message="You follow back everyone who follows you. Great job staying connected!"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 font-mono text-green-400 crt-text-glow">
            📨 One-Way Followers
          </h1>
          <p className="text-green-300 mb-6 font-mono text-sm sm:text-base">
            People who follow you but you don't follow back
          </p>
        </div>

        {/* Analysis Stats */}
        {analysisStats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-black border border-green-400 rounded-lg p-4 text-center crt-glow">
              <div className="text-green-400 font-bold text-lg crt-text-glow">
                {analysisStats.totalFollowers?.toLocaleString() || 0}
              </div>
              <div className="text-green-300 text-sm font-mono">Total Followers</div>
            </div>
            <div className="bg-black border border-green-400 rounded-lg p-4 text-center crt-glow">
              <div className="text-green-400 font-bold text-lg crt-text-glow">
                {analysisStats.totalFollowing?.toLocaleString() || 0}
              </div>
              <div className="text-green-300 text-sm font-mono">Total Following</div>
            </div>
            <div className="bg-black border border-blue-400 rounded-lg p-4 text-center crt-glow">
              <div className="text-blue-400 font-bold text-lg crt-text-glow">
                {oneWayIn.length.toLocaleString()}
              </div>
              <div className="text-blue-300 text-sm font-mono">One-Way Followers</div>
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="space-y-3">
          {oneWayIn.map((user) => (
            <OneWayInCard 
              key={user.fid} 
              user={user} 
              onFollowUser={handleFollowUser}
            />
          ))}
        </div>

        {/* Results Summary */}
        <div className="mt-6 p-4 bg-green-400/5 border border-green-400 rounded-lg text-center crt-glow">
          <p className="text-green-400 font-mono text-sm">
            Found {oneWayIn.length} people who follow you but you don't follow back
          </p>
        </div>
      </div>
    </div>
  )
} 