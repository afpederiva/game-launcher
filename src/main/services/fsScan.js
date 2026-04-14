'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

async function listFilesRecursive(rootDir) {
  const results = [];

  async function walk(currentDir) {
    let entries;
    try {
      entries = await fsp.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  }

  await walk(rootDir);
  return results;
}

module.exports = {
  listFilesRecursive,
};
