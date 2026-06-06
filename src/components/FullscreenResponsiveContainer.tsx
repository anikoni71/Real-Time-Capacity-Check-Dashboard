import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { useFullscreenContext } from '../contexts/FullscreenContext';

export const FullscreenResponsiveContainer = ({ minHeight, ...props }: any) => {
  const isFullscreen = useFullscreenContext();
  const calculatedMinHeight = isFullscreen ? (minHeight || 600) : (minHeight || 300);
  
  return (
    <ResponsiveContainer 
      minHeight={calculatedMinHeight} 
      {...props} 
      key={`fs-container-${isFullscreen ? 'active' : 'inactive'}-${props.height || 'auto'}`} 
    />
  );
};
