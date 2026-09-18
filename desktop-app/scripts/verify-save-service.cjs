const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createSaveService } = require('../electron/saves/save-service.cjs');

async function folderStats(root) {
  let files = 0;
  let bytes = 0;
  for (const entry of await fsp.readdir(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) {
      const nested = await folderStats(file);
      files += nested.files;
      bytes += nested.bytes;
    } else {
      files += 1;
      bytes += (await fsp.stat(file)).size;
    }
  }
  return { files, bytes, truncated: false };
}

(async () => {
  const sandbox = await fsp.mkdtemp(path.join(os.tmpdir(), 'neolib-save-service-'));
  try {
    const source = path.join(sandbox, 'source');
    const backups = path.join(sandbox, 'backups');
    const restoreTarget = path.join(sandbox, 'restored');
    await fsp.mkdir(source, { recursive: true });
    await fsp.writeFile(path.join(source, 'save.dat'), 'player-state', 'utf8');
    const service = createSaveService({
      fs, fsp, path, os: { homedir: () => path.join(sandbox, 'home') },
      saveBackupsDir: () => backups,
      safePathPart: value => String(value).replace(/[^a-z0-9._-]+/gi, '-'),
      isInside(parent, candidate) {
        const relative = path.relative(parent, candidate);
        return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
      },
      folderStats,
      async isDirectoryEmpty(directory) { return (await fsp.readdir(directory)).length === 0; },
      defaultSteamPath: () => '',
      environment: {},
      now: () => new Date('2026-09-15T10:20:30.000Z'),
      nowMs: () => 1_757_931_630_000,
    });

    assert.deepEqual(await service.inspect(''), { ok: false, error: 'No save folder selected.' });
    assert.deepEqual(await service.inspect(source), { ok: true, path: source, files: 1, bytes: 12, truncated: false });
    const created = await service.createBackup({ gameId: 'game one', gameName: 'Game One', savePath: source });
    assert.equal(created.ok, true, JSON.stringify(created));
    assert.equal(created.backup.createdAt, 1_757_931_630_000);
    assert.equal(await fsp.readFile(path.join(created.backup.backupPath, 'files', 'save.dat'), 'utf8'), 'player-state');
    assert.deepEqual((await service.listBackups('game one')).backups.map(item => item.backupPath), [created.backup.backupPath]);

    assert.equal((await service.restore({ backupPath: created.backup.backupPath, savePath: restoreTarget })).ok, true);
    assert.equal(await fsp.readFile(path.join(restoreTarget, 'save.dat'), 'utf8'), 'player-state');
    assert.equal((await service.restore({ backupPath: created.backup.backupPath, savePath: restoreTarget })).conflict, true);
    assert.match((await service.restore({ backupPath: sandbox, savePath: restoreTarget })).error, /outside NEO-LIB/);

    const searchRoot = path.join(sandbox, 'search');
    await fsp.mkdir(path.join(searchRoot, 'Game One Saves'), { recursive: true });
    const found = await service.findCandidates({ root: searchRoot, gameName: 'Game One' });
    assert.equal(found.ok, true);
    assert.equal(found.candidates[0].matchedTerms, 2);
    assert.deepEqual(await service.detectCommon({ gameName: 'x' }), { ok: true, candidates: [] });
    console.log('PASS: extracted save service preserves inspection, backup metadata/copying, path confinement, non-overwrite restore, bounded candidate search and empty auto-detection behavior. Temporary sandbox only.');
  } finally {
    await fsp.rm(sandbox, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
