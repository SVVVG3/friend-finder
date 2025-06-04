'use client'

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "../../components/Nav";
import { CacheProvider } from "../components/CacheProvider";
import { FrameProvider } from "../components/FrameProvider";
import { AnalysisProvider } from "../components/AnalysisProvider";
import { BackgroundAnalysisIndicator } from "../components/BackgroundAnalysisIndicator";
import React, { Component, ReactNode } from 'react'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Friend Finder | Farcaster Network Analysis",
  description: "Discover warm connections and analyze one-way follows in your Farcaster network",
  keywords: ["Farcaster", "Web3", "Social Network", "Crypto", "Friends", "Networking"],
  authors: [{ name: "Friend Finder" }],
  creator: "Friend Finder",
  publisher: "Friend Finder",
  robots: "index, follow",
  manifest: "/manifest.json",
  openGraph: {
    title: "Friend Finder | Farcaster Network Analysis",
    description: "Discover warm connections and analyze one-way follows in your Farcaster network",
    type: "website",
    locale: "en_US",
    images: ["/FriendFinderEmbed.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Friend Finder | Farcaster Network Analysis",
    description: "Discover warm connections and analyze one-way follows in your Farcaster network",
    images: ["/FriendFinderEmbed.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Friend Finder",
  },
  other: {
    "fc:frame": JSON.stringify({
      "version": "next",
      "imageUrl": "https://farcaster-friend-finder.vercel.app/FriendFinderEmbed.png",
      "button": {
        "title": "🔍 Analyze Network",
        "action": {
          "type": "launch_frame",
          "name": "Friend Finder",
          "url": "https://farcaster-friend-finder.vercel.app",
          "splashImageUrl": "https://farcaster-friend-finder.vercel.app/FriendFinderSplashImage.png",
          "splashBackgroundColor": "#000000"
        }
      }
    })
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

// Error Boundary to catch JavaScript errors that could cause black screens
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: any
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark overflow-x-hidden">
      <head>
        <title>Friend Finder - Farcaster Network Analysis</title>
        <meta name="description" content="Discover warm connections and analyze your Farcaster network relationships" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Friend Finder - Farcaster Network Analysis" />
        <meta property="og:description" content="Discover warm connections and analyze your Farcaster network relationships" />
        <meta property="og:image" content="https://farcaster-friend-finder.vercel.app/FriendFinderEmbed.png" />
        <meta property="og:url" content="https://farcaster-friend-finder.vercel.app" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Friend Finder - Farcaster Network Analysis" />
        <meta name="twitter:description" content="Discover warm connections and analyze your Farcaster network relationships" />
        <meta name="twitter:image" content="https://farcaster-friend-finder.vercel.app/FriendFinderEmbed.png" />
        
        {/* Apple Web App Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Friend Finder" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black min-h-screen text-green-400 overflow-x-hidden w-full pb-20 sm:pb-24`}
      >
        <FrameProvider>
          <CacheProvider>
            <AnalysisProvider>
              <BackgroundAnalysisIndicator />
              <ErrorBoundary>
                <main className="min-h-screen w-full overflow-x-hidden">
                  {children}
                </main>
              </ErrorBoundary>
              <Nav />
            </AnalysisProvider>
          </CacheProvider>
        </FrameProvider>
      </body>
    </html>
  );
}
