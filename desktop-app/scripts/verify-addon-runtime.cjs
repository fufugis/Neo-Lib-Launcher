// Optional actual Electron smoke test. Never reads real NEO-LIB user data.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { guardAddonNavigation } = require('../electron/ipc/addons-ipc.cjs');
let fixture;
let window;
const timer = setTimeout(() => { console.error('FAIL: isolated add-on runtime timed out.'); app.exit(1); }, 20000);
async function run() {
  fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'neolib-addon-runtime-'));
  app.setPath('userData', fixture);
  await app.whenReady();
  const { addonDocument, ADDON_CHANNEL } = await import(pathToFileURL(path.join(__dirname, '../src/components/addons/addon-model.mjs')).href);
  const example = await fs.readFile(path.join(__dirname, '../examples/addons/library-shelf/index.html'), 'utf8');
  const source = addonDocument(example, false);
  window = new BrowserWindow({ show: false, width: 1200, height: 800, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } });
  window.webContents.on('will-frame-navigate', guardAddonNavigation);
  const init = { channel: ADDON_CHANNEL, type: 'init', apiVersion: 1, addonId: 'example.library-shelf', grants: ['library.read', 'storage'], theme: 'synthwave', storage: {}, library: [{ id: 'test', name: 'Smoke Test Game', source: 'local', cover: '', playtimeMinutes: 120 }] };
  await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<html><body><script>window.received=[];addEventListener('message',e=>{if(e.data.channel!==${JSON.stringify(ADDON_CHANNEL)})return;received.push(e.data);if(e.data.type==='ready')e.source.postMessage(${JSON.stringify(init)},'*');});</script><iframe name="neo-lib-addon:example.library-shelf" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe><script>document.querySelector('iframe').srcdoc=${JSON.stringify(source)};</script></body></html>`)}`);
  for (let index = 0; index < 60; index++) {
    if (await window.webContents.executeJavaScript(`received.some(message=>message.type==='ready')`)) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const frame = window.webContents.mainFrame.frames.find(value => value.url === 'about:srcdoc');
  assert(frame, 'sandboxed page frame exists');
  const report = await frame.executeJavaScript(`(async()=>{await neoLibAddon.ready;return {title:document.querySelector('article h2')?.textContent,api:typeof window.api,parentBlocked:(()=>{try{return parent.document.body===null}catch{return true}})()};})()`);
  assert.equal(report.title, 'Smoke Test Game'); assert.equal(report.api, 'undefined'); assert.equal(report.parentBlocked, true);
  await frame.executeJavaScript(`document.getElementById('sort').value='time';document.getElementById('sort').dispatchEvent(new Event('change'));`);
  assert(await window.webContents.executeJavaScript(`received.some(message=>message.type==='storage:set'&&message.key==='sort'&&message.value==='time')`));
  assert.equal(await frame.executeJavaScript(`fetch('https://example.invalid').then(()=>false,()=>true)`), true, 'network denied by CSP');
  await frame.executeJavaScript(`location.href='https://example.invalid';`);
  await new Promise(resolve => setTimeout(resolve, 200));
  assert.equal(frame.url, 'about:srcdoc', 'native navigation guard keeps CSP document');
  console.log('PASS: actual isolated Electron shelf renders public record, storage bridge sends, host/preload access denied, network denied and document navigation blocked. App navigation/settings acceptance remains pending.');
}
run().then(async () => { clearTimeout(timer); window?.destroy(); if (fixture) await fs.rm(fixture, { recursive: true, force: true }).catch(() => {}); app.exit(0); }).catch(async error => { clearTimeout(timer); console.error(error); window?.destroy(); if (fixture) await fs.rm(fixture, { recursive: true, force: true }).catch(() => {}); app.exit(1); });
