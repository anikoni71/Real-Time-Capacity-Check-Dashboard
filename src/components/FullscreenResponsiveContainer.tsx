import React, { useState, useEffect } from 'react';
import { ResponsiveContainer } from 'recharts';
import { useFullscreenContext } from '../contexts/FullscreenContext';

export const FullscreenResponsiveContainer = ({ minHeight, height, width, ...props }: any) => {
  const isFullscreen = useFullscreenContext();
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call to catch layout shifts
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // For fullscreen, feed exact numeric pixel sizes to bypass Recharts calculation failure
  const calculatedMinHeight = isFullscreen ? (minHeight || windowSize.height * 0.8) : (minHeight || 300);
  const finalWidth = isFullscreen ? windowSize.width * 0.95 : (width || "100%");
  const finalHeight = isFullscreen ? (typeof height === 'number' && height > windowSize.height * 0.8 ? height : windowSize.height * 0.8) : (height || "100%");

  return (
    <ResponsiveContainer 
      width={finalWidth}
      height={finalHeight}
      minHeight={calculatedMinHeight} 
      {...props} 
      key={`fs-container-${isFullscreen ? 'active' : 'inactive'}-${windowSize.width}x${windowSize.height}`} 
    />
  );
};
