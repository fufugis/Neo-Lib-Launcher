/* Electron Main Process
 * - Creates main window with custom frame
 * - Persists library + settings as JSON in userData
 * - Provides IPC for file picker, exe icon extraction, drive scan,
 *   Steam Store metadata fetch, and game launching.
 */
const { app, BrowserWindow, ipcMain, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const { spawn } = require('child_process');
const https = require('https');

const isDev = process.env.NODE_ENV === 'development';

// ---------------- Paths ---------------- //
const dataDir = () => app.getPath('userData');
const libraryFile = () => path.join(dataDir(), 'library.json');
const settingsFile = () => path.join(dataDir(), 'settings.json');
const coversDir = () => path.join(dataDir(), 'covers');

async function ensureDirs() {
  await fsp.mkdir(coversDir(), { recursive: true });
}

// ---------------- HTTP helpers ---------------- //
function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'GameLibrary/1.0' } }, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
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
async function writeJson(filePath, data) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ---------------- Window ---------------- //
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0a0a0c',
    title: 'Game Library',
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
}

app.whenReady().then(async () => {
  await ensureDirs();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
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
  readJson(settingsFile(), { theme: 'midnight', firstRun: true })
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
ipcMain.handle('game:launch', async (_e, exePath) => {
  try {
    if (process.platform === 'win32') {
      const child = spawn(exePath, [], {
        detached: true,
        stdio: 'ignore',
        cwd: path.dirname(exePath),
      });
      child.unref();
      return { ok: true };
    }
    const err = await shell.openPath(exePath);
    return { ok: !err, error: err || undefined };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

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

async function walkDir(dir, depth, maxDepth, accum, maxFiles) {
  if (depth > maxDepth || accum.length >= maxFiles) return;
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
      await walkDir(full, depth + 1, maxDepth, accum, maxFiles);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.exe')) {
      if (isLikelyGameExe(entry.name)) {
        accum.push(full);
      }
    }
  }
}

ipcMain.handle('scan:directory', async (_e, root) => {
  if (!root) return [];
  const found = [];
  await walkDir(root, 0, 5, found, 1500);

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
    .replace(/\b(v?\d+(\.\d+)+|\d{4})\b/g, ' ')
    .replace(/\b(setup|installer|launcher|client|game|win64|win32|x64|x86|steam|epic|gog|repack|deluxe|ultimate|edition|crack|crackfix)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
