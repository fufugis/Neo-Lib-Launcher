function createLaunchDoctorService({ fs, fsp, path, walkDir }) {
  if (typeof fs?.existsSync !== 'function' || typeof fsp?.stat !== 'function' || typeof path?.dirname !== 'function' || typeof walkDir !== 'function') throw new TypeError('createLaunchDoctorService requires filesystem, path and walkDir.');
  async function inspect({ exePath, gameName } = {}) {
    const result = { ok: true, configuredPath: exePath || '', exists: false, candidates: [], notes: [] };
    try {
      if (!exePath || typeof exePath !== 'string') { result.notes.push('No launch executable is configured for this game.'); return result; }
      result.exists = (await fsp.stat(exePath)).isFile();
    } catch { result.notes.push('The configured executable could not be found. It may have moved, the drive may be disconnected, or security software may have quarantined it.'); }
    if (!result.exists) result.notes.push('Check the game folder and your antivirus quarantine before choosing a replacement executable.');
    const root = path.dirname(exePath || '');
    const found = [];
    if (root && fs.existsSync(root)) {
      await walkDir(root, 0, 2, found, 40, []);
      const tokens = String(gameName || '').toLowerCase().split(/[^a-z0-9]+/).filter(value => value.length >= 3);
      result.candidates = found.filter(candidate => candidate !== exePath).map(candidate => ({ path: candidate, matchScore: tokens.filter(token => path.basename(candidate).toLowerCase().includes(token)).length })).sort((a, b) => b.matchScore - a.matchScore || a.path.localeCompare(b.path)).slice(0, 12);
    }
    if (result.exists && result.candidates.length === 0) result.notes.push('The configured file exists. A launcher, DRM client, missing dependency, or the game itself closing immediately may still be responsible.');
    return result;
  }
  return Object.freeze({ inspect });
}
module.exports = { createLaunchDoctorService };
