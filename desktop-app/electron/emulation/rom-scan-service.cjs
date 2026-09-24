function createRomScanService({ fsp, path }) {
  if (typeof fsp?.readdir !== 'function' || typeof fsp?.stat !== 'function' || !path?.join || !path?.extname) {
    throw new TypeError('createRomScanService requires filesystem and path helpers.');
  }

  async function scan({ root, extensions = [], maxDepth = 6, maxFiles = 2000 } = {}) {
    const allowed = new Set(extensions.map(value => String(value || '').trim().toLowerCase()).filter(value => /^\.[a-z0-9]{1,8}$/.test(value)));
    if (!path.isAbsolute(root || '') || !allowed.size) return { ok: false, error: 'Choose a ROM folder and at least one supported file type.', items: [], truncated: false, visitedFiles: 0 };
    const items = [];
    let visitedFiles = 0;
    let truncated = false;
    async function walk(directory, depth) {
      if (depth > maxDepth || items.length >= maxFiles) { truncated = true; return; }
      let entries = [];
      try { entries = await fsp.readdir(directory, { withFileTypes: true }); } catch { return; }
      for (const entry of entries) {
        if (items.length >= maxFiles) { truncated = true; return; }
        if (entry.isSymbolicLink()) continue;
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) { await walk(fullPath, depth + 1); continue; }
        if (!entry.isFile()) continue;
        visitedFiles += 1;
        const extension = path.extname(entry.name).toLowerCase();
        if (!allowed.has(extension)) continue;
        let stats;
        try { stats = await fsp.stat(fullPath); } catch { continue; }
        items.push({ path: fullPath, extension, sizeBytes: Math.max(0, Math.round(Number(stats.size) || 0)), modifiedAt: Math.max(0, Number(stats.mtimeMs) || 0) });
      }
    }
    await walk(root, 0);
    items.sort((left, right) => left.path.localeCompare(right.path, undefined, { numeric: true, sensitivity: 'base' }));
    return { ok: true, items, truncated, visitedFiles };
  }

  return Object.freeze({ scan });
}

module.exports = { createRomScanService };
