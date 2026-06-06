import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { useFullscreenContext } from '../contexts/FullscreenContext';

export const FullscreenResponsiveContainer = ({ minHeight, ...props }: any) => {
  const isFullscreen = useFullscreenContext();
  
  return (
    <ResponsiveContainer 
      {...props} 
      key={`fs-container-${isFullscreen ? 'fullscreen' : 'normal'}`} 
    />
  );
};
