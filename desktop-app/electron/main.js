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
const http = require('http');
const https = require('https');
const os = require('os');

// ---- Optional Discord Rich Presence (native IPC, no third-party deps) ----
// Talks to the local Discord client over a named pipe (Windows) or Unix
// socket (mac/Linux). Pure Node `net` module + Discord's documented binary
// frame format. Fails silently if Discord isn't running.
const net = require('net');

// Public NEO-LIB Discord Application ID. Loaded from electron/discord-config.js
// which the GitHub Actions workflow overwrites at build time using the
// `NEOLIB_DISCORD_APP_ID` repository secret. Empty = RPC disabled silently.
let DISCORD_APP_ID = '';
try {
  // eslint-disable-next-line global-require
  DISCORD_APP_ID = require('./discord-config').DISCORD_APP_ID || '';
} catch { DISCORD_APP_ID = ''; }
// Env var still wins (handy for `set NEOLIB_DISCORD_APP_ID=... && yarn dev`)
if (process.env.NEOLIB_DISCORD_APP_ID) DISCORD_APP_ID = process.env.NEOLIB_DISCORD_APP_ID;

const isDev = process.env.NODE_ENV === 'development';

// Kept in the main process so the renderer receives only a small, read-only
// snapshot. No game processes are inspected or modified.
let previousCpuSample = null;
function cpuSample() {
  return os.cpus().reduce((total, cpu) => {
    const times = cpu.times || {};
    total.idle += times.idle || 0;
    total.total += Object.values(times).reduce((sum, value) => sum + value, 0);
    return total;
  }, { idle: 0, total: 0 });
}

async function readSystemHealth() {
  let previous = previousCpuSample;
  let next = cpuSample();
  // The first sample has no baseline; take a short second sample so the first
  // rendered value is useful rather than briefly reporting 0% CPU.
  if (!previous) {
    previous = next;
    await new Promise((resolve) => setTimeout(resolve, 250));
    next = cpuSample();
  }
  const totalDelta = next.total - previous.total;
  const idleDelta = next.idle - previous.idle;
  const cpuPercent = totalDelta > 0
    ? Math.max(0, Math.min(100, Math.round((1 - (idleDelta / totalDelta)) * 100)))
    : null;
  previousCpuSample = next;

  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = Math.max(0, totalBytes - freeBytes);
  const toGb = (value) => Math.round((value / (1024 ** 3)) * 10) / 10;
  return {
    cpuPercent,
    ramPercent: totalBytes ? Math.round((usedBytes / totalBytes) * 100) : null,
    memoryUsedGb: toGb(usedBytes),
    memoryFreeGb: toGb(freeBytes),
    memoryTotalGb: toGb(totalBytes),
  };
}

// ---------------- Paths ---------------- //
const dataDir = () => app.getPath('userData');
const libraryFile = () => path.join(dataDir(), 'library.json');
const settingsFile = () => path.join(dataDir(), 'settings.json');
const coversDir = () => path.join(dataDir(), 'covers');
const saveBackupsDir = () => path.join(dataDir(), 'save-backups');
const managedToolsDir = () => path.join(dataDir(), 'managed-tools');
// v1.6.4 — Daily playtime snapshots so Stats can compute "played in the last N
// days" (Steam's localconfig only stores lifetime totals, not deltas).
const playtimeHistoryFile = () => path.join(dataDir(), 'playtime-history.json');

async function ensureDirs() {
  await fsp.mkdir(coversDir(), { recursive: true });
  await fsp.mkdir(saveBackupsDir(), { recursive: true });
  await fsp.mkdir(managedToolsDir(), { recursive: true });
}

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

// ---------------- JSON store ---------------- //
async function readJson(filePath, fallback) {
  try {
    const text = await fsp.readFile(filePath, 'utf8');
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}
// Atomic write: stage to .tmp then rename, so a killed process / power loss can't
// corrupt the on-disk JSON (which previously caused settings to silently reset
// — e.g. theme reverting to default on next launch).
async function writeJson(filePath, data) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  const tmp = filePath + '.tmp';
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fsp.rename(tmp, filePath);
}

// ---------------- Window ---------------- //
let mainWindow;
let tray = null;
let isQuitting = false;

// Read the persisted setting synchronously so the close handler knows the
// user's preference even before the renderer wires up.
function shouldMinimizeToTray() {
  try {
    const raw = fs.readFileSync(settingsFile(), 'utf-8');
    const s = JSON.parse(raw);
    return s && s.minimizeToTray === true;
  } catch { return false; }
}

function buildTray() {
  if (tray) return tray;
  try {
    const iconPath = path.join(__dirname, '..', 'build', 'icon.png');
    const img = nativeImage.createFromPath(iconPath);
    const trayImg = img.isEmpty() ? nativeImage.createEmpty() : img.resize({ width: 16, height: 16 });
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
    const raw = fs.readFileSync(settingsFile(), 'utf-8');
    const s = JSON.parse(raw);
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
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html'));
  }

  mainWindow.on('maximize', () => mainWindow.webContents.send('window:maximized', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window:maximized', false));

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
        let s = {};
        try { s = JSON.parse(fs.readFileSync(settingsFile(), 'utf-8')); } catch { s = {}; }
        s.windowBounds = { width: b.width, height: b.height, x: b.x, y: b.y };
        fs.writeFileSync(settingsFile(), JSON.stringify(s, null, 2));
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
  await ensureDirs();
  createWindow();
  // Pre-build the tray icon if the user opted in — they expect it to be
  // available immediately, not only after they close the window for the first time.
  if (shouldMinimizeToTray()) buildTray();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // If the user opted into tray mode, the window may have been hidden — don't
  // quit the process. Otherwise, behave normally (quit on non-macOS).
  if (shouldMinimizeToTray()) return;
  if (process.platform !== 'darwin') app.quit();
});

// IPC for the renderer to toggle tray mode live, without restarting.
ipcMain.handle('app:setMinimizeToTray', async (_e, enabled) => {
  if (enabled) buildTray();
  else destroyTray();
  return enabled;
});

// ---------------- IPC: Window controls ---------------- //
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:toggleMaximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
  return mainWindow.isMaximized();
});
ipcMain.handle('window:close', () => mainWindow?.close());

// ---------------- IPC: Library / Settings ---------------- //
ipcMain.handle('library:load', async () => readJson(libraryFile(), { games: [] }));
ipcMain.handle('library:save', async (_e, data) => {
  await writeJson(libraryFile(), data);
  return true;
});
ipcMain.handle('settings:load', async () =>
  readJson(settingsFile(), { theme: 'synthwave', firstRun: true })
);
ipcMain.handle('settings:save', async (_e, data) => {
  await writeJson(settingsFile(), data);
  return true;
});

// ---------------- IPC: Dialog ---------------- //
ipcMain.handle('dialog:pickExe', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select game executable',
    properties: ['openFile'],
    filters: [{ name: 'Executables', extensions: ['exe', 'lnk', 'bat', 'cmd'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('dialog:pickDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select folder to scan for games',
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// Image picker — used by the "Edit metadata" modal for icon/cover/hero overrides.
// Returns a file:// URL the renderer can drop straight into <img src=…>.
ipcMain.handle('dialog:pickImage', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Pick an image (icon / cover / hero)',
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'ico'] },
    ],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const p = result.filePaths[0];
  return { path: p, url: 'file://' + p.replace(/\\/g, '/') };
});

// Resolve a Windows .lnk shortcut to its underlying target (.exe) so users
// can drag desktop shortcuts onto the app and have them work.
ipcMain.handle('shell:resolveLnk', async (_e, lnkPath) => {
  try {
    const info = shell.readShortcutLink(lnkPath);
    return { ok: true, target: info?.target || null, args: info?.args || '' };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
});

// ---------------- IPC: Exe icon extraction ---------------- //
ipcMain.handle('exe:icon', async (_e, exePath) => {
  try {
    const img = await app.getFileIcon(exePath, { size: 'large' });
    if (img.isEmpty()) return null;
    return img.toDataURL();
  } catch {
    return null;
  }
});

// ---------------- IPC: Launch game ---------------- //
const runningGames = new Map(); // exePath -> { startedAt }

ipcMain.handle('game:launch', async (_e, { exePath, launchArgs, gameId, name } = {}) => {
  if (!exePath || typeof exePath !== 'string') {
    return { ok: false, error: 'No exePath provided' };
  }
  try {
    // Managed system shortcuts (for example Windows Graphics Settings) are
    // explicit URI targets, never guessed from a game path.
    if (/^(?:ms-settings:|shell:)/i.test(exePath)) {
      await shell.openExternal(exePath);
      return { ok: true, target: 'uri' };
    }
    const argv = (launchArgs || '').trim()
      ? (launchArgs || '').trim().split(/\s+/)
      : [];
    if (process.platform === 'win32') {
      const child = spawn(exePath, argv, {
        detached: true,
        stdio: 'ignore',
        cwd: path.dirname(exePath),
      });
      const startedAt = Date.now();
      runningGames.set(gameId || exePath, { startedAt });
      // Discord RPC — set the rich activity for the game we just launched
      setDiscordActivity({ name, startedAt });
      child.on('exit', () => {
        const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        runningGames.delete(gameId || exePath);
        clearDiscordActivity();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('game:exited', { gameId, exePath, seconds });
        }
      });
      child.on('error', () => { runningGames.delete(gameId || exePath); clearDiscordActivity(); });
      child.unref();
      return { ok: true };
    }
    const err = await shell.openPath(exePath);
    return { ok: !err, error: err || undefined };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

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
  try {
    const raw = fs.readFileSync(settingsFile(), 'utf-8');
    const s = JSON.parse(raw);
    return s && s.discordRpcEnabled !== false;
  } catch { return true; }
}

// Live toggle from the renderer
ipcMain.handle('app:setDiscordRpc', async (_e, enabled) => {
  if (!enabled) {
    clearDiscordActivity();
    if (discordSock) {
      try { discordSock.destroy(); } catch { /* ignore */ }
      discordSock = null; discordReady = false;
    }
  }
  return { ok: true, hasAppId: !!DISCORD_APP_ID };
});
ipcMain.handle('app:discordRpcStatus', async () => ({
  hasAppId: !!DISCORD_APP_ID,
  installed: true,
  ready: !!discordReady,
}));

// ---------------- IPC: Drive scanner ---------------- //
const NOISE_KEYWORDS = [
  'unins', 'crashpad', 'crashhandler', 'crashreport', 'redist', 'vcredist',
  'directx', 'dxsetup', 'dxwebsetup', 'install', 'setup', 'updater',
  'patch', 'launcher_install', 'uninstall', 'support', 'easyanticheat',
  'eac_', 'battleye', 'be_service', 'nvidia', 'amd_', 'physx',
  'dotnetfx', 'helper', 'webview2', 'crash', 'reporter',
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

ipcMain.handle('scan:directory', async (_e, root, excludes = [], options = {}) => {
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
});

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

// Pick the best of a list of {name, ...} matches against a query.
function pickBestMatch(query, results, nameKey = 'name') {
  if (!results || results.length === 0) return null;
  const scored = results.map((r) => ({ r, s: fuzzyScore(query, r[nameKey] || '') }));
  scored.sort((a, b) => b.s - a.s);
  // If the top score is too low and there's no clear winner, still return the top
  return scored[0].r;
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

ipcMain.handle('steam:search', async (_e, query) => {
  const term = cleanSearchTerm(query);
  if (!term) return [];
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=en&cc=us`;
  try {
    const data = await httpGetJson(url);
    return (data.items || []).map((it) => ({
      appid: it.id,
      name: it.name,
      tinyImage: it.tiny_image,
      price: it.price ? it.price.final : null,
    }));
  } catch {
    return [];
  }
});

ipcMain.handle('steam:details', async (_e, appid) => {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=en&cc=us`;
  try {
    const data = await httpGetJson(url);
    const entry = data && data[appid];
    if (!entry || !entry.success) return null;
    const d = entry.data;
    const genreTags = await steamGenreEvidence(appid, d);
    return {
      appid,
      name: d.name,
      type: d.type,
      shortDescription: d.short_description,
      aboutTheGame: stripHtml(d.about_the_game || '').slice(0, 1400),
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
  } catch {
    return null;
  }
});

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

// ---------------- IPC: cache image locally ---------------- //
ipcMain.handle('image:cache', async (_e, { url, name }) => {
  if (!url) return null;
  try {
    const safe = (name || 'cover').replace(/[^a-z0-9_-]+/gi, '_').slice(0, 60);
    const ext = (url.match(/\.(jpg|jpeg|png|webp)/i) || ['.jpg'])[0];
    const out = path.join(coversDir(), `${safe}_${Date.now()}${ext}`);
    await httpDownload(url, out);
    return 'file://' + out.replace(/\\/g, '/');
  } catch {
    return null;
  }
});

ipcMain.handle('app:openExternal', async (_e, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('app:revealInFolder', async (_e, p) => {
  shell.showItemInFolder(p);
});

ipcMain.handle('app:openContainingDir', async (_e, p) => {
  if (!p) return;
  const dir = path.dirname(p);
  await shell.openPath(dir);
});

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

ipcMain.handle('tools:detectGpuSetup', async () => {
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
  return {
    ok: true,
    adapters,
    primary: { ...preferred, vendor },
    controlCenter: gpuControlCenterFor(vendor),
    utilities: {
      gpuz: { exePath: installedManagedToolPath('gpuz') },
      cpuz: { exePath: installedManagedToolPath('cpuz') },
    },
  };
});

ipcMain.handle('tools:verifyManagedTool', async (_event, { toolId, exePath } = {}) => {
  if (!['gpuz', 'cpuz'].includes(toolId) || !exePath || !path.isAbsolute(exePath) || !fs.existsSync(exePath)) return { ok: false, error: 'Choose an existing executable file.' };
  const base = path.basename(exePath).toLowerCase();
  const expected = toolId === 'gpuz' ? /gpu[_-]?z.*\.exe$/ : /cpu[_-]?z.*\.exe$/;
  if (!expected.test(base)) return { ok: false, error: `That does not look like the ${toolId === 'gpuz' ? 'GPU-Z' : 'CPU-Z'} executable.` };
  return { ok: true, exePath };
});

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

ipcMain.handle('tools:installManagedTool', async (_event, toolId) => {
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
});

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

ipcMain.handle('launcher:scan-steam', async () => {
  const steamPath = defaultSteamPath();
  if (!steamPath) return { ok: false, error: 'Steam install not found.', items: [] };
  const libraries = readSteamLibraryFolders(steamPath);
  const found = [];
  for (const lib of libraries) {
    const sa = path.join(lib, 'steamapps');
    try {
      const entries = fs.readdirSync(sa);
      for (const e of entries) {
        if (!e.startsWith('appmanifest_') || !e.endsWith('.acf')) continue;
        try {
          const text = fs.readFileSync(path.join(sa, e), 'utf8');
          const m = parseAcfManifest(text);
          if (!m.appid || !m.name) continue;
          // Heuristic: skip Steamworks Common Redistributables / Tools
          if (/^(Steamworks Common|Proton |Steam Linux Runtime|Steam Linux|Steam Audio)/i.test(m.name)) continue;
          const installdir = path.join(sa, 'common', m.installdir);
          // Best-effort: find a primary .exe inside the install dir for launching directly.
          // (We still prefer `steam://run/{appid}` for launching, but we expose the exe so
          //  NEO-LIB can extract an icon + treat it like any other game.)
          let exe = null;
          try {
            const findExe = (dir, depth = 0) => {
              if (depth > 2 || !dir) return null;
              for (const name of fs.readdirSync(dir)) {
                const full = path.join(dir, name);
                let stat;
                try { stat = fs.statSync(full); } catch { continue; }
                if (stat.isFile() && name.toLowerCase().endsWith('.exe')) {
                  const lower = name.toLowerCase();
                  // Skip helper exes
                  if (lower.includes('unins') || lower.includes('crash') || lower.includes('vc_redist')
                      || lower.includes('directx') || lower.includes('redist')) continue;
                  return full;
                }
                if (stat.isDirectory()) {
                  const r = findExe(full, depth + 1);
                  if (r) return r;
                }
              }
              return null;
            };
            exe = findExe(installdir);
          } catch { /* ignore */ }
          found.push({
            appid: m.appid,
            name: m.name,
            exe: exe || installdir,   // fall back to dir; launch will use steam:// URL anyway
            installdir,
            buildid: m.buildid,
            launchUrl: `steam://run/${m.appid}`,
            launcher: 'steam',
            source: 'steam',
          });
        } catch { /* skip manifest */ }
      }
    } catch { /* skip lib */ }
  }
  return { ok: true, items: found, source: 'steam' };
});

// Generic launcher placeholders — useful for users to manually add shortcut folders.
ipcMain.handle('launcher:scan-epic', async () => {
  const manifestsDir = path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests');
  if (!fs.existsSync(manifestsDir)) return { ok: false, error: 'Epic Games Launcher manifests not found.' };
  const items = [];
  try {
    for (const f of fs.readdirSync(manifestsDir)) {
      if (!f.endsWith('.item')) continue;
      try {
        const data = JSON.parse(fs.readFileSync(path.join(manifestsDir, f), 'utf8'));
        if (!data.bIsApplication || data.bIsManaged === false) continue;
        items.push({
          name: data.DisplayName,
          installdir: data.InstallLocation,
          appid: data.AppName,
          launchUrl: `com.epicgames.launcher://apps/${data.CatalogNamespace}%3A${data.CatalogItemId}%3A${data.AppName}?action=launch&silent=true`,
          launchExe: data.LaunchExecutable ? path.join(data.InstallLocation, data.LaunchExecutable) : null,
        });
      } catch {}
    }
  } catch {}
  return { ok: true, items, source: 'epic' };
});
ipcMain.handle('app:setAutoStart', async (_e, enabled) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: !!enabled,
      path: process.execPath,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

ipcMain.handle('app:getAutoStart', async () => {
  try {
    return !!app.getLoginItemSettings().openAtLogin;
  } catch {
    return false;
  }
});

// External-game Rest Mode monitor. It deliberately matches only executable
// paths already stored in the user's library. It never probes game memory,
// injects code, hooks graphics, or assumes that an idle launcher means a game
// is running. Windows exposes these paths through the ordinary process list.
const externalGameWatch = { games: [], timer: null, checking: false, activeId: null };
const PROCESS_PATH_SCRIPT = 'Get-CimInstance -ClassName Win32_Process | Where-Object { $_.ExecutablePath } | Select-Object ProcessId,ExecutablePath | ConvertTo-Json -Compress';
function normalWinPath(value) { return String(value || '').replace(/^"|"$/g, '').replace(/\//g, '\\').toLowerCase(); }
function runningWindowsExePaths() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') return resolve([]);
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', PROCESS_PATH_SCRIPT], { windowsHide: true, timeout: 8000, maxBuffer: 8 * 1024 * 1024 }, (error, stdout) => {
      if (error || !stdout) return resolve([]);
      try {
        const parsed = JSON.parse(stdout);
        const records = Array.isArray(parsed) ? parsed : [parsed];
        resolve(records.map((entry) => normalWinPath(entry?.ExecutablePath)).filter(Boolean));
      } catch { resolve([]); }
    });
  });
}
async function checkExternalGameWatch() {
  if (externalGameWatch.checking || !externalGameWatch.games.length) return;
  externalGameWatch.checking = true;
  try {
    const paths = new Set(await runningWindowsExePaths());
    const launchedHere = new Set([...runningGames.keys()].map(String));
    const active = externalGameWatch.games.find((game) => paths.has(game.exePath) && !launchedHere.has(String(game.id))) || null;
    const nextId = active?.id || null;
    if (nextId === externalGameWatch.activeId) return;
    externalGameWatch.activeId = nextId;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('game:externalState', { active: !!active, gameId: active?.id || null, name: active?.name || '' });
  } finally {
    externalGameWatch.checking = false;
  }
}
ipcMain.handle('game:watchExternal', async (_e, { games = [] } = {}) => {
  externalGameWatch.games = (games || []).map((game) => ({ id: game?.id, name: String(game?.name || 'Game'), exePath: normalWinPath(game?.exePath) })).filter((game) => game.id && game.exePath && path.isAbsolute(game.exePath));
  if (!externalGameWatch.games.length) {
    externalGameWatch.activeId = null;
    if (externalGameWatch.timer) { clearInterval(externalGameWatch.timer); externalGameWatch.timer = null; }
    return { ok: true, watching: 0 };
  }
  if (!externalGameWatch.timer) externalGameWatch.timer = setInterval(checkExternalGameWatch, 10_000);
  checkExternalGameWatch();
  return { ok: true, watching: externalGameWatch.games.length };
});

function queryRegistry(root, view) {
  return new Promise((resolve) => {
    const child = spawn('reg.exe', ['query', root, '/s', view], { windowsHide: true });
    let stdout = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.on('error', () => resolve(''));
    child.on('close', () => resolve(stdout));
  });
}

function primaryExeIn(folder, depth = 0) {
  if (!folder || depth > 2) return null;
  let entries = [];
  try { entries = fs.readdirSync(folder, { withFileTypes: true }); } catch { return null; }
  for (const entry of entries) {
    const full = path.join(folder, entry.name);
    if (entry.isFile() && /\.exe$/i.test(entry.name) && !/(unins|setup|crash|redist|support|helper|config|dxsetup)/i.test(entry.name)) return full;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || /^(redist|support|__redist|dependencies)$/i.test(entry.name)) continue;
    const found = primaryExeIn(path.join(folder, entry.name), depth + 1);
    if (found) return found;
  }
  return null;
}

ipcMain.handle('launcher:scan-gog', async () => {
  const roots = ['HKLM\\SOFTWARE\\WOW6432Node\\GOG.com\\Games', 'HKLM\\SOFTWARE\\GOG.com\\Games'];
  const outputs = await Promise.all(roots.flatMap((root) => ['/reg:64', '/reg:32'].map((view) => queryRegistry(root, view))));
  const blocks = outputs.join('\n').split(/\r?\n\s*(?=HKEY_)/i);
  const items = [];
  const seen = new Set();
  for (const block of blocks) {
    const value = (name) => block.match(new RegExp(`^\\s*${name}\\s+REG_\\w+\\s+(.+)$`, 'im'))?.[1]?.trim() || '';
    const installPath = value('path') || value('PATH');
    const gameId = value('gameID') || value('gameId') || block.match(/\\Games\\([^\\\r\n]+)\s*$/im)?.[1] || '';
    const name = value('gameName') || value('GAMENAME');
    if (!installPath || !name || seen.has(gameId || installPath.toLowerCase()) || !fs.existsSync(installPath)) continue;
    seen.add(gameId || installPath.toLowerCase());
    items.push({
      gogId: gameId,
      name,
      exe: primaryExeIn(installPath) || installPath,
      installdir: installPath,
      launcher: 'gog',
      source: 'gog',
      buildId: value('buildId') || value('BUILDID'),
    });
  }
  return items.length ? { ok: true, items, source: 'gog' } : { ok: false, items: [], error: 'No installed GOG games found in the Windows registry.' };
});

ipcMain.handle('launcher:scan-ea', async () => {
  const roots = [
    'HKLM\\SOFTWARE\\EA Games',
    'HKLM\\SOFTWARE\\WOW6432Node\\EA Games',
    'HKLM\\SOFTWARE\\Origin Games',
    'HKLM\\SOFTWARE\\WOW6432Node\\Origin Games',
  ];
  const outputs = await Promise.all(roots.flatMap((root) => ['/reg:64', '/reg:32'].map((view) => queryRegistry(root, view))));
  const blocks = outputs.join('\n').split(/\r?\n\s*(?=HKEY_)/i);
  const items = [];
  const seen = new Set();
  for (const block of blocks) {
    const value = (name) => {
      const escapedName = name.replace(/[^a-z0-9 ]/gi, '\\$&');
      return block.match(new RegExp(`^\\s*${escapedName}\\s+REG_\\w+\\s+(.+)$`, 'im'))?.[1]?.trim() || '';
    };
    const installPath = value('Install Dir') || value('InstallDir') || value('InstallLocation') || value('Path');
    const name = value('DisplayName') || value('GameName') || value('Title');
    const productId = value('Product GUID') || value('ProductId') || value('contentID') || block.match(/\\([^\\\r\n]+)\s*$/im)?.[1] || '';
    if (!installPath || !name || !fs.existsSync(installPath)) continue;
    const key = productId || installPath.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      launcherProductId: productId,
      name,
      exe: primaryExeIn(installPath) || installPath,
      installdir: installPath,
      launcher: 'ea',
      source: 'ea',
      installedVersion: value('DisplayVersion') || value('Version'),
    });
  }
  return items.length ? { ok: true, items, source: 'ea' } : { ok: false, items: [], error: 'No installed EA/Origin games found in the Windows registry.' };
});

ipcMain.handle('launcher:scan-ubisoft', async () => {
  const roots = [
    'HKLM\\SOFTWARE\\Ubisoft\\Launcher\\Installs',
    'HKLM\\SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher\\Installs',
  ];
  const outputs = await Promise.all(roots.flatMap((root) => ['/reg:64', '/reg:32'].map((view) => queryRegistry(root, view))));
  const blocks = outputs.join('\n').split(/\r?\n\s*(?=HKEY_)/i);
  const items = [];
  const seen = new Set();
  for (const block of blocks) {
    const value = (name) => {
      const escapedName = name.replace(/[^a-z0-9 ]/gi, '\\$&');
      return block.match(new RegExp(`^\\s*${escapedName}\\s+REG_\\w+\\s+(.+)$`, 'im'))?.[1]?.trim() || '';
    };
    const installPath = value('InstallDir') || value('Install Dir') || value('InstallLocation');
    const productId = block.match(/\\Installs\\([^\\\r\n]+)\s*$/im)?.[1] || value('GameId');
    if (!installPath || !productId || !fs.existsSync(installPath) || seen.has(productId)) continue;
    seen.add(productId);
    const folderName = path.basename(installPath.replace(/[\\/]+$/, ''));
    const name = value('DisplayName') || value('GameName') || folderName || `Ubisoft Game ${productId}`;
    items.push({
      launcherProductId: `ubisoft:${productId}`,
      name,
      exe: primaryExeIn(installPath) || installPath,
      installdir: installPath,
      launcher: 'ubisoft',
      source: 'ubisoft',
      launchUrl: `uplay://launch/${productId}/0`,
      nameEvidence: value('DisplayName') || value('GameName') ? 'registry' : 'install-folder',
    });
  }
  return items.length ? { ok: true, items, source: 'ubisoft' } : { ok: false, items: [], error: 'No installed Ubisoft Connect games found in the Windows registry.' };
});

ipcMain.handle('launcher:scan-battlenet', async () => {
  const roots = [
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  ];
  const outputs = await Promise.all(roots.flatMap((root) => ['/reg:64', '/reg:32'].map((view) => queryRegistry(root, view))));
  const blocks = outputs.join('\n').split(/\r?\n\s*(?=HKEY_)/i);
  const items = [];
  const seen = new Set();
  for (const block of blocks) {
    const value = (name) => {
      const escapedName = name.replace(/[^a-z0-9 ]/gi, '\\$&');
      return block.match(new RegExp(`^\\s*${escapedName}\\s+REG_\\w+\\s+(.+)$`, 'im'))?.[1]?.trim() || '';
    };
    const publisher = value('Publisher');
    const name = value('DisplayName');
    const installPath = value('InstallLocation');
    if (!/blizzard|battle\.net/i.test(publisher) || !name || !installPath || !fs.existsSync(installPath)) continue;
    if (/battle\.net( desktop app)?$/i.test(name.trim())) continue;
    const key = `${name.toLowerCase()}|${installPath.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      launcherProductId: `battlenet:${value('ProductID') || name}`,
      name,
      exe: primaryExeIn(installPath) || installPath,
      installdir: installPath,
      launcher: 'battlenet',
      source: 'battlenet',
      installedVersion: value('DisplayVersion'),
    });
  }
  return items.length ? { ok: true, items, source: 'battlenet' } : { ok: false, items: [], error: 'No installed Battle.net games found in Windows installation records.' };
});

ipcMain.handle('launcher:scan-riot', async () => {
  const metadataRoot = path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'Riot Games', 'Metadata');
  if (!fs.existsSync(metadataRoot)) return { ok: false, items: [], error: 'Riot installed-game metadata was not found.' };
  const files = [];
  const walk = (folder, depth = 0) => {
    if (depth > 3 || files.length >= 100) return;
    let entries = [];
    try { entries = fs.readdirSync(folder, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(full, depth + 1);
      else if (/\.product_settings\.ya?ml$/i.test(entry.name)) files.push(full);
    }
  };
  walk(metadataRoot);
  const items = [];
  const seen = new Set();
  for (const file of files) {
    let yaml = '';
    try { yaml = fs.readFileSync(file, 'utf8'); } catch { continue; }
    const field = (name) => yaml.match(new RegExp(`^${name}:\\s*["']?([^"'\\r\\n]+)`, 'im'))?.[1]?.trim() || '';
    const productId = field('product_id') || path.basename(path.dirname(file));
    const name = field('product_name') || field('name') || productId;
    if (!productId || !name || /riot client/i.test(name) || seen.has(productId)) continue;
    const installPath = field('product_install_full_path').replace(/\//g, '\\');
    const configuredExe = field('product_executable_full_path').replace(/\//g, '\\');
    const exe = configuredExe && fs.existsSync(configuredExe) ? configuredExe : primaryExeIn(installPath) || installPath;
    if (!exe || (!fs.existsSync(exe) && !fs.existsSync(installPath))) continue;
    seen.add(productId);
    items.push({
      launcherProductId: `riot:${productId}`,
      name,
      exe,
      installdir: installPath,
      launcher: 'riot',
      source: 'riot',
      installedVersion: field('product_version'),
    });
  }
  return items.length ? { ok: true, items, source: 'riot' } : { ok: false, items: [], error: 'No installed Riot games were present in the local metadata.' };
});

ipcMain.handle('launcher:scan-xbox', async () => {
  const roots = [];
  for (let code = 67; code <= 90; code += 1) {
    const candidate = `${String.fromCharCode(code)}:\\XboxGames`;
    try { if (fs.existsSync(candidate)) roots.push(candidate); } catch { /* inaccessible drive */ }
  }
  const items = [];
  const seen = new Set();
  for (const root of roots) {
    let folders = [];
    try { folders = fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()); } catch { continue; }
    for (const folder of folders.slice(0, 300)) {
      const content = path.join(root, folder.name, 'Content');
      const configPath = path.join(content, 'MicrosoftGame.config');
      if (!fs.existsSync(configPath)) continue;
      let xml = '';
      try { xml = fs.readFileSync(configPath, 'utf8'); } catch { continue; }
      const attr = (name) => xml.match(new RegExp(`${name}=["']([^"']+)["']`, 'i'))?.[1]?.trim() || '';
      const storeId = attr('StoreId') || attr('Id') || folder.name;
      if (seen.has(storeId)) continue;
      const configuredExe = attr('Executable') || xml.match(/<Executable[^>]+Name=["']([^"']+)["']/i)?.[1] || '';
      const exe = configuredExe ? path.join(content, configuredExe.replace(/\//g, '\\')) : primaryExeIn(content) || content;
      const displayName = attr('DefaultDisplayName');
      const name = displayName && !/^ms-resource:/i.test(displayName) ? displayName : folder.name;
      seen.add(storeId);
      items.push({
        launcherProductId: `xbox:${storeId}`,
        name,
        exe: fs.existsSync(exe) ? exe : content,
        installdir: content,
        launcher: 'xbox',
        source: 'xbox',
        storeId,
      });
    }
  }
  return items.length ? { ok: true, items, source: 'xbox' } : { ok: false, items: [], error: 'No Xbox/Game Pass installs with MicrosoftGame.config were found under local XboxGames roots.' };
});

ipcMain.handle('launcher:scan-rockstar', async () => {
  const roots = [
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  ];
  const outputs = await Promise.all(roots.flatMap((root) => ['/reg:64', '/reg:32'].map((view) => queryRegistry(root, view))));
  const blocks = outputs.join('\n').split(/\r?\n\s*(?=HKEY_)/i);
  const items = [];
  const seen = new Set();
  for (const block of blocks) {
    const value = (name) => {
      const escapedName = name.replace(/[^a-z0-9 ]/gi, '\\$&');
      return block.match(new RegExp(`^\\s*${escapedName}\\s+REG_\\w+\\s+(.+)$`, 'im'))?.[1]?.trim() || '';
    };
    const publisher = value('Publisher');
    const name = value('DisplayName');
    if (!/rockstar games/i.test(publisher) || !name || /(launcher|social club|sdk)/i.test(name)) continue;
    let installPath = value('InstallLocation');
    if (!installPath) {
      const uninstall = value('UninstallString');
      const executable = uninstall.match(/^"([^"]+\.exe)"/i)?.[1] || uninstall.match(/^([^\s]+\.exe)/i)?.[1] || '';
      if (executable) installPath = path.dirname(executable);
    }
    if (!installPath || !fs.existsSync(installPath)) continue;
    const productId = block.match(/\\([^\\\r\n]+)\s*$/im)?.[1] || name;
    const key = `${name.toLowerCase()}|${installPath.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      launcherProductId: `rockstar:${productId}`,
      name,
      exe: primaryExeIn(installPath) || installPath,
      installdir: installPath,
      launcher: 'rockstar',
      source: 'rockstar',
      installedVersion: value('DisplayVersion'),
    });
  }
  return items.length ? { ok: true, items, source: 'rockstar' } : { ok: false, items: [], error: 'No installed Rockstar games found in verified Windows installation records.' };
});

// itch.io keeps its configured install locations in its own user preferences.
// We deliberately do *not* open butler.db here: it is the desktop client's live
// SQLite catalog and direct/concurrent access is neither needed nor safe for a
// read-only launcher import. A completed itch install has a receipt marker in
// the game's folder, so this adapter only reads those known locations and then
// lets the normal approval-first metadata flow enrich the folder-derived title.
function itchInstallRoots() {
  const appData = process.env.APPDATA || '';
  const preferences = path.join(appData, 'itch', 'preferences.json');
  if (!preferences || !fs.existsSync(preferences)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(preferences, 'utf8'));
    const locations = data?.installLocations && typeof data.installLocations === 'object'
      ? Object.values(data.installLocations) : [];
    return [...new Set(locations
      .map((location) => typeof location?.path === 'string' ? location.path.trim() : '')
      .filter((location) => location && fs.existsSync(location))
      .map((location) => path.resolve(location)))];
  } catch {
    return [];
  }
}

function itchDisplayName(folderName) {
  return String(folderName || '')
    .replace(/\s+\d+$/, '')
    .replace(/^game-\d+$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

ipcMain.handle('launcher:scan-itch', async () => {
  const roots = itchInstallRoots();
  if (!roots.length) {
    return {
      ok: false,
      items: [],
      error: 'No itch.io install locations were found in the itch desktop app preferences.',
    };
  }
  const items = [];
  const seen = new Set();
  for (const root of roots) {
    let folders = [];
    try { folders = fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()); } catch { continue; }
    for (const folder of folders.slice(0, 1_000)) {
      // "downloads" is itch's staging area, never an installed game.
      if (/^downloads$/i.test(folder.name)) continue;
      const installDir = path.join(root, folder.name);
      const receipt = path.join(installDir, '.itch', 'receipt.json.gz');
      if (!fs.existsSync(receipt)) continue;
      const key = installDir.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const name = itchDisplayName(folder.name) || folder.name;
      items.push({
        launcherProductId: `itch:${key}`,
        name,
        exe: primaryExeIn(installDir) || installDir,
        installdir: installDir,
        launcher: 'itch',
        source: 'itch',
        // The receipt is only a completion marker. Do not parse or copy it;
        // it is not relied upon as a metadata source.
        nameEvidence: 'itch-install-folder',
      });
    }
  }
  return items.length
    ? { ok: true, items, source: 'itch' }
    : { ok: false, items: [], error: 'No completed itch.io installs were found in the configured itch install locations.' };
});

ipcMain.handle('app:openPath', async (_e, p) => {
  if (!p || typeof p !== 'string') return { ok: false, error: 'No path provided.' };
  const error = await shell.openPath(p);
  return error ? { ok: false, error } : { ok: true };
});

ipcMain.handle('dialog:pickSaveFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select this game\'s save folder',
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// ---------------- Save folders and local backups ---------------- //
// Backups are deliberately kept under NEO-LIB's own app-data directory. The
// restore path never overwrites live files: it can only restore into an empty
// directory or make a separate "NEOLIB Restored" folder for manual review.
ipcMain.handle('saves:inspect', async (_e, savePath) => {
  try {
    if (!savePath || typeof savePath !== 'string') return { ok: false, error: 'No save folder selected.' };
    const stat = await fsp.stat(savePath);
    if (!stat.isDirectory()) return { ok: false, error: 'The selected path is not a folder.' };
    return { ok: true, path: savePath, ...(await folderStats(savePath)) };
  } catch (error) {
    return { ok: false, error: error?.code === 'ENOENT' ? 'This folder no longer exists.' : String(error?.message || error) };
  }
});

ipcMain.handle('saves:listBackups', async (_e, gameId) => {
  try {
    const root = path.join(saveBackupsDir(), safePathPart(gameId));
    let entries = [];
    try { entries = await fsp.readdir(root, { withFileTypes: true }); } catch { return { ok: true, backups: [] }; }
    const backups = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      const backupPath = path.join(root, entry.name);
      try {
        const meta = JSON.parse(await fsp.readFile(path.join(backupPath, 'backup.json'), 'utf8'));
        backups.push({ ...meta, backupPath });
      } catch { /* incomplete backup is never shown as recoverable */ }
    }
    backups.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    return { ok: true, backups };
  } catch (error) { return { ok: false, error: String(error?.message || error), backups: [] }; }
});

ipcMain.handle('saves:createBackup', async (_e, { gameId, gameName, savePath } = {}) => {
  try {
    if (!gameId || !savePath) return { ok: false, error: 'Select a save folder first.' };
    const source = path.resolve(savePath);
    const stat = await fsp.stat(source);
    if (!stat.isDirectory()) return { ok: false, error: 'The selected save path is not a folder.' };
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(saveBackupsDir(), safePathPart(gameId), stamp);
    const contentPath = path.join(backupPath, 'files');
    await fsp.mkdir(contentPath, { recursive: true });
    await fsp.cp(source, contentPath, { recursive: true, force: false, errorOnExist: true, dereference: false });
    const meta = { gameId, gameName: String(gameName || 'Game'), originalPath: source, createdAt: Date.now(), ...(await folderStats(contentPath)) };
    await fsp.writeFile(path.join(backupPath, 'backup.json'), JSON.stringify(meta, null, 2), 'utf8');
    return { ok: true, backup: { ...meta, backupPath } };
  } catch (error) { return { ok: false, error: String(error?.message || error) }; }
});

ipcMain.handle('saves:restore', async (_e, { backupPath, savePath, mode = 'empty' } = {}) => {
  try {
    const backupRoot = path.resolve(saveBackupsDir());
    const resolvedBackup = path.resolve(String(backupPath || ''));
    const contentPath = path.join(resolvedBackup, 'files');
    if (!isInside(backupRoot, resolvedBackup)) return { ok: false, error: 'That backup is outside NEO-LIB\'s backup folder.' };
    if (!(await fsp.stat(contentPath)).isDirectory()) return { ok: false, error: 'Backup files are missing.' };
    if (!savePath || typeof savePath !== 'string') return { ok: false, error: 'Choose a destination folder first.' };
    const target = path.resolve(savePath);
    await fsp.mkdir(target, { recursive: true });
    let destination = target;
    if (mode === 'safe-copy') {
      const stamp = new Date().toISOString().slice(0, 10);
      destination = path.join(target, `NEOLIB Restored ${stamp}`);
      let suffix = 2;
      while (fs.existsSync(destination)) destination = path.join(target, `NEOLIB Restored ${stamp} (${suffix++})`);
      await fsp.mkdir(destination, { recursive: true });
    } else if (!(await isDirectoryEmpty(target))) {
      return { ok: false, conflict: true, error: 'The live save folder already contains files. Nothing was changed.' };
    }
    await fsp.cp(contentPath, destination, { recursive: true, force: false, errorOnExist: true, dereference: false });
    return { ok: true, restoredTo: destination, ...(await folderStats(destination)) };
  } catch (error) { return { ok: false, error: String(error?.message || error) }; }
});

// A lightweight, automatic first pass for ordinary Windows save locations.
// It only checks a small set of known folders and existing matching children;
// it never crawls a drive, reads save content, or changes the chosen folder.
ipcMain.handle('saves:detectCommon', async (_e, { gameName, exePath, appid } = {}) => {
  const candidates = new Map();
  const terms = String(gameName || '').toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length >= 3).slice(0, 5);
  const gameKey = String(gameName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!terms.length) return { ok: true, candidates: [] };
  const add = async (candidatePath, source, baseScore = 0, allowBaseMatch = false) => {
    try {
      const stat = await fsp.stat(candidatePath);
      if (!stat.isDirectory()) return;
      const label = path.basename(candidatePath).toLowerCase();
      const matches = terms.filter((term) => label.includes(term)).length;
      const score = baseScore + matches + (gameKey && label.replace(/[^a-z0-9]/g, '').includes(gameKey) ? 5 : 0);
      if (score <= baseScore && !allowBaseMatch) return;
      const key = path.resolve(candidatePath).toLowerCase();
      const current = candidates.get(key);
      if (!current || score > current.score) candidates.set(key, { path: candidatePath, source, score });
    } catch { /* absent/inaccessible candidate */ }
  };
  const addMatchingChildren = async (root, source) => {
    try {
      const entries = await fsp.readdir(root, { withFileTypes: true });
      for (const entry of entries.slice(0, 800)) {
        if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
        await add(path.join(root, entry.name), source, 0);
      }
    } catch { /* optional Windows folder is unavailable */ }
  };
  const home = os.homedir();
  const roots = [
    [path.join(home, 'Documents'), 'Documents'],
    [path.join(home, 'Documents', 'My Games'), 'Documents / My Games'],
    [path.join(home, 'Saved Games'), 'Saved Games'],
    [process.env.APPDATA, 'AppData / Roaming'],
    [process.env.LOCALAPPDATA, 'AppData / Local'],
    [process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'LocalLow') : '', 'AppData / LocalLow'],
  ].filter(([root]) => root);
  for (const [root, source] of roots) {
    await add(path.join(root, String(gameName || '')), source, 2);
    await addMatchingChildren(root, source);
  }
  // A selected executable provides a useful local signal for portable/indie
  // games that keep a clearly named save folder beside the game itself.
  if (exePath) {
    const gameRoot = path.dirname(exePath);
    for (const folder of ['save', 'saves', 'savedata', 'savegame', 'savegames']) await add(path.join(gameRoot, folder), 'Game folder', 1, true);
  }
  // Steam Cloud's local mirror is deterministic by app id. It works before a
  // game is run through NEO-LIB, provided Steam has already created the save.
  if (appid) {
    const steamPath = defaultSteamPath();
    const userdata = steamPath ? path.join(steamPath, 'userdata') : '';
    try {
      const users = await fsp.readdir(userdata, { withFileTypes: true });
      for (const user of users.slice(0, 20)) {
        if (!user.isDirectory() || !/^\d+$/.test(user.name)) continue;
        const remote = path.join(userdata, user.name, String(appid), 'remote');
        try {
          if ((await fsp.stat(remote)).isDirectory()) candidates.set(path.resolve(remote).toLowerCase(), { path: remote, source: 'Steam Cloud local mirror', score: 12 });
        } catch { /* no Steam Cloud mirror for this account/game */ }
      }
    } catch { /* Steam unavailable */ }
  }
  return { ok: true, candidates: [...candidates.values()].sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, 12) };
});

ipcMain.handle('saves:findCandidates', async (_e, { root, gameName } = {}) => {
  try {
    const rootPath = path.resolve(String(root || ''));
    if (!root || !(await fsp.stat(rootPath)).isDirectory()) return { ok: false, error: 'Choose a valid folder or drive to search.', candidates: [] };
    const terms = String(gameName || '').toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length >= 3).slice(0, 5);
    if (!terms.length) return { ok: false, error: 'This game needs a longer name to search for save candidates.', candidates: [] };
    const candidates = [];
    let visited = 0;
    let truncated = false;
    const maxVisited = 40000;
    const maxDepth = 7;
    async function walk(current, depth) {
      if (visited >= maxVisited || candidates.length >= 80) { truncated = true; return; }
      let entries = [];
      try { entries = await fsp.readdir(current, { withFileTypes: true }); } catch { return; }
      for (const entry of entries) {
        if (visited >= maxVisited || candidates.length >= 80) { truncated = true; return; }
        if (entry.isSymbolicLink()) continue;
        visited += 1;
        const full = path.join(current, entry.name);
        const label = entry.name.toLowerCase();
        const matched = terms.filter((term) => label.includes(term)).length;
        if (entry.isDirectory() && matched > 0) {
          candidates.push({ path: full, matchedTerms: matched });
          continue;
        }
        if (entry.isDirectory() && depth < maxDepth) await walk(full, depth + 1);
      }
    }
    await walk(rootPath, 0);
    return { ok: true, candidates, visited, truncated };
  } catch (error) { return { ok: false, error: String(error?.message || error), candidates: [] }; }
});

// User-triggered only: measuring whole game folders can be expensive on large
// libraries, so Home never scans disks silently. "Mod content" is an estimate
// of folders conventionally named mods/mod/workshop inside the game directory.
const STORAGE_FOLDER_CACHE = new Map();
ipcMain.handle('storage:scanGames', async (_e, { games = [], force = false } = {}) => {
  const results = [];
  const candidates = [];
  const seenRoots = new Set();
  for (const game of Array.isArray(games) ? games.slice(0, 250) : []) {
    if (!game?.id || !game?.exePath || typeof game.exePath !== 'string' || !path.isAbsolute(game.exePath)) continue;
    const root = path.resolve(path.dirname(game.exePath));
    const rootKey = root.toLowerCase();
    // Multiple entries aimed at the same install folder are one storage unit;
    // showing the same byte count five times is misleading and wastes I/O.
    if (seenRoots.has(rootKey)) continue;
    seenRoots.add(rootKey);
    candidates.push({ id: game.id, root, rootKey });
  }
  const measure = async ({ id, root, rootKey }) => {
    try {
      const stat = await fsp.stat(root);
      if (!stat.isDirectory()) return;
      const cached = STORAGE_FOLDER_CACHE.get(rootKey);
      if (!force && cached && Date.now() - cached.ts < 10 * 60 * 1000) {
        results.push({ id, ...cached.result, cached: true });
        return;
      }
      const total = await folderStats(root, 60000);
      let modBytes = 0;
      let modFiles = 0;
      let entries = [];
      try { entries = await fsp.readdir(root, { withFileTypes: true }); } catch { entries = []; }
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.isSymbolicLink() || !/^(mods?|workshop|modding)$/i.test(entry.name)) continue;
        const mod = await folderStats(path.join(root, entry.name), 30000);
        modBytes += mod.bytes; modFiles += mod.files;
      }
      const result = { bytes: total.bytes, files: total.files, modBytes, modFiles, truncated: total.truncated };
      STORAGE_FOLDER_CACHE.set(rootKey, { ts: Date.now(), result });
      results.push({ id, ...result, cached: false });
    } catch { /* inaccessible or external drive disconnected */ }
  };
  // Three folder walks at once keeps the UI responsive while significantly
  // reducing the wait for libraries spread across several game folders.
  for (let start = 0; start < candidates.length; start += 3) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(candidates.slice(start, start + 3).map(measure));
  }
  return { ok: true, results, scannedAt: Date.now() };
});

// Launch Doctor is diagnostic only. It checks the configured target and finds
// plausible sibling executables; it never executes, deletes, or changes files.
ipcMain.handle('doctor:inspectLaunch', async (_e, { exePath, gameName } = {}) => {
  const result = { ok: true, configuredPath: exePath || '', exists: false, candidates: [], notes: [] };
  try {
    if (!exePath || typeof exePath !== 'string') {
      result.notes.push('No launch executable is configured for this game.');
      return result;
    }
    const stat = await fsp.stat(exePath);
    result.exists = stat.isFile();
  } catch {
    result.notes.push('The configured executable could not be found. It may have moved, the drive may be disconnected, or security software may have quarantined it.');
  }
  if (!result.exists) {
    result.notes.push('Check the game folder and your antivirus quarantine before choosing a replacement executable.');
  }
  const root = path.dirname(exePath || '');
  const found = [];
  if (root && fs.existsSync(root)) {
    await walkDir(root, 0, 2, found, 40, []);
    const gameTokens = String(gameName || '').toLowerCase().split(/[^a-z0-9]+/).filter((value) => value.length >= 3);
    result.candidates = found.filter((candidate) => candidate !== exePath).map((candidate) => ({
      path: candidate,
      matchScore: gameTokens.filter((token) => path.basename(candidate).toLowerCase().includes(token)).length,
    })).sort((a, b) => b.matchScore - a.matchScore || a.path.localeCompare(b.path)).slice(0, 12);
  }
  if (result.exists && result.candidates.length === 0) result.notes.push('The configured file exists. A launcher, DRM client, missing dependency, or the game itself closing immediately may still be responsible.');
  return result;
});

// Lightweight, local-only system readiness snapshot used by the Library footer.
ipcMain.handle('system:health', async () => readSystemHealth());

// ---------------- Optimize Center ---------------- //
// These tools are deliberately on-demand. The process view uses ordinary
// Windows performance/process APIs and never inspects process memory. Cleanup
// only returns exact file candidates from bounded roots and moves confirmed
// files to the Recycle Bin; it never recursively deletes a directory.
const optimizeProcessSnapshot = new Map();
const optimizeJunkSnapshot = new Map();

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

const GAMING_INSPECT_SCRIPT = String.raw`
$ErrorActionPreference = 'SilentlyContinue'
$cores = [Math]::Max(1, [Environment]::ProcessorCount)
$before = @{}
Get-Process | ForEach-Object { $before[[int]$_.Id] = [double]($_.CPU) }
Start-Sleep -Milliseconds 650
$processes = Get-Process | ForEach-Object {
  $pidValue = [int]$_.Id
  $previous = $before[$pidValue]
  $current = [double]($_.CPU)
  $cpu = if ($null -ne $previous -and $current -ge $previous) { [Math]::Round((($current - $previous) / 0.65 / $cores) * 100, 1) } else { 0 }
  $filePath = $null
  try { $filePath = $_.Path } catch {}
  [pscustomobject]@{ pid=$pidValue; name=$_.ProcessName; cpuPercent=[Math]::Min(100,$cpu); memoryBytes=[double]$_.WorkingSet64; path=$filePath }
}
$gpuByPid = @{}
$gpuCounterAvailable = $false
try {
  $samples = (Get-Counter '\GPU Engine(*)\Utilization Percentage').CounterSamples
  $gpuCounterAvailable = $true
  foreach ($sample in $samples) {
    if ($sample.InstanceName -match 'pid_(\d+)' -and [double]$sample.CookedValue -gt 0.05) {
      $gpuPid = [int]$Matches[1]
      if (-not $gpuByPid.ContainsKey($gpuPid)) { $gpuByPid[$gpuPid] = 0.0 }
      $gpuByPid[$gpuPid] += [double]$sample.CookedValue
    }
  }
} catch {}
$gpu = @($gpuByPid.GetEnumerator() | ForEach-Object {
  $proc = Get-Process -Id $_.Key -ErrorAction SilentlyContinue
  [pscustomobject]@{ pid=[int]$_.Key; name=if($proc){$proc.ProcessName}else{'Unknown'}; percent=[Math]::Round([Math]::Min(100,[double]$_.Value),1) }
} | Sort-Object percent -Descending | Select-Object -First 8)
$gameBar = Get-ItemProperty 'HKCU:\Software\Microsoft\GameBar'
$gameConfig = Get-ItemProperty 'HKCU:\System\GameConfigStore'
$graphics = Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\GraphicsDrivers'
$capture = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\GameDVR'
$powerText = (powercfg /getactivescheme | Out-String).Trim()
$pendingRestart = (Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending') -or (Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired')
$topProcesses = @($processes | Sort-Object cpuPercent -Descending | Select-Object -First 30) + @($processes | Sort-Object memoryBytes -Descending | Select-Object -First 30)
[pscustomobject]@{
  processes=@($topProcesses | Sort-Object pid -Unique)
  gpu=@($gpu)
  gpuAvailable=[bool]$gpuCounterAvailable
  settings=[pscustomobject]@{
    gameMode=if($null -eq $gameBar.AutoGameModeEnabled){'system default'}elseif([int]$gameBar.AutoGameModeEnabled -eq 1){'on'}else{'off'}
    hags=if($null -eq $graphics.HwSchMode){'system default'}elseif([int]$graphics.HwSchMode -eq 2){'on'}elseif([int]$graphics.HwSchMode -eq 1){'off'}else{'system default'}
    backgroundCapture=if(($null -ne $capture.AppCaptureEnabled -and [int]$capture.AppCaptureEnabled -eq 0) -or ($null -ne $gameConfig.GameDVR_Enabled -and [int]$gameConfig.GameDVR_Enabled -eq 0)){'off'}else{'on'}
    powerPlan=$powerText
    pendingRestart=[bool]$pendingRestart
  }
} | ConvertTo-Json -Depth 6 -Compress
`;

const protectedProcessNames = new Set(['system', 'registry', 'smss', 'csrss', 'wininit', 'services', 'lsass', 'svchost', 'winlogon', 'dwm', 'explorer', 'fontdrvhost', 'sihost', 'taskhostw']);
ipcMain.handle('optimize:inspectGaming', async () => {
  const payload = await runPowerShellJson(GAMING_INSPECT_SCRIPT);
  if (!payload) return { ok: false, error: 'Windows performance details are unavailable.' };
  optimizeProcessSnapshot.clear();
  const processes = (Array.isArray(payload.processes) ? payload.processes : payload.processes ? [payload.processes] : []).map((entry) => {
    const pid = Number(entry.pid);
    const name = String(entry.name || 'Unknown');
    const protectedEntry = pid <= 4 || pid === process.pid || protectedProcessNames.has(name.toLowerCase()) || normalWinPath(entry.path) === normalWinPath(process.execPath);
    const record = { pid, name, path: String(entry.path || ''), protected: protectedEntry, capturedAt: Date.now() };
    if (pid > 0) optimizeProcessSnapshot.set(pid, record);
    return { ...record, cpuPercent: Number(entry.cpuPercent || 0), memoryBytes: Number(entry.memoryBytes || 0) };
  });
  const gpu = (Array.isArray(payload.gpu) ? payload.gpu : payload.gpu ? [payload.gpu] : []).map((entry) => ({ pid: Number(entry.pid), name: String(entry.name || 'Unknown'), percent: Number(entry.percent || 0) }));
  return { ok: true, processes, gpu, gpuAvailable: !!payload.gpuAvailable, settings: payload.settings || {}, inspectedAt: Date.now() };
});

ipcMain.handle('optimize:closeProcess', async (_event, { pid, name } = {}) => {
  const numericPid = Number(pid);
  const record = optimizeProcessSnapshot.get(numericPid);
  if (!record || Date.now() - record.capturedAt > 2 * 60 * 1000) return { ok: false, error: 'The process list is stale. Refresh it first.' };
  if (record.protected || record.name !== String(name || '')) return { ok: false, error: 'NEO-LIB will not close this protected or changed process.' };
  return new Promise((resolve) => {
    // Deliberately omit taskkill /F: Windows gets the non-forced close request
    // first so cooperative apps can shut down normally.
    execFile('taskkill.exe', ['/PID', String(numericPid)], { windowsHide: true, timeout: 8000 }, (error) => {
      if (error) return resolve({ ok: false, error: 'Windows refused the normal close request. NEO-LIB will not force-kill it.' });
      optimizeProcessSnapshot.delete(numericPid);
      resolve({ ok: true, name: record.name });
    });
  });
});

function optimizeFileToken(filePath, stat) {
  return Buffer.from(`${filePath}|${stat.size}|${stat.mtimeMs}`).toString('base64url').slice(0, 120);
}

async function collectJunkFiles(root, options, out, seen) {
  const { depth = 0, maxDepth = 1, kind = 'Temporary file', match, minAgeMs = 0, maxEntries = 3000 } = options;
  if (!root || !path.isAbsolute(root) || out.length >= 600 || seen.visited >= maxEntries) return;
  let entries = [];
  try { entries = await fsp.readdir(root, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (out.length >= 600 || seen.visited >= maxEntries) break;
    seen.visited += 1;
    const fullPath = path.join(root, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      if (depth < maxDepth) await collectJunkFiles(fullPath, { ...options, depth: depth + 1 }, out, seen);
      continue;
    }
    if (!entry.isFile() || !match(entry.name, fullPath)) continue;
    try {
      const stat = await fsp.stat(fullPath);
      if (Date.now() - stat.mtimeMs < minAgeMs) continue;
      const token = optimizeFileToken(fullPath, stat);
      if (optimizeJunkSnapshot.has(token)) continue;
      const item = { token, path: fullPath, name: entry.name, folder: path.dirname(fullPath), bytes: stat.size, modifiedAt: stat.mtimeMs, kind, selectedByDefault: kind !== 'Large installer or archive' };
      optimizeJunkSnapshot.set(token, { ...item, capturedAt: Date.now() });
      out.push(item);
    } catch { /* file disappeared or became inaccessible */ }
  }
}

ipcMain.handle('optimize:scanJunk', async (_event, { games = [] } = {}) => {
  optimizeJunkSnapshot.clear();
  const out = [];
  const protectedFiles = new Set((games || []).flatMap((game) => [game?.exePath, game?.saveFolder]).filter(Boolean).map(normalWinPath));
  const safeMatch = (name, fullPath) => !protectedFiles.has(normalWinPath(fullPath)) && /(?:\.tmp$|\.log$|\.dmp$|\.old$|\.bak$|crash|report)/i.test(name);
  const seen = { visited: 0 };
  const week = 7 * 24 * 60 * 60 * 1000;
  const knownRoots = [
    { root: app.getPath('temp'), kind: 'Old temporary/log file', maxDepth: 2, match: safeMatch, minAgeMs: week },
    { root: path.join(process.env.LOCALAPPDATA || '', 'CrashDumps'), kind: 'Crash dump', maxDepth: 1, match: (name, fullPath) => !protectedFiles.has(normalWinPath(fullPath)) && /\.dmp$/i.test(name), minAgeMs: 24 * 60 * 60 * 1000 },
  ];
  for (const config of knownRoots) await collectJunkFiles(config.root, { ...config, maxEntries: 5000 }, out, seen);

  const archiveRoots = new Set();
  for (const game of (games || []).slice(0, 500)) {
    const exePath = String(game?.exePath || '');
    if (!path.isAbsolute(exePath)) continue;
    const gameRoot = path.dirname(exePath);
    archiveRoots.add(gameRoot);
    archiveRoots.add(path.dirname(gameRoot));
  }
  const largeArchive = (name, fullPath) => !protectedFiles.has(normalWinPath(fullPath)) && /(?:\.zip|\.rar|\.7z|\.iso|\.msi|setup\.exe)$/i.test(name);
  for (const root of [...archiveRoots].slice(0, 120)) {
    const before = out.length;
    await collectJunkFiles(root, { maxDepth: 1, kind: 'Large installer or archive', match: largeArchive, minAgeMs: 14 * 24 * 60 * 60 * 1000, maxEntries: 1200 }, out, seen);
    for (let index = before; index < out.length; index += 1) {
      if (out[index].bytes < 250 * 1024 * 1024) {
        optimizeJunkSnapshot.delete(out[index].token);
        out[index] = null;
      }
    }
  }
  const items = out.filter(Boolean).sort((a, b) => b.bytes - a.bytes).slice(0, 500);
  const keep = new Set(items.map((item) => item.token));
  for (const token of optimizeJunkSnapshot.keys()) if (!keep.has(token)) optimizeJunkSnapshot.delete(token);
  return { ok: true, items, totalBytes: items.reduce((sum, item) => sum + item.bytes, 0), scannedAt: Date.now(), visited: seen.visited, scope: 'Known Windows temp/crash locations and folders beside configured library games only.' };
});

ipcMain.handle('optimize:trashJunk', async (_event, { tokens = [] } = {}) => {
  const selected = [...new Set(tokens)].slice(0, 100);
  const trashed = [];
  const failed = [];
  for (const token of selected) {
    const record = optimizeJunkSnapshot.get(String(token));
    if (!record || Date.now() - record.capturedAt > 30 * 60 * 1000) { failed.push({ token, error: 'Stale scan result' }); continue; }
    try {
      const stat = await fsp.stat(record.path);
      if (!stat.isFile() || optimizeFileToken(record.path, stat) !== token) { failed.push({ token, error: 'File changed since scan' }); continue; }
      await shell.trashItem(record.path);
      trashed.push({ token, path: record.path, bytes: record.bytes });
      optimizeJunkSnapshot.delete(token);
    } catch (error) { failed.push({ token, error: error?.message || 'Could not move file to Recycle Bin' }); }
  }
  return { ok: failed.length === 0, trashed, failed, reclaimedBytes: trashed.reduce((sum, item) => sum + item.bytes, 0) };
});

// ---------------- GOG search & details ---------------- //
ipcMain.handle('gog:search', async (_e, query) => {
  const term = cleanSearchTerm(query);
  if (!term) return [];
  const url = `https://catalog.gog.com/v1/catalog?limit=10&query=like:${encodeURIComponent(term)}&order=desc:score&productType=in:game,pack`;
  try {
    const data = await httpGetJson(url);
    return (data.products || []).map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      genres: (p.genres || []).map((g) => g.name || g),
      developers: (p.developers || []),
      publishers: (p.publishers || []),
      releaseDate: p.releaseDate ? p.releaseDate.slice(0, 10) : '',
      coverHorizontal: p.coverHorizontal,
      coverVertical: p.coverVertical,
      screenshots: (p.screenshots || []).map((s) =>
        (typeof s === 'string' ? s : s.url || s).replace('{formatter}', 'product_card_v2_logo_710x355').replace('{ext}', 'webp')
      ).slice(0, 6),
      url: `https://www.gog.com${p.storeLink || ''}`,
    }));
  } catch {
    return [];
  }
});

// ---------------- Web fallback (DuckDuckGo + Google) ---------------- //
// Returns lightweight game-like metadata extracted from search result snippets.
async function ddgSearch(term) {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(term + ' video game wiki')}`;
  try {
    const html = await httpGetText(url);
    // crude: parse anchor titles + snippets
    const results = [];
    const reBlock = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]{0,1200}?class="result__snippet"[^>]*>([\s\S]{0,500}?)<\/a>/g;
    let m;
    while ((m = reBlock.exec(html)) && results.length < 8) {
      const title = m[2].replace(/<[^>]+>/g, '').trim();
      const snippet = m[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      results.push({ url: decodeURIComponent(m[1]), title, snippet });
    }
    return results;
  } catch {
    return [];
  }
}

async function googleScrape(term) {
  // Best-effort, Google may rate-limit / show captcha. Used as last resort.
  const url = `https://www.google.com/search?q=${encodeURIComponent(term + ' video game')}&hl=en`;
  try {
    const html = await httpGetText(url);
    const results = [];
    const re = /<h3[^>]*>([^<]+)<\/h3>[\s\S]{0,2200}?<div[^>]+VwiC3b[^>]*>([\s\S]{0,400}?)<\/div>/g;
    let m;
    while ((m = re.exec(html)) && results.length < 8) {
      results.push({
        title: m[1].replace(/<[^>]+>/g, '').trim(),
        snippet: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
      });
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * itch.io scrape — public search results page.
 * itch.io powers a huge chunk of indie / py / RPG-Maker / experimental games
 * that never make it to Steam or GOG. We scrape the .game_cell anchors which
 * carry the cover thumb, title, and creator inline.
 */
async function itchSearch(term) {
  const url = `https://itch.io/search?q=${encodeURIComponent(term)}`;
  try {
    const html = await httpGetText(url);
    const results = [];
    // Each game card contains: <a class="game_link" href="..."><img data-lazy_src="..." alt="..."/>...</a>
    const re = /<a class="title game_link"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]{0,800}?(?:data-background_image="([^"]+)"|class="lazy_loaded" src="([^"]+)")/g;
    let m;
    while ((m = re.exec(html)) && results.length < 8) {
      const link = m[1];
      const title = m[2].replace(/<[^>]+>/g, '').trim();
      const img = m[3] || m[4] || '';
      results.push({ url: link, title, image: img });
    }
    // Fallback simpler regex if the first didn't match the current itch HTML structure
    if (results.length === 0) {
      const re2 = /<a class="title game_link"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
      while ((m = re2.exec(html)) && results.length < 8) {
        results.push({ url: m[1], title: m[2].trim(), image: '' });
      }
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * DLsite / Japanese indie — match RJ##### / VJ##### / RE##### codes.
 * Many Japanese RPG-Maker / Renpy games ship with their DLsite code in the
 * folder name (e.g. "Lust Room RJ01450973"). We extract the code and look
 * up the canonical product page directly. This is the single highest-hit
 * source for east-asian indie titles.
 */
function extractDLsiteCode(term) {
  const m = (term || '').match(/\b(R[EJ]|VJ|BJ)\d{4,9}\b/i);
  return m ? m[0].toUpperCase() : null;
}
async function dlsiteLookup(code) {
  if (!code) return null;
  // English maniax site has cleaner HTML + safe-for-work-aware metadata
  const url = `https://www.dlsite.com/maniax/work/=/product_id/${code}.html`;
  try {
    const html = await httpGetText(url);
    const title  = (html.match(/<meta property="og:title" content="([^"]+)"/) || [])[1] || '';
    const desc   = (html.match(/<meta property="og:description" content="([^"]+)"/) || [])[1] || '';
    const image  = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || '';
    if (!title) return null;
    const maker  =
      (html.match(/itemprop="brand"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/) || [])[1] ||
      (html.match(/class="maker_name"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/) || [])[1] || '';
    return {
      source: 'dlsite',
      name: title.trim(),
      shortDescription: desc.trim().slice(0, 240),
      about: desc.trim(),
      headerImage: image,
      capsuleImage: image,
      background: image,
      screenshots: [],
      genres: ['Visual Novel'],
      developers: maker ? [maker.trim()] : [],
      publishers: maker ? [maker.trim()] : [],
      releaseDate: '',
      website: url,
    };
  } catch {
    return null;
  }
}

/**
 * VNDB — visual novel DB (the authoritative source for VN metadata).
 * Public Kana API: https://api.vndb.org/kana
 * No key required for basic queries.
 */
async function vndbLookup(term) {
  try {
    const body = {
      filters: ['search', '=', term],
      fields: 'title, image.url, description, released, developers.name, screenshots.url',
      results: 3,
    };
    const data = await httpPostJson('https://api.vndb.org/kana/vn', body);
    if (!data?.results?.length) return null;
    const top = data.results[0];
    return {
      source: 'vndb',
      name: top.title,
      shortDescription: (top.description || '').replace(/\[.*?\]/g, '').slice(0, 240),
      about: (top.description || '').replace(/\[.*?\]/g, ''),
      headerImage: top.image?.url || '',
      capsuleImage: top.image?.url || '',
      background: top.image?.url || '',
      screenshots: (top.screenshots || []).map((s) => s.url).slice(0, 6),
      genres: ['Visual Novel'],
      developers: (top.developers || []).map((d) => d.name).slice(0, 3),
      publishers: [],
      releaseDate: top.released || '',
      website: `https://vndb.org/v${top.id || ''}`,
    };
  } catch {
    return null;
  }
}

/**
 * Ryuugames — popular adult-VN repackager. Many indie titles only have
 * findable cover/description here when DLsite is JP-locked or itch lacks them.
 */
async function ryuugamesSearch(term) {
  try {
    const url = `https://www.ryuugames.com/?s=${encodeURIComponent(term)}`;
    const html = await httpGetText(url);
    // Each post: <h2 class="post-title"><a href="..." title="...">TITLE</a></h2>
    const m = html.match(/<h2[^>]*post-title[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/);
    if (!m) return null;
    const pageUrl = m[1];
    const title   = m[2].replace(/<[^>]+>/g, '').trim();
    // Visit the post itself to grab the cover image + description.
    const page = await httpGetText(pageUrl);
    const cover = (page.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || '';
    const desc  = (page.match(/<meta property="og:description" content="([^"]+)"/) || [])[1] || '';
    return {
      source: 'ryuugames',
      name: cleanTitle(title) || term,
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
      website: pageUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch a single itch.io game page and pull out cover, description, creator.
 */
async function itchDetails(pageUrl) {
  try {
    const html = await httpGetText(pageUrl);
    const cover =
      (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || '';
    const desc =
      (html.match(/<meta property="og:description" content="([^"]+)"/) || [])[1] || '';
    const title =
      (html.match(/<meta property="og:title" content="([^"]+)"/) || [])[1] || '';
    // Creator slug from URL: https://USER.itch.io/GAME
    const userMatch = pageUrl.match(/https?:\/\/([^.]+)\.itch\.io/);
    const developer = userMatch ? userMatch[1] : '';
    // Extract up to 4 screenshot URLs from the page's gallery
    const shots = [];
    const reShot = /href="([^"]+\.(?:png|jpg|jpeg|webp|gif))"[^>]*class="screenshot/g;
    let sm;
    while ((sm = reShot.exec(html)) && shots.length < 6) shots.push(sm[1]);
    return { title, cover, desc, developer, shots };
  } catch {
    return null;
  }
}

ipcMain.handle('web:search', async (_e, query) => {
  const term = cleanSearchTerm(query);
  if (!term) return { results: [], synthesized: null };
  let results = await ddgSearch(term);
  if (results.length === 0) results = await googleScrape(term);
  // Synthesize a single guess from the best result.
  let synth = null;
  if (results.length > 0) {
    const top = results[0];
    const yearMatch = (top.snippet + ' ' + top.title).match(/\b(19|20)\d{2}\b/);
    const genreKeywords = [
      'RPG', 'action', 'adventure', 'puzzle', 'platformer', 'shooter', 'strategy',
      'simulation', 'roguelike', 'rogue-like', 'horror', 'survival', 'racing', 'sports',
      'fighting', 'metroidvania', 'visual novel', 'sandbox', 'open-world', 'open world', 'indie',
    ];
    const text = (top.snippet + ' ' + top.title).toLowerCase();
    const genres = Array.from(new Set(genreKeywords.filter((k) => text.includes(k.toLowerCase()))))
      .map((g) => g.replace(/\b\w/g, (c) => c.toUpperCase()));
    synth = {
      name: cleanTitle(top.title) || term,
      about: top.snippet,
      shortDescription: top.snippet,
      genres,
      releaseDate: yearMatch ? yearMatch[0] : '',
      website: top.url || '',
      developers: [],
      publishers: [],
      screenshots: [],
      source: 'web',
    };
  }
  return { results, synthesized: synth };
});

function cleanTitle(t) {
  return (t || '')
    .replace(/\s*[-–|]\s*(Wikipedia|IGN|Steam|GOG\.com|GOG|Epic Games|Metacritic|Official\b.*|.+ - YouTube).*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------- Gemini fallback (optional) ---------------- //
ipcMain.handle('gemini:metadata', async (_e, { apiKey, query }) => {
  if (!apiKey || !query) return null;
  const prompt = `You are a video-game database. Given this rough name guessed from a folder/exe: "${query}". 
Return ONLY a single compact JSON object (no markdown) with these fields:
{
 "name": "canonical title",
 "shortDescription": "1-2 sentence summary",
 "about": "3-5 sentence description",
 "genres": ["..."],
 "developers": ["..."],
 "publishers": ["..."],
 "releaseDate": "YYYY or 'DD Mon YYYY' if known",
 "website": "official site or wiki URL or empty"
}
If you cannot identify the game, set "name" to "" and return empty strings/arrays.`;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    };
    const data = await httpPostJson(url, body);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(text);
    if (!parsed.name) return null;
    return { ...parsed, source: 'gemini', screenshots: [] };
  } catch (e) {
    return null;
  }
});

// ---------------- Unified metadata pipeline ---------------- //
// Tries Hardcoded → Steam → Epic → GOG → Gemini (if key) → Web scrape.

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
  { match: /diablo\s*iv|diablo4/i, name: 'Diablo IV', url: 'https://eu.shop.battle.net/en-us/product/diablo-iv', genres: ['Action RPG'], tags: ['Action RPG', 'Open World', 'Co-op', 'Multiplayer'] },
  { match: /diablo\s*ii.*resurrected|d2r/i, name: 'Diablo II: Resurrected', url: 'https://eu.shop.battle.net/en-us/product/diablo-ii-resurrected', genres: ['Action RPG'], tags: ['Action RPG', 'Loot', 'Co-op', 'Multiplayer'] },
  { match: /diablo\s*iii|diablo3/i, name: 'Diablo III', url: 'https://eu.shop.battle.net/en-us/product/diablo-iii', genres: ['Action RPG'], tags: ['Action RPG', 'Loot', 'Co-op', 'Multiplayer'] },
  { match: /diablo\s*immortal/i, name: 'Diablo Immortal', url: 'https://diabloimmortal.blizzard.com/', genres: ['Action RPG'], tags: ['Action RPG', 'MMORPG', 'Free to Play', 'Multiplayer'] },
  { match: /warcraft\s*(iii|3).*reforged|warcraft3reforged/i, name: 'Warcraft III: Reforged', url: 'https://eu.shop.battle.net/en-us/product/warcraft-3-reforged', genres: ['Real-Time Strategy'], tags: ['Real-Time Strategy', 'Fantasy', 'Campaign', 'Multiplayer'] },
  { match: /world\s*of\s*warcraft|\bwow\b/i, name: 'World of Warcraft', url: 'https://worldofwarcraft.blizzard.com/', genres: ['MMORPG'], tags: ['MMORPG', 'Open World', 'Fantasy', 'Multiplayer'] },
  { match: /starcraft\s*ii|starcraft2/i, name: 'StarCraft II', url: 'https://starcraft2.blizzard.com/', genres: ['Real-Time Strategy'], tags: ['Real-Time Strategy', 'Sci-Fi', 'Competitive', 'Multiplayer'] },
  { match: /starcraft.*remastered/i, name: 'StarCraft: Remastered', url: 'https://eu.shop.battle.net/en-us/product/starcraft-remastered', genres: ['Real-Time Strategy'], tags: ['Real-Time Strategy', 'Sci-Fi', 'Competitive', 'Multiplayer'] },
  { match: /overwatch\s*2|overwatch2/i, name: 'Overwatch 2', url: 'https://overwatch.blizzard.com/', genres: ['Shooter'], tags: ['Hero Shooter', 'First-Person Shooter', 'Team-Based', 'Multiplayer'] },
  { match: /hearthstone/i, name: 'Hearthstone', url: 'https://hearthstone.blizzard.com/', genres: ['Card Game'], tags: ['Card Game', 'Strategy', 'Free to Play', 'Multiplayer'] },
  { match: /heroes\s*of\s*the\s*storm/i, name: 'Heroes of the Storm', url: 'https://heroesofthestorm.blizzard.com/', genres: ['MOBA'], tags: ['MOBA', 'Strategy', 'Team-Based', 'Multiplayer'] },
  { match: /warzone/i, name: 'Call of Duty: Warzone', url: 'https://eu.shop.battle.net/en-us/product/call-of-duty-warzone-2', genres: ['Shooter'], tags: ['First-Person Shooter', 'Battle Royale', 'Multiplayer', 'Free to Play'] },
  { match: /black\s*ops\s*6|bo6/i, name: 'Call of Duty: Black Ops 6', url: 'https://eu.shop.battle.net/en-us/product/call-of-duty-black-ops-6', genres: ['Shooter'], tags: ['First-Person Shooter', 'Campaign', 'Multiplayer', 'Zombies'] },
  { match: /black\s*ops\s*cold\s*war/i, name: 'Call of Duty: Black Ops Cold War', url: 'https://eu.shop.battle.net/en-us/product/call-of-duty-black-ops-cold-war', genres: ['Shooter'], tags: ['First-Person Shooter', 'Campaign', 'Multiplayer', 'Zombies'] },
];
const BATTLENET_METADATA_CACHE = new Map();

function metaTag(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'),
  ];
  const value = patterns.map((pattern) => html.match(pattern)?.[1]).find(Boolean) || '';
  return stripHtml(value.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
}

async function battleNetMetadata(query) {
  const product = BATTLENET_PRODUCTS.find((entry) => entry.match.test(String(query || '')));
  if (!product) return null;
  const cached = BATTLENET_METADATA_CACHE.get(product.name);
  if (cached && Date.now() - cached.at < 12 * 60 * 60 * 1000) return cached.value;
  try {
    const html = await httpGetText(product.url, 10_000);
    const image = metaTag(html, 'og:image');
    const description = metaTag(html, 'og:description') || metaTag(html, 'description');
    const value = {
      source: 'battlenet',
      name: product.name,
      shortDescription: description,
      about: description,
      headerImage: image,
      capsuleImage: image,
      background: image,
      screenshots: [],
      genres: product.genres,
      genreTags: product.tags,
      developers: ['Blizzard Entertainment'],
      publishers: ['Blizzard Entertainment'],
      website: product.url,
    };
    BATTLENET_METADATA_CACHE.set(product.name, { at: Date.now(), value });
    return value;
  } catch {
    return null;
  }
}

// ---------------- Per-source candidate search ---------------- //

// Build local, read-only search hints for difficult indie games. This only
// inspects the executable's immediate folder and parent, with strict file-count
// and size caps; it never recursively scans a drive or uploads file contents.
ipcMain.handle('metadata:deriveHints', async (_e, { exePath, currentName } = {}) => {
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
});

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
ipcMain.handle('metadata:listCandidates', async (_e, { source, query, geminiKey } = {}) => {
  const term = cleanSearchTerm(query || '');
  if (!term) return { candidates: [], error: 'Empty query' };

  try {
    if (source === 'steam') return { candidates: await listSteamCandidates(term) };
    if (source === 'gog') return { candidates: await listGogCandidates(term) };
    if (source === 'itch') return { candidates: await listItchCandidates(term) };
    if (source === 'dlsite') return { candidates: await listDlsiteCandidates(term) };
    if (source === 'vndb') return { candidates: await listVndbCandidates(term) };
    if (source === 'ryuugames') return { candidates: await listRyuuCandidates(term) };
    if (source === 'f95zone') return { candidates: await listF95Candidates(term) };
    if (source === 'google') return { candidates: await listGoogleCandidates(term) };
    if (source === 'ai') return { candidates: await listAiCandidates(term, geminiKey) };
  } catch (e) {
    return { candidates: [], error: String(e) };
  }
  return { candidates: [], error: 'Unknown source' };
});

/**
 * `metadata:expandCandidate` — turn a candidate preview into a full metadata
 * record (the kind AcceptMetadataModal expects). Called when the user picks
 * a result from the carousel.
 */
ipcMain.handle('metadata:expandCandidate', async (_e, { candidate } = {}) => {
  if (!candidate || !candidate.source) return null;
  try {
    if (candidate.source === 'steam') return await expandSteam(candidate);
    if (candidate.source === 'gog') return await expandGog(candidate);
    if (candidate.source === 'itch') return await expandItch(candidate);
    if (candidate.source === 'dlsite') return await dlsiteLookup(candidate.id);
    if (candidate.source === 'vndb') return await expandVndb(candidate);
    if (candidate.source === 'ryuugames') return await expandRyuu(candidate);
    if (candidate.source === 'f95zone') return await expandF95(candidate);
    if (candidate.source === 'google') return await expandGoogle(candidate);
    if (candidate.source === 'ai') return candidate.raw; // already a full record
  } catch { return null; }
  return null;
});

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
    let results = await ddgSearch(term);
    if (!results.length) results = await googleScrape(term);
    return (results || []).slice(0, 8).map((r) => ({
      source: 'google',
      id: r.url,
      name: cleanTitle(r.title || ''),
      image: '',
      year: ((r.snippet + ' ' + r.title).match(/\b(19|20)\d{2}\b/) || [])[0] || '',
      shortDescription: r.snippet || '',
      raw: r,
    }));
  } catch { return []; }
}
async function expandGoogle(c) {
  const r = c.raw || {};
  return {
    source: 'web',
    name: c.name || 'Unknown',
    shortDescription: r.snippet || '',
    about: r.snippet || '',
    headerImage: '',
    capsuleImage: '',
    background: '',
    screenshots: [],
    genres: [],
    developers: [],
    publishers: [],
    releaseDate: c.year || '',
    website: r.url || '',
  };
}

async function listAiCandidates(term, geminiKey) {
  if (!geminiKey) return [{
    source: 'ai',
    id: 'ai-key-missing',
    name: 'Gemini API key required',
    image: '',
    year: '',
    shortDescription: 'Add your Gemini API key in Settings → Integrations to use the "Ask AI" source.',
    raw: null,
  }];
  // Reuse existing gemini:metadata handler logic by invoking it inline
  try {
    const apiBody = {
      contents: [{
        role: 'user',
        parts: [{ text:
`You are a video-game database. Given this rough name guessed from a folder/exe: "${term}".
Return ONLY a single compact JSON object (no markdown) with these fields:
{ "name": "canonical title", "shortDescription": "1-2 sentence summary",
  "about": "3-5 sentence description", "genres": ["..."],
  "developers": ["..."], "publishers": ["..."], "releaseDate": "YYYY-MM-DD",
  "website": "official URL or store URL", "metacritic": null,
  "source": "gemini" }` }],
      }],
    };
    const resp = await httpPostJson(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      apiBody,
    );
    const text = resp?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return [];
    const obj = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    return [{
      source: 'ai',
      id: 'gemini-1',
      name: obj.name || term,
      image: '',
      year: (obj.releaseDate || '').slice(0, 4),
      shortDescription: obj.shortDescription || '',
      raw: { ...obj, source: 'gemini' },
    }];
  } catch { return []; }
}

ipcMain.handle('metadata:auto', async (_e, { query, skipSources = [], geminiKey, lockedAppid, launcher }) => {
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

  // 0b. Curated launcher-exclusives (LoL, Fortnite, Valorant, Minecraft, etc.) — instant, no network
  const curated = curatedMatch(term);
  if (curated) return curated;

  if (String(launcher || '').toLowerCase() === 'battlenet') {
    const battleNet = await battleNetMetadata(term);
    if (battleNet) return battleNet;
  }

  // 1. Steam
  if (!skipSources.includes('steam')) {
    try {
      const data = await httpGetJson(
        `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=en&cc=us`
      );
      if (data.items && data.items.length > 0) {
        const top = pickBestMatch(term, data.items, 'name') || data.items[0];
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
      const top = pickBestMatch(term, data.products || [], 'title');
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
        const top = pickBestMatch(term, hits, 'title') || hits[0];
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

  // 4. Gemini (if user key provided)
  if (!skipSources.includes('gemini') && geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${encodeURIComponent(geminiKey)}`;
      const prompt = `Return ONLY JSON for game "${term}": {"name":"","shortDescription":"","about":"","genres":[],"developers":[],"publishers":[],"releaseDate":"","website":""}. If unknown leave fields empty.`;
      const data = await httpPostJson(url, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      });
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = JSON.parse(text);
      if (parsed && parsed.name) {
        return {
          source: 'gemini',
          ...parsed,
          screenshots: [],
        };
      }
    } catch {}
  }

  // 5. Ryuugames — adult-VN repackager. Sometimes the only place an obscure
  //    indie game has a clean cover + description findable on the open web.
  if (!skipSources.includes('ryuugames')) {
    const hit = await ryuugamesSearch(term);
    if (hit) return hit;
  }

  // 6. Web fallback (DuckDuckGo → Google) — tries the full term first, then
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
      let webResults = await ddgSearch(v);
      if (webResults.length === 0) webResults = await googleScrape(v);
      if (webResults.length > 0) {
        const top = webResults[0];
        const yearMatch = (top.snippet + ' ' + top.title).match(/\b(19|20)\d{2}\b/);
        const text = (top.snippet + ' ' + top.title).toLowerCase();
        const genreKeywords = [
          'RPG', 'action', 'adventure', 'puzzle', 'platformer', 'shooter', 'strategy',
          'simulation', 'roguelike', 'rogue-like', 'horror', 'survival', 'racing', 'sports',
          'fighting', 'metroidvania', 'visual novel', 'sandbox', 'open-world', 'indie',
        ];
        const genres = Array.from(new Set(genreKeywords.filter((k) => text.includes(k.toLowerCase()))))
          .map((g) => g.replace(/\b\w/g, (c) => c.toUpperCase()));
        return {
          source: 'web',
          name: cleanTitle(top.title) || v,
          shortDescription: top.snippet,
          about: top.snippet,
          screenshots: [],
          genres,
          developers: [],
          publishers: [],
          releaseDate: yearMatch ? yearMatch[0] : '',
          website: top.url || '',
        };
      }
    } catch {}
  }

  return null;
});

/* ============================================================ */
/* DEALS — Epic free games + Steam specials                       */
/* Cached in memory for 1 hour. No API keys required.             */
/* ============================================================ */
let DEALS_CACHE = { ts: 0, items: [] };

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
      .slice(0, 20)
      .map(([tag]) => tag)
      .filter(Boolean);
    STEAM_TAXONOMY_CACHE.set(key, { at: Date.now(), tags });
    return Array.from(new Set([...official, ...tags]));
  } catch {
    return Array.from(new Set(official));
  }
}

ipcMain.handle('launcher:detect', async () => detectRunningLaunchers());

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

// Friends Hub inspection combines the existing process check with a local
// installation check. Manual paths originate only from the user's file picker.
ipcMain.handle('launcher:inspectSocialClients', async (_event, manualPaths = {}) => {
  const { existsSync } = require('fs');
  const running = await detectRunningLaunchers();
  const clients = {};
  for (const platform of SOCIAL_PLATFORM_IDS) {
    const manualPath = safeManualClientPath(manualPaths, platform);
    const executable = manualPath && existsSync(manualPath) ? manualPath : socialClientCandidates(platform).find(existsSync) || '';
    clients[platform] = { running: !!running[platform], installed: !!executable, path: executable, pathSource: executable && executable === manualPath ? 'manual' : executable ? 'standard' : '', savedPathMissing: !!manualPath && !existsSync(manualPath) };
  }
  return clients;
});

ipcMain.handle('launcher:pickSocialClient', async (_event, platform) => {
  if (!SOCIAL_PLATFORM_IDS.has(platform)) return null;
  const label = { steam: 'Steam', epic: 'Epic Games Launcher', ea: 'EA app', ubisoft: 'Ubisoft Connect', battlenet: 'Battle.net' }[platform];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: `Locate ${label}`,
    properties: ['openFile'],
    filters: [{ name: 'Application', extensions: ['exe'] }],
  });
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
});

// Friends Hub — opens only the platform's normal client/social surface.
// It never reads client tokens, cookies, memory, friend lists, or chat history.
ipcMain.handle('launcher:openSocial', async (_event, platform, manualPath) => {
  if (!SOCIAL_PLATFORM_IDS.has(platform)) return { ok: false, error: 'Unsupported platform.' };
  if (process.platform !== 'win32') return { ok: false, error: 'Friends Hub currently supports Windows clients only.' };
  const { shell } = require('electron');
  const { existsSync } = require('fs');
  if (platform === 'steam') {
    try { await shell.openExternal('steam://open/friends'); return { ok: true }; }
    catch { return { ok: false, error: 'Steam could not be opened.' }; }
  }
  const selectedPath = typeof manualPath === 'string' && manualPath.toLowerCase().endsWith('.exe') ? manualPath : '';
  const executable = selectedPath && existsSync(selectedPath) ? selectedPath : socialClientCandidates(platform).find(existsSync);
  if (!executable) return { ok: false, error: 'Client not found. Use Locate to choose its executable once.' };
  const openError = await shell.openPath(executable);
  return openError ? { ok: false, error: openError } : { ok: true };
});

ipcMain.handle('deals:fetch', async () => {
  const ONE_HOUR = 60 * 60 * 1000;
  if (Date.now() - DEALS_CACHE.ts < ONE_HOUR && DEALS_CACHE.items.length) {
    return DEALS_CACHE.items;
  }
  const items = [];

  // -- Epic free games (current + upcoming)
  try {
    const epic = await httpGetJson(
      'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US'
    );
    const games = epic?.data?.Catalog?.searchStore?.elements || [];
    for (const g of games) {
      const promo = g?.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0];
      if (!promo) continue;
      const discount = promo.discountSetting?.discountPercentage;
      // Epic uses discountPercentage 0 to mean "100% off" oddly; verify it's truly free
      const isFree = discount === 0 || promo.discountSetting?.discountType === 'PERCENTAGE';
      if (!isFree) continue;
      const slug = g.productSlug || g.urlSlug || g.catalogNs?.mappings?.[0]?.pageSlug || '';
      if (!slug) continue;
      const image = (g.keyImages || []).find((k) => k.type === 'OfferImageWide' || k.type === 'DieselStoreFrontWide')?.url
                  || (g.keyImages || [])[0]?.url;
      items.push({
        id: `epic-${g.id}`,
        platform: 'epic',
        title: g.title,
        subtitle: 'Free this week · Epic Games',
        priceText: 'FREE',
        originalPrice: g.price?.totalPrice?.fmtPrice?.originalPrice || '',
        image,
        url: `https://store.epicgames.com/en-US/p/${slug}`,
        endsAt: promo.endDate,
      });
    }
  } catch (e) { /* offline / network failure — skip */ }

  // -- Steam featured specials
  try {
    const sf = await httpGetJson('https://store.steampowered.com/api/featuredcategories?cc=us&l=en');
    const specials = sf?.specials?.items || [];
    // Expanded supply: up to 15 entries (was 8) and threshold lowered to 20% (was 25%).
    for (const s of specials.slice(0, 15)) {
      if (!s.discount_percent || s.discount_percent < 20) continue;
      items.push({
        id: `steam-${s.id}`,
        platform: 'steam',
        appid: s.id,
        title: s.name,
        subtitle: `-${s.discount_percent}% · Steam`,
        priceText: `$${(s.final_price / 100).toFixed(2)}`,
        originalPrice: `$${(s.original_price / 100).toFixed(2)}`,
        image: s.large_capsule_image || s.header_image,
        url: `https://store.steampowered.com/app/${s.id}`,
        discount: s.discount_percent,
      });
    }
  } catch (e) { /* skip */ }

  // -- Instant Gaming hot deals (paying affiliate via igr= partner code in deals.js wrapper)
  // Lightweight regex scrape — IG's HTML has been stable for years. If their markup ever
  // changes, this block silently yields zero items and the other sources keep working.
  try {
    const html = await httpGetText('https://www.instant-gaming.com/en/?type=hotdeal&sort=hot');
    const reItem = /<a[^>]*class="[^"]*cover[^"]*"[^>]*href="(\/en\/[^"]+)"[\s\S]*?<picture[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?<\/a>[\s\S]*?<div[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<[\s\S]*?<div[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<[\s\S]*?<div[^>]*class="[^"]*discount[^"]*"[^>]*>([^<]+)</g;
    let m;
    let count = 0;
    const fallbackUrls = new Set();
    while ((m = reItem.exec(html)) !== null && count < 12) {
      const [, hrefPath, image, title, price, discount] = m;
      if (!hrefPath || !title) continue;
      if (fallbackUrls.has(hrefPath)) continue;
      fallbackUrls.add(hrefPath);
      items.push({
        id: `ig-${count}-${hrefPath.replace(/\W+/g, '').slice(0, 24)}`,
        platform: 'instant-gaming',
        title: title.trim(),
        subtitle: `${(discount || '').trim()} · Instant Gaming`,
        priceText: (price || '').trim() || '—',
        originalPrice: '',
        image: image.startsWith('http') ? image : `https:${image}`,
        url: `https://www.instant-gaming.com${hrefPath}`,
        discount: parseInt(String(discount || '').replace(/[^0-9-]/g, ''), 10) || 0,
      });
      count += 1;
    }
  } catch (e) { /* IG unreachable — keep the other deals */ }

  // -- GOG top discounts (public catalog API, no auth needed).
  //    Wide selection (~10-15 items) at 40%+ off. Includes many EA/Ubi
  //    titles since GOG sells them too. Wrapped through Skimlinks for revenue.
  try {
    const url = 'https://catalog.gog.com/v1/catalog?limit=15&order=desc:discount&price=discounted:eq:true&productType=in:game,pack';
    const data = await httpGetJson(url, 8000);
    const prods = (data?.products || []).slice(0, 12);
    for (const p of prods) {
      const disc = String(p?.price?.discount || '').replace(/[^0-9]/g, '');
      const discPct = parseInt(disc, 10) || 0;
      if (discPct < 40) continue;
      items.push({
        id: `gog-${p.id}`,
        platform: 'gog',
        title: p.title,
        subtitle: `-${discPct}% · GOG`,
        priceText: p?.price?.final || '',
        originalPrice: p?.price?.base || '',
        image: (p.coverHorizontal || p.image || '').replace(/^\/\//, 'https://'),
        url: `https://www.gog.com${p.storeLink || ''}`,
        discount: discPct,
      });
    }
  } catch (e) { /* GOG catalog unreachable — skip */ }

  // -- Fanatical star deal (single big-ticket deal, updated daily).
  //    Fanatical carries a lot of EA / Ubisoft catalog titles + Steam keys.
  //    Wrapped via Awin (MID 18809 covers Fanatical) once approved, else Skimlinks.
  try {
    const fan = await httpGetJson('https://www.fanatical.com/api/all/en', 8000);
    const sd = fan?.stardeal;
    if (sd && sd.slug && sd.discount_percent > 20) {
      const priceUsd = sd?.price?.USD;
      const fullUsd  = sd?.fullPrice?.USD;
      const cover = sd.cover
        ? `https://fanatical.imgix.net/product/original/${sd.cover}?auto=compress,format&w=400`
        : '';
      items.push({
        id: `fan-star-${sd.slug}`,
        platform: 'fanatical',
        title: sd.name,
        subtitle: `-${sd.discount_percent}% · Fanatical star deal`,
        priceText: priceUsd != null ? `$${Number(priceUsd).toFixed(2)}` : '',
        originalPrice: fullUsd != null ? `$${Number(fullUsd).toFixed(2)}` : '',
        image: cover,
        url: `https://www.fanatical.com/en/game/${sd.slug}`,
        discount: sd.discount_percent,
      });
    }
  } catch (e) { /* Fanatical unreachable — skip */ }

  // -- Ubisoft Store deals (server-rendered HTML).
  //    Static tiles carry ~6 curated titles; prices load via JS so we skip them
  //    and let the store page show them. Wrapped via Skimlinks for catch-all revenue.
  try {
    const html = await httpGetText('https://store.ubisoft.com/us/deals');
    const cardRe = /data-itemid="([^"]{8,40})"[\s\S]{0,4000}?href="(\/us\/[^"]+?\.html\?lang=en_US)"[\s\S]{0,3500}?data-src="([^"]+?\.(?:jpg|jpeg|png|webp))[^"]*"[\s\S]{0,500}?title="Go to product: ([^"]+)"/g;
    let m;
    let count = 0;
    const seenIds = new Set();
    while ((m = cardRe.exec(html)) !== null && count < 8) {
      const [, itemid, hrefPath, image, rawTitle] = m;
      if (seenIds.has(itemid)) continue;
      seenIds.add(itemid);
      // Unescape common HTML entities
      const title = String(rawTitle)
        .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
        .replace(/&rsquo;/g, '\u2019').replace(/&lsquo;/g, '\u2018')
        .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      items.push({
        id: `ubi-${itemid}`,
        platform: 'ubisoft',
        title,
        subtitle: 'On sale · Ubisoft Store',
        priceText: '',
        originalPrice: '',
        image: image.startsWith('http') ? image : `https://store.ubisoft.com${image}`,
        url: `https://store.ubisoft.com${hrefPath}`,
      });
      count += 1;
    }
  } catch (e) { /* Ubisoft HTML unreachable — skip */ }

  DEALS_CACHE = { ts: Date.now(), items };
  return items;
});

// ---------------- Released This Week ---------------- //
// This is intentionally a discovery feed, not an exhaustive release calendar.
// SteamSpy gives us a small set of titles receiving real recent player interest;
// we then verify each title's store type and actual release date through Steam's
// public store details response. That protects Home from filling with tiny,
// low-visibility uploads while keeping the criteria understandable.
let WEEKLY_RELEASES_CACHE = { ts: 0, payload: null };

function parseStoreReleaseDate(value) {
  if (!value || typeof value !== 'string') return 0;
  const parsed = Date.parse(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function ownerFloor(value) {
  const match = String(value || '').match(/([\d,]+)/);
  return match ? Number(match[1].replace(/,/g, '')) || 0 : 0;
}

async function mapWithConcurrency(items, limit, worker) {
  const output = [];
  let cursor = 0;
  const run = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try { output[index] = await worker(items[index]); } catch { output[index] = null; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return output;
}

ipcMain.handle('releases:weekly', async (_event, { force = false } = {}) => {
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  if (!force && WEEKLY_RELEASES_CACHE.payload && Date.now() - WEEKLY_RELEASES_CACHE.ts < SIX_HOURS) {
    return { ok: true, ...WEEKLY_RELEASES_CACHE.payload, fetchedAt: WEEKLY_RELEASES_CACHE.ts, cached: true };
  }

  try {
    const trend = await httpGetJson('https://steamspy.com/api.php?request=top100in2weeks', 10_000);
    // Inspect a wider recent-interest pool. We still prefer major releases,
    // but this gives the fallback enough verified candidates when a quiet week
    // has no blockbuster at all.
    const candidates = Object.values(trend || {})
      .filter((item) => item && Number(item.appid))
      .sort((a, b) => Number(b.ccu || 0) - Number(a.ccu || 0))
      .slice(0, 100);
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const verified = await mapWithConcurrency(candidates, 4, async (signal) => {
      const raw = await httpGetJson(`https://store.steampowered.com/api/appdetails?appids=${signal.appid}&l=en&cc=us`, 8_000);
      const data = raw?.[signal.appid]?.success ? raw[signal.appid].data : null;
      const releaseAt = parseStoreReleaseDate(data?.release_date?.date);
      if (!data || data.type !== 'game' || data.release_date?.coming_soon || releaseAt < weekAgo || releaseAt > now + 24 * 60 * 60 * 1000) return null;
      const ccu = Number(signal.ccu || 0);
      const positives = Number(signal.positive || 0);
      const owners = ownerFloor(signal.owners);
      // Two intentionally conservative tiers. Major is the normal Home feed;
      // noteworthy is used only when the major tier is empty, never mixed in
      // merely to pad a good week with smaller releases.
      const tier = (ccu >= 150 || positives >= 250 || owners >= 20_000)
        ? 'major'
        : (ccu >= 45 || positives >= 75 || owners >= 5_000) ? 'noteworthy' : null;
      if (!tier) return null;
      const why = ccu >= 500 ? 'High current player interest' : positives >= 1_000 ? 'Strong early review interest' : owners >= 100_000 ? 'Major launch reach' : tier === 'major' ? 'Notable early player interest' : 'Worth watching: early player interest';
      return {
        id: `steam-${signal.appid}`,
        appid: Number(signal.appid),
        title: data.name || signal.name || 'Untitled game',
        image: data.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${signal.appid}/header.jpg`,
        platform: 'Steam',
        releaseAt,
        releaseDate: data.release_date?.date || '',
        url: `https://store.steampowered.com/app/${signal.appid}`,
        why,
        ccu,
        reviewCount: positives,
        tier,
        genres: (data.genres || []).map((genre) => genre.description).slice(0, 3),
      };
    });
    const released = verified.filter(Boolean).sort((a, b) => b.releaseAt - a.releaseAt || b.ccu - a.ccu);
    const major = released.filter((item) => item.tier === 'major');
    const usingFallback = major.length === 0;
    const items = (usingFallback ? released.filter((item) => item.tier === 'noteworthy') : major).slice(0, 12);
    const payload = {
      items,
      tier: usingFallback ? 'semi-major' : 'major',
      criteria: usingFallback
        ? 'No major launch cleared the strict threshold this week, so this view is showing only semi-major games with verified early momentum. Steam is the current discovery source.'
        : 'Released within seven days, verified as a full game, and showing major recent player, review, or launch-reach signals. Steam is the current discovery source.',
    };
    WEEKLY_RELEASES_CACHE = { ts: Date.now(), payload };
    return { ok: true, ...payload, fetchedAt: WEEKLY_RELEASES_CACHE.ts, cached: false };
  } catch (error) {
    return { ok: false, items: [], error: error?.message || 'Release feed unavailable.' };
  }
});

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
  const text = `${title || ''} ${snippet || ''}`;
  if (!text.trim()) return true;
  const nonLatin = text.match(
    /[\u0400-\u04FF\u0370-\u03FF\u0590-\u05FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7A3]/g
  );
  return !nonLatin || nonLatin.length < 3;
}

let STEAM_NEWS_CACHE = { ts: 0, keyHash: '', items: [] };
ipcMain.handle('news:fetchSteam', async (_e, { games = [], days = 14, force = false } = {}) => {
  const list = (games || [])
    .filter((g) => g && g.appid)
    .map((g) => ({ appid: String(g.appid), name: g.name || String(g.appid), gameId: g.id || null }));
  if (!list.length) return { ok: true, items: [], fetchedAt: Date.now() };

  const keyHash = list.map((g) => g.appid).sort().join(',') + `|${days}`;
  const THIRTY_MIN = 30 * 60 * 1000;
  if (!force && STEAM_NEWS_CACHE.keyHash === keyHash && Date.now() - STEAM_NEWS_CACHE.ts < THIRTY_MIN) {
    return { ok: true, items: STEAM_NEWS_CACHE.items, fetchedAt: STEAM_NEWS_CACHE.ts, cached: true };
  }

  const cutoffSec = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
  const out = [];
  // Fetch in parallel with a cap on concurrency (8 at a time) to be polite
  const batchSize = 8;
  for (let i = 0; i < list.length; i += batchSize) {
    const slice = list.slice(i, i + batchSize);
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(
      slice.map(async (g) => {
        const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${g.appid}&count=15&maxlength=400&format=json`;
        try {
          const data = await httpGetJson(url, 8000);
          const items = data?.appnews?.newsitems || [];
          for (const it of items) {
            if (typeof it.date !== 'number' || it.date < cutoffSec) continue;
            // Strip Steam BBCode-ish tags and heavy HTML for the snippet
            const raw = String(it.contents || '');
            const articleImage = raw.match(/\[img](https?:\/\/[^\]\s]+)\[\/img]/i)?.[1]
              || raw.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i)?.[1]
              || '';
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
              id: `${g.appid}-${it.gid}`,
              platform: 'steam',
              gameId: g.gameId,
              appid: g.appid,
              gameName: g.name,
              title: it.title || '(untitled)',
              url: it.url,
              author: it.author || '',
              date: it.date * 1000,
              feedname: it.feedname || '',
              feedlabel: it.feedlabel || '',
              feed_type: typeof it.feed_type === 'number' ? it.feed_type : null,
              snippet,
              image: articleImage,
            });
          }
        } catch (err) {
          // per-game failure is fine — keep going
        }
      })
    );
  }
  out.sort((a, b) => b.date - a.date);
  STEAM_NEWS_CACHE = { ts: Date.now(), keyHash, items: out };
  return { ok: true, items: out, fetchedAt: Date.now(), cached: false };
});

// ---------------- Steam Manifest (local disk) ---------------- //
// Reads the appmanifest_<appid>.acf on disk for a single Steam appid, returns
// buildid + LastUpdated + SizeOnDisk. Used by GameDetail to display
// "Updated N days ago · Build 12345". Cached in-process for 5 min per appid.
const STEAM_MANIFEST_CACHE = new Map(); // appid -> { ts, data }
ipcMain.handle('steam:manifest', async (_e, appid) => {
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
});

// Read a small, local set of version files beside a selected game executable.
// This intentionally does not scan drives, unpack archives, or inspect process
// memory: it is only enough to make independent/repack version checks useful
// when a release build left its version in a readme, changelog, or file name.
function deriveInstalledVersionFromLocalGame(game = {}) {
  const exePath = String(game.exePath || '');
  if (!exePath || !path.isAbsolute(exePath)) return null;
  const roots = [path.dirname(exePath), path.dirname(path.dirname(exePath))];
  const candidates = [];
  const seen = new Set();
  for (const root of roots) {
    try {
      for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        if (candidates.length >= 24) break;
        if (!entry.isFile()) continue;
        const fullPath = path.join(root, entry.name);
        if (seen.has(fullPath)) continue;
        seen.add(fullPath);
        if (/^(?:version|changelog|patch|readme|release|notes|about|config|game).*\.(?:txt|md|nfo|html?|json|ini|cfg)$/i.test(entry.name)) candidates.push(fullPath);
      }
    } catch { /* inaccessible game folder is not an error */ }
  }
  const nameVersion = (value) => String(value || '').match(/(?:\bv(?:ersion)?\s*|[_\- ])(\d+(?:\.\d+){1,3}(?:[a-z]|\s*(?:alpha|beta|rc)\d*)?)(?=$|[_\- .])/i)?.[1];
  for (const file of candidates) {
    try {
      const text = fs.readFileSync(file, 'utf8').slice(0, 96_000);
      const match = text.match(/(?:\b(?:game\s+)?version|\bbuild)\s*(?:is|:|=|#|-|to)?\s*v?(\d+(?:\.\d+){1,3}(?:[a-z]|\s*(?:alpha|beta|rc)\d*)?)/i);
      if (match?.[1]) return { version: match[1].replace(/\s+/g, ''), evidence: path.basename(file) };
    } catch { /* skip unreadable/non-text files */ }
  }
  const fromExe = nameVersion(path.basename(exePath));
  return fromExe ? { version: fromExe, evidence: path.basename(exePath) } : null;
}

const INDEPENDENT_UPDATE_CACHE = new Map();

// Read-only update intelligence. NEO-LIB only reports an update as pending
// when the launcher's own manifest exposes concrete undownloaded bytes. Raw
// state flags are returned for diagnostics but never guessed into a warning.
ipcMain.handle('updates:scan', async (_e, { games = [] } = {}) => {
  const items = [];
  const needsSetup = [];
  const ledger = [];
  let checked = 0;
  const steamPath = defaultSteamPath();
  const libraries = steamPath ? readSteamLibraryFolders(steamPath) : [];
  for (const game of (games || []).slice(0, 1000)) {
    if (!game?.appid || !libraries.length) continue;
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
    checked += 1;
    const total = Number(manifest.bytesToDownload || 0);
    const downloaded = Number(manifest.bytesDownloaded || 0);
    const remainingBytes = total > downloaded ? total - downloaded : 0;
    if (remainingBytes <= 0) {
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
      stateFlags: Number(manifest.stateFlags || 0),
      status: downloaded > 0 ? 'downloading' : 'pending',
      actionUrl: `steam://downloads/`,
    };
    items.push(pendingItem);
    ledger.push({ id: game.id, status: pendingItem.status, source: 'Steam manifest', checkedAt: Date.now(), currentVersion: manifest.buildid || '' });
  }
  const versionParts = (value) => String(value || '').toLowerCase().replace(/^v/, '').match(/\d+/g)?.map(Number) || [];
  const compareVersions = (a, b) => {
    const aa = versionParts(a); const bb = versionParts(b);
    for (let i = 0; i < Math.max(aa.length, bb.length); i += 1) {
      const delta = (aa[i] || 0) - (bb[i] || 0);
      if (delta) return delta;
    }
    return 0;
  };
  // Independent games are checked in a small parallel queue. This lets the
  // startup scan cover a real library without opening a burst of requests or
  // serially holding it up behind one slow forum page.
  const independentCandidates = (games || []).slice(0, 500);
  const scanIndependent = async (game) => {
    if (items.some((entry) => entry.id === game.id)) return;
    const localVersion = game.installedVersion ? { version: String(game.installedVersion), evidence: 'saved game metadata' } : deriveInstalledVersionFromLocalGame(game);
    const sourceUrl = game.updateWatchUrl || game.website || '';
    if (!localVersion || !sourceUrl) {
      if (game.exePath || game.updateWatchUrl || game.website) {
        const missing = !localVersion ? 'installed version' : 'public update page';
        needsSetup.push({ id: game.id, name: game.name || 'Unnamed game', missing });
        ledger.push({ id: game.id, status: 'needs-evidence', source: 'Independent game', checkedAt: Date.now(), missing });
      }
      return;
    }
    let parsed;
    try { parsed = new URL(sourceUrl); } catch { return; }
    if (!['http:', 'https:'].includes(parsed.protocol)) return;
    const cacheKey = `${game.id}|${localVersion.version}|${parsed.toString()}`;
    const cached = INDEPENDENT_UPDATE_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < 15 * 60 * 1000) {
      checked += 1;
      if (cached.item) items.push({ ...cached.item });
      ledger.push({ id: game.id, status: cached.item ? 'available' : 'current', source: 'Independent source', checkedAt: Date.now(), currentVersion: localVersion.version, latestVersion: cached.item?.latestVersion || localVersion.version });
      return;
    }
    try {
      const html = await httpGetText(parsed.toString(), 9_000);
      const text = stripHtml(html).replace(/\s+/g, ' ').slice(0, 500_000);
      const matches = [];
      const pattern = /(?:\b(?:version|build)\s*(?:is|to|[:=#-])?\s*v?(\d+(?:\.\d+){1,3}[a-z]?)|\bv(\d+(?:\.\d+){1,3}[a-z]?))/gi;
      let match;
      while ((match = pattern.exec(text)) !== null && matches.length < 80) matches.push(match[1] || match[2]);
      const latestVersion = matches.sort((a, b) => compareVersions(b, a))[0];
      checked += 1;
      const foundUpdate = latestVersion && compareVersions(latestVersion, localVersion.version) > 0 ? {
        id: game.id,
        name: game.name,
        platform: 'Independent source',
        status: 'available',
        currentVersion: localVersion.version,
        latestVersion,
        actionUrl: parsed.toString(),
        sourceKind: 'watch-page',
        installedVersionEvidence: localVersion.evidence,
      } : null;
      INDEPENDENT_UPDATE_CACHE.set(cacheKey, { ts: Date.now(), item: foundUpdate });
      if (foundUpdate) items.push(foundUpdate);
      ledger.push({ id: game.id, status: foundUpdate ? 'available' : 'current', source: 'Independent source', checkedAt: Date.now(), currentVersion: localVersion.version, latestVersion: latestVersion || localVersion.version });
    } catch { /* inaccessible or protected page — do not create a false alert */ }
  };
  for (let start = 0; start < independentCandidates.length; start += 4) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(independentCandidates.slice(start, start + 4).map(scanIndependent));
  }
  return { ok: true, checked, items, needsSetup: needsSetup.slice(0, 20), ledger, scannedAt: Date.now(), confidence: 'launcher-manifest-and-local-version' };
});

ipcMain.handle('updates:history', async (_e, { url, currentVersion = '' } = {}) => {
  let parsed;
  try { parsed = new URL(url); } catch { return { ok: false, entries: [], error: 'Invalid update page URL.' }; }
  if (!['http:', 'https:'].includes(parsed.protocol)) return { ok: false, entries: [], error: 'Only public HTTP/HTTPS update pages are supported.' };
  try {
    const html = await httpGetText(parsed.toString());
    const textBody = stripHtml(html).replace(/\s+/g, ' ').slice(0, 700_000);
    const pattern = /(?:\b(?:version|build)\s*(?:is|to|[:=#-])?\s*v?(\d+(?:\.\d+){1,3}[a-z]?)|\bv(\d+(?:\.\d+){1,3}[a-z]?))/gi;
    const seen = new Set();
    const entries = [];
    let match;
    while ((match = pattern.exec(textBody)) !== null && entries.length < 30) {
      const version = match[1] || match[2];
      if (seen.has(version.toLowerCase())) continue;
      seen.add(version.toLowerCase());
      const before = textBody.slice(Math.max(0, match.index - 90), match.index);
      const after = textBody.slice(match.index + match[0].length, match.index + match[0].length + 260);
      const context = `${before} ${match[0]} ${after}`.trim();
      const date = context.match(/\b(?:20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+20\d{2})\b/i)?.[0] || '';
      entries.push({ version, date, summary: context.slice(0, 340), url: parsed.toString() });
    }
    const parts = (value) => String(value || '').toLowerCase().replace(/^v/, '').match(/\d+/g)?.map(Number) || [];
    const compare = (a, b) => {
      const aa = parts(a); const bb = parts(b);
      for (let i = 0; i < Math.max(aa.length, bb.length); i += 1) {
        const delta = (aa[i] || 0) - (bb[i] || 0);
        if (delta) return delta;
      }
      return 0;
    };
    entries.sort((a, b) => compare(b.version, a.version));
    return {
      ok: true,
      entries: entries.slice(0, 20).map((entry) => ({ ...entry, newerThanInstalled: currentVersion ? compare(entry.version, currentVersion) > 0 : null })),
      sourceUrl: parsed.toString(),
      currentVersion,
      fetchedAt: Date.now(),
    };
  } catch (error) {
    return { ok: false, entries: [], error: error?.message || 'Update history page could not be read.' };
  }
});

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
  const url = game.website || '';
  if (!/itch\.io/.test(url)) return [];
  const base = url.replace(/\/+$/, '').replace(/\/devlog(\.rss)?$/i, '');
  const rssUrl = `${base}/devlog.rss`;
  try {
    const xml = await httpGetText(rssUrl);
    const items = [];
    const re = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      const block = m[1];
      const title = stripHtml((block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
      const link = ((block.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '').trim();
      const pub = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
      const desc = stripHtml((block.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '');
      const image = (block.match(/<media:content[^>]+url=["'](https?:\/\/[^"']+)["']/i) || [])[1]
        || (block.match(/<enclosure[^>]+url=["'](https?:\/\/[^"']+)["']/i) || [])[1]
        || (block.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i) || [])[1]
        || '';
      const dateMs = pub ? Date.parse(pub) : 0;
      if (!dateMs || dateMs < cutoffMs) continue;
      items.push({
        id: `itch-${game.id}-${link || title}`,
        platform: 'itch',
        gameId: game.id,
        gameName: game.name,
        gameUrl: url,
        title: title || '(untitled devlog)',
        url: link || url,
        author: '',
        date: dateMs,
        snippet: desc.slice(0, 320),
        image,
      });
    }
    return items;
  } catch {
    return [];
  }
}

// ---------------- GOG changelog (public product JSON) ---------------- //
// GOG exposes each product's changelog as an HTML blob via api.gog.com. The
// blob typically contains `<h4>YYYY-MM-DD</h4><p>notes</p>` sections; we parse
// per-date sections and treat each as a news item.
async function fetchGogChangelog(game, cutoffMs) {
  const gid = game.gogId;
  if (!gid) return [];
  const url = `https://api.gog.com/products/${gid}?expand=changelog&locale=en-US`;
  try {
    const data = await httpGetJson(url, 8000);
    const html = String(data?.changelog || '');
    if (!html) return [];
    // Split on <h1..h6> headings that look like dates OR contain a parseable
    // date fragment (e.g. "Internal Update (30 March 2018)", "1.2.3 - 2024-05-01").
    const re = /<h[1-6][^>]*>\s*([^<]{4,80}?)\s*<\/h[1-6]>([\s\S]*?)(?=<h[1-6][^>]*>|$)/g;
    const items = [];
    let m;
    while ((m = re.exec(html)) !== null) {
      const rawHeading = stripHtml(m[1]);
      const body = stripHtml(m[2]).slice(0, 320);
      // Try to parse a date from the heading. Look for common formats.
      // 1) ISO/US: 2024-05-01, 2024/05/01, 05-01-2024
      // 2) Long: "1 May 2024", "May 1 2024", "May 1, 2024"
      // 3) With parens/prefix: "Update (30 March 2018)", "Patch 1.5 - 2024-05-01"
      let dateMs = 0;
      const iso = rawHeading.match(/\b(20\d{2}|19\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
      if (iso) {
        const [, y, mo, d] = iso;
        const ms = Date.parse(`${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`);
        if (Number.isFinite(ms)) dateMs = ms;
      }
      if (!dateMs) {
        const long = rawHeading.match(/\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(20\d{2}|19\d{2})\b/i);
        if (long) {
          const ms = Date.parse(`${long[1]} ${long[2]} ${long[3]}`);
          if (Number.isFinite(ms)) dateMs = ms;
        }
      }
      if (!dateMs) {
        // Fallback: try raw heading (works for pure "2024-05-01" or "May 1, 2024")
        const ms = Date.parse(rawHeading);
        if (Number.isFinite(ms)) dateMs = ms;
      }
      if (!dateMs || dateMs < cutoffMs) continue;
      items.push({
        id: `gog-${game.id}-${dateMs}`,
        platform: 'gog',
        gameId: game.id,
        gameName: game.name,
        title: `Patch notes · ${rawHeading}`,
        url: game.website || `https://www.gog.com/game/${gid}`,
        author: '',
        date: dateMs,
        snippet: body,
      });
    }
    return items;
  } catch {
    return [];
  }
}

// ---------------- Unified news fetch ---------------- //
// Wraps Steam + itch + GOG into one call. Cached 30 min by input signature.
let NEWS_ALL_CACHE = { ts: 0, keyHash: '', payload: null };
ipcMain.handle('news:fetchAll', async (_e, { games = [], days = 14, force = false } = {}) => {
  const arr = Array.isArray(games) ? games : [];
  const steamList = arr.filter((g) => g && g.appid);
  const itchList  = arr.filter((g) => g && /itch\.io/.test(g.website || '') || (g && g.source === 'itch'));
  const gogList   = arr.filter((g) => g && g.gogId);

  const keyHash = JSON.stringify({
    s: steamList.map((g) => g.appid).sort(),
    i: itchList.map((g) => g.website).sort(),
    g: gogList.map((g) => g.gogId).sort(),
    days,
  });
  const THIRTY_MIN = 30 * 60 * 1000;
  if (!force && NEWS_ALL_CACHE.keyHash === keyHash && Date.now() - NEWS_ALL_CACHE.ts < THIRTY_MIN) {
    return { ok: true, ...NEWS_ALL_CACHE.payload, fetchedAt: NEWS_ALL_CACHE.ts, cached: true };
  }
  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;

  const counts = { steam: 0, itch: 0, gog: 0 };
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

  out.sort((a, b) => b.date - a.date);
  const payload = {
    items: out,
    counts,
    sources: {
      steam: steamList.length,
      itch: itchList.length,
      gog: gogList.length,
    },
  };
  NEWS_ALL_CACHE = { ts: Date.now(), keyHash, payload };
  return { ok: true, ...payload, fetchedAt: Date.now(), cached: false };
});


// ---------------- Latest news for one game ---------------- //
// Compact IPC used by GameDetail's "Latest news" blinking pill.
// Returns AT MOST one item (the newest across all sources for that game),
// scoped to the last 30 days. Per-game 15-minute cache.
const LATEST_NEWS_CACHE = new Map(); // gameKey -> { ts, item }
ipcMain.handle('news:latestForGame', async (_e, game) => {
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

  results.sort((a, b) => b.date - a.date);
  const item = results[0] || null;
  LATEST_NEWS_CACHE.set(key, { ts: Date.now(), item });
  return { ok: true, item, cached: false };
});


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

ipcMain.handle('steam:importPlaytime', async (_e, { force = false } = {}) => {
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
    const dayKey = today.toISOString().slice(0, 10); // YYYY-MM-DD
    let history = {};
    if (fs.existsSync(playtimeHistoryFile())) {
      try { history = JSON.parse(fs.readFileSync(playtimeHistoryFile(), 'utf8')); } catch { history = {}; }
    }
    if (!history.byAppid) history.byAppid = {};
    for (const [appid, rec] of Object.entries(merged)) {
      if (!history.byAppid[appid]) history.byAppid[appid] = {};
      history.byAppid[appid][dayKey] = Number(rec.playtime) || 0;
      // Prune per-appid entries older than 400 days
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 400);
      const cutoffKey = cutoff.toISOString().slice(0, 10);
      for (const k of Object.keys(history.byAppid[appid])) {
        if (k < cutoffKey) delete history.byAppid[appid][k];
      }
    }
    history.lastSnapshotAt = Date.now();
    fs.writeFileSync(playtimeHistoryFile(), JSON.stringify(history));
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
});


// v1.6.4 — Playtime history reader. Returns per-appid delta hours (in minutes)
// over the last N days. Renderer uses this to power Stats "Most played · This
// week" ranking correctly (Steam only stores lifetime totals).
ipcMain.handle('playtime:history', async (_e, { days = 7 } = {}) => {
  try {
    if (!fs.existsSync(playtimeHistoryFile())) return { ok: true, deltas: {}, lastSnapshotAt: 0 };
    const history = JSON.parse(fs.readFileSync(playtimeHistoryFile(), 'utf8')) || {};
    const byAppid = history.byAppid || {};
    // Find the oldest snapshot key ON OR BEFORE `days` ago per appid. Delta =
    // latestSnapshot - baselineSnapshot. If no baseline (game not tracked
    // that far back), report 0 so the row shows "no recent playtime" instead
    // of hallucinating hours.
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days); cutoff.setHours(0, 0, 0, 0);
    const cutoffKey = cutoff.toISOString().slice(0, 10);
    const deltas = {};
    for (const [appid, dayMap] of Object.entries(byAppid)) {
      const keys = Object.keys(dayMap).sort(); // ascending YYYY-MM-DD
      if (keys.length === 0) continue;
      const latestKey = keys[keys.length - 1];
      const latestVal = Number(dayMap[latestKey]) || 0;
      // Baseline = latest key that is <= cutoffKey. If none (first ever
      // record is AFTER cutoff), fall back to the earliest key we have —
      // that's when tracking started, so delta = latest - earliest.
      let baselineVal = null;
      for (const k of keys) {
        if (k <= cutoffKey) baselineVal = Number(dayMap[k]) || 0;
        else break;
      }
      if (baselineVal === null) baselineVal = Number(dayMap[keys[0]]) || 0;
      const delta = Math.max(0, latestVal - baselineVal);
      if (delta > 0) deltas[appid] = delta;
    }
    return { ok: true, deltas, lastSnapshotAt: history.lastSnapshotAt || 0 };
  } catch (e) {
    return { ok: false, error: String(e?.message || e), deltas: {} };
  }
});
