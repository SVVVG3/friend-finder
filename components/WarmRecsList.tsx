import React, { useState } from 'react'
import Image from 'next/image'
import { UserWithMutuals } from '../utils/sort'

// Props interface for the component
interface WarmRecsListProps {
  recommendations: UserWithMutuals[]
  loading?: boolean
  error?: string
  onFollowUser?: (fid: number) => void
  className?: string
}

// Individual recommendation card component - now with modern Tailwind styling
function RecommendationCard({ 
  recommendation, 
  onFollowUser 
}: { 
  recommendation: UserWithMutuals
  onFollowUser?: (fid: number) => void
}) {
  const [imageError, setImageError] = useState(false)
  
  const { 
    fid, 
    username, 
    displayName, 
    followerCount, 
    followingCount, 
    mutualCount, 
    score,
    pfpUrl,
    bio 
  } = recommendation

  return (
    <div className="bg-black border border-green-400 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 font-mono shadow-lg hover:shadow-green-400/20 hover:bg-green-400/5 transition-all duration-200 transform hover:-translate-y-0.5 mx-2 sm:mx-0 w-full max-w-full overflow-x-hidden">
      <div className="flex items-start gap-2 sm:gap-3 mb-3 w-full">
        <div className="flex-shrink-0">
          {pfpUrl && !imageError ? (
            <Image 
              src={pfpUrl} 
              alt={`${displayName} avatar`}
              width={48}
              height={48}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-green-400"
              onError={() => setImageError(true)}
              unoptimized={true}
              priority={false}
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-green-400 bg-green-400/10 flex items-center justify-center text-green-400 font-bold text-sm sm:text-lg flex-shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-green-400 font-bold text-sm sm:text-base mb-1 truncate">
            {displayName}
          </h3>
          <p className="text-green-300 text-xs sm:text-sm mb-1 truncate">
            @{username}
          </p>
          {score && (
            <div className="text-green-600 text-xs">
              Score: {Math.round(score * 10) / 10}
            </div>
          )}
        </div>

        <button 
          className="bg-green-400/10 border border-green-400 text-green-400 px-2 sm:px-4 py-2 rounded text-xs sm:text-sm hover:bg-green-400/20 hover:shadow-green-400/30 transition-all duration-200 min-h-[44px] whitespace-nowrap"
          onClick={() => onFollowUser?.(fid)}
          aria-label={`Follow ${displayName}`}
        >
          <span className="hidden sm:inline">+ Follow</span>
          <span className="sm:hidden">Follow</span>
        </button>
      </div>

      {bio && (
        <div className="mb-3 p-2 sm:p-3 bg-green-400/5 rounded border-l-2 border-green-600">
          <p className="text-green-300 text-xs sm:text-sm leading-relaxed">
            <span className="sm:hidden">
              {bio.length > 80 ? `${bio.substring(0, 80)}...` : bio}
            </span>
            <span className="hidden sm:inline">
              {bio.length > 100 ? `${bio.substring(0, 100)}...` : bio}
            </span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center text-xs sm:text-sm">
        <div className="bg-green-400/5 rounded p-2 border border-green-600/30">
          <div className="text-green-600 font-bold text-xs mb-1">MUTUALS:</div>
          <div className="text-green-400 font-bold text-sm sm:text-base">
            {mutualCount || 0}
          </div>
        </div>
        <div className="bg-green-400/5 rounded p-2 border border-green-600/30">
          <div className="text-green-600 font-bold text-xs mb-1">FOLLOWERS:</div>
          <div className="text-green-400 font-bold text-sm sm:text-base">
            {followerCount.toLocaleString()}
          </div>
        </div>
        <div className="bg-green-400/5 rounded p-2 border border-green-600/30">
          <div className="text-green-600 font-bold text-xs mb-1">FOLLOWING:</div>
          <div className="text-green-400 font-bold text-sm sm:text-base">
            {followingCount.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton component with modern styling
function LoadingSkeleton() {
  return (
    <div className="bg-black border border-green-400/50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 font-mono animate-pulse w-full max-w-full overflow-x-hidden">
      <div className="flex items-start gap-2 sm:gap-3 mb-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-400/20 flex-shrink-0"></div>
        <div className="flex-1">
          <div className="h-4 bg-green-400/20 rounded mb-2 w-3/4"></div>
          <div className="h-3 bg-green-400/10 rounded mb-1 w-1/2"></div>
          <div className="h-2 bg-green-400/10 rounded w-1/4"></div>
        </div>
        <div className="w-16 h-9 bg-green-400/20 rounded"></div>
      </div>
      <div className="mb-3 p-2 sm:p-3 bg-green-400/5 rounded">
        <div className="h-3 bg-green-400/10 rounded mb-1"></div>
        <div className="h-3 bg-green-400/10 rounded w-4/5"></div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-green-400/5 rounded p-2 h-12"></div>
        <div className="bg-green-400/5 rounded p-2 h-12"></div>
        <div className="bg-green-400/5 rounded p-2 h-12"></div>
      </div>
    </div>
  )
}

// Main component with modern layout and mobile optimization
export default function WarmRecsList({ 
  recommendations, 
  loading = false, 
  error, 
  onFollowUser,
  className = '' 
}: WarmRecsListProps) {
  
  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="text-center py-8 sm:py-12 px-4">
          <div className="inline-block animate-spin rounded-full h-16 w-16 sm:h-12 sm:w-12 border-b-2 border-green-400 mb-4"></div>
          <div className="text-green-400 text-base sm:text-lg font-bold">
            🔍 Finding warm recommendations...
          </div>
          <div className="text-green-600 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
            Analyzing your network for the best connections
          </div>
        </div>
        
        {/* Loading skeletons */}
        <div className="space-y-3 sm:space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <div className="text-center py-8 px-4">
          <div className="text-red-400 text-lg font-bold mb-2">
            ⚠️ Error Loading Recommendations
          </div>
          <div className="text-red-300 text-sm bg-red-400/10 border border-red-400/50 rounded p-3 max-w-md mx-auto">
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!recommendations.length) {
    return (
      <div className={`w-full ${className}`}>
        <div className="text-center py-8 px-4">
          <div className="text-green-400 text-lg font-bold mb-2">
            🤖 No Warm Recommendations Found
          </div>
          <div className="text-green-600 text-sm max-w-md mx-auto leading-relaxed">
            Try following more people or check back later for new recommendations.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Header with count */}
      <div className="mb-4 sm:mb-6 text-center">
        <div className="text-green-400 text-sm sm:text-base font-mono">
          🔥 <span className="font-bold text-lg">{recommendations.length}</span> warm recommendations found
        </div>
        <div className="text-green-600 text-xs sm:text-sm mt-1 italic">
          📊 Sorted by follower count (most influential first)
        </div>
      </div>

      {/* Recommendations list */}
      <div className="space-y-3 sm:space-y-4">
        {recommendations.map((rec) => (
          <RecommendationCard 
            key={rec.fid} 
            recommendation={rec} 
            onFollowUser={onFollowUser}
          />
        ))}
      </div>
    </div>
  )
} 