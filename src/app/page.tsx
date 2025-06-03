'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFrame } from '../components/FrameProvider'

export default function HomePage() {
  const router = useRouter()
  const { isFrameReady } = useFrame()

  useEffect(() => {
    if (isFrameReady) {
      console.log('🎯 Frame is ready, redirecting to /one-way-in...')
      router.push('/one-way-in')
    }
  }, [isFrameReady, router])

  // Show loading screen while waiting for frame to be ready
  return (
    <div className="min-h-screen bg-black text-green-400 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-2xl font-mono mb-4">🔍 Friend Finder</div>
        <div className="text-sm font-mono opacity-70 mb-4">
          Initializing mini app...
        </div>
        <div className="text-xs font-mono opacity-50">
          Loading Friend Finder network analysis
        </div>
      </div>
    </div>
  )
}
