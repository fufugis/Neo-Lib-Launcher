// Pure helpers shared by the refresh picker and its regression tests.
import { cleanDescriptionText } from './descriptionFormatting.mjs';
import { appendArtworkRevision, artworkSnapshot, normalizeArtworkLocks } from './artwork-revision-model.mjs';

const imageUrl = (value) => typeof value === 'string' && /^(https?:|file:|data:image\/)/i.test(value);
const normalizedTitle = (value) => String(value || '').replace(/[™®©]/g, '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function matchesCoverTitle(query, candidate, game = {}) {
  if (game.appid && candidate?.source === 'steam' && String(candidate.appid || candidate.id || '') === String(game.appid)) return true;
  const expected = normalizedTitle(query);
  return Boolean(expected && expected === normalizedTitle(candidate?.name));
}

export function fieldCandidates(record, field) {
  if (!record) return [];
  const base = { source: record.source || 'Metadata provider', name: record.name || 'Untitled', record };
  if (field === 'all-locked') return [{ ...base, value: record, key: JSON.stringify(record) }];
  if (field === 'description') {
    const value = record.about || record.shortDescription;
    return value ? [{ ...base, value, key: value }] : [];
  }
  if (field === 'cover') {
    const value = record.portraitImage || record.capsuleImage || record.coverUrl;
    const dimensions = String(value || '').match(/(?:^|[^\d])(\d{2,4})[x×](\d{2,4})(?:[^\d]|$)/i);
    const knownLandscape = dimensions && Number(dimensions[1]) >= Number(dimensions[2]);
    return imageUrl(value) && !knownLandscape ? [{ ...base, value, key: value }] : [];
  }
  if (field === 'artwork') {
    const values = [record.portraitImage, record.capsuleImage, record.icon, record.headerImage, record.background, record.logoImage || record.logo].filter(imageUrl);
    return values.length ? [{ ...base, value: record, key: JSON.stringify(values) }] : [];
  }
  const values = field === 'icon' ? [record.icon, record.portraitImage, record.capsuleImage, record.headerImage]
    : field === 'banner' ? [record.background, record.headerImage, record.capsuleImage]
    : (record.screenshots || []);
  return [...new Set(values.filter(imageUrl))].map(value => ({ ...base, value, key: value }));
}
export function selectedRefreshPatch(field, candidates, game = {}) {
  if (!candidates.length) return {};
  const { value, record } = candidates[0];
  if (field === 'cover') {
    const locks = normalizeArtworkLocks(game.artworkLocks);
    if (locks.cover) return {};
    return {
      artworkRevisions: appendArtworkRevision(game.artworkRevisions, artworkSnapshot(game, { reason: 'before-cover-art-review' })),
      coverUrl: value,
      portraitImage: value,
      artworkSources: { ...(game.artworkSources || {}), cover: record.source || 'Artwork review' },
    };
  }
  if (field === 'icon') return { icon: value };
  if (field === 'banner') return { headerImage: value, background: value };
  if (field === 'description') return { about: cleanDescriptionText(value), shortDescription: cleanDescriptionText(record.shortDescription || value) };
  if (field === 'screenshots') return { screenshots: candidates.map(c => c.value) };
  if (field === 'artwork') {
    const locks = normalizeArtworkLocks(game.artworkLocks);
    const source = record.source || 'Metadata review';
    const patch = {
      artworkRevisions: appendArtworkRevision(game.artworkRevisions, artworkSnapshot(game, { reason: 'before-collection-artwork-review' })),
      artworkSources: { ...(game.artworkSources || {}) },
    };
    const cover = record.portraitImage || record.capsuleImage;
    if (!locks.cover && cover) { patch.portraitImage = cover; patch.coverUrl = cover; patch.artworkSources.cover = source; }
    if (!locks.icon && record.icon) { patch.icon = record.icon; patch.artworkSources.icon = source; }
    if (!locks.hero && record.headerImage) { patch.headerImage = record.headerImage; patch.artworkSources.hero = source; }
    if (!locks.background && (record.background || record.headerImage)) { patch.background = record.background || record.headerImage; patch.artworkSources.background = source; }
    if (!locks.logo && (record.logoImage || record.logo)) { patch.logoImage = record.logoImage || record.logo; patch.artworkSources.logo = source; }
    return patch;
  }
  // A normal refresh never changes the installed game's identity or launch data.
  const patch = {};
  for (const key of ['about', 'shortDescription', 'headerImage', 'background', 'screenshots', 'genres', 'genreTags', 'developers', 'publishers', 'releaseDate', 'website', 'metacritic']) {
    const v = key === 'about' || key === 'shortDescription' ? cleanDescriptionText(record[key]) : record[key];
    if (v != null && v !== '' && (!Array.isArray(v) || v.length)) patch[key] = v;
  }
  // A wide header is useful as a hero, but not a fabricated portrait case cover.
  const cover = record.portraitImage || record.capsuleImage;
  if (record.portraitImage) patch.portraitImage = record.portraitImage;
  if (cover) { patch.coverUrl = cover; patch.icon = record.icon || cover; }
  return patch;
}

export function createRefreshSearch(api, game, field, options = {}, verifyCover = async () => true) {
  const found = [], seen = new Set(), checked = new Set(), failures = [];
  const query = options.query || game.metadataQuery || game.name;
  const native = [game.launcher, game.source].find(source => ['itch', 'itchio', 'gog', 'f95zone', 'vndb', 'dlsite', 'jast', 'gamejolt', 'ryuugames'].includes(source));
  const sources = [...new Set([native === 'itchio' ? 'itch' : native || 'steam', 'steam', 'gog', ...(options.steamGridDbKey ? ['steamgriddb'] : []), 'google'])];
  const pending = [];
  let initial = true;
  const add = async (record, cancelled) => {
    if (field === 'cover' && !matchesCoverTitle(query, record, game)) return;
    for (const candidate of fieldCandidates(record, field)) {
      if (cancelled() || seen.has(candidate.key) || checked.has(candidate.key)) continue;
      checked.add(candidate.key);
      if (field === 'cover') {
        let verifiedUrl = '';
        try {
          const result = await verifyCover(candidate.value);
          verifiedUrl = typeof result === 'string' ? result : result ? candidate.value : '';
        } catch { /* Unavailable image is not a usable suggestion. */ }
        if (!verifiedUrl) {
          if (!failures.includes('Unavailable or non-portrait cover images were skipped.')) failures.push('Unavailable or non-portrait cover images were skipped.');
          continue;
        }
        candidate.value = verifiedUrl;
        candidate.key = verifiedUrl;
        if (seen.has(candidate.key)) continue;
      }
      seen.add(candidate.key);
      found.push(candidate);
    }
  };
  const bounded = async fn => {
    let timer;
    try { return await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Source timed out')), 15000); })]); }
    catch (error) { failures.push(error.message || 'Source unavailable'); return null; }
    finally { clearTimeout(timer); }
  };
  return {
    async next(limit = 5, cancelled = () => false) {
      if (initial) {
        initial = false;
        await add(await bounded(() => api.fetchMetadata({ query, launcher: game.launcher || '', launcherProductId: game.launcherProductId || '', lockedAppid: game.launcher === 'battlenet' || options.forceSearch ? null : game.appid || null, force: true, ...options })), cancelled);
      }
      // Each click does bounded work; no background crawl through the entire catalogue.
      let expansions = 0;
      while (!cancelled() && found.length < limit && expansions < (field === 'cover' ? 8 : 5)) {
        if (!pending.length) {
          if (!sources.length) break;
          const source = sources.shift();
          const result = await bounded(() => api.listCandidates({ source, query }));
          if (result?.error) failures.push(`${source}: ${result.error}`);
          pending.push(...(result?.candidates || []).filter(candidate => field !== 'cover' || matchesCoverTitle(query, candidate, game)));
          if (!pending.length) continue;
        }
        const candidate = pending.shift();
        expansions++;
        await add(await bounded(() => api.expandCandidate({ candidate })), cancelled);
      }
      return { candidates: [...found], more: pending.length > 0 || sources.length > 0, failures: [...failures] };
    },
  };
}
