const fs = require('fs/promises');
const path = require('path');
const { fileURLToPath } = require('url');

function validProfile(value) {
  const bounded = (number, min, max) => Number.isFinite(number) && number >= min && number <= max;
  return value?.version === 1 && bounded(value.width, 1, 100000) && bounded(value.height, 1, 100000)
    && bounded(value.area?.x, 0, 100) && bounded(value.area?.y, 0, 100) && bounded(value.area?.strength, 0, 1)
    && (value.area.color === undefined || (Array.isArray(value.area.color) && value.area.color.length === 3 && value.area.color.every(n => bounded(n, 0, 255))))
    && Array.isArray(value.brightness) && value.brightness.length === 144 && value.brightness.every(n => bounded(n, 0, 255))
    && Array.isArray(value.color) && value.color.length === 3 && value.color.every(n => bounded(n, 0, 255));
}

// One sidecar per app-owned image. Renderer-supplied paths can never address
// arbitrary files, symlinks, subdirectories, or the user's original artwork.
async function backgroundProfile(root, url, profile) {
  try {
    if (typeof url !== 'string' || url.length > 2048) return null;
    const selected = fileURLToPath(url);
    const canonicalRoot = await fs.realpath(root);
    const canonicalFile = await fs.realpath(selected);
    if (path.dirname(canonicalFile) !== canonicalRoot || !/^[\da-f-]{36}\.(png|jpe?g|webp|gif|apng|mp4|m4v|webm|mov|ogv)$/i.test(path.basename(canonicalFile))) return null;
    const stats = await fs.stat(canonicalFile);
    if (!stats.isFile()) return null;
    const sidecar = canonicalFile + '.lighting.json';
    const identity = { bytes: stats.size, modified: stats.mtimeMs };
    if (profile !== undefined) {
      if (!validProfile(profile)) return null;
      const clean = { version: 1, width: profile.width, height: profile.height, area: { x: profile.area.x, y: profile.area.y, strength: profile.area.strength, ...(profile.area.color ? { color: profile.area.color } : {}) }, brightness: profile.brightness, color: profile.color };
      // Atomic replacement; never follow a pre-existing sidecar symlink.
      const temporary = sidecar + '.' + require('crypto').randomUUID() + '.tmp';
      try {
        await fs.writeFile(temporary, JSON.stringify({ ...clean, identity }), { flag: 'wx' });
        await fs.rename(temporary, sidecar);
      } finally { await fs.unlink(temporary).catch(() => {}); }
      return clean;
    }
    const sidecarStats = await fs.lstat(sidecar);
    if (!sidecarStats.isFile() || sidecarStats.isSymbolicLink() || sidecarStats.size > 16384) return null;
    const saved = JSON.parse(await fs.readFile(sidecar, 'utf8'));
    if (!validProfile(saved) || saved.identity?.bytes !== identity.bytes || saved.identity?.modified !== identity.modified) return null;
    return { version: 1, width: saved.width, height: saved.height, area: saved.area, brightness: saved.brightness, color: saved.color };
  } catch { return null; }
}

module.exports = { backgroundProfile, validProfile };
