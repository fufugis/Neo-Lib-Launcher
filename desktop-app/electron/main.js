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

function createWindow() {
  const { screen } = require('electron');
  const primary = screen.getPrimaryDisplay().workAreaSize;
  // Start at 70% of the user's screen, centred
  const w = Math.max(960, Math.round(primary.width * 0.70));
  const h = Math.max(600, Math.round(primary.height * 0.70));
  mainWindow = new BrowserWindow({
    width: w,
    height: h,
    minWidth: 960,
    minHeight: 600,
    center: true,
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

ipcMain.handle('game:launch', async (_e, { exePath, launchArgs, gameId } = {}) => {
  if (!exePath || typeof exePath !== 'string') {
    return { ok: false, error: 'No exePath provided' };
  }
  try {
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
      child.on('exit', () => {
        const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        runningGames.delete(gameId || exePath);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('game:exited', { gameId, exePath, seconds });
        }
      });
      child.on('error', () => runningGames.delete(gameId || exePath));
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

ipcMain.handle('scan:directory', async (_e, root, excludes = []) => {
  if (!root) return [];
  const found = [];
  await walkDir(root, 0, 5, found, 1500, excludes);

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
function httpGetText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return resolve(httpGetText(res.headers.location));
          }
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => resolve(body));
        }
      )
      .on('error', reject);
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

ipcMain.handle('app:openContainingDir', async (_e, p) => {
  if (!p) return;
  const dir = path.dirname(p);
  await shell.openPath(dir);
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

ipcMain.handle('metadata:auto', async (_e, { query, skipSources = [], geminiKey, lockedAppid }) => {
  // If a lockedAppid is provided, skip search entirely and just refresh that exact entry
  if (lockedAppid) {
    try {
      const det = await httpGetJson(
        `https://store.steampowered.com/api/appdetails?appids=${lockedAppid}&l=en&cc=us`
      );
      const entry = det && det[lockedAppid];
      if (entry && entry.success) {
        const d = entry.data;
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
          developers: d.developers || [],
          publishers: d.publishers || [],
          releaseDate: d.release_date ? d.release_date.date : '',
          metacritic: d.metacritic ? d.metacritic.score : null,
          website: d.website || '',
        };
      }
    } catch { /* fall through to normal search */ }
  }
  const term = cleanSearchTerm(query);
  if (!term) return null;

  // 0. Curated launcher-exclusives (LoL, Fortnite, Valorant, Minecraft, etc.) — instant, no network
  const curated = curatedMatch(term);
  if (curated) return curated;

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

  // 5. Web fallback (DuckDuckGo → Google) — tries the full term first, then
  //    progressively simplified variants. Many indie games have parenthetical
  //    version tags / build numbers in their folder names that throw off search.
  const variants = [term];
  const simpler = term
    .replace(/[\(\[].*?[\)\]]/g, '')      // strip "(v1.2)" / "[demo]"
    .replace(/\b(?:v?\d+(?:\.\d+)+|build\s*\d+|demo|alpha|beta)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (simpler && simpler !== term && simpler.length >= 3) variants.push(simpler);
  // Last-resort: drop everything after the first 3 words
  const words = simpler.split(/\s+/).filter(Boolean);
  if (words.length > 3) variants.push(words.slice(0, 3).join(' '));

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
/* LAUNCHER DETECTOR — checks if Steam/Epic/EA/etc are running    */
/* via tasklist. Called from renderer every few minutes.          */
/* ============================================================ */
ipcMain.handle('launcher:detect', async () => {
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
        rockstar: lc.includes('rockstargameslauncher.exe') || lc.includes('rockstargames.launcher.exe'),
      });
    });
  });
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
    for (const s of specials.slice(0, 8)) {
      if (!s.discount_percent || s.discount_percent < 25) continue;
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

  DEALS_CACHE = { ts: Date.now(), items };
  return items;
});

