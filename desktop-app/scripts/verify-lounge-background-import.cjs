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
    assert.equal((await importLoungeBackground(path.join(root, 'missing.png'), path.join(root, 'saved backgrounds'))).ok, false);
    const large = path.join(root, 'large.png');
    await fs.writeFile(large, Buffer.alloc(20 * 1024 * 1024 + 1));
    assert.equal((await importLoungeBackground(large, path.join(root, 'saved backgrounds'))).ok, false);
    console.log('PASS: Lounge image import validates content and size, and the saved copy survives moving the original.');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
