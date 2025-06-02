import { sdk } from '@farcaster/frame-sdk';

export const notifyFrameReady = async (): Promise<void> => {
  try {
    if (typeof window === 'undefined') {
      // Server-side rendering - skip
      return;
    }

    if (!sdk) {
      console.log('⚠️ Frame SDK not available - likely not running in Farcaster');
      return;
    }

    // Notify Farcaster that the frame is ready
    await sdk.actions.ready();
    console.log('🚀 Notified Farcaster that frame is ready');
  } catch (error) {
    console.error('❌ Failed to notify frame ready:', error);
  }
};

export const getFrameSDK = () => {
  return sdk;
};

// Helper to check if we're running inside Farcaster
export const isInFarcaster = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Use the official SDK method to detect Mini App environment
    return await sdk.isInMiniApp();
  } catch (error) {
    console.error('Failed to check if in Mini App:', error);
    // Fallback to basic checks
    return Boolean(
      window.frameElement || 
      window.top !== window.self ||
      navigator.userAgent.includes('Farcaster')
    );
  }
}; 