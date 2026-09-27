const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const { importLoungeAudio } = require('../electron/audio/lounge-audio-import.cjs');
const { registerDialogIpc } = require('../electron/ipc/dialog-ipc.cjs');

(async () => {
  for (let index = 1; index <= 4; index += 1) {
    const bundled = path.join(__dirname, '..', 'src', 'assets', 'lounge', `ambience-${index}.mp3`);
    const file = await fs.open(bundled, 'r');
    try {
      const stats = await file.stat();
      const header = Buffer.alloc(3);
      await file.read(header, 0, 3, 0);
      assert(stats.size > 1024 && stats.size < 30 * 1024 * 1024, `bundled ambience ${index} has a reasonable size`);
      assert.equal(header.toString('ascii'), 'ID3', `bundled ambience ${index} is an MP3`);
    } finally { await file.close(); }
  }

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'neo-lounge-audio-'));
  try {
    const original = path.join(root, 'my song.mp3');
    const bytes = Buffer.from('ID3\u0004\u0000\u0000\u0000\u0000\u0000\u0000TEST', 'binary');
    await fs.writeFile(original, bytes);
    const saved = await importLoungeAudio(original, path.join(root, 'saved audio'));
    assert.equal(saved.ok, true);
    await fs.unlink(original);
    assert.deepEqual(await fs.readFile(fileURLToPath(saved.url)), bytes, 'the private copy survives moving the original');

    const handlers = {};
    registerDialogIpc({
      registerIpc(channel, handler) { handlers[channel] = handler; },
      dialog: { async showOpenDialog() { return { canceled: false, filePaths: [fileURLToPath(saved.url)] }; } },
      getMainWindow: () => null,
      loungeAudioRoot: () => path.join(root, 'ipc audio'),
    });
    const picked = await handlers['dialog:importLoungeAudio']();
    assert.equal(picked.ok, true);
    assert.deepEqual(await fs.readFile(fileURLToPath(picked.url)), bytes);

    const fake = path.join(root, 'not-a-song.mp3');
    await fs.writeFile(fake, Buffer.from('This is not MP3 audio.'));
    assert.equal((await importLoungeAudio(fake, path.join(root, 'saved audio'))).ok, false);
    assert.equal((await importLoungeAudio(path.join(root, 'missing.mp3'), path.join(root, 'saved audio'))).ok, false);
    assert.equal((await importLoungeAudio(path.join(root, 'image.png'), path.join(root, 'saved audio'))).ok, false);
    const large = path.join(root, 'large.mp3');
    await fs.writeFile(large, Buffer.alloc(30 * 1024 * 1024 + 1));
    assert.equal((await importLoungeAudio(large, path.join(root, 'saved audio'))).ok, false);
    console.log('PASS: four bundled MP3s and bounded private custom-audio import.');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
