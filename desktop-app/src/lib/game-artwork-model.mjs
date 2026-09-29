const validSteamAppId = (value) => /^\d+$/.test(String(value || '').trim());
const steamPortraitId = (game = {}) => validSteamAppId(game.steamAppId) ? game.steamAppId : game.appid;

/** Steam's official portrait library image. It may be absent for an older title;
 * callers must keep a visual fallback rather than treating the URL as proof. */
export function officialSteamPortrait(appid) {
  return validSteamAppId(appid)
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${String(appid).trim()}/library_600x900.jpg`
    : '';
}

export function portraitArtwork(game = {}) {
  if (game.manualOverride && typeof game.coverUrl === 'string' && game.coverUrl.trim()) return game.coverUrl.trim();
  if (typeof game.portraitImage === 'string' && game.portraitImage.trim()) return game.portraitImage.trim();
  // Launcher imports historically stored their source as `steam-import`, so
  // requiring an exact `steam` string hid the official portrait for existing
  // libraries even though the trusted app ID was already present.
  // `appid` is NEO-LIB's dedicated Steam identity field. Older Wall entries
  // sometimes predate the source label entirely, but the ID is still enough
  // to request Steam's official library portrait.
  if (validSteamAppId(steamPortraitId(game))) return officialSteamPortrait(steamPortraitId(game));
  return '';
}

/** A source label or URL cannot prove image shape; the browser checks loaded dimensions. */
export function hasPortraitDimensions(width, height) {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height >= width * 1.15;
}

/**
 * Lounge can inspect candidate dimensions at render time, so offer likely
 * portrait sources in preference order and let it skip wide/invalid images.
 */
export function portraitArtworkCandidates(game = {}) {
  const candidates = [
    game.manualOverride ? game.coverUrl : '',
    /^file:/i.test(String(game.coverUrl || '')) ? game.coverUrl : '',
    game.portraitImage,
    validSteamAppId(steamPortraitId(game)) ? officialSteamPortrait(steamPortraitId(game)) : '',
    game.coverUrl,
    game.capsuleImage,
  ];
  return [...new Set(candidates.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))];
}

export function artworkBackdrop(game = {}) {
  return [game.headerImage, game.background, game.capsuleImage, game.coverUrl, game.icon]
    .find((value) => typeof value === 'string' && value.trim()) || '';
}
