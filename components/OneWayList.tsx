import React from 'react'
import Image from 'next/image'

// Types for one-way follow relationships
interface OneWayUser {
  fid: number
  username: string
  displayName: string
  followerCount: number
  followingCount: number
  pfpUrl?: string
  bio?: string
}

interface OneWayListProps {
  oneWayOut: OneWayUser[] // People you follow who don't follow back
  oneWayIn: OneWayUser[]  // People who follow you but you don't follow back
  loading?: boolean
  error?: string
  onFollowUser?: (fid: number) => void
  onUnfollowUser?: (fid: number) => void
  className?: string
}

// Individual one-way user card component
function OneWayCard({ 
  user, 
  type,
  onFollowUser,
  onUnfollowUser
}: { 
  user: OneWayUser
  type: 'out' | 'in'
  onFollowUser?: (fid: number) => void
  onUnfollowUser?: (fid: number) => void
}) {
  const [imageError, setImageError] = React.useState(false)
  
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
    <div className="oneway-card">
      <div className="oneway-header">
        <div className="oneway-avatar">
          {pfpUrl && !imageError ? (
            <Image 
              src={pfpUrl} 
              alt={`${displayName} avatar`}
              width={40}
              height={40}
              className="avatar-img"
              onError={(e) => {
                console.warn(`Failed to load image for ${displayName}: ${pfpUrl}`)
                setImageError(true)
              }}
              unoptimized={true}
              priority={false}
            />
          ) : (
            <div className="avatar-placeholder">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="oneway-info">
          <h4 className="oneway-name">{displayName}</h4>
          <p className="oneway-username">@{username}</p>
        </div>

        <div className="oneway-actions">
          {type === 'out' ? (
            <button 
              className="unfollow-btn"
              onClick={() => onUnfollowUser?.(fid)}
              aria-label={`Unfollow ${displayName}`}
            >
              Unfollow
            </button>
          ) : (
            <button 
              className="follow-btn"
              onClick={() => onFollowUser?.(fid)}
              aria-label={`Follow ${displayName}`}
            >
              Follow Back
            </button>
          )}
        </div>
      </div>

      {bio && (
        <div className="oneway-bio">
          <p>{bio.length > 80 ? `${bio.substring(0, 80)}...` : bio}</p>
        </div>
      )}

      <div className="oneway-stats">
        <div className="stat">
          <span className="stat-value">{followerCount.toLocaleString()}</span>
          <span className="stat-label">followers</span>
        </div>
        <div className="stat">
          <span className="stat-value">{followingCount.toLocaleString()}</span>
          <span className="stat-label">following</span>
        </div>
      </div>

      <style jsx>{`
        .oneway-card {
          background: rgba(0, 255, 0, 0.03);
          border: 1px solid #00aa00;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 12px;
          font-family: 'Monaco', 'Menlo', monospace;
          box-shadow: 0 0 5px rgba(0, 255, 0, 0.1);
          transition: all 0.2s ease;
        }

        .oneway-card:hover {
          background: rgba(0, 255, 0, 0.06);
          box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
          transform: translateY(-1px);
        }

        .oneway-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .oneway-avatar {
          flex-shrink: 0;
        }

        .avatar-img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #00aa00;
        }

        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #00aa00;
          background: rgba(0, 255, 0, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #00aa00;
          font-weight: bold;
          font-size: 14px;
        }

        .oneway-info {
          flex: 1;
          min-width: 0;
        }

        .oneway-name {
          color: #00ff00;
          margin: 0 0 2px 0;
          font-size: 14px;
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .oneway-username {
          color: #00cc00;
          margin: 0;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .oneway-actions {
          flex-shrink: 0;
        }

        .follow-btn, .unfollow-btn {
          border: 1px solid;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .follow-btn {
          background: rgba(0, 255, 0, 0.1);
          border-color: #00ff00;
          color: #00ff00;
        }

        .follow-btn:hover {
          background: rgba(0, 255, 0, 0.2);
          box-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
        }

        .unfollow-btn {
          background: rgba(255, 100, 0, 0.1);
          border-color: #ff6400;
          color: #ff6400;
        }

        .unfollow-btn:hover {
          background: rgba(255, 100, 0, 0.2);
          box-shadow: 0 0 5px rgba(255, 100, 0, 0.3);
        }

        .oneway-bio {
          margin-bottom: 8px;
          padding: 6px 8px;
          background: rgba(0, 255, 0, 0.02);
          border-radius: 4px;
          border-left: 2px solid #00aa00;
        }

        .oneway-bio p {
          color: #00cc00;
          font-size: 12px;
          margin: 0;
          line-height: 1.3;
        }

        .oneway-stats {
          display: flex;
          gap: 16px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .stat-value {
          color: #00ff00;
          font-weight: bold;
          font-size: 12px;
        }

        .stat-label {
          color: #00aa00;
          font-size: 10px;
        }
      `}</style>
    </div>
  )
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="skeleton-container">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-info">
              <div className="skeleton-line"></div>
              <div className="skeleton-line short"></div>
            </div>
            <div className="skeleton-button"></div>
          </div>
          <div className="skeleton-stats">
            <div className="skeleton-stat"></div>
            <div className="skeleton-stat"></div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .skeleton-container {
          animation: pulse 1.5s ease-in-out infinite alternate;
        }

        .skeleton-card {
          background: rgba(0, 255, 0, 0.02);
          border: 1px solid #004400;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .skeleton-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .skeleton-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 255, 0, 0.1);
        }

        .skeleton-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .skeleton-line {
          height: 12px;
          background: rgba(0, 255, 0, 0.1);
          border-radius: 2px;
        }

        .skeleton-line.short {
          width: 60%;
          height: 10px;
        }

        .skeleton-button {
          width: 60px;
          height: 24px;
          background: rgba(0, 255, 0, 0.1);
          border-radius: 4px;
        }

        .skeleton-stats {
          display: flex;
          gap: 16px;
        }

        .skeleton-stat {
          width: 40px;
          height: 20px;
          background: rgba(0, 255, 0, 0.05);
          border-radius: 2px;
        }

        @keyframes pulse {
          0% { opacity: 0.4; }
          100% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

// Main OneWayList component
export default function OneWayList({ 
  oneWayOut = [], 
  oneWayIn = [],
  loading = false, 
  error, 
  onFollowUser,
  onUnfollowUser,
  className = '' 
}: OneWayListProps) {
  
  if (error) {
    return (
      <div className={`oneway-container ${className}`}>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading One-Way Follows</h3>
          <p>{error}</p>
        </div>

        <style jsx>{`
          .oneway-container {
            font-family: 'Monaco', 'Menlo', monospace;
          }

          .error-state {
            text-align: center;
            padding: 32px;
            border: 1px solid #ff4444;
            border-radius: 8px;
            background: rgba(255, 68, 68, 0.05);
          }

          .error-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .error-state h3 {
            color: #ff4444;
            margin: 0 0 8px 0;
            font-size: 18px;
          }

          .error-state p {
            color: #cc3333;
            margin: 0;
            font-size: 14px;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className={`oneway-container ${className}`}>
      <div className="oneway-columns">
        {/* One-Way Out: People you follow who don't follow back */}
        <div className="oneway-column">
          <div className="column-header">
            <h3 className="column-title">
              ↗️ One-Way Out ({oneWayOut.length})
            </h3>
            <p className="column-subtitle">
              People you follow who don't follow you back
            </p>
          </div>

          <div className="column-content">
            {loading ? (
              <LoadingSkeleton />
            ) : oneWayOut.length > 0 ? (
              oneWayOut.map((user) => (
                <OneWayCard
                  key={user.fid}
                  user={user}
                  type="out"
                  onUnfollowUser={onUnfollowUser}
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">✨</div>
                <p>All your follows are mutual!</p>
              </div>
            )}
          </div>
        </div>

        {/* One-Way In: People who follow you but you don't follow back */}
        <div className="oneway-column">
          <div className="column-header">
            <h3 className="column-title">
              ↙️ One-Way In ({oneWayIn.length})
            </h3>
            <p className="column-subtitle">
              People who follow you but you don't follow back
            </p>
          </div>

          <div className="column-content">
            {loading ? (
              <LoadingSkeleton />
            ) : oneWayIn.length > 0 ? (
              oneWayIn.map((user) => (
                <OneWayCard
                  key={user.fid}
                  user={user}
                  type="in"
                  onFollowUser={onFollowUser}
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <p>You follow back all your followers!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .oneway-container {
          font-family: 'Monaco', 'Menlo', monospace;
          color: #00ff00;
        }

        .oneway-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .oneway-columns {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        .oneway-column {
          min-height: 200px;
        }

        .column-header {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #00aa00;
        }

        .column-title {
          color: #00ff00;
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: bold;
        }

        .column-subtitle {
          color: #00cc00;
          margin: 0;
          font-size: 12px;
          line-height: 1.3;
        }

        .column-content {
          max-height: 600px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .column-content::-webkit-scrollbar {
          width: 6px;
        }

        .column-content::-webkit-scrollbar-track {
          background: rgba(0, 255, 0, 0.1);
          border-radius: 3px;
        }

        .column-content::-webkit-scrollbar-thumb {
          background: #00aa00;
          border-radius: 3px;
        }

        .empty-state {
          text-align: center;
          padding: 32px 16px;
          border: 1px dashed #00aa00;
          border-radius: 8px;
          background: rgba(0, 255, 0, 0.02);
        }

        .empty-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .empty-state p {
          color: #00cc00;
          margin: 0;
          font-size: 14px;
        }
      `}</style>
    </div>
  )
}

// Export types for use in other components
export type { OneWayUser, OneWayListProps } 