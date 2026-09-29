/** A player-selected hero wins; otherwise use full-size scenery before a small store header. */
export function libraryHeroCandidates(game = {}) {
  return [...new Set([
    game.hero,
    game.background,
    ...(Array.isArray(game.screenshots) ? game.screenshots : []),
    game.headerImage,
    game.capsuleImage,
    game.coverUrl,
  ].filter(value => typeof value === 'string' && value.trim()).map(value => value.trim()))];
}

/** Keep small images near their native size instead of enlarging them to an ultrawide hero. */
export function libraryHeroWidth(naturalWidth, viewportWidth) {
  if (!Number.isFinite(naturalWidth) || !Number.isFinite(viewportWidth) || naturalWidth <= 0 || viewportWidth <= 0) return null;
  if (naturalWidth >= viewportWidth * 0.8) return null;
  return Math.min(viewportWidth * 0.72, naturalWidth * 1.25);
}
