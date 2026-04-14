'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');

function defaultConfig() {
  return {
    version: 1,
    emulators: [],
    ui: {
      viewMode: 'grid',
      coverDisplay: 'contain',
    },
  };
}

function ensureId(value) {
  return value && typeof value === 'string' ? value : crypto.randomUUID();
}

class ConfigStore {
  constructor() {
    this._configPath = null;
    this._writeQueue = Promise.resolve();
  }

  getConfigPath() {
    if (this._configPath) return this._configPath;
    // Fully local and portable persistence: always inside the project /config folder.
    // Path relative to the project root directory.
    const projectRoot = process.cwd();
    const configDir = path.join(projectRoot, 'config');
    this._configPath = path.join(configDir, 'app.config.json');
    return this._configPath;
  }

  async init() {
    const configPath = this.getConfigPath();
    await fsp.mkdir(path.dirname(configPath), { recursive: true });

    try {
      await fsp.access(configPath, fs.constants.F_OK);
    } catch {
      await this._atomicWrite(configPath, JSON.stringify(defaultConfig(), null, 2));
    }

    // Normalize IDs if someone edited the JSON manually.
    await this.update((cfg) => {
      cfg.emulators = Array.isArray(cfg.emulators) ? cfg.emulators : [];
      for (const emulator of cfg.emulators) {
        emulator.id = ensureId(emulator.id);
        emulator.name = String(emulator.name ?? '');
        emulator.executablePath = String(emulator.executablePath ?? '');
        emulator.launchArguments = emulator.launchArguments ? String(emulator.launchArguments) : '';
        emulator.consoles = Array.isArray(emulator.consoles) ? emulator.consoles : [];
        for (const con of emulator.consoles) {
          con.id = ensureId(con.id);
          con.name = String(con.name ?? '');
          con.romFolders = Array.isArray(con.romFolders) ? con.romFolders.map(String) : [];
        }
      }

      cfg.ui = cfg.ui && typeof cfg.ui === 'object' ? cfg.ui : defaultConfig().ui;
      cfg.ui.viewMode = cfg.ui.viewMode === 'list' ? 'list' : 'grid';
      cfg.ui.coverDisplay = cfg.ui.coverDisplay === 'cover' ? 'cover' : 'contain';

      return cfg;
    });
  }

  async getConfig() {
    const configPath = this.getConfigPath();
    const raw = await fsp.readFile(configPath, 'utf8');
    try {
      return JSON.parse(raw);
    } catch {
      // If JSON is corrupted, do not brick the app.
      return defaultConfig();
    }
  }

  async setConfig(nextConfig) {
    const configPath = this.getConfigPath();
    await this._enqueueWrite(async () => {
      await this._atomicWrite(configPath, JSON.stringify(nextConfig, null, 2));
    });
  }

  async update(mutator) {
    const current = await this.getConfig();
    const next = mutator(structuredClone(current));
    await this.setConfig(next);
    return next;
  }

  async _enqueueWrite(writer) {
    this._writeQueue = this._writeQueue.then(writer, writer);
    return this._writeQueue;
  }

  async _atomicWrite(filePath, content) {
    const tmpPath = `${filePath}.tmp`;
    await fsp.writeFile(tmpPath, content, 'utf8');
    await fsp.rename(tmpPath, filePath);
  }
}

module.exports = {
  ConfigStore,
  defaultConfig,
};
