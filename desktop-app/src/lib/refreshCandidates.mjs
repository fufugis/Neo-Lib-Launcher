// Pure helpers shared by the refresh picker and its regression tests.
const imageUrl = (value) => typeof value === 'string' && /^(https?:|file:|data:image\/)/i.test(value);
export function fieldCandidates(record, field) {
  if (!record) return [];
  const base = { source: record.source || 'Metadata provider', name: record.name || 'Untitled', record };
  if (field === 'all-locked') return [{ ...base, value: record, key: JSON.stringify(record) }];
  if (field === 'description') {
    const value = record.about || record.shortDescription;
    return value ? [{ ...base, value, key: value }] : [];
  }
  const values = field === 'icon' ? [record.icon, record.capsuleImage, record.headerImage]
    : field === 'banner' ? [record.background, record.headerImage, record.capsuleImage]
    : (record.screenshots || []);
  return [...new Set(values.filter(imageUrl))].map(value => ({ ...base, value, key: value }));
}
export function selectedRefreshPatch(field, candidates) {
  if (!candidates.length) return {};
  const { value, record } = candidates[0];
  if (field === 'icon') return { icon: value, coverUrl: value };
  if (field === 'banner') return { headerImage: value, background: value };
  if (field === 'description') return { about: value, shortDescription: record.shortDescription || value };
  if (field === 'screenshots') return { screenshots: candidates.map(c => c.value) };
  // A normal refresh never changes the installed game's identity or launch data.
  const patch = {};
  for (const key of ['about', 'shortDescription', 'headerImage', 'background', 'screenshots', 'genres', 'genreTags', 'developers', 'publishers', 'releaseDate', 'website', 'metacritic']) {
    const v = record[key];
    if (v != null && v !== '' && (!Array.isArray(v) || v.length)) patch[key] = v;
  }
  const cover = record.capsuleImage || record.headerImage || record.icon;
  if (cover) { patch.coverUrl = cover; patch.icon = record.icon || cover; }
  return patch;
}

export function createRefreshSearch(api, game, field, options = {}) {
  const found = [], seen = new Set(), failures = [];
  const native = [game.launcher, game.source].find(source => ['itch', 'itchio', 'gog', 'f95zone', 'vndb', 'dlsite', 'ryuugames'].includes(source));
  const sources = [...new Set([native === 'itchio' ? 'itch' : native || 'steam', 'steam', 'gog', 'google'])];
  const pending = [];
  let initial = true;
  const add = record => fieldCandidates(record, field).forEach(c => { if (!seen.has(c.key)) { seen.add(c.key); found.push(c); } });
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
        add(await bounded(() => api.fetchMetadata({ query: options.query || game.name, launcher: game.launcher || '', launcherProductId: game.launcherProductId || '', lockedAppid: game.launcher === 'battlenet' || options.forceSearch ? null : game.appid || null, force: true, ...options })));
      }
      // Each click does bounded work; no background crawl through the entire catalogue.
      let expansions = 0;
      while (!cancelled() && found.length < limit && expansions < 5) {
        if (!pending.length) {
          if (!sources.length) break;
          const source = sources.shift();
          const result = await bounded(() => api.listCandidates({ source, query: options.query || game.name }));
          if (result?.error) failures.push(`${source}: ${result.error}`);
          pending.push(...(result?.candidates || []));
          if (!pending.length) continue;
        }
        const candidate = pending.shift();
        expansions++;
        add(await bounded(() => api.expandCandidate({ candidate })));
      }
      return { candidates: [...found], more: pending.length > 0 || sources.length > 0, failures: [...failures] };
    },
  };
}
