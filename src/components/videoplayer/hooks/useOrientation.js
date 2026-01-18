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
