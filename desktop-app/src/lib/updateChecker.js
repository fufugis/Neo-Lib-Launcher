/**
 * Update checker — used on app launch and hourly while awake or in soft idle.
 *
 * Returns { available: boolean, latestVersion, currentVersion, releaseUrl }.
 *
 * Caches the result in localStorage for 1 hour so we don't hammer the GitHub API
 * (60 req/hour unauthenticated — would be impolite to spend that here).
 */
const CACHE_KEY = 'neolib:updateCheck';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

import { isNewerVersion, normalizeVersion } from './update-version.mjs';

const REPO = 'fufugis/Neo-Lib-Launcher';
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const RELEASES_PAGE = `https://github.com/${REPO}/releases/latest`;

function releaseResult(data, currentVersion) {
  const tag = String(data?.tag_name || '');
  if (data?.draft || data?.prerelease || !/^(?:v\.?)?\d+\.\d+\.\d+$/i.test(tag)) throw new Error('Not a stable versioned release');
  const latestVersion = normalizeVersion(tag);
  const expectedDownload = `https://github.com/${REPO}/releases/download/${encodeURIComponent(tag)}/NEO-LIB-Setup.exe`;
  const installer = Array.isArray(data.assets) && data.assets.find(asset => asset?.name === 'NEO-LIB-Setup.exe'
    && asset.browser_download_url === expectedDownload && Number(asset.size) > 0);
  return { schemaVersion: 2, available: isNewerVersion(latestVersion, currentVersion), latestVersion, currentVersion,
    releaseTag: tag, releaseUrl: `https://github.com/${REPO}/releases/tag/${encodeURIComponent(tag)}`,
    downloadUrl: installer ? expectedDownload : '', publishedAt: typeof data.published_at === 'string' ? data.published_at.slice(0, 100) : '' };
}

export async function checkForUpdates(currentVersion, { force = false } = {}) {
  // Cached?
  if (!force) {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Number.isFinite(cached.ts) && cached.ts <= Date.now() && Date.now() - cached.ts < CACHE_TTL_MS
          && cached.currentVersion === currentVersion && cached.result?.schemaVersion === 2) {
          // Reconstruct trusted links and version comparison, never open arbitrary cached URLs.
          return releaseResult({ tag_name: cached.result.releaseTag, published_at: cached.result.publishedAt,
            assets: cached.result.downloadUrl ? [{ name: 'NEO-LIB-Setup.exe', browser_download_url: cached.result.downloadUrl, size: 1 }] : [] }, currentVersion);
        }
      }
    } catch { /* ignore */ }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(API_URL, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer',
    });
    if (!res.ok) throw new Error('GitHub API ' + res.status);
    const data = await res.json();
    const result = releaseResult(data, currentVersion);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), currentVersion, result }));
    } catch { /* localStorage full / disabled — ignore */ }
    return result;
  } catch {
    return { available: false, latestVersion: '', currentVersion, releaseUrl: RELEASES_PAGE, error: true };
  } finally { clearTimeout(timeout); }
}

export const RELEASES_URL = RELEASES_PAGE;
