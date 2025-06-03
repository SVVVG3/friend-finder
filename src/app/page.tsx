'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sdk } from '@farcaster/frame-sdk'

export default function HomePage() {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  // 🚀 HIGHEST PRIORITY: Notify Farcaster frame is ready IMMEDIATELY
  useEffect(() => {
    const initializeFrame = async () => {
      try {
        console.log('🚀 HOME PAGE: Calling sdk.actions.ready() to dismiss splash screen')
        
        // Call ready immediately to dismiss splash screen
        await sdk.actions.ready()
        console.log('✅ Frame ready called successfully - splash screen should be dismissed')
        
        setIsReady(true)
        
        // Wait a moment to ensure ready() has taken effect, then redirect
        setTimeout(() => {
          console.log('📍 Redirecting to one-way-in page...')
          router.push('/one-way-in')
        }, 500)
        
      } catch (error) {
        console.error('❌ Failed to call frame ready:', error)
        // Still redirect even if ready() fails
        setTimeout(() => {
          router.push('/one-way-in')
        }, 1000)
      }
    }

    initializeFrame()
  }, [router])

  return (
    <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-mono mb-4">🔍 Friend Finder</div>
        <div className="text-sm font-mono opacity-70">
          {isReady ? 'Loading network analysis...' : 'Initializing mini app...'}
        </div>
      </div>
    </div>
  )
}
