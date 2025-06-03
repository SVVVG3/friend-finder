'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sdk } from '@farcaster/frame-sdk'

export default function HomePage() {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)
  const [debugInfo, setDebugInfo] = useState('Initializing...')

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
        setDebugInfo('✅ Ready called, waiting before redirect...')
        
        // Wait a moment to ensure ready() has taken effect, then redirect
        setTimeout(() => {
          console.log('📍 Redirecting to one-way-in page...')
          setDebugInfo('📍 Redirecting...')
          router.push('/one-way-in')
        }, 500)
        
      } catch (error) {
        console.error('❌ Failed to call frame ready:', error)
        console.error('❌ Error details:', JSON.stringify(error))
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setDebugInfo(`❌ Error: ${errorMessage}`)
        
        // Still redirect even if ready() fails
        setTimeout(() => {
          console.log('⚠️ Redirecting despite error...')
          router.push('/one-way-in')
        }, 1000)
      }
    }

    initializeFrame()
  }, [router])

  return (
    <div className="min-h-screen bg-black text-green-400 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-2xl font-mono mb-4">🔍 Friend Finder</div>
        <div className="text-sm font-mono opacity-70 mb-4">
          {isReady ? 'Loading network analysis...' : 'Initializing mini app...'}
        </div>
        <div className="text-xs font-mono opacity-50 bg-gray-900 p-2 rounded border">
          {debugInfo}
        </div>
      </div>
    </div>
  )
}
