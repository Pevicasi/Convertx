const fs = require('fs-extra');
const path = require('path');
const { paths, tempFileMaxAgeMs, cleanupIntervalMs } = require('../config/appConfig');

async function removeFileSafe(filePath) {
  try {
    if (filePath && await fs.pathExists(filePath)) await fs.remove(filePath);
  } catch (_) {}
}

async function cleanupOldFiles() {
  const folders = [paths.uploads, paths.converted, paths.temp];
  const now = Date.now();

  for (const folder of folders) {
    await fs.ensureDir(folder);
    const files = await fs.readdir(folder);

    for (const file of files) {
      const filePath = path.join(folder, file);
      const stat = await fs.stat(filePath).catch(() => null);
      if (!stat || !stat.isFile()) continue;
      if (now - stat.mtimeMs > tempFileMaxAgeMs) await removeFileSafe(filePath);
    }
  }
}

function startCleanupJob() {
  cleanupOldFiles();
  setInterval(cleanupOldFiles, cleanupIntervalMs);
}

module.exports = { removeFileSafe, cleanupOldFiles, startCleanupJob };
