// Hidden, isolated Electron smoke test: real JPEG -> private import -> HTTP
// renderer -> bounded protocol -> image decode + actual lighting sampler.
const { app, BrowserWindow, protocol, net, nativeImage } = require('electron');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const http = require('http');
const assert = require('assert/strict');
const { importLoungeBackground } = require('../electron/images/lounge-background-import.cjs');
const { createLoungeBackgroundHandler } = require('../electron/images/lounge-background-protocol.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'neolib-jpeg-runtime-'));
app.setPath('userData', root);
protocol.registerSchemesAsPrivileged([{ scheme: 'neolib-background', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
let window, server;
app.whenReady().then(async () => {
  const backgrounds = path.join(root, 'lounge-backgrounds');
  const original = path.join(root, 'normal picture.jpg');
  const pixels = Buffer.from([0, 60, 240, 255, 0, 60, 240, 255, 0, 60, 240, 255, 0, 60, 240, 255]);
  await fsp.writeFile(original, nativeImage.createFromBitmap(pixels, { width: 2, height: 2 }).toJPEG(95));
  const imported = await importLoungeBackground(original, backgrounds);
  assert(imported.ok);
  protocol.handle('neolib-background', createLoungeBackgroundHandler(backgrounds, (url, options) => net.fetch(url, options)));
  server = http.createServer((req, res) => {
    const modules = { '/lounge-light-analysis.mjs': '../src/components/lounge/lounge-light-analysis.mjs', '/lounge-background-url.mjs': '../src/components/lounge/lounge-background-url.mjs' };
    res.setHeader('Content-Type', modules[req.url] ? 'application/javascript' : 'text/html');
    res.end(modules[req.url] ? fs.readFileSync(path.join(__dirname, modules[req.url])) : '<!doctype html><body>JPEG test</body>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  window = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true } });
  await window.loadURL(base);
  const result = await window.webContents.executeJavaScript(`(async () => {
    const { prepareImportedArtwork } = await import(${JSON.stringify(base + '/lounge-light-analysis.mjs')});
    const profile = await prepareImportedArtwork(${JSON.stringify(imported.url)});
    return { width: profile.width, height: profile.height, color: profile.area.color, cells: profile.brightness.length };
  })()`);
  assert.equal(result.width, 2); assert.equal(result.height, 2); assert.equal(result.cells, 144); assert.equal(result.color.length, 3);
  console.log('PASS: real JPEG private import displays/decodes and lighting pixels are readable from the HTTP Electron renderer with web security enabled.');
}).catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  window?.destroy();
  if (server) await new Promise(resolve => server.close(resolve));
  await fsp.rm(root, { recursive: true, force: true });
  app.exit(process.exitCode || 0);
});
