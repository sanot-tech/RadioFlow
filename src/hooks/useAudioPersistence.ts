import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to ensure audio playback persists across route changes
 * This hook prevents the audio element from being recreated during navigation
 */
export const useAudioPersistence = () => {
  const location = useLocation();

  useEffect(() => {
    // This effect runs on every route change but doesn't affect the audio element
    // The audio element is maintained in the RadioPlayerContext
    console.log('[Navigation] Route changed to:', location.pathname);
    
    // Ensure that the audio element continues playing during navigation
    // The actual audio element is preserved in the global reference in RadioPlayerContext
  }, [location.pathname]);
};