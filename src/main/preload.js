
  'use strict';

const { contextBridge, ipcRenderer } = require('electron');

function on(channel, handler) {
  const wrapped = (_event, payload) => handler(payload);
  ipcRenderer.on(channel, wrapped);
  return () => ipcRenderer.off(channel, wrapped);
}

contextBridge.exposeInMainWorld('launcher', {
  saveCover: ({ emulatorName, consoleName, normalizedName, fileData, fileName, url }) =>
    ipcRenderer.invoke('cover:save', { emulatorName, consoleName, normalizedName, fileData, fileName, url }),

  removeCover: ({ coverPath }) =>
    ipcRenderer.invoke('cover:remove', { coverPath }),
  // One-shot requests
  getConfig: () => ipcRenderer.invoke('config:get'),
  setUiSettings: (ui) => ipcRenderer.invoke('config:setUi', ui),

  addEmulator: (emulator) => ipcRenderer.invoke('emulator:add', emulator),
  updateEmulator: (emulator) => ipcRenderer.invoke('emulator:update', emulator),
  deleteEmulator: (emulatorId) => ipcRenderer.invoke('emulator:delete', { emulatorId }),

  addConsole: ({ emulatorId, console }) => ipcRenderer.invoke('console:add', { emulatorId, console }),
  updateConsole: ({ emulatorId, console }) => ipcRenderer.invoke('console:update', { emulatorId, console }),
  deleteConsole: ({ emulatorId, consoleId }) => ipcRenderer.invoke('console:delete', { emulatorId, consoleId }),

  addRomFolder: ({ emulatorId, consoleId, folderPath }) =>
    ipcRenderer.invoke('romFolder:add', { emulatorId, consoleId, folderPath }),
  removeRomFolder: ({ emulatorId, consoleId, folderPath }) =>
    ipcRenderer.invoke('romFolder:remove', { emulatorId, consoleId, folderPath }),

  pickExecutable: (extensions = ['exe']) => ipcRenderer.invoke('dialog:pickExecutable', extensions),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),

  resolveCoverUrl: ({ coverPath }) =>
    ipcRenderer.invoke('cover:resolveUrl', { coverPath }),

  getAllGames: () => ipcRenderer.invoke('game:getAll'),
  setGameStatus: ({ emulator, romPath, status }) => ipcRenderer.invoke('game:setStatus', { emulator, romPath, status }),
  setGameCustomName: ({ emulator, romPath, customName }) => ipcRenderer.invoke('game:setCustomName', { emulator, romPath, customName }),
  setGameCoverPath: ({ emulator, romPath, coverPath }) => ipcRenderer.invoke('game:setCoverPath', { emulator, romPath, coverPath }),

  launchGame: ({ emulatorId, consoleId, romPath }) =>
    ipcRenderer.invoke('game:launch', { emulatorId, consoleId, romPath }),

  // Allows calling any IPC handler.
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

  // Event subscriptions
  onBootstrap: (handler) => on('app:bootstrap', handler),
  onLibraryUpdated: (handler) => on('library:updated', handler),
  onConfigUpdated: (handler) => on('config:updated', handler),
});
