export const EMPTY_LIBRARY = Object.freeze({
  games: [], categories: [], gameOrderByCategory: {},
  tools: [], toolCategories: [], toolOrderByCategory: {},
});

export function workspaceKeys(mode) {
  return mode === 'tools'
    ? { items: 'tools', cats: 'toolCategories', order: 'toolOrderByCategory' }
    : { items: 'games', cats: 'categories', order: 'gameOrderByCategory' };
}

export function hydrateLibrary(raw = {}, { now = Date.now(), resetRatings = false, normalizeGenres = null, taxonomyVersion = null } = {}) {
  const games = Array.isArray(raw.games) ? raw.games.map((game) => {
    const hydrated = { categoryIds: [], addedAt: now, ...game };
    if (!Object.prototype.hasOwnProperty.call(hydrated, 'librarySeenAt')) hydrated.librarySeenAt = hydrated.addedAt || now;
    if (resetRatings) { delete hydrated.rating; delete hydrated.ratedAt; }
    const evidence = hydrated.genreTags?.length ? hydrated.genreTags : (hydrated.genres || []);
    if (typeof normalizeGenres === 'function' && evidence.length
      && (!hydrated.genreProfile || hydrated.genreProfile.taxonomyVersion !== taxonomyVersion)) {
      hydrated.genreProfile = normalizeGenres({ rawTags: evidence, source: hydrated.source || 'web' });
    }
    return hydrated;
  }) : [];
  const tools = Array.isArray(raw.tools) ? raw.tools.map((tool) => ({ categoryIds: [], addedAt: now, ...tool })) : [];
  return {
    games,
    categories: Array.isArray(raw.categories) ? raw.categories : [],
    gameOrderByCategory: objectOrEmpty(raw.gameOrderByCategory),
    tools,
    toolCategories: Array.isArray(raw.toolCategories) ? raw.toolCategories : [],
    toolOrderByCategory: objectOrEmpty(raw.toolOrderByCategory),
  };
}

export function selectWorkspace(library = EMPTY_LIBRARY, mode = 'library') {
  const keys = workspaceKeys(mode);
  return {
    keys,
    items: Array.isArray(library[keys.items]) ? library[keys.items] : [],
    categories: Array.isArray(library[keys.cats]) ? library[keys.cats] : [],
    order: objectOrEmpty(library[keys.order]),
  };
}

export function filterByLauncher(items = [], launcherFilter = 'all', isTools = false) {
  if (isTools || launcherFilter === 'all') return items;
  return items.filter((item) => {
    const launcher = String(item.launcher || '').toLowerCase();
    if (launcherFilter === 'other') return !['steam', 'epic', 'ea', 'gog', 'ubisoft', 'battlenet', 'riot', 'xbox', 'rockstar', 'itch'].includes(launcher);
    return launcher === launcherFilter;
  });
}

export function updateWorkspaceItem(library, mode, id, patch) {
  const { items } = workspaceKeys(mode);
  return { ...library, [items]: (library[items] || []).map((item) => item.id === id ? { ...item, ...patch } : item) };
}

export function deleteWorkspaceCategory(library, mode, id) {
  const keys = workspaceKeys(mode);
  return {
    ...library,
    [keys.cats]: (library[keys.cats] || []).filter((category) => category.id !== id),
    [keys.items]: (library[keys.items] || []).map((item) => ({ ...item, categoryIds: (item.categoryIds || []).filter((categoryId) => categoryId !== id) })),
    [keys.order]: Object.fromEntries(Object.entries(library[keys.order] || {}).filter(([categoryId]) => categoryId !== id)),
  };
}

export function clearRegularGameCategories(library) {
  const removed = new Set((library.categories || []).filter((category) => !category.private).map((category) => category.id));
  return {
    ...library,
    categories: (library.categories || []).filter((category) => category.private),
    games: (library.games || []).map((game) => ({ ...game, categoryIds: (game.categoryIds || []).filter((id) => !removed.has(id)) })),
    gameOrderByCategory: Object.fromEntries(Object.entries(library.gameOrderByCategory || {}).filter(([id]) => !removed.has(id))),
  };
}

export function reorderWorkspaceCategory(library, mode, fromId, beforeId) {
  const { cats } = workspaceKeys(mode);
  const list = [...(library[cats] || [])];
  const from = list.findIndex((category) => category.id === fromId);
  if (from < 0) return library;
  const [item] = list.splice(from, 1);
  const destination = list.findIndex((category) => category.id === beforeId);
  list.splice(destination < 0 ? list.length : destination, 0, item);
  return { ...library, [cats]: list };
}

export function moveWorkspaceItem(library, mode, itemId, fromCategoryId, toCategoryId, { copy = false, beforeItemId } = {}) {
  const keys = workspaceKeys(mode);
  const items = (library[keys.items] || []).map((item) => {
    if (item.id !== itemId) return item;
    const ids = new Set(item.categoryIds || []);
    if (!copy && fromCategoryId) ids.delete(fromCategoryId);
    if (toCategoryId) ids.add(toCategoryId);
    return { ...item, categoryIds: [...ids] };
  });
  const order = { ...(library[keys.order] || {}) };
  const targetKey = toCategoryId || '__uncat__';
  const target = (order[targetKey] || []).filter((id) => id !== itemId);
  const before = target.indexOf(beforeItemId);
  target.splice(before < 0 ? target.length : before, 0, itemId);
  order[targetKey] = target;
  if (!copy && fromCategoryId) order[fromCategoryId] = (order[fromCategoryId] || []).filter((id) => id !== itemId);
  return { ...library, [keys.items]: items, [keys.order]: order };
}

export function reorderWorkspaceItem(library, mode, categoryId, fromId, beforeId) {
  const { order: orderKey } = workspaceKeys(mode);
  const order = { ...(library[orderKey] || {}) };
  const ids = [...(order[categoryId] || [])];
  const current = ids.indexOf(fromId);
  if (current >= 0) ids.splice(current, 1);
  const destination = ids.indexOf(beforeId);
  ids.splice(destination < 0 ? ids.length : destination, 0, fromId);
  order[categoryId] = ids;
  return { ...library, [orderKey]: order };
}

export function applyGameSession(library, gameId, seconds, now = Date.now()) {
  const minutes = Math.max(0, Number(seconds) || 0) / 60;
  return {
    ...library,
    games: (library.games || []).map((game) => game.id === gameId
      ? { ...game, playtime: (Number(game.playtime) || 0) + minutes, lastPlayedAt: now }
      : game),
  };
}

function objectOrEmpty(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
