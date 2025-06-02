'use client'

import React from 'react'

// Enhanced CRT Loading Spinner
export function CRTSpinner({ 
  size = 'md', 
  className = '',
  message = 'Loading...'
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  message?: string
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`crt-spinner ${sizeClasses[size]} mb-3`}></div>
      <p className="text-green-400 font-mono text-sm crt-text-glow">
        {message}<span className="crt-loading-dots"></span>
      </p>
    </div>
  )
}

// Network Analysis Loading State
export function NetworkAnalysisLoader({
  stage = 'Initializing',
  progress = 0,
  className = ''
}: {
  stage?: string
  progress?: number
  className?: string
}) {
  return (
    <div className={`text-center py-8 px-4 ${className}`}>
      <div className="crt-network-animation inline-block mb-4">
        <div className="h-16 w-16 border-2 border-green-400/30 rounded-full relative crt-glow">
          <div className="absolute inset-2 border border-green-400/60 rounded-full crt-pulse">
            <div className="absolute inset-2 bg-green-400/20 rounded-full"></div>
          </div>
        </div>
      </div>
      
      <div className="text-green-400 text-lg font-bold font-mono mb-2 crt-text-glow">
        🌐 Network Analysis
      </div>
      
      <div className="text-green-300 text-sm mb-4 font-mono">
        {stage}<span className="crt-typing-cursor">|</span>
      </div>
      
      {progress > 0 && (
        <div className="max-w-xs mx-auto">
          <div className="crt-progress-bar h-2 mb-2">
            <div 
              className="crt-progress-fill h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-green-600 text-xs font-mono">
            {progress}% Complete
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced Card Skeleton with CRT Effects
export function CRTCardSkeleton({ 
  count = 3,
  className = ''
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="bg-black border border-green-400/30 rounded-lg p-4 loading-enhanced crt-glow"
        >
          {/* Header with avatar and info */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-full crt-shimmer flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 crt-shimmer rounded w-3/4"></div>
              <div className="h-3 crt-shimmer rounded w-1/2"></div>
            </div>
            <div className="w-20 h-9 crt-shimmer rounded"></div>
          </div>
          
          {/* Bio section */}
          <div className="mb-3 p-3 bg-green-400/5 rounded border-l-2 border-green-600/30">
            <div className="space-y-2">
              <div className="h-3 crt-shimmer rounded w-full"></div>
              <div className="h-3 crt-shimmer rounded w-4/5"></div>
            </div>
          </div>
          
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="h-3 crt-shimmer rounded mb-1"></div>
              <div className="h-4 crt-shimmer rounded w-16 mx-auto"></div>
            </div>
            <div className="text-center">
              <div className="h-3 crt-shimmer rounded mb-1"></div>
              <div className="h-4 crt-shimmer rounded w-16 mx-auto"></div>
            </div>
            <div className="text-center">
              <div className="h-3 crt-shimmer rounded mb-1"></div>
              <div className="h-4 crt-shimmer rounded w-16 mx-auto"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// API Progress Tracker
export function APIProgressTracker({
  currentPage = 0,
  totalPages = 0,
  itemsPerPage = 100,
  operation = 'Fetching data',
  className = ''
}: {
  currentPage?: number
  totalPages?: number
  itemsPerPage?: number
  operation?: string
  className?: string
}) {
  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0
  const totalItems = currentPage * itemsPerPage

  return (
    <div className={`bg-gray-900/50 border border-green-600/50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-green-400 font-mono text-sm font-bold">
          📡 API Progress
        </div>
        <div className="text-green-300 font-mono text-xs">
          Page {currentPage}/{totalPages}
        </div>
      </div>
      
      <div className="crt-progress-bar h-3 mb-3">
        <div 
          className="crt-progress-fill h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-xs font-mono">
        <span className="text-green-600">{operation}</span>
        <span className="text-green-400">{totalItems.toLocaleString()} items</span>
      </div>
    </div>
  )
}

// Button Loading State
export function LoadingButton({
  loading = false,
  children,
  className = '',
  disabled = false,
  ...props
}: {
  loading?: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
  [key: string]: any
}) {
  return (
    <button
      className={`
        ${loading ? 'btn-loading' : ''} 
        ${className}
        ${loading || disabled ? 'opacity-75 cursor-not-allowed' : ''}
        transition-all duration-200
      `}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 crt-spinner"></div>
          <span className="crt-loading-dots">Processing</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}

// Error State with Retry
export function CRTErrorState({
  title = 'Error',
  message = 'Something went wrong',
  onRetry,
  retryLabel = 'Try Again',
  className = ''
}: {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}) {
  return (
    <div className={`text-center py-8 px-4 ${className}`}>
      <div className="text-red-400 text-6xl mb-4 crt-pulse">⚠️</div>
      <div className="text-red-400 text-lg font-bold font-mono mb-2 crt-text-glow">
        {title}
      </div>
      <div className="text-red-300 text-sm mb-6 max-w-md mx-auto leading-relaxed font-mono">
        {message}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-900/50 hover:bg-red-800/50 border border-red-600 text-red-400 px-6 py-3 rounded-lg font-mono text-sm crt-glow hover:crt-glow-strong transition-all duration-200"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}

// Empty State
export function CRTEmptyState({
  icon = '📭',
  title = 'No Data Found',
  message = 'Try adjusting your search criteria',
  action,
  actionLabel,
  className = ''
}: {
  icon?: string
  title?: string
  message?: string
  action?: () => void
  actionLabel?: string
  className?: string
}) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="text-6xl mb-4 crt-network-animation">{icon}</div>
      <div className="text-green-400 text-lg font-bold font-mono mb-2">
        {title}
      </div>
      <div className="text-green-600 text-sm mb-6 max-w-md mx-auto leading-relaxed font-mono">
        {message}
      </div>
      {action && actionLabel && (
        <button
          onClick={action}
          className="bg-green-900/50 hover:bg-green-800/50 border border-green-600 text-green-400 px-6 py-3 rounded-lg font-mono text-sm crt-glow hover:crt-glow-strong transition-all duration-200"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

// Success State
export function CRTSuccessState({
  title = 'Success!',
  message = 'Operation completed successfully',
  action,
  actionLabel,
  className = ''
}: {
  title?: string
  message?: string
  action?: () => void
  actionLabel?: string
  className?: string
}) {
  return (
    <div className={`text-center py-8 px-4 ${className}`}>
      <div className="text-green-400 text-6xl mb-4 crt-pulse">✅</div>
      <div className="text-green-400 text-lg font-bold font-mono mb-2 crt-text-glow">
        {title}
      </div>
      <div className="text-green-300 text-sm mb-6 max-w-md mx-auto leading-relaxed font-mono">
        {message}
      </div>
      {action && actionLabel && (
        <button
          onClick={action}
          className="bg-green-900/50 hover:bg-green-800/50 border border-green-600 text-green-400 px-6 py-3 rounded-lg font-mono text-sm crt-glow hover:crt-glow-strong transition-all duration-200"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

// Loading overlay for full screen
export function CRTLoadingOverlay({
  message = 'Processing...',
  visible = false,
  children
}: {
  message?: string
  visible?: boolean
  children?: React.ReactNode
}) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-black border border-green-600 rounded-lg p-8 max-w-sm mx-4 crt-glow">
        <CRTSpinner size="lg" message={message} />
        {children}
      </div>
    </div>
  )
} 