import { addonLibrary, addonStorage } from '../addons/addon-model.mjs';
export const OFFICIAL_LOUNGE = Object.freeze({ id: 'neolib.lounge', name: 'Lounge', owner: 'NEO-LIB', official: true, removable: false });
const GAME_FIELDS = ['id','name','appid','launcher','source','steamOwned','retroPlatform','portraitImage','coverUrl','iconUrl','headerImage','capsuleImage','background','logoImage','screenshots','description','genres','tags','developer','publisher','releaseDate','metacritic','rating','myRating','playtime','lastPlayed','lastPlayedAt','journeyStatus','installSizeBytes','installedVersion','addedAt','website','features','capabilities'];
const VISUAL_FIELDS = ['theme','effectsLevel','effectsLevelByTheme','gridIntensity','motionCadence','perGameBg','specialDecorationOpacity','cursorTheme','preferredControllerFingerprint','soundPack','soundsEnabled','fungistEnabled','mascotId'];
const MORE_GAME_FIELDS = ['shortDescription','about','developers','publishers','gogId','icon','cover','hero','logo','heroArtworkOverride','heroFocalPoint','heroMotion','genreTags','genreProfile','year','ratedAt','coverWidth','coverHeight','artworkDimensions','contentFlags','achievementSummary','installed','availability','installSizePartial','steamAppId','updateWatchUrl','launcherProductId'];
const projectedGames = new WeakMap();
export function projectLoungeGames(games = []) {
  if (projectedGames.has(games)) return projectedGames.get(games);
  const result = games.map(game => ({ ...Object.fromEntries([...GAME_FIELDS, ...MORE_GAME_FIELDS].filter(key => Object.hasOwn(game, key)).map(key => [key, game[key]])), hasLaunchTarget: Boolean(game.exePath || game.launchUrl) }));
  projectedGames.set(games, result); return result;
}
export function moduleSnapshot({ loungeGames, publicGames, settings, restReason, resting, privateGameCount, privateGamesUnlocked, installedCustomThemes }) {
  return {
    lounge: { games: projectLoungeGames(loungeGames), retroProfiles: (settings.retroProfiles || []).map(profile => ({ platform: profile.platform, name: profile.name, emulatorPath: Boolean(profile.emulatorPath), romFolder: Boolean(profile.romFolder) })),
      favoriteIds: settings.pinnedGameIds || [], updateLedger: settings.updateStatusLedger || {}, initialGameId: settings.lastGameId,
      initialLayout: settings.loungeLayout || 'browser', initialPreferences: settings.loungePreferences, initialResume: settings.loungeResume,
      savedPresets: settings.loungeSavedPresets || [], theme: settings.theme || 'synthwave', themeSettings: Object.fromEntries(VISUAL_FIELDS.filter(key => Object.hasOwn(settings, key)).map(key => [key, settings[key]])),
      installedCustomThemes: installedCustomThemes || [], resting, restReason, privateGameCount, privateGamesUnlocked,
      soundsEnabled: settings.soundsEnabled !== false && (settings.soundPack || 'synthwave') !== 'none', mascotId: settings.mascotId || 'fungist', mascotEnabled: settings.fungistEnabled !== false, controllerEnabled: settings.controllerNavigationEnabled === true },
    custom: { enabled: settings.modulesEnabled === true, config: settings.moduleConfig || {}, games: addonLibrary(publicGames), theme: settings.theme || 'synthwave' },
  };
}
export function moduleStorage(value) { return addonStorage(value); }
