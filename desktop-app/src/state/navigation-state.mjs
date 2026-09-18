const MODES = new Set(['home', 'library', 'wall', 'tools']);

export function hydrateNavigation(settings = {}, library = {}) {
  const mode = settings.mode === 'tools' ? 'tools' : 'home';
  return {
    mode,
    selectedGameId: existingId(library.games, settings.lastGameId),
    selectedToolId: existingId(library.tools, settings.lastToolId),
  };
}

export function preferredLibraryGame(games = [], rememberedId = null) {
  const remembered = games.find((game) => game.id === rememberedId);
  if (remembered) return remembered;
  return [...games].sort((left, right) => Number(right.lastPlayedAt || right.lastPlayed || 0) - Number(left.lastPlayedAt || left.lastPlayed || 0))[0] || null;
}

export function preferredTool(tools = [], rememberedId = null) {
  return tools.find((tool) => tool.id === rememberedId) || tools[0] || null;
}

export function navigationTransition(state, event, library = {}) {
  const current = state || hydrateNavigation({}, library);
  if (!event || typeof event !== 'object') return current;
  if (event.type === 'OPEN_HOME') return { ...current, mode: 'home' };
  if (event.type === 'OPEN_WALL') return { ...current, mode: 'wall' };
  if (event.type === 'OPEN_LIBRARY') {
    const game = preferredLibraryGame(library.games || [], current.selectedGameId);
    return { ...current, mode: 'library', selectedGameId: game?.id || null };
  }
  if (event.type === 'OPEN_TOOLS') {
    const tool = preferredTool(library.tools || [], current.selectedToolId);
    return { ...current, mode: 'tools', selectedToolId: tool?.id || null };
  }
  if (event.type === 'SELECT_GAME') return { ...current, selectedGameId: existingId(library.games, event.id) };
  if (event.type === 'SELECT_TOOL') return { ...current, selectedToolId: existingId(library.tools, event.id) };
  if (event.type === 'RESTORE') return hydrateNavigation(event.settings || {}, library);
  if (event.type === 'MODE' && MODES.has(event.mode)) return { ...current, mode: event.mode };
  return current;
}

export function selectionSettingsPatch(state) {
  return { lastGameId: state?.selectedGameId || null, lastToolId: state?.selectedToolId || null };
}

function existingId(items = [], id) {
  return items.some((item) => item.id === id) ? id : null;
}
