const validSteamAppId = (value) => /^\d+$/.test(String(value || '').trim());

/** Steam's official portrait library image. It may be absent for an older title;
 * callers must keep a visual fallback rather than treating the URL as proof. */
export function officialSteamPortrait(appid) {
  return validSteamAppId(appid)
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${String(appid).trim()}/library_600x900.jpg`
    : '';
}

export function portraitArtwork(game = {}) {
  if (typeof game.portraitImage === 'string' && game.portraitImage.trim()) return game.portraitImage.trim();
  // Launcher imports historically stored their source as `steam-import`, so
  // requiring an exact `steam` string hid the official portrait for existing
  // libraries even though the trusted app ID was already present.
  // `appid` is NEO-LIB's dedicated Steam identity field. Older Wall entries
  // sometimes predate the source label entirely, but the ID is still enough
  // to request Steam's official library portrait.
  if (validSteamAppId(game.appid)) return officialSteamPortrait(game.appid);
  // A player-selected cover from Customize is an explicit portrait choice.
  if (game.manualOverride && typeof game.coverUrl === 'string' && game.coverUrl.trim()) return game.coverUrl.trim();
  return '';
}

export function artworkBackdrop(game = {}) {
  return [game.headerImage, game.background, game.capsuleImage, game.coverUrl, game.icon]
    .find((value) => typeof value === 'string' && value.trim()) || '';
}
