import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { useFullscreenContext } from '../contexts/FullscreenContext';

export const FullscreenResponsiveContainer = (props: any) => {
  const isFullscreen = useFullscreenContext();
  return <ResponsiveContainer {...props} key={isFullscreen ? 'force-one-page' : 'normal'} />;
};
