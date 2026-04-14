'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

function toSafePathSegment(input) {
  const value = String(input ?? '').trim();
  if (!value) return '_';
  return value.replace(/[<>:"/\\|?*]/g, '_').replace(/\.+$/g, '').slice(0, 80) || '_';
}

function getAppAssetsDir() {
  // Always resolve to ./assets relative to the project.
  return path.join(process.cwd(), 'assets');
}

function getUserCoversDir() {
  // User covers are stored in ./assets/covers_user.
  return path.join(getAppAssetsDir(), 'covers_user');
}

function resolveCoverFilePath({ emulatorName, consoleName, romName }) {
  const emulatorDir = toSafePathSegment(emulatorName);
  const consoleDir = toSafePathSegment(consoleName);
  const baseName = toSafePathSegment(romName);
  const exts = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];

  // Search in ./assets/covers_user first.
  for (const ext of exts) {
    const userPath = path.join(getUserCoversDir(), emulatorDir, consoleDir, `${baseName}.${ext}`);
    if (fs.existsSync(userPath)) return userPath;
  }

  // Then search in ./assets/covers.
  for (const ext of exts) {
    const appPath = path.join(getAppAssetsDir(), 'covers', emulatorDir, consoleDir, `${baseName}.${ext}`);
    if (fs.existsSync(appPath)) return appPath;
  }

  // Fall back to ./assets/placeholderCover.svg.
  const fallback = path.join(getAppAssetsDir(), 'placeholderCover.svg');
  return fallback;
}

function resolveCoverFileUrl(params) {
  const filePath = resolveCoverFilePath(params);
  return pathToFileURL(filePath).toString();
}

module.exports = {
  resolveCoverFilePath,
  resolveCoverFileUrl,
  toSafePathSegment,
  getAppAssetsDir,
};
