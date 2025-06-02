import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "../../components/Nav";

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
  },
  twitter: {
    card: "summary_large_image",
    title: "Friend Finder | Farcaster Network Analysis",
    description: "Discover warm connections and analyze one-way follows in your Farcaster network",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Friend Finder",
  },
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black min-h-screen text-green-400 overflow-x-hidden w-full pb-20 sm:pb-24`}
      >
        <main className="min-h-screen w-full overflow-x-hidden">
          {children}
        </main>
        <Nav />
      </body>
    </html>
  );
}
