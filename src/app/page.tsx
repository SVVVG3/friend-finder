'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sdk } from '@farcaster/frame-sdk'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const initializeAndRedirect = async () => {
      try {
        console.log('🚀 HOME PAGE: Calling sdk.actions.ready() to dismiss splash screen')
        
        // Call ready immediately to dismiss splash screen
        await sdk.actions.ready()
        console.log('✅ Frame ready called successfully - splash screen dismissed')
        
        // Redirect to the main app functionality
        console.log('🎯 Redirecting to /one-way-in...')
        router.push('/one-way-in')
        
      } catch (error) {
        console.error('❌ Failed to initialize frame:', error)
        // Even if frame ready fails, still redirect to main app
        router.push('/one-way-in')
      }
    }

    initializeAndRedirect()
  }, [router])

  // Show loading screen while redirecting
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
