function createMetadataCandidateService({ cleanSearchTerm, listSources, expandSources }) {
  if (typeof cleanSearchTerm !== 'function' || !listSources || !expandSources) {
    throw new TypeError('createMetadataCandidateService requires search normalization and source maps.');
  }
  const listHandlers = Object.freeze({ ...listSources });
  const expandHandlers = Object.freeze({ ...expandSources });

  async function listCandidates({ source, query, geminiKey, aiModel } = {}) {
    const term = cleanSearchTerm(query || '');
    if (!term) return { candidates: [], error: 'Empty query' };
    const handler = listHandlers[String(source || '')];
    if (typeof handler !== 'function') return { candidates: [], error: 'Unknown source' };
    try {
      const candidates = await handler(term, { geminiKey, aiModel });
      return { candidates: Array.isArray(candidates) ? candidates : [] };
    } catch (error) {
      return { candidates: [], error: String(error) };
    }
  }

  async function expandCandidate({ candidate } = {}) {
    if (!candidate || !candidate.source) return null;
    const handler = expandHandlers[String(candidate.source)];
    if (typeof handler !== 'function') return null;
    try { return await handler(candidate); } catch { return null; }
  }

  return Object.freeze({ listCandidates, expandCandidate });
}

module.exports = { createMetadataCandidateService };
