/** Build inspectable hero choices while keeping each source tied to its artwork. */
export function libraryHeroArtworkOptions(game = {}) {
  const entries = [
    [game.heroArtworkOverride, game.heroArtworkOverrideSource || 'Your image'],
    [game.hero, 'Game hero'],
    [game.background, 'Game background'],
    ...(Array.isArray(game.screenshots) ? game.screenshots.map((url, index) => [url, `Screenshot ${index + 1}`]) : []),
    [game.headerImage, 'Store header'],
    [game.capsuleImage, 'Store capsule'],
    [game.coverUrl, 'Game cover'],
  ];
  const seen = new Set();
  return entries.flatMap(([value, source]) => {
    if (typeof value !== 'string' || !value.trim() || seen.has(value.trim())) return [];
    seen.add(value.trim());
    return [{ url: value.trim(), source }];
  });
}

/** A player-selected hero wins; otherwise use full-size scenery before a small store header. */
export function libraryHeroCandidates(game = {}) {
  return libraryHeroArtworkOptions(game).map(({ url }) => url);
}

/** Keep small images near their native size instead of enlarging them to an ultrawide hero. */
export function libraryHeroWidth(naturalWidth, viewportWidth) {
  if (!Number.isFinite(naturalWidth) || !Number.isFinite(viewportWidth) || naturalWidth <= 0 || viewportWidth <= 0) return null;
  if (naturalWidth >= viewportWidth * 0.8) return null;
  return Math.min(viewportWidth * 0.72, naturalWidth * 1.25);
}

export function libraryHeroFocalPoint(game = {}) {
  const point = game.heroFocalPoint || {};
  const clamp = (value, fallback) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Number(value))) : fallback;
  return { x: clamp(point.x, 50), y: clamp(point.y, 42) };
}

export function libraryHeroMotion(game = {}) {
  const value = Number(game.heroMotion);
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 55;
}

export function libraryHeroMediaKind(url = '') {
  const path = String(url).split(/[?#]/, 1)[0].toLowerCase();
  if (/\.(mp4|m4v|webm|mov|ogv)$/.test(path)) return 'video';
  if (/\.gif$/.test(path)) return 'gif';
  return 'image';
}

/** Stable per-game timing keeps the slow drift from starting in lockstep. */
export function libraryHeroMotionStyle(gameId, intensity) {
  const amount = Math.max(0, Math.min(100, Number(intensity) || 0)) / 100;
  let hash = 0;
  for (const character of String(gameId || 'library')) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  const driftX = (hash % 2 ? 1 : -1) * amount * 1.5;
  const driftY = (hash % 3 ? -1 : 1) * amount * 0.8;
  return {
    '--hero-zoom-near': String(1 + amount * 0.025),
    '--hero-zoom-far': String(1 + amount * 0.055),
    '--hero-zoom-pulse': String(1 + amount * 0.08),
    '--hero-drift-x': `${driftX.toFixed(2)}%`,
    '--hero-drift-x-return': `${(-driftX * 0.55).toFixed(2)}%`,
    '--hero-drift-y': `${driftY.toFixed(2)}%`,
    '--hero-drift-y-return': `${(-driftY * 0.6).toFixed(2)}%`,
    animationDuration: `${32 + (hash % 17)}s`,
    animationDelay: `-${hash % 19}s`,
  };
}
