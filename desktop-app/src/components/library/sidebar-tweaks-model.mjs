export const SIDEBAR_BUTTONS = Object.freeze([
  ['sidebar-rail-lounge-btn', 'Lounge'], ['sidebar-rail-wizard-btn', 'Add games'],
  ['tab-home', 'Home'], ['tab-library', 'Library'], ['tab-cover-wall', 'Wall'],
  ['tab-tools', 'Tools'], ['sidebar-rail-modules-btn', 'Modules'],
  ['sidebar-rail-visuals-menu-btn', 'Visuals'], ['sidebar-rail-settings-menu-btn', 'Settings'],
  ['sidebar-rail-changelog-btn', 'Patch notes'], ['sidebar-rail-rest-toggle', 'Rest / Wake'], ['sidebar-rail-quit-btn', 'Quit'],
]);
export const DEFAULT_SIDEBAR_TWEAKS = Object.freeze({ spacing: 4, iconSize: 21, buttonSize: 100, saturation: 100, mode: 'default', order: [] });
export function sidebarButtonGeometry(preferences) {
  const scale = normalizeSidebarTweaks(preferences).buttonSize / 100;
  return { scale, compact: Math.round(48 * scale), expanded: Math.round(148 * scale) };
}
export function sidebarIsExpanded(preferences, hovering, previewOpen) {
  return preferences.mode !== 'icons' && (previewOpen || hovering);
}
const clamp = (value, fallback, min, max) => Number.isFinite(Number(value)) && value !== null ? Math.min(max, Math.max(min, Math.round(Number(value)))) : fallback;
export function normalizeSidebarTweaks(raw = {}) {
  return { spacing: clamp(raw?.spacing, 4, 0, 16), iconSize: clamp(raw?.iconSize, 21, 14, 30), buttonSize: clamp(raw?.buttonSize, 100, 75, 150), saturation: clamp(raw?.saturation, 100, 0, 200), mode: raw?.mode === 'icons' ? 'icons' : 'default',
    order: [...new Set((Array.isArray(raw?.order) ? raw.order : []).filter(id => SIDEBAR_BUTTONS.some(([key]) => key === id) || (typeof id === 'string' && /^addon-[\w.-]{1,100}$/.test(id))))].slice(0, 100),
  };
}
export function sidebarButtonList(addons = []) {
  return [...SIDEBAR_BUTTONS.slice(0, 5), ...addons.map(addon => [`addon-${addon.id}`, addon.name]), ...SIDEBAR_BUTTONS.slice(5)];
}
export function orderedSidebarIds(order, available) {
  const valid = new Set(available);
  return [...new Set([...(order || []).filter(id => valid.has(id)), ...available])];
}
export function moveSidebarButton(order, available, id, direction) {
  const next = orderedSidebarIds(order, available);
  const from = next.indexOf(id), to = from + direction;
  if (from >= 0 && to >= 0 && to < next.length) [next[from], next[to]] = [next[to], next[from]];
  return [...next, ...(order || []).filter(key => !available.includes(key))];
}
