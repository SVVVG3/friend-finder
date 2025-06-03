'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { sdk } from '@farcaster/frame-sdk'

// Frame context type
interface FrameContextType {
  isFrameReady: boolean
  userFid: string
  error: string | null
}

// Create context
const FrameContext = createContext<FrameContextType | null>(null)

// Frame provider component
export function FrameProvider({ children }: { children: ReactNode }) {
  const [isFrameReady, setIsFrameReady] = useState(false)
  const [userFid, setUserFid] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Initialize frame and get user FID - only once per app lifecycle
  useEffect(() => {
    let hasCalledReady = false
    
    const initializeFrame = async () => {
      if (hasCalledReady) {
        console.log('🚫 Frame ready already called, skipping duplicate call')
        return
      }
      
      try {
        console.log('🚀 GLOBAL: Initializing Farcaster frame...')
        hasCalledReady = true
        
        // Call frame ready first
        await sdk.actions.ready()
        console.log('✅ GLOBAL: Frame ready called successfully - splash screen dismissed')
        
        // Get user context
        const context = await sdk.context
        const currentUserFid = context.user.fid
        
        if (currentUserFid) {
          console.log(`🔍 GLOBAL: Using current user's FID: ${currentUserFid}`)
          setUserFid(currentUserFid.toString())
        } else {
          console.log('⚠️ GLOBAL: No user FID available from SDK context')
          setError('No user FID available')
        }
        
        setIsFrameReady(true)
      } catch (err) {
        console.error('❌ GLOBAL: Failed to initialize frame:', err)
        setError(err instanceof Error ? err.message : 'Frame initialization failed')
        setIsFrameReady(true) // Continue anyway to avoid blocking
      }
    }
    
    initializeFrame()
  }, []) // Run once on mount

  const contextValue: FrameContextType = {
    isFrameReady,
    userFid,
    error
  }

  return (
    <FrameContext.Provider value={contextValue}>
      {children}
    </FrameContext.Provider>
  )
}

// Hook to use frame context
export function useFrame() {
  const context = useContext(FrameContext)
  if (!context) {
    throw new Error('useFrame must be used within FrameProvider')
  }
  return context
} 