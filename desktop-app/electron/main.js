/* Electron Main Process
 * - Creates main window with custom frame
 * - Persists library + settings as JSON in userData
 * - Provides IPC for file picker, exe icon extraction, drive scan,
 *   Steam Store metadata fetch, and game launching.
 */
const { app, BrowserWindow, ipcMain, dialog, shell, nativeImage, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const { spawn, execFile } = require('child_process');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const os = require('os');
const { createLauncherScanners } = require('./launchers/scanners.cjs');
const { createAppStorage } = require('./storage/app-storage.cjs');
const { createDocumentStore } = require('./storage/document-store.cjs');
const { createIpcRegistry } = require('./ipc/registry.cjs');
const { createIpcFailureReporter } = require('./ipc/failure-log.cjs');
const { createDiagnosticRecorder } = require('./diagnostics/diagnostic-recorder.cjs');
const { registerPersistenceIpc } = require('./ipc/persistence-ipc.cjs');
const { registerWindowIpc } = require('./ipc/window-ipc.cjs');
const { registerDialogIpc } = require('./ipc/dialog-ipc.cjs');
const { registerShellIpc } = require('./ipc/shell-ipc.cjs');
const { registerExeIpc } = require('./ipc/exe-ipc.cjs');
const { registerSystemIpc } = require('./ipc/system-ipc.cjs');
const { registerPlaytimeIpc } = require('./ipc/playtime-ipc.cjs');
const { registerImageIpc } = require('./ipc/image-ipc.cjs');
const { registerAppOsIpc } = require('./ipc/app-os-ipc.cjs');
const { registerAppLifecycleIpc } = require('./ipc/app-lifecycle-ipc.cjs');
const { registerDiagnosticsIpc } = require('./ipc/diagnostics-ipc.cjs');
const { registerDoctorIpc } = require('./ipc/doctor-ipc.cjs');
const { registerDealsIpc } = require('./ipc/deals-ipc.cjs');
const { registerGameIpc } = require('./ipc/game-ipc.cjs');
const { registerGeminiIpc } = require('./ipc/gemini-ipc.cjs');
const { registerGogIpc } = require('./ipc/gog-ipc.cjs');
const { registerLauncherIpc } = require('./ipc/launcher-ipc.cjs');
const { registerMetadataIpc } = require('./ipc/metadata-ipc.cjs');
const { registerNewsIpc } = require('./ipc/news-ipc.cjs');
const { registerOptimizeIpc } = require('./ipc/optimize-ipc.cjs');
const { registerReleasesIpc } = require('./ipc/releases-ipc.cjs');
const { registerSavesIpc } = require('./ipc/saves-ipc.cjs');
const { registerScanIpc } = require('./ipc/scan-ipc.cjs');
const { registerSteamIpc } = require('./ipc/steam-ipc.cjs');
const { registerStorageIpc } = require('./ipc/storage-ipc.cjs');
const { registerToolsIpc } = require('./ipc/tools-ipc.cjs');
const { registerUpdatesIpc } = require('./ipc/updates-ipc.cjs');
const { registerWebIpc } = require('./ipc/web-ipc.cjs');
const { registerWidgetsIpc } = require('./ipc/widgets-ipc.cjs');
const { createSystemHealthService } = require('./system/system-health-service.cjs');
const { createPlaytimeHistoryService, localDayKey } = require('./playtime/playtime-history-service.cjs');
const { createImageCacheService } = require('./images/image-cache-service.cjs');
const { createAppOsService } = require('./app/app-os-service.cjs');
const { createAppLifecycleService } = require('./app/app-lifecycle-service.cjs');
const { createLaunchDoctorService } = require('./doctor/launch-doctor-service.cjs');
const { createSaveService } = require('./saves/save-service.cjs');
const { createStorageScanService } = require('./storage/storage-scan-service.cjs');
const { createJunkService } = require('./optimize/junk-service.cjs');
const { createOptimizeProcessService } = require('./optimize/process-inspection-service.cjs');
const { createExternalGameWatchService } = require('./game/external-game-watch-service.cjs');
const { createGameLaunchService } = require('./game/game-launch-service.cjs');
const { createStoreProviderService } = require('./providers/store-provider-service.cjs');
const { createPublicWebProviderService } = require('./providers/public-web-provider-service.cjs');
const { createSpecialistMetadataProviderService } = require('./providers/specialist-metadata-provider-service.cjs');
const { createMetadataCandidateService } = require('./providers/metadata-candidate-service.cjs');
const { createGeminiProviderService } = require('./providers/gemini-provider-service.cjs');
const { createNewsNormalizationService } = require('./providers/news-normalization-service.cjs');
const { createPublicNewsProviderService } = require('./providers/public-news-provider-service.cjs');
const { createWeeklyReleaseProviderService } = require('./providers/weekly-release-provider-service.cjs');
const { createSteamNewsProviderService } = require('./providers/steam-news-provider-service.cjs');
const { createOwnedNewsProviderService } = require('./providers/owned-news-provider-service.cjs');
const { createUpdateHistoryProviderService } = require('./providers/update-history-provider-service.cjs');
const { createDealsProviderService } = require('./providers/deals-provider-service.cjs');
const { createUpdateScanCoordinatorService } = require('./providers/update-scan-coordinator-service.cjs');
const { createUpdateSourceDiscoveryService } = require('./providers/update-source-discovery-service.cjs');
const { createInstalledVersionEvidenceService } = require('./providers/installed-version-evidence-service.cjs');
const { createUpdatePageVersionService } = require('./providers/update-page-version-service.cjs');
const { createIndependentUpdateAssessmentService } = require('./providers/independent-update-assessment-service.cjs');
const { createWidgetPackageService } = require('./widgets/widget-package-service.cjs');

// ---- Optional Discord Rich Presence (native IPC, no third-party deps) ----
// Talks to the local Discord client over a named pipe (Windows) or Unix
// socket (mac/Linux). Pure Node `net` module + Discord's documented binary
// frame format. Fails silently if Discord isn't running.
const net = require('net');

// Public NEO-LIB Discord Application ID. CI creates an ignored generated file
// before renderer provenance is calculated. The checked-in empty fallback keeps
// local/source builds safe and deterministic. Empty = RPC disabled silently.
let DISCORD_APP_ID = '';
try {
  // eslint-disable-next-line global-require
  DISCORD_APP_ID = require('./discord-config.generated').DISCORD_APP_ID || '';
} catch {
  try {
    // eslint-disable-next-line global-require
    DISCORD_APP_ID = require('./discord-config').DISCORD_APP_ID || '';
  } catch { DISCORD_APP_ID = ''; }
}
// Env var still wins (handy for `set NEOLIB_DISCORD_APP_ID=... && yarn dev`)
if (process.env.NEOLIB_DISCORD_APP_ID) DISCORD_APP_ID = process.env.NEOLIB_DISCORD_APP_ID;

const isDev = process.env.NODE_ENV === 'development';
let reportIpcFailure = () => {};
const { handle: registerIpc } = createIpcRegistry({ ipcMain, onFailure: failure => reportIpcFailure(failure) });
const remainingIpcServices = Object.create(null);

// Keep the running window, taskbar group, installed EXE, Start shortcut, and
// desktop shortcut under one stable Windows identity. This matches the
// electron-builder appId, so Windows does not fall back to a generic or stale
// pinned taskbar icon after an upgrade.
if (process.platform === 'win32') app.setAppUserModelId('com.neolib.app');

// ---------------- Local storage ---------------- //
// Paths and JSON persistence have one owner. Existing call sites retain their
// names so this extraction cannot change IPC or saved-data behaviour.
const appStorage = createAppStorage({ app, path, fs, fsp });
const {
  dataDir,
  coversDir,
  saveBackupsDir,
  managedToolsDir,
  diagnosticsDir,
  launchSafetyLogFile,
  ipcFailureLogFile,
  launchSafetyStateFile,
  ensureDirs,
  readJsonSync,
  writeJsonSync,
  appendTextSync,
} = appStorage;
const diagnostics = createDiagnosticRecorder({
  fs,
  path,
  directory: diagnosticsDir,
  appVersion: app.getVersion(),
  platform: process.platform,
  release: os.release(),
  arch: process.arch,
});
reportIpcFailure = createIpcFailureReporter({
  appendTextSync,
  logFile: ipcFailureLogFile,
  recordDiagnostic: (event, details) => diagnostics.record(event, details),
});
const documents = createDocumentStore({ storage: appStorage });
const systemHealth = createSystemHealthService({ os });
const playtimeHistory = createPlaytimeHistoryService({ documents });
const imageCache = createImageCacheService({ path, coversDir, download: httpDownload });
const widgetPackages = createWidgetPackageService({ fsp, path, widgetsDir: () => path.join(dataDir(), 'widgets') });
const appOs = createAppOsService({ app, shell, fsp, path, execPath: process.execPath, recordLaunchSafety });
const appLifecycle = createAppLifecycleService({
  buildTray,
  destroyTray,
  clearDiscordActivity,
  getDiscordSocket: () => discordSock,
  setDiscordSocket: value => { discordSock = value; },
  getDiscordReady: () => discordReady,
  setDiscordReady: value => { discordReady = value; },
  getDiscordAppId: () => DISCORD_APP_ID,
  quitApp: () => { isQuitting = true; app.quit(); },
});
const launchDoctor = createLaunchDoctorService({ fs, fsp, path, walkDir });

function safePathPart(value, fallback = 'game') {
  const clean = String(value || '').replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '');
  return clean.slice(0, 80) || fallback;
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function folderStats(root, limit = 25000) {
  let files = 0;
  let bytes = 0;
  let truncated = false;
  async function walk(current) {
    if (files >= limit) { truncated = true; return; }
    let entries = [];
    try { entries = await fsp.readdir(current, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (files >= limit) { truncated = true; return; }
      if (entry.isSymbolicLink()) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) {
        try { bytes += (await fsp.stat(full)).size; files += 1; } catch { /* file disappeared */ }
      }
    }
  }
  await walk(root);
  return { files, bytes, truncated };
}

async function isDirectoryEmpty(directory) {
  const entries = await fsp.readdir(directory);
  return entries.length === 0;
}

const saveService = createSaveService({
  fs, fsp, path, os, saveBackupsDir, safePathPart, isInside, folderStats,
  isDirectoryEmpty, defaultSteamPath,
});
const storageScanService = createStorageScanService({ fsp, path, isInside, folderStats });
const junkService = createJunkService({
  fsp, path, shell, tempDir: () => app.getPath('temp'), normalWinPath,
});

// ---------------- HTTP helpers ---------------- //
function httpGetJson(url, timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'GameLibrary/1.0' } }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => { req.destroy(new Error('timeout')); });
  });
}

function httpDownload(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, { headers: { 'User-Agent': 'GameLibrary/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlink(destPath, () => {});
          return resolve(httpDownload(res.headers.location, destPath));
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          return reject(new Error('HTTP ' + res.statusCode));
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(destPath)));
      })
      .on('error', (err) => {
        file.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
  });
}

// ---------------- Window ---------------- //
let mainWindow;
let tray = null;
let isQuitting = false;
// A build command or a second shortcut must never produce a second NEO-LIB
// main process. This keeps native launch safety authoritative system-wide.
const hasSingleInstanceLock = app.requestSingleInstanceLock();
const appStartedAt = Date.now();

// Read the persisted setting synchronously so the close handler knows the
// user's preference even before the renderer wires up.
function shouldMinimizeToTray() {
  const s = documents.loadSettingsSnapshot();
  return s && s.minimizeToTray === true;
}

// The installer icon is a build resource, but Electron's runtime tray needs
// its own packaged copy as well. Prefer the unpacked asset in installed builds
// (Windows Shell can read it directly), then fall back to the development path.
function runtimeIconPath() {
  const candidates = [
    ...(app.isPackaged ? [
      path.join(process.resourcesPath, 'app.asar.unpacked', 'build', 'icon.ico'),
      path.join(process.resourcesPath, 'app.asar.unpacked', 'build', 'icon.png'),
    ] : []),
    path.join(__dirname, '..', 'build', 'icon.ico'),
    path.join(__dirname, '..', 'build', 'icon.png'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || '';
}

// A status-area icon needs a simpler, transparent mark than the full launcher
// artwork. Keep it separate while applying the same packaged/unpacked lookup
// rules as the app/EXE icon.
function runtimeTrayIconPath() {
  const candidates = [
    ...(app.isPackaged ? [
      path.join(process.resourcesPath, 'app.asar.unpacked', 'build', 'tray-icon.png'),
    ] : []),
    path.join(__dirname, '..', 'build', 'tray-icon.png'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || runtimeIconPath();
}

function buildTray() {
  if (tray) return tray;
  try {
    const iconPath = runtimeTrayIconPath();
    const img = nativeImage.createFromPath(iconPath);
    // The dedicated transparent mark is intentionally bold enough for the
    // tiny Windows notification area while the full artwork stays on the EXE.
    const trayImg = img.isEmpty() ? nativeImage.createEmpty() : img.resize({ width: 20, height: 20, quality: 'best' });
    tray = new Tray(trayImg);
    tray.setToolTip('NEO-LIB');
    const menu = Menu.buildFromTemplate([
      {
        label: 'Show NEO-LIB',
        click: () => {
          if (!mainWindow) createWindow();
          else { mainWindow.show(); mainWindow.focus(); }
        },
      },
      { type: 'separator' },
      {
        label: 'Quit NEO-LIB',
        click: () => { isQuitting = true; app.quit(); },
      },
    ]);
    tray.setContextMenu(menu);
    tray.on('click', () => {
      if (!mainWindow) { createWindow(); return; }
      if (mainWindow.isVisible()) mainWindow.hide();
      else { mainWindow.show(); mainWindow.focus(); }
    });
  } catch { tray = null; }
  return tray;
}

function destroyTray() {
  if (tray) {
    try { tray.destroy(); } catch { /* ignore */ }
    tray = null;
  }
}

function createWindow() {
  const { screen } = require('electron');
  const primary = screen.getPrimaryDisplay().workAreaSize;
  // First launch uses a comfortably wide, almost full-height working view.
  // Later launches always prefer the user's own saved resize/move bounds.
  const defaultW = Math.max(960, Math.round(primary.width * 0.75));
  const defaultH = Math.max(600, Math.round(primary.height * 0.90));

  // Restore the last window bounds the user resized to (if saved). Validate
  // against current displays so a saved bound that's now off-screen (monitor
  // unplugged, resolution changed) falls back to the default.
  let bounds = { width: defaultW, height: defaultH, x: undefined, y: undefined, center: true };
  try {
    const s = documents.loadSettingsSnapshot();
    const saved = s && s.windowBounds;
    if (saved && typeof saved.width === 'number' && typeof saved.height === 'number') {
      // Constrain to primary display so the window can't open off-screen
      const w = Math.max(960, Math.min(saved.width, primary.width));
      const h = Math.max(600, Math.min(saved.height, primary.height));
      bounds = { width: w, height: h };
      if (typeof saved.x === 'number' && typeof saved.y === 'number'
          && saved.x >= 0 && saved.y >= 0
          && saved.x + 80 < primary.width && saved.y + 80 < primary.height) {
        bounds.x = saved.x;
        bounds.y = saved.y;
      } else {
        bounds.center = true;
      }
    }
  } catch { /* no saved bounds — use default */ }

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 960,
    minHeight: 600,
    center: bounds.center === true,
    frame: false,
    backgroundColor: '#0a0a0c',
    title: 'NEO-LIB',
    icon: runtimeIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // A renderer failure must leave privacy-safe evidence behind. The recorder
  // classifies the message but never stores its text, paths, URLs or app data.
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (Number(level) < 2) return;
    const source = path.basename(String(sourceId || '')).slice(0, 120);
    recordLaunchSafety('renderer-console', {
      level: Number(level),
      message: String(message || '').slice(0, 2000),
      line: Number(line) || 0,
      source,
    });
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    recordLaunchSafety('renderer-process-gone', {
      reason: String(details?.reason || 'unknown'),
      exitCode: Number(details?.exitCode) || 0,
    });
  });
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
    if (!isMainFrame) return;
    recordLaunchSafety('renderer-load-failed', {
      errorCode: Number(errorCode) || 0,
      error: String(errorDescription || '').slice(0, 500),
      target: path.basename(String(validatedUrl || '')).slice(0, 120),
    });
  });
  mainWindow.webContents.on('did-finish-load', () => {
    recordLaunchSafety('renderer-load-finished');
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch((error) => {
      recordLaunchSafety('renderer-load-rejected', { error: String(error?.message || error).slice(0, 1000) });
    });
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html')).catch((error) => {
      recordLaunchSafety('renderer-load-rejected', { error: String(error?.message || error).slice(0, 1000) });
    });
  }

  mainWindow.on('maximize', () => mainWindow.webContents.send('window:maximized', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window:maximized', false));
  // The renderer uses these actual native visibility transitions to enter its
  // no-background-work Rest Mode. This covers close-to-tray, the tray icon,
  // and Windows restore without treating a hidden window as a game launch.
  mainWindow.on('hide', () => mainWindow.webContents.send('window:visibility', { visible: false }));
  mainWindow.on('show', () => mainWindow.webContents.send('window:visibility', { visible: true }));

  // Persist window bounds (debounced) whenever the user resizes or moves the
  // window. Stored in settings.json alongside other prefs so they survive
  // installer upgrades.
  let saveBoundsTimer = null;
  const saveBounds = () => {
    if (saveBoundsTimer) clearTimeout(saveBoundsTimer);
    saveBoundsTimer = setTimeout(() => {
      try {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        if (mainWindow.isMaximized() || mainWindow.isMinimized()) return;
        const b = mainWindow.getBounds();
        documents.patchSettings({
          windowBounds: { width: b.width, height: b.height, x: b.x, y: b.y },
        }).catch(() => {});
      } catch { /* ignore disk errors */ }
    }, 400);
  };
  mainWindow.on('resize', saveBounds);
  mainWindow.on('move', saveBounds);

  // Close-to-tray — if the setting is on and the user isn't quitting via the
  // tray menu, hide the window instead of closing it.
  mainWindow.on('close', (e) => {
    if (isQuitting) return;
    if (!shouldMinimizeToTray()) return;
    e.preventDefault();
    mainWindow.hide();
    buildTray();
  });
}

app.on('before-quit', () => { isQuitting = true; });

app.whenReady().then(async () => {
  if (!hasSingleInstanceLock) {
    app.quit();
    return;
  }
  await ensureDirs();
  recordLaunchSafety('app-ready', { pid: process.pid, version: app.getVersion() });
  createWindow();
  // Pre-build the tray icon if the user opted in — they expect it to be
  // available immediately, not only after they close the window for the first time.
  if (shouldMinimizeToTray()) buildTray();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow();
      return;
    }
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
}

app.on('window-all-closed', () => {
  // If the user opted into tray mode, the window may have been hidden — don't
  // quit the process. Otherwise, behave normally (quit on non-macOS).
  if (shouldMinimizeToTray()) return;
  if (process.platform !== 'darwin') app.quit();
});

// Live tray and Discord preferences share one lifecycle boundary.
registerAppLifecycleIpc({ registerIpc, appLifecycle });
registerDiagnosticsIpc({ registerIpc, diagnostics, shell });

// ---------------- IPC: Window controls ---------------- //
registerWindowIpc({ registerIpc, getMainWindow: () => mainWindow });

// ---------------- IPC: Library / Settings ---------------- //
registerPersistenceIpc({ registerIpc, documents });

// ---------------- IPC: Dialog ---------------- //
registerDialogIpc({ registerIpc, dialog, getMainWindow: () => mainWindow });

// Resolve Windows shortcuts used by drag/drop imports.
registerShellIpc({ registerIpc, shell });

// ---------------- IPC: Exe icon extraction ---------------- //
registerExeIpc({ registerIpc, app });

// ---------------- IPC: Launch game ---------------- //
// Final safety boundary for every executable launch request. The renderer also
// prevents duplicate clicks, but a renderer regression must never be able to
// start a whole library. URI-only system tools are intentionally exempt.
function recordLaunchSafety(event, details = {}) {
  diagnostics.record(event, details);
}

function readSharedLaunchSafety() {
  return readJsonSync(launchSafetyStateFile(), {}) || {};
}

function writeSharedLaunchSafety(value) {
  try { writeJsonSync(launchSafetyStateFile(), value); } catch { /* best effort */ }
}

const gameLaunchService = createGameLaunchService({
  shell, spawn, path, crypto, appStartedAt, recordSafety: recordLaunchSafety,
  readSharedSafety: readSharedLaunchSafety, writeSharedSafety: writeSharedLaunchSafety,
  setDiscordActivity, clearDiscordActivity,
  sendExited(payload) {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('game:exited', payload);
  },
});
remainingIpcServices["game:armLaunch"] = event => gameLaunchService.arm(event);
remainingIpcServices["game:launch"] = (event, payload) => gameLaunchService.launch(event, payload);

// ---------------- Discord Rich Presence (native IPC) ---------------- //
// Protocol reference: https://discord.com/developers/docs/topics/rpc
//   Each frame = 4-byte LE opcode + 4-byte LE payload length + JSON payload
//   Opcodes used here: 0 = HANDSHAKE, 1 = FRAME (set activity), 2 = CLOSE
let discordSock = null;
let discordReady = false;
let discordConnecting = false;
let discordNonce = 0;

function discordPipePath(i) {
  if (process.platform === 'win32') return `\\\\.\\pipe\\discord-ipc-${i}`;
  const tmp = process.env.XDG_RUNTIME_DIR
    || process.env.TMPDIR
    || process.env.TMP
    || process.env.TEMP
    || '/tmp';
  return `${tmp}/discord-ipc-${i}`;
}

function discordFrame(op, payload) {
  const json = Buffer.from(JSON.stringify(payload));
  const header = Buffer.alloc(8);
  header.writeInt32LE(op, 0);
  header.writeInt32LE(json.length, 4);
  return Buffer.concat([header, json]);
}

function connectDiscord() {
  if (!DISCORD_APP_ID) return Promise.resolve(false);
  if (discordSock && discordReady) return Promise.resolve(true);
  if (discordConnecting) return Promise.resolve(false);
  discordConnecting = true;

  return new Promise((resolve) => {
    const tryPipe = (i) => {
      if (i > 9) { discordConnecting = false; resolve(false); return; }
      const sock = net.createConnection({ path: discordPipePath(i) });
      let resolved = false;
      const giveUp = () => {
        if (resolved) return;
        resolved = true;
        try { sock.destroy(); } catch { /* ignore */ }
        tryPipe(i + 1);
      };
      sock.once('error', giveUp);
      sock.once('connect', () => {
        sock.write(discordFrame(0, { v: 1, client_id: DISCORD_APP_ID }));
      });
      sock.on('data', () => {
        if (resolved) return;
        resolved = true;
        discordSock = sock;
        discordReady = true;
        discordConnecting = false;
        sock.on('error', () => { discordReady = false; discordSock = null; });
        sock.on('close', () => { discordReady = false; discordSock = null; });
        resolve(true);
      });
      // Timeout protection in case Discord stalls
      setTimeout(giveUp, 1500);
    };
    tryPipe(0);
  });
}

async function setDiscordActivity({ name, startedAt }) {
  if (!DISCORD_APP_ID) return;
  if (!isDiscordRpcEnabled()) return;
  if (!discordReady) await connectDiscord();
  if (!discordReady || !discordSock) return;
  try {
    discordNonce += 1;
    discordSock.write(discordFrame(1, {
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity: {
          details: (name || 'Playing a game').slice(0, 128),
          state: 'via NEO-LIB',
          timestamps: { start: Math.floor((startedAt || Date.now()) / 1000) },
          assets: {
            large_image: 'neolib_logo',
            large_text: 'NEO-LIB · portable game library',
          },
          instance: false,
        },
      },
      nonce: String(discordNonce),
    }));
  } catch { /* ignore */ }
}

function clearDiscordActivity() {
  if (!discordReady || !discordSock) return;
  try {
    discordNonce += 1;
    discordSock.write(discordFrame(1, {
      cmd: 'SET_ACTIVITY',
      args: { pid: process.pid, activity: null },
      nonce: String(discordNonce),
    }));
  } catch { /* ignore */ }
}

function isDiscordRpcEnabled() {
  const s = documents.loadSettingsSnapshot();
  return s ? s.discordRpcEnabled !== false : true;
}

// ---------------- IPC: Drive scanner ---------------- //
const NOISE_KEYWORDS = [
  'unins', 'crashpad', 'crashhandler', 'crashreport', 'redist', 'vcredist',
  'directx', 'dxsetup', 'dxwebsetup', 'install', 'setup', 'updater',
  'patch', 'launcher_install', 'uninstall', 'support', 'easyanticheat',
  'eac_', 'battleye', 'be_service', 'nvidia', 'amd_', 'physx',
  'dotnetfx', 'helper', 'assistant', 'converter', 'convertassistant',
  'importer', 'editor', 'benchmark', 'diagnostic', 'webview2', 'crash',
  'reporter',
];

function isLikelyGameExe(filename) {
  const low = filename.toLowerCase();
  if (NOISE_KEYWORDS.some((k) => low.includes(k))) return false;
  if (low.endsWith('.exe') === false) return false;
  return true;
}

async function walkDir(dir, depth, maxDepth, accum, maxFiles, excludes = []) {
  if (depth > maxDepth || accum.length >= maxFiles) return;
  // Check excludes: if any exclude fragment appears in the current path, skip
  if (excludes.length > 0) {
    const lower = dir.toLowerCase();
    if (excludes.some((ex) => ex && lower.includes(ex.toLowerCase()))) return;
  }
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (accum.length >= maxFiles) return;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const skip = ['$recycle.bin', 'system volume information', 'windows', 'program files (x86)\\windows defender'];
      if (skip.includes(entry.name.toLowerCase())) continue;
      await walkDir(full, depth + 1, maxDepth, accum, maxFiles, excludes);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.exe')) {
      if (isLikelyGameExe(entry.name)) {
        accum.push(full);
      }
    }
  }
}

remainingIpcServices["scan:directory"] = async (_e, root, excludes = [], options = {}) => {
  if (!root) return [];
  const found = [];
  // Fast (default): 5 levels deep, up to 1500 files. Deep: 10 levels, up to 5000.
  const deep = options && options.deep === true;
  const maxDepth = deep ? 10 : 5;
  const maxFiles = deep ? 5000 : 1500;
  await walkDir(root, 0, maxDepth, found, maxFiles, excludes);

  // Group exes by their top-level folder under root and pick the most likely candidate.
  const grouped = new Map();
  for (const exe of found) {
    const rel = path.relative(root, exe);
    const parts = rel.split(path.sep);
    const groupKey = parts.length > 1 ? path.join(root, parts[0]) : path.dirname(exe);
    if (!grouped.has(groupKey)) grouped.set(groupKey, []);
    grouped.get(groupKey).push(exe);
  }

  const candidates = [];
  for (const [folder, exes] of grouped.entries()) {
    // Prefer the exe whose name most closely matches the folder name
    const folderName = path.basename(folder).toLowerCase();
    exes.sort((a, b) => {
      const an = path.basename(a, '.exe').toLowerCase();
      const bn = path.basename(b, '.exe').toLowerCase();
      const score = (n) =>
        (n === folderName ? 3 : 0) +
        (folderName.includes(n) ? 2 : 0) +
        (n.includes(folderName) ? 1 : 0) -
        (n.includes('launcher') ? 1 : 0);
      return score(bn) - score(an);
    });
    candidates.push({
      folder,
      folderName: path.basename(folder),
      exe: exes[0],
      alternativeExes: exes.slice(1, 6),
    });
  }
  // Limit
  return candidates.slice(0, 80);
};

// ---------------- IPC: Steam Store search & details ---------------- //
function cleanSearchTerm(name) {
  return name
    .replace(/[_\-]+/g, ' ')
    // Only strip version-number patterns (e.g. v1.2.3) — NOT 4-digit numbers, which are often titles (Anno 1800, Civ VI, etc.)
    .replace(/\b(v?\d+\.\d+(\.\d+)+)\b/g, ' ')
    .replace(/\b(setup|installer|launcher|client|win64|win32|x64|x86|repack|crackfix|crack)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Lightweight fuzzy score between two strings (0-1, higher = better).
function fuzzyScore(a, b) {
  if (!a || !b) return 0;
  const A = a.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim();
  const B = b.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim();
  if (A === B) return 1.0;
  if (B.startsWith(A) || A.startsWith(B)) return 0.92;
  if (B.includes(A) || A.includes(B)) return 0.82;
  // token overlap (Jaccard)
  const ta = new Set(A.split(/\s+/).filter(Boolean));
  const tb = new Set(B.split(/\s+/).filter(Boolean));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const uni = ta.size + tb.size - inter;
  if (uni === 0) return 0;
  return inter / uni;
}

// Automatic metadata must be conservative. A low-confidence cross-store hit
// is worse than no hit: it prevents the next sources from trying and can turn
// a Battle.net title into an unrelated Steam game. The picker can still show
// broad candidates for a person to choose from; this guard is only for the
// unattended import/refresh path.
function pickConfidentMatch(query, results, nameKey = 'name', minimumScore = 0.68) {
  if (!results || results.length === 0) return null;
  const scored = results.map((r) => ({ r, s: fuzzyScore(query, r[nameKey] || '') }));
  scored.sort((a, b) => b.s - a.s);
  return scored[0]?.s >= minimumScore ? scored[0].r : null;
}

// ---------------- Generic HTML helpers ---------------- //
function httpGetText(url, timeoutMs = 15_000, redirects = 0) {
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(url); } catch { reject(new Error('Invalid URL.')); return; }
    const transport = parsed.protocol === 'http:' ? http : https;
    const request = transport
      .get(
        parsed,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            if (redirects >= 5) return reject(new Error('Too many redirects.'));
            return resolve(httpGetText(new URL(res.headers.location, parsed).toString(), timeoutMs, redirects + 1));
          }
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            body += chunk;
            if (body.length > 5_000_000) request.destroy(new Error('Response is too large.'));
          });
          res.on('end', () => resolve(body));
        }
      )
      .on('error', reject);
    request.setTimeout(timeoutMs, () => request.destroy(new Error('Request timed out.')));
  });
}

function httpPostJson(url, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...extraHeaders,
        },
      },
      (res) => {
        let out = '';
        res.on('data', (c) => (out += c));
        res.on('end', () => {
          try { resolve(JSON.parse(out)); } catch (e) { reject(e); }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const storeProviders = createStoreProviderService({ httpGetJson, cleanSearchTerm, stripHtml, steamGenreEvidence });
const publicWebProvider = createPublicWebProviderService({ httpGetText, cleanSearchTerm, cleanTitle, publicSearchUrl });
const specialistMetadataProviders = createSpecialistMetadataProviderService({ httpGetText, httpPostJson, cleanTitle });
const newsNormalization = createNewsNormalizationService({ now: Date.now });
const metadataCandidates = createMetadataCandidateService({
  cleanSearchTerm,
  listSources: {
    steam: term => listSteamCandidates(term),
    gog: term => listGogCandidates(term),
    itch: term => listItchCandidates(term),
    dlsite: term => listDlsiteCandidates(term),
    vndb: term => listVndbCandidates(term),
    ryuugames: term => listRyuuCandidates(term),
    f95zone: term => listF95Candidates(term),
    google: term => listGoogleCandidates(term),
    ai: (term, context) => listAiCandidates(term, context.geminiKey, context.aiModel),
  },
  expandSources: {
    steam: candidate => expandSteam(candidate),
    gog: candidate => expandGog(candidate),
    itch: candidate => expandItch(candidate),
    dlsite: candidate => dlsiteLookup(candidate.id),
    vndb: candidate => expandVndb(candidate),
    ryuugames: candidate => expandRyuu(candidate),
    f95zone: candidate => expandF95(candidate),
    google: candidate => expandGoogle(candidate),
    ai: candidate => candidate.raw,
  },
});
remainingIpcServices["steam:search"] = (_event, query) => storeProviders.searchSteam(query);
remainingIpcServices["steam:details"] = (_event, appid) => storeProviders.getSteamDetails(appid);

// ---------------- IPC: cache image locally ---------------- //
registerImageIpc({ registerIpc, imageCache });

registerAppOsIpc({ registerIpc, appOs });

// ---------------- GPU setup + managed hardware utilities ---------------- //
// First-run detection is read-only: Windows reports adapter names and drivers
// through Win32_VideoController. We add only a normal local shortcut; no
// graphics driver, control-panel, or registry setting is changed.
function firstExistingPath(paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate)) || '';
}

function gpuVendor(name = '') {
  const text = String(name).toLowerCase();
  if (/nvidia|geforce|quadro|rtx|gtx/.test(text)) return 'nvidia';
  if (/amd|radeon|firepro/.test(text)) return 'amd';
  if (/intel|arc|iris/.test(text)) return 'intel';
  return 'generic';
}

function gpuControlCenterFor(vendor) {
  const programs = process.env.ProgramFiles || 'C:\\Program Files';
  const programsX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const known = {
    nvidia: {
      label: 'NVIDIA Control Centre',
      paths: [
        path.join(programs, 'NVIDIA Corporation', 'Control Panel Client', 'nvcplui.exe'),
        path.join(programs, 'NVIDIA Corporation', 'NVIDIA App', 'NVIDIA App.exe'),
        path.join(programsX86, 'NVIDIA Corporation', 'Control Panel Client', 'nvcplui.exe'),
      ],
    },
    amd: {
      label: 'AMD Software: Adrenalin Edition',
      paths: [
        path.join(programs, 'AMD', 'CNext', 'CNext', 'RadeonSoftware.exe'),
        path.join(programs, 'AMD', 'CNext', 'CNext', 'AMDSoftware.exe'),
      ],
    },
    intel: {
      label: 'Intel Graphics Control Centre',
      paths: [
        path.join(programs, 'Intel', 'Intel Arc Control', 'ArcControl.exe'),
        path.join(programs, 'Intel', 'Intel Graphics Software', 'IntelGraphicsSoftware.exe'),
      ],
    },
  };
  const entry = known[vendor] || { label: 'Windows Graphics Settings', paths: [] };
  const exePath = firstExistingPath(entry.paths);
  return {
    name: exePath ? entry.label : 'Windows Graphics Settings',
    exePath,
    target: exePath || 'ms-settings:display-advancedgraphics',
    source: exePath ? 'vendor-control-centre' : 'windows-fallback',
  };
}

// NVIDIA Control Panel is commonly installed as a Microsoft Store app rather
// than an .exe in Program Files.  Ask Windows for its real Start-menu app ID
// instead of treating a missing legacy nvcplui.exe as proof that NVIDIA tools
// are unavailable.  This is still only discovery: launching the resulting
// shell shortcut is exactly the same as selecting it from Start.
async function windowsStartAppMatching(pattern) {
  const script = String.raw`
    Get-StartApps | Where-Object { $_.Name -match '${String(pattern).replace(/'/g, "''")}' -or $_.AppID -match '${String(pattern).replace(/'/g, "''")}' } |
      Select-Object -First 1 Name,AppID | ConvertTo-Json -Compress
  `;
  const result = await runPowerShellJson(script, 8_000);
  if (!result?.AppID) return null;
  return { name: String(result.Name || ''), appId: String(result.AppID) };
}

const MANAGED_TOOL_PATHS = {
  gpuz: () => [
    path.join(managedToolsDir(), 'GPU-Z', 'GPU-Z.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'GPU-Z', 'GPU-Z.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'TechPowerUp', 'GPU-Z', 'GPU-Z.exe'),
  ],
  cpuz: () => [
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'CPUID', 'CPU-Z', 'cpuz_x64.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'CPUID', 'CPU-Z', 'cpuz.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'CPUID', 'CPU-Z', 'cpuz.exe'),
  ],
};

function installedManagedToolPath(toolId) {
  return firstExistingPath(MANAGED_TOOL_PATHS[toolId]?.() || []);
}

remainingIpcServices["tools:detectGpuSetup"] = async () => {
  const script = String.raw`
    Get-CimInstance Win32_VideoController | Select-Object Name,VideoProcessor,DriverVersion,PNPDeviceID,AdapterRAM | ConvertTo-Json -Depth 3 -Compress
  `;
  const raw = await runPowerShellJson(script, 12_000);
  const adapters = (Array.isArray(raw) ? raw : raw ? [raw] : []).map((adapter) => ({
    name: String(adapter.Name || adapter.VideoProcessor || 'Unknown GPU'),
    videoProcessor: String(adapter.VideoProcessor || ''),
    driverVersion: String(adapter.DriverVersion || ''),
    pnpDeviceId: String(adapter.PNPDeviceID || ''),
    memoryBytes: Number(adapter.AdapterRAM || 0),
  }));
  const preferred = adapters.find((adapter) => gpuVendor(adapter.name) !== 'generic') || adapters[0] || { name: 'Unknown GPU' };
  const vendor = gpuVendor(`${preferred.name} ${preferred.videoProcessor}`);
  let controlCenter = gpuControlCenterFor(vendor);
  if (vendor === 'nvidia' && controlCenter.source === 'windows-fallback') {
    const storeControl = await windowsStartAppMatching('NVIDIA.*(?:Control Panel|App)|NVIDIACorp');
    if (storeControl) {
      controlCenter = {
        name: /control panel/i.test(storeControl.name) ? 'NVIDIA Control Panel' : (storeControl.name || 'NVIDIA App'),
        exePath: '',
        target: `shell:AppsFolder\\${storeControl.appId}`,
        source: 'vendor-store-control-centre',
      };
    }
  }
  return {
    ok: true,
    adapters,
    primary: { ...preferred, vendor },
    controlCenter,
    utilities: {
      gpuz: { exePath: installedManagedToolPath('gpuz') },
      cpuz: { exePath: installedManagedToolPath('cpuz') },
    },
  };
};

remainingIpcServices["tools:verifyManagedTool"] = async (_event, { toolId, exePath } = {}) => {
  if (!['gpuz', 'cpuz'].includes(toolId) || !exePath || !path.isAbsolute(exePath) || !fs.existsSync(exePath)) return { ok: false, error: 'Choose an existing executable file.' };
  const base = path.basename(exePath).toLowerCase();
  const expected = toolId === 'gpuz' ? /gpu[_-]?z.*\.exe$/ : /cpu[_-]?z.*\.exe$/;
  if (!expected.test(base)) return { ok: false, error: `That does not look like the ${toolId === 'gpuz' ? 'GPU-Z' : 'CPU-Z'} executable.` };
  return { ok: true, exePath };
};

function officialDownloadHost(url, allowedHosts) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && allowedHosts.includes(parsed.hostname.toLowerCase()) ? parsed.toString() : '';
  } catch { return ''; }
}

async function resolveManagedToolDownload(toolId) {
  if (toolId === 'gpuz') {
    const page = await httpGetText('https://www.techpowerup.com/download/techpowerup-gpu-z/', 15_000);
    const urls = [...page.matchAll(/(?:href|data-download-url)=["']([^"']+\.exe(?:\?[^"']*)?)["']/gi)].map((match) => new URL(match[1], 'https://www.techpowerup.com/').toString());
    const url = urls.map((value) => officialDownloadHost(value, ['www.techpowerup.com', 'download.techpowerup.com', 'techpowerup.com'])).find(Boolean);
    if (!url) throw new Error('TechPowerUp did not expose a verified GPU-Z executable link right now.');
    return { url, fileName: 'GPU-Z.exe', portable: true, officialPage: 'https://www.techpowerup.com/download/techpowerup-gpu-z/' };
  }
  if (toolId === 'cpuz') {
    const page = await httpGetText('https://www.cpuid.com/softwares/cpu-z.html', 15_000);
    const urls = [...page.matchAll(/(?:href|data-[\w-]+)=["']([^"']*cpu-z[\w._-]*-en\.exe(?:\?[^"']*)?)["']/gi)].map((match) => new URL(match[1], 'https://www.cpuid.com/').toString());
    const url = urls.map((value) => officialDownloadHost(value, ['www.cpuid.com', 'cpuid.com', 'download.cpuid.com'])).find(Boolean);
    if (!url) throw new Error('CPUID did not expose a verified CPU-Z installer link right now.');
    return { url, fileName: 'CPU-Z-setup.exe', portable: false, officialPage: 'https://www.cpuid.com/softwares/cpu-z.html' };
  }
  throw new Error('Unsupported managed tool.');
}

async function validExecutable(filePath) {
  try {
    const handle = await fsp.open(filePath, 'r');
    const buffer = Buffer.alloc(2);
    await handle.read(buffer, 0, 2, 0);
    await handle.close();
    return buffer.toString('ascii') === 'MZ';
  } catch { return false; }
}

remainingIpcServices["tools:installManagedTool"] = async (_event, toolId) => {
  if (!['gpuz', 'cpuz'].includes(toolId)) return { ok: false, error: 'Unsupported managed tool.' };
  try {
    const download = await resolveManagedToolDownload(toolId);
    const targetDir = path.join(managedToolsDir(), toolId === 'gpuz' ? 'GPU-Z' : 'CPU-Z');
    await fsp.mkdir(targetDir, { recursive: true });
    const target = path.join(targetDir, download.fileName);
    await httpDownload(download.url, target);
    if (!(await validExecutable(target))) { await fsp.unlink(target).catch(() => {}); throw new Error('The official download was not a valid Windows executable.'); }
    if (download.portable) {
      return { ok: true, exePath: target, installed: true, mode: 'portable', officialPage: download.officialPage };
    }
    // CPU-Z is distributed as an installer. Do not pass silent flags or elevate
    // it: the user sees CPUID's own installer and controls every installer step.
    const installerResult = await new Promise((resolve) => {
      const child = spawn(target, [], { detached: false, stdio: 'ignore', windowsHide: false });
      child.on('error', (error) => resolve({ ok: false, error: error?.message || 'Could not open the official installer.' }));
      child.on('close', () => resolve({ ok: true }));
    });
    if (!installerResult.ok) return installerResult;
    const exePath = installedManagedToolPath('cpuz');
    return exePath
      ? { ok: true, exePath, installed: true, mode: 'installer', officialPage: download.officialPage }
      : { ok: true, exePath: '', installed: false, mode: 'installer-finished', officialPage: download.officialPage, error: 'The installer closed, but CPU-Z was not found in its usual location. Use Locate to select it.' };
  } catch (error) {
    return { ok: false, error: error?.message || 'Official tool download failed.' };
  }
};

// ---------------- Steam library detection ---------------- //
function readSteamLibraryFolders(steamPath) {
  // Parses libraryfolders.vdf (very simple key/value parser, good enough).
  const file = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
  try {
    const text = fs.readFileSync(file, 'utf8');
    const paths = new Set([steamPath]);
    const re = /"path"\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(text))) paths.add(m[1].replace(/\\\\/g, '\\'));
    return [...paths];
  } catch {
    return [steamPath];
  }
}

function parseAcfManifest(text) {
  const get = (k) => {
    const m = text.match(new RegExp(`"${k}"\\s*"([^"]+)"`));
    return m ? m[1] : '';
  };
  return {
    appid: get('appid'),
    name: get('name'),
    installdir: get('installdir'),
    buildid: get('buildid'),
    lastUpdated: get('LastUpdated'),
    sizeOnDisk: get('SizeOnDisk'),
    stateFlags: get('StateFlags'),
    bytesToDownload: get('BytesToDownload'),
    bytesDownloaded: get('BytesDownloaded'),
    updateResult: get('UpdateResult'),
  };
}

function defaultSteamPath() {
  const candidates = [
    'C:\\Program Files (x86)\\Steam',
    'C:\\Program Files\\Steam',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Steam') : null,
  ].filter(Boolean);
  for (const c of candidates) {
    try { if (fs.existsSync(path.join(c, 'steam.exe'))) return c; } catch {}
  }
  return null;
}

// Keep the existing renderer/preload contract; scanner implementation is isolated.
Object.assign(remainingIpcServices, createLauncherScanners({
  fs, path, spawn, process, isLikelyGameExe,
  defaultSteamPath, readSteamLibraryFolders, parseAcfManifest, battleNetProductFor,
}));

// External-game Rest Mode monitor. It deliberately matches only executable
// paths already stored in the user's library. It never probes game memory,
// injects code, hooks graphics, or assumes that an idle launcher means a game
// is running. Windows exposes these paths through the ordinary process list.
function normalWinPath(value) { return String(value || '').replace(/^"|"$/g, '').replace(/\//g, '\\').toLowerCase(); }
const externalGameWatch = createExternalGameWatchService({
  execFile, path, normalWinPath, isLikelyGameExe,
  getRunningGameKeys: () => gameLaunchService.runningKeys(),
  sendExternalState(payload) {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('game:externalState', payload);
  },
});
remainingIpcServices["game:watchExternal"] = async (_e, { games = [] } = {}) => {
  return externalGameWatch.watch({ games });
};
remainingIpcServices["game:scanExternalNow"] = async () => {
  // Player-requested scan used from a high-usage warning. It remains the same
  // path-only local check as the passive watcher—no launcher account, game
  // memory, overlay, injection, or network access is involved.
  return externalGameWatch.scanNow();
};


// ---------------- Save folders and local backups ---------------- //
// Backups are deliberately kept under NEO-LIB's own app-data directory. The
// restore path never overwrites live files: it can only restore into an empty
// directory or make a separate "NEOLIB Restored" folder for manual review.
remainingIpcServices["saves:inspect"] = async (_e, savePath) => {
  return saveService.inspect(savePath);
};

remainingIpcServices["saves:listBackups"] = async (_e, gameId) => {
  return saveService.listBackups(gameId);
};

remainingIpcServices["saves:createBackup"] = async (_e, { gameId, gameName, savePath } = {}) => {
  return saveService.createBackup({ gameId, gameName, savePath });
};

remainingIpcServices["saves:restore"] = async (_e, { backupPath, savePath, mode = 'empty' } = {}) => {
  return saveService.restore({ backupPath, savePath, mode });
};

// A lightweight, automatic first pass for ordinary Windows save locations.
// It only checks a small set of known folders and existing matching children;
// it never crawls a drive, reads save content, or changes the chosen folder.
remainingIpcServices["saves:detectCommon"] = async (_e, { gameName, exePath, appid } = {}) => {
  return saveService.detectCommon({ gameName, exePath, appid });
};

remainingIpcServices["saves:findCandidates"] = async (_e, { root, gameName } = {}) => {
  return saveService.findCandidates({ root, gameName });
};

// User-triggered only: measuring whole game folders can be expensive on large
// libraries, so Home never scans disks silently. "Mod content" is an estimate
// of folders conventionally named mods/mod/workshop inside the game directory.
remainingIpcServices["storage:scanGames"] = async (_e, { games = [], force = false } = {}) => {
  return storageScanService.scanGames({ games, force });
};

// Launch Doctor is diagnostic only. It checks the configured target and finds
// plausible sibling executables; it never executes, deletes, or changes files.
registerDoctorIpc({ registerIpc, launchDoctor });

// Lightweight, local-only system readiness snapshot used by the Library footer.
registerSystemIpc({ registerIpc, systemHealth });

// ---------------- Optimize Center ---------------- //
// These tools are deliberately on-demand. Performance uses the same aggregate
// Node OS counters as the footer and delegates per-process inspection to Task
// Manager. Cleanup only returns exact file candidates from bounded roots and
// moves confirmed files to the Recycle Bin; it never recursively deletes a directory.

function runPowerShellJson(script, timeout = 20_000) {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') return resolve(null);
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], {
      windowsHide: true, timeout, maxBuffer: 12 * 1024 * 1024,
    }, (error, stdout) => {
      if (error || !stdout?.trim()) return resolve(null);
      try { resolve(JSON.parse(stdout)); } catch { resolve(null); }
    });
  });
}

const optimizeProcessService = createOptimizeProcessService({
  readSystemHealth: () => systemHealth.read(),
  os,
  taskManagerPath: path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'Taskmgr.exe'),
});
remainingIpcServices["optimize:inspectGaming"] = async () => {
  return optimizeProcessService.inspectGaming();
};

remainingIpcServices["optimize:closeProcess"] = async (_event, { pid, name } = {}) => {
  return optimizeProcessService.closeProcess({ pid, name });
};

remainingIpcServices["optimize:scanJunk"] = async (_event, { games = [] } = {}) => {
  return junkService.scan({ games });
};

remainingIpcServices["optimize:trashJunk"] = async (_event, { tokens = [] } = {}) => {
  return junkService.trash({ tokens });
};

// ---------------- GOG search & details ---------------- //
remainingIpcServices["gog:search"] = async (_e, query) => {
  return storeProviders.searchGog(query);
};

// ---------------- Web fallback (DuckDuckGo + Google) ---------------- //
// A small generic search primitive. Game metadata deliberately supplies its
// own game-specific query below; Tools uses this unchanged so GPU-Z, OBS,
// Windows utilities, editors and other software never get game-store results.
const ddgSearchRaw = term => publicWebProvider.searchDuckDuckGo(term);
const googleScrapeRaw = term => publicWebProvider.searchGoogle(term);

/**
 * itch.io scrape — public search results page.
 * itch.io powers a huge chunk of indie / py / RPG-Maker / experimental games
 * that never make it to Steam or GOG. We scrape the .game_cell anchors which
 * carry the cover thumb, title, and creator inline.
 */
async function itchSearch(term) {
  return specialistMetadataProviders.itchSearch(term);
}

/**
 * DLsite / Japanese indie — match RJ##### / VJ##### / RE##### codes.
 * Many Japanese RPG-Maker / Renpy games ship with their DLsite code in the
 * folder name (e.g. "Lust Room RJ01450973"). We extract the code and look
 * up the canonical product page directly. This is the single highest-hit
 * source for east-asian indie titles.
 */
function extractDLsiteCode(term) {
  return specialistMetadataProviders.extractDLsiteCode(term);
}
async function dlsiteLookup(code) {
  return specialistMetadataProviders.dlsiteLookup(code);
}

/**
 * VNDB — visual novel DB (the authoritative source for VN metadata).
 * Public Kana API: https://api.vndb.org/kana
 * No key required for basic queries.
 */
async function vndbLookup(term) {
  return specialistMetadataProviders.vndbLookup(term);
}

/**
 * Ryuugames — popular adult-VN repackager. Many indie titles only have
 * findable cover/description here when DLsite is JP-locked or itch lacks them.
 */
async function ryuugamesSearch(term) {
  return specialistMetadataProviders.ryuugamesSearch(term);
}

/**
 * Fetch a single itch.io game page and pull out cover, description, creator.
 */
async function itchDetails(pageUrl) {
  return specialistMetadataProviders.itchDetails(pageUrl);
}

remainingIpcServices["web:search"] = async (_e, query) => {
  return publicWebProvider.searchWeb(query);
};

function cleanTitle(t) {
  return (t || '')
    .replace(/\s*[-–|]\s*(Wikipedia|IGN|Steam|GOG\.com|GOG|Epic Games|Metacritic|Official\b.*|.+ - YouTube).*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanPublicGameTitle(title, url = '') {
  const cleaned = cleanTitle(title);
  return /\.itch\.io(?:\/|$)/i.test(String(url || '')) ? cleaned.replace(/\s+by\s+.+$/i, '').trim() : cleaned;
}

// ---------------- Tool / software metadata ---------------- //
// Tools have a different identity problem from games. Their best source is
// normally the selected Windows executable, then its vendor—not a game store.
// This resolver is always player-triggered (add or re-fetch), reads only the
// chosen file and ordinary uninstall metadata, and makes at most one public
// software search plus one public-page artwork request.
const SOFTWARE_KNOWLEDGE = [
  { match: /(?:gpu[-_ ]?z|techpowerup)/i, name: 'GPU-Z', publisher: 'TechPowerUp', category: 'Hardware monitor', website: 'https://www.techpowerup.com/gpuz/', description: 'A lightweight graphics-card utility with live GPU, sensor, driver, and PCIe details.' },
  { match: /(?:cpu[-_ ]?z|cpuid)/i, name: 'CPU-Z', publisher: 'CPUID', category: 'Hardware monitor', website: 'https://www.cpuid.com/softwares/cpu-z.html', description: 'A system-information utility for processor, mainboard, memory, and live clock details.' },
  { match: /(?:obs(?:64)?|obs studio)/i, name: 'OBS Studio', publisher: 'OBS Project', category: 'Capture & streaming', website: 'https://obsproject.com/', description: 'Free and open-source software for video recording and live streaming.' },
  { match: /(?:msiafterburner|afterburner)/i, name: 'MSI Afterburner', publisher: 'MSI', category: 'Hardware tuning', website: 'https://www.msi.com/Landing/afterburner/graphics-cards', description: 'A graphics-card monitoring and tuning utility with an on-screen display.' },
  { match: /(?:hwinfo)/i, name: 'HWiNFO', publisher: 'HWiNFO', category: 'Hardware monitor', website: 'https://www.hwinfo.com/', description: 'Detailed hardware analysis, monitoring, and reporting for Windows PCs.' },
  { match: /(?:rtss|rivatuner)/i, name: 'RivaTuner Statistics Server', publisher: 'Guru3D', category: 'Overlay & monitoring', website: 'https://www.guru3d.com/download/rtss-rivatuner-statistics-server-download/', description: 'A frame-rate limiter and on-screen display companion for compatible monitoring tools.' },
  { match: /(?:nvcplui|nvidia.*control)/i, name: 'NVIDIA Control Panel', publisher: 'NVIDIA', category: 'Graphics settings', website: 'https://www.nvidia.com/', description: 'NVIDIA’s local graphics-driver settings and display configuration utility.' },
  { match: /(?:amd.*software|radeonsoftware|radeonsettings)/i, name: 'AMD Software: Adrenalin Edition', publisher: 'AMD', category: 'Graphics settings', website: 'https://www.amd.com/en/products/software/adrenalin.html', description: 'AMD’s graphics-driver, display, game, and performance settings software.' },
  { match: /(?:discord)/i, name: 'Discord', publisher: 'Discord Inc.', category: 'Communication', website: 'https://discord.com/', description: 'Voice, text, and community communication software for games and groups.' },
  { match: /(?:steam)/i, name: 'Steam', publisher: 'Valve', category: 'Game launcher', website: 'https://store.steampowered.com/about/', description: 'Valve’s PC game launcher, store, and community client.' },
];

function cleanSoftwareTerm(value) {
  return String(value || '')
    .replace(/\.(?:exe|lnk|bat|cmd)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(?:x64|x86|win64|win32|portable|setup|installer|launcher|client|app|release|beta|final)\b/gi, ' ')
    .replace(/\bv?\d+(?:\.\d+){1,4}\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function knownSoftware(term) {
  const haystack = String(term || '');
  return SOFTWARE_KNOWLEDGE.find((entry) => entry.match.test(haystack)) || null;
}

function readWindowsToolFileInfo(exePath) {
  if (process.platform !== 'win32' || !exePath || !path.isAbsolute(exePath)) return Promise.resolve({});
  // The selected path is process-only data, never PowerShell command text.
  const script = [
    "$target=[Environment]::GetEnvironmentVariable('NEOLIB_TOOL_TARGET','Process')",
    'if([string]::IsNullOrWhiteSpace($target)){exit 2}',
    '$v=(Get-Item -LiteralPath $target -ErrorAction Stop).VersionInfo',
    "[pscustomobject]@{ProductName=$v.ProductName;FileDescription=$v.FileDescription;CompanyName=$v.CompanyName;ProductVersion=$v.ProductVersion;FileVersion=$v.FileVersion}|ConvertTo-Json -Compress",
  ].join(';');
  const encodedScript = Buffer.from(script, 'utf16le').toString('base64');
  return new Promise((resolve) => {
    execFile('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', encodedScript], {
      windowsHide: true,
      timeout: 4_500,
      maxBuffer: 32 * 1024,
      env: { ...process.env, NEOLIB_TOOL_TARGET: exePath },
    }, (error, stdout) => {
      if (error) return resolve({});
      try {
        const raw = JSON.parse(String(stdout || '{}')) || {};
        return resolve(Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, String(value || '').trim()])));
      } catch { return resolve({}); }
    });
  });
}

function readRegisteredWindowsTool(query) {
  if (process.platform !== 'win32' || !query) return Promise.resolve(null);
  const script = [
    "$q=[Environment]::GetEnvironmentVariable('NEOLIB_TOOL_QUERY','Process')",
    "$roots=@('HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*')",
    '$items=Get-ItemProperty $roots -ErrorAction SilentlyContinue|Where-Object {$_.DisplayName}',
    '$hit=$items|Where-Object {$_.DisplayName -like "*$q*"}|Select-Object -First 1 DisplayName,Publisher,DisplayVersion,URLInfoAbout,InstallLocation,DisplayIcon',
    'if($hit){$hit|ConvertTo-Json -Compress}',
  ].join(';');
  const encodedScript = Buffer.from(script, 'utf16le').toString('base64');
  return new Promise((resolve) => {
    execFile('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', encodedScript], {
      windowsHide: true,
      timeout: 5_500,
      maxBuffer: 64 * 1024,
      env: { ...process.env, NEOLIB_TOOL_QUERY: String(query).slice(0, 120) },
    }, (error, stdout) => {
      if (error || !String(stdout || '').trim()) return resolve(null);
      try { return resolve(JSON.parse(String(stdout))); } catch { return resolve(null); }
    });
  });
}

async function toolOpenGraph(url) {
  if (!/^https:\/\//i.test(String(url || ''))) return {};
  try {
    const html = await httpGetText(url, 9_000);
    return {
      image: metaTag(html, 'og:image') || metaTag(html, 'twitter:image') || '',
      description: metaTag(html, 'og:description') || metaTag(html, 'description') || '',
      title: metaTag(html, 'og:title') || '',
    };
  } catch { return {}; }
}

remainingIpcServices["tools:fetchMetadata"] = async (_event, { query, exePath } = {}) => {
  const file = await readWindowsToolFileInfo(exePath);
  const fileTerms = [query, file.ProductName, file.FileDescription, path.basename(String(exePath || ''), path.extname(String(exePath || '')))]
    .map(cleanSoftwareTerm).filter(Boolean);
  const term = fileTerms[0] || cleanSoftwareTerm(query) || 'Windows tool';
  const known = knownSoftware(fileTerms.join(' '));
  const registered = await readRegisteredWindowsTool(file.ProductName || term);
  const baseName = known?.name || file.ProductName || registered?.DisplayName || term;
  const publisher = known?.publisher || file.CompanyName || registered?.Publisher || '';
  const localDescription = known?.description || file.FileDescription || '';
  const website = known?.website || registered?.URLInfoAbout || '';
  const evidence = [
    file.ProductName && 'Windows executable',
    registered?.DisplayName && 'Windows installed-app record',
    known && 'Recognised software profile',
  ].filter(Boolean);

  let publicResult = null;
  // Public lookup is bounded and software-specific. It is a fallback for
  // unfamiliar EXEs, not a download/install route and never sends file data.
  const webTerms = [baseName, ...fileTerms].filter((value, index, list) => list.indexOf(value) === index).slice(0, 3);
  for (const candidate of webTerms) {
    const results = await ddgSearchRaw(`${candidate} official software`);
    const fallback = results.length ? results : await googleScrapeRaw(`${candidate} official software`);
    const match = pickConfidentMatch(candidate, fallback, 'title', 0.42) || fallback[0];
    if (match) { publicResult = match; break; }
  }
  const publicUrl = website || publicResult?.url || '';
  const page = await toolOpenGraph(publicUrl);
  const description = localDescription || page.description || publicResult?.snippet || `${baseName} is a Windows utility saved in your NEO-LIB Tools collection.`;
  const category = known?.category || inferToolCategory(`${baseName} ${description} ${publisher}`);
  return {
    source: known ? 'recognised software + Windows' : (publicResult ? 'Windows + public software search' : 'Windows executable'),
    name: baseName,
    shortDescription: description.slice(0, 300),
    about: description.slice(0, 1600),
    publisher,
    developers: publisher ? [publisher] : [],
    version: file.ProductVersion || file.FileVersion || registered?.DisplayVersion || '',
    category,
    genres: category ? [category] : [],
    website: publicUrl,
    image: page.image || '',
    evidence,
    metadataFetchedAt: Date.now(),
  };
};

function inferToolCategory(value) {
  const text = String(value || '').toLowerCase();
  if (/(gpu|cpu|hardware|sensor|driver|radeon|nvidia|monitor|overclock|afterburner)/.test(text)) return 'Hardware & graphics';
  if (/(stream|record|capture|broadcast|overlay)/.test(text)) return 'Capture & streaming';
  if (/(map|editor|mod|workshop|sdk|engine)/.test(text)) return 'Game tools';
  if (/(chat|voice|discord|messag)/.test(text)) return 'Communication';
  if (/(browser|web)/.test(text)) return 'Web & browser';
  return 'Windows utility';
}

// ---------------- Gemini fallback (optional) ---------------- //
// Keep every AI route on an explicit, small allow-list. The renderer can show
// future models before they ship, but the desktop process will only ever call
// a provider/model that NEO-LIB has deliberately wired and tested.
const AI_MODELS = Object.freeze([
  { id: 'gemini-2.5-flash', provider: 'gemini', label: 'Gemini 2.5 Flash' },
]);
const DEFAULT_AI_MODEL = AI_MODELS[0].id;
const geminiProvider = createGeminiProviderService({ httpPostJson, cleanSearchTerm, models: AI_MODELS, defaultModel: DEFAULT_AI_MODEL });
function resolveAiModel(model) {
  return geminiProvider.resolveModel(model);
}

// Game callers retain their carefully tuned game vocabulary. Keeping this
// wrapper separate is important: a generic software request must never be
// silently rewritten into a video-game search.
async function ddgSearch(term) {
  return publicWebProvider.searchGameDuckDuckGo(term);
}

async function googleScrape(term) {
  return publicWebProvider.searchGameGoogle(term);
}
async function requestGeminiGameMetadata(apiKey, query, model) {
  return geminiProvider.requestGameMetadata(apiKey, query, model);
}

remainingIpcServices["gemini:metadata"] = async (_e, { apiKey, query, model } = {}) => {
  try { return { ok: true, model: resolveAiModel(model), metadata: await requestGeminiGameMetadata(apiKey, query, model) }; }
  catch (error) { return { ok: false, error: error?.message || 'Gemini request failed.' }; }
};

remainingIpcServices["gemini:test"] = async (_e, { apiKey, model } = {}) => {
  try {
    const activeModel = resolveAiModel(model);
    const metadata = await requestGeminiGameMetadata(apiKey, 'Portal 2', activeModel);
    return { ok: true, model: activeModel, name: metadata.name };
  } catch (error) { return { ok: false, error: error?.message || 'Gemini test failed.' }; }
};

remainingIpcServices["gemini:assistant"] = async (_e, { apiKey, message, model, history, libraryContext } = {}) => {
  try { return { ok: true, model: resolveAiModel(model), text: await geminiProvider.requestAssistant(apiKey, message, model, history, libraryContext) }; }
  catch (error) { return { ok: false, error: error?.message || 'Fungist could not reach the AI service.' }; }
};

// ---------------- Unified metadata pipeline ---------------- //
// Tries Hardcoded → Steam → Epic → GOG → exact public evidence → Gemini (if key) → broader web recovery.

/* Hardcoded entries for popular launcher-exclusives that Steam search misses.
   Keys are normalized (lowercased, alphanumeric only). */
const LAUNCHER_EXCLUSIVES = {
  leagueoflegends: {
    source: 'curated', name: 'League of Legends',
    shortDescription: '5v5 MOBA from Riot Games — pick a champion, push lanes, destroy the enemy Nexus.',
    about: 'League of Legends is a team-based strategy game where two teams of five powerful champions face off to destroy the other\'s base. Choose from over 140 champions to make epic plays, secure kills, and take down towers as you battle your way to victory.',
    headerImage: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lux_0.jpg',
    capsuleImage: 'https://upload.wikimedia.org/wikipedia/en/7/77/League_of_Legends_2019_vector.svg',
    background: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lux_0.jpg',
    screenshots: [],
    genres: ['MOBA', 'Multiplayer', 'Free to play'],
    developers: ['Riot Games'], publishers: ['Riot Games'],
    releaseDate: '27 Oct, 2009', website: 'https://www.leagueoflegends.com/',
  },
  fortnite: {
    source: 'curated', name: 'Fortnite',
    shortDescription: 'Battle royale, build mode, and ever-changing seasons from Epic Games.',
    about: 'Drop in, gear up, and build to win. Fortnite is a free-to-play Battle Royale, Build Mode, Zero Build, Save the World, and Creative experience from Epic Games.',
    headerImage: 'https://cdn2.unrealengine.com/social-image-chapter4-s3-3840x2160-d35912cc25ad.jpg',
    capsuleImage: 'https://cdn2.unrealengine.com/social-image-chapter4-s3-3840x2160-d35912cc25ad.jpg',
    background: 'https://cdn2.unrealengine.com/social-image-chapter4-s3-3840x2160-d35912cc25ad.jpg',
    screenshots: [],
    genres: ['Battle Royale', 'Shooter', 'Free to play'],
    developers: ['Epic Games'], publishers: ['Epic Games'],
    releaseDate: '21 Jul, 2017', website: 'https://www.fortnite.com/',
  },
  valorant: {
    source: 'curated', name: 'VALORANT',
    shortDescription: '5v5 character-based tactical shooter from Riot Games.',
    about: 'VALORANT is a free-to-play 5v5 character-based tactical shooter where precise gunplay meets unique agent abilities. Plant the spike, defuse the spike, take out the enemy team.',
    headerImage: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt8edf9a45a36b7547/65d77a01d4d6fb1f1ec1336c/Val_Banner_HomePage_2160x1080.jpg',
    capsuleImage: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt8edf9a45a36b7547/65d77a01d4d6fb1f1ec1336c/Val_Banner_HomePage_2160x1080.jpg',
    background: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt8edf9a45a36b7547/65d77a01d4d6fb1f1ec1336c/Val_Banner_HomePage_2160x1080.jpg',
    screenshots: [],
    genres: ['FPS', 'Tactical', 'Multiplayer', 'Free to play'],
    developers: ['Riot Games'], publishers: ['Riot Games'],
    releaseDate: '2 Jun, 2020', website: 'https://playvalorant.com/',
  },
  minecraft: {
    source: 'curated', name: 'Minecraft',
    shortDescription: 'Sandbox build/survive game. Explore, mine, craft, and build.',
    about: 'Minecraft is a game about placing blocks and going on adventures. Build anything you can imagine in Creative, or survive against mobs in Survival mode.',
    headerImage: 'https://www.minecraft.net/content/dam/games/minecraft/key-art/Vanilla_KeyArt_LandscapeStandard_2.jpg',
    capsuleImage: 'https://www.minecraft.net/content/dam/games/minecraft/key-art/Vanilla_KeyArt_LandscapeStandard_2.jpg',
    background: 'https://www.minecraft.net/content/dam/games/minecraft/key-art/Vanilla_KeyArt_LandscapeStandard_2.jpg',
    screenshots: [],
    genres: ['Sandbox', 'Survival', 'Adventure'],
    developers: ['Mojang Studios'], publishers: ['Mojang Studios'],
    releaseDate: '18 Nov, 2011', website: 'https://www.minecraft.net/',
  },
  hearthstone: {
    source: 'curated', name: 'Hearthstone',
    shortDescription: 'Free-to-play digital collectible card game from Blizzard.',
    about: 'Hearthstone is a fast-paced strategy card game from Blizzard Entertainment. Collect powerful cards and build winning decks.',
    headerImage: 'https://bnetcmsus-a.akamaihd.net/cms/blog_header/g8/G8KZJ50BIWEH1601590315476.jpg',
    capsuleImage: 'https://bnetcmsus-a.akamaihd.net/cms/blog_header/g8/G8KZJ50BIWEH1601590315476.jpg',
    background: 'https://bnetcmsus-a.akamaihd.net/cms/blog_header/g8/G8KZJ50BIWEH1601590315476.jpg',
    screenshots: [],
    genres: ['Card Game', 'Strategy', 'Free to play'],
    developers: ['Blizzard Entertainment'], publishers: ['Blizzard Entertainment'],
    releaseDate: '11 Mar, 2014', website: 'https://hearthstone.blizzard.com/',
  },
  overwatch2: {
    source: 'curated', name: 'Overwatch 2',
    shortDescription: 'Team-based 5v5 hero shooter from Blizzard.',
    about: 'Overwatch 2 is a free-to-play, team-based hero shooter set in an optimistic future.',
    headerImage: 'https://bnetcmsus-a.akamaihd.net/cms/blog_header/hf/HFM7HQH36JHN1664468506340.jpg',
    capsuleImage: 'https://bnetcmsus-a.akamaihd.net/cms/blog_header/hf/HFM7HQH36JHN1664468506340.jpg',
    background: 'https://bnetcmsus-a.akamaihd.net/cms/blog_header/hf/HFM7HQH36JHN1664468506340.jpg',
    screenshots: [],
    genres: ['FPS', 'Hero Shooter', 'Multiplayer', 'Free to play'],
    developers: ['Blizzard Entertainment'], publishers: ['Blizzard Entertainment'],
    releaseDate: '4 Oct, 2022', website: 'https://overwatch.blizzard.com/',
  },
  worldofwarcraft: {
    source: 'curated', name: 'World of Warcraft',
    shortDescription: 'The flagship Blizzard MMORPG. Quest, raid, and PVP across Azeroth.',
    about: 'World of Warcraft is a massively multiplayer online role-playing game (MMORPG) released in 2004 by Blizzard Entertainment.',
    headerImage: 'https://bnetcmsus-a.akamaihd.net/cms/blog_header/hd/HD4OWHBP10G31694555921858.jpg',
    capsuleImage: 'https://bnetcmsus-a.akamaihd.net/cms/blog_header/hd/HD4OWHBP10G31694555921858.jpg',
    background: 'https://bnetcmsus-a.akamaihd.net/cms/blog_header/hd/HD4OWHBP10G31694555921858.jpg',
    screenshots: [],
    genres: ['MMORPG', 'RPG'],
    developers: ['Blizzard Entertainment'], publishers: ['Blizzard Entertainment'],
    releaseDate: '23 Nov, 2004', website: 'https://worldofwarcraft.blizzard.com/',
  },
  apexlegends: {
    source: 'curated', name: 'Apex Legends',
    shortDescription: 'Free-to-play hero battle royale from Respawn / EA.',
    about: 'Apex Legends is a free-to-play hero shooter where legendary characters with powerful abilities team up to battle for fame & fortune.',
    headerImage: 'https://media.contentapi.ea.com/content/dam/apex-legends/common/season19-ignite/keyart-16x9.jpg',
    capsuleImage: 'https://media.contentapi.ea.com/content/dam/apex-legends/common/season19-ignite/keyart-16x9.jpg',
    background: 'https://media.contentapi.ea.com/content/dam/apex-legends/common/season19-ignite/keyart-16x9.jpg',
    screenshots: [],
    genres: ['Battle Royale', 'FPS', 'Free to play'],
    developers: ['Respawn Entertainment'], publishers: ['Electronic Arts'],
    releaseDate: '4 Feb, 2019', website: 'https://www.ea.com/games/apex-legends',
  },
};
function curatedMatch(query) {
  const k = (query || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return LAUNCHER_EXCLUSIVES[k] || null;
}

// Battle.net does not provide a public, keyless library-metadata API. For its
// well-known locally-installed products, read the matching public product page
// instead of guessing from a Steam search result. This is deliberately bounded
// to a maintained product map: no login, account data, launcher files, or broad
// web scrape is involved. Unmapped names still continue through the normal
// multi-source pipeline below.
const BATTLENET_PRODUCTS = [
  { match: /diablo\s*iv|diablo4/i, ids: ['diablo4', 'diabloiv'], name: 'Diablo IV', url: 'https://eu.shop.battle.net/en-us/product/diablo-iv', genres: ['Action RPG'], tags: ['Action RPG', 'Open World', 'Co-op', 'Multiplayer'], description: 'A dark action RPG from Blizzard where you explore Sanctuary, build a class, and face demons alone or with others.' },
  { match: /diablo\s*ii.*resurrected|d2r/i, ids: ['d2r', 'diablo2resurrected'], name: 'Diablo II: Resurrected', url: 'https://eu.shop.battle.net/en-us/product/diablo-ii-resurrected', genres: ['Action RPG'], tags: ['Action RPG', 'Loot', 'Co-op', 'Multiplayer'], description: 'Blizzard’s remastered action RPG with loot hunting, character builds, and cooperative demon slaying.' },
  { match: /diablo\s*iii|diablo3/i, ids: ['diablo3', 'd3'], name: 'Diablo III', url: 'https://eu.shop.battle.net/en-us/product/diablo-iii', genres: ['Action RPG'], tags: ['Action RPG', 'Loot', 'Co-op', 'Multiplayer'], description: 'A fast-paced Blizzard action RPG focused on seasonal progression, loot, and cooperative adventure.' },
  { match: /diablo\s*immortal/i, ids: ['diabloimmortal'], name: 'Diablo Immortal', url: 'https://diabloimmortal.blizzard.com/', genres: ['Action RPG'], tags: ['Action RPG', 'MMORPG', 'Free to Play', 'Multiplayer'], description: 'A free-to-play online action RPG set in Blizzard’s Diablo universe.' },
  { match: /warcraft\s*(?:iii|3)(?:\s*reforged)?|warcraft3|\bw3\b/i, ids: ['w3', 'warcraft3', 'warcraft3reforged'], name: 'Warcraft III: Reforged', url: 'https://warcraft3.blizzard.com/en-us/', genres: ['Real-Time Strategy'], tags: ['Real-Time Strategy', 'Fantasy', 'Campaign', 'Multiplayer'], description: 'Blizzard’s remastered fantasy real-time strategy game: command one of four races through campaign, custom games, and competitive multiplayer.' },
  { match: /world\s*of\s*warcraft|\bwow\b/i, ids: ['wow', 'wowt', 'wowclassic', 'wow_classic'], name: 'World of Warcraft', url: 'https://worldofwarcraft.blizzard.com/', genres: ['MMORPG'], tags: ['MMORPG', 'Open World', 'Fantasy', 'Multiplayer'], description: 'Blizzard’s long-running online role-playing adventure in Azeroth, with quests, dungeons, raids, and competitive play.' },
  { match: /starcraft\s*ii|starcraft2/i, name: 'StarCraft II', url: 'https://starcraft2.blizzard.com/', genres: ['Real-Time Strategy'], tags: ['Real-Time Strategy', 'Sci-Fi', 'Competitive', 'Multiplayer'] },
  { match: /starcraft.*remastered/i, name: 'StarCraft: Remastered', url: 'https://eu.shop.battle.net/en-us/product/starcraft-remastered', genres: ['Real-Time Strategy'], tags: ['Real-Time Strategy', 'Sci-Fi', 'Competitive', 'Multiplayer'] },
  { match: /overwatch(?:\s*2)?|overwatch2/i, name: 'Overwatch 2', url: 'https://overwatch.blizzard.com/', genres: ['Shooter'], tags: ['Hero Shooter', 'First-Person Shooter', 'Team-Based', 'Multiplayer'] },
  { match: /hearthstone/i, name: 'Hearthstone', url: 'https://hearthstone.blizzard.com/', genres: ['Card Game'], tags: ['Card Game', 'Strategy', 'Free to Play', 'Multiplayer'] },
  { match: /heroes\s*of\s*the\s*storm/i, name: 'Heroes of the Storm', url: 'https://heroesofthestorm.blizzard.com/', genres: ['MOBA'], tags: ['MOBA', 'Strategy', 'Team-Based', 'Multiplayer'] },
  { match: /warzone/i, name: 'Call of Duty: Warzone', url: 'https://eu.shop.battle.net/en-us/product/call-of-duty-warzone-2', genres: ['Shooter'], tags: ['First-Person Shooter', 'Battle Royale', 'Multiplayer', 'Free to Play'] },
  { match: /black\s*ops\s*6|bo6/i, name: 'Call of Duty: Black Ops 6', url: 'https://eu.shop.battle.net/en-us/product/call-of-duty-black-ops-6', genres: ['Shooter'], tags: ['First-Person Shooter', 'Campaign', 'Multiplayer', 'Zombies'] },
  { match: /black\s*ops\s*cold\s*war/i, name: 'Call of Duty: Black Ops Cold War', url: 'https://eu.shop.battle.net/en-us/product/call-of-duty-black-ops-cold-war', genres: ['Shooter'], tags: ['First-Person Shooter', 'Campaign', 'Multiplayer', 'Zombies'] },
];
const BATTLENET_METADATA_CACHE = new Map();

function battleNetProductFor(...values) {
  const evidence = values.filter(Boolean).map((value) => String(value)).join(' · ');
  const compact = evidence.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return BATTLENET_PRODUCTS.find((entry) => entry.match.test(evidence) || (entry.ids || []).some((id) => compact.includes(String(id).toLowerCase().replace(/[^a-z0-9]+/g, '')))) || null;
}

function metaTag(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'),
  ];
  const value = patterns.map((pattern) => html.match(pattern)?.[1]).find(Boolean) || '';
  return stripHtml(value.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
}

async function battleNetMetadata(query, productIdentity = '', force = false) {
  const product = battleNetProductFor(query, productIdentity);
  if (!product) return null;
  const cached = BATTLENET_METADATA_CACHE.get(product.name);
  if (!force && cached && Date.now() - cached.at < 12 * 60 * 60 * 1000) return cached.value;
  // The maintained Blizzard product identity is already enough to recover a
  // correct, useful library record. The public product page enriches art and
  // current wording when reachable, but a transient CDN/locale failure must
  // never send Refresh into a fuzzy Steam/GOG match for WoW or Warcraft III.
  // A few Blizzard games have maintained local artwork as well.  Use it only
  // when it belongs to this exact canonical product; it is a safe fallback for
  // Blizzard's anti-bot/login pages, not a cross-store search result.
  const curated = curatedMatch(product.name) || {};
  const fallback = {
    source: 'battlenet',
    name: product.name,
    shortDescription: product.description || `Official Blizzard metadata for ${product.name}.`,
    about: product.description || `Official Blizzard metadata for ${product.name}.`,
    headerImage: curated.headerImage || '',
    capsuleImage: curated.capsuleImage || curated.headerImage || '',
    background: curated.background || curated.headerImage || '',
    screenshots: curated.screenshots || [],
    genres: product.genres,
    genreTags: product.tags,
    developers: ['Blizzard Entertainment'],
    publishers: ['Blizzard Entertainment'],
    website: product.url,
    metadataEvidence: ['Battle.net local product identity', 'Blizzard public product catalogue', ...(curated.headerImage ? ['Maintained Blizzard artwork fallback'] : [])],
  };
  try {
    const html = await httpGetText(product.url, 10_000);
    const image = metaTag(html, 'og:image');
    const description = metaTag(html, 'og:description') || metaTag(html, 'description');
    const value = {
      ...fallback,
      shortDescription: description || fallback.shortDescription,
      about: description || fallback.about,
      headerImage: image || fallback.headerImage,
      capsuleImage: image || fallback.capsuleImage,
      background: image || fallback.background,
      metadataEvidence: [...fallback.metadataEvidence, 'Blizzard public product page'],
    };
    BATTLENET_METADATA_CACHE.set(product.name, { at: Date.now(), value });
    return value;
  } catch {
    BATTLENET_METADATA_CACHE.set(product.name, { at: Date.now(), value: fallback });
    return fallback;
  }
}

// AI and web fallbacks are intentionally text-first. Once a title is
// identified, enrich it from its own public website rather than pretending an
// AI response contains artwork. This is read-only, bounded to one page, and
// never downloads a game file. Steam/GOG/itch/Battle.net already return their
// own artwork, so this only fills genuinely missing fields.
async function enrichMetadataArtwork(metadata) {
  if (!metadata || (metadata.headerImage && metadata.capsuleImage && metadata.background)) return metadata;
  let pageUrl = String(metadata.website || '').trim();
  try { pageUrl = new URL(pageUrl).toString(); } catch {
    // AI and public snippets occasionally identify the title correctly but
    // have no canonical URL. One title-matched public result gives us a safe
    // last chance to collect its open-graph art; weak results are ignored.
    try {
      const results = await ddgSearch(`${metadata.name || ''} official game`);
      const match = pickConfidentMatch(metadata.name || '', results || [], 'title', 0.68);
      pageUrl = match?.url ? new URL(match.url).toString() : '';
    } catch { pageUrl = ''; }
    if (!pageUrl) return metadata;
  }
  try {
    const html = await httpGetText(pageUrl, 10_000);
    const primary = metaTag(html, 'og:image') || metaTag(html, 'twitter:image');
    if (!primary) return metadata;
    const screenshotUrls = [];
    const add = (value) => {
      const url = String(value || '').replace(/&amp;/g, '&').trim();
      if (!/^https?:\/\//i.test(url) || screenshotUrls.includes(url) || screenshotUrls.length >= 6) return;
      screenshotUrls.push(url);
    };
    // Public product pages sometimes publish a small gallery as image tags.
    // Keep only normal image URLs and never scrape authenticated pages.
    for (const match of html.matchAll(/https?:[^"'<>\\\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'<>\\\s]*)?/gi)) add(match[0]);
    return {
      ...metadata,
      headerImage: metadata.headerImage || primary,
      capsuleImage: metadata.capsuleImage || primary,
      background: metadata.background || primary,
      screenshots: metadata.screenshots?.length ? metadata.screenshots : screenshotUrls.filter((url) => url !== primary).slice(0, 6),
    };
  } catch { return metadata; }
}

// ---------------- Per-source candidate search ---------------- //

// Build local, read-only search hints for difficult indie games. This only
// inspects the executable's immediate folder and parent, with strict file-count
// and size caps; it never recursively scans a drive or uploads file contents.
remainingIpcServices["metadata:deriveHints"] = async (_e, { exePath, currentName } = {}) => {
  const hints = [];
  const seen = new Set();
  const noise = /^(game|launcher|launch|start|play|main|win32|win64|x86|x64|bin|build|release|shipping|binaries|www)$/i;
  const add = (value, evidence) => {
    const cleaned = String(value || '')
      .replace(/\.(exe|bat|cmd|lnk|txt|md|url)$/i, '')
      .replace(/[-_.]+/g, ' ')
      .replace(/\b(win64|win32|shipping|launcher|repack|portable|v?\d+(?:\.\d+)+)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const key = cleaned.toLowerCase();
    if (cleaned.length < 3 || noise.test(cleaned) || seen.has(key)) return;
    seen.add(key);
    hints.push({ query: cleaned.slice(0, 100), evidence });
  };
  add(currentName, 'Current library name');
  if (!exePath || !path.isAbsolute(exePath)) return { hints };
  const exeDir = path.dirname(exePath);
  add(path.basename(exePath), 'Executable name');
  add(path.basename(exeDir), 'Game folder');
  add(path.basename(path.dirname(exeDir)), 'Parent folder');
  const folders = [exeDir, path.dirname(exeDir)];
  const readable = /\.(txt|md|nfo)$/i;
  const titleLine = /^(?:#{1,3}\s*)?(?:game\s*(?:title|name)|project\s*(?:title|name)|title)\s*[:=-]\s*(.{3,100})$/i;
  for (const folder of folders) {
    let entries = [];
    try { entries = await fsp.readdir(folder, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries.filter((item) => item.isFile() && readable.test(item.name)).slice(0, 12)) {
      add(entry.name.replace(/\b(readme|changelog|patchnotes?|version|info)\b/gi, ''), `File name · ${entry.name}`);
      const file = path.join(folder, entry.name);
      try {
        const stat = await fsp.stat(file);
        if (stat.size > 96 * 1024) continue;
        const body = await fsp.readFile(file, 'utf8');
        const lines = body.split(/\r?\n/).slice(0, 80);
        for (const line of lines) {
          const match = line.trim().match(titleLine);
          if (match) add(match[1], `Inside ${entry.name}`);
        }
        const heading = lines.map((line) => line.trim()).find((line) => /^#{1,2}\s+.{3,100}$/.test(line));
        if (heading) add(heading.replace(/^#{1,2}\s+/, ''), `Heading in ${entry.name}`);
      } catch { /* unreadable local note — skip */ }
    }
  }
  return { hints: hints.slice(0, 10) };
};

/**
 * `metadata:listCandidates` — replaces the old "give me one best guess"
 * dispatch with a "give me an ARRAY of candidates the user can browse".
 *
 * Each candidate is a normalized preview: {source, id, name, image, year,
 * shortDescription, raw}. `raw` is whatever the source returned and is used
 * later by `metadata:expandCandidate` to fetch the full record.
 *
 * Sources accepted:
 *   'auto'      → falls back to the legacy single-best metadata:auto
 *   'steam'     → Steam Store search → up to 10 hits
 *   'gog'       → GOG catalog search → up to 10
 *   'itch'      → itch.io HTML search → up to 8
 *   'dlsite'    → DLsite RJ/VJ code lookup (single hit) OR keyword search
 *   'vndb'      → VNDB Kana API search → up to 10
 *   'ryuugames' → Ryuugames WordPress search → up to 5
 *   'f95zone'   → DDG `site:f95zone.to <query>` → up to 5 thread title hits
 *   'google'    → DDG/Google scrape — up to 8 generic web results
 *   'ai'        → Gemini "name this game" → returns a single synthetic hit
 */
remainingIpcServices["metadata:listCandidates"] = async (_e, { source, query, geminiKey, aiModel } = {}) => {
  return metadataCandidates.listCandidates({ source, query, geminiKey, aiModel });
};

/**
 * `metadata:expandCandidate` — turn a candidate preview into a full metadata
 * record (the kind AcceptMetadataModal expects). Called when the user picks
 * a result from the carousel.
 */
remainingIpcServices["metadata:expandCandidate"] = async (_e, { candidate } = {}) => {
  return metadataCandidates.expandCandidate({ candidate });
};

// ---- Per-source list helpers (lightweight previews) ---- //

async function listSteamCandidates(term) {
  const data = await httpGetJson(
    `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=en&cc=us`
  );
  return (data.items || []).slice(0, 10).map((it) => ({
    source: 'steam',
    id: String(it.id),
    name: it.name,
    image: it.tiny_image || `https://cdn.cloudflare.steamstatic.com/steam/apps/${it.id}/header.jpg`,
    year: '',
    shortDescription: '',
    raw: it,
  }));
}
async function expandSteam(c) {
  const det = await httpGetJson(`https://store.steampowered.com/api/appdetails?appids=${c.id}&l=en&cc=us`);
  const entry = det && det[c.id];
  if (!entry || !entry.success) return null;
  const d = entry.data;
  const genreTags = await steamGenreEvidence(c.id, d);
  return {
    source: 'steam',
    appid: c.id,
    name: d.name,
    shortDescription: d.short_description,
    about: stripHtml(d.about_the_game || '').slice(0, 1400),
    headerImage: d.header_image,
    capsuleImage: d.capsule_imagev5 || d.capsule_image,
    background: d.background_raw || d.background,
    screenshots: (d.screenshots || []).slice(0, 6).map((s) => s.path_full),
    genres: (d.genres || []).map((g) => g.description),
    genreTags,
    developers: d.developers || [],
    publishers: d.publishers || [],
    releaseDate: d.release_date ? d.release_date.date : '',
    metacritic: d.metacritic ? d.metacritic.score : null,
    website: d.website || '',
  };
}

async function listGogCandidates(term) {
  const url = `https://catalog.gog.com/v1/catalog?limit=10&query=like:${encodeURIComponent(term)}&order=desc:score&productType=in:game,pack`;
  const data = await httpGetJson(url);
  return (data.products || []).slice(0, 10).map((p) => ({
    source: 'gog',
    id: String(p.id || p.slug),
    name: p.title,
    image: (p.coverHorizontal || p.image || '').replace(/^\/\//, 'https://'),
    year: (p.releaseDate || '').slice(0, 4),
    shortDescription: '',
    raw: p,
  }));
}
async function expandGog(c) {
  const p = c.raw || {};
  return {
    source: 'gog',
    name: p.title || c.name,
    shortDescription: '',
    about: '',
    headerImage: (p.coverHorizontal || p.image || '').replace(/^\/\//, 'https://'),
    capsuleImage: (p.coverVertical || p.image || '').replace(/^\/\//, 'https://'),
    background: (p.coverHorizontal || p.image || '').replace(/^\/\//, 'https://'),
    screenshots: (p.screenshots || []).slice(0, 6).map((s) => (s.formatterTemplateUrl || s.imageUrl || '').replace(/_{formatter}/, '_glx_screenshot_thumbnail_716')),
    genres: (p.genres || []).map((g) => g.name || g),
    developers: p.developers || [],
    publishers: p.publishers || [],
    releaseDate: (p.releaseDate || '').slice(0, 10),
    website: `https://www.gog.com${p.storeLink || ''}`,
  };
}

async function listItchCandidates(term) {
  const url = `https://itch.io/search?q=${encodeURIComponent(term)}`;
  const html = await httpGetText(url);
  const out = [];
  const re = /<div class="game_cell[^"]*"[\s\S]*?<a[^>]+href="(https?:\/\/[^"]+itch\.io[^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?(?:<img[^>]+(?:data-lazy_src|src)="([^"]+)")?/g;
  let m;
  while ((m = re.exec(html)) !== null && out.length < 8) {
    out.push({
      source: 'itch',
      id: m[1],
      name: m[2].trim(),
      image: m[3] || '',
      year: '',
      shortDescription: '',
      raw: { pageUrl: m[1] },
    });
  }
  return out;
}
async function expandItch(c) {
  return itchDetails(c.id);
}

async function listDlsiteCandidates(term) {
  const code = extractDLsiteCode(term);
  if (code) {
    const hit = await dlsiteLookup(code);
    if (hit) {
      return [{
        source: 'dlsite',
        id: code,
        name: hit.name,
        image: hit.headerImage || '',
        year: (hit.releaseDate || '').slice(0, 4),
        shortDescription: hit.shortDescription || '',
        raw: hit,
      }];
    }
  }
  // Keyword search on DLsite English
  try {
    const url = `https://www.dlsite.com/maniax/fsr/=/keyword/${encodeURIComponent(term)}/work_category[0]/doujin/order/trend/work_type_category[0]/game`;
    const html = await httpGetText(url);
    const re = /<a[^>]+href="(\/maniax\/work\/=\/product_id\/(RJ\d+)\.html)"[^>]*>([\s\S]*?)<\/a>/g;
    const out = [];
    let m;
    const seen = new Set();
    while ((m = re.exec(html)) !== null && out.length < 8) {
      const codeMatch = m[2];
      if (seen.has(codeMatch)) continue;
      seen.add(codeMatch);
      const title = m[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (!title) continue;
      out.push({
        source: 'dlsite',
        id: codeMatch,
        name: title,
        image: `https://img.dlsite.jp/modpub/images2/work/doujin/${codeMatch.slice(0, 5)}000/${codeMatch}_img_main.jpg`,
        year: '',
        shortDescription: '',
        raw: { code: codeMatch },
      });
    }
    return out;
  } catch { return []; }
}

async function listVndbCandidates(term) {
  try {
    const body = { filters: ['search', '=', term], fields: 'id,title,image.url,released,description', results: 10 };
    const data = await httpPostJson('https://api.vndb.org/kana/vn', body);
    return (data.results || []).slice(0, 10).map((v) => ({
      source: 'vndb',
      id: v.id,
      name: v.title,
      image: v.image?.url || '',
      year: (v.released || '').slice(0, 4),
      shortDescription: (v.description || '').slice(0, 160),
      raw: v,
    }));
  } catch { return []; }
}
async function expandVndb(c) {
  const v = c.raw || {};
  return {
    source: 'vndb',
    name: v.title || c.name,
    shortDescription: (v.description || '').replace(/\[[\s\S]+?\]/g, '').slice(0, 240),
    about: (v.description || '').replace(/\[[\s\S]+?\]/g, '').slice(0, 1400),
    headerImage: v.image?.url || c.image,
    capsuleImage: v.image?.url || c.image,
    background: v.image?.url || c.image,
    screenshots: [],
    genres: ['Visual Novel'],
    developers: [],
    publishers: [],
    releaseDate: v.released || '',
    website: `https://vndb.org/${v.id || ''}`,
  };
}

async function listRyuuCandidates(term) {
  try {
    const url = `https://www.ryuugames.com/?s=${encodeURIComponent(term)}`;
    const html = await httpGetText(url);
    const out = [];
    const re = /<h2[^>]*post-title[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
    let m;
    while ((m = re.exec(html)) !== null && out.length < 5) {
      out.push({
        source: 'ryuugames',
        id: m[1],
        name: m[2].trim(),
        image: '',
        year: '',
        shortDescription: '',
        raw: { pageUrl: m[1] },
      });
    }
    return out;
  } catch { return []; }
}
async function expandRyuu(c) {
  try {
    const page = await httpGetText(c.id);
    const cover = (page.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || '';
    const desc = (page.match(/<meta property="og:description" content="([^"]+)"/) || [])[1] || '';
    return {
      source: 'ryuugames',
      name: c.name,
      shortDescription: desc,
      about: desc,
      headerImage: cover,
      capsuleImage: cover,
      background: cover,
      screenshots: [],
      genres: ['Visual Novel'],
      developers: [],
      publishers: [],
      releaseDate: '',
      website: c.id,
    };
  } catch { return null; }
}

/**
 * F95Zone — uses DuckDuckGo to find threads on f95zone.to.
 * F95Zone itself rate-limits unauthenticated requests, so we scrape result
 * links from DDG and present them as candidates. The user opens the thread
 * by picking one — full metadata extraction is best-effort.
 */
async function listF95Candidates(term) {
  try {
    const results = await ddgSearch(`site:f95zone.to ${term}`);
    return (results || []).slice(0, 6).map((r) => ({
      source: 'f95zone',
      id: r.url,
      name: cleanTitle(r.title || '').replace(/\s*\|.*$/, ''),
      image: '',
      year: '',
      shortDescription: r.snippet || '',
      raw: r,
    }));
  } catch { return []; }
}
async function expandF95(c) {
  // We don't try to scrape the F95Zone thread (auth required for many subforums).
  // Return a record that the user can hand-edit afterwards.
  return {
    source: 'f95zone',
    name: c.name || 'F95Zone game',
    shortDescription: c.shortDescription || '',
    about: c.shortDescription || '',
    headerImage: '',
    capsuleImage: '',
    background: '',
    screenshots: [],
    genres: ['Adult'],
    developers: [],
    publishers: [],
    releaseDate: '',
    website: c.id,
  };
}

async function listGoogleCandidates(term) {
  try {
    const results = await publicWebProvider.searchGameMetadata(term);
    return (results || []).slice(0, 8).map((r) => ({
      source: 'google',
      id: r.url,
      name: cleanPublicGameTitle(r.title || '', r.url),
      image: '',
      year: ((r.snippet + ' ' + r.title).match(/\b(19|20)\d{2}\b/) || [])[0] || '',
      shortDescription: r.snippet || '',
      raw: r,
    }));
  } catch { return []; }
}
async function expandGoogle(c) {
  const r = c.raw || {};
  const url = r.url || c.id || '';
  let page = {};
  if (/^https?:\/\/[^/]*\.itch\.io\//i.test(url)) {
    const itch = await itchDetails(url);
    if (itch) page = {
      title: String(itch.title || '').replace(/\s+by\s+.+$/i, '').trim(),
      description: itch.desc || '', image: itch.cover || '', screenshots: itch.shots || [],
      developer: itch.developer || '', source: 'itch',
    };
  } else if (/^https?:\/\//i.test(url)) {
    try {
      const html = await httpGetText(url, 9_000);
      page = {
        title: metaTag(html, 'og:title') || metaTag(html, 'twitter:title'),
        description: metaTag(html, 'og:description') || metaTag(html, 'description'),
        image: metaTag(html, 'og:image') || metaTag(html, 'twitter:image'), screenshots: [], source: 'web',
      };
    } catch { /* The reviewed search snippet remains usable. */ }
  }
  const description = page.description || r.snippet || '';
  const identityText = `${description} ${r.title || ''}`.toLowerCase();
  const genres = [
    ['Adult', /\b(?:adult|nsfw|erotic)\b/], ['Adventure', /\badventure\b/], ['Dating Sim', /\b(?:dating sim|dating adventure)\b/],
    ['Open World', /\bopen[- ]world\b/], ['Visual Novel', /\bvisual novel\b/], ['Simulation', /\bsimulation\b/], ['Indie', /\bindie\b/],
  ].filter(([, pattern]) => pattern.test(identityText)).map(([genre]) => genre);
  return {
    source: page.source || 'web',
    name: page.title || c.name || 'Unknown',
    shortDescription: description.slice(0, 320),
    about: description,
    headerImage: page.image || '',
    capsuleImage: page.image || '',
    background: page.image || '',
    screenshots: page.screenshots || [],
    genres,
    developers: page.developer ? [page.developer] : [],
    publishers: page.developer ? [page.developer] : [],
    releaseDate: c.year || '',
    website: url,
  };
}

async function metadataFromPublicResult(top, fallbackName) {
  const year = (`${top?.snippet || ''} ${top?.title || ''}`.match(/\b(19|20)\d{2}\b/) || [])[0] || '';
  const text = `${top?.snippet || ''} ${top?.title || ''}`.toLowerCase();
  const genreKeywords = [
    'RPG', 'action', 'adventure', 'puzzle', 'platformer', 'shooter', 'strategy',
    'simulation', 'roguelike', 'rogue-like', 'horror', 'survival', 'racing', 'sports',
    'fighting', 'metroidvania', 'visual novel', 'sandbox', 'open-world', 'indie',
  ];
  const inferredGenres = [...new Set(genreKeywords.filter(keyword => text.includes(keyword.toLowerCase())).map(genre => genre.replace(/\b\w/g, character => character.toUpperCase())))];
  const expanded = await expandGoogle({ source: 'google', id: top?.url, name: cleanPublicGameTitle(top?.title, top?.url) || fallbackName, year, raw: top });
  return enrichMetadataArtwork({ ...expanded, genres: [...new Set([...(expanded.genres || []), ...inferredGenres])] });
}

async function listAiCandidates(term, geminiKey, aiModel) {
  if (!geminiKey) return [{
    source: 'ai',
    id: 'ai-key-missing',
    name: 'Gemini API key required',
    image: '',
    year: '',
    shortDescription: 'Add your Gemini API key in Settings → Integrations to use the "Ask AI" source.',
    raw: null,
  }];
  const metadata = await requestGeminiGameMetadata(geminiKey, term, aiModel);
  return [{
    source: 'ai', id: 'gemini-1', name: metadata.name, image: '',
    year: (metadata.releaseDate || '').slice(0, 4),
    shortDescription: metadata.shortDescription || '', raw: metadata,
  }];
}

remainingIpcServices["metadata:auto"] = async (_e, { query, skipSources = [], geminiKey, aiModel, lockedAppid, launcher, launcherProductId, force = false }) => {
  const launcherKey = String(launcher || '').toLowerCase();
  // A Battle.net product identity is authoritative for its own import. Check
  // it before an inherited/old Steam app ID so a cross-store metadata field
  // can never pull Warcraft III or World of Warcraft into the Steam-only path.
  if (launcherKey === 'battlenet') {
    const battleNet = await battleNetMetadata(query, launcherProductId, force);
    if (battleNet) return enrichMetadataArtwork(battleNet);
  }
  // If a lockedAppid is provided, skip search entirely and just refresh that exact entry.
  // Delisted Steam products can remain in a customer's library and manifest while
  // disappearing from public store search (and sometimes appdetails).  Never let a
  // failed exact lookup fall through to an unrelated fuzzy match.
  if (lockedAppid) {
    try {
      const det = await httpGetJson(
        `https://store.steampowered.com/api/appdetails?appids=${lockedAppid}&l=en&cc=us`
      );
      const entry = det && det[lockedAppid];
      if (entry && entry.success) {
        const d = entry.data;
        const genreTags = await steamGenreEvidence(lockedAppid, d);
        return {
          source: 'steam',
          appid: lockedAppid,
          name: d.name,
          shortDescription: d.short_description,
          about: stripHtml(d.about_the_game || '').slice(0, 1400),
          headerImage: d.header_image,
          capsuleImage: d.capsule_imagev5 || d.capsule_image,
          background: d.background_raw || d.background,
          screenshots: (d.screenshots || []).slice(0, 6).map((s) => s.path_full),
          genres: (d.genres || []).map((g) => g.description),
          genreTags,
          developers: d.developers || [],
          publishers: d.publishers || [],
          releaseDate: d.release_date ? d.release_date.date : '',
          metacritic: d.metacritic ? d.metacritic.score : null,
          website: d.website || '',
        };
      }
    } catch { /* retain the local Steam identity below */ }
    return {
      source: 'steam',
      appid: String(lockedAppid),
      name: String(query || `Steam App ${lockedAppid}`),
      metadataUnavailable: true,
    };
  }
  const term = cleanSearchTerm(query);
  if (!term) return null;

  // 0a. DLsite RJ-code / VJ-code match — deterministic, instant high-quality
  // hit for Japanese indie / RPG-Maker / RenPy games. Many users name their
  // folders with the code (e.g. "Lust Room RJ01450973") which makes this a
  // 100%-precision lookup with no false positives.
  if (!skipSources.includes('dlsite')) {
    const code = extractDLsiteCode(query);
    if (code) {
      const hit = await dlsiteLookup(code);
      if (hit) return hit;
    }
  }

  // 0b. Battle.net first: a Blizzard title has stronger local identity than
  // a generic cross-store search and its official page can provide its art.
  // 0c. Curated launcher-exclusives (LoL, Fortnite, Valorant, Minecraft, etc.) — instant, no network
  const curated = curatedMatch(term);
  if (curated) return curated;

  // 1. Steam
  if (!skipSources.includes('steam')) {
    try {
      const data = await httpGetJson(
        `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=en&cc=us`
      );
      if (data.items && data.items.length > 0) {
        const top = pickConfidentMatch(term, data.items, 'name');
        if (!top) throw new Error('No confident Steam title match.');
        const det = await httpGetJson(
          `https://store.steampowered.com/api/appdetails?appids=${top.id}&l=en&cc=us`
        );
        const entry = det && det[top.id];
        if (entry && entry.success) {
          const d = entry.data;
          const genreTags = await steamGenreEvidence(top.id, d);
          return {
            source: 'steam',
            appid: top.id,
            name: d.name,
            shortDescription: d.short_description,
            about: stripHtml(d.about_the_game || '').slice(0, 1400),
            headerImage: d.header_image,
            capsuleImage: d.capsule_imagev5 || d.capsule_image,
            background: d.background_raw || d.background,
            screenshots: (d.screenshots || []).slice(0, 6).map((s) => s.path_full),
            genres: (d.genres || []).map((g) => g.description),
            genreTags,
            developers: d.developers || [],
            publishers: d.publishers || [],
            releaseDate: d.release_date ? d.release_date.date : '',
            metacritic: d.metacritic ? d.metacritic.score : null,
            website: d.website || '',
          };
        }
      }
    } catch {}
  }

  // 2. GOG
  if (!skipSources.includes('gog')) {
    try {
      const data = await httpGetJson(
        `https://catalog.gog.com/v1/catalog?limit=10&query=like:${encodeURIComponent(term)}&order=desc:score&productType=in:game,pack`
      );
      const top = pickConfidentMatch(term, data.products || [], 'title');
      if (top) {
        return {
          source: 'gog',
          gogId: top.id,
          name: top.title,
          shortDescription: '',
          about: '',
          headerImage: top.coverHorizontal,
          capsuleImage: top.coverVertical,
          background: top.coverHorizontal,
          screenshots: (top.screenshots || [])
            .map((s) => (typeof s === 'string' ? s : s.url || ''))
            .map((s) => s.replace('{formatter}', 'product_card_v2_logo_710x355').replace('{ext}', 'webp'))
            .filter(Boolean)
            .slice(0, 6),
          genres: (top.genres || []).map((g) => g.name || g),
          developers: top.developers || [],
          publishers: top.publishers || [],
          releaseDate: top.releaseDate ? top.releaseDate.slice(0, 10) : '',
          website: 'https://www.gog.com' + (top.storeLink || ''),
        };
      }
    } catch {}
  }

  // 3. itch.io — critical for indie / Python / RPG-Maker / experimental games
  // that never make it to Steam or GOG. Scraped from the public search page.
  if (!skipSources.includes('itch')) {
    try {
      const hits = await itchSearch(term);
      if (hits.length > 0) {
        const top = pickConfidentMatch(term, hits, 'title');
        if (!top) throw new Error('No confident itch.io title match.');
        const det = await itchDetails(top.url);
        if (det) {
          return {
            source: 'itch',
            name: det.title || top.title,
            shortDescription: det.desc,
            about: det.desc,
            headerImage: det.cover || top.image,
            capsuleImage: det.cover || top.image,
            background: det.cover || top.image,
            screenshots: det.shots,
            genres: ['Indie'],
            developers: det.developer ? [det.developer] : [],
            publishers: det.developer ? [det.developer] : [],
            releaseDate: '',
            website: top.url,
          };
        }
        // Even without details we have a basic match
        return {
          source: 'itch',
          name: top.title,
          shortDescription: '',
          about: '',
          headerImage: top.image,
          capsuleImage: top.image,
          background: top.image,
          screenshots: [],
          genres: ['Indie'],
          developers: [],
          publishers: [],
          releaseDate: '',
          website: top.url,
        };
      }
    } catch {}
  }

  // 3b. VNDB — authoritative source for visual novels (huge metadata DB).
  if (!skipSources.includes('vndb')) {
    const hit = await vndbLookup(term);
    if (hit) return hit;
  }

  // 4. Exact public-title recovery comes before AI. Delisted adult/indie games
  // often retain an official product page that normal storefront APIs hide.
  if (!skipSources.includes('google') && !skipSources.includes('web')) {
    try {
      const exactResults = await publicWebProvider.searchGameMetadata(term);
      if (exactResults.length) return await metadataFromPublicResult(exactResults[0], term);
    } catch { /* Continue through specialist and optional AI fallbacks. */ }
  }

  // 5. Gemini (if user key provided)
  if (!skipSources.includes('gemini') && geminiKey) {
    try { return await enrichMetadataArtwork(await requestGeminiGameMetadata(geminiKey, term, aiModel)); } catch { /* continue with non-AI sources */ }
  }

  // 6. Ryuugames — adult-VN repackager. Sometimes the only place an obscure
  //    indie game has a clean cover + description findable on the open web.
  if (!skipSources.includes('ryuugames')) {
    const hit = await ryuugamesSearch(term);
    if (hit) return hit;
  }

  // 7. Web fallback (DuckDuckGo → Google) — tries the full term first, then
  //    progressively simplified variants. Many indie games have parenthetical
  //    version tags / build numbers in their folder names that throw off search.
  const variants = [term];
  // Many indie folder names have parenthetical version/build tags that throw
  // off search. Strip them as a first refinement.
  const simpler = term
    .replace(/[\(\[].*?[\)\]]/g, '')      // strip "(v1.2)" / "[demo]"
    .replace(/\b(?:v?\d+(?:\.\d+)+|build\s*\d+|demo|alpha|beta)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (simpler && simpler !== term && simpler.length >= 3) variants.push(simpler);
  // First 3 words — drops trailing junk like "RJ01450973" or build hashes
  const words = simpler.split(/\s+/).filter(Boolean);
  if (words.length > 3) variants.push(words.slice(0, 3).join(' '));
  // Add explicit "game" suffix variants — Google/DDG often return much better
  // results when "game" is explicitly in the query for ambiguous indie titles.
  variants.push(term + ' game');
  if (simpler && simpler !== term) variants.push(simpler + ' game');
  if (words.length > 3) variants.push(words.slice(0, 3).join(' ') + ' game');

  for (const v of variants) {
    try {
      const webResults = await publicWebProvider.searchGameMetadata(v);
      if (webResults.length > 0) {
        return await metadataFromPublicResult(webResults[0], v);
      }
    } catch {}
  }

  return null;
};

/* ============================================================ */
/* LAUNCHER DETECTOR — process-only check. Never reads client data. */
/* ============================================================ */
function detectRunningLaunchers() {
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    if (process.platform !== 'win32') return resolve({});
    exec('tasklist /FO CSV /NH', { maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
      if (err) return resolve({});
      const lc = (stdout || '').toLowerCase();
      resolve({
        steam:    lc.includes('steam.exe'),
        epic:     lc.includes('epicgameslauncher.exe'),
        ea:       lc.includes('ea.exe') || lc.includes('eadesktop.exe') || lc.includes('eaapp.exe'),
        ubisoft:  lc.includes('upc.exe') || lc.includes('uplay.exe'),
        gog:      lc.includes('galaxyclient.exe'),
        battlenet:lc.includes('battle.net.exe') || lc.includes('agent.exe'),
        riot:     lc.includes('riotclientservices.exe'),
        xbox:     lc.includes('xboxpcapp.exe'),
        rockstar: lc.includes('rockstargameslauncher.exe') || lc.includes('rockstargames.launcher.exe'),
        itch:     lc.includes('itch.exe') || lc.includes('itch-app.exe'),
      });
    });
  });
}

// Steam's appdetails response has official broad genres and feature categories,
// but not the rich community tag vocabulary needed for specific subgenres.
// SteamSpy provides a tag map per app. Cache it for a day and serialize calls
// at its documented public pace, so a metadata refresh stays respectful.
const STEAM_TAXONOMY_CACHE = new Map();
let steamSpyNextRequestAt = 0;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function steamGenreEvidence(appid, storeData = {}) {
  const official = [
    ...(storeData.genres || []).map((entry) => entry.description),
    ...(storeData.categories || []).map((entry) => entry.description),
  ].filter(Boolean);
  const key = String(appid || '');
  const cached = STEAM_TAXONOMY_CACHE.get(key);
  if (cached && Date.now() - cached.at < 24 * 60 * 60 * 1000) return Array.from(new Set([...official, ...cached.tags]));
  try {
    const wait = Math.max(0, steamSpyNextRequestAt - Date.now());
    if (wait) await sleep(wait);
    steamSpyNextRequestAt = Date.now() + 1_050;
    const data = await httpGetJson(`https://steamspy.com/api.php?request=appdetails&appid=${encodeURIComponent(key)}`, 8_000);
    const tags = Object.entries(data?.tags || {})
      .sort(([, left], [, right]) => Number(right || 0) - Number(left || 0))
      // Keep enough direct community evidence for mixed identities (for
      // example Builder + Sandbox + Vehicle construction), while Preview
      // still caps what it displays. These tags are cached and never mined
      // from a description.
      .slice(0, 30)
      .map(([tag]) => tag)
      .filter(Boolean);
    STEAM_TAXONOMY_CACHE.set(key, { at: Date.now(), tags });
    return Array.from(new Set([...official, ...tags]));
  } catch {
    return Array.from(new Set(official));
  }
}

remainingIpcServices["launcher:detect"] = async () => detectRunningLaunchers();

const SOCIAL_PLATFORM_IDS = new Set(['steam', 'epic', 'ea', 'ubisoft', 'battlenet']);

function socialClientCandidates(platform) {
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const path = require('path');
  return {
    steam: [path.join(programFilesX86, 'Steam', 'steam.exe'), path.join(programFiles, 'Steam', 'steam.exe')],
    epic: [path.join(programFilesX86, 'Epic Games', 'Launcher', 'Portal', 'Binaries', 'Win64', 'EpicGamesLauncher.exe')],
    ea: [path.join(programFiles, 'Electronic Arts', 'EA Desktop', 'EA Desktop', 'EADesktop.exe'), path.join(programFiles, 'Electronic Arts', 'EA Desktop', 'EA Desktop', 'EA Desktop.exe')],
    ubisoft: [path.join(programFilesX86, 'Ubisoft', 'Ubisoft Game Launcher', 'UbisoftConnect.exe'), path.join(programFiles, 'Ubisoft', 'Ubisoft Game Launcher', 'UbisoftConnect.exe')],
    battlenet: [path.join(programFilesX86, 'Battle.net', 'Battle.net Launcher.exe'), path.join(programFilesX86, 'Battle.net', 'Battle.net.exe')],
  }[platform] || [];
}

function safeManualClientPath(manualPaths, platform) {
  const candidate = manualPaths && typeof manualPaths[platform] === 'string' ? manualPaths[platform] : '';
  return candidate && candidate.toLowerCase().endsWith('.exe') ? candidate : '';
}

// Launchers inspection combines the existing process check with a local
// installation check. Manual paths originate only from the user's file picker.
remainingIpcServices["launcher:inspectSocialClients"] = async (_event, manualPaths = {}) => {
  const { existsSync } = require('fs');
  const running = await detectRunningLaunchers();
  const clients = {};
  for (const platform of SOCIAL_PLATFORM_IDS) {
    const manualPath = safeManualClientPath(manualPaths, platform);
    const executable = manualPath && existsSync(manualPath) ? manualPath : socialClientCandidates(platform).find(existsSync) || '';
    clients[platform] = { running: !!running[platform], installed: !!executable, path: executable, pathSource: executable && executable === manualPath ? 'manual' : executable ? 'standard' : '', savedPathMissing: !!manualPath && !existsSync(manualPath) };
  }
  return clients;
};

remainingIpcServices["launcher:pickSocialClient"] = async (_event, platform) => {
  if (!SOCIAL_PLATFORM_IDS.has(platform)) return null;
  const label = { steam: 'Steam', epic: 'Epic Games Launcher', ea: 'EA app', ubisoft: 'Ubisoft Connect', battlenet: 'Battle.net' }[platform];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: `Locate ${label}`,
    properties: ['openFile'],
    filters: [{ name: 'Application', extensions: ['exe'] }],
  });
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
};

// Launchers — opens only the platform's normal client surface.
// It never reads client tokens, cookies, memory, friend lists, or chat history.
remainingIpcServices["launcher:openSocial"] = async (_event, platform, manualPath) => {
  if (!SOCIAL_PLATFORM_IDS.has(platform)) return { ok: false, error: 'Unsupported platform.' };
  if (process.platform !== 'win32') return { ok: false, error: 'Launchers currently supports Windows clients only.' };
  const { shell } = require('electron');
  const { existsSync } = require('fs');
  if (platform === 'steam') {
    try { await shell.openExternal('steam://open/main'); return { ok: true }; }
    catch { return { ok: false, error: 'Steam could not be opened.' }; }
  }
  const selectedPath = typeof manualPath === 'string' && manualPath.toLowerCase().endsWith('.exe') ? manualPath : '';
  const executable = selectedPath && existsSync(selectedPath) ? selectedPath : socialClientCandidates(platform).find(existsSync);
  if (!executable) return { ok: false, error: 'Client not found. Use Locate to choose its executable once.' };
  const openError = await shell.openPath(executable);
  return openError ? { ok: false, error: openError } : { ok: true };
};

// Steam owns Steam Input. This narrow route opens its controller-first surface
// only after the renderer has confirmed Steam is already running; it is not a
// generic game-protocol escape hatch.
remainingIpcServices["launcher:openSteamController"] = async () => {
  if (process.platform !== 'win32') return { ok: false, error: 'Steam controller settings are available on Windows only.' };
  const running = await detectRunningLaunchers();
  if (!running.steam) return { ok: false, error: 'Start Steam first, then open its controller menu from here.' };
  try { await shell.openExternal('steam://open/bigpicture'); return { ok: true }; }
  catch { return { ok: false, error: 'Steam controller menu could not be opened.' }; }
};

// Update queues are separate from game launching. Keep this bridge fixed and
// platform-scoped so a renderer cannot turn a pending-update card into a
// generic game-protocol launcher.
remainingIpcServices["launcher:openDownloads"] = async (_event, platform) => {
  const platformKey = String(platform || '').trim().toLowerCase();
  if (platformKey !== 'steam') return { ok: false, error: 'This launcher does not expose a safe downloads queue yet.' };
  if (process.platform !== 'win32') return { ok: false, error: 'Launcher downloads are currently available on Windows only.' };
  try {
    const { shell } = require('electron');
    // `steam://downloads/` is not a documented Steam handoff and may simply
    // be ignored by a running client. The `open` route opens the Downloads
    // page without starting a game or changing queue state.
    await shell.openExternal('steam://open/downloads');
    recordLaunchSafety('launcher-downloads-open', { platform: 'steam' });
    return { ok: true };
  } catch {
    return { ok: false, error: 'Steam could not open its Downloads page.' };
  }
};

const dealsProvider = createDealsProviderService({ httpGetJson, httpGetText, now: Date.now });
remainingIpcServices["deals:fetch"] = () => dealsProvider.fetch();

// ---------------- Recent Game Releases ---------------- //
// This is intentionally a selective discovery feed, not an exhaustive calendar.
// Official publisher announcements prevent Steam's volume from crowding out major
// EA, Ubisoft, Battle.net, Xbox, Epic, Riot, Rockstar, GOG or itch.io launches.
// Steam titles still require verified store dates and meaningful player/review momentum.
const weeklyReleaseProvider = createWeeklyReleaseProviderService({
  httpGetJson,
  searchDuckDuckGo: ddgSearchRaw,
  searchGoogle: googleScrapeRaw,
  now: Date.now,
});
remainingIpcServices["releases:weekly"] = (_event, { force = false } = {}) => weeklyReleaseProvider.fetch({ force });

// ---------------- Steam News (per-appid, cached 30 min) ---------------- //
// Renderer sends [{ appid, name }]. We fetch each app's latest news, keep
// items posted in the last N days (default 14), and return a flat feed
// sorted newest-first. Each item includes feedname/feed_type/feedlabel so
// the UI can group / filter by source (official vs community vs 3rd party).
//
// v1.6.5 — GetNewsForApp has no working language filter (Valve confirmed the
// `l=` param is ignored). Publishers routinely post the SAME announcement as
// several separate feed items, one per language. We drop any item whose
// title/snippet is dominated by a non-Latin script so the News panel stays
// English-only without needing a translation service.
function isLikelyEnglishNews(title, snippet) {
  return newsNormalization.isLikelyEnglish(title, snippet);
}

const steamNewsProvider = createSteamNewsProviderService({ httpGetJson, isLikelyEnglish: isLikelyEnglishNews, now: Date.now });
remainingIpcServices["news:fetchSteam"] = async (_e, { games = [], days = 14, force = false } = {}) => {
  return steamNewsProvider.fetch({ games, days, force });
};

// ---------------- Steam Manifest (local disk) ---------------- //
// Reads the appmanifest_<appid>.acf on disk for a single Steam appid, returns
// buildid + LastUpdated + SizeOnDisk. Used by GameDetail to display
// "Updated N days ago · Build 12345". Cached in-process for 5 min per appid.
const STEAM_MANIFEST_CACHE = new Map(); // appid -> { ts, data }
remainingIpcServices["steam:manifest"] = async (_e, appid) => {
  if (!appid) return { ok: false, error: 'no appid' };
  const key = String(appid);
  const FIVE_MIN = 5 * 60 * 1000;
  const cached = STEAM_MANIFEST_CACHE.get(key);
  if (cached && Date.now() - cached.ts < FIVE_MIN) return { ok: true, ...cached.data, cached: true };

  const steamPath = defaultSteamPath();
  if (!steamPath) return { ok: false, error: 'Steam install not found.' };
  const libraries = readSteamLibraryFolders(steamPath);
  for (const lib of libraries) {
    const file = path.join(lib, 'steamapps', `appmanifest_${key}.acf`);
    try {
      if (!fs.existsSync(file)) continue;
      const text = fs.readFileSync(file, 'utf8');
      const m = parseAcfManifest(text);
      const data = {
        appid: m.appid,
        name: m.name,
        buildid: m.buildid || '',
        lastUpdated: m.lastUpdated ? Number(m.lastUpdated) * 1000 : 0,
        sizeOnDisk: m.sizeOnDisk ? Number(m.sizeOnDisk) : 0,
        stateFlags: m.stateFlags ? Number(m.stateFlags) : 0,
        bytesToDownload: m.bytesToDownload ? Number(m.bytesToDownload) : 0,
        bytesDownloaded: m.bytesDownloaded ? Number(m.bytesDownloaded) : 0,
        updateResult: m.updateResult || '',
        library: lib,
      };
      STEAM_MANIFEST_CACHE.set(key, { ts: Date.now(), data });
      return { ok: true, ...data, cached: false };
    } catch { /* try next lib */ }
  }
  return { ok: false, error: 'Manifest not found (game not installed locally?).' };
};

const installedVersionEvidence = createInstalledVersionEvidenceService({
  fs, path, execFile, platform: process.platform, processEnv: process.env,
  now: Date.now, appStartedAt,
});
const updateSourceDiscovery = createUpdateSourceDiscoveryService({ search: ddgSearch, battleNetProducts: BATTLENET_PRODUCTS, now: Date.now });
const updatePageVersions = createUpdatePageVersionService({ confidenceFor: kind => updateSourceDiscovery.confidenceFor(kind) });
const independentUpdateAssessment = createIndependentUpdateAssessmentService({
  fetchText: httpGetText, stripHtml,
  discoverSources: game => updateSourceDiscovery.discover(game),
  deriveInstalledVersion: game => installedVersionEvidence.derive(game),
  pageVersions: updatePageVersions, now: Date.now,
});

// Read-only update intelligence. NEO-LIB only reports an update as pending
// when the launcher's own manifest exposes concrete undownloaded bytes. Raw
// state flags are returned for diagnostics but never guessed into a warning.
// App and Home can request their warm-up at nearly the same time; coalesce
// those calls so the library is never inspected twice in parallel.
async function scanGameUpdates(games = []) {
  const updateScanStartedAt = Date.now();
  recordLaunchSafety('update-scan-started', { gameCount: Array.isArray(games) ? games.length : 0, sinceStartMs: updateScanStartedAt - appStartedAt });
  const items = [];
  const needsSetup = [];
  const ledger = [];
  // A launcher-owned install and a separately discovered public update page are
  // two different sources of truth.  Never let a weak EXE/version-page match
  // overwrite the launcher's answer for a game the user actually owns there.
  // Repack/standalone games deliberately have no `launcher` identity, even if
  // their metadata happened to come from Steam, so they still use the
  // independent comparison path below.
  const launcherVerifiedIds = new Set();
  const launcherManaged = new Set(['steam', 'epic', 'gog', 'ea', 'ubisoft', 'battlenet', 'riot', 'xbox', 'microsoft', 'rockstar', 'itch']);
  const launcherLabels = {
    steam: 'Steam', epic: 'Epic Games Launcher', gog: 'GOG Galaxy', ea: 'EA app',
    ubisoft: 'Ubisoft Connect', battlenet: 'Battle.net', riot: 'Riot Client',
    xbox: 'Xbox app', microsoft: 'Microsoft Store', rockstar: 'Rockstar Games Launcher', itch: 'itch.io',
  };
  let checked = 0;
  const steamPath = defaultSteamPath();
  const libraries = steamPath ? readSteamLibraryFolders(steamPath) : [];
  for (const game of (games || []).slice(0, 1000)) {
    // An appid alone is not ownership: standalone/repack copies can have Steam
    // metadata or sit beside a Steam installation.  Only a Steam-imported game
    // with no explicit ownership rejection may use Steam's manifest result.
    if (String(game?.launcher || '').toLowerCase() !== 'steam' || game?.steamOwned === false || !game?.appid || !libraries.length) continue;
    const appid = String(game.appid);
    let manifest = null;
    for (const lib of libraries) {
      const file = path.join(lib, 'steamapps', `appmanifest_${appid}.acf`);
      try {
        if (!fs.existsSync(file)) continue;
        manifest = parseAcfManifest(fs.readFileSync(file, 'utf8'));
        break;
      } catch { /* try the next library */ }
    }
    if (!manifest) continue;
    launcherVerifiedIds.add(String(game.id));
    checked += 1;
    const total = Number(manifest.bytesToDownload || 0);
    const downloaded = Number(manifest.bytesDownloaded || 0);
    const remainingBytes = total > downloaded ? total - downloaded : 0;
    const stateFlags = Number(manifest.stateFlags || 0);
    // Steam may preserve non-zero BytesToDownload/BytesDownloaded values in a
    // completed manifest. Only its explicit update/download states make those
    // byte counters current pending-update evidence. This prevents an already
    // updated game from remaining on Home's update card forever.
    const steamUpdateStateMask = 2 | 256 | 512 | 1024 | 1048576 | 2097152 | 4194304;
    const updateActive = (stateFlags & steamUpdateStateMask) !== 0;
    if (remainingBytes <= 0 || !updateActive) {
      ledger.push({ id: game.id, status: 'current', source: 'Steam manifest', checkedAt: Date.now(), currentVersion: manifest.buildid || '' });
      continue;
    }
    const pendingItem = {
      id: game.id,
      name: game.name || manifest.name,
      platform: 'Steam',
      appid,
      buildId: manifest.buildid || '',
      remainingBytes,
      totalBytes: total,
      stateFlags,
      status: downloaded > 0 ? 'downloading' : 'pending',
      actionUrl: `steam://downloads/`,
    };
    items.push(pendingItem);
    ledger.push({ id: game.id, status: pendingItem.status, source: 'Steam manifest', checkedAt: Date.now(), currentVersion: manifest.buildid || '' });
  }
  // Independent games are checked in a small parallel queue. This lets the
  // startup scan cover a real library without opening a burst of requests or
  // serially holding it up behind one slow forum page.
  const independentCandidates = (games || []).slice(0, 500);
  const scanIndependent = async (game) => {
    if (items.some((entry) => entry.id === game.id)) return;
    if (launcherVerifiedIds.has(String(game.id))) return;
    const launcherKey = String(game?.launcher || '').trim().toLowerCase();
    if (launcherManaged.has(launcherKey)) {
      // We have not yet implemented a trustworthy local pending-download
      // adapter for every launcher.  That is a limitation, not evidence of an
      // update.  Record it for diagnostics but never show a false warning.
      ledger.push({
        id: game.id,
        status: 'launcher-managed',
        source: `${launcherLabels[launcherKey] || game.launcher} installed-game state`,
        checkedAt: Date.now(),
        currentVersion: String(game.installedVersion || ''),
        missing: 'a launcher pending-update adapter',
      });
      return;
    }
    const assessment = await independentUpdateAssessment.assess(game);
    if (assessment.checked) checked += 1;
    if (assessment.item) items.push(assessment.item);
    if (assessment.need) needsSetup.push(assessment.need);
    if (assessment.ledger) ledger.push(assessment.ledger);
  };
  for (let start = 0; start < independentCandidates.length; start += 4) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(independentCandidates.slice(start, start + 4).map(scanIndependent));
  }
  const launcherManagedCount = ledger.filter((entry) => entry.status === 'launcher-managed').length;
  recordLaunchSafety('update-scan-completed', { checked, updateCount: items.length, launcherManagedCount, durationMs: Date.now() - updateScanStartedAt });
  return { ok: true, checked, launcherManagedCount, items, needsSetup: needsSetup.slice(0, 20), ledger, scannedAt: Date.now(), confidence: 'launcher-manifest-and-local-version' };
}

const updateScanCoordinator = createUpdateScanCoordinatorService({ scan: scanGameUpdates, now: Date.now });
remainingIpcServices["updates:scan"] = (_event, request = {}) => updateScanCoordinator.run(request);

remainingIpcServices["updates:history"] = async (_e, { url, currentVersion = '' } = {}) => {
  return updateHistoryProvider.fetch({ url, currentVersion });
};

// ---------------- itch.io devlog RSS ---------------- //
// For each itch.io game (source === 'itch' OR website contains .itch.io),
// fetch <base>/devlog.rss and extract items published in the last N days.
function stripHtml(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchItchDevlog(game, cutoffMs) {
  return ownedNewsProvider.fetchItch(game, cutoffMs);
}

// ---------------- GOG changelog (public product JSON) ---------------- //
// GOG exposes each product's changelog as an HTML blob via api.gog.com. The
// blob typically contains `<h4>YYYY-MM-DD</h4><p>notes</p>` sections; we parse
// per-date sections and treat each as a news item.
async function fetchGogChangelog(game, cutoffMs) {
  return ownedNewsProvider.fetchGog(game, cutoffMs);
}

const updateHistoryProvider = createUpdateHistoryProviderService({ httpGetText, stripHtml, now: Date.now });

const ownedNewsProvider = createOwnedNewsProviderService({ httpGetText, httpGetJson, stripHtml });

// ---------------- Public web news fallback ---------------- //
// Steam, GOG and itch expose useful public feeds. Most other launchers do
// not offer a comparable unauthenticated per-owned-game news API, so treat the
// game itself as the source of truth: search for its public official news
// first, then expose a clearly-labelled search result only when no owned-feed
// item was found. This never signs into a launcher, reads account data, or
// treats a search hit as proof of an update.
let webNewsCursor = 0;
const WEB_NEWS_CACHE_MS = 6 * 60 * 60 * 1000;
const WEB_NEWS_MAX_FRESH_PER_PASS = 14;
const publicNewsProvider = createPublicNewsProviderService({ searchDuckDuckGo: ddgSearchRaw, searchGoogle: googleScrapeRaw, normalization: newsNormalization, now: Date.now, cacheMs: WEB_NEWS_CACHE_MS });

function publicSearchUrl(value = '') {
  return newsNormalization.publicUrl(value);
}

async function fetchPublicWebNews(game, cutoffMs, force = false) {
  return publicNewsProvider.fetch(game, cutoffMs, force);
}

// ---------------- Unified news fetch ---------------- //
// Wraps owned feeds first, then carefully bounded public-web discovery for
// every remaining named library game. Cached 30 min by input signature.
let NEWS_ALL_CACHE = { ts: 0, keyHash: '', payload: null };
remainingIpcServices["news:fetchAll"] = async (_e, { games = [], days = 14, force = false } = {}) => {
  const arr = Array.isArray(games) ? games : [];
  const steamList = arr.filter((g) => g && g.appid);
  const itchList  = arr.filter((g) => g && /itch\.io/.test(g.website || '') || (g && g.source === 'itch'));
  const gogList   = arr.filter((g) => g && g.gogId);

  const keyHash = JSON.stringify({
    s: steamList.map((g) => g.appid).sort(),
    i: itchList.map((g) => g.website).sort(),
    g: gogList.map((g) => g.gogId).sort(),
    w: arr.map((g) => [g.id, g.name, g.website, g.launcher, g.source].join('~')).sort(),
    days,
  });
  const THIRTY_MIN = 30 * 60 * 1000;
  if (!force && NEWS_ALL_CACHE.keyHash === keyHash && Date.now() - NEWS_ALL_CACHE.ts < THIRTY_MIN) {
    return { ok: true, ...NEWS_ALL_CACHE.payload, fetchedAt: NEWS_ALL_CACHE.ts, cached: true };
  }
  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;

  const counts = { steam: 0, itch: 0, gog: 0, officialWeb: 0, web: 0 };
  const out = [];

  // --- Steam (parallel batched) ---
  const batchSize = 8;
  const cutoffSec = Math.floor(cutoffMs / 1000);
  for (let i = 0; i < steamList.length; i += batchSize) {
    const slice = steamList.slice(i, i + batchSize);
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(slice.map(async (g) => {
      const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${g.appid}&count=15&maxlength=400&format=json`;
      try {
        const data = await httpGetJson(url, 8000);
        const items = data?.appnews?.newsitems || [];
        for (const it of items) {
          if (typeof it.date !== 'number' || it.date < cutoffSec) continue;
          const raw = String(it.contents || '');
          const snippet = raw
            .replace(/\[img][\s\S]*?\[\/img]/gi, '')
            .replace(/\[url=[^\]]*]([\s\S]*?)\[\/url]/gi, '$1')
            .replace(/\[\/?[a-z0-9=*\s"'.:/#-]+]/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 320);
          if (!isLikelyEnglishNews(it.title, snippet)) continue;
          out.push({
            id: `steam-${g.appid}-${it.gid}`,
            platform: 'steam',
            gameId: g.id || null,
            appid: String(g.appid),
            gameName: g.name || '',
            title: it.title || '(untitled)',
            url: it.url,
            author: it.author || '',
            date: it.date * 1000,
            feedname: it.feedname || '',
            feedlabel: it.feedlabel || '',
            feed_type: typeof it.feed_type === 'number' ? it.feed_type : null,
            snippet,
          });
          counts.steam += 1;
        }
      } catch { /* per-game failure fine */ }
    }));
  }

  // --- itch (parallel) ---
  await Promise.all(itchList.map(async (g) => {
    const items = await fetchItchDevlog(g, cutoffMs);
    for (const it of items) { out.push(it); counts.itch += 1; }
  }));

  // --- GOG (parallel) ---
  await Promise.all(gogList.map(async (g) => {
    const items = await fetchGogChangelog(g, cutoffMs);
    for (const it of items) { out.push(it); counts.gog += 1; }
  }));

  // Every game can now be considered for news. A game with a fresh owned
  // feed item needs no search fallback. For the rest, favour entries owned by
  // non-Steam launchers and saved official sites, then rotate through the
  // wider library on later polls. This prevents a 200-game library from
  // hammering search engines while still giving Epic, EA, Ubisoft, Battle.net,
  // Riot, Xbox, Rockstar, local, F95-style and other entries a regular turn.
  const gamesWithFreshOwnedFeed = new Set(out.map((item) => String(item.gameId || '')));
  const fallbackCandidates = arr.filter((game) => game && String(game.name || '').trim() && !gamesWithFreshOwnedFeed.has(String(game.id || '')))
    .sort((left, right) => {
      const leftPriority = (left.launcher && String(left.launcher).toLowerCase() !== 'steam' ? 2 : 0) + (left.website ? 1 : 0);
      const rightPriority = (right.launcher && String(right.launcher).toLowerCase() !== 'steam' ? 2 : 0) + (right.website ? 1 : 0);
      return rightPriority - leftPriority || String(left.name).localeCompare(String(right.name));
    });
  const cachedFallbacks = [];
  const freshFallbacks = [];
  for (const game of fallbackCandidates) {
    const cacheState = publicNewsProvider.inspectCache(game, cutoffMs);
    if (!force && cacheState.fresh) cachedFallbacks.push(game);
    else freshFallbacks.push(game);
  }
  const rotatingFresh = freshFallbacks.length
    ? [...freshFallbacks.slice(webNewsCursor % freshFallbacks.length), ...freshFallbacks.slice(0, webNewsCursor % freshFallbacks.length)].slice(0, WEB_NEWS_MAX_FRESH_PER_PASS)
    : [];
  webNewsCursor += rotatingFresh.length;
  const publicNewsGames = [...cachedFallbacks, ...rotatingFresh];
  await Promise.all(publicNewsGames.map(async (game) => {
    const items = await fetchPublicWebNews(game, cutoffMs, force);
    for (const item of items) {
      out.push(item);
      if (item.platform === 'official-web') counts.officialWeb += 1;
      else counts.web += 1;
    }
  }));

  out.sort((a, b) => b.date - a.date);
  const payload = {
    items: out,
    counts,
    sources: {
      steam: steamList.length,
      itch: itchList.length,
      gog: gogList.length,
      publicWeb: publicNewsGames.length,
    },
  };
  NEWS_ALL_CACHE = { ts: Date.now(), keyHash, payload };
  return { ok: true, ...payload, fetchedAt: Date.now(), cached: false };
};


// ---------------- Latest news for one game ---------------- //
// Compact IPC used by GameDetail's "Latest news" blinking pill.
// Returns AT MOST one item (the newest across all sources for that game),
// scoped to the last 30 days. Per-game 15-minute cache.
const LATEST_NEWS_CACHE = new Map(); // gameKey -> { ts, item }
remainingIpcServices["news:latestForGame"] = async (_e, game) => {
  if (!game) return { ok: true, item: null };
  const key = String(game.id || game.appid || game.website || '');
  const FIFTEEN_MIN = 15 * 60 * 1000;
  const cached = LATEST_NEWS_CACHE.get(key);
  if (cached && Date.now() - cached.ts < FIFTEEN_MIN) return { ok: true, item: cached.item, cached: true };

  const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const results = [];

  // Steam
  if (game.appid) {
    try {
      const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${game.appid}&count=3&maxlength=300&format=json`;
      const data = await httpGetJson(url, 6000);
      const items = data?.appnews?.newsitems || [];
      const cutoffSec = Math.floor(cutoffMs / 1000);
      for (const it of items) {
        if (typeof it.date !== 'number' || it.date < cutoffSec) continue;
        const snippet = String(it.contents || '')
          .replace(/\[img][\s\S]*?\[\/img]/gi, '')
          .replace(/\[url=[^\]]*]([\s\S]*?)\[\/url]/gi, '$1')
          .replace(/\[\/?[a-z0-9=*\s"'.:/#-]+]/gi, '')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 280);
        if (!isLikelyEnglishNews(it.title, snippet)) continue;
        results.push({
          platform: 'steam',
          title: it.title,
          url: it.url,
          date: it.date * 1000,
          snippet,
        });
      }
    } catch { /* ignore */ }
  }

  // itch
  if ((/itch\.io/.test(game.website || '') || game.source === 'itch') && game.website) {
    try {
      const items = await fetchItchDevlog(game, cutoffMs);
      for (const it of items.slice(0, 3)) {
        results.push({ platform: 'itch', title: it.title, url: it.url, date: it.date, snippet: it.snippet });
      }
    } catch { /* ignore */ }
  }

  // GOG
  if (game.gogId) {
    try {
      const items = await fetchGogChangelog(game, cutoffMs);
      for (const it of items.slice(0, 3)) {
        results.push({ platform: 'gog', title: it.title, url: it.url, date: it.date, snippet: it.snippet });
      }
    } catch { /* ignore */ }
  }

  // EA, Epic, Ubisoft, Battle.net, Riot, Xbox, Rockstar, local and F95-style
  // games often have no public launcher feed. If the owned feeds above were
  // quiet, show the newest well-matched official-site/search discovery instead
  // of making Preview act as if only Steam games can have news.
  if (!results.length && String(game.name || '').trim()) {
    try {
      const items = await fetchPublicWebNews(game, cutoffMs);
      for (const entry of items) {
        results.push({ platform: entry.platform, title: entry.title, url: entry.url, date: entry.date, snippet: entry.snippet, sourceKind: entry.sourceKind });
      }
    } catch { /* best-effort discovery never blocks Preview */ }
  }

  results.sort((a, b) => b.date - a.date);
  const item = results[0] || null;
  LATEST_NEWS_CACHE.set(key, { ts: Date.now(), item });
  return { ok: true, item, cached: false };
};


// ---------------- Steam Playtime Import (localconfig.vdf) ---------------- //
// v1.6.0 — Now scopes to the CURRENTLY SIGNED-IN Steam account only (read
// from config/loginusers.vdf → MostRecent="1", fallback to latest Timestamp).
//
// v1.6.1 — Bug fixes:
//   • localconfig.vdf parsing now uses brace-matched extraction (previous
//     non-greedy regex broke on nested cloud/autocloud blocks and missed
//     most games).
//   • Reads `libraryfolders.vdf` to enumerate every Steam library folder
//     (multi-drive installs) and scans appmanifest_*.acf in each. Icarus &
//     other games installed on secondary drives were previously missed.
//   • Returns `debug` info listing every path we checked for troubleshooting.
//
// 100% offline. No Steam Web API. Cached 5 min per session.
let STEAM_PLAYTIME_CACHE = { ts: 0, data: null };

// Extract every top-level "<digits>" { … } block from a VDF string using
// brace-matched parsing. Handles nested braces correctly.
function extractAppBlocks(vdfText) {
  if (!vdfText) return [];
  const appsIdx = vdfText.search(/"apps"\s*\{/i);
  if (appsIdx < 0) return [];
  // Slice to the apps object body
  let depth = 0, start = -1, apps = '';
  for (let i = appsIdx; i < vdfText.length; i += 1) {
    const ch = vdfText[i];
    if (ch === '{') { if (start < 0) start = i; depth += 1; }
    else if (ch === '}') { depth -= 1; if (depth === 0) { apps = vdfText.slice(start + 1, i); break; } }
  }
  if (!apps) return [];
  // Walk apps body, find each "<digits>" { … } block with matched braces
  const results = [];
  let pos = 0;
  while (pos < apps.length) {
    const rest = apps.slice(pos);
    const m = rest.match(/"(\d+)"\s*\{/);
    if (!m) break;
    const openStart = pos + m.index + m[0].length; // just after the {
    const appid = m[1];
    let d = 1, i = openStart;
    while (i < apps.length && d > 0) {
      const ch = apps[i];
      if (ch === '{') d += 1;
      else if (ch === '}') d -= 1;
      i += 1;
    }
    if (d !== 0) break;
    const body = apps.slice(openStart, i - 1);
    results.push({ appid, body });
    pos = i;
  }
  return results;
}

remainingIpcServices["steam:importPlaytime"] = async (_e, { force = false } = {}) => {
  const FIVE_MIN = 5 * 60 * 1000;
  if (!force && STEAM_PLAYTIME_CACHE.data && Date.now() - STEAM_PLAYTIME_CACHE.ts < FIVE_MIN) {
    return { ok: true, ...STEAM_PLAYTIME_CACHE.data, cached: true };
  }
  const debug = { steamPath: null, loginPath: null, sharedCfg: null, localCfg: null, libraryFolders: [], manifests: 0, accountUsed: null };
  const steamPath = defaultSteamPath();
  if (!steamPath) return { ok: false, error: 'Steam install not found.', debug };
  debug.steamPath = steamPath;
  const userdata = path.join(steamPath, 'userdata');
  if (!fs.existsSync(userdata)) return { ok: false, error: 'No userdata folder found.', debug };

  // --- 1) Find currently-signed-in Steam account. ---
  const loginUsersPath = path.join(steamPath, 'config', 'loginusers.vdf');
  debug.loginPath = loginUsersPath;
  let currentSteamId3 = null;
  let currentPersonaName = null;
  try {
    if (fs.existsSync(loginUsersPath)) {
      const raw = fs.readFileSync(loginUsersPath, 'utf8');
      const userRe = /"(\d{17})"\s*\{([\s\S]*?)\}/g;
      let best = null;
      let um;
      while ((um = userRe.exec(raw)) !== null) {
        const steamid64 = um[1];
        const body = um[2];
        const mostRecent = /"MostRecent"\s*"1"/i.test(body);
        const tsMatch = body.match(/"Timestamp"\s*"(\d+)"/i);
        const persona = body.match(/"PersonaName"\s*"([^"]+)"/i);
        const entry = {
          steamid64,
          personaName: persona ? persona[1] : null,
          mostRecent,
          timestamp: tsMatch ? Number(tsMatch[1]) : 0,
        };
        if (mostRecent) { best = entry; break; }
        if (!best || entry.timestamp > best.timestamp) best = entry;
      }
      if (best) {
        currentSteamId3 = String(BigInt(best.steamid64) - 76561197960265728n);
        currentPersonaName = best.personaName;
      }
    }
  } catch { /* fall through */ }

  const userDirs = fs.readdirSync(userdata, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d+$/.test(d.name));
  if (!currentSteamId3 && userDirs.length > 0) currentSteamId3 = userDirs[0].name;
  if (!currentSteamId3) return { ok: false, error: 'No Steam account detected.', debug };
  debug.accountUsed = currentSteamId3;

  const acctDir = path.join(userdata, currentSteamId3);
  if (!fs.existsSync(acctDir)) return { ok: false, error: `Steam account folder missing: ${currentSteamId3}`, debug };

  // --- 2) Read sharedconfig.vdf → ownership signal. ---
  const ownedAppids = new Set();
  const sharedCfg = path.join(acctDir, '7', 'remote', 'sharedconfig.vdf');
  debug.sharedCfg = sharedCfg;
  try {
    if (fs.existsSync(sharedCfg)) {
      const raw = fs.readFileSync(sharedCfg, 'utf8');
      for (const blk of extractAppBlocks(raw)) ownedAppids.add(blk.appid);
    }
  } catch { /* ignore */ }
  const ownedFromSharedConfig = ownedAppids.size;

  // --- 3) Read localconfig.vdf → playtime for current account. ---
  // v1.6.3 — CRITICAL FIX: DO NOT treat every appid in localconfig.vdf as
  // "owned". Steam writes localconfig entries for free trials, playtests,
  // launcher-shortcut games, and appids Steam auto-migrated between users.
  // The only reliable ownership signals are sharedconfig.vdf and installed
  // appmanifest_*.acf. Previously, non-Steam games (Hellclock/Solarpunk)
  // happened to have appids that collided with unrelated localconfig entries
  // carrying 500+ hours — the merge then bulldozed local playtime because
  // ownership check said "yes".
  const merged = {};
  const cfg = path.join(acctDir, 'config', 'localconfig.vdf');
  debug.localCfg = cfg;
  let ownedFromLocalConfig = 0; // kept for debug parity; no longer adds to ownedAppids
  if (fs.existsSync(cfg)) {
    let text = '';
    try { text = fs.readFileSync(cfg, 'utf8'); } catch { /* ignore */ }
    for (const { appid, body } of extractAppBlocks(text)) {
      const pMatch = body.match(/"Playtime"\s*"(\d+)"/i);
      const lpMatch = body.match(/"LastPlayed"\s*"(\d+)"/i);
      const playtime = pMatch ? Number(pMatch[1]) : 0;
      const lastPlayed = lpMatch ? Number(lpMatch[1]) * 1000 : 0;
      // Only remember playtime if there's a real signal (playtime > 0 OR
      // lastPlayed set). Empty/dormant entries just pollute the merge map.
      if (playtime > 0 || lastPlayed > 0) {
        merged[appid] = { playtime, lastPlayed };
      }
      if (!ownedAppids.has(appid)) ownedFromLocalConfig += 1;
      // NOTE: intentionally do NOT `ownedAppids.add(appid)` here anymore.
    }
  }

  // --- 4) Walk libraryfolders.vdf → every Steam library folder → appmanifest_*.acf ---
  let ownedFromManifests = 0;
  const libraryFolders = [];
  const libFoldersVdf = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
  try {
    if (fs.existsSync(libFoldersVdf)) {
      const raw = fs.readFileSync(libFoldersVdf, 'utf8');
      const pathRe = /"path"\s*"([^"]+)"/gi;
      let pm;
      while ((pm = pathRe.exec(raw)) !== null) {
        // Steam writes paths with escaped backslashes in the VDF
        libraryFolders.push(pm[1].replace(/\\\\/g, '\\'));
      }
    }
  } catch { /* ignore */ }
  // Always include the main install even if not enumerated
  if (!libraryFolders.includes(steamPath)) libraryFolders.unshift(steamPath);
  debug.libraryFolders = libraryFolders;
  for (const lib of libraryFolders) {
    try {
      const sa = path.join(lib, 'steamapps');
      if (!fs.existsSync(sa)) continue;
      const files = fs.readdirSync(sa).filter((n) => /^appmanifest_\d+\.acf$/i.test(n));
      for (const f of files) {
        const m = f.match(/^appmanifest_(\d+)\.acf$/i);
        if (m) {
          if (!ownedAppids.has(m[1])) ownedFromManifests += 1;
          ownedAppids.add(m[1]);
        }
      }
    } catch { /* ignore this library */ }
  }
  debug.manifests = ownedFromManifests;

  // v1.6.4 — Snapshot today's lifetime playtime per appid so Stats can compute
  // "played in the last N days". One entry per appid per day; multiple imports
  // in the same day overwrite the entry for that day. Kept for 400 days.
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dayKey = localDayKey(today); // Local calendar day, not UTC.
    const history = await documents.loadPlaytimeHistory();
    if (!history.byAppid) history.byAppid = {};
    for (const [appid, rec] of Object.entries(merged)) {
      if (!history.byAppid[appid]) history.byAppid[appid] = {};
      history.byAppid[appid][dayKey] = Number(rec.playtime) || 0;
      // Prune per-appid entries older than 400 days
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 400);
      const cutoffKey = localDayKey(cutoff);
      for (const k of Object.keys(history.byAppid[appid])) {
        if (k < cutoffKey) delete history.byAppid[appid][k];
      }
    }
    history.lastSnapshotAt = Date.now();
    await documents.savePlaytimeHistory(history);
  } catch { /* ignore snapshot errors */ }

  const payload = {
    data: merged,
    ownedAppids: Array.from(ownedAppids),
    currentAccount: { steamid3: currentSteamId3, personaName: currentPersonaName },
    count: Object.keys(merged).length,
    ownedCount: ownedAppids.size,
    debug: {
      ...debug,
      sources: {
        sharedConfig: ownedFromSharedConfig,
        localConfig: ownedFromLocalConfig,
        manifests: ownedFromManifests,
      },
    },
  };
  STEAM_PLAYTIME_CACHE = { ts: Date.now(), data: payload };
  return { ok: true, ...payload, cached: false };
};


// v1.6.4 — local per-game deltas for range-aware Stats rankings.
registerPlaytimeIpc({ registerIpc, playtimeHistory });


// Remaining Stage 3 domains register only after every service is defined.
registerDealsIpc({ registerIpc, services: remainingIpcServices });
registerGameIpc({ registerIpc, services: remainingIpcServices });
registerGeminiIpc({ registerIpc, services: remainingIpcServices });
registerGogIpc({ registerIpc, services: remainingIpcServices });
registerLauncherIpc({ registerIpc, services: remainingIpcServices });
registerMetadataIpc({ registerIpc, services: remainingIpcServices });
registerNewsIpc({ registerIpc, services: remainingIpcServices });
registerOptimizeIpc({ registerIpc, services: remainingIpcServices });
registerReleasesIpc({ registerIpc, services: remainingIpcServices });
registerSavesIpc({ registerIpc, services: remainingIpcServices });
registerScanIpc({ registerIpc, services: remainingIpcServices });
registerSteamIpc({ registerIpc, services: remainingIpcServices });
registerStorageIpc({ registerIpc, services: remainingIpcServices });
registerToolsIpc({ registerIpc, services: remainingIpcServices });
registerUpdatesIpc({ registerIpc, services: remainingIpcServices });
registerWebIpc({ registerIpc, services: remainingIpcServices });
registerWidgetsIpc({ registerIpc, widgets: widgetPackages });
