'use strict';

const path = require('path');
const chokidar = require('chokidar');

const { listFilesRecursive } = require('./fsScan');
const { normalizeGameName } = require('./normalizeGameName');

function buildEmptyLibrary(config) {
  return {
    emulators: (config.emulators || []).map((e) => ({
      id: e.id,
      name: e.name,
      executablePath: e.executablePath,
      launchArguments: e.launchArguments || '',
      consoles: (e.consoles || []).map((c) => ({
        id: c.id,
        name: c.name,
        romFolders: c.romFolders || [],
        manualExecutables: Array.isArray(c.manualExecutables) ? c.manualExecutables : [],
        games: [],
      })),
    })),
  };
}

class LibraryService {
  constructor({ configStore, gameStore }) {
    this._configStore = configStore;
    this._gameStore = gameStore;
    this._watcher = null;
    this._debounceTimer = null;
    this._library = null;
  }

  async start() {
    const config = await this._configStore.getConfig();
    // Check whether games.json already exists.
    const fs = require('fs');
    const gamesPath = this._gameStore && this._gameStore._filePath
      ? this._gameStore._filePath
      : require('path').join(process.cwd(), 'data', 'games.json');
    const skipScan = fs.existsSync(gamesPath);
    await this._rebuild(config, { skipScan });
    await this._restartWatcher(config);
  }

  async stop() {
    if (this._watcher) {
      await this._watcher.close();
      this._watcher = null;
    }
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
  }

  async onConfigChanged(nextConfig) {
    await this._rebuild(nextConfig);
    await this._restartWatcher(nextConfig);
  }

  async getLibrarySnapshot() {
    if (this._library) return this._library;
    const config = await this._configStore.getConfig();
    await this._rebuild(config);
    return this._library;
  }

  async refreshFromStore() {
    const config = await this._configStore.getConfig();
    await this._rebuild(config, { skipScan: true });
    return this._library;
  }

  async _restartWatcher(config) {
    const folders = [];
    for (const emulator of config.emulators || []) {
      for (const con of emulator.consoles || []) {
        for (const folder of con.romFolders || []) {
          if (folder && typeof folder === 'string') folders.push(folder);
        }
      }
    }

    const uniqueFolders = Array.from(new Set(folders));

    if (this._watcher) {
      await this._watcher.close();
      this._watcher = null;
    }

    if (uniqueFolders.length === 0) return;

    this._watcher = chokidar.watch(uniqueFolders, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 250,
        pollInterval: 100,
      },
    });

    const schedule = () => this._scheduleRebuild();
    this._watcher.on('add', schedule);
    this._watcher.on('unlink', schedule);
    this._watcher.on('addDir', schedule);
    this._watcher.on('unlinkDir', schedule);
    this._watcher.on('change', schedule);
  }

  _scheduleRebuild() {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(async () => {
      const config = await this._configStore.getConfig();
      await this._rebuild(config);
      if (this.onLibraryUpdated) this.onLibraryUpdated(this._library);
    }, 300);
  }

  async _rebuild(config, { skipScan = false } = {}) {
    const library = buildEmptyLibrary(config);

    let scannedGames = null;
    if (!skipScan) {
      scannedGames = [];
      for (const emulator of config.emulators || []) {
        for (const con of emulator.consoles || []) {
          const folderList = Array.isArray(con.romFolders) ? con.romFolders : [];
          const files = [];

          for (const folder of folderList) {
            const scanned = await listFilesRecursive(folder);
            for (const filePath of scanned) files.push(filePath);
          }

          const manualExecutables = Array.isArray(con.manualExecutables) ? con.manualExecutables : [];
          for (const exePath of manualExecutables) {
            if (!files.includes(exePath)) files.push(exePath);
          }

          const uniqueFiles = Array.from(new Set(files));
          for (const filePath of uniqueFiles) {
            const parsed = path.parse(filePath);
            const normalizedName = normalizeGameName(parsed.name);
            scannedGames.push({
              emulator: emulator.name,
              console: con.name,
              originalName: parsed.name,
              normalizedName,
              customName: null,
              status: 'not_started',
              romPath: filePath,
              coverPath: null,
            });
          }
        }
      }
      // Merge scannedGames with existing games to preserve customName, status, coverPath
      const existingGames = await this._gameStore._readAll();
      const keyOf = (g) => `${String(g.emulator).toLowerCase()}::${String(g.romPath).toLowerCase()}`;
      const existingMap = new Map(existingGames.map(g => [keyOf(g), g]));
      const mergedGames = scannedGames.map(g => {
        const prev = existingMap.get(keyOf(g));
        return prev ? {
          ...g,
          customName: prev.customName ?? null,
          status: prev.status ?? 'not_started',
          coverPath: prev.coverPath ?? null,
        } : g;
      });
      await this._gameStore._writeAll(mergedGames);
    }

    // Use the current games from the file (already cleaned if a scan ran).
    const allGames = await this._gameStore.getAll();
    for (const emulator of library.emulators) {
      for (const con of emulator.consoles) {
        const filtered = allGames.filter(
          (g) => g.emulator === emulator.name && g.console === con.name
        );
        con.games = filtered.sort((a, b) => {
          const aName = a.customName || a.normalizedName || a.originalName || '';
          const bName = b.customName || b.normalizedName || b.originalName || '';
          return aName.localeCompare(bName);
        });
      }
    }

    this._library = library;
    return library;
  }
}

module.exports = {
  LibraryService,
};
