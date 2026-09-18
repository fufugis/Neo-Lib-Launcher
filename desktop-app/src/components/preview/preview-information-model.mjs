export const PREVIEW_DESCRIPTION_FALLBACK = 'No description yet. Re-fetch info to ask NEO-LIB’s source resolver for official game details.';

export function previewStoryParagraphs(game = {}) {
  return String(game.about || game.shortDescription || '')
    .split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z][^.!?]{20,}[.!?])/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function previewMedia(game = {}) {
  return [...new Set([
    game.headerImage,
    game.background,
    game.hero,
    ...(Array.isArray(game.screenshots) ? game.screenshots : []),
    game.coverUrl,
    game.cover,
  ].filter(Boolean))].slice(0, 8);
}

export function previewIdentityGroups(groups = [], fallbackGenres = []) {
  if (groups.length) return groups;
  const fallback = Array.isArray(fallbackGenres) ? fallbackGenres.filter(Boolean) : [];
  return fallback.length ? [['Source genres', fallback.map((label) => ({ id: label, label }))]] : [];
}
