const MAX_MANIFEST_BYTES = 64 * 1024;
const MAX_PACKAGE_FILES = 500;
const MAX_PACKAGE_BYTES = 64 * 1024 * 1024;
const PACKAGE_ID = /^[a-z0-9](?:[a-z0-9.-]{1,78}[a-z0-9])?$/;
const SAFE_PERMISSIONS = new Set(['storage', 'library.read', 'network']);

function text(value, max, required = false) {
  return typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0);
}

function safeRelativePath(value) {
  return text(value, 240, true) && !value.includes('..') && !value.includes('\\') && !value.startsWith('/') && !value.startsWith('.') && /^[a-zA-Z0-9_./-]+$/.test(value);
}

function normalizeManifest(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (raw.formatVersion !== 1 || !text(raw.id, 80, true) || !PACKAGE_ID.test(raw.id)) return null;
  if (!text(raw.name, 120, true) || !text(raw.description || '', 1600)) return null;
  const author = typeof raw.author === 'string' ? { name: raw.author } : raw.author;
  if (!author || typeof author !== 'object' || !text(author.name, 120, true) || !text(author.url || '', 2048)) return null;
  if (!text(raw.version, 80, true) || !safeRelativePath(raw.entry || 'index.html')) return null;
  const layout = raw.layout || {};
  const keys = ['minCols', 'minRows', 'defaultCols', 'defaultRows'];
  if (!keys.every((key) => Number.isInteger(layout[key]) && layout[key] >= 1 && layout[key] <= 12)) return null;
  if (layout.defaultCols < layout.minCols || layout.defaultRows < layout.minRows) return null;
  const permissions = Array.isArray(raw.permissions) ? raw.permissions : [];
  if (permissions.length > 3 || !permissions.every((permission) => SAFE_PERMISSIONS.has(permission))) return null;
  return Object.freeze({
    formatVersion: 1,
    id: raw.id,
    name: raw.name.trim(),
    description: String(raw.description || '').trim(),
    author: Object.freeze({ name: author.name.trim(), url: String(author.url || '').trim() }),
    version: raw.version.trim(),
    entry: raw.entry || 'index.html',
    layout: Object.freeze({ minCols: layout.minCols, minRows: layout.minRows, defaultCols: layout.defaultCols, defaultRows: layout.defaultRows }),
    permissions: Object.freeze([...permissions]),
  });
}

function createWidgetPackageService({ fsp, path, widgetsDir, now = () => Date.now() }) {
  if (!fsp?.readFile || !fsp?.readdir || !fsp?.mkdir || !fsp?.copyFile || !fsp?.access || !fsp?.rm || !path?.join || typeof widgetsDir !== 'function') {
    throw new TypeError('createWidgetPackageService requires filesystem, path and widgetsDir.');
  }

  async function readManifest(manifestPath) {
    try {
      const info = await fsp.stat(manifestPath);
      if (!info.isFile() || info.size > MAX_MANIFEST_BYTES || path.basename(manifestPath).toLowerCase() !== 'widget.json') return null;
      return normalizeManifest(JSON.parse(await fsp.readFile(manifestPath, 'utf8')));
    } catch { return null; }
  }

  async function copyPackage(sourceRoot, destination) {
    let files = 0;
    let bytes = 0;
    async function copyFolder(from, to) {
      await fsp.mkdir(to, { recursive: true });
      const entries = await fsp.readdir(from, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isSymbolicLink()) throw new Error('Widget packages cannot contain symbolic links.');
        const source = path.join(from, entry.name);
        const target = path.join(to, entry.name);
        if (entry.isDirectory()) await copyFolder(source, target);
        else if (entry.isFile()) {
          const info = await fsp.stat(source);
          files += 1;
          bytes += info.size;
          if (files > MAX_PACKAGE_FILES || bytes > MAX_PACKAGE_BYTES) throw new Error('Widget package is too large.');
          await fsp.copyFile(source, target);
        }
      }
    }
    await copyFolder(sourceRoot, destination);
  }

  async function install(manifestPath) {
    const manifest = await readManifest(manifestPath);
    if (!manifest) return { ok: false, error: 'Choose a valid widget.json package manifest.' };
    const sourceRoot = path.dirname(manifestPath);
    const entryPath = path.join(sourceRoot, manifest.entry);
    try {
      const entryInfo = await fsp.stat(entryPath);
      if (!entryInfo.isFile()) return { ok: false, error: 'The widget entry file is missing.' };
      const root = widgetsDir();
      const target = path.join(root, manifest.id);
      try { await fsp.access(target); return { ok: false, code: 'ALREADY_INSTALLED', error: 'This widget is already installed. Remove it before importing this version.' }; } catch { /* expected */ }
      const staging = path.join(root, `.install-${manifest.id}-${now()}`);
      await fsp.mkdir(root, { recursive: true });
      try {
        await copyPackage(sourceRoot, staging);
        await fsp.rename(staging, target);
      } catch (error) {
        await fsp.rm(staging, { recursive: true, force: true }).catch(() => {});
        throw error;
      }
      return { ok: true, widget: { ...manifest, installedAt: now(), status: 'installed-awaiting-host' } };
    } catch (error) { return { ok: false, error: error?.message || 'Widget package could not be imported.' }; }
  }

  async function list() {
    const widgets = [];
    try {
      await fsp.mkdir(widgetsDir(), { recursive: true });
      const entries = await fsp.readdir(widgetsDir(), { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.isSymbolicLink() || entry.name.startsWith('.')) continue;
        const manifest = await readManifest(path.join(widgetsDir(), entry.name, 'widget.json'));
        if (!manifest || manifest.id !== entry.name) continue;
        const info = await fsp.stat(path.join(widgetsDir(), entry.name));
        widgets.push({ ...manifest, installedAt: Number(info.birthtimeMs || info.mtimeMs || 0), status: 'installed-awaiting-host' });
      }
    } catch { /* unavailable local widget folder remains empty */ }
    return widgets.sort((a, b) => a.name.localeCompare(b.name));
  }

  return Object.freeze({ install, list, readManifest });
}

module.exports = { createWidgetPackageService, normalizeManifest };
