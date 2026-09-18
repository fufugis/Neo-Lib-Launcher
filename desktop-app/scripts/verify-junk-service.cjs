const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createJunkService } = require('../electron/optimize/junk-service.cjs');

(async () => {
  const sandbox = await fsp.mkdtemp(path.join(os.tmpdir(), 'neolib-junk-service-'));
  try {
    const gameRoot = path.join(sandbox, 'Games', 'One');
    await fsp.mkdir(gameRoot, { recursive: true });
    const exe = path.join(gameRoot, 'game.exe');
    const oldLog = path.join(sandbox, 'old.log');
    const freshTmp = path.join(sandbox, 'fresh.tmp');
    const protectedSave = path.join(sandbox, 'protected.bak');
    const changed = path.join(sandbox, 'changed.dmp');
    const archive = path.join(gameRoot, 'installer.zip');
    await Promise.all([
      fsp.writeFile(exe, 'exe'), fsp.writeFile(oldLog, 'log'), fsp.writeFile(freshTmp, 'fresh'),
      fsp.writeFile(protectedSave, 'save'), fsp.writeFile(changed, 'dump'), fsp.writeFile(archive, ''),
    ]);
    await fsp.truncate(archive, 251 * 1024 * 1024);
    const old = new Date('2026-08-01T00:00:00Z');
    await Promise.all([oldLog, protectedSave, changed, archive].map(file => fsp.utimes(file, old, old)));
    let clock = Date.parse('2026-09-15T12:00:00Z');
    const trashedPaths = [];
    const service = createJunkService({
      fsp, path, tempDir: () => sandbox, environment: {}, nowMs: () => clock,
      normalWinPath: value => String(value || '').replace(/\//g, '\\').toLowerCase(),
      shell: { async trashItem(file) { trashedPaths.push(file); } },
    });
    const scan = await service.scan({ games: [{ exePath: exe, saveFolder: protectedSave }] });
    assert.equal(scan.ok, true);
    assert(scan.items.some(item => item.path === oldLog && item.selectedByDefault));
    assert(scan.items.some(item => item.path === changed));
    assert(scan.items.some(item => item.path === archive && !item.selectedByDefault));
    assert(!scan.items.some(item => item.path === freshTmp));
    assert(!scan.items.some(item => item.path === protectedSave));

    const oldToken = scan.items.find(item => item.path === oldLog).token;
    const changedToken = scan.items.find(item => item.path === changed).token;
    await fsp.appendFile(changed, 'changed');
    const result = await service.trash({ tokens: [oldToken, oldToken, changedToken, 'unknown'] });
    assert.deepEqual(trashedPaths, [oldLog]);
    assert.equal(result.trashed.length, 1);
    assert(result.failed.some(item => item.token === changedToken && item.error === 'File changed since scan'));
    assert(result.failed.some(item => item.token === 'unknown' && item.error === 'Stale scan result'));
    assert.equal((await service.trash({ tokens: [oldToken] })).failed[0].error, 'Stale scan result');

    const later = await service.scan({ games: [] });
    clock += 31 * 60 * 1000;
    const staleToken = later.items.find(item => item.path === oldLog).token;
    assert.equal((await service.trash({ tokens: [staleToken] })).failed[0].error, 'Stale scan result');
    console.log('PASS: extracted junk review limits roots/age/types, protects configured paths, requires unchanged fresh scan tokens, deduplicates selections and uses the injected Recycle Bin action only. Temporary sandbox; no files deleted.');
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
