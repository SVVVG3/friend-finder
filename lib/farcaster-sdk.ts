import frameSDK from '@farcaster/frame-sdk';

export const notifyFrameReady = async (): Promise<void> => {
  try {
    if (typeof window === 'undefined') {
      // Server-side rendering - skip
      return;
    }

    if (!frameSDK) {
      console.log('⚠️ Frame SDK not available - likely not running in Farcaster');
      return;
    }

    // Notify Farcaster that the frame is ready
    await frameSDK.actions.ready();
    console.log('🚀 Notified Farcaster that frame is ready');
  } catch (error) {
    console.error('❌ Failed to notify frame ready:', error);
  }
};

export const getFrameSDK = () => {
  return frameSDK;
};

// Helper to check if we're running inside Farcaster
export const isInFarcaster = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if we're in a Farcaster context
  return Boolean(
    window.frameElement || 
    window.top !== window.self ||
    navigator.userAgent.includes('Farcaster')
  );
}; 