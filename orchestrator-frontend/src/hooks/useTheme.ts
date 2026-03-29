import { useState, useEffect, useCallback, useRef } from 'react';
import { isElectron, electronTheme } from '@/utils/electron';

type Theme = 'light' | 'dark' | 'system';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('o-theme') as Theme | null;
    return stored || 'system';
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  // ─── Electron native theme sync ─────────────────────────────────────────
  // When running inside Electron and the user has chosen "system" theme,
  // subscribe to OS-level theme changes via the IPC bridge instead of
  // (or in addition to) the CSS media query, which may not fire reliably in
  // Electron's sandboxed renderer.
  const electronUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isElectron()) return;
    if (theme !== 'system') return;

    const bridge = electronTheme();
    if (!bridge) return;

    // Fetch the current native theme immediately so the UI is in sync.
    bridge.getNativeTheme().then((nativeTheme) => {
      document.documentElement.classList.toggle('dark', nativeTheme === 'dark');
    }).catch(() => {
      // Non-critical — fall back to CSS media query result already applied.
    });

    // Subscribe to future OS-level changes.
    const unsubscribe = bridge.onThemeChange((nativeTheme) => {
      document.documentElement.classList.toggle('dark', nativeTheme === 'dark');
    });

    electronUnsubRef.current = unsubscribe;

    return () => {
      if (electronUnsubRef.current) {
        electronUnsubRef.current();
        electronUnsubRef.current = null;
      }
    };
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem('o-theme', t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return {
    theme,
    setTheme,
    toggle,
    isDark: theme === 'dark' || (theme === 'system' && getSystemTheme() === 'dark'),
  };
}
