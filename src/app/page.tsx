'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sdk } from '@farcaster/frame-sdk'

export default function HomePage() {
  const router = useRouter()
  const [frameReady, setFrameReady] = useState(false)

  // 🚀 HIGHEST PRIORITY: Notify Farcaster frame is ready IMMEDIATELY
  useEffect(() => {
    const initializeFrame = async () => {
      try {
        console.log('🚀 HOME PAGE: Calling frame ready FIRST before redirect')
        await sdk.actions.ready()
        console.log('✅ Frame ready called successfully from home page - splash screen dismissed')
        setFrameReady(true)
      } catch (error) {
        console.error('❌ Failed to call frame ready from home page:', error)
        setFrameReady(true) // Continue anyway to avoid blocking
      }
    }
    
    initializeFrame()
  }, []) // Run once on mount - HIGHEST PRIORITY

  // Only redirect AFTER frame is ready
  useEffect(() => {
    if (frameReady) {
      console.log('📍 Frame ready, now redirecting to one-way-in...')
      // Small delay to ensure frame ready is fully processed
      setTimeout(() => {
        router.replace('/one-way-in')
      }, 100)
    }
  }, [frameReady, router])

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mb-4"></div>
        <p className="text-green-600 mb-2">🚀 Initializing Friend Finder...</p>
        <p className="text-green-500 text-sm">
          {frameReady ? 'Redirecting to analysis...' : 'Setting up mini app...'}
        </p>
      </div>
    </div>
  )
}
