// Backend: Remove orphan covers
const fs = require('fs');
const path = require('path');

async function removeOrphanCovers() {
  const gamesPath = path.join(process.cwd(), 'data', 'games.json');
  const coversDir = path.join(process.cwd(), 'assets', 'covers');
  const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
  const usedCovers = new Set();
  for (const game of games) {
    if (game.coverPath) {
      usedCovers.add(path.resolve(process.cwd(), game.coverPath));
    }
  }
  function getAllCoverFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllCoverFiles(filePath));
      } else {
        results.push(filePath);
      }
    }
    return results;
  }
  const allCovers = getAllCoverFiles(coversDir);
  let removed = 0;
  for (const cover of allCovers) {
    if (!usedCovers.has(cover)) {
      fs.unlinkSync(cover);
      removed++;
    }
  }
  return removed;
}

module.exports = { removeOrphanCovers };