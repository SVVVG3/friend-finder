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

  // Base styles that are consistent between server and client
  const baseNavClasses = "flex items-center gap-1 px-2 sm:px-4 py-3 sm:py-2 rounded-md transition-all duration-200 font-mono text-xs sm:text-base md:text-lg min-h-[44px] flex-1 sm:flex-none justify-center"
  const defaultClasses = "text-green-600 hover:bg-green-400/10 border border-transparent"

  // Active styles only apply after hydration to prevent mismatch
  const getActiveClasses = (path: string) => {
    if (!isClient) return defaultClasses
    
    if (pathname === path) {
      switch (path) {
        case '/one-way-in':
          return 'bg-blue-400/20 text-blue-400 border border-blue-400 shadow-lg shadow-blue-400/20'
        case '/one-way-out':
          return 'bg-orange-400/20 text-orange-400 border border-orange-400 shadow-lg shadow-orange-400/20'
        case '/warm-recs':
          return 'bg-green-400/20 text-green-400 border border-green-400 shadow-lg shadow-green-400/20'
        default:
          return defaultClasses
      }
    }
    
    // Hover states for non-active items
    switch (path) {
      case '/one-way-in':
        return 'text-green-600 hover:text-blue-400 hover:bg-blue-400/10 border border-transparent hover:border-blue-600'
      case '/one-way-out':
        return 'text-green-600 hover:text-orange-400 hover:bg-orange-400/10 border border-transparent hover:border-orange-600'
      case '/warm-recs':
        return 'text-green-600 hover:text-green-400 hover:bg-green-400/10 border border-transparent hover:border-green-600'
      default:
        return defaultClasses
    }
  }

  return (
    <nav className="bg-black border-b border-green-600 mb-4 sm:mb-6 sticky top-0 z-50 w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-3 w-full">
        {/* Mobile-first navigation layout */}
        <div className="flex items-center justify-center gap-1 sm:gap-4 md:gap-8 w-full">
          {/* One-Way In - Primary Focus */}
          <Link 
            href="/one-way-in"
            className={`${baseNavClasses} ${getActiveClasses('/one-way-in')}`}
          >
            <span className="text-sm sm:text-xl">←</span>
            <span className="hidden sm:inline">Follow In</span>
            <span className="sm:hidden text-xs">In</span>
          </Link>

          {/* One-Way Out */}
          <Link 
            href="/one-way-out"
            className={`${baseNavClasses} ${getActiveClasses('/one-way-out')}`}
          >
            <span className="text-sm sm:text-xl">→</span>
            <span className="hidden sm:inline">Follow Out</span>
            <span className="sm:hidden text-xs">Out</span>
          </Link>

          {/* Warm Recommendations */}
          <Link 
            href="/warm-recs"
            className={`${baseNavClasses} ${getActiveClasses('/warm-recs')}`}
          >
            <span className="text-sm sm:text-xl">🏠</span>
            <span className="hidden sm:inline">Warm Recs</span>
            <span className="sm:hidden text-xs">Recs</span>
          </Link>
        </div>

        {/* Breadcrumb / Current Page Info - Mobile Optimized */}
        {isClient && (
          <div className="text-center mt-2 px-2 w-full">
            {pathname === '/one-way-in' && (
              <p className="text-blue-600 text-xs sm:text-sm font-mono leading-relaxed">
                🌟 People who follow you but you don't follow back
              </p>
            )}
            {pathname === '/one-way-out' && (
              <p className="text-orange-600 text-xs sm:text-sm font-mono leading-relaxed">
                🔍 People you follow who don't follow back
              </p>
            )}
            {pathname === '/warm-recs' && (
              <p className="text-green-600 text-xs sm:text-sm font-mono leading-relaxed">
                💡 Find warm connections through mutual follows
              </p>
            )}
          </div>
        )}
      </div>
    </nav>
  )
} 