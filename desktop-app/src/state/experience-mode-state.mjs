export const INTERFACE_MODES = Object.freeze({ DEFAULT: 'default', MINIMALISTIC: 'minimalistic' });
export const PRESENTATION_MODES = Object.freeze({ DESKTOP: 'desktop', LOUNGE: 'lounge' });

export function normalizeInterfaceMode(value) {
  return value === INTERFACE_MODES.MINIMALISTIC ? value : INTERFACE_MODES.DEFAULT;
}

export function normalizePresentationMode(value) {
  return value === PRESENTATION_MODES.LOUNGE ? value : PRESENTATION_MODES.DESKTOP;
}

export function experienceProfile(settings = {}) {
  const interfaceMode = normalizeInterfaceMode(settings.interfaceMode);
  const presentationMode = normalizePresentationMode(settings.presentationMode);
  return Object.freeze({
    interfaceMode,
    presentationMode,
    minimalistic: interfaceMode === INTERFACE_MODES.MINIMALISTIC,
    fullscreen: presentationMode === PRESENTATION_MODES.LOUNGE,
    // These are presentation hints only. Domain actions and saved library data
    // must stay shared between every experience.
    informationDensity: interfaceMode === INTERFACE_MODES.MINIMALISTIC ? 'calm' : 'rich',
    navigation: presentationMode === PRESENTATION_MODES.LOUNGE ? 'controller-first' : 'pointer-first',
  });
}

export function selectExperience(settings = {}, patch = {}) {
  return {
    ...settings,
    interfaceMode: normalizeInterfaceMode(patch.interfaceMode ?? settings.interfaceMode),
    presentationMode: normalizePresentationMode(patch.presentationMode ?? settings.presentationMode),
  };
}
