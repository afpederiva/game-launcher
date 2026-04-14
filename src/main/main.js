'use strict';

const path = require('path');
const { app, BrowserWindow } = require('electron');

const { ConfigStore } = require('./services/configStore');
const { GameStore } = require('./services/gameStore');
const { LibraryService } = require('./services/libraryService');
const { registerIpcHandlers } = require('./services/ipc');

let mainWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0f1115',
    title: 'Games',
    icon: path.join(process.cwd(), 'assets', 'icon.ico'),
    titleBarStyle: 'default',
    // For Windows 11+:
    // titleBarOverlay: {
    //   color: '#0f1115',
    //   symbolColor: '#e7eaf0',
    //   height: 32
    // },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Remove the default Electron menu.
  mainWindow.setMenu(null);

  // DevTools shortcuts (Ctrl+Shift+I and F12)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control && input.shift && input.key.toLowerCase() === 'i') || input.key === 'F12') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
      event.preventDefault();
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(process.cwd(), 'dist', 'renderer', 'index.html'));
  }
}

async function boot() {
  const configStore = new ConfigStore();
  await configStore.init();

  const gameStore = new GameStore();
  await gameStore.init();

  const libraryService = new LibraryService({ configStore, gameStore });

  registerIpcHandlers({
    configStore,
    libraryService,
    gameStore,
    getMainWindow: () => mainWindow,
  });

  await libraryService.start();

  createMainWindow();

  mainWindow.webContents.on('did-finish-load', async () => {
    const config = await configStore.getConfig();
    const library = await libraryService.getLibrarySnapshot();
    mainWindow.webContents.send('app:bootstrap', { config, library });
  });
}

app.setAppUserModelId('offline.emulator.launcher');

app.whenReady().then(boot);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
