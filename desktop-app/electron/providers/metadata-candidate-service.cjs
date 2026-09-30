function createMetadataCandidateService({ cleanSearchTerm, listSources, expandSources }) {
  if (typeof cleanSearchTerm !== 'function' || !listSources || !expandSources) {
    throw new TypeError('createMetadataCandidateService requires search normalization and source maps.');
  }
  const listHandlers = Object.freeze({ ...listSources });
  const expandHandlers = Object.freeze({ ...expandSources });

  async function listCandidates({ source, query, geminiKey, steamGridDbKey, aiModel } = {}) {
    const term = cleanSearchTerm(query || '');
    if (!term) return { candidates: [], error: 'Empty query' };
    if (String(source || '') === 'all') {
      const sources = Object.entries(listHandlers).filter(([id]) =>
        (id !== 'ai' || String(geminiKey || '').trim())
        && (id !== 'steamgriddb' || String(steamGridDbKey || '').trim()));
      const settled = await Promise.all(sources.map(async ([id, handler]) => {
        try {
          const results = await handler(term, { geminiKey, steamGridDbKey, aiModel });
          return { id, candidates: Array.isArray(results) ? results : [], failed: false };
        } catch {
          return { id, candidates: [], failed: true };
        }
      }));
      const seen = new Set();
      const candidates = settled.flatMap(result => result.candidates.map(candidate => {
        if (!candidate || typeof candidate !== 'object' || !candidate.name) return null;
        const sourceId = String(candidate.source || result.id);
        const id = String(candidate.id || candidate.name);
        const key = `${sourceId.toLowerCase()}|${id.toLowerCase()}`;
        if (seen.has(key)) return null;
        seen.add(key);
        const relevance = titleRelevance(term, candidate.name);
        return relevance >= 0.35 ? { ...candidate, source: sourceId, relevance } : null;
      }).filter(Boolean));
      candidates.sort((left, right) => right.relevance - left.relevance || left.source.localeCompare(right.source));
      const sourceErrors = settled.filter(result => result.failed).map(result => result.id);
      return { candidates: candidates.slice(0, 40), sourcesSearched: sources.length, sourceErrors };
    }
    const handler = listHandlers[String(source || '')];
    if (typeof handler !== 'function') return { candidates: [], error: 'Unknown source' };
    try {
      const candidates = await handler(term, { geminiKey, steamGridDbKey, aiModel });
      return { candidates: Array.isArray(candidates) ? candidates : [] };
    } catch (error) {
      return { candidates: [], error: String(error) };
    }
  }

  async function expandCandidate({ candidate } = {}) {
    if (!candidate || !candidate.source) return null;
    const handler = expandHandlers[String(candidate.source)];
    if (typeof handler !== 'function') return null;
    try {
      const expanded = await handler(candidate);
      return expanded || candidateMetadataFallback(candidate);
    } catch {
      return candidateMetadataFallback(candidate);
    }
  }

  return Object.freeze({ listCandidates, expandCandidate });
}

function titleRelevance(query, title) {
  const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const needle = normalize(query);
  const haystack = normalize(title);
  if (!needle || !haystack) return 0;
  if (needle === haystack) return 1;
  if (` ${haystack} `.includes(` ${needle} `)) return 0.94;
  const queryTokens = new Set(needle.split(/\s+/).filter(token => token.length > 1));
  const titleTokens = new Set(haystack.split(/\s+/).filter(token => token.length > 1));
  if (queryTokens.size === 0) return 0;
  const overlap = [...queryTokens].filter(token => titleTokens.has(token)).length;
  if (queryTokens.size === 1) return overlap ? 0.9 : 0;
  return overlap / queryTokens.size;
}

function candidateMetadataFallback(candidate) {
  if (candidate.source === 'ai' && !candidate.raw) return null;
  const raw = candidate.raw && typeof candidate.raw === 'object' ? candidate.raw : {};
  const image = String(candidate.image || raw.tiny_image || raw.coverVertical || raw.image || '').trim();
  const steamId = candidate.source === 'steam' && /^\d+$/.test(String(candidate.id || '')) ? String(candidate.id) : '';
  const gogPortrait = candidate.source === 'gog' ? String(raw.coverVertical || '').trim() : '';
  const website = String(raw.pageUrl || raw.url || (/^https?:\/\//i.test(String(candidate.id || '')) ? candidate.id : '')).trim();
  return {
    source: candidate.source,
    name: String(candidate.name || '').trim(),
    ...(steamId ? { appid: steamId, portraitImage: `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/library_600x900.jpg` } : {}),
    ...(gogPortrait ? { portraitImage: gogPortrait } : {}),
    shortDescription: String(candidate.shortDescription || ''),
    about: String(candidate.shortDescription || ''),
    headerImage: String(raw.coverHorizontal || image),
    capsuleImage: gogPortrait || image,
    background: String(raw.coverHorizontal || image),
    screenshots: [],
    genres: [],
    developers: [],
    publishers: [],
    releaseDate: candidate.year || '',
    website,
    metadataFallback: true,
  };
}

module.exports = { createMetadataCandidateService };
