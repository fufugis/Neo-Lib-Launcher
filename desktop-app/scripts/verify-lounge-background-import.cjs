const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const { importLoungeBackground } = require('../electron/images/lounge-background-import.cjs');
const { registerDialogIpc } = require('../electron/ipc/dialog-ipc.cjs');

(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'neo-lounge-import-'));
  try {
    const original = path.join(root, 'my original.png');
    const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
    await fs.writeFile(original, bytes);
    const result = await importLoungeBackground(original, path.join(root, 'saved backgrounds'));
    assert.equal(result.ok, true);
    await fs.unlink(original);
    assert.deepEqual(await fs.readFile(fileURLToPath(result.url)), bytes, 'saved copy survives removal of original');
    const handlers = {};
    registerDialogIpc({
      registerIpc(channel, handler) { handlers[channel] = handler; },
      dialog: { async showOpenDialog() { return { canceled: false, filePaths: [fileURLToPath(result.url)] }; } },
      getMainWindow: () => null,
      loungeBackgroundRoot: () => path.join(root, 'ipc backgrounds'),
    });
    const ipcResult = await handlers['dialog:importLoungeBackground']();
    assert.equal(ipcResult.ok, true);
    assert.deepEqual(await fs.readFile(fileURLToPath(ipcResult.url)), bytes);
    const invalid = path.join(root, 'wrong.webp');
    await fs.writeFile(invalid, bytes);
    assert.equal((await importLoungeBackground(invalid, path.join(root, 'saved backgrounds'))).ok, false);
    const gif = path.join(root, 'loop.gif');
    const gifBytes = Buffer.from('GIF89a' + 'animated-gif-test');
    await fs.writeFile(gif, gifBytes);
    const savedGif = await importLoungeBackground(gif, path.join(root, 'saved backgrounds'));
    assert.equal(savedGif.ok, true, 'animated GIF artwork is privately copied');
    assert.deepEqual(await fs.readFile(fileURLToPath(savedGif.url)), gifBytes);
    const webm = path.join(root, 'loop.webm');
    const webmBytes = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x93, 0x42, 0x82, 0x88, 0x77, 0x65, 0x62, 0x6d, 0x00]);
    await fs.writeFile(webm, webmBytes);
    const savedWebm = await importLoungeBackground(webm, path.join(root, 'saved backgrounds'));
    assert.equal(savedWebm.ok, true, 'WebM hero video is privately copied');
    assert.deepEqual(await fs.readFile(fileURLToPath(savedWebm.url)), webmBytes);
    const mislabeled = path.join(root, 'not-video.webm');
    await fs.writeFile(mislabeled, bytes);
    assert.equal((await importLoungeBackground(mislabeled, path.join(root, 'saved backgrounds'))).ok, false, 'video extension alone does not bypass content sniffing');
    assert.equal((await importLoungeBackground(path.join(root, 'missing.png'), path.join(root, 'saved backgrounds'))).ok, false);
    const large = path.join(root, 'large.png');
    await fs.writeFile(large, Buffer.alloc(20 * 1024 * 1024 + 1));
    assert.equal((await importLoungeBackground(large, path.join(root, 'saved backgrounds'))).ok, false);
    console.log('PASS: Lounge still, animated and video imports validate signatures and keep private copies after moving originals.');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
