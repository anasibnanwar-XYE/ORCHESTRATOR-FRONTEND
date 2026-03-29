 /**
  * electron.d.ts
  *
  * Type declarations for the Electron IPC bridge exposed on `window.electron`.
  * When running inside Electron, a preload script typically exposes a narrow
  * API surface via `contextBridge.exposeInMainWorld('electron', { ... })`.
  *
  * These declarations make the bridge fully typed throughout the codebase so
  * that TypeScript knows what is (and isn't) available at runtime.
  *
  * Usage:
  *   import { isElectron, electronTheme } from '@/utils/electron';
  *   const theme = await electronTheme.getNativeTheme();
  */
 
 export {};
 
 declare global {
   interface Window {
     /**
      * Electron IPC bridge object injected by the preload script.
      * Absent when the app is running in a regular browser.
      */
     electron?: ElectronBridge;
   }
 }
 
 /**
  * The full type of the object exposed by the Electron preload script.
  * Expand this interface as the preload script grows.
  */
 export interface ElectronBridge {
   /**
    * Electron native theme control.
    * Maps to Electron's `nativeTheme` module via IPC.
    */
   theme: ElectronThemeBridge;
 
   /**
    * App meta information.
    */
   app?: ElectronAppBridge;
 }
 
 /**
  * Native theme API exposed through the Electron preload bridge.
  */
 export interface ElectronThemeBridge {
   /**
    * Returns the current resolved native theme ('light' | 'dark').
    * Resolves immediately with the OS-level value.
    */
   getNativeTheme: () => Promise<'light' | 'dark'>;
 
   /**
    * Subscribes to OS theme changes. The callback is invoked each time
    * the user changes their system appearance.
    *
    * @param callback - Invoked with the new resolved theme.
    * @returns An unsubscribe function. Call it to remove the listener and
    *          prevent memory leaks.
    */
   onThemeChange: (callback: (theme: 'light' | 'dark') => void) => () => void;
 }
 
 /**
  * App meta information exposed through the Electron preload bridge.
  */
 export interface ElectronAppBridge {
   /** Semantic version string of the Electron app, e.g. "1.2.3". */
   getVersion: () => Promise<string>;
   /** Platform string, e.g. "darwin", "win32", "linux". */
   getPlatform: () => Promise<string>;
 }
