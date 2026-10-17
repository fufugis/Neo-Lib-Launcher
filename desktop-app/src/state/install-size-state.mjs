// Saved measurements belong to library entries, not a screen's session cache.
const validBytes = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const samePath = (a, b) => typeof a === 'string' && typeof b === 'string' && a.replaceAll('\\', '/').toLowerCase() === b.replaceAll('\\', '/').toLowerCase();

export function installSizePatch(game, result, measuredAt = Date.now()) {
  if (!game || result?.id !== game.id || !samePath(game.exePath, result.exePath) || !validBytes(result.bytes)) return null;
  return {
    installSizeBytes: result.bytes,
    installSizeMeasuredAt: measuredAt,
    installSizePartial: Boolean(result.truncated),
    installSizeScan: { root: result.root || '', exePath: result.exePath, files: Number(result.files) || 0, modBytes: Number(result.modBytes) || 0, modFiles: Number(result.modFiles) || 0 },
  };
}

export function applyStorageMeasurements(library, scan) {
  if (scan?.ok !== true || !Array.isArray(scan.results)) return library;
  const measuredAt = Number(scan.scannedAt) > 0 ? Number(scan.scannedAt) : Date.now();
  const results = new Map(scan.results.map(result => [result.id, result]));
  let changed = false;
  const games = (library.games || []).map(game => {
    const patch = installSizePatch(game, results.get(game.id), measuredAt);
    if (!patch || Number(game.installSizeMeasuredAt || 0) > measuredAt) return game;
    changed = true;
    return { ...game, ...patch };
  });
  return changed ? { ...library, games } : library;
}

export function savedStorageSnapshot(games) {
  const results = (games || []).filter(game => !game.homeLocked && validBytes(game.installSizeBytes)).map(game => ({
    // Old measurements without scan details remain useful; never invent a folder.
    ...(samePath(game.exePath, game.installSizeScan?.exePath) ? game.installSizeScan : {}),
    id: game.id, name: game.name, bytes: game.installSizeBytes,
    truncated: Boolean(game.installSizePartial), measuredAt: Number(game.installSizeMeasuredAt) || 1,
  }));
  return { results, scannedAt: results.reduce((latest, result) => Math.max(latest, result.measuredAt), 0) };
}
