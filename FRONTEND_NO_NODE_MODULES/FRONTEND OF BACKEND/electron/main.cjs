// Native-feeling Electron main process
const { app, BrowserWindow, shell, ipcMain, nativeTheme, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isDev = !!process.env.ELECTRON_START_URL;
const iconFileName = isWindows ? 'icon.ico' : 'icon.png';
const iconPath = path.join(__dirname, iconFileName);

// Window state management
const stateFile = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    if (fs.existsSync(stateFile)) {
      const raw = fs.readFileSync(stateFile, 'utf8');
      if (raw && raw.trim().length > 0) {
        return JSON.parse(raw);
      }
    }
  } catch (e) {
    console.error('Failed to load window state:', e);
    try {
      fs.unlinkSync(stateFile);
    } catch {
      // ignore cleanup errors
    }
  }
  return {
    width: 1400,
    height: 900,
    x: undefined,
    y: undefined,
    maximized: false
  };
}

function saveWindowState(win) {
  try {
    const bounds = win.getBounds();
    const state = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      maximized: win.isMaximized()
    };
    fs.writeFileSync(stateFile, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save window state:', e);
  }
}

// Native menu template
// Minimal native menu - removes the cluttered menu bar look
function createMenu() {
  const template = [
    ...(isMac ? [{
      label: app.getName(),
      submenu: [
        { role: 'about', label: 'About Orchestrator ERP' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' }
        ] : [])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const state = loadWindowState();
  
  const win = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    icon: iconPath,
    // Native window styling per platform
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 16, y: 16 } : undefined,
    vibrancy: isMac ? 'sidebar' : undefined,
    visualEffectState: 'active',
    backgroundMaterial: isWindows ? 'mica' : undefined,
    // Use native title bar that adapts to theme
    frame: true,
    transparent: false,
    title: 'Orchestrator ERP',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
      enableWebSQL: false,
    },
  });

  // Restore maximized state
  if (state.maximized) {
    win.maximize();
  }

  // Show window when ready to prevent flash
  win.once('ready-to-show', () => {
    win.show();
    if (state.maximized) {
      win.maximize();
    }
  });

  // Load content
  if (isDev) {
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3002';
    win.loadURL(startUrl);
  } else {
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    win.loadFile(indexPath);
  }

  // Save window state on close
  win.on('close', () => {
    saveWindowState(win);
  });

  // Handle window maximize/unmaximize
  win.on('maximize', () => {
    win.webContents.send('window-maximized', true);
  });
  
  win.on('unmaximize', () => {
    win.webContents.send('window-maximized', false);
  });

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle navigation
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== win.webContents.getURL()) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  return win;
}

// App event handlers
app.whenReady().then(() => {
  if (isWindows) {
    app.setAppUserModelId('com.skeina.orchestrator');
  }
  
  // Set app metadata
  app.setName('Orchestrator ERP');
  
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});

// IPC handlers for window controls
ipcMain.handle('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.handle('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.handle('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.handle('window-is-maximized', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? win.isMaximized() : false;
});

// Theme handling
ipcMain.handle('get-native-theme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

nativeTheme.on('updated', () => {
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('native-theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  });
});
