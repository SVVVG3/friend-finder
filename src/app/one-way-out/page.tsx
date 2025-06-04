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
  pfpUrl?: string
  followerCount: number
  followingCount: number
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
  // Get frame state and background analysis data
  const { isFrameReady } = useFrame()
  const { isAnalyzing, isComplete, error: analysisError, data } = useBackgroundAnalysis()

  // Use background analysis data
  const oneWayOut = data.oneWayOut
  const analysisStats = data.analysisStats

  // Unfollow user handler (placeholder)
  const handleUnfollowUser = async (fid: number) => {
    alert(`Unfollow user with FID: ${fid}`)
  }

  // Show loading state while frame is initializing or during basic analysis (not warm recs)
  if (!isFrameReady || (isAnalyzing && oneWayOut.length === 0 && analysisStats === null)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <OnboardingAnalysisLoader 
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
  if (isComplete && oneWayOut.length === 0) {
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
              📤 One-Way Following
            </h2>
            <p className="text-orange-300 mb-6 font-mono text-sm sm:text-base">
              People you follow but who don&apos;t follow you back
            </p>
          </div>
          
          <CRTEmptyState 
            title="No one-way follows found!"
            message="Everyone you follow also follows you back. Perfect mutual connections!"
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
            📤 One-Way Following
          </h2>
          <p className="text-orange-300 mb-6 font-mono text-sm sm:text-base">
            People you follow but who don&apos;t follow you back
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
            <div className="bg-black border border-orange-400 rounded-lg p-4 text-center crt-glow">
              <div className="text-orange-400 font-bold text-lg crt-text-glow">
                {oneWayOut.length.toLocaleString()}
              </div>
              <div className="text-orange-300 text-sm font-mono">One-Way Following</div>
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="w-full">
          {oneWayOut.map((user) => (
            <OneWayOutCard 
              key={user.fid} 
              user={user} 
              onUnfollowUser={handleUnfollowUser}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 