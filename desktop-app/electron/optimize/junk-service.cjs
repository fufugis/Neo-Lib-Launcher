function createJunkService({ fsp, path, shell, tempDir, normalWinPath, environment = process.env, nowMs = () => Date.now() }) {
  if (!fsp || !path || !shell || typeof tempDir !== 'function' || typeof normalWinPath !== 'function') {
    throw new TypeError('createJunkService requires filesystem, path, shell, temp and path-normalization dependencies.');
  }
  const snapshot = new Map();
  const fileToken = (filePath, stat) => Buffer.from(`${filePath}|${stat.size}|${stat.mtimeMs}`).toString('base64url').slice(0, 120);

  async function collect(root, options, out, seen) {
    const { depth = 0, maxDepth = 1, kind = 'Temporary file', match, minAgeMs = 0, maxEntries = 3000 } = options;
    if (!root || !path.isAbsolute(root) || out.length >= 600 || seen.visited >= maxEntries) return;
    let entries = [];
    try { entries = await fsp.readdir(root, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (out.length >= 600 || seen.visited >= maxEntries) break;
      seen.visited += 1;
      const fullPath = path.join(root, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (depth < maxDepth) await collect(fullPath, { ...options, depth: depth + 1 }, out, seen);
        continue;
      }
      if (!entry.isFile() || !match(entry.name, fullPath)) continue;
      try {
        const stat = await fsp.stat(fullPath);
        if (nowMs() - stat.mtimeMs < minAgeMs) continue;
        const token = fileToken(fullPath, stat);
        if (snapshot.has(token)) continue;
        const item = { token, path: fullPath, name: entry.name, folder: path.dirname(fullPath), bytes: stat.size, modifiedAt: stat.mtimeMs, kind, selectedByDefault: kind !== 'Large installer or archive' };
        snapshot.set(token, { ...item, capturedAt: nowMs() });
        out.push(item);
      } catch { /* file disappeared or became inaccessible */ }
    }
  }

  async function scan({ games = [] } = {}) {
    snapshot.clear();
    const out = [];
    const protectedFiles = new Set((games || []).flatMap(game => [game?.exePath, game?.saveFolder]).filter(Boolean).map(normalWinPath));
    const safeMatch = (name, fullPath) => !protectedFiles.has(normalWinPath(fullPath)) && /(?:\.tmp$|\.log$|\.dmp$|\.old$|\.bak$|crash|report)/i.test(name);
    const seen = { visited: 0 };
    const week = 7 * 24 * 60 * 60 * 1000;
    const knownRoots = [
      { root: tempDir(), kind: 'Old temporary/log file', maxDepth: 2, match: safeMatch, minAgeMs: week },
      { root: path.join(environment.LOCALAPPDATA || '', 'CrashDumps'), kind: 'Crash dump', maxDepth: 1, match: (name, fullPath) => !protectedFiles.has(normalWinPath(fullPath)) && /\.dmp$/i.test(name), minAgeMs: 24 * 60 * 60 * 1000 },
    ];
    for (const config of knownRoots) await collect(config.root, { ...config, maxEntries: 5000 }, out, seen);
    const archiveRoots = new Set();
    for (const game of (games || []).slice(0, 500)) {
      const exePath = String(game?.exePath || '');
      if (!path.isAbsolute(exePath)) continue;
      const gameRoot = path.dirname(exePath);
      archiveRoots.add(gameRoot);
      archiveRoots.add(path.dirname(gameRoot));
    }
    const largeArchive = (name, fullPath) => !protectedFiles.has(normalWinPath(fullPath)) && /(?:\.zip|\.rar|\.7z|\.iso|\.msi|setup\.exe)$/i.test(name);
    for (const root of [...archiveRoots].slice(0, 120)) {
      const before = out.length;
      await collect(root, { maxDepth: 1, kind: 'Large installer or archive', match: largeArchive, minAgeMs: 14 * 24 * 60 * 60 * 1000, maxEntries: 1200 }, out, seen);
      for (let index = before; index < out.length; index += 1) {
        if (out[index].bytes < 250 * 1024 * 1024) {
          snapshot.delete(out[index].token);
          out[index] = null;
        }
      }
    }
    const items = out.filter(Boolean).sort((a, b) => b.bytes - a.bytes).slice(0, 500);
    const keep = new Set(items.map(item => item.token));
    for (const token of snapshot.keys()) if (!keep.has(token)) snapshot.delete(token);
    return { ok: true, items, totalBytes: items.reduce((sum, item) => sum + item.bytes, 0), scannedAt: nowMs(), visited: seen.visited, scope: 'Known Windows temp/crash locations and folders beside configured library games only.' };
  }

  async function trash({ tokens = [] } = {}) {
    const selected = [...new Set(tokens)].slice(0, 100);
    const trashed = [];
    const failed = [];
    for (const token of selected) {
      const record = snapshot.get(String(token));
      if (!record || nowMs() - record.capturedAt > 30 * 60 * 1000) { failed.push({ token, error: 'Stale scan result' }); continue; }
      try {
        const stat = await fsp.stat(record.path);
        if (!stat.isFile() || fileToken(record.path, stat) !== token) { failed.push({ token, error: 'File changed since scan' }); continue; }
        await shell.trashItem(record.path);
        trashed.push({ token, path: record.path, bytes: record.bytes });
        snapshot.delete(token);
      } catch (error) { failed.push({ token, error: error?.message || 'Could not move file to Recycle Bin' }); }
    }
    return { ok: failed.length === 0, trashed, failed, reclaimedBytes: trashed.reduce((sum, item) => sum + item.bytes, 0) };
  }

  return Object.freeze({ scan, trash });
}

module.exports = { createJunkService };
