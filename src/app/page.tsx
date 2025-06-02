'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sdk } from '@farcaster/frame-sdk'

export default function HomePage() {
  const router = useRouter()
  const [frameReady, setFrameReady] = useState(false)
  const [isInMiniApp, setIsInMiniApp] = useState(false)

  // 🚀 HIGHEST PRIORITY: Notify Farcaster frame is ready IMMEDIATELY
  useEffect(() => {
    const initializeFrame = async () => {
      try {
        console.log('🚀 HOME PAGE: Initializing frame...')
        
        // Check if we're in a Mini App environment
        const inMiniApp = sdk ? await sdk.isInMiniApp() : false
        setIsInMiniApp(inMiniApp)
        
        console.log(`📱 Mini App Environment: ${inMiniApp}`)
        
        if (inMiniApp) {
          console.log('🚀 Calling frame ready in Mini App environment')
          await sdk.actions.ready()
          console.log('✅ Frame ready called successfully - splash screen dismissed')
        } else {
          console.log('🌐 Running in browser environment - skipping ready() call')
        }
        
        setFrameReady(true)
      } catch (error) {
        console.error('❌ Failed to call frame ready from home page:', error)
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
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
        {/* Debug info */}
        <div className="mt-4 text-xs text-green-600">
          <p>Environment: {isInMiniApp ? 'Mini App' : 'Browser'}</p>
          <p>Status: {frameReady ? 'Ready' : 'Initializing...'}</p>
        </div>
      </div>
    </div>
  )
}
