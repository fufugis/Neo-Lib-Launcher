import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BUILTIN_HOME_WIDGETS, HOME_WIDGET_API_VERSION, HOME_WIDGET_GRID, homeWidget, normaliseWidgetSize, widgetSizeIsAllowed, widgetsForSegment } from '../src/components/home/home-widget-registry.mjs';

const homeSource = readFileSync(new URL('../src/components/HomeHub.jsx', import.meta.url), 'utf8');
const managerSource = readFileSync(new URL('../src/components/home/WidgetManagerModal.jsx', import.meta.url), 'utf8');

const ids = BUILTIN_HOME_WIDGETS.map((widget) => widget.id);
assert.equal(HOME_WIDGET_API_VERSION, 1);
assert.equal(new Set(ids).size, ids.length, 'every built-in Home widget must have one stable identity');
assert.deepEqual([...ids].sort(), ['best-games', 'chronicle', 'health', 'news', 'play-next', 'recent', 'released-week', 'storage', 'top-played', 'updates']);
for (const widget of BUILTIN_HOME_WIDGETS) {
  assert.equal(widget.kind, 'first-party');
  assert.deepEqual(widget.capabilities, [], `${widget.id} must not receive native capabilities through its layout registry`);
  assert.equal(homeWidget(widget.id), widget);
  assert.equal(typeof widget.description, 'string', `${widget.id} needs a player-readable manager description`);
  assert(widget.layout.minCols >= 1 && widget.layout.minRows >= 1, `${widget.id} needs a visible minimum size`);
  assert(widget.layout.maxRows >= widget.layout.defaultRows, `${widget.id} needs a bounded resize ceiling`);
  const atDesktop = normaliseWidgetSize(widget, {}, HOME_WIDGET_GRID.desktop);
  assert(atDesktop.cols >= widget.layout.minCols && atDesktop.rows >= widget.layout.minRows);
  assert.equal(widgetSizeIsAllowed(widget, { cols: widget.layout.minCols - 1, rows: widget.layout.minRows }, HOME_WIDGET_GRID.desktop), false, `${widget.id} cannot be undersized`);
}
assert.deepEqual(widgetsForSegment('play').map((widget) => widget.id), ['play-next', 'recent', 'best-games', 'chronicle']);
assert.deepEqual(normaliseWidgetSize(homeWidget('updates'), { cols: 1, rows: 1 }, 8), { cols: 6, rows: 3 });
assert.deepEqual(normaliseWidgetSize(homeWidget('updates'), { cols: 99, rows: 99 }, 8), { cols: 8, rows: 7 });
assert.deepEqual(normaliseWidgetSize(homeWidget('recent'), { cols: 5.6, rows: 2.6 }, 12), { cols: 6, rows: 3 });
assert.equal(homeWidget('unknown-widget'), null);
assert.match(homeSource, /data-testid="home-layout-lock-toggle"/, 'Home must expose an explicit Unlock and Done control');
assert.match(homeSource, /data-home-layout-unlocked=/, 'Home must expose its grid editing state');
assert.match(homeSource, /onContextMenu=\{openContextMenu\}/, 'widget title bars must expose the context menu');
assert.match(homeSource, /Drag to resize/, 'unlocked widgets must expose a resize grip');
assert.match(homeSource, /widgetSizes:/, 'widget dimensions must persist in Home layout settings');
assert.match(managerSource, /xl:grid-cols-3/, 'the widget manager must support a tidy three-column layout');
assert.match(managerSource, /aria-label=\{`\$\{hidden \? 'Show' : 'Hide'\}/, 'visibility must use a compact accessible eye control');
console.log('PASS: Home has a stable responsive widget grid, explicit edit lock, bounded resizing, title-bar menus and a compact manager. Source and pure fixtures only.');
