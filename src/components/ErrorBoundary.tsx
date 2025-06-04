'use client'
import React, { Component, ReactNode, ErrorInfo } from 'react'

// Error Boundary to catch JavaScript errors that could cause black screens
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ERROR BOUNDARY CAUGHT:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h1 className="text-red-400 text-xl font-bold mb-4">Something went wrong</h1>
            <p className="text-red-300 text-sm mb-6 leading-relaxed">
              The app encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-900/50 hover:bg-red-800/50 border border-red-600 text-red-400 px-6 py-3 rounded-lg text-sm transition-all duration-200"
            >
              Refresh Page
            </button>
            
            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="text-red-300 cursor-pointer">Debug Info</summary>
                <pre className="text-red-200 text-xs mt-2 bg-red-900/20 p-2 rounded overflow-auto">
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
} 