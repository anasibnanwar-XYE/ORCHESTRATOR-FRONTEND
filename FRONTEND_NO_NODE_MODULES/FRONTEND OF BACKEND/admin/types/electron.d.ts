// Type definitions for Electron API

export interface ElectronWindowAPI {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  onMaximizedChange: (callback: (maximized: boolean) => void) => void;
  removeMaximizedListener: () => void;
}

export interface ElectronThemeAPI {
  getNativeTheme: () => Promise<'dark' | 'light'>;
  onThemeChange: (callback: (theme: 'dark' | 'light') => void) => void;
  removeThemeListener: () => void;
}

export interface ElectronPlatformAPI {
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
}

export interface ElectronAPI {
  window: ElectronWindowAPI;
  theme: ElectronThemeAPI;
  platform: ElectronPlatformAPI;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
