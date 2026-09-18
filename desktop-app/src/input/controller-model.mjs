export const WINDOWS_CONTROLLER_SETTINGS = 'ms-settings:bluetooth';

export const CONTROLLER_ACTIONS = Object.freeze({
  CONFIRM: 'confirm', BACK: 'back', DETAILS: 'details', SEARCH: 'search',
  PREVIOUS_SECTION: 'previous-section', NEXT_SECTION: 'next-section',
  MENU: 'menu', HOME: 'home',
});

// Standard Gamepad mapping only. Brand-specific glyphs are a later view concern.
export const STANDARD_BUTTON_ACTIONS = Object.freeze({
  0: CONTROLLER_ACTIONS.CONFIRM,
  1: CONTROLLER_ACTIONS.BACK,
  2: CONTROLLER_ACTIONS.DETAILS,
  3: CONTROLLER_ACTIONS.SEARCH,
  4: CONTROLLER_ACTIONS.PREVIOUS_SECTION,
  5: CONTROLLER_ACTIONS.NEXT_SECTION,
  9: CONTROLLER_ACTIONS.MENU,
  16: CONTROLLER_ACTIONS.HOME,
});

function cleanLabel(value, fallback) {
  const label = String(value || '').replace(/\s+/g, ' ').trim();
  return (label || fallback).slice(0, 120);
}

function stableHash(value) {
  let hash = 0x811c9dc5;
  for (const character of String(value || '')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function controllerFingerprint(gamepad) {
  if (!gamepad) return '';
  return stableHash([
    cleanLabel(gamepad.id, 'controller'),
    gamepad.mapping === 'standard' ? 'standard' : 'unknown',
    Math.max(0, Number(gamepad.buttons?.length ?? gamepad.buttons) || 0),
    Math.max(0, Number(gamepad.axes?.length ?? gamepad.axes) || 0),
  ].join('|'));
}

export function controllerInputState(gamepad) {
  if (!gamepad || gamepad.connected === false) return Object.freeze({ pressed: [], axes: [] });
  const pressed = Array.from(gamepad.buttons || []).flatMap((button, index) => {
    const value = Math.max(0, Math.min(1, Number(button?.value ?? (button?.pressed ? 1 : 0)) || 0));
    return button?.pressed || value >= 0.12 ? [{ index, value }] : [];
  });
  const axes = Array.from(gamepad.axes || []).map((value) => {
    const normalized = Math.max(-1, Math.min(1, Number(value) || 0));
    return Math.abs(normalized) >= 0.08 ? normalized : 0;
  });
  return Object.freeze({ pressed, axes });
}

export function normalizeGamepad(gamepad) {
  if (!gamepad || gamepad.connected === false || !Number.isInteger(gamepad.index)) return null;
  return Object.freeze({
    index: gamepad.index,
    id: cleanLabel(gamepad.id, `Controller ${gamepad.index + 1}`),
    mapping: gamepad.mapping === 'standard' ? 'standard' : 'unknown',
    connected: true,
    buttons: Math.max(0, Number(gamepad.buttons?.length) || 0),
    axes: Math.max(0, Number(gamepad.axes?.length) || 0),
    timestamp: Math.max(0, Number(gamepad.timestamp) || 0),
    fingerprint: controllerFingerprint(gamepad),
  });
}

export function controllerInventory(gamepads = [], preferredFingerprint = '') {
  const rawControllers = Array.from(gamepads || []).filter(Boolean);
  const normalized = rawControllers.map(normalizeGamepad).filter(Boolean).sort((a, b) => a.index - b.index);
  const fingerprintCounts = normalized.reduce((counts, pad) => counts.set(pad.fingerprint, (counts.get(pad.fingerprint) || 0) + 1), new Map());
  const fingerprintOrdinals = new Map();
  const controllers = normalized.map((pad) => {
    if (fingerprintCounts.get(pad.fingerprint) === 1) return pad;
    const ordinal = (fingerprintOrdinals.get(pad.fingerprint) || 0) + 1;
    fingerprintOrdinals.set(pad.fingerprint, ordinal);
    return Object.freeze({ ...pad, fingerprint: `${pad.fingerprint}-${ordinal}` });
  });
  const preferred = controllers.find((pad) => pad.fingerprint === preferredFingerprint)
    || controllers.find((pad) => pad.index === Number(preferredFingerprint))
    || controllers[0]
    || null;
  const selectedRaw = preferred ? rawControllers.find((pad) => pad.index === preferred.index) : null;
  return Object.freeze({
    controllers,
    selectedIndex: preferred?.index ?? null,
    selectedFingerprint: preferred?.fingerprint || '',
    selectedInput: controllerInputState(selectedRaw),
    connectedCount: controllers.length,
  });
}

export function controllerChanges(previous = [], next = []) {
  const before = new Set(previous.map((pad) => pad.index));
  const after = new Set(next.map((pad) => pad.index));
  return Object.freeze({
    connected: next.filter((pad) => !before.has(pad.index)),
    disconnected: previous.filter((pad) => !after.has(pad.index)),
  });
}
