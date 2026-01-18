import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile landscape orientation
 * Returns true when device is in landscape and width is less than 1024px
 */
export default function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const handleOrientationChange = () => {
      const isLandscapeOrientation = window.innerWidth > window.innerHeight && window.innerWidth < 1024;
      setIsLandscape(isLandscapeOrientation);
      
      // Try to hide address bar when entering landscape mode
      if (isLandscapeOrientation) {
        // Request fullscreen on the document body
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {
            // Fallback: just scroll to hide address bar
            window.scrollTo(0, 1);
          });
        } else {
          window.scrollTo(0, 1);
        }
      } else if (document.fullscreenElement) {
        // Exit fullscreen when leaving landscape
        document.exitFullscreen();
      }
    };

    handleOrientationChange(); // Check initial orientation
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return isLandscape;
}
