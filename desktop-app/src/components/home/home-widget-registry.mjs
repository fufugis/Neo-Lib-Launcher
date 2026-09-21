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
  firstParty('top-played', 'Top 5 played', 'pinned', { minCols: 6, minRows: 2, defaultCols: 12, defaultRows: 3, maxRows: 6 }, { description: 'Your most-played games and activity totals for the selected period.' }),
  firstParty('news', 'News', 'pinned', { minCols: 6, minRows: 2, defaultCols: 12, defaultRows: 3, maxRows: 6 }, { description: 'A compact rail of recent stories and patch notes from your own library.' }),
  firstParty('play-next', 'What should I play?', 'play', { minCols: 4, minRows: 2, defaultCols: 6, defaultRows: 3, maxRows: 6 }, { description: 'Personal suggestions based on play history, ratings and recent activity.' }),
  firstParty('recent', 'Recently active', 'play', { minCols: 4, minRows: 2, defaultCols: 6, defaultRows: 3, maxRows: 6 }, { description: 'Your latest game sessions in chronological order.' }),
  firstParty('best-games', 'My Best Games', 'play', { minCols: 4, minRows: 2, defaultCols: 6, defaultRows: 3, maxRows: 6 }, { description: 'A quick view of the games with your highest personal ratings.' }),
  firstParty('chronicle', 'Gaming Chronicle', 'play', { minCols: 4, minRows: 2, defaultCols: 6, defaultRows: 3, maxRows: 6 }, { description: 'A local timeline of meaningful library and play events.' }),
  firstParty('updates', 'Game Updates', 'updates', { minCols: 6, minRows: 3, defaultCols: 12, defaultRows: 4, maxRows: 7 }, { description: 'Verified update signals and safe launcher handoffs for installed games.' }),
  firstParty('released-week', 'Recent Game Releases', 'updates', { minCols: 6, minRows: 3, defaultCols: 12, defaultRows: 4, maxRows: 7 }, { description: 'A selective feed of notable recent releases across supported sources.' }),
  firstParty('health', 'Library Health', 'system', { minCols: 4, minRows: 2, defaultCols: 6, defaultRows: 3, maxRows: 6 }, { description: 'Missing metadata, artwork and cleanup opportunities at a glance.' }),
  firstParty('storage', 'Storage Control', 'system', { minCols: 4, minRows: 2, defaultCols: 6, defaultRows: 3, maxRows: 7 }, { description: 'Read-only install-size scans and storage visibility for local games.' }),
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
  const cols = Math.round(Math.max(minCols, Math.min(maxCols, Number(size.cols ?? defaultCols) || defaultCols)));
  const rows = Math.round(Math.max(minRows, Math.min(maxRows, Number(size.rows ?? defaultRows) || defaultRows)));
  return { cols, rows };
}

export function widgetSizeIsAllowed(widget, size, columns = HOME_WIDGET_GRID.desktop) {
  const normalised = normaliseWidgetSize(widget, size, columns);
  return Boolean(normalised && Number(size?.cols) === normalised.cols && Number(size?.rows) === normalised.rows);
}
