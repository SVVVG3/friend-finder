'use client'

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "../../components/Nav";
import React, { createContext, useContext, useState, ReactNode } from 'react'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Types for cached data
interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  followerCount: number
  followingCount: number
  pfpUrl?: string
  bio?: string
}

interface UserWithMutuals {
  fid: number
  username: string
  displayName: string
  followerCount: number
  followingCount: number
  pfpUrl?: string
  bio?: string
  mutualConnectionCount: number
  mutualConnections: FarcasterUser[]
}

// Cache context type
interface CacheContextType {
  userFid: string
  followers: FarcasterUser[]
  following: FarcasterUser[]
  oneWayIn: FarcasterUser[]
  oneWayOut: FarcasterUser[]
  warmRecs: UserWithMutuals[]
  analysisStats: any
  lastAnalyzed: number
  setCache: (data: Partial<CacheContextType>) => void
  isCacheValid: () => boolean
}

// Create context
const CacheContext = createContext<CacheContextType | null>(null)

// Cache provider component
function CacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<Partial<CacheContextType>>({
    lastAnalyzed: 0
  })

  const updateCache = (data: Partial<CacheContextType>) => {
    setCache(prev => ({
      ...prev,
      ...data,
      lastAnalyzed: Date.now()
    }))
  }

  const isCacheValid = (): boolean => {
    const cacheAge = Date.now() - (cache.lastAnalyzed || 0)
    const maxAge = 5 * 60 * 1000 // 5 minutes
    return cacheAge < maxAge && Boolean(cache.userFid)
  }

  const contextValue: CacheContextType = {
    userFid: cache.userFid || '',
    followers: cache.followers || [],
    following: cache.following || [],
    oneWayIn: cache.oneWayIn || [],
    oneWayOut: cache.oneWayOut || [],
    warmRecs: cache.warmRecs || [],
    analysisStats: cache.analysisStats,
    lastAnalyzed: cache.lastAnalyzed || 0,
    setCache: updateCache,
    isCacheValid
  }

  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  )
}

// Hook to use cache
export function useCache() {
  const context = useContext(CacheContext)
  if (!context) {
    throw new Error('useCache must be used within CacheProvider')
  }
  return context
}

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
        
        {/* Farcaster Frame Meta Tags */}
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://farcaster-friend-finder.vercel.app/FriendFinderEmbed.png" />
        <meta property="fc:frame:button:1" content="🔍 Analyze Network" />
        <meta property="fc:frame:post_url" content="https://farcaster-friend-finder.vercel.app/api/frame" />
        
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
        <CacheProvider>
          <main className="min-h-screen w-full overflow-x-hidden">
            {children}
          </main>
          <Nav />
        </CacheProvider>
      </body>
    </html>
  );
}
