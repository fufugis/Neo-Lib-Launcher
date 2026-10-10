import { DEFAULT_LOUNGE_PREFERENCES, normalizeLoungePreferences } from '../components/lounge/lounge-layout-model.mjs';
import { DEFAULT_LOUNGE_RESUME, normalizeLoungeResume } from '../components/lounge/lounge-resume-model.mjs';
import { normalizeLoungeSavedPresets } from '../components/lounge/lounge-saved-presets.mjs';

export const DEFAULT_SETTINGS = Object.freeze({
  theme: 'synthwave', firstRun: true, geminiKey: '', steamGridDbKey: '', aiModel: 'gemini-2.5-flash',
  fungistNotifications: {}, librarySize: 'medium', showcaseMode: 'recent_added', collapsed: {},
  interfaceMode: 'default', presentationMode: 'desktop', preferredControllerFingerprint: '', controllerNavigationEnabled: false,
  navigationLayout: 'top',
  idlePowerSavingEnabled: true,
  addonsEnabled: false, addonConfig: {},
  modulesEnabled: false, moduleConfig: {},
  coverWallShape: 'portrait',
  loungeLayout: 'browser',
  loungePreferences: DEFAULT_LOUNGE_PREFERENCES,
  loungeResume: DEFAULT_LOUNGE_RESUME,
  loungeSavedPresets: [],
  externalLibraryRoots: [],
  libraryIconMode: false, libraryIconSize: 48, libraryIconSpacing: 8, libraryIconRows: 3,
});

export function hydrateSettings(raw = {}, { resetRatings = false } = {}) {
  const next = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) };
  if (!next.categoriesCollapsedDefault) next.collapsed = {};
  if (!['top', 'sidebar'].includes(next.navigationLayout)) next.navigationLayout = 'top';
  if (!['default', 'minimalistic'].includes(next.interfaceMode)) next.interfaceMode = 'default';
  if (!['portrait', 'square'].includes(next.coverWallShape)) next.coverWallShape = 'portrait';
  if (!['wall', 'browser'].includes(next.loungeLayout)) next.loungeLayout = 'browser';
  next.loungePreferences = normalizeLoungePreferences(next.loungePreferences);
  next.loungeResume = normalizeLoungeResume(next.loungeResume);
  next.loungeSavedPresets = normalizeLoungeSavedPresets(next.loungeSavedPresets);
  next.controllerNavigationEnabled = next.controllerNavigationEnabled === true;
  next.idlePowerSavingEnabled = next.idlePowerSavingEnabled !== false;
  next.addonsEnabled = next.addonsEnabled === true;
  next.modulesEnabled = next.modulesEnabled === true;
  if (next.mode !== 'tools') next.mode = 'home';
  if (resetRatings) next.ratingSystemVersion = 2;
  return next;
}

export function mergeSettings(settings, patch) {
  const next = { ...(settings || DEFAULT_SETTINGS), ...(patch && typeof patch === 'object' ? patch : {}) };
  if (patch && Object.hasOwn(patch, 'loungePreferences')) next.loungePreferences = normalizeLoungePreferences(patch.loungePreferences);
  if (patch && Object.hasOwn(patch, 'loungeResume')) next.loungeResume = normalizeLoungeResume(patch.loungeResume);
  if (patch && Object.hasOwn(patch, 'loungeSavedPresets')) next.loungeSavedPresets = normalizeLoungeSavedPresets(patch.loungeSavedPresets);
  return next;
}

export function visualState(settings = {}, resting = false) {
  const theme = settings.theme || 'synthwave';
  const specialTheme = ['anime', 'colorful', 'pro'].includes(theme) ? theme : '';
  const stored = settings.effectsLevelByTheme?.[theme];
  const effectsLevel = Math.max(0, Math.min(4, Number.isFinite(stored) ? stored : (Number.isFinite(settings.effectsLevel) ? settings.effectsLevel : 2)));
  const decoration = Math.max(0, Math.min(100, Number(settings.specialDecorationOpacity ?? 46))) / 100;
  return {
    theme, specialTheme, effectsLevel,
    decorationOpacity: resting || !specialTheme ? 0 : decoration * [0, 0.65, 0.85, 1, 1][effectsLevel],
    navigationDecorationOpacity: resting || !specialTheme ? 0 : decoration,
    motionCadence: ['full', 'balanced', 'calm'].includes(settings.motionCadence) ? settings.motionCadence : 'full',
  };
}
