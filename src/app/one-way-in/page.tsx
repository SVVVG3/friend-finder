'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { sdk } from '@farcaster/frame-sdk'
import { 
  OnboardingAnalysisLoader, 
  CRTErrorState, 
  CRTEmptyState
} from '../../../components/LoadingStates'
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
  user
}: { 
  user: FarcasterUser
}) {
  const [imageError, setImageError] = useState(false)
  
  const { 
    username, 
    displayName, 
    followerCount, 
    followingCount, 
    pfpUrl,
    bio 
  } = user

  // Farcaster profile URL
  const profileUrl = `https://farcaster.xyz/${username}`

  // Handle profile navigation using Farcaster SDK
  const handleProfileClick = async () => {
    try {
      await sdk.actions.openUrl(profileUrl)
    } catch (error) {
      console.error('Failed to open profile:', error)
      // Fallback to regular link
      window.open(profileUrl, '_blank')
    }
  }

  return (
    <div className="bg-black border border-green-400 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 font-mono shadow-lg hover:shadow-green-400/20 hover:bg-green-400/5 transition-all duration-200 transform hover:-translate-y-0.5 mx-2 sm:mx-0 w-full max-w-full overflow-x-hidden crt-glow hover:crt-glow-strong">
      <div className="flex items-start gap-2 sm:gap-3 mb-3 w-full">
        {/* Clickable Avatar */}
        <div className="flex-shrink-0">
          <button 
            onClick={handleProfileClick}
            className="block hover:opacity-80 transition-opacity duration-200 cursor-pointer"
          >
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
          </button>
        </div>
        
        {/* Clickable User Info */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <button 
            onClick={handleProfileClick}
            className="block hover:opacity-80 transition-opacity duration-200 cursor-pointer text-left w-full"
          >
            <h4 className="text-green-400 font-bold text-sm sm:text-base mb-1 truncate crt-text-glow">{displayName}</h4>
            <p className="text-green-300 text-xs sm:text-sm mb-1 truncate">@{username}</p>
          </button>
        </div>

        <div className="flex-shrink-0">
          <button 
            className="bg-green-400/10 border border-green-400 text-green-400 px-2 sm:px-4 py-2 rounded text-xs sm:text-sm hover:bg-green-400/20 hover:shadow-green-400/30 transition-all duration-200 min-h-[44px] whitespace-nowrap crt-border-glow hover:crt-glow-strong"
            onClick={handleProfileClick}
            aria-label={`Visit ${displayName}'s profile to follow`}
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
  // Get frame state and background analysis data
  const { isFrameReady } = useFrame()
  const { isAnalyzing, isComplete, error: analysisError, data } = useBackgroundAnalysis()

  // Use background analysis data
  const oneWayIn = data.oneWayIn
  const analysisStats = data.analysisStats

  // Show loading state while frame is initializing, during analysis, OR when we have no data yet
  if (!isFrameReady || isAnalyzing || (!isComplete && oneWayIn.length === 0 && analysisStats === null && !analysisError)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <OnboardingAnalysisLoader 
          stage={
            !isFrameReady ? "Initializing..." : 
            isAnalyzing ? "Running background analysis..." : 
            "Starting analysis..."
          } 
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
      <div className="min-h-screen bg-black text-green-400 font-mono p-3 sm:p-4 w-full overflow-x-hidden">
        <div className="max-w-4xl mx-auto w-full">
          {/* Friend Finder Branding Header */}
          <div className="text-center mb-6 sm:mb-8 w-full pt-4 sm:pt-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 tracking-wider crt-text-glow">
              🔍 FRIEND FINDER
            </h1>
            <div className="border-t border-green-600 mt-4 w-24 sm:w-32 mx-auto crt-glow"></div>
          </div>

          {/* Page Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 font-mono text-green-400 crt-text-glow">
              📨 One-Way Followers
            </h2>
            <p className="text-blue-300 mb-6 font-mono text-sm sm:text-base">
              People who follow you but you don&apos;t follow back
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
    <div className="min-h-screen bg-black text-green-400 font-mono p-3 sm:p-4 w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full">
        {/* Friend Finder Branding Header */}
        <div className="text-center mb-6 sm:mb-8 w-full pt-4 sm:pt-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 tracking-wider crt-text-glow">
            🔍 FRIEND FINDER
          </h1>
          <div className="border-t border-green-600 mt-4 w-24 sm:w-32 mx-auto crt-glow"></div>
        </div>

        {/* Page Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 font-mono text-green-400 crt-text-glow">
            📨 One-Way Followers
          </h2>
          <p className="text-blue-300 mb-6 font-mono text-sm sm:text-base">
            People who follow you but you don&apos;t follow back
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
        <div className="w-full">
          {oneWayIn.map((user) => (
            <OneWayInCard 
              key={user.fid} 
              user={user}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 