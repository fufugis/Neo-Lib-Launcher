import assert from 'node:assert/strict';
import { BUILTIN_HOME_WIDGETS, HOME_WIDGET_API_VERSION, HOME_WIDGET_GRID, homeWidget, normaliseWidgetSize, widgetSizeIsAllowed, widgetsForSegment } from '../src/components/home/home-widget-registry.mjs';

const ids = BUILTIN_HOME_WIDGETS.map((widget) => widget.id);
assert.equal(HOME_WIDGET_API_VERSION, 1);
assert.equal(new Set(ids).size, ids.length, 'every built-in Home widget must have one stable identity');
assert.deepEqual([...ids].sort(), ['best-games', 'chronicle', 'health', 'news', 'play-next', 'recent', 'released-week', 'storage', 'top-played', 'updates']);
for (const widget of BUILTIN_HOME_WIDGETS) {
  assert.equal(widget.kind, 'first-party');
  assert.deepEqual(widget.capabilities, [], `${widget.id} must not receive native capabilities through its layout registry`);
  assert.equal(homeWidget(widget.id), widget);
  assert(widget.layout.minCols >= 1 && widget.layout.minRows >= 1, `${widget.id} needs a visible minimum size`);
  const atDesktop = normaliseWidgetSize(widget, {}, HOME_WIDGET_GRID.desktop);
  assert(atDesktop.cols >= widget.layout.minCols && atDesktop.rows >= widget.layout.minRows);
  assert.equal(widgetSizeIsAllowed(widget, { cols: widget.layout.minCols - 1, rows: widget.layout.minRows }, HOME_WIDGET_GRID.desktop), false, `${widget.id} cannot be undersized`);
}
assert.deepEqual(widgetsForSegment('play').map((widget) => widget.id), ['play-next', 'recent', 'best-games', 'chronicle']);
assert.deepEqual(normaliseWidgetSize(homeWidget('updates'), { cols: 1, rows: 1 }, 8), { cols: 4, rows: 2 });
assert.deepEqual(normaliseWidgetSize(homeWidget('updates'), { cols: 99, rows: 99 }, 8), { cols: 8, rows: 99 });
assert.equal(homeWidget('unknown-widget'), null);
console.log('PASS: Home has a stable first-party widget registry with responsive size floors and no native/community capabilities. Pure fixtures only.');
