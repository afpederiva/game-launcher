'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

class GameStore {
  constructor() {
    this._filePath = path.join(process.cwd(), 'data', 'games.json');
    this._dirPath = path.dirname(this._filePath);
    this._coversDir = path.join(process.cwd(), 'assets', 'covers');
  }

  async init() {
    await fsp.mkdir(this._dirPath, { recursive: true });
    if (!fs.existsSync(this._filePath)) {
      await fsp.writeFile(this._filePath, '[]\n', 'utf8');
    }
  }

  _keyOf(game) {
    const emulator = String(game?.emulator ?? '').toLowerCase();
    const romPath = String(game?.romPath ?? '').toLowerCase();
    return `${emulator}::${romPath}`;
  }

  async _readAll() {
    await this.init();
    try {
      const raw = await fsp.readFile(this._filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
    await fsp.writeFile(this._filePath, '[]\n', 'utf8');
    return [];
  }

  async _writeAll(games) {
    await this.init();
    const payload = JSON.stringify(games, null, 2);
    await fsp.writeFile(this._filePath, payload + '\n', 'utf8');
  }

  async getAll() {
    const games = await this._readAll();
    const updated = await this._ensureCoverPaths(games);
    if (updated.changed) {
      await this._writeAll(updated.games);
    }
    return updated.games;
  }

  async _ensureCoverPaths(games) {
    let changed = false;
    const exts = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];

    const nextGames = games.map((game) => {
      if (game.coverPath) return game;
      const emulator = String(game.emulator || '');
      const consoleName = String(game.console || '');
      const normalizedName = String(game.normalizedName || game.originalName || '').trim();
      if (!emulator || !consoleName || !normalizedName) return game;

      const baseDir = path.join(this._coversDir, emulator, consoleName);
      for (const ext of exts) {
        const candidate = path.join(baseDir, `${normalizedName}.${ext}`);
        if (fs.existsSync(candidate)) {
          changed = true;
          return {
            ...game,
            coverPath: path.relative(process.cwd(), candidate).split(path.sep).join('/'),
          };
        }
      }

      return game;
    });

    return { games: nextGames, changed };
  }

  async addGames(newGames) {
    const games = await this._readAll();
    const existing = new Set(games.map((g) => this._keyOf(g)));
    let changed = false;

    for (const game of newGames || []) {
      const key = this._keyOf(game);
      if (!key || existing.has(key)) continue;
      games.push(game);
      existing.add(key);
      changed = true;
    }

    if (changed) {
      await this._writeAll(games);
    }

    return { games, changed };
  }

  async updateGameIdentity({ emulator, romPath }, updates) {
    const games = await this._readAll();
    const targetKey = this._keyOf({ emulator, romPath });
    const idx = games.findIndex((g) => this._keyOf(g) === targetKey);
    if (idx === -1) return null;

    const current = games[idx];
    const next = { ...current };

    if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
      next.status = String(updates.status || 'not_started');
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'customName')) {
      const value = updates.customName;
      next.customName = value === null || value === undefined || String(value).trim() === '' ? null : String(value);
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'coverPath')) {
      const value = updates.coverPath;
      next.coverPath = value === null || value === undefined || String(value).trim() === '' ? null : String(value);
    }

    games[idx] = next;
    await this._writeAll(games);
    return next;
  }
}

module.exports = {
  GameStore,
};
