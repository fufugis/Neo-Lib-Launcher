function createStorageScanService({ fsp, path, isInside, folderStats, nowMs = () => Date.now() }) {
  if (!fsp || !path || typeof isInside !== 'function' || typeof folderStats !== 'function') {
    throw new TypeError('createStorageScanService requires filesystem, path and folder helpers.');
  }
  const cache = new Map();
  const launcherExecutables = new Set([
    'steam.exe', 'epicgameslauncher.exe', 'eadesktop.exe', 'ubisoftconnect.exe',
    'upc.exe', 'battle.net.exe', 'battle.net launcher.exe', 'riotclientservices.exe',
    'riotclientux.exe', 'goggalaxy.exe',
  ]);

  async function scanGames({ games = [], force = false } = {}) {
    const results = [];
    const skipped = [];
    const candidates = [];
    const seenRoots = new Set();
    for (const game of Array.isArray(games) ? games.slice(0, 250) : []) {
      if (!game?.id || !game?.exePath || typeof game.exePath !== 'string' || !path.isAbsolute(game.exePath)) continue;
      let exeStat;
      try { exeStat = await fsp.stat(game.exePath); } catch {
        skipped.push({ id: game.id, name: game.name || 'Unnamed game', reason: 'Configured executable is missing or unavailable.' });
        continue;
      }
      if (!exeStat.isFile()) {
        skipped.push({ id: game.id, name: game.name || 'Unnamed game', reason: 'Configured launch target is a folder, not a game executable.' });
        continue;
      }
      if (launcherExecutables.has(path.basename(game.exePath).toLowerCase())) {
        skipped.push({ id: game.id, name: game.name || 'Unnamed game', reason: 'Configured target is a launcher executable, not a game install.' });
        continue;
      }
      const root = path.resolve(path.dirname(game.exePath));
      const rootKey = root.toLowerCase();
      if (seenRoots.has(rootKey)) continue;
      seenRoots.add(rootKey);
      candidates.push({ id: game.id, name: game.name || 'Unnamed game', exePath: game.exePath, root, rootKey });
    }

    const safeCandidates = candidates.filter(candidate => {
      const childRoots = candidates.filter(other => other.id !== candidate.id && isInside(candidate.root, other.root)).length;
      if (childRoots < 2) return true;
      skipped.push({ id: candidate.id, name: candidate.name, reason: `Configured folder contains ${childRoots} other library roots; skipped as a shared folder.` });
      return false;
    });
    const measure = async ({ id, name, exePath, root, rootKey }) => {
      try {
        const stat = await fsp.stat(root);
        if (!stat.isDirectory()) return;
        const cached = cache.get(rootKey);
        if (!force && cached && nowMs() - cached.ts < 10 * 60 * 1000) {
          results.push({ id, name, exePath, root, ...cached.result, cached: true });
          return;
        }
        const total = await folderStats(root, 60000);
        let modBytes = 0;
        let modFiles = 0;
        let entries = [];
        try { entries = await fsp.readdir(root, { withFileTypes: true }); } catch { entries = []; }
        for (const entry of entries) {
          if (!entry.isDirectory() || entry.isSymbolicLink() || !/^(mods?|workshop|modding)$/i.test(entry.name)) continue;
          const mod = await folderStats(path.join(root, entry.name), 30000);
          modBytes += mod.bytes;
          modFiles += mod.files;
        }
        const result = { bytes: total.bytes, files: total.files, modBytes, modFiles, truncated: total.truncated };
        cache.set(rootKey, { ts: nowMs(), result });
        results.push({ id, name, exePath, root, ...result, cached: false });
      } catch { /* inaccessible or disconnected folder */ }
    };
    for (let start = 0; start < safeCandidates.length; start += 3) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(safeCandidates.slice(start, start + 3).map(measure));
    }
    return { ok: true, results, skipped: skipped.slice(0, 40), scannedAt: nowMs() };
  }

  return Object.freeze({ scanGames });
}

module.exports = { createStorageScanService };
