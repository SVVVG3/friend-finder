'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Nav() {
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Base styles for bottom navigation tabs
  const baseNavClasses = "flex flex-col items-center justify-center py-2 px-1 sm:px-2 transition-all duration-200 font-mono text-xs sm:text-sm min-h-[60px] flex-1 rounded-lg"
  const defaultClasses = "text-green-600/70 hover:text-green-400 hover:bg-green-400/10"

  // Active styles only apply after hydration to prevent mismatch
  const getActiveClasses = (path: string) => {
    if (!isClient) return defaultClasses
    
    if (pathname === path) {
      switch (path) {
        case '/one-way-in':
          return 'bg-blue-400/20 text-blue-400 border border-blue-400/50 shadow-lg shadow-blue-400/10'
        case '/one-way-out':
          return 'bg-orange-400/20 text-orange-400 border border-orange-400/50 shadow-lg shadow-orange-400/10'
        default:
          return defaultClasses
      }
    }
    
    // Hover states for non-active items
    switch (path) {
      case '/one-way-in':
        return 'text-green-600/70 hover:text-blue-400 hover:bg-blue-400/10 border border-transparent hover:border-blue-600/30'
      case '/one-way-out':
        return 'text-green-600/70 hover:text-orange-400 hover:bg-orange-400/10 border border-transparent hover:border-orange-600/30'
      default:
        return defaultClasses
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-green-600/50 px-2 py-2 sm:py-3">
      {/* Bottom navigation container */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          {/* Followers - One-Way In */}
          <Link 
            href="/one-way-in"
            className={`${baseNavClasses} ${getActiveClasses('/one-way-in')}`}
          >
            <span className="text-xs sm:text-sm font-bold">Followers</span>
            {isClient && pathname === '/one-way-in' && (
              <div className="w-1 h-1 bg-blue-400 rounded-full mt-1"></div>
            )}
          </Link>

          {/* Following - One-Way Out */}
          <Link 
            href="/one-way-out"
            className={`${baseNavClasses} ${getActiveClasses('/one-way-out')}`}
          >
            <span className="text-xs sm:text-sm font-bold">Following</span>
            {isClient && pathname === '/one-way-out' && (
              <div className="w-1 h-1 bg-orange-400 rounded-full mt-1"></div>
            )}
          </Link>
        </div>
      </div>
    </nav>
  )
} 