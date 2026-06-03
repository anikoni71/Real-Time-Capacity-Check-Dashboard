import { createContext, useContext } from 'react';

export const FullscreenContext = createContext(false);
export const useFullscreenContext = () => useContext(FullscreenContext);
