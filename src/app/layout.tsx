import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "../../components/Nav";
import { CacheProvider } from "../components/CacheProvider";
import { FrameProvider } from "../components/FrameProvider";
import { AnalysisProvider } from "../components/AnalysisProvider";
import { BackgroundAnalysisIndicator } from "../components/BackgroundAnalysisIndicator";

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
              <main className="min-h-screen w-full overflow-x-hidden">
                {children}
              </main>
              <Nav />
            </AnalysisProvider>
          </CacheProvider>
        </FrameProvider>
      </body>
    </html>
  );
}
