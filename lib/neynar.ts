import { NeynarAPIClient } from '@neynar/nodejs-sdk'

const apiKey = process.env.NEYNAR_API_KEY

if (!apiKey) {
  throw new Error('NEYNAR_API_KEY environment variable is required')
}

// Initialize Neynar client with proper configuration
export const neynar = new NeynarAPIClient({ 
  apiKey: apiKey 
})

// Export the client for use throughout the app
export default neynar 