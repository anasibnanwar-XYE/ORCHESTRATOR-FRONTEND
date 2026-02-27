// Secure preload script exposing native APIs
const { contextBridge, ipcRenderer } = require('electron');

// Expose native APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    onMaximizedChange: (callback) => {
      ipcRenderer.on('window-maximized', (event, maximized) => callback(maximized));
    },
    removeMaximizedListener: () => {
      ipcRenderer.removeAllListeners('window-maximized');
    }
  },
  
  // Native theme
  theme: {
    getNativeTheme: () => ipcRenderer.invoke('get-native-theme'),
    onThemeChange: (callback) => {
      ipcRenderer.on('native-theme-changed', (event, theme) => callback(theme));
    },
    removeThemeListener: () => {
      ipcRenderer.removeAllListeners('native-theme-changed');
    }
  },
  
  // Platform info
  platform: {
    isMac: process.platform === 'darwin',
    isWindows: process.platform === 'win32',
    isLinux: process.platform === 'linux'
  }
});
