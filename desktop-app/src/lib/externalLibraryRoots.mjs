const WINDOWS_FOLDER = /^(?:[a-z]:\\|\\\\[^\\]+\\[^\\]+)(?:.*)$/i;
const ROOT_KINDS = new Set(['local', 'removable', 'network', 'cloud']);

function safeCloudLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}

export function normalizeExternalLibraryRoots(value) {
  const seen = new Set();
  return (Array.isArray(value) ? value : []).slice(0, 30).flatMap((entry) => {
    const kind = ROOT_KINDS.has(entry?.kind) ? entry.kind : 'local';
    const location = String(entry?.location || '').trim().slice(0, 1024);
    const folder = location.replace(/\//g, '\\');
    const valid = kind === 'cloud' ? safeCloudLink(location) : WINDOWS_FOLDER.test(folder) && !/(?:^|\\)\.\.?(?:\\|$)/.test(folder) && !folder.includes('\0');
    const key = `${kind}:${location.replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase()}`;
    if (!valid || seen.has(key)) return [];
    seen.add(key);
    return [{
      id: String(entry?.id || '').replace(/[^a-z0-9-]/gi, '-').slice(0, 64) || `root-${seen.size}`,
      name: String(entry?.name || 'Library root').trim().slice(0, 80) || 'Library root',
      kind, location, private: entry?.private !== false,
    }];
  });
}

export function externalRootForGame(game, roots) {
  const path = String(game?.exePath || '').replace(/\//g, '\\').toLowerCase();
  if (!WINDOWS_FOLDER.test(path)) return null;
  return normalizeExternalLibraryRoots(roots)
    .filter((root) => root.kind !== 'cloud')
    .filter((root) => {
      const location = root.location.replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();
      return path === location || path.startsWith(`${location}\\`);
    })
    .sort((left, right) => right.location.length - left.location.length)[0] || null;
}
