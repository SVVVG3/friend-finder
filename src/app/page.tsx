'use client'

import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import { 
  NetworkAnalysisLoader, 
  CRTErrorState, 
  LoadingButton,
  CRTEmptyState
} from '../../components/LoadingStates'

interface UserData {
  fid: number
  username: string
  display_name: string
  pfp_url: string
}

interface FollowData {
  followers?: UserData[]
  following?: UserData[]
}

export default function HomePage() {
  const [isReady, setIsReady] = useState(false)
  const [debugInfo, setDebugInfo] = useState('Initializing...')
  const [currentView, setCurrentView] = useState<'one-way-in' | 'one-way-out' | 'warm-recs'>('one-way-in')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userFid, setUserFid] = useState<string>('466111')
  const [analysisStats, setAnalysisStats] = useState<{
    totalFollowers: number
    totalFollowing: number
    oneWayIn: number
    oneWayOut: number
  } | null>(null)
  const [oneWayInUsers, setOneWayInUsers] = useState<UserData[]>([])
  const [oneWayOutUsers, setOneWayOutUsers] = useState<UserData[]>([])

  // 🚀 HIGHEST PRIORITY: Notify Farcaster frame is ready IMMEDIATELY
  useEffect(() => {
    const initializeFrame = async () => {
      try {
        setDebugInfo('🚀 Calling sdk.actions.ready()...')
        console.log('🚀 HOME PAGE: Calling sdk.actions.ready() to dismiss splash screen')
        console.log('SDK object:', sdk)
        console.log('SDK actions:', sdk.actions)
        
        // Call ready immediately to dismiss splash screen
        const result = await sdk.actions.ready()
        console.log('✅ Frame ready result:', result)
        console.log('✅ Frame ready called successfully - splash screen should be dismissed')
        
        setIsReady(true)
        setDebugInfo('✅ Mini App ready! Select analysis type.')
        
      } catch (error) {
        console.error('❌ Failed to call frame ready:', error)
        console.error('❌ Error details:', JSON.stringify(error))
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setDebugInfo(`❌ Error: ${errorMessage}`)
      }
    }

    initializeFrame()
  }, [])

  const analyzeOneWayIn = async (fid: string) => {
    if (!fid || fid.trim() === '') return
    
    try {
      setLoading(true)
      setError(null)
      setDebugInfo('🔍 Analyzing one-way followers...')
      console.log(`🔍 Analyzing one-way IN for FID ${fid}...`)

      const [followersRes, followingRes] = await Promise.all([
        fetch(`/api/followers?fid=${fid}`),
        fetch(`/api/following?fid=${fid}`)
      ])

      if (!followersRes.ok || !followingRes.ok) {
        throw new Error('Failed to fetch follow data')
      }

      const followersData = await followersRes.json() as FollowData
      const followingData = await followingRes.json() as FollowData

      const followers = new Set(followersData.followers?.map((f: UserData) => f.fid) || [])
      const following = new Set(followingData.following?.map((f: UserData) => f.fid) || [])

      const oneWayInFids = Array.from(followers).filter(fid => !following.has(fid))
      const oneWayOutFids = Array.from(following).filter(fid => !followers.has(fid))

      const oneWayInUsersData = followersData.followers?.filter((f: UserData) => 
        oneWayInFids.includes(f.fid)
      ) || []

      setAnalysisStats({
        totalFollowers: followers.size,
        totalFollowing: following.size,
        oneWayIn: oneWayInFids.length,
        oneWayOut: oneWayOutFids.length
      })

      setOneWayInUsers(oneWayInUsersData.slice(0, 20))
      setDebugInfo('✅ Analysis complete!')
      console.log(`✅ Analysis complete: ${oneWayInFids.length} one-way followers found`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed'
      setError(errorMessage)
      setDebugInfo(`❌ ${errorMessage}`)
      console.error('❌ Analysis failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeOneWayOut = async (fid: string) => {
    if (!fid || fid.trim() === '') return
    
    try {
      setLoading(true)
      setError(null)
      setDebugInfo('🔍 Analyzing one-way following...')
      console.log(`🔍 Analyzing one-way OUT for FID ${fid}...`)

      const [followersRes, followingRes] = await Promise.all([
        fetch(`/api/followers?fid=${fid}`),
        fetch(`/api/following?fid=${fid}`)
      ])

      if (!followersRes.ok || !followingRes.ok) {
        throw new Error('Failed to fetch follow data')
      }

      const followersData = await followersRes.json() as FollowData
      const followingData = await followingRes.json() as FollowData

      const followers = new Set(followersData.followers?.map((f: UserData) => f.fid) || [])
      const following = new Set(followingData.following?.map((f: UserData) => f.fid) || [])

      const oneWayInFids = Array.from(followers).filter(fid => !following.has(fid))
      const oneWayOutFids = Array.from(following).filter(fid => !followers.has(fid))

      const oneWayOutUsersData = followingData.following?.filter((f: UserData) => 
        oneWayOutFids.includes(f.fid)
      ) || []

      setAnalysisStats({
        totalFollowers: followers.size,
        totalFollowing: following.size,
        oneWayIn: oneWayInFids.length,
        oneWayOut: oneWayOutFids.length
      })

      setOneWayOutUsers(oneWayOutUsersData.slice(0, 20))
      setDebugInfo('✅ Analysis complete!')
      console.log(`✅ Analysis complete: ${oneWayOutFids.length} one-way following found`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed'
      setError(errorMessage)
      setDebugInfo(`❌ ${errorMessage}`)
      console.error('❌ Analysis failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalysis = () => {
    if (currentView === 'one-way-in') {
      analyzeOneWayIn(userFid)
    } else if (currentView === 'one-way-out') {
      analyzeOneWayOut(userFid)
    }
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-2xl font-mono mb-4">🔍 Friend Finder</div>
          <div className="text-sm font-mono opacity-70 mb-4">
            Initializing mini app...
          </div>
          <div className="text-xs font-mono opacity-50 bg-gray-900 p-2 rounded border">
            {debugInfo}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-2xl font-mono mb-2">🔍 Friend Finder</div>
          <div className="text-sm font-mono opacity-70">Farcaster Network Analysis</div>
          <div className="text-xs font-mono opacity-50 bg-gray-900 p-2 rounded border mt-2">
            {debugInfo}
          </div>
        </div>

        {/* View Selector */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={() => setCurrentView('one-way-in')}
            className={`p-3 rounded border font-mono text-sm transition-all ${
              currentView === 'one-way-in'
                ? 'border-blue-400 bg-blue-900/20 text-blue-400'
                : 'border-gray-600 hover:border-gray-400'
            }`}
          >
            👀 One-Way In
          </button>
          <button
            onClick={() => setCurrentView('one-way-out')}
            className={`p-3 rounded border font-mono text-sm transition-all ${
              currentView === 'one-way-out'
                ? 'border-orange-400 bg-orange-900/20 text-orange-400'
                : 'border-gray-600 hover:border-gray-400'
            }`}
          >
            📤 One-Way Out
          </button>
        </div>

        {/* FID Input */}
        <div className="mb-6">
          <label className="block text-sm font-mono mb-2">FID to analyze:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={userFid}
              onChange={(e) => setUserFid(e.target.value)}
              className="flex-1 bg-black border border-gray-600 rounded px-3 py-2 font-mono text-green-400 focus:border-green-400 focus:outline-none"
              placeholder="Enter FID"
            />
            <LoadingButton
              onClick={handleAnalysis}
              loading={loading}
              disabled={!userFid.trim()}
              className="px-4 py-2 bg-green-900 border border-green-400 rounded font-mono text-green-400 hover:bg-green-800 disabled:opacity-50"
            >
              Analyze
            </LoadingButton>
          </div>
        </div>

        {/* Error */}
        {error && (
          <CRTErrorState message={error} onRetry={handleAnalysis} />
        )}

        {/* Loading */}
        {loading && (
          <NetworkAnalysisLoader 
            stage={`Analyzing ${currentView === 'one-way-in' ? 'followers' : 'following'}...`}
          />
        )}

        {/* Stats */}
        {analysisStats && !loading && (
          <div className="bg-gray-900 border border-gray-600 rounded p-4 mb-6 font-mono text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400">Followers:</div>
                <div className="text-green-400">{analysisStats.totalFollowers}</div>
              </div>
              <div>
                <div className="text-gray-400">Following:</div>
                <div className="text-green-400">{analysisStats.totalFollowing}</div>
              </div>
              <div>
                <div className="text-blue-400">One-way In:</div>
                <div className="text-blue-400">{analysisStats.oneWayIn}</div>
              </div>
              <div>
                <div className="text-orange-400">One-way Out:</div>
                <div className="text-orange-400">{analysisStats.oneWayOut}</div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {currentView === 'one-way-in' && oneWayInUsers.length > 0 && !loading && (
          <div className="space-y-3">
            <h3 className="font-mono text-blue-400 mb-3">👀 Users who follow you but you don&apos;t follow back:</h3>
            {oneWayInUsers.map((user) => (
              <div key={user.fid} className="bg-gray-900 border border-blue-400/30 rounded p-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={user.pfp_url} 
                    alt={user.display_name}
                    className="w-10 h-10 rounded border border-blue-400/50"
                  />
                  <div className="flex-1">
                    <div className="text-blue-400 font-mono text-sm">{user.display_name}</div>
                    <div className="text-blue-300 font-mono text-xs">@{user.username}</div>
                  </div>
                  <div className="text-xs font-mono text-blue-400">FID: {user.fid}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {currentView === 'one-way-out' && oneWayOutUsers.length > 0 && !loading && (
          <div className="space-y-3">
            <h3 className="font-mono text-orange-400 mb-3">📤 Users you follow but don&apos;t follow you back:</h3>
            {oneWayOutUsers.map((user) => (
              <div key={user.fid} className="bg-gray-900 border border-orange-400/30 rounded p-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={user.pfp_url} 
                    alt={user.display_name}
                    className="w-10 h-10 rounded border border-orange-400/50"
                  />
                  <div className="flex-1">
                    <div className="text-orange-400 font-mono text-sm">{user.display_name}</div>
                    <div className="text-orange-300 font-mono text-xs">@{user.username}</div>
                  </div>
                  <div className="text-xs font-mono text-orange-400">FID: {user.fid}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {analysisStats && !loading && (
          (currentView === 'one-way-in' && oneWayInUsers.length === 0) ||
          (currentView === 'one-way-out' && oneWayOutUsers.length === 0)
        ) && (
          <CRTEmptyState 
            title={`No ${currentView === 'one-way-in' ? 'one-way followers' : 'one-way following'} found`}
            message="Your relationships are balanced!"
          />
        )}
      </div>
    </div>
  )
}
