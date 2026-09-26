const fs = require('node:fs/promises');
const path = require('node:path');
const blankTheme = require('./blank-theme.json');
const { validateThemeGif } = require('./validate-theme-gif.cjs');
const { validateThemeWebm, MAX_WEBM_BYTES } = require('./validate-theme-webm.cjs');

const LAYERS = ['canvas', 'atmosphere', 'sidebar', 'decoration', 'navigationFrame', 'navigationFlourish', 'controlFrame'];
const PALETTE = ['ink', 'muted', 'accent', 'accent2', 'accentSoft', 'hairlineGlow', 'grad1', 'grad2', 'accentText', 'accent2Text'];
const PANELS = ['surface', 'panel', 'border'];
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', webm: 'video/webm' };
const MAX_MANIFEST = 32 * 1024;
const MAX_ASSET = 2 * 1024 * 1024;
const MAX_PACKAGE = 12 * 1024 * 1024;

function imageLooksValid(bytes, ext) {
  if (ext === 'png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (ext === 'jpg' || ext === 'jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('Theme manifest must be an object.');
  if (manifest.schemaVersion !== 1) throw new Error('Unsupported theme format version.');
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(manifest.id || '')) throw new Error('Theme ID must be a lowercase slug.');
  if (typeof manifest.name !== 'string' || !manifest.name.trim() || manifest.name.length > 80) throw new Error('Theme name must be 1–80 characters.');
  if (!['bright', 'middle', 'dark', 'special'].includes(manifest.tone)) throw new Error('Invalid theme tone.');
  const rgb = value => Array.isArray(value) && value.length === 3 && value.every(n => Number.isInteger(n) && n >= 0 && n <= 255);
  for (const key of PALETTE) if (!rgb(manifest.palette?.[key])) throw new Error(`Invalid palette.${key}.`);
  for (const key of PANELS) if (!rgb(manifest.panels?.[key])) throw new Error(`Invalid panels.${key}.`);
  const assets = new Set();
  let animatedLayers = 0;
  for (const name of LAYERS) {
    const layer = manifest.layers?.[name];
    if (!layer || !['none', 'gradient', 'image', 'gif', 'video'].includes(layer.type)) throw new Error(`Invalid layers.${name}. Unsupported artwork type.`);
    if (layer.type === 'gradient' && (!['grad1', 'grad2'].includes(layer.from) || !['grad1', 'grad2'].includes(layer.to))) throw new Error(`Invalid gradient in layers.${name}.`);
    if (layer.type === 'image') {
      if (typeof layer.asset !== 'string' || !/^assets\/[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp)$/i.test(layer.asset)) throw new Error(`Invalid image path in layers.${name}.`);
      assets.add(layer.asset);
    }
    if (layer.type === 'gif') {
      animatedLayers += 1;
      if (!['atmosphere', 'canvas'].includes(name) || typeof layer.asset !== 'string' || !/^assets\/[a-z0-9][a-z0-9._-]*\.gif$/i.test(layer.asset)
        || !['once', 'always', 'while-visible'].includes(layer.loop)
        || typeof layer.reducedMotionAsset !== 'string' || !/^assets\/[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp)$/i.test(layer.reducedMotionAsset)) throw new Error('Canvas/atmosphere GIF needs an embedded loop and a local still fallback.');
      assets.add(layer.asset);
      assets.add(layer.reducedMotionAsset);
    }
    if (layer.type === 'video') {
      animatedLayers += 1;
      if (!['atmosphere', 'canvas'].includes(name) || typeof layer.asset !== 'string' || !/^assets\/[a-z0-9][a-z0-9._-]*\.webm$/i.test(layer.asset)
        || !['once', 'always', 'while-visible'].includes(layer.loop)
        || typeof layer.reducedMotionAsset !== 'string' || !/^assets\/[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp)$/i.test(layer.reducedMotionAsset)) throw new Error('Canvas/atmosphere video needs a WebM file, playback rule and local still fallback.');
      assets.add(layer.asset);
      assets.add(layer.reducedMotionAsset);
    }
    if (layer.opacity !== undefined && (!Number.isFinite(layer.opacity) || layer.opacity < 0 || layer.opacity > 1)) throw new Error(`Invalid opacity in layers.${name}.`);
  }
  if (animatedLayers > 1) throw new Error('Choose either Canvas or Atmosphere for animation, not both.');
  if (!['calm', 'normal', 'energetic'].includes(manifest.motion?.cadence) || manifest.motion?.reducedMotion !== 'still') throw new Error('Invalid motion rules.');
  if (manifest.effects !== undefined) {
    const emitters = manifest.effects?.particles;
    if (!manifest.effects || typeof manifest.effects !== 'object' || Array.isArray(manifest.effects) || !Array.isArray(emitters) || emitters.length > 3) throw new Error('At most three particle emitters are allowed.');
    const seen = new Set();
    for (const emitter of emitters) {
      if (!emitter || typeof emitter !== 'object' || Array.isArray(emitter) || !/^[a-z0-9][a-z0-9-]{0,31}$/.test(emitter.id || '') || seen.has(emitter.id)) throw new Error('Particle emitters need unique lowercase IDs.');
      seen.add(emitter.id);
      if (typeof emitter.asset !== 'string' || !/^assets\/[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp)$/i.test(emitter.asset)) throw new Error('Particle artwork must be a local PNG, JPG or WebP image.');
      if (!Number.isInteger(emitter.count) || emitter.count < 1 || emitter.count > 24 || !Number.isInteger(emitter.sizePx) || emitter.sizePx < 4 || emitter.sizePx > 80) throw new Error('Particle count or size is outside the safe range.');
      if (!Number.isFinite(emitter.opacity) || emitter.opacity < 0.05 || emitter.opacity > 1 || !Number.isFinite(emitter.durationSeconds) || emitter.durationSeconds < 5 || emitter.durationSeconds > 60) throw new Error('Particle opacity or duration is outside the safe range.');
      if (!['rise', 'fall', 'drift'].includes(emitter.direction)) throw new Error('Particle direction must be rise, fall or drift.');
      if (emitter.placement !== undefined && !['full', 'start', 'middle', 'end'].includes(emitter.placement)) throw new Error('Particle placement is invalid.');
      if (emitter.depth !== undefined && !['near', 'far'].includes(emitter.depth)) throw new Error('Particle depth is invalid.');
      if (emitter.rotation !== undefined && (!Number.isInteger(emitter.rotation) || emitter.rotation < -180 || emitter.rotation > 180)) throw new Error('Particle rotation must be -180–180 degrees.');
      if (emitter.glow !== undefined && (!Number.isInteger(emitter.glow) || emitter.glow < 0 || emitter.glow > 20)) throw new Error('Particle glow must be 0–20 pixels.');
      if (emitter.reaction !== undefined && !['ambient', 'launch', 'celebrate'].includes(emitter.reaction)) throw new Error('Particle reaction must be ambient, launch or celebrate.');
      assets.add(emitter.asset);
    }
  }
  if (typeof manifest.license?.name !== 'string' || !manifest.license.name.trim() || typeof manifest.license?.attribution !== 'string' || !manifest.license.attribution.trim()) throw new Error('License and attribution are required.');
  if (['css', 'script', 'javascript'].some(key => Object.hasOwn(manifest, key))) throw new Error('Custom CSS and scripts are not supported.');
  return [...assets];
}

function createCustomThemeService({ root, reservedIds = [] }) {
  const targetRoot = () => root();
  async function readPackage(manifestPath, includeData = false) {
    if (typeof manifestPath !== 'string' || path.basename(manifestPath).toLowerCase() !== 'theme.json') throw new Error('Select a theme.json file.');
    const stat = await fs.lstat(manifestPath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_MANIFEST) throw new Error('Theme manifest is not a regular, bounded file.');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const assets = validateManifest(manifest);
    if (reservedIds.includes(manifest.id)) throw new Error('A built-in theme already uses this ID.');
    const source = path.dirname(manifestPath);
    let bytes = stat.size;
    const files = [];
    const assetUrls = {};
    for (const asset of assets) {
      const file = path.join(source, asset);
      const folderStat = await fs.lstat(path.dirname(file));
      const fileStat = await fs.lstat(file);
      const ext = path.extname(file).slice(1).toLowerCase();
      if (!folderStat.isDirectory() || folderStat.isSymbolicLink() || !fileStat.isFile() || fileStat.isSymbolicLink() || fileStat.size > (ext === 'webm' ? MAX_WEBM_BYTES : MAX_ASSET)) throw new Error(`Invalid or oversized artwork: ${asset}`);
      bytes += fileStat.size;
      if (bytes > MAX_PACKAGE) throw new Error('Theme package exceeds 12 MB.');
      const data = await fs.readFile(file);
      if (ext === 'gif') {
        const gif = validateThemeGif(data);
        for (const name of ['canvas', 'atmosphere']) {
          const layer = manifest.layers[name];
          if (layer.type !== 'gif' || layer.asset !== asset) continue;
          if (layer.loop === 'once' && gif.durationMs > 20_000) throw new Error('One-shot GIFs must finish within 20 seconds.');
          layer.playbackMs = gif.durationMs;
        }
      }
      else if (ext === 'webm') validateThemeWebm(data);
      else if (!imageLooksValid(data, ext)) throw new Error(`Artwork does not match its file type: ${asset}`);
      files.push({ asset, file, bytes: data.length });
      if (includeData) assetUrls[asset] = `data:${MIME[ext]};base64,${data.toString('base64')}`;
    }
    return { manifest, files, bytes, assetUrls };
  }
  async function inspect(manifestPath) {
    try {
      const item = await readPackage(manifestPath, true);
      const previewLayer = item.manifest.layers.atmosphere.asset ? item.manifest.layers.atmosphere : item.manifest.layers.canvas;
      const previewAsset = previewLayer.type === 'video' ? previewLayer.reducedMotionAsset : previewLayer.asset || item.files[0]?.asset;
      return { ok: true, manifest: item.manifest, assetCount: item.files.length, bytes: item.bytes, previewUrl: item.assetUrls[previewAsset] || '' };
    } catch (error) { return { ok: false, error: error.message }; }
  }
  async function install(manifestPath) {
    try {
      const item = await readPackage(manifestPath);
      await fs.mkdir(targetRoot(), { recursive: true });
      const destination = path.join(targetRoot(), item.manifest.id);
      try { await fs.lstat(destination); throw new Error('This theme is already installed.'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      const staging = path.join(targetRoot(), `.install-${item.manifest.id}-${process.pid}-${Date.now()}`);
      try {
        await fs.mkdir(path.join(staging, 'assets'), { recursive: true });
        await fs.copyFile(manifestPath, path.join(staging, 'theme.json'));
        for (const file of item.files) await fs.copyFile(file.file, path.join(staging, file.asset));
        await readPackage(path.join(staging, 'theme.json'));
        await fs.rename(staging, destination); // Refuse an existing ID; never overwrite a user's theme.
      } finally { await fs.rm(staging, { recursive: true, force: true }); }
      return { ok: true, id: item.manifest.id };
    } catch (error) { return { ok: false, error: error.code === 'EEXIST' ? 'This theme is already installed.' : error.message }; }
  }
  async function fork(request) {
    try {
      const { sourceId, newId, newName, creator, tone, particles, palette, panels, layers } = request || {};
      if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(sourceId || '') || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(newId || '') || sourceId === newId || reservedIds.includes(newId)) throw new Error('Choose a new lowercase theme ID.');
      if (typeof newName !== 'string' || !newName.trim() || newName.length > 80 || typeof creator !== 'string' || !creator.trim() || creator.length > 80) throw new Error('Theme name and creator credit are required.');
      if (!Array.isArray(particles) || particles.length > 3) throw new Error('Choose at most three particle emitters.');
      const source = sourceId === 'blank-starter'
        ? { manifest: blankTheme, files: [] }
        : await readPackage(path.join(targetRoot(), sourceId, 'theme.json'));
      if (source.manifest.id !== sourceId) throw new Error('Source theme identity is invalid.');
      const existing = new Set(source.files.map(file => file.asset));
      const added = [];
      const artwork = {};
      for (const name of LAYERS) {
        const copy = { ...(layers?.[name] || source.manifest.layers[name]) };
        if (copy.sourcePath) {
          const ext = path.extname(copy.sourcePath).slice(1).toLowerCase();
          if (copy.type === 'gif' ? !['atmosphere', 'canvas'].includes(name) || ext !== 'gif' : copy.type === 'video' ? !['atmosphere', 'canvas'].includes(name) || ext !== 'webm' : copy.type !== 'image' || !['png', 'jpg', 'jpeg', 'webp'].includes(ext)) throw new Error('Choose a still image, canvas/atmosphere GIF or WebM.');
          copy.asset = `assets/remix-${newId}-${name}.${ext}`;
          added.push({ file: copy.sourcePath, asset: copy.asset });
        } else if (['image', 'gif', 'video'].includes(copy.type) && !existing.has(copy.asset)) throw new Error(`Artwork for ${name} does not belong to the source theme.`);
        if (['gif', 'video'].includes(copy.type) && copy.reducedMotionSourcePath) {
          const ext = path.extname(copy.reducedMotionSourcePath).slice(1).toLowerCase();
          if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) throw new Error('Choose a PNG, JPG or WebP still fallback.');
          copy.reducedMotionAsset = `assets/remix-${newId}-${name}-still.${ext}`;
          added.push({ file: copy.reducedMotionSourcePath, asset: copy.reducedMotionAsset });
        } else if (['gif', 'video'].includes(copy.type) && !existing.has(copy.reducedMotionAsset)) throw new Error('Animation fallback does not belong to the source theme.');
        delete copy.sourcePath;
        delete copy.reducedMotionSourcePath;
        delete copy.previewUrl;
        delete copy.fallbackPreviewUrl;
        if (!['image', 'gif', 'video'].includes(copy.type)) delete copy.asset;
        if (!['gif', 'video'].includes(copy.type)) { delete copy.reducedMotionAsset; delete copy.loop; }
        artwork[name] = copy;
      }
      const emitters = particles.map(emitter => {
        const copy = { ...emitter };
        if (copy.sourcePath) {
          const ext = path.extname(copy.sourcePath).slice(1).toLowerCase();
          if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext) || !/^[a-z0-9][a-z0-9-]{0,31}$/.test(copy.id || '')) throw new Error('Choose a local PNG, JPG or WebP particle image.');
          copy.asset = `assets/remix-${newId}-${copy.id}.${ext}`;
          added.push({ file: copy.sourcePath, asset: copy.asset });
          delete copy.sourcePath;
        } else if (!existing.has(copy.asset)) throw new Error('Particle image does not belong to the source theme.');
        return copy;
      });
      const attribution = sourceId === 'blank-starter' ? creator.trim() : `${source.manifest.license.attribution} · Remix: ${creator.trim()}`;
      const manifest = { ...source.manifest, id: newId, name: newName.trim(), tone: tone || source.manifest.tone,
        palette: palette || source.manifest.palette, panels: panels || source.manifest.panels, layers: artwork,
        license: { ...source.manifest.license, attribution }, effects: { particles: emitters } };
      const referenced = new Set(validateManifest(manifest));
      await fs.mkdir(targetRoot(), { recursive: true });
      const destination = path.join(targetRoot(), newId);
      try { await fs.lstat(destination); throw new Error('This theme ID is already installed.'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      const staging = path.join(targetRoot(), `.remix-${newId}-${process.pid}-${Date.now()}`);
      try {
        await fs.mkdir(path.join(staging, 'assets'), { recursive: true });
        for (const file of source.files) if (referenced.has(file.asset)) await fs.copyFile(file.file, path.join(staging, file.asset));
        for (const entry of added) {
          const stat = await fs.lstat(entry.file);
          const ext = path.extname(entry.file).slice(1).toLowerCase();
          if (!stat.isFile() || stat.isSymbolicLink() || stat.size > (ext === 'webm' ? MAX_WEBM_BYTES : MAX_ASSET)) throw new Error('Theme artwork is invalid or too large.');
          const data = await fs.readFile(entry.file);
          if (ext === 'gif') validateThemeGif(data);
          else if (ext === 'webm') validateThemeWebm(data);
          else if (!imageLooksValid(data, ext)) throw new Error('Theme artwork does not match its file type.');
          await fs.writeFile(path.join(staging, entry.asset), data, { flag: 'wx' });
        }
        await fs.writeFile(path.join(staging, 'theme.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
        await readPackage(path.join(staging, 'theme.json'));
        await fs.rename(staging, destination);
      } finally { await fs.rm(staging, { recursive: true, force: true }); }
      return { ok: true, id: newId };
    } catch (error) { return { ok: false, error: error.message }; }
  }
  async function list() {
    const themes = [];
    try {
      for (const entry of await fs.readdir(targetRoot(), { withFileTypes: true })) {
        if (!entry.isDirectory() || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(entry.name)) continue;
        try {
          const item = await readPackage(path.join(targetRoot(), entry.name, 'theme.json'), true);
          if (item.manifest.id === entry.name) themes.push({ manifest: item.manifest, assetUrls: item.assetUrls });
        } catch { /* A tampered or incomplete package is never activated. */ }
      }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    return { ok: true, themes };
  }
  return { inspect, install, fork, list };
}

module.exports = { createCustomThemeService, validateManifest };
