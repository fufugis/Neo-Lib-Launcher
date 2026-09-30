const assert = require('node:assert/strict');
const path = require('node:path');
const { createLibraryBackupService, FORMAT, VERSION } = require('../electron/library/library-backup-service.cjs');

async function run() {
  let savedText = '';
  let importedText = '';
  let saveDialogCalls = 0;
  let temporary = '';
  let renamed = '';
  const coversRoot = path.resolve('C:\\NEO-LIB-test-covers');
  const cachedArt = path.join(coversRoot, 'Example_123.png');
  let artFileText = '';
  let removedArtwork = [];
  const library = {
    games: [{ id: 'game-1', name: 'Example', playtime: 240, coverUrl: `file://${cachedArt.replace(/\\/g, '/')}`, background: 'https://art.test/hero.jpg', metadataSource: 'steam' }],
    categories: [{ id: 'private-1', name: 'Private', private: true, pinHash: 'stored-hash' }],
    gameOrderByCategory: {}, tools: [{ id: 'tool-1', name: 'Tool' }], toolCategories: [], toolOrderByCategory: {},
  };
  const dialog = {
    async showSaveDialog() { saveDialogCalls += 1; return { canceled: false, filePath: 'C:\\backups\\library.json' }; },
    async showOpenDialog() { return { canceled: false, filePaths: ['C:\\backups\\library.json'] }; },
  };
  const fsPromises = {
    async writeFile(file, text) { temporary = file; if (file.includes('NEO-LIB-test-covers')) artFileText = Buffer.from(text).toString('base64'); else savedText = text; },
    async rename(from, to) { assert.equal(from, temporary); renamed = to; },
    async unlink(file) { removedArtwork.push(file); },
    async stat(file) { return { size: file === cachedArt ? Buffer.byteLength('cover-bytes') : Buffer.byteLength(importedText), isFile: () => true }; },
    async readFile(file) { return file === cachedArt ? Buffer.from('cover-bytes') : importedText; },
    async readdir() { return [{ name: 'Example_123.png', isFile: () => true }, { name: 'keep-dir', isFile: () => false }, { name: 'notes.txt', isFile: () => true }]; },
  };
  const service = createLibraryBackupService({ dialog, getMainWindow: () => ({}), fsPromises, path, coversDir: () => coversRoot, now: () => Date.UTC(2026, 8, 30) });

  const invalid = await service.exportLibrary({ games: 'not an array' });
  assert.equal(invalid.ok, false);
  assert.equal(saveDialogCalls, 0, 'invalid data is rejected before showing the file picker');

  const exported = await service.exportLibrary(library);
  assert.equal(exported.ok, true);
  assert.equal(exported.gameCount, 1);
  assert.equal(renamed, 'C:\\backups\\library.json');
  const envelope = JSON.parse(savedText);
  assert.equal(envelope.format, FORMAT);
  assert.equal(envelope.version, VERSION);
  assert.equal(envelope.library.games[0].coverUrl, 'neolib-backup-asset://art-1');
  assert.deepEqual(envelope.assets['art-1'], { fileName: 'Example_123.png', data: Buffer.from('cover-bytes').toString('base64') });
  const libraryWithoutArtUrl = JSON.parse(JSON.stringify(library));
  delete libraryWithoutArtUrl.games[0].coverUrl;
  const envelopeLibraryWithoutAsset = JSON.parse(JSON.stringify(envelope.library));
  delete envelopeLibraryWithoutAsset.games[0].coverUrl;
  assert.deepEqual(envelopeLibraryWithoutAsset, libraryWithoutArtUrl, 'backup retains all other library fields, including game metadata and private category hashes');

  importedText = savedText;
  const imported = await service.importLibrary();
  assert.equal(imported.ok, true);
  assert.match(imported.library.games[0].coverUrl, /^file:\/\//);
  assert.equal(imported.library.games[0].coverUrl.includes('restore_art-1_Example_123.png'), true);
  assert.equal(artFileText, Buffer.from('cover-bytes').toString('base64'), 'local cached artwork is included in the backup and restored');

  importedText = JSON.stringify({ format: 'wrong-format', version: VERSION, library });
  const unsupported = await service.importLibrary();
  assert.equal(unsupported.ok, false, 'unrelated JSON is not accepted as a library backup');

  const artworkClear = await service.clearArtwork();
  assert.deepEqual(artworkClear, { ok: true, removed: 1 });
  assert.deepEqual(removedArtwork, [path.join(coversRoot, 'Example_123.png')], 'reset removes only image files directly inside the dedicated cache folder');

  console.log('Library backup service passed (validated envelope, full document preservation, round-trip and unsupported-file rejection).');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
