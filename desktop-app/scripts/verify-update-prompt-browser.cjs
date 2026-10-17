// Read-only release diagnostic: real React popup in an isolated hidden profile.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
if (!process.versions.electron) {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
  const result = require('node:child_process').spawnSync(require('electron'), [__filename, ...process.argv.slice(2)], { env, stdio: 'inherit', windowsHide: true, timeout: 60000 });
  if (result.error) console.error(result.error.message);
  process.exit(result.status ?? 1);
}
const { app, BrowserWindow } = require('electron');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'neolib-update-audit-'));
app.setPath('userData', profile);
app.whenReady().then(async () => {
  const server = require('node:http').createServer((_request, response) => { response.end('<!doctype html><body><div id="root"></div></body>'); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const esbuild = require('node:module').createRequire(require.resolve('vite'))('esbuild');
  const bundle = await esbuild.build({ stdin: { resolveDir: path.resolve(__dirname, '..'), loader: 'jsx', contents: `
    import React from 'react'; import { createRoot } from 'react-dom/client'; import { flushSync } from 'react-dom';
    import AppUpdatePrompt from './src/components/AppUpdatePrompt.jsx';
    import { MotionGlobalConfig } from 'framer-motion';
    MotionGlobalConfig.skipAnimations = true; // Hidden-window RAF timing is not a visual acceptance test.
    import { checkForUpdates } from './src/lib/updateChecker.js';
    globalThis.fixture = { React, createRoot, flushSync, AppUpdatePrompt, checkForUpdates };
  ` }, bundle: true, write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"development"' } });
  const window = new BrowserWindow({ show: false, width: 1000, height: 800, webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false } });
  await window.loadURL('http://127.0.0.1:' + server.address().port);
  await window.webContents.executeJavaScript(bundle.outputFiles[0].text);
  const result = await window.webContents.executeJavaScript(`(async () => {
    const { React, createRoot, flushSync, AppUpdatePrompt } = fixture;
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    const tick = () => new Promise(resolve => setTimeout(resolve, 180));
    const settle = async condition => { const deadline = performance.now() + 3000; while (!condition() && performance.now() < deadline) await new Promise(resolve => setTimeout(resolve, 25)); };
    let root = createRoot(document.getElementById('root')), paused = true, downloads = [], notes = 0, fail = false, pending;
    let info = { available: true, currentVersion: '1.8.6', latestVersion: '1.8.7', releaseUrl: 'https://github.com/fufugis/Neo-Lib-Launcher/releases/tag/v1.8.7', downloadUrl: 'https://github.com/fufugis/Neo-Lib-Launcher/releases/download/v1.8.7/NEO-LIB-Setup.exe' };
    const draw = () => flushSync(() => root.render(React.createElement(AppUpdatePrompt, { info, paused, onReleaseNotes: () => notes++, onDownload: async url => { downloads.push(url); if (fail) return { ok: false }; return new Promise(resolve => pending = resolve); } })));
    const popup = () => document.querySelector('[data-testid="app-update-popup"]');
    const button = text => [...(popup()?.querySelectorAll('button') || [])].find(button => button.textContent === text);
    localStorage.clear(); draw(); await tick(); check(!popup(), 'no popup during paused gameplay/startup/Lounge');
    const blocker = document.createElement('div'); blocker.setAttribute('data-controller-surface', 'modal'); document.body.append(blocker);
    paused = false; draw(); await tick(); check(!popup(), 'another modal defers popup');
    blocker.remove(); await tick(); check(popup()?.textContent.includes('1.8.7'), 'real new-version popup appears when clear');
    check(document.activeElement === popup().querySelector('[data-update-download]'), 'download gets keyboard focus');
    flushSync(() => button('Release notes').click()); check(notes === 1, 'release-notes action is wired');
    fail = true; flushSync(() => button('Download update').click()); await tick();
    check(popup()?.querySelector('[role="alert"]') && !localStorage.getItem('neolib:app-update-dismissed'), 'failed browser open leaves retryable popup');
    fail = false;
    const download = button('Download update'); flushSync(() => { download.click(); download.click(); });
    check(downloads.length === 2 && download.disabled, 'one retry request despite double click');
    check(downloads[1] === info.downloadUrl, 'exact trusted installer URL reaches native-open callback');
    pending({ ok: true }); await settle(() => !popup()); check(!popup(), 'successful open dismisses popup');
    check(localStorage.getItem('neolib:app-update-dismissed') === '1.8.7', 'dismissal saves per release');
    flushSync(() => root.unmount()); root = createRoot(document.getElementById('root')); draw(); await tick(); check(!popup(), 'dismissal survives remount from saved storage');
    window.dispatchEvent(new Event('neolib:show-app-update')); await tick(); check(popup(), 'manual check reopens dismissed version');
    flushSync(() => button('Later').click()); await settle(() => !popup()); check(!popup(), 'Later dismisses');
    info = { ...info, latestVersion: '1.8.8' }; draw(); await tick(); check(popup()?.textContent.includes('1.8.8'), 'newer release prompts again');
    paused = true; draw(); await settle(() => !popup()); check(!popup(), 'game/rest pause closes or defers an existing popup');
    paused = false; draw(); await tick(); check(popup(), 'wake makes undismissed update visible again');
    flushSync(() => root.unmount()); localStorage.clear();
    return { modalDeferral: true, pauseAndWake: true, failureRetry: true, trustedDownloadCallback: true, duplicateClickGuard: true, savedDismissal: true, manualReopen: true, nextRelease: true };
  })()`);
  console.log('PASS: rendered update popup with isolated storage and mocked external opening:', result);
  if (process.argv.includes('--live')) {
    const live = await window.webContents.executeJavaScript(`(async () => {
      const older = await fixture.checkForUpdates('1.8.5', { force: true });
      const current = await fixture.checkForUpdates('1.8.6', { force: true });
      if (older.error || current.error) throw new Error('Renderer could not reach GitHub');
      return { older, current };
    })()`);
    console.log('LIVE READ-ONLY: actual Electron renderer GitHub checks:', JSON.stringify(live));
  }
  window.destroy(); await new Promise(resolve => server.close(resolve)); app.quit();
}).catch(error => { console.error(error); app.exit(1); });
app.on('will-quit', () => {
  if (path.dirname(profile) === os.tmpdir() && path.basename(profile).startsWith('neolib-update-audit-')) {
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* Electron may briefly retain its log handle. */ }
  }
});
