import { useState, useEffect, useCallback } from 'react';

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

type Breakpoint = keyof typeof breakpoints;

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    setMatches(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useBreakpoint() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );

  useEffect(() => {
    let raf: number;
    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setWidth(window.innerWidth));
    };
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('resize', handler);
      cancelAnimationFrame(raf);
    };
  }, []);

  const isMobile = width < breakpoints.sm;
  const isTablet = width >= breakpoints.sm && width < breakpoints.lg;
  const isDesktop = width >= breakpoints.lg;

  const up = useCallback((bp: Breakpoint) => width >= breakpoints[bp], [width]);
  const down = useCallback((bp: Breakpoint) => width < breakpoints[bp], [width]);
  const between = useCallback(
    (min: Breakpoint, max: Breakpoint) =>
      width >= breakpoints[min] && width < breakpoints[max],
    [width],
  );

  const current: Breakpoint =
    width >= breakpoints['2xl'] ? '2xl' :
    width >= breakpoints.xl ? 'xl' :
    width >= breakpoints.lg ? 'lg' :
    width >= breakpoints.md ? 'md' :
    width >= breakpoints.sm ? 'sm' : 'xs';

  return { width, isMobile, isTablet, isDesktop, current, up, down, between };
}

export function useSafeArea() {
  const [insets, setInsets] = useState({ top: 0, right: 0, bottom: 0, left: 0 });

  useEffect(() => {
    const measure = () => {
      const style = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
        right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
        bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
        left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10),
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return insets;
}
