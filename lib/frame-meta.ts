// Utility for generating Farcaster Frame embed meta tags
export interface FrameEmbedConfig {
  imageUrl: string
  buttonTitle: string
  actionUrl: string
  appName: string
  splashImageUrl: string
  splashBackgroundColor: string
}

export const generateFrameEmbed = (config: FrameEmbedConfig) => {
  const frameEmbed = {
    version: "next",
    imageUrl: config.imageUrl,
    button: {
      title: config.buttonTitle,
      action: {
        type: "launch_frame",
        name: config.appName,
        url: config.actionUrl,
        splashImageUrl: config.splashImageUrl,
        splashBackgroundColor: config.splashBackgroundColor
      }
    }
  }
  
  return JSON.stringify(frameEmbed)
}

// Default configurations for each page
export const frameConfigs = {
  warmRecs: {
    imageUrl: "/FriendFinderEmbed.png",
    buttonTitle: "🔍 Find Warm Connections",
    actionUrl: "https://your-domain.com/warm-recs",
    appName: "Friend Finder",
    splashImageUrl: "/FriendFinderSplashImage.png",
    splashBackgroundColor: "#000000"
  },
  oneWayIn: {
    imageUrl: "/FriendFinderEmbed.png", 
    buttonTitle: "👈 See Who Follows You",
    actionUrl: "https://your-domain.com/one-way-in",
    appName: "Friend Finder",
    splashImageUrl: "/FriendFinderSplashImage.png",
    splashBackgroundColor: "#000000"
  },
  oneWayOut: {
    imageUrl: "/FriendFinderEmbed.png",
    buttonTitle: "👉 See Who You Follow",  
    actionUrl: "https://your-domain.com/one-way-out",
    appName: "Friend Finder",
    splashImageUrl: "/FriendFinderSplashImage.png",
    splashBackgroundColor: "#000000"
  }
}

// Generate meta tags as React Head elements
export const getFrameMetaTags = (pageType: keyof typeof frameConfigs) => {
  const config = frameConfigs[pageType]
  const frameEmbedString = generateFrameEmbed(config)
  
  return [
    { name: 'fc:frame', content: frameEmbedString },
    { property: 'og:image', content: config.imageUrl },
    { property: 'og:title', content: 'Friend Finder - Farcaster Network Analysis' },
    { property: 'og:description', content: 'Discover warm connections and manage your Farcaster network relationships' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:image', content: config.imageUrl }
  ]
} 