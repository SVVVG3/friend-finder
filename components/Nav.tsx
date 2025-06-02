'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="bg-black border-b border-green-600 mb-6">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-8">
          {/* Home / Recommendations */}
          <Link 
            href="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-mono text-lg ${
              pathname === '/' 
                ? 'bg-green-400/20 text-green-400 border border-green-400 shadow-lg shadow-green-400/20' 
                : 'text-green-600 hover:text-green-400 hover:bg-green-400/10 border border-transparent hover:border-green-600'
            }`}
          >
            <span className="text-xl">🏠</span>
            <span>Warm Recs</span>
          </Link>

          {/* One-Way Analysis */}
          <div className="flex items-center gap-2">
            <Link 
              href="/one-way-out"
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 font-mono text-sm ${
                pathname === '/one-way-out' 
                  ? 'bg-orange-400/20 text-orange-400 border border-orange-400 shadow-lg shadow-orange-400/20' 
                  : 'text-green-600 hover:text-orange-400 hover:bg-orange-400/10 border border-transparent hover:border-orange-600'
              }`}
            >
              <span className="text-base">→</span>
              <span>Out</span>
            </Link>

            <Link 
              href="/one-way-in"
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 font-mono text-sm ${
                pathname === '/one-way-in' 
                  ? 'bg-blue-400/20 text-blue-400 border border-blue-400 shadow-lg shadow-blue-400/20' 
                  : 'text-green-600 hover:text-blue-400 hover:bg-blue-400/10 border border-transparent hover:border-blue-600'
              }`}
            >
              <span className="text-base">←</span>
              <span>In</span>
            </Link>
          </div>
        </div>

        {/* Breadcrumb / Current Page Info */}
        <div className="text-center mt-2">
          {pathname === '/' && (
            <p className="text-green-600 text-xs font-mono">
              💡 Find warm connections through mutual follows
            </p>
          )}
          {pathname === '/one-way-out' && (
            <p className="text-orange-600 text-xs font-mono">
              🔍 People you follow who don't follow back
            </p>
          )}
          {pathname === '/one-way-in' && (
            <p className="text-blue-600 text-xs font-mono">
              🌟 People who follow you but you don't follow back
            </p>
          )}
        </div>
      </div>
    </nav>
  )
} 