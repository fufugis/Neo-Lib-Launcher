export const LAUNCHER_LABELS = Object.freeze({
  steam: 'Steam', epic: 'Epic Games', ea: 'EA', gog: 'GOG',
  ubisoft: 'Ubisoft Connect', battlenet: 'Battle.net', riot: 'Riot Client',
  xbox: 'Xbox / Game Pass', rockstar: 'Rockstar Games', itch: 'itch.io',
});

export const LAUNCHER_CATEGORIES = Object.freeze({
  steam: Object.freeze({ id: '__launcher_steam__', name: 'Steam', colorId: 'cyan', pinnedBottom: true, logoLabel: 'Steam' }),
  epic: Object.freeze({ id: '__launcher_epic__', name: 'Epic Games', colorId: 'slate', pinnedBottom: true, logoLabel: 'Epic' }),
  gog: Object.freeze({ id: '__launcher_gog__', name: 'GOG', colorId: 'violet', pinnedBottom: true, logoLabel: 'GOG' }),
  ea: Object.freeze({ id: '__launcher_ea__', name: 'EA App', colorId: 'orange', pinnedBottom: true, logoLabel: 'EA' }),
  ubisoft: Object.freeze({ id: '__launcher_ubisoft__', name: 'Ubisoft', colorId: 'blue', pinnedBottom: true, logoLabel: 'Ubi' }),
  battlenet: Object.freeze({ id: '__launcher_battlenet__', name: 'Battle.net', colorId: 'cyan', pinnedBottom: true, logoLabel: 'Bnet' }),
  riot: Object.freeze({ id: '__launcher_riot__', name: 'Riot', colorId: 'red', pinnedBottom: true, logoLabel: 'Riot' }),
  xbox: Object.freeze({ id: '__launcher_xbox__', name: 'Xbox / Game Pass', colorId: 'green', pinnedBottom: true, logoLabel: 'Xbox' }),
  rockstar: Object.freeze({ id: '__launcher_rockstar__', name: 'Rockstar', colorId: 'yellow', pinnedBottom: true, logoLabel: 'R*' }),
  itch: Object.freeze({ id: '__launcher_itch__', name: 'itch.io', colorId: 'red', pinnedBottom: true, logoLabel: 'itch' }),
});

export function launcherCategory(launcher) {
  return LAUNCHER_CATEGORIES[String(launcher || '').toLowerCase()] || null;
}

export function ensureLauncherCategory(categories = [], launcher) {
  const category = launcherCategory(launcher);
  if (!category || categories.some((item) => item.id === category.id)) return categories;
  return [...categories, category];
}

export function assignLauncherCategory(categoryIds = [], launcher) {
  const category = launcherCategory(launcher);
  return category ? [...new Set([...(categoryIds || []), category.id])] : [...(categoryIds || [])];
}
