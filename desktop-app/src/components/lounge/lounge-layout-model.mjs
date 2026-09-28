import { DEFAULT_LOUNGE_SAMPLES, normalizeLoungeSamples } from './lounge-sample-model.mjs';

export const LOUNGE_PRESETS = Object.freeze({
  cinema: { label: 'Cinema', shelfPosition: 'bottom', coverSize: 124, gap: 14, stageHeight: 510, previewStyle: 'cinema', infoDensity: 'balanced' },
  console: { label: 'Console', shelfPosition: 'bottom', coverSize: 132, gap: 16, stageHeight: 530, previewStyle: 'cinema', infoDensity: 'minimal' },
  gallery: { label: 'Gallery', shelfPosition: 'left', coverSize: 120, gap: 12, stageHeight: 520, previewStyle: 'framed', infoDensity: 'rich' },
  spotlight: { label: 'Spotlight', shelfPosition: 'right', coverSize: 132, gap: 14, stageHeight: 550, previewStyle: 'cinema', infoDensity: 'balanced' },
});
export const LOUNGE_HOME_TILE_IDS = Object.freeze(['all', 'continue', 'favorites', 'recent', 'added', 'most', 'visual']);
export const LOUNGE_SCENES = Object.freeze({
  theme: Object.freeze({ label: 'Follow desktop theme', note: 'Use your current NEO-LIB theme in Lounge.' }),
  alpine: Object.freeze({ label: 'Alpine Horizon', note: 'Blue-hour mountains, luminous lake and warm sunset.' }),
  orbit: Object.freeze({ label: 'Blue Orbit', note: 'A deep-space planet with clean electric-blue highlights.' }),
  coast: Object.freeze({ label: 'Sunlit Coast', note: 'Bright turquoise water, white cliffs and golden light.' }),
});
export const LOUNGE_QUICK_LINKS = Object.freeze({
  continue: 'Continue playing', favorites: 'Favorites', recent: 'Recently played', added: 'Recently added', most: 'Most played', all: 'All games', visual: 'Visual Builder',
});
export const LOUNGE_PARTICLE_IDS = Object.freeze(['theme', 'none', 'soft-rain', 'rain-drop', 'falling-heart', 'sakura-petal', 'warm-ember', 'starlight', 'bubble']);
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
  controlSize: 'comfortable',
  browseSort: 'library',
  motion: 'full',
  fxLevel: 'theme',
  particleStyle: 'theme',
  coverGlow: 'off',
  specialTheme: 'theme',
  quickLinks: ['continue', 'favorites', 'most'],
  backdropMode: 'theme',
  backgroundUrl: '',
  backgroundOpacity: 65,
  backgroundPositionY: 50,
  panelOpacity: 82,
  ambientMotion: 'waves',
  ambientPace: 'steady',
  waveStrength: 52,
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
});

const positions = new Set(['top', 'bottom', 'left', 'right']);
const previewStyles = new Set(['cinema', 'framed', 'clean']);
const infoDensities = new Set(['minimal', 'balanced', 'rich']);
const motions = new Set(['full', 'subtle', 'off']);
const backdropModes = new Set(['theme', 'game', 'image', 'light', 'dark', 'clear']);
const ambientMotions = new Set(['drift', 'waves', 'still']);
const ambientPaces = new Set(['slow', 'steady', 'lively']);
const particleStyles = new Set(LOUNGE_PARTICLE_IDS);
const coverGlows = new Set(['off', 'soft', 'neon']);
const browseSoundStyles = new Set(['glass', 'pulse', 'orbit', 'samples']);
const ambienceTracks = new Set(['none', 'ambience-1', 'ambience-2', 'ambience-3', 'ambience-4', 'custom']);
const controlSizes = new Set(['compact', 'comfortable', 'large']);
const browseSorts = new Set(['library', 'name', 'last-played', 'recently-added']);
const entryScreens = new Set(['games', 'home']);
const safeBackgroundUrl = value => typeof value === 'string' && value.length <= 2048 && /^file:\/\/\/?[a-z]:\/[^?#]+\.(png|jpe?g|webp)$/i.test(value) ? value : '';
const safeAmbienceUrl = value => typeof value === 'string' && value.length <= 2048 && /^file:\/\/\/[a-z]:\/[^?#]+\.mp3$/i.test(value) ? value : '';
const bounded = (value, fallback, min, max) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Math.round(Number(value)))) : fallback;

export function normalizeLoungePreferences(value) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const defaults = DEFAULT_LOUNGE_PREFERENCES;
  const legacyDefaultVisuals = input.preset === 'cinema' && input.backdropMode === 'theme' && !input.backgroundUrl && input.backgroundOpacity === 65 && input.ambientMotion === 'drift' && input.ambientPace === 'steady' && input.waveStrength === 35 && (input.panelOpacity === 76 || input.panelOpacity === 82);
  const requestedOrder = Array.isArray(input.homeTileOrder) ? input.homeTileOrder : [];
  const homeTileOrder = [...new Set([...requestedOrder.filter(id => LOUNGE_HOME_TILE_IDS.includes(id)), ...LOUNGE_HOME_TILE_IDS])];
  const homeHiddenTiles = Array.isArray(input.homeHiddenTiles) ? [...new Set(input.homeHiddenTiles.filter(id => LOUNGE_HOME_TILE_IDS.includes(id)))] : [];
  const quickLinks = Array.isArray(input.quickLinks) ? [...new Set(input.quickLinks.filter(id => Object.hasOwn(LOUNGE_QUICK_LINKS, id)))].slice(0, 5) : defaults.quickLinks;
  const ambienceCustomUrl = safeAmbienceUrl(input.ambienceCustomUrl);
  return {
    preset: Object.hasOwn(LOUNGE_PRESETS, input.preset) ? input.preset : input.preset === 'custom' ? 'custom' : defaults.preset,
    shelfPosition: input.preset === 'cinema' && input.shelfPosition === 'top' ? 'bottom' : positions.has(input.shelfPosition) ? input.shelfPosition : defaults.shelfPosition,
    coverSize: input.preset === 'cinema' && input.coverSize === 116 ? defaults.coverSize : bounded(input.coverSize, defaults.coverSize, 84, 184),
    gap: bounded(input.gap, defaults.gap, 8, 28),
    stageHeight: bounded(input.stageHeight, defaults.stageHeight, 320, 760),
    shelfWidth: bounded(input.shelfWidth, defaults.shelfWidth, 156, 320),
    wallCoverSize: bounded(input.wallCoverSize, defaults.wallCoverSize, 170, 320),
    controlSize: controlSizes.has(input.controlSize) ? input.controlSize : defaults.controlSize,
    browseSort: browseSorts.has(input.browseSort) ? input.browseSort : defaults.browseSort,
    previewStyle: previewStyles.has(input.previewStyle) ? input.previewStyle : defaults.previewStyle,
    infoDensity: infoDensities.has(input.infoDensity) ? input.infoDensity : defaults.infoDensity,
    motion: motions.has(input.motion) ? input.motion : defaults.motion,
    fxLevel: input.fxLevel === 'theme' || (Number.isInteger(input.fxLevel) && input.fxLevel >= 0 && input.fxLevel <= 4) ? input.fxLevel : defaults.fxLevel,
    particleStyle: particleStyles.has(input.particleStyle) ? input.particleStyle : defaults.particleStyle,
    coverGlow: coverGlows.has(input.coverGlow) ? input.coverGlow : defaults.coverGlow,
    specialTheme: Object.hasOwn(LOUNGE_SCENES, input.specialTheme) ? input.specialTheme : defaults.specialTheme,
    quickLinks,
    backdropMode: backdropModes.has(input.backdropMode) ? input.backdropMode : defaults.backdropMode,
    backgroundUrl: safeBackgroundUrl(input.backgroundUrl),
    backgroundOpacity: bounded(input.backgroundOpacity, defaults.backgroundOpacity, 0, 100),
    backgroundPositionY: bounded(input.backgroundPositionY, defaults.backgroundPositionY, 0, 100),
    panelOpacity: legacyDefaultVisuals ? defaults.panelOpacity : bounded(input.panelOpacity, defaults.panelOpacity, 40, 100),
    ambientMotion: legacyDefaultVisuals ? defaults.ambientMotion : ambientMotions.has(input.ambientMotion) ? input.ambientMotion : defaults.ambientMotion,
    ambientPace: ambientPaces.has(input.ambientPace) ? input.ambientPace : defaults.ambientPace,
    waveStrength: legacyDefaultVisuals ? defaults.waveStrength : bounded(input.waveStrength, defaults.waveStrength, 0, 100),
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
  };
}

export function applyLoungePreset(current, preset) {
  if (!Object.hasOwn(LOUNGE_PRESETS, preset)) return normalizeLoungePreferences(current);
  return normalizeLoungePreferences({ ...current, ...LOUNGE_PRESETS[preset], preset });
}

export function applyLoungeScene(current, id) {
  if (!Object.hasOwn(LOUNGE_SCENES, id)) return normalizeLoungePreferences(current);
  if (id === 'theme') return normalizeLoungePreferences({ ...current, specialTheme: 'theme', backdropMode: 'theme' });
  return normalizeLoungePreferences({ ...current, specialTheme: id, preset: 'custom', shelfPosition: 'bottom', coverSize: 140, stageHeight: 450, previewStyle: 'clean', infoDensity: 'rich', backdropMode: 'theme', backgroundOpacity: 96, panelOpacity: 82, ambientMotion: 'waves', ambientPace: 'slow', waveStrength: 42, coverGlow: 'soft' });
}

export function applyLoungeVisualPreset(current, id) {
  if (!Object.hasOwn(LOUNGE_VISUAL_PRESETS, id)) return normalizeLoungePreferences(current);
  const { label, note, ...visual } = LOUNGE_VISUAL_PRESETS[id];
  return normalizeLoungePreferences({ ...current, ...visual });
}

export function matchesLoungeVisualPreset(current, id) {
  if (!Object.hasOwn(LOUNGE_VISUAL_PRESETS, id)) return false;
  return Object.entries(LOUNGE_VISUAL_PRESETS[id]).every(([key, value]) => key === 'label' || key === 'note' || current?.[key] === value);
}
