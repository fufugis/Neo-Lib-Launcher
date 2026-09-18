const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createStorageScanService } = require('../electron/storage/storage-scan-service.cjs');

async function folderStats(root, limit) {
  let files = 0;
  let bytes = 0;
  let truncated = false;
  async function walk(current) {
    for (const entry of await fsp.readdir(current, { withFileTypes: true })) {
      if (files >= limit) { truncated = true; return; }
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else { files += 1; bytes += (await fsp.stat(full)).size; }
    }
  }
  await walk(root);
  return { files, bytes, truncated };
}

(async () => {
  const sandbox = await fsp.mkdtemp(path.join(os.tmpdir(), 'neolib-storage-scan-'));
  try {
    const game = path.join(sandbox, 'Game');
    const mods = path.join(game, 'mods');
    const library = path.join(sandbox, 'Library');
    await fsp.mkdir(mods, { recursive: true });
    await fsp.mkdir(path.join(library, 'A'), { recursive: true });
    await fsp.mkdir(path.join(library, 'B'), { recursive: true });
    await fsp.writeFile(path.join(game, 'game.exe'), 'exe', 'utf8');
    await fsp.writeFile(path.join(game, 'data.bin'), 'data', 'utf8');
    await fsp.writeFile(path.join(mods, 'mod.bin'), 'mod-data', 'utf8');
    await fsp.writeFile(path.join(library, 'shared.exe'), 'exe', 'utf8');
    await fsp.writeFile(path.join(library, 'A', 'a.exe'), 'exe', 'utf8');
    await fsp.writeFile(path.join(library, 'B', 'b.exe'), 'exe', 'utf8');
    let clock = 1000;
    const service = createStorageScanService({
      fsp, path, folderStats, nowMs: () => clock,
      isInside(parent, candidate) {
        const relative = path.relative(parent, candidate);
        return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
      },
    });
    const games = [
      { id: 'game', name: 'Game', exePath: path.join(game, 'game.exe') },
      { id: 'duplicate', name: 'Duplicate', exePath: path.join(game, 'game.exe') },
      { id: 'missing', name: 'Missing', exePath: path.join(sandbox, 'missing.exe') },
      { id: 'launcher', name: 'Steam', exePath: path.join(game, 'steam.exe') },
      { id: 'shared', name: 'Shared', exePath: path.join(library, 'shared.exe') },
      { id: 'a', name: 'A', exePath: path.join(library, 'A', 'a.exe') },
      { id: 'b', name: 'B', exePath: path.join(library, 'B', 'b.exe') },
    ];
    await fsp.writeFile(path.join(game, 'steam.exe'), 'launcher', 'utf8');
    const first = await service.scanGames({ games });
    assert.equal(first.ok, true);
    assert.deepEqual(first.results.map(item => item.id).sort(), ['a', 'b', 'game']);
    assert.equal(first.results.find(item => item.id === 'game').modBytes, 8);
    assert(first.skipped.some(item => item.id === 'missing'));
    assert(first.skipped.some(item => item.id === 'launcher'));
    assert(first.skipped.some(item => item.id === 'shared' && item.reason.includes('2 other library roots')));
    assert(!first.results.some(item => item.id === 'duplicate'));
    clock += 1000;
    const cached = await service.scanGames({ games: [games[0]] });
    assert.equal(cached.results[0].cached, true);
    const forced = await service.scanGames({ games: [games[0]], force: true });
    assert.equal(forced.results[0].cached, false);
    console.log('PASS: extracted storage scan filters missing/launcher/shared/duplicate targets, measures mods, caps concurrency inputs and retains force-aware caching. Temporary sandbox only.');
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
