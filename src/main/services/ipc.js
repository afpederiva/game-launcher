const { normalizeGameName } = require('./normalizeGameName');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { pathToFileURL } = require('url');
const { ipcMain, dialog } = require('electron');
const { toSafePathSegment, getAppAssetsDir } = require('./paths');
const https = require('https');
const http = require('http');
function toRelativeCoverPath(absPath) {
  const root = process.cwd();
  const rel = path.relative(root, absPath);
  return rel.split(path.sep).join('/');
}

const crypto = require('crypto');

// Utility for downloading an image from a URL.
function downloadImageToFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    const options = new URL(url);
    options.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'Referer': url,
    };
    proto.get(options, (response) => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error('HTTP ' + response.statusCode));
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}
const { launchEmulator } = require('./launchEmulator');

function registerIpcHandlers({ configStore, libraryService, gameStore, getMainWindow }) {

  // Remove orphan covers
  const { removeOrphanCovers } = require('./removeOrphanCovers');
  ipcMain.handle('cover:removeOrphans', async () => {
    try {
      const removed = await removeOrphanCovers();
      return { ok: true, removed };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });

    // Forces a manual library rescan.
    ipcMain.handle('library:rescan', async () => {
      const config = await configStore.getConfig();
      await libraryService._rebuild(config, { skipScan: false });
      if (libraryService.onLibraryUpdated) libraryService.onLibraryUpdated(await libraryService.getLibrarySnapshot());
      return true;
    });
  // Push library updates to renderer.
  libraryService.onLibraryUpdated = (library) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('library:updated', library);
    }
  };

  async function emitConfigUpdated(config) {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('config:updated', config);
    }
  }

  ipcMain.handle('config:get', async () => configStore.getConfig());

  ipcMain.handle('library:getSnapshot', async () => libraryService.getLibrarySnapshot());

  ipcMain.handle('game:getAll', async () => gameStore.getAll());

  ipcMain.handle('game:setStatus', async (_evt, { emulator, romPath, status }) => {
    const updated = await gameStore.updateGameIdentity({ emulator, romPath }, { status });
    if (updated) {
      await libraryService.refreshFromStore();
    }
    return updated;
  });

  ipcMain.handle('game:setCustomName', async (_evt, { emulator, romPath, customName }) => {
    const updated = await gameStore.updateGameIdentity({ emulator, romPath }, { customName });
    if (updated) {
      await libraryService.refreshFromStore();
    }
    return updated;
  });

  ipcMain.handle('game:setCoverPath', async (_evt, { emulator, romPath, coverPath }) => {
    const updated = await gameStore.updateGameIdentity({ emulator, romPath }, { coverPath });
    if (updated) {
      await libraryService.refreshFromStore();
    }
    return updated;
  });

  ipcMain.handle('config:setUi', async (_evt, ui) => {
    const next = await configStore.update((cfg) => {
      cfg.ui = cfg.ui && typeof cfg.ui === 'object' ? cfg.ui : {};
      if (ui && typeof ui === 'object') {
        if (ui.viewMode) cfg.ui.viewMode = ui.viewMode === 'list' ? 'list' : 'grid';
        if (ui.coverDisplay) cfg.ui.coverDisplay = ui.coverDisplay === 'cover' ? 'cover' : 'contain';
      }
      return cfg;
    });

    await emitConfigUpdated(next);
    return next;
  });

  ipcMain.handle('dialog:pickExecutable', async (_evt, extensions = ['exe']) => {
    const win = getMainWindow();
    const result = await dialog.showOpenDialog(win, {
      title: 'Select Executable',
      properties: ['openFile'],
      filters: [{ name: 'Executables', extensions }],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('dialog:pickFolder', async () => {
    const win = getMainWindow();
    const result = await dialog.showOpenDialog(win, {
      title: 'Select ROM Folder',
      properties: ['openDirectory'],
    });

    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('emulator:add', async (_evt, emulator) => {
    const next = await configStore.update((cfg) => {
      cfg.emulators = Array.isArray(cfg.emulators) ? cfg.emulators : [];
      cfg.emulators.push({
        id: crypto.randomUUID(),
        name: String(emulator?.name ?? 'New Emulator'),
        executablePath: String(emulator?.executablePath ?? ''),
        launchArguments: String(emulator?.launchArguments ?? ''),
        consoles: [],
      });
      return cfg;
    });

    await libraryService.onConfigChanged(next);
    if (libraryService.onLibraryUpdated) libraryService.onLibraryUpdated(await libraryService.getLibrarySnapshot());
    await emitConfigUpdated(next);
    return next;
  });

  ipcMain.handle('emulator:update', async (_evt, emulator) => {
    const next = await configStore.update((cfg) => {
      cfg.emulators = Array.isArray(cfg.emulators) ? cfg.emulators : [];
      const idx = cfg.emulators.findIndex((e) => e.id === emulator?.id);
      if (idx === -1) return cfg;
      const current = cfg.emulators[idx];
      cfg.emulators[idx] = {
        ...current,
        name: String(emulator?.name ?? current.name),
        executablePath: String(emulator?.executablePath ?? current.executablePath),
        launchArguments: String(emulator?.launchArguments ?? current.launchArguments ?? ''),
      };
      return cfg;
    });

    await libraryService.onConfigChanged(next);
    if (libraryService.onLibraryUpdated) libraryService.onLibraryUpdated(await libraryService.getLibrarySnapshot());
    await emitConfigUpdated(next);
    return next;
  });

  ipcMain.handle('emulator:delete', async (_evt, { emulatorId }) => {
    const next = await configStore.update((cfg) => {
      cfg.emulators = Array.isArray(cfg.emulators) ? cfg.emulators : [];
      cfg.emulators = cfg.emulators.filter((e) => e.id !== emulatorId);
      return cfg;
    });

    await libraryService.onConfigChanged(next);
    if (libraryService.onLibraryUpdated) libraryService.onLibraryUpdated(await libraryService.getLibrarySnapshot());
    await emitConfigUpdated(next);
    return next;
  });

  ipcMain.handle('console:add', async (_evt, { emulatorId, console }) => {
    const next = await configStore.update((cfg) => {
      const emulator = (cfg.emulators || []).find((e) => e.id === emulatorId);
      if (!emulator) return cfg;
      emulator.consoles = Array.isArray(emulator.consoles) ? emulator.consoles : [];
      emulator.consoles.push({
        id: crypto.randomUUID(),
        name: String(console?.name ?? 'New Console'),
        romFolders: [],
      });
      return cfg;
    });

    await libraryService.onConfigChanged(next);
    if (libraryService.onLibraryUpdated) libraryService.onLibraryUpdated(await libraryService.getLibrarySnapshot());
    await emitConfigUpdated(next);
    return next;
  });

  ipcMain.handle('console:update', async (_evt, { emulatorId, console }) => {
    const next = await configStore.update((cfg) => {
      const emulator = (cfg.emulators || []).find((e) => e.id === emulatorId);
      if (!emulator) return cfg;
      emulator.consoles = Array.isArray(emulator.consoles) ? emulator.consoles : [];
      const idx = emulator.consoles.findIndex((c) => c.id === console?.id);
      if (idx === -1) return cfg;
      const current = emulator.consoles[idx];
      emulator.consoles[idx] = {
        ...current,
        name: String(console?.name ?? current.name),
        romFolders: Array.isArray(console?.romFolders) ? console.romFolders.map(String) : current.romFolders,
        manualExecutables: Array.isArray(console?.manualExecutables) ? console.manualExecutables.map(String) : (current.manualExecutables || []),
      };
      return cfg;
    });

    await libraryService.onConfigChanged(next);
    if (libraryService.onLibraryUpdated) libraryService.onLibraryUpdated(await libraryService.getLibrarySnapshot());
    await emitConfigUpdated(next);
    return next;
  });

  ipcMain.handle('console:delete', async (_evt, { emulatorId, consoleId }) => {
    const next = await configStore.update((cfg) => {
      const emulator = (cfg.emulators || []).find((e) => e.id === emulatorId);
      if (!emulator) return cfg;
      emulator.consoles = Array.isArray(emulator.consoles) ? emulator.consoles : [];
      emulator.consoles = emulator.consoles.filter((c) => c.id !== consoleId);
      return cfg;
    });

    await libraryService.onConfigChanged(next);
    if (libraryService.onLibraryUpdated) libraryService.onLibraryUpdated(await libraryService.getLibrarySnapshot());
    await emitConfigUpdated(next);
    return next;
  });

  ipcMain.handle('romFolder:add', async (_evt, { emulatorId, consoleId, folderPath }) => {
    const next = await configStore.update((cfg) => {
      const emulator = (cfg.emulators || []).find((e) => e.id === emulatorId);
      if (!emulator) return cfg;
      const con = (emulator.consoles || []).find((c) => c.id === consoleId);
      if (!con) return cfg;
      con.romFolders = Array.isArray(con.romFolders) ? con.romFolders : [];
      const normalized = String(folderPath || '').trim();
      if (!normalized) return cfg;
      if (!con.romFolders.includes(normalized)) con.romFolders.push(normalized);
      return cfg;
    });

    await libraryService.onConfigChanged(next);
    if (libraryService.onLibraryUpdated) libraryService.onLibraryUpdated(await libraryService.getLibrarySnapshot());
    await emitConfigUpdated(next);
    return next;
  });

  ipcMain.handle('romFolder:remove', async (_evt, { emulatorId, consoleId, folderPath }) => {
    const next = await configStore.update((cfg) => {
      const emulator = (cfg.emulators || []).find((e) => e.id === emulatorId);
      if (!emulator) return cfg;
      const con = (emulator.consoles || []).find((c) => c.id === consoleId);
      if (!con) return cfg;
      con.romFolders = Array.isArray(con.romFolders) ? con.romFolders : [];
      con.romFolders = con.romFolders.filter((p) => p !== folderPath);
      return cfg;
    });

    await libraryService.onConfigChanged(next);
    if (libraryService.onLibraryUpdated) libraryService.onLibraryUpdated(await libraryService.getLibrarySnapshot());
    await emitConfigUpdated(next);
    return next;
  });

  ipcMain.handle('cover:resolveUrl', async (_evt, { coverPath }) => {
    const fallback = path.join(getAppAssetsDir(), 'placeholderCover.svg');

    const toDataUrl = async (filePath) => {
      const ext = path.extname(filePath || '').toLowerCase();
      const mimeMap = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.svg': 'image/svg+xml',
      };
      const mime = mimeMap[ext] || 'application/octet-stream';
      const buffer = await fsp.readFile(filePath);
      const base64 = buffer.toString('base64');
      return `data:${mime};base64,${base64}`;
    };

    try {
      const absPath = coverPath
        ? (path.isAbsolute(coverPath) ? coverPath : path.join(process.cwd(), coverPath))
        : fallback;

      const finalPath = fs.existsSync(absPath) ? absPath : fallback;
      return await toDataUrl(finalPath);
    } catch (err) {
      try {
        return await toDataUrl(fallback);
      } catch {
        return pathToFileURL(fallback).toString();
      }
    }
  });

  ipcMain.handle('cover:save', async (_evt, { emulatorName, consoleName, normalizedName, fileData, fileName, url }) => {
    const coversDir = path.join(getAppAssetsDir(), 'covers', toSafePathSegment(emulatorName), toSafePathSegment(consoleName));
    await fsp.mkdir(coversDir, { recursive: true });
    let ext = 'png';
    if (fileName && fileName.includes('.')) ext = fileName.split('.').pop().toLowerCase();
    if (url) {
      const match = url.match(/\.(jpg|jpeg|png|webp|gif|bmp)(\?.*)?$/i);
      if (match) {
        ext = match[1].toLowerCase();
      }
    }

    const safeName = toSafePathSegment(normalizeGameName(normalizedName));
    const destPath = path.join(coversDir, safeName + '.' + ext);

    const base = path.join(coversDir, safeName);
    for (const e of ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp']) {
      const p = base + '.' + e;
      if (fs.existsSync(p) && p !== destPath) await fsp.unlink(p);
    }

    if (fileData) {
      const base64 = fileData.split(',')[1];
      await fsp.writeFile(destPath, Buffer.from(base64, 'base64'));
      return { ok: true, coverPath: toRelativeCoverPath(destPath) };
    }

    if (url) {
      await downloadImageToFile(url, destPath);
      return { ok: true, coverPath: toRelativeCoverPath(destPath) };
    }

    return { ok: false, error: 'No fileData or url' };
  });

  ipcMain.handle('cover:remove', async (_evt, { coverPath }) => {
    if (!coverPath) return { ok: false };
    const absPath = path.isAbsolute(coverPath)
      ? coverPath
      : path.join(process.cwd(), coverPath);
    if (fs.existsSync(absPath)) {
      await fsp.unlink(absPath);
      return { ok: true };
    }
    return { ok: false };
  });

  ipcMain.handle('game:launch', async (_evt, { emulatorId, consoleId, romPath }) => {
    const cfg = await configStore.getConfig();
    const emulator = (cfg.emulators || []).find((e) => e.id === emulatorId);
    if (!emulator) return { ok: false, error: 'Emulator not found' };

    const con = (emulator.consoles || []).find((c) => c.id === consoleId);
    if (!con) return { ok: false, error: 'Console not found' };

    if (!romPath) return { ok: false, error: 'ROM path is empty' };

    try {
      launchEmulator({
        executablePath: emulator.executablePath,
        launchArguments: emulator.launchArguments,
        romPath,
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err?.message || err) };
    }
  });
}

module.exports = {
  registerIpcHandlers,
};
