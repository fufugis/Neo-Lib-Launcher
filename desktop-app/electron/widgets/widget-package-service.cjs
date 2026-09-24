const MAX_MANIFEST_BYTES = 64 * 1024;
const MAX_ENTRY_BYTES = 2 * 1024 * 1024;
const MAX_RUNTIME_BYTES = 5 * 1024 * 1024;
const MAX_PACKAGE_FILES = 500;
const MAX_PACKAGE_BYTES = 64 * 1024 * 1024;
const WIDGET_API_VERSION = 1;
const PACKAGE_ID = /^[a-z0-9](?:[a-z0-9.-]{1,78}[a-z0-9])?$/;
const SAFE_PERMISSIONS = new Set(['storage', 'library.read', 'network']);
const BLOCKED_EXTENSIONS = new Set(['.exe', '.dll', '.node', '.msi', '.bat', '.cmd', '.ps1', '.com', '.scr', '.vbs', '.jar']);

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
  if (!text(raw.version, 80, true) || !/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i.test(raw.version.trim()) || !safeRelativePath(raw.entry || 'index.html')) return null;
  const apiVersion = raw.apiVersion == null ? 1 : raw.apiVersion;
  if (!Number.isInteger(apiVersion) || apiVersion < 1 || apiVersion > 99) return null;
  const layout = raw.layout || {};
  const keys = ['minCols', 'minRows', 'defaultCols', 'defaultRows'];
  if (!keys.every((key) => Number.isInteger(layout[key]) && layout[key] >= 1 && layout[key] <= 12)) return null;
  if (layout.defaultCols < layout.minCols || layout.defaultRows < layout.minRows) return null;
  const permissions = Array.isArray(raw.permissions) ? [...new Set(raw.permissions)] : [];
  if (permissions.length > 3 || !permissions.every((permission) => SAFE_PERMISSIONS.has(permission))) return null;
  return Object.freeze({
    formatVersion: 1, apiVersion, id: raw.id, name: raw.name.trim(), description: String(raw.description || '').trim(),
    author: Object.freeze({ name: author.name.trim(), url: String(author.url || '').trim() }), version: raw.version.trim(),
    entry: raw.entry || 'index.html',
    layout: Object.freeze({ minCols: layout.minCols, minRows: layout.minRows, defaultCols: layout.defaultCols, defaultRows: layout.defaultRows }),
    permissions: Object.freeze(permissions),
  });
}

function compareVersions(left, right) {
  const parts = value => String(value || '').split(/[.-]/).slice(0, 3).map(part => Number(part) || 0);
  const a = parts(left); const b = parts(right);
  for (let index = 0; index < 3; index += 1) if (a[index] !== b[index]) return a[index] - b[index];
  return 0;
}

function createWidgetPackageService({ fsp, path, widgetsDir, now = () => Date.now() }) {
  if (!fsp?.readFile || !fsp?.readdir || !fsp?.mkdir || !fsp?.copyFile || !fsp?.access || !fsp?.rm || !fsp?.rename || !path?.join || typeof widgetsDir !== 'function') {
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
    let files = 0; let bytes = 0;
    async function copyFolder(from, to) {
      await fsp.mkdir(to, { recursive: true });
      const entries = await fsp.readdir(from, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isSymbolicLink()) throw new Error('Widget packages cannot contain symbolic links.');
        const source = path.join(from, entry.name); const target = path.join(to, entry.name);
        if (entry.isDirectory()) await copyFolder(source, target);
        else if (entry.isFile()) {
          if (BLOCKED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) throw new Error(`Widget packages cannot contain ${path.extname(entry.name)} files.`);
          const info = await fsp.stat(source); files += 1; bytes += info.size;
          if (files > MAX_PACKAGE_FILES || bytes > MAX_PACKAGE_BYTES) throw new Error('Widget package is too large.');
          await fsp.copyFile(source, target);
        }
      }
    }
    await copyFolder(sourceRoot, destination);
  }

  const decorate = (manifest, installedAt) => ({ ...manifest, installedAt, status: manifest.apiVersion === WIDGET_API_VERSION ? 'ready-disabled' : 'incompatible', compatible: manifest.apiVersion === WIDGET_API_VERSION });

  async function inspectSource(manifestPath) {
    const manifest = await readManifest(manifestPath);
    if (!manifest) return { error: 'Choose a valid widget.json package manifest.' };
    if (manifest.apiVersion !== WIDGET_API_VERSION) return { error: `This widget needs API v${manifest.apiVersion}; NEO-LIB supports v${WIDGET_API_VERSION}.` };
    const sourceRoot = path.dirname(manifestPath); const entryPath = path.join(sourceRoot, manifest.entry);
    try {
      const entryInfo = await fsp.stat(entryPath);
      if (!entryInfo.isFile() || path.extname(entryPath).toLowerCase() !== '.html' || entryInfo.size > MAX_ENTRY_BYTES) return { error: 'The widget entry must be an HTML file smaller than 2 MB.' };
      return { manifest, sourceRoot };
    } catch { return { error: 'The widget entry file is missing.' }; }
  }

  async function install(manifestPath, { replace = false } = {}) {
    const inspected = await inspectSource(manifestPath);
    if (!inspected.manifest) return { ok: false, error: inspected.error };
    const { manifest, sourceRoot } = inspected;
    try {
      const root = widgetsDir(); const target = path.join(root, manifest.id); let existing = null;
      try { existing = await readManifest(path.join(target, 'widget.json')); } catch { /* absent */ }
      if (existing && !replace) {
        const newer = compareVersions(manifest.version, existing.version) > 0;
        return { ok: false, code: newer ? 'UPDATE_REVIEW_REQUIRED' : 'ALREADY_INSTALLED', error: newer ? `Review ${existing.version} → ${manifest.version} before updating.` : 'This widget version is already installed.', widget: decorate(manifest, now()), currentVersion: existing.version };
      }
      if (existing && replace && compareVersions(manifest.version, existing.version) <= 0) return { ok: false, error: 'An update must have a newer semantic version.' };
      const staging = path.join(root, `.install-${manifest.id}-${now()}`); const backup = path.join(root, `.backup-${manifest.id}-${now()}`);
      await fsp.mkdir(root, { recursive: true });
      try {
        await copyPackage(sourceRoot, staging);
        if (existing) await fsp.rename(target, backup);
        await fsp.rename(staging, target);
      } catch (error) {
        await fsp.rm(staging, { recursive: true, force: true }).catch(() => {});
        try { await fsp.access(backup); await fsp.rename(backup, target); } catch { /* no rollback needed */ }
        throw error;
      }
      return { ok: true, widget: decorate(manifest, now()), replacedVersion: existing?.version || '' };
    } catch (error) { return { ok: false, error: error?.message || 'Widget package could not be imported.' }; }
  }

  async function list() {
    const widgets = []; const recoverable = [];
    try {
      await fsp.mkdir(widgetsDir(), { recursive: true });
      const entries = await fsp.readdir(widgetsDir(), { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
        const removed = entry.name.startsWith('.removed-');
        if (entry.name.startsWith('.') && !removed) continue;
        const manifest = await readManifest(path.join(widgetsDir(), entry.name, 'widget.json'));
        if (!manifest || (!removed && manifest.id !== entry.name)) continue;
        const info = await fsp.stat(path.join(widgetsDir(), entry.name));
        (removed ? recoverable : widgets).push(decorate(manifest, Number(info.birthtimeMs || info.mtimeMs || 0)));
      }
    } catch { /* unavailable local widget folder remains empty */ }
    return { widgets: widgets.sort((a, b) => a.name.localeCompare(b.name)), recoverable: recoverable.sort((a, b) => b.installedAt - a.installedAt) };
  }

  async function runtime(id) {
    if (!PACKAGE_ID.test(String(id || ''))) return { ok: false, error: 'Invalid widget identity.' };
    const manifest = await readManifest(path.join(widgetsDir(), id, 'widget.json'));
    if (!manifest || manifest.id !== id || manifest.apiVersion !== WIDGET_API_VERSION) return { ok: false, error: 'This widget is missing or incompatible.' };
    try {
      const entry = path.join(widgetsDir(), id, manifest.entry); const info = await fsp.stat(entry);
      if (!info.isFile() || info.size > MAX_ENTRY_BYTES) throw new Error();
      const root = path.join(widgetsDir(), id);
      let html = await fsp.readFile(entry, 'utf8');
      const asset = async (relative, encoding) => {
        if (!safeRelativePath(relative)) return null;
        const assetPath = path.resolve(root, relative);
        if (!assetPath.startsWith(root + path.sep)) return null;
        const assetInfo = await fsp.lstat(assetPath);
        if (!assetInfo.isFile() || assetInfo.isSymbolicLink() || assetInfo.size > MAX_ENTRY_BYTES) return null;
        return fsp.readFile(assetPath, encoding);
      };
      const substitute = async (pattern, convert) => {
        const matches = [...html.matchAll(pattern)];
        for (const match of matches) {
          const replacement = await convert(match).catch(() => null);
          if (replacement != null) html = html.replace(match[0], replacement);
        }
      };
      await substitute(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi, async (match) => {
        if (path.extname(match[1]).toLowerCase() !== '.js') return null;
        const body = await asset(match[1], 'utf8');
        return body == null ? null : `<script>${body.replace(/<\/script/gi, '<\\/script')}</script>`;
      });
      await substitute(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi, async (match) => {
        if (path.extname(match[1]).toLowerCase() !== '.css') return null;
        const body = await asset(match[1], 'utf8');
        return body == null ? null : `<style>${body.replace(/<\/style/gi, '<\\/style')}</style>`;
      });
      const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
      await substitute(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi, async (match) => {
        const type = mime[path.extname(match[1]).toLowerCase()];
        if (!type) return null;
        const body = await asset(match[1]);
        return body == null ? null : match[0].replace(match[1], `data:${type};base64,${body.toString('base64')}`);
      });
      if (Buffer.byteLength(html, 'utf8') > MAX_RUNTIME_BYTES) return { ok: false, error: 'The widget entry and assets exceed the 5 MB runtime limit.' };
      return { ok: true, widget: decorate(manifest, Number(info.birthtimeMs || info.mtimeMs || 0)), html };
    } catch { return { ok: false, error: 'The widget entry could not be loaded.' }; }
  }

  async function remove(id) {
    if (!PACKAGE_ID.test(String(id || ''))) return { ok: false, error: 'Invalid widget identity.' };
    const source = path.join(widgetsDir(), id); const manifest = await readManifest(path.join(source, 'widget.json'));
    if (!manifest || manifest.id !== id) return { ok: false, error: 'Widget is not installed.' };
    const destination = path.join(widgetsDir(), `.removed-${id}-${now()}`);
    try { await fsp.rename(source, destination); return { ok: true, id, recoverable: true }; } catch { return { ok: false, error: 'Widget could not be removed safely.' }; }
  }

  async function restore(id) {
    if (!PACKAGE_ID.test(String(id || ''))) return { ok: false, error: 'Invalid widget identity.' };
    try {
      try { await fsp.access(path.join(widgetsDir(), id)); return { ok: false, error: 'Remove the installed copy before restoring.' }; } catch { /* expected */ }
      const entries = await fsp.readdir(widgetsDir(), { withFileTypes: true });
      const matches = entries.filter(entry => entry.isDirectory() && entry.name.startsWith(`.removed-${id}-`)).sort((a, b) => b.name.localeCompare(a.name));
      if (!matches.length) return { ok: false, error: 'No recoverable copy was found.' };
      await fsp.rename(path.join(widgetsDir(), matches[0].name), path.join(widgetsDir(), id));
      return { ok: true, id };
    } catch { return { ok: false, error: 'Widget recovery failed.' }; }
  }

  return Object.freeze({ install, update: manifestPath => install(manifestPath, { replace: true }), list, runtime, remove, restore, readManifest });
}

module.exports = { WIDGET_API_VERSION, createWidgetPackageService, normalizeManifest };
