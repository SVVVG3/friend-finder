import React from 'react'
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

// Individual recommendation card component
function RecommendationCard({ 
  recommendation, 
  onFollowUser 
}: { 
  recommendation: UserWithMutuals
  onFollowUser?: (fid: number) => void
}) {
  const [imageError, setImageError] = React.useState(false)
  
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

  // Helper to check if URL is problematic IPFS
  const isProblematicImage = (url: string) => {
    return url.includes('ipfs.decentralized-content.com') || 
           url.includes('nft.orivium.io') ||
           url.includes('.ipfs.') ||
           url.includes('arweave.net')
  }

  return (
    <div className="rec-card">
      <div className="rec-header">
        <div className="rec-avatar">
          {pfpUrl && !imageError ? (
            <Image 
              src={pfpUrl} 
              alt={`${displayName} avatar`}
              width={48}
              height={48}
              className="avatar-img"
              onError={(e) => {
                console.warn(`Failed to load image for ${displayName}: ${pfpUrl}`)
                setImageError(true)
              }}
              unoptimized={true} // Bypass Next.js optimization and domain restrictions completely
              priority={false}
            />
          ) : (
            <div className="avatar-placeholder">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="rec-info">
          <h3 className="rec-name">{displayName}</h3>
          <p className="rec-username">@{username}</p>
          {score && (
            <div className="rec-score">
              Score: {Math.round(score * 10) / 10}
            </div>
          )}
        </div>

        <button 
          className="follow-btn"
          onClick={() => onFollowUser?.(fid)}
          aria-label={`Follow ${displayName}`}
        >
          + Follow
        </button>
      </div>

      {bio && (
        <div className="rec-bio">
          <p>{bio.length > 120 ? `${bio.substring(0, 120)}...` : bio}</p>
        </div>
      )}

      <div className="rec-stats">
        <div className="stat">
          <span className="stat-label">Mutuals:</span>
          <span className="stat-value">{mutualCount || 0}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Followers:</span>
          <span className="stat-value">{followerCount.toLocaleString()}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Following:</span>
          <span className="stat-value">{followingCount.toLocaleString()}</span>
        </div>
      </div>

      <style jsx>{`
        .rec-card {
          background: rgba(0, 255, 0, 0.05);
          border: 1px solid #00ff00;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          font-family: 'Monaco', 'Menlo', monospace;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
          transition: all 0.2s ease;
        }

        .rec-card:hover {
          background: rgba(0, 255, 0, 0.1);
          box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
          transform: translateY(-2px);
        }

        .rec-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .rec-avatar {
          flex-shrink: 0;
        }

        .avatar-img {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid #00ff00;
        }

        .avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid #00ff00;
          background: rgba(0, 255, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #00ff00;
          font-weight: bold;
          font-size: 18px;
        }

        .rec-info {
          flex: 1;
        }

        .rec-name {
          color: #00ff00;
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: bold;
        }

        .rec-username {
          color: #00cc00;
          margin: 0 0 4px 0;
          font-size: 14px;
        }

        .rec-score {
          color: #00aa00;
          font-size: 12px;
        }

        .follow-btn {
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid #00ff00;
          color: #00ff00;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .follow-btn:hover {
          background: rgba(0, 255, 0, 0.2);
          box-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
        }

        .rec-bio {
          margin-bottom: 12px;
          padding: 8px;
          background: rgba(0, 255, 0, 0.02);
          border-left: 2px solid #00ff00;
        }

        .rec-bio p {
          color: #00cc00;
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
        }

        .rec-stats {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-label {
          color: #00aa00;
          font-size: 12px;
          text-transform: uppercase;
        }

        .stat-value {
          color: #00ff00;
          font-size: 14px;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .rec-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .follow-btn {
            align-self: flex-end;
            margin-top: 8px;
          }
          
          .rec-stats {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  )
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="loading-container">
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-info">
              <div className="skeleton-line skeleton-name"></div>
              <div className="skeleton-line skeleton-username"></div>
            </div>
          </div>
          <div className="skeleton-stats">
            <div className="skeleton-line skeleton-stat"></div>
            <div className="skeleton-line skeleton-stat"></div>
            <div className="skeleton-line skeleton-stat"></div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .loading-container {
          animation: pulse 2s infinite;
        }

        .skeleton-card {
          background: rgba(0, 255, 0, 0.02);
          border: 1px solid rgba(0, 255, 0, 0.3);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .skeleton-header {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .skeleton-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(0, 255, 0, 0.1);
        }

        .skeleton-info {
          flex: 1;
        }

        .skeleton-line {
          background: rgba(0, 255, 0, 0.1);
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .skeleton-name {
          height: 16px;
          width: 60%;
        }

        .skeleton-username {
          height: 14px;
          width: 40%;
        }

        .skeleton-stats {
          display: flex;
          gap: 16px;
        }

        .skeleton-stat {
          height: 12px;
          width: 60px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

// Main component
export default function WarmRecsList({ 
  recommendations, 
  loading = false, 
  error, 
  onFollowUser,
  className = '' 
}: WarmRecsListProps) {
  // Loading state
  if (loading) {
    return (
      <div className={`warm-recs-list ${className}`}>
        <h2 className="list-title">🔥 Warm Recommendations</h2>
        <LoadingSkeleton />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`warm-recs-list ${className}`}>
        <h2 className="list-title">🔥 Warm Recommendations</h2>
        <div className="error-message">
          <p>⚠️ {error}</p>
          <p>Please try again later.</p>
        </div>

        <style jsx>{`
          .error-message {
            background: rgba(255, 0, 0, 0.1);
            border: 1px solid #ff4444;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
            color: #ff4444;
            font-family: 'Monaco', 'Menlo', monospace;
          }

          .error-message p {
            margin: 4px 0;
          }
        `}</style>
      </div>
    )
  }

  // Empty state
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className={`warm-recs-list ${className}`}>
        <h2 className="list-title">🔥 Warm Recommendations</h2>
        <div className="empty-message">
          <p>📭 No warm recommendations found</p>
          <p>Try following more people to get better recommendations!</p>
        </div>

        <style jsx>{`
          .empty-message {
            background: rgba(0, 255, 0, 0.05);
            border: 1px dashed #00ff00;
            border-radius: 8px;
            padding: 32px;
            text-align: center;
            color: #00cc00;
            font-family: 'Monaco', 'Menlo', monospace;
          }

          .empty-message p {
            margin: 8px 0;
          }
        `}</style>
      </div>
    )
  }

  // Main render
  return (
    <div className={`warm-recs-list ${className}`}>
      <h2 className="list-title">
        🔥 Warm Recommendations ({recommendations.length})
      </h2>
      
      <div className="recommendations-container">
        {recommendations.map((rec) => (
          <RecommendationCard
            key={rec.fid}
            recommendation={rec}
            onFollowUser={onFollowUser}
          />
        ))}
      </div>

      <style jsx>{`
        .warm-recs-list {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .list-title {
          color: #00ff00;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 24px;
          margin-bottom: 24px;
          text-align: center;
          text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }

        .recommendations-container {
          max-height: 80vh;
          overflow-y: auto;
          padding: 0 4px;
        }

        .recommendations-container::-webkit-scrollbar {
          width: 8px;
        }

        .recommendations-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }

        .recommendations-container::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 0, 0.5);
          border-radius: 4px;
        }

        .recommendations-container::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 0, 0.7);
        }
      `}</style>
    </div>
  )
} 