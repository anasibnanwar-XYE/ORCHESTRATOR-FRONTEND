 /**
  * electron.ts
  *
  * Utility helpers for detecting and interacting with the Electron host.
  * All helpers are safe to call in a browser environment — they simply
  * return sensible defaults when `window.electron` is absent.
  */
 
 /**
  * Returns true when the app is running inside Electron (i.e., the preload
  * script has injected `window.electron`).
  */
 export function isElectron(): boolean {
   return typeof window !== 'undefined' && typeof window.electron !== 'undefined';
 }
 
 /**
  * Convenience accessor for the Electron theme bridge.
  * Returns undefined when not in Electron.
  */
 export function electronTheme() {
   return window.electron?.theme;
 }
