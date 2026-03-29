const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    onMaximizedChange: (callback) => {
      ipcRenderer.on('window-maximized', (_event, maximized) => callback(maximized));
    },
    removeMaximizedListener: () => {
      ipcRenderer.removeAllListeners('window-maximized');
    }
  },

  theme: {
    getNativeTheme: () => ipcRenderer.invoke('get-native-theme'),
    onThemeChange: (callback) => {
      const listener = (_event, theme) => callback(theme);
      ipcRenderer.on('native-theme-changed', listener);
      return () => {
        ipcRenderer.removeListener('native-theme-changed', listener);
      };
    },
  },

  platform: {
    isMac: process.platform === 'darwin',
    isWindows: process.platform === 'win32',
    isLinux: process.platform === 'linux'
  }
});
