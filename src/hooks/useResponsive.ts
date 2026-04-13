import { useState, useEffect } from 'react';

interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const defaultBreakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const useResponsive = (breakpoints: Partial<BreakpointConfig> = {}) => {
  const bp = { ...defaultBreakpoints, ...breakpoints };
  
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenSize.width < bp.md;
  const isTablet = screenSize.width >= bp.md && screenSize.width < bp.lg;
  const isDesktop = screenSize.width >= bp.lg;
  const isLargeDesktop = screenSize.width >= bp.xl;

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    breakpoints: bp,
  };
};