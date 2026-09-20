// Home Widgets is deliberately separate from broad NEO-LIB plugins. A Home
// widget describes placement and safe capabilities; it never grants renderer,
// Electron, Node, filesystem or process access by itself.
export const HOME_WIDGET_API_VERSION = 1;

export const HOME_WIDGET_GRID = Object.freeze({ desktop: 12, compact: 8, narrow: 4 });

const firstParty = (id, label, segment, layout, options = {}) => Object.freeze({
  id, label, segment, kind: 'first-party', apiVersion: HOME_WIDGET_API_VERSION,
  capabilities: Object.freeze([]), canDisable: true, layout: Object.freeze(layout), ...options,
});

// This registry is the compatibility contract for today's Home cards. The
// current UI still renders the same React components; the registry lets the
// upcoming grid host own their identity and sizing without changing data flow.
export const BUILTIN_HOME_WIDGETS = Object.freeze([
  firstParty('top-played', 'Top 5 played', 'pinned', { minCols: 4, minRows: 2, defaultCols: 12, defaultRows: 2 }),
  firstParty('news', 'News', 'pinned', { minCols: 4, minRows: 2, defaultCols: 12, defaultRows: 2 }),
  firstParty('play-next', 'What should I play?', 'play', { minCols: 4, minRows: 2, defaultCols: 6, defaultRows: 2 }),
  firstParty('recent', 'Recently active', 'play', { minCols: 4, minRows: 2, defaultCols: 6, defaultRows: 2 }),
  firstParty('best-games', 'My Best Games', 'play', { minCols: 4, minRows: 2, defaultCols: 6, defaultRows: 2 }),
  firstParty('chronicle', 'Gaming Chronicle', 'play', { minCols: 4, minRows: 2, defaultCols: 6, defaultRows: 2 }),
  firstParty('updates', 'Game Updates', 'updates', { minCols: 4, minRows: 2, defaultCols: 12, defaultRows: 3 }),
  firstParty('released-week', 'Recent Game Releases', 'updates', { minCols: 4, minRows: 2, defaultCols: 12, defaultRows: 3 }),
  firstParty('health', 'Library Health', 'system', { minCols: 4, minRows: 2, defaultCols: 6, defaultRows: 2 }),
  firstParty('storage', 'Storage Control', 'system', { minCols: 4, minRows: 2, defaultCols: 6, defaultRows: 2 }),
]);

export const HOME_WIDGET_BY_ID = Object.freeze(Object.fromEntries(BUILTIN_HOME_WIDGETS.map((widget) => [widget.id, widget])));
export function homeWidget(id) { return HOME_WIDGET_BY_ID[id] || null; }
export function homeWidgetLabel(id) { return homeWidget(id)?.label || 'widget'; }
export function widgetsForSegment(segment) { return BUILTIN_HOME_WIDGETS.filter((widget) => widget.segment === segment); }

export function normaliseWidgetSize(widget, size = {}, columns = HOME_WIDGET_GRID.desktop) {
  if (!widget || !Number.isFinite(Number(columns)) || Number(columns) < 1) return null;
  const maxCols = Math.min(Number(widget.layout.maxCols || columns), Number(columns));
  const minCols = Math.min(Number(widget.layout.minCols || 1), maxCols);
  const minRows = Number(widget.layout.minRows || 1);
  const maxRows = Number(widget.layout.maxRows || Number.MAX_SAFE_INTEGER);
  const defaultCols = Number(widget.layout.defaultCols || minCols);
  const defaultRows = Number(widget.layout.defaultRows || minRows);
  const cols = Math.max(minCols, Math.min(maxCols, Number(size.cols ?? defaultCols) || defaultCols));
  const rows = Math.max(minRows, Math.min(maxRows, Number(size.rows ?? defaultRows) || defaultRows));
  return { cols, rows };
}

export function widgetSizeIsAllowed(widget, size, columns = HOME_WIDGET_GRID.desktop) {
  const normalised = normaliseWidgetSize(widget, size, columns);
  return Boolean(normalised && Number(size?.cols) === normalised.cols && Number(size?.rows) === normalised.rows);
}
