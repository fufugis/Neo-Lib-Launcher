import { CHANGELOG } from './changelog-content.mjs';
import { V189_CHANGELOG } from './v189-changelog.mjs';
import { V1810_CHANGELOG } from './v1810-changelog.mjs';

export const releaseVersion = value => String(value || '').replace(/^v/i, '');
const parts = value => /^\d+\.\d+\.\d+$/.test(releaseVersion(value)) ? releaseVersion(value).split('.').map(Number) : null;
const compare = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };
export function releaseSections(entry = {}) {
  return [
    { title: 'Highlights', items: Array.isArray(entry.major) ? entry.major : [] },
    { title: null, items: Array.isArray(entry.items) ? entry.items : [] },
    { title: 'Fixes', items: Array.isArray(entry.fixes) ? entry.fixes : [] },
  ].map(section => ({ ...section, items: section.items.filter(item => typeof item === 'string' && item.trim() || item && typeof item.title === 'string' && typeof item.body === 'string') })).filter(section => section.items.length);
}

// The primary checkout can intentionally lag isolated published hotfixes. Keep
// their verified notes available for future builds without changing its version
// or showing a newer release as if this older installed build already included it.
export function recentReleaseNotes(currentVersion, entries = [...CHANGELOG, V189_CHANGELOG, V1810_CHANGELOG]) {
  const installed = parts(currentVersion), unique = new Map();
  for (const entry of entries) {
    const version = parts(entry?.version);
    if (!version || entry.unreleased || installed && compare(version, installed) > 0 || !releaseSections(entry).length) continue;
    const id = releaseVersion(entry.version);
    if (!unique.has(id)) unique.set(id, { ...entry, version: id });
  }
  return [...unique.values()].sort((a, b) => compare(parts(b.version), parts(a.version))).slice(0, 5);
}
