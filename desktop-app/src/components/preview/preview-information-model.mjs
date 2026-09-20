import { formatDescription } from '../../lib/descriptionFormatting.mjs';

export const PREVIEW_DESCRIPTION_FALLBACK = 'No description yet. Re-fetch info to ask NEO-LIB’s source resolver for official game details.';

export function previewStoryBlocks(game = {}) {
  return formatDescription(game.about || game.shortDescription || '');
}

export function previewStoryParagraphs(game = {}) {
  return previewStoryBlocks(game).filter(block => block.type === 'paragraph').map(block => block.text);
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
