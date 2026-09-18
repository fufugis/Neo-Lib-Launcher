function createSaveService({
  fs, fsp, path, os, saveBackupsDir, safePathPart, isInside, folderStats,
  isDirectoryEmpty, defaultSteamPath, environment = process.env,
  now = () => new Date(), nowMs = () => Date.now(),
}) {
  if (!fs || !fsp || !path || !os || typeof saveBackupsDir !== 'function') {
    throw new TypeError('createSaveService requires filesystem, path, OS and storage dependencies.');
  }

  async function copyDirectoryContents(source, destination) {
    await fsp.mkdir(destination, { recursive: true });
    const entries = await fsp.readdir(source, { withFileTypes: true });
    for (const entry of entries) {
      await fsp.cp(path.join(source, entry.name), path.join(destination, entry.name), {
        recursive: true, force: false, errorOnExist: true, dereference: false,
      });
    }
  }

  async function inspect(savePath) {
    try {
      if (!savePath || typeof savePath !== 'string') return { ok: false, error: 'No save folder selected.' };
      const stat = await fsp.stat(savePath);
      if (!stat.isDirectory()) return { ok: false, error: 'The selected path is not a folder.' };
      return { ok: true, path: savePath, ...(await folderStats(savePath)) };
    } catch (error) {
      return { ok: false, error: error?.code === 'ENOENT' ? 'This folder no longer exists.' : String(error?.message || error) };
    }
  }

  async function listBackups(gameId) {
    try {
      const root = path.join(saveBackupsDir(), safePathPart(gameId));
      let entries = [];
      try { entries = await fsp.readdir(root, { withFileTypes: true }); } catch { return { ok: true, backups: [] }; }
      const backups = [];
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
        const backupPath = path.join(root, entry.name);
        try {
          const meta = JSON.parse(await fsp.readFile(path.join(backupPath, 'backup.json'), 'utf8'));
          backups.push({ ...meta, backupPath });
        } catch { /* incomplete backup is never shown as recoverable */ }
      }
      backups.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      return { ok: true, backups };
    } catch (error) { return { ok: false, error: String(error?.message || error), backups: [] }; }
  }

  async function createBackup({ gameId, gameName, savePath } = {}) {
    try {
      if (!gameId || !savePath) return { ok: false, error: 'Select a save folder first.' };
      const source = path.resolve(savePath);
      const stat = await fsp.stat(source);
      if (!stat.isDirectory()) return { ok: false, error: 'The selected save path is not a folder.' };
      const stamp = now().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(saveBackupsDir(), safePathPart(gameId), stamp);
      const contentPath = path.join(backupPath, 'files');
      await copyDirectoryContents(source, contentPath);
      const meta = { gameId, gameName: String(gameName || 'Game'), originalPath: source, createdAt: nowMs(), ...(await folderStats(contentPath)) };
      await fsp.writeFile(path.join(backupPath, 'backup.json'), JSON.stringify(meta, null, 2), 'utf8');
      return { ok: true, backup: { ...meta, backupPath } };
    } catch (error) { return { ok: false, error: String(error?.message || error) }; }
  }

  async function restore({ backupPath, savePath, mode = 'empty' } = {}) {
    try {
      const backupRoot = path.resolve(saveBackupsDir());
      const resolvedBackup = path.resolve(String(backupPath || ''));
      const contentPath = path.join(resolvedBackup, 'files');
      if (!isInside(backupRoot, resolvedBackup)) return { ok: false, error: 'That backup is outside NEO-LIB\'s backup folder.' };
      if (!(await fsp.stat(contentPath)).isDirectory()) return { ok: false, error: 'Backup files are missing.' };
      if (!savePath || typeof savePath !== 'string') return { ok: false, error: 'Choose a destination folder first.' };
      const target = path.resolve(savePath);
      await fsp.mkdir(target, { recursive: true });
      let destination = target;
      if (mode === 'safe-copy') {
        const stamp = now().toISOString().slice(0, 10);
        destination = path.join(target, `NEOLIB Restored ${stamp}`);
        let suffix = 2;
        while (fs.existsSync(destination)) destination = path.join(target, `NEOLIB Restored ${stamp} (${suffix++})`);
        await fsp.mkdir(destination, { recursive: true });
      } else if (!(await isDirectoryEmpty(target))) {
        return { ok: false, conflict: true, error: 'The live save folder already contains files. Nothing was changed.' };
      }
      await copyDirectoryContents(contentPath, destination);
      return { ok: true, restoredTo: destination, ...(await folderStats(destination)) };
    } catch (error) { return { ok: false, error: String(error?.message || error) }; }
  }

  async function detectCommon({ gameName, exePath, appid } = {}) {
    const candidates = new Map();
    const terms = String(gameName || '').toLowerCase().split(/[^a-z0-9]+/).filter(term => term.length >= 3).slice(0, 5);
    const gameKey = String(gameName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!terms.length) return { ok: true, candidates: [] };
    const add = async (candidatePath, source, baseScore = 0, allowBaseMatch = false) => {
      try {
        const stat = await fsp.stat(candidatePath);
        if (!stat.isDirectory()) return;
        const label = path.basename(candidatePath).toLowerCase();
        const matches = terms.filter(term => label.includes(term)).length;
        const score = baseScore + matches + (gameKey && label.replace(/[^a-z0-9]/g, '').includes(gameKey) ? 5 : 0);
        if (score <= baseScore && !allowBaseMatch) return;
        const key = path.resolve(candidatePath).toLowerCase();
        const current = candidates.get(key);
        if (!current || score > current.score) candidates.set(key, { path: candidatePath, source, score });
      } catch { /* absent/inaccessible candidate */ }
    };
    const addMatchingChildren = async (root, source) => {
      try {
        const entries = await fsp.readdir(root, { withFileTypes: true });
        for (const entry of entries.slice(0, 800)) {
          if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
          await add(path.join(root, entry.name), source, 0);
        }
      } catch { /* optional Windows folder is unavailable */ }
    };
    const home = os.homedir();
    const roots = [
      [path.join(home, 'Documents'), 'Documents'],
      [path.join(home, 'Documents', 'My Games'), 'Documents / My Games'],
      [path.join(home, 'Saved Games'), 'Saved Games'],
      [environment.APPDATA, 'AppData / Roaming'],
      [environment.LOCALAPPDATA, 'AppData / Local'],
      [environment.USERPROFILE ? path.join(environment.USERPROFILE, 'AppData', 'LocalLow') : '', 'AppData / LocalLow'],
    ].filter(([root]) => root);
    for (const [root, source] of roots) {
      await add(path.join(root, String(gameName || '')), source, 2);
      await addMatchingChildren(root, source);
    }
    if (exePath) {
      const gameRoot = path.dirname(exePath);
      for (const folder of ['save', 'saves', 'savedata', 'savegame', 'savegames']) await add(path.join(gameRoot, folder), 'Game folder', 1, true);
    }
    if (appid) {
      const steamPath = defaultSteamPath();
      const userdata = steamPath ? path.join(steamPath, 'userdata') : '';
      try {
        const users = await fsp.readdir(userdata, { withFileTypes: true });
        for (const user of users.slice(0, 20)) {
          if (!user.isDirectory() || !/^\d+$/.test(user.name)) continue;
          const remote = path.join(userdata, user.name, String(appid), 'remote');
          try {
            if ((await fsp.stat(remote)).isDirectory()) candidates.set(path.resolve(remote).toLowerCase(), { path: remote, source: 'Steam Cloud local mirror', score: 12 });
          } catch { /* no Steam Cloud mirror for this account/game */ }
        }
      } catch { /* Steam unavailable */ }
    }
    return { ok: true, candidates: [...candidates.values()].sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, 12) };
  }

  async function findCandidates({ root, gameName } = {}) {
    try {
      const rootPath = path.resolve(String(root || ''));
      if (!root || !(await fsp.stat(rootPath)).isDirectory()) return { ok: false, error: 'Choose a valid folder or drive to search.', candidates: [] };
      const terms = String(gameName || '').toLowerCase().split(/[^a-z0-9]+/).filter(term => term.length >= 3).slice(0, 5);
      if (!terms.length) return { ok: false, error: 'This game needs a longer name to search for save candidates.', candidates: [] };
      const candidates = [];
      let visited = 0;
      let truncated = false;
      const maxVisited = 40000;
      const maxDepth = 7;
      async function walk(current, depth) {
        if (visited >= maxVisited || candidates.length >= 80) { truncated = true; return; }
        let entries = [];
        try { entries = await fsp.readdir(current, { withFileTypes: true }); } catch { return; }
        for (const entry of entries) {
          if (visited >= maxVisited || candidates.length >= 80) { truncated = true; return; }
          if (entry.isSymbolicLink()) continue;
          visited += 1;
          const full = path.join(current, entry.name);
          const label = entry.name.toLowerCase();
          const matched = terms.filter(term => label.includes(term)).length;
          if (entry.isDirectory() && matched > 0) {
            candidates.push({ path: full, matchedTerms: matched });
            continue;
          }
          if (entry.isDirectory() && depth < maxDepth) await walk(full, depth + 1);
        }
      }
      await walk(rootPath, 0);
      return { ok: true, candidates, visited, truncated };
    } catch (error) { return { ok: false, error: String(error?.message || error), candidates: [] }; }
  }

  return Object.freeze({ inspect, listBackups, createBackup, restore, detectCommon, findCandidates });
}

module.exports = { createSaveService };
