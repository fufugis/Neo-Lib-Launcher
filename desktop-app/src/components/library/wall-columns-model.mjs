export const WALL_COLUMN_DEFINITIONS = Object.freeze([
  Object.freeze({ id: 'game', label: 'Game', minWidth: 220, defaultWidth: 300, required: true }),
  Object.freeze({ id: 'mainGenre', label: 'Main genre', minWidth: 100, defaultWidth: 140 }),
  Object.freeze({ id: 'journeyStatus', label: 'Journey status', minWidth: 105, defaultWidth: 130 }),
  Object.freeze({ id: 'released', label: 'Released', minWidth: 105, defaultWidth: 120 }),
  Object.freeze({ id: 'lastPlayed', label: 'Last played', minWidth: 105, defaultWidth: 125 }),
  Object.freeze({ id: 'installSize', label: 'Install size', minWidth: 95, defaultWidth: 110 }),
  Object.freeze({ id: 'playtime', label: 'Time played', minWidth: 95, defaultWidth: 110 }),
  Object.freeze({ id: 'source', label: 'Source', minWidth: 85, defaultWidth: 110 }),
  Object.freeze({ id: 'rating', label: 'Rating', minWidth: 70, defaultWidth: 82 }),
]);

const DEFINITION_BY_ID = new Map(WALL_COLUMN_DEFINITIONS.map((column) => [column.id, column]));

export function normalizeWallColumns(columns = []) {
  const supplied = new Map();
  for (const column of Array.isArray(columns) ? columns : []) {
    const definition = DEFINITION_BY_ID.get(column?.id);
    if (!definition || supplied.has(definition.id)) continue;
    supplied.set(definition.id, {
      id: definition.id,
      visible: definition.required || column.visible !== false,
      width: Math.max(definition.minWidth, Math.min(640, Number(column.width) || definition.defaultWidth)),
    });
  }
  const ordered = [...supplied.values()];
  for (const definition of WALL_COLUMN_DEFINITIONS) {
    if (!supplied.has(definition.id)) ordered.push({ id: definition.id, visible: true, width: definition.defaultWidth });
  }
  const gameIndex = ordered.findIndex(({ id }) => id === 'game');
  if (gameIndex > 0) ordered.unshift(ordered.splice(gameIndex, 1)[0]);
  return Object.freeze(ordered.map((column) => Object.freeze(column)));
}

export function visibleWallColumns(columns = []) {
  return Object.freeze(normalizeWallColumns(columns).filter((column) => column.visible));
}
