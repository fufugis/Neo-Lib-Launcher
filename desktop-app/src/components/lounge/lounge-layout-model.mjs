import { DEFAULT_LOUNGE_SAMPLES, normalizeLoungeSamples } from './lounge-sample-model.mjs';
import { LOUNGE_EXTRA_PARTICLES, LOUNGE_PARTICLE_COLORS } from './lounge-particle-presets.mjs';
import { THEMES } from '../../lib/utils.js';
import { HOME_WIDGET_BY_ID } from '../home/home-widget-registry.mjs';
import { resolveLoungePanelPositions } from './lounge-widget-layout.mjs';
import { LOUNGE_EFFECTS, normalizeLoungeEffects } from './lounge-effect-model.mjs';
import { normalizeHiddenLoungeConsoles } from './lounge-emulator-zone.mjs';
import { normalizePlaytimePieFilters } from '../home/playtime-pie-model.mjs';

export const LOUNGE_SURFACE_OPACITY_RANGE = Object.freeze({ min: 0, max: 100 });

export const LOUNGE_PRESETS = Object.freeze({
  cinema: { label: 'Cinema', shelfPosition: 'bottom', coverSize: 124, gap: 14, stageHeight: 510, previewStyle: 'cinema', infoDensity: 'balanced' },
  console: { label: 'Console', shelfPosition: 'bottom', coverSize: 132, gap: 16, stageHeight: 530, previewStyle: 'cinema', infoDensity: 'minimal' },
  gallery: { label: 'Gallery', shelfPosition: 'left', coverSize: 120, gap: 12, stageHeight: 520, previewStyle: 'framed', infoDensity: 'rich' },
  spotlight: { label: 'Spotlight', shelfPosition: 'right', coverSize: 132, gap: 14, stageHeight: 550, previewStyle: 'cinema', infoDensity: 'balanced' },
});
export const LOUNGE_HOME_TILE_IDS = Object.freeze(['all', 'continue', 'favorites', 'recent', 'added', 'most', 'visual']);
export const LOUNGE_SCENES = Object.freeze({
  'moonlit-arcana': Object.freeze({ label: 'Moonlit Arcana', note: '5504 × 3072 original: moonlit mage, luminous castles and enchanted mountain valley.' }),
  'cosmic-citadel': Object.freeze({ label: 'Cosmic Citadel', note: '5504 × 3072 original: crystal citadels, luminous planet and sweeping galaxies.' }),
  theme: Object.freeze({ label: 'Follow desktop theme', note: 'Use your current NEO-LIB theme in Lounge.' }),
  alpine: Object.freeze({ label: 'Alpine Horizon', note: 'Blue-hour mountains, luminous lake and warm sunset.' }),
  orbit: Object.freeze({ label: 'Blue Orbit', note: 'A deep-space planet with clean electric-blue highlights.' }),
  coast: Object.freeze({ label: 'Sunlit Coast', note: 'Bright turquoise water, white cliffs and golden light.' }),
  neon: Object.freeze({ label: 'Neon Gallery', note: 'NEO-LIB power emblem in a cinematic violet-and-cyan gallery.' }),
  starlit: Object.freeze({ label: 'Starlit Road', note: 'Anime nightscape, moonlit road and quiet violet horizon.' }),
  solar: Object.freeze({ label: 'Solar Grove', note: 'Golden sunbeams through a deep emerald forest.' }),
  rainlight: Object.freeze({ label: 'Rainlight City', note: 'Rain-washed skyline, luminous towers and blue-hour reflections.' }),
  steampunk: Object.freeze({ label: 'Steampunk', note: 'Brass clockwork towers, copper bridges and amber furnace light.' }),
  'anime-winter': Object.freeze({ label: 'Anime Winter', note: 'Snowbound anime village, permafrost mountains and brilliant ice-blue sunlight.' }),
});
const desktopThemeIds = new Set(THEMES.map(theme => theme.id));
const validLoungeDesktopTheme = id => desktopThemeIds.has(id) || /^custom:[a-z0-9][a-z0-9-]{1,63}$/.test(id || '');
export const LOUNGE_QUICK_LINKS = Object.freeze({
  continue: 'Continue playing', favorites: 'Favorites', recent: 'Recently played', added: 'Recently added', most: 'Most played', all: 'All games', visual: 'Visual Builder',
});
export const LOUNGE_BROWSE_BAR_FILTERS = Object.freeze({
  continue: 'Continue playing', favorites: 'Favorites', recent: 'Recently played', week: 'Played this week', progress: 'In progress', added: 'Recently added', most: 'Most played', az: 'A–Z jump',
});
export function showLoungeBrowseFilter(id, hidden, active = false) {
  return id === 'all' || active || !Array.isArray(hidden) || !hidden.includes(id);
}
export const LOUNGE_PARTICLE_IDS = Object.freeze(['theme', 'none', 'soft-rain', 'rain-drop', 'falling-heart', 'sakura-petal', 'warm-ember', 'starlight', 'bubble', ...LOUNGE_EXTRA_PARTICLES.map(item => item.id)]);
export const LOUNGE_COVER_FRAMES = Object.freeze({
  classic: Object.freeze({ label: 'Classic', note: 'The familiar rounded carousel card.' }),
  gallery: Object.freeze({ label: 'Gallery', note: 'A quiet, squared-off matte frame.' }),
  glass: Object.freeze({ label: 'Glass', note: 'Clear frosted edges with a soft sheen.' }),
  chrome: Object.freeze({ label: 'Chrome', note: 'A cool metallic bevel around the whole card.' }),
  reactor: Object.freeze({ label: 'Reactor', note: 'A flowing two-colour edge around art and title.' }),
});
export const LOUNGE_FRAME_COLORS = Object.freeze({
  theme: Object.freeze({ label: 'Follow theme', primary: 'rgb(var(--accent))', secondary: 'rgb(var(--accent-2))' }),
  electric: Object.freeze({ label: 'Electric', primary: '#63dfff', secondary: '#bb8cff' }),
  orchid: Object.freeze({ label: 'Orchid', primary: '#ef83ff', secondary: '#87c8ff' }),
  gold: Object.freeze({ label: 'Gold', primary: '#ffd37a', secondary: '#fff1b4' }),
  mint: Object.freeze({ label: 'Mint', primary: '#80f1bf', secondary: '#bbffe0' }),
  ember: Object.freeze({ label: 'Ember', primary: '#ff9e6b', secondary: '#ffd37a' }),
  custom: Object.freeze({ label: 'Custom', primary: '', secondary: '#ffffff' }),
});
export function loungeFramePaletteStyle(colorId, customColor) {
  const choice = LOUNGE_FRAME_COLORS[colorId] || LOUNGE_FRAME_COLORS.theme;
  const safeCustom = /^#[\da-f]{6}$/i.test(customColor || '') ? customColor.toLowerCase() : '#7dd3fc';
  return { '--lounge-frame-primary': colorId === 'custom' ? safeCustom : choice.primary, '--lounge-frame-secondary': choice.secondary };
}
export const LOUNGE_LIGHT_LOOKS = Object.freeze({
  cinema: Object.freeze({ label: 'Cinema glow', note: 'Gentle light, richer art, quiet movement.', settings: Object.freeze({ artSaturation: 112, artContrast: 118, artTemperature: 10, sceneDrift: 65, ribbonIntensity: 18, ribbonSpeed: 65, ribbonPosition: 30, edgeGlow: 24, edgeWidth: 80, edgePulse: 20 }) }),
  aurora: Object.freeze({ label: 'Living aurora', note: 'Flowing colour and a bright, breathing edge.', settings: Object.freeze({ artSaturation: 134, artContrast: 112, artTemperature: -24, sceneDrift: 140, ribbonIntensity: 78, ribbonSpeed: 125, ribbonPosition: 34, edgeGlow: 65, edgeWidth: 115, edgePulse: 75 }) }),
  golden: Object.freeze({ label: 'Golden hour', note: 'Warm, scenic highlights with a softer rim.', settings: Object.freeze({ artSaturation: 121, artContrast: 108, artTemperature: 52, sceneDrift: 85, ribbonIntensity: 42, ribbonSpeed: 70, ribbonPosition: 44, edgeGlow: 32, edgeWidth: 90, edgePulse: 35 }) }),
});
export function loungeSceneParticleStyle(scene) {
  if (scene === 'steampunk') return 'rust-flakes';
  if (scene === 'anime-winter') return 'blizzard';
  if (scene === 'solar') return 'fireflies';
  if (scene === 'rainlight') return 'rain-drop';
  return scene === 'theme' ? 'theme' : 'starlight';
}
export const LOUNGE_VISUAL_PRESETS = Object.freeze({
  cinema: Object.freeze({ label: 'Game cinema', note: 'Game art · gentle motion', backdropMode: 'game', backgroundOpacity: 68, backgroundPositionY: 45, panelOpacity: 84, ambientMotion: 'drift', ambientPace: 'slow', waveStrength: 25, motion: 'subtle', fxLevel: 'theme' }),
  themeGlow: Object.freeze({ label: 'Theme glow', note: 'Theme art · flowing colour', backdropMode: 'theme', backgroundOpacity: 58, backgroundPositionY: 50, panelOpacity: 78, ambientMotion: 'waves', ambientPace: 'steady', waveStrength: 42, motion: 'full', fxLevel: 'theme' }),
  calm: Object.freeze({ label: 'Soft focus', note: 'Theme art · low motion', backdropMode: 'theme', backgroundOpacity: 42, backgroundPositionY: 50, panelOpacity: 90, ambientMotion: 'still', ambientPace: 'slow', waveStrength: 0, motion: 'subtle', fxLevel: 1 }),
  quiet: Object.freeze({ label: 'Quiet screen', note: 'Dark canvas · motion off', backdropMode: 'dark', backgroundOpacity: 0, backgroundPositionY: 50, panelOpacity: 96, ambientMotion: 'still', ambientPace: 'steady', waveStrength: 0, motion: 'off', fxLevel: 0 }),
});

export const DEFAULT_LOUNGE_PREFERENCES = Object.freeze({
  ...LOUNGE_PRESETS.cinema,
  preset: 'cinema',
  shelfWidth: 220,
  wallCoverSize: 220,
  emulatorSize: 100,
  emulatorCarouselWidth: 1600,
  hiddenEmulators: [],
  coverAspect: 'portrait',
  controlSize: 'comfortable',
  browseSort: 'library',
  hiddenBrowseFilters: [],
  carouselVerticalOffset: 0,
  selectedGameScale: 145,
  carouselShowTitles: true,
  motion: 'full',
  fxLevel: 'theme',
  particleStyle: 'theme',
  particleAmount: 100,
  particleRandomness: 50,
  particleColor: 'original',
  particleOpacity: 70,
  particleSize: 100,
  particleTrail: 45,
  particleGlow: 65,
  particleSpeed: 100,
  coverGlow: 'off',
  coverGlowStrength: 100,
  coverFrame: 'classic',
  frameColor: 'theme',
  frameCustomColor: '#7dd3fc',
  specialTheme: 'theme',
  desktopThemeOverride: '',
  quickLinks: ['continue', 'favorites', 'most'],
  backdropMode: 'theme',
  backgroundUrl: '',
  backgroundOpacity: 65,
  backgroundFit: 'adaptive',
  backgroundPositionX: 50,
  backgroundZoom: 100,
  backgroundMotion: 55,
  backgroundPositionY: 50,
  panelOpacity: 82,
  shelfOpacity: 66,
  previewPosition: 'left',
  widgetAreaEnabled: false,
  widgetPosition: 'right',
  widgetIds: ['best-games', 'recent'],
  playtimePieFilters: normalizePlaytimePieFilters(),
  widgetWidth: 36,
  widgetHeight: 420,
  widgetZoom: 100,
  widgetVerticalOffset: 24,
  widgetShowBox: true,
  previewWidth: 60,
  previewBoxHeight: 220,
  previewVerticalOffset: 24,
  previewCornerRadius: 26,
  previewTextScale: 100,
  previewCoverScale: 100,
  previewPanelOpacity: 82,
  previewShowIndex: true,
  previewShowFactIcons: true,
  previewShowCover: true,
  previewShowDescription: true,
  previewShowFacts: true,
  previewShowProgress: true,
  previewShowPlaytime: true,
  previewShowJourney: true,
  previewShowSource: true,
  previewShowRelease: true,
  previewShowYourRating: true,
  previewShowMetacritic: true,
  ambientMotion: 'waves',
  ambientPace: 'steady',
  waveStrength: 52,
  atmosphereOpacity: 70,
  ambientLight: 100, themeFlow: 100,
  smokeStrength: 35, smokeSize: 90, smokeSpeed: 70,
  coldRayStrength: 65, coldRaySpread: 85, coldRaySoftness: 45,
  lightBloom: 55,
  lightRays: 65,
  highlightPulse: 55,
  vignette: 35,
  waveScale: 50,
  waveDrift: 100,
  bloomSpread: 100,
  raySoftness: 45,
  lightShimmer: 55,
  sceneDrift: 100,
  artSaturation: 100,
  artContrast: 100,
  artTemperature: 0,
  filmGrain: 0,
  chromaticAberration: 0,
  ribbonIntensity: 0,
  ribbonSpeed: 100,
  ribbonPosition: 35,
  edgeGlow: 0,
  edgeWidth: 80,
  edgePulse: 50,
  browseSoundEnabled: true,
  browseSoundVolume: 25,
  browseMoveLevel: 100,
  browseSoundStyle: 'glass',
  loungeSamples: DEFAULT_LOUNGE_SAMPLES,
  ambienceTrack: 'none',
  ambienceCustomUrl: '',
  ambienceVolume: 25,
  homeTileOrder: LOUNGE_HOME_TILE_IDS,
  homeHiddenTiles: [],
  homeShowNextUp: true,
  homeShowRecentlyAdded: true,
  entryScreen: 'games',
  showPrivateGamesInLounge: false,
});

const positions = new Set(['top', 'bottom', 'left', 'right']);
const previewStyles = new Set(['cinema', 'framed', 'clean']);
const infoDensities = new Set(['minimal', 'balanced', 'rich']);
const motions = new Set(['full', 'subtle', 'off']);
const backdropModes = new Set(['theme', 'game', 'image', 'light', 'dark', 'clear']);
const backgroundFits = new Set(['adaptive', 'fill', 'fit']);
const ambientMotions = new Set(['drift', 'waves', 'still']);
const ambientPaces = new Set(['slow', 'steady', 'lively']);
const particleStyles = new Set(LOUNGE_PARTICLE_IDS);
const particleColors = new Set(LOUNGE_PARTICLE_COLORS.map(item => item.id));
const coverGlows = new Set(['off', 'soft', 'neon']);
const coverFrames = new Set(Object.keys(LOUNGE_COVER_FRAMES));
const frameColors = new Set(Object.keys(LOUNGE_FRAME_COLORS));
const browseSoundStyles = new Set(['glass', 'pulse', 'orbit', 'samples']);
const ambienceTracks = new Set(['none', 'ambience-1', 'ambience-2', 'ambience-3', 'ambience-4', 'custom']);
const controlSizes = new Set(['compact', 'comfortable', 'large']);
const browseSorts = new Set(['library', 'name', 'last-played', 'recently-added']);
const entryScreens = new Set(['games', 'home']);
const coverAspects = new Set(['portrait', 'tall']);
const safeBackgroundUrl = value => typeof value === 'string' && value.length <= 2048 && /^file:\/\/\/?[a-z]:\/[^?#]+\.(png|apng|jpe?g|webp|gif|mp4|m4v|webm|mov|ogv)$/i.test(value) ? value : '';
const safeAmbienceUrl = value => typeof value === 'string' && value.length <= 2048 && /^file:\/\/\/[a-z]:\/[^?#]+\.mp3$/i.test(value) ? value : '';
const bounded = (value, fallback, min, max) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Math.round(Number(value)))) : fallback;

export function loungeBackgroundMediaKind(url = '') {
  const path = String(url).split(/[?#]/, 1)[0].toLowerCase();
  if (/\.(mp4|m4v|webm|mov|ogv)$/.test(path)) return 'video';
  if (/\.(gif|apng)$/.test(path)) return 'animated-image';
  return 'image';
}

export function loungeBackgroundMotionStyle(url, zoom = 100, intensity = 55) {
  const base = Math.max(50, Math.min(200, Number(zoom) || 100)) / 100;
  const amount = Math.max(0, Math.min(100, Number(intensity) || 0)) / 100;
  let hash = 0;
  for (const character of String(url || 'lounge')) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  const driftX = (hash % 2 ? 1 : -1) * amount * 1.6;
  const driftY = (hash % 3 ? -1 : 1) * amount * 0.9;
  return {
    '--lounge-art-zoom': String(base),
    '--lounge-user-zoom-near': String(base + amount * 0.018),
    '--lounge-user-zoom-far': String(base + amount * 0.05),
    '--lounge-user-zoom-pulse': String(base + amount * 0.08),
    '--lounge-user-drift-x': `${driftX.toFixed(2)}%`,
    '--lounge-user-drift-x-return': `${(-driftX * 0.55).toFixed(2)}%`,
    '--lounge-user-drift-y': `${driftY.toFixed(2)}%`,
    '--lounge-user-drift-y-return': `${(-driftY * 0.6).toFixed(2)}%`,
    '--lounge-user-duration': `${27 + (hash % 19)}s`,
    '--lounge-user-delay': `-${hash % 17}s`,
  };
}

export function normalizeLoungePreferences(value) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const defaults = DEFAULT_LOUNGE_PREFERENCES;
  const legacyDefaultVisuals = input.preset === 'cinema' && input.backdropMode === 'theme' && !input.backgroundUrl && input.backgroundOpacity === 65 && input.ambientMotion === 'drift' && input.ambientPace === 'steady' && input.waveStrength === 35 && (input.panelOpacity === 76 || input.panelOpacity === 82);
  const requestedOrder = Array.isArray(input.homeTileOrder) ? input.homeTileOrder : [];
  const homeTileOrder = [...new Set([...requestedOrder.filter(id => LOUNGE_HOME_TILE_IDS.includes(id)), ...LOUNGE_HOME_TILE_IDS])];
  const homeHiddenTiles = Array.isArray(input.homeHiddenTiles) ? [...new Set(input.homeHiddenTiles.filter(id => LOUNGE_HOME_TILE_IDS.includes(id)))] : [];
  const quickLinks = Array.isArray(input.quickLinks) ? [...new Set(input.quickLinks.filter(id => Object.hasOwn(LOUNGE_QUICK_LINKS, id)))].slice(0, 5) : defaults.quickLinks;
  const ambienceCustomUrl = safeAmbienceUrl(input.ambienceCustomUrl);
  const resolvedPanels = resolveLoungePanelPositions(input.shelfPosition || defaults.shelfPosition, input.previewPosition || defaults.previewPosition, input.widgetPosition || defaults.widgetPosition);
  return {
    preset: Object.hasOwn(LOUNGE_PRESETS, input.preset) ? input.preset : input.preset === 'custom' ? 'custom' : defaults.preset,
    shelfPosition: input.preset === 'cinema' && input.shelfPosition === 'top' ? 'bottom' : positions.has(input.shelfPosition) ? input.shelfPosition : defaults.shelfPosition,
    carouselVerticalOffset: bounded(input.carouselVerticalOffset, defaults.carouselVerticalOffset, -300, 300),
    selectedGameScale: bounded(input.selectedGameScale, defaults.selectedGameScale, 100, 200),
    carouselShowTitles: input.carouselShowTitles !== false,
    coverSize: input.preset === 'cinema' && input.coverSize === 116 ? defaults.coverSize : bounded(input.coverSize, defaults.coverSize, 84, 184),
    gap: bounded(input.gap, defaults.gap, 8, 28),
    stageHeight: bounded(input.stageHeight, defaults.stageHeight, 320, 760),
    shelfWidth: bounded(input.shelfWidth, defaults.shelfWidth, 156, 320),
    wallCoverSize: bounded(input.wallCoverSize, defaults.wallCoverSize, 170, 320),
    emulatorSize: bounded(input.emulatorSize, defaults.emulatorSize, 70, 150),
    emulatorCarouselWidth: bounded(input.emulatorCarouselWidth, defaults.emulatorCarouselWidth, 800, 2400),
    hiddenEmulators: normalizeHiddenLoungeConsoles(input.hiddenEmulators),
    coverAspect: input.coverAspect === 'square' ? 'portrait' : coverAspects.has(input.coverAspect) ? input.coverAspect : defaults.coverAspect,
    controlSize: controlSizes.has(input.controlSize) ? input.controlSize : defaults.controlSize,
    browseSort: browseSorts.has(input.browseSort) ? input.browseSort : defaults.browseSort,
    hiddenBrowseFilters: Array.isArray(input.hiddenBrowseFilters) ? [...new Set(input.hiddenBrowseFilters.filter(id => Object.hasOwn(LOUNGE_BROWSE_BAR_FILTERS, id)))] : defaults.hiddenBrowseFilters,
    previewStyle: previewStyles.has(input.previewStyle) ? input.previewStyle : defaults.previewStyle,
    infoDensity: infoDensities.has(input.infoDensity) ? input.infoDensity : defaults.infoDensity,
    motion: motions.has(input.motion) ? input.motion : defaults.motion,
    fxLevel: input.fxLevel === 'theme' || (Number.isInteger(input.fxLevel) && input.fxLevel >= 0 && input.fxLevel <= 4) ? input.fxLevel : defaults.fxLevel,
    particleStyle: particleStyles.has(input.particleStyle) ? input.particleStyle : defaults.particleStyle,
    particleAmount: bounded(input.particleAmount, defaults.particleAmount, 0, 100),
    particleRandomness: bounded(input.particleRandomness, defaults.particleRandomness, 0, 100),
    particleColor: particleColors.has(input.particleColor) ? input.particleColor : defaults.particleColor,
    particleOpacity: bounded(input.particleOpacity, defaults.particleOpacity, 10, 100),
    particleSize: bounded(input.particleSize, defaults.particleSize, 50, 180),
    particleTrail: bounded(input.particleTrail, defaults.particleTrail, 0, 100),
    particleGlow: bounded(input.particleGlow, defaults.particleGlow, 0, 100),
    particleSpeed: bounded(input.particleSpeed, defaults.particleSpeed, 25, 200),
    coverGlow: coverGlows.has(input.coverGlow) ? input.coverGlow : defaults.coverGlow,
    coverGlowStrength: bounded(input.coverGlowStrength, defaults.coverGlowStrength, 0, 200),
    coverFrame: coverFrames.has(input.coverFrame) ? input.coverFrame : defaults.coverFrame,
    frameColor: frameColors.has(input.frameColor) ? input.frameColor : defaults.frameColor,
    frameCustomColor: /^#[\da-f]{6}$/i.test(input.frameCustomColor || '') ? input.frameCustomColor.toLowerCase() : defaults.frameCustomColor,
    specialTheme: Object.hasOwn(LOUNGE_SCENES, input.specialTheme) ? input.specialTheme : defaults.specialTheme,
    desktopThemeOverride: validLoungeDesktopTheme(input.desktopThemeOverride) ? input.desktopThemeOverride : '',
    quickLinks,
    backdropMode: backdropModes.has(input.backdropMode) ? input.backdropMode : defaults.backdropMode,
    backgroundUrl: safeBackgroundUrl(input.backgroundUrl),
    backgroundOpacity: bounded(input.backgroundOpacity, defaults.backgroundOpacity, 0, 100),
    backgroundFit: backgroundFits.has(input.backgroundFit) ? input.backgroundFit : defaults.backgroundFit,
    backgroundPositionX: bounded(input.backgroundPositionX, defaults.backgroundPositionX, 0, 100),
    backgroundZoom: bounded(input.backgroundZoom, defaults.backgroundZoom, 50, 200),
    backgroundMotion: bounded(input.backgroundMotion, defaults.backgroundMotion, 0, 100),
    backgroundPositionY: bounded(input.backgroundPositionY, defaults.backgroundPositionY, 0, 100),
    panelOpacity: legacyDefaultVisuals ? defaults.panelOpacity : bounded(input.panelOpacity, defaults.panelOpacity, LOUNGE_SURFACE_OPACITY_RANGE.min, LOUNGE_SURFACE_OPACITY_RANGE.max),
    shelfOpacity: bounded(input.shelfOpacity, defaults.shelfOpacity, LOUNGE_SURFACE_OPACITY_RANGE.min, LOUNGE_SURFACE_OPACITY_RANGE.max),
    ...resolvedPanels,
    widgetAreaEnabled: input.widgetAreaEnabled === true,
    widgetIds: Array.isArray(input.widgetIds) ? [...new Set(input.widgetIds.filter(id => Object.hasOwn(HOME_WIDGET_BY_ID, id)))].slice(0, 4) : [...defaults.widgetIds],
    playtimePieFilters: normalizePlaytimePieFilters(input.playtimePieFilters),
    widgetWidth: bounded(input.widgetWidth, defaults.widgetWidth, 20, 100),
    widgetHeight: bounded(input.widgetHeight, defaults.widgetHeight, 160, 8640),
    widgetZoom: bounded(input.widgetZoom, defaults.widgetZoom, 75, 200),
    widgetVerticalOffset: bounded(input.widgetVerticalOffset, defaults.widgetVerticalOffset, -300, 300),
    widgetShowBox: input.widgetShowBox !== false,
    previewWidth: bounded(input.previewWidth, defaults.previewWidth, 20, 100),
    previewBoxHeight: bounded(input.previewBoxHeight, defaults.previewBoxHeight, 80, 8640),
    previewVerticalOffset: bounded(input.previewVerticalOffset, defaults.previewVerticalOffset, -300, 100),
    previewCornerRadius: bounded(input.previewCornerRadius, defaults.previewCornerRadius, 0, 48),
    previewTextScale: bounded(input.previewTextScale, defaults.previewTextScale, 75, 135),
    previewCoverScale: bounded(input.previewCoverScale, defaults.previewCoverScale, 50, 250),
    previewPanelOpacity: bounded(input.previewPanelOpacity, defaults.previewPanelOpacity, 20, 100),
    previewShowIndex: input.previewShowIndex !== false,
    previewShowFactIcons: input.previewShowFactIcons !== false,
    previewShowCover: input.previewShowCover !== false,
    previewShowDescription: input.previewShowDescription !== false,
    previewShowFacts: input.previewShowFacts !== false,
    previewShowProgress: input.previewShowProgress !== false,
    previewShowPlaytime: input.previewShowPlaytime !== false,
    previewShowJourney: input.previewShowJourney !== false,
    previewShowSource: input.previewShowSource !== false,
    previewShowRelease: input.previewShowRelease !== false,
    previewShowYourRating: input.previewShowYourRating !== false,
    previewShowMetacritic: input.previewShowMetacritic !== false,
    ambientMotion: legacyDefaultVisuals ? defaults.ambientMotion : ambientMotions.has(input.ambientMotion) ? input.ambientMotion : defaults.ambientMotion,
    ambientPace: ambientPaces.has(input.ambientPace) ? input.ambientPace : defaults.ambientPace,
    waveStrength: legacyDefaultVisuals ? defaults.waveStrength : bounded(input.waveStrength, defaults.waveStrength, 0, 300),
    atmosphereOpacity: bounded(input.atmosphereOpacity, defaults.atmosphereOpacity, 0, 100),
    ambientLight: bounded(input.ambientLight, defaults.ambientLight, 0, 100),
    themeFlow: bounded(input.themeFlow, defaults.themeFlow, 0, 100),
    effects: normalizeLoungeEffects(input, defaults),
    smokeStrength: bounded(input.smokeStrength, defaults.smokeStrength, 0, 100),
    smokeSize: bounded(input.smokeSize, defaults.smokeSize, 40, 160),
    smokeSpeed: bounded(input.smokeSpeed, defaults.smokeSpeed, 20, 200),
    coldRayStrength: bounded(input.coldRayStrength, defaults.coldRayStrength, 0, 300),
    coldRaySpread: bounded(input.coldRaySpread, defaults.coldRaySpread, 30, 150),
    coldRaySoftness: bounded(input.coldRaySoftness, defaults.coldRaySoftness, 0, 100),
    lightBloom: bounded(input.lightBloom, defaults.lightBloom, 0, 600),
    lightRays: bounded(input.lightRays, defaults.lightRays, 0, 300),
    highlightPulse: bounded(input.highlightPulse, defaults.highlightPulse, 0, 100),
    vignette: bounded(input.vignette, defaults.vignette, 0, 100),
    waveScale: bounded(input.waveScale, defaults.waveScale, 0, 100),
    waveDrift: bounded(input.waveDrift, defaults.waveDrift, 0, 200),
    bloomSpread: bounded(input.bloomSpread, defaults.bloomSpread, 40, 220),
    raySoftness: bounded(input.raySoftness, defaults.raySoftness, 0, 100),
    lightShimmer: bounded(input.lightShimmer, defaults.lightShimmer, 0, 100),
    sceneDrift: bounded(input.sceneDrift, defaults.sceneDrift, 0, 200),
    artSaturation: bounded(input.artSaturation, defaults.artSaturation, 50, 200),
    artContrast: bounded(input.artContrast, defaults.artContrast, 70, 150),
    artTemperature: bounded(input.artTemperature, defaults.artTemperature, -100, 100),
    filmGrain: bounded(input.filmGrain, defaults.filmGrain, 0, 100),
    chromaticAberration: bounded(input.chromaticAberration, defaults.chromaticAberration, 0, 100),
    ribbonIntensity: bounded(input.ribbonIntensity, defaults.ribbonIntensity, 0, 100),
    ribbonSpeed: bounded(input.ribbonSpeed, defaults.ribbonSpeed, 20, 200),
    ribbonPosition: bounded(input.ribbonPosition, defaults.ribbonPosition, 0, 100),
    edgeGlow: bounded(input.edgeGlow, defaults.edgeGlow, 0, 100),
    edgeWidth: bounded(input.edgeWidth, defaults.edgeWidth, 20, 180),
    edgePulse: bounded(input.edgePulse, defaults.edgePulse, 0, 100),
    browseSoundEnabled: input.browseSoundEnabled !== false,
    browseSoundVolume: bounded(input.browseSoundVolume, defaults.browseSoundVolume, 0, 100),
    browseMoveLevel: bounded(input.browseMoveLevel, defaults.browseMoveLevel, 0, 100),
    browseSoundStyle: browseSoundStyles.has(input.browseSoundStyle) ? input.browseSoundStyle : defaults.browseSoundStyle,
    loungeSamples: normalizeLoungeSamples(input.loungeSamples),
    ambienceTrack: input.ambienceTrack === 'custom' && !ambienceCustomUrl ? 'none' : ambienceTracks.has(input.ambienceTrack) ? input.ambienceTrack : defaults.ambienceTrack,
    ambienceCustomUrl,
    ambienceVolume: bounded(input.ambienceVolume, defaults.ambienceVolume, 0, 100),
    homeTileOrder,
    homeHiddenTiles,
    homeShowNextUp: input.homeShowNextUp !== false,
    homeShowRecentlyAdded: input.homeShowRecentlyAdded !== false,
    entryScreen: entryScreens.has(input.entryScreen) ? input.entryScreen : defaults.entryScreen,
    showPrivateGamesInLounge: input.showPrivateGamesInLounge === true,
  };
}

export function applyLoungePreset(current, preset) {
  if (!Object.hasOwn(LOUNGE_PRESETS, preset)) return normalizeLoungePreferences(current);
  return normalizeLoungePreferences({ ...current, ...LOUNGE_PRESETS[preset], preset });
}

export function applyLoungeScene(current, id) {
  if (!Object.hasOwn(LOUNGE_SCENES, id)) return normalizeLoungePreferences(current);
  if (id === 'theme') return normalizeLoungePreferences({ ...current, specialTheme: 'theme', desktopThemeOverride: '', backdropMode: 'theme' });
  const sceneEffects = id === 'steampunk' ? { smoke: true, 'cold-rays': false } : id === 'anime-winter' ? { smoke: false, 'cold-rays': true } : { smoke: false, 'cold-rays': false };
  return normalizeLoungePreferences({ ...current, specialTheme: id, effects: { ...current.effects, ...sceneEffects, waves: true, 'card-glow': true }, preset: 'custom', shelfPosition: 'bottom', coverSize: 140, stageHeight: 450, previewStyle: 'clean', infoDensity: 'rich', backdropMode: 'theme', backgroundOpacity: 96, panelOpacity: 82, ambientMotion: 'waves', ambientPace: 'slow', waveStrength: 42, coverGlow: 'soft' });
}

export function applyLoungeDesktopTheme(current, id) {
  if (!validLoungeDesktopTheme(id)) return normalizeLoungePreferences(current);
  return normalizeLoungePreferences({ ...current, specialTheme: 'theme', desktopThemeOverride: id, backdropMode: 'theme' });
}

export function applyLoungeVisualPreset(current, id) {
  if (!Object.hasOwn(LOUNGE_VISUAL_PRESETS, id)) return normalizeLoungePreferences(current);
  const { label, note, ...visual } = LOUNGE_VISUAL_PRESETS[id];
  const effects = { ...current.effects };
  for (const effect of LOUNGE_EFFECTS) {
    const control = effect.controls[0];
    if (Object.hasOwn(visual, control.key)) effects[effect.id] = visual[control.key] !== control.neutral;
    if (effect.id === 'card-glow' && Object.hasOwn(visual, 'coverGlow')) effects[effect.id] = visual.coverGlow !== 'off';
  }
  return normalizeLoungePreferences({ ...current, ...visual, effects });
}

export function matchesLoungeVisualPreset(current, id) {
  if (!Object.hasOwn(LOUNGE_VISUAL_PRESETS, id)) return false;
  return Object.entries(LOUNGE_VISUAL_PRESETS[id]).every(([key, value]) => key === 'label' || key === 'note' || current?.[key] === value);
}
