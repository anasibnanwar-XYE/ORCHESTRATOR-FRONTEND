 /**
  * useTheme.test.ts
  *
  * Tests for the useTheme hook, covering:
  *   - Light / dark mode toggling
  *   - Theme persistence to localStorage
  *   - Electron native theme sync (system theme)
  *   - Cleanup of Electron listener on unmount / theme change
  */
 
 import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
 import { renderHook, act } from '@testing-library/react';
 import { useTheme } from '../useTheme';
 
// ─── localStorage mock ───────────────────────────────────────────────────────
// jsdom's localStorage implementation may not expose `clear` in all setups.
// We provide a simple in-memory mock for predictable test isolation.
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// ─── window.matchMedia mock ──────────────────────────────────────────────────
// jsdom does not implement matchMedia; provide a minimal stub so the hook
// can call it without throwing.
const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
  matches: false, // default: light mode
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, writable: true });

 // ─── Helpers ─────────────────────────────────────────────────────────────────
 
 function setWindowElectron(value: Window['electron']) {
   Object.defineProperty(window, 'electron', {
     value,
     writable: true,
     configurable: true,
   });
 }
 
 function getHtmlClass() {
   return document.documentElement.classList.contains('dark');
 }
 
 // ─── Tests ───────────────────────────────────────────────────────────────────
 
 describe('useTheme', () => {
   beforeEach(() => {
     localStorage.clear();
     document.documentElement.classList.remove('dark');
     // Default: no Electron
     setWindowElectron(undefined);
   });
 
   afterEach(() => {
     localStorage.clear();
     document.documentElement.classList.remove('dark');
     setWindowElectron(undefined);
   });
 
   it('defaults to light theme when nothing is stored', () => {
     const { result } = renderHook(() => useTheme());
     expect(result.current.theme).toBe('light');
     expect(getHtmlClass()).toBe(false);
   });
 
   it('restores stored theme from localStorage on mount', () => {
     localStorage.setItem('o-theme', 'dark');
     const { result } = renderHook(() => useTheme());
     expect(result.current.theme).toBe('dark');
     expect(getHtmlClass()).toBe(true);
   });
 
   it('toggle switches from light to dark', () => {
     const { result } = renderHook(() => useTheme());
     act(() => result.current.toggle());
     expect(result.current.theme).toBe('dark');
     expect(getHtmlClass()).toBe(true);
   });
 
   it('toggle switches from dark to light', () => {
     localStorage.setItem('o-theme', 'dark');
     const { result } = renderHook(() => useTheme());
     act(() => result.current.toggle());
     expect(result.current.theme).toBe('light');
     expect(getHtmlClass()).toBe(false);
   });
 
   it('setTheme persists choice to localStorage', () => {
     const { result } = renderHook(() => useTheme());
     act(() => result.current.setTheme('dark'));
     expect(localStorage.getItem('o-theme')).toBe('dark');
   });
 
   describe('Electron native theme sync', () => {
     it('calls getNativeTheme when theme is "system" inside Electron', async () => {
       const getNativeTheme = vi.fn().mockResolvedValue('dark');
       const onThemeChange = vi.fn().mockReturnValue(vi.fn()); // returns unsub fn
 
       setWindowElectron({
         theme: { getNativeTheme, onThemeChange },
       });
 
       localStorage.setItem('o-theme', 'system');
       renderHook(() => useTheme());
 
       // getNativeTheme is called asynchronously inside the effect
       await vi.waitFor(() => {
         expect(getNativeTheme).toHaveBeenCalledOnce();
       });
     });
 
     it('subscribes to onThemeChange when theme is "system" inside Electron', async () => {
       const getNativeTheme = vi.fn().mockResolvedValue('light');
       const unsubscribe = vi.fn();
       const onThemeChange = vi.fn().mockReturnValue(unsubscribe);
 
       setWindowElectron({
         theme: { getNativeTheme, onThemeChange },
       });
 
       localStorage.setItem('o-theme', 'system');
       const { unmount } = renderHook(() => useTheme());
 
       await vi.waitFor(() => {
         expect(onThemeChange).toHaveBeenCalledOnce();
       });
 
       // Unsubscribe must be called on unmount to prevent memory leaks
       unmount();
       expect(unsubscribe).toHaveBeenCalledOnce();
     });
 
     it('does NOT call electronTheme when theme is not "system"', () => {
       const getNativeTheme = vi.fn().mockResolvedValue('dark');
       const onThemeChange = vi.fn().mockReturnValue(vi.fn());
 
       setWindowElectron({
         theme: { getNativeTheme, onThemeChange },
       });
 
       // Theme is 'light', not 'system' — bridge should not be called
       localStorage.setItem('o-theme', 'light');
       renderHook(() => useTheme());
 
       expect(getNativeTheme).not.toHaveBeenCalled();
       expect(onThemeChange).not.toHaveBeenCalled();
     });
 
     it('does NOT call electronTheme when not running in Electron', () => {
       setWindowElectron(undefined);
 
       const getNativeTheme = vi.fn();
       const onThemeChange = vi.fn().mockReturnValue(vi.fn());
       // window.electron is undefined so bridge is never reached
 
       localStorage.setItem('o-theme', 'system');
       renderHook(() => useTheme());
 
       expect(getNativeTheme).not.toHaveBeenCalled();
       expect(onThemeChange).not.toHaveBeenCalled();
     });
 
     it('unsubscribes previous Electron listener when theme changes away from "system"', async () => {
       const unsubscribe = vi.fn();
       const onThemeChange = vi.fn().mockReturnValue(unsubscribe);
       const getNativeTheme = vi.fn().mockResolvedValue('light');
 
       setWindowElectron({
         theme: { getNativeTheme, onThemeChange },
       });
 
       localStorage.setItem('o-theme', 'system');
       const { result } = renderHook(() => useTheme());
 
       await vi.waitFor(() => expect(onThemeChange).toHaveBeenCalledOnce());
 
       // Now switch away from system theme — the effect cleanup should fire
       act(() => result.current.setTheme('light'));
 
       expect(unsubscribe).toHaveBeenCalledOnce();
     });
   });
 });
