/**
 * Update checker — pings GitHub Releases API on app launch.
 *
 * Returns { available: boolean, latestVersion, currentVersion, releaseUrl }.
 *
 * Caches the result in localStorage for 6 hours so we don't hammer the GitHub API
 * (60 req/hour unauthenticated — would be impolite to spend that here).
 */
const CACHE_KEY = 'neolib:updateCheck';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const REPO = 'fufugis/Neo-Lib-Launcher';
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const RELEASES_PAGE = `https://github.com/${REPO}/releases/latest`;

function parseVersion(v) {
  if (!v) return [0, 0, 0];
  return String(v).replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
}

function isNewer(latest, current) {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false; // equal
}

export async function checkForUpdates(currentVersion, { force = false } = {}) {
  // Cached?
  if (!force) {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Date.now() - cached.ts < CACHE_TTL_MS && cached.currentVersion === currentVersion) {
          return cached.result;
        }
      }
    } catch { /* ignore */ }
  }

  try {
    const res = await fetch(API_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error('GitHub API ' + res.status);
    const data = await res.json();
    const latestVersion = (data.tag_name || '').replace(/^v/i, '');
    const result = {
      available: isNewer(latestVersion, currentVersion),
      latestVersion,
      currentVersion,
      releaseUrl: data.html_url || RELEASES_PAGE,
      publishedAt: data.published_at,
    };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), currentVersion, result }));
    } catch { /* localStorage full / disabled — ignore */ }
    return result;
  } catch {
    return { available: false, latestVersion: '', currentVersion, releaseUrl: RELEASES_PAGE, error: true };
  }
}

export const RELEASES_URL = RELEASES_PAGE;
