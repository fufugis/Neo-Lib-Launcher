export const ARTWORK_SLOTS = Object.freeze(['icon', 'cover', 'hero', 'background', 'logo']);

const text = (value) => String(value || '').trim();

export function artworkSnapshot(game = {}, { at = Date.now(), reason = 'player-change' } = {}) {
  return Object.freeze({
    at: Number(at) || Date.now(),
    reason: text(reason) || 'player-change',
    icon: text(game.icon),
    cover: text(game.portraitImage || game.coverUrl),
    hero: text(game.headerImage),
    background: text(game.background),
    logo: text(game.logoImage),
    sources: Object.freeze({ ...(game.artworkSources || {}) }),
  });
}

export function appendArtworkRevision(history = [], snapshot, limit = 8) {
  const boundedLimit = Math.max(1, Math.min(20, Number(limit) || 8));
  const entries = [...(Array.isArray(history) ? history : []), snapshot].filter(Boolean);
  return Object.freeze(entries.slice(-boundedLimit));
}

export function normalizeArtworkLocks(value = {}) {
  return Object.freeze(Object.fromEntries(ARTWORK_SLOTS.map((slot) => [slot, value?.[slot] === true])));
}
