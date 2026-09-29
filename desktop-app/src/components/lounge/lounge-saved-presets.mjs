import { normalizeLoungePreferences } from './lounge-layout-model.mjs';

export function normalizeLoungeSavedPresets(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 24).flatMap(item => {
    if (!item || typeof item !== 'object' || typeof item.name !== 'string' || typeof item.preferences !== 'object') return [];
    const name = item.name.trim().slice(0, 48);
    if (!name) return [];
    const preferences = normalizeLoungePreferences(item.preferences);
    // Presets never grant access to private categories.
    preferences.showPrivateGamesInLounge = false;
    return [{ id: typeof item.id === 'string' ? item.id.slice(0, 80) : '', name, layout: item.layout === 'wall' ? 'wall' : 'browser', preferences }];
  });
}
