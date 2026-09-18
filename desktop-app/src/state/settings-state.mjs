export const DEFAULT_SETTINGS = Object.freeze({
  theme: 'synthwave', firstRun: true, geminiKey: '', aiModel: 'gemini-2.5-flash',
  fungistNotifications: {}, librarySize: 'medium', showcaseMode: 'recent_added', collapsed: {},
  interfaceMode: 'default', presentationMode: 'desktop', preferredControllerFingerprint: '',
});

export function hydrateSettings(raw = {}, { resetRatings = false } = {}) {
  const next = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) };
  if (!next.categoriesCollapsedDefault) next.collapsed = {};
  if (next.mode !== 'tools') next.mode = 'home';
  if (resetRatings) next.ratingSystemVersion = 2;
  return next;
}

export function mergeSettings(settings, patch) {
  return { ...(settings || DEFAULT_SETTINGS), ...(patch && typeof patch === 'object' ? patch : {}) };
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
