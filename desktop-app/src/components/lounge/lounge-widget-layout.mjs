export const loungePanelPositions = shelf => ['left', 'center', 'right', ...(['left', 'right'].includes(shelf) ? ['bottom-left', 'bottom-center', 'bottom-right'] : [])];
export function resolveLoungePanelPositions(shelf, hero, widgets) {
  const allowed = loungePanelPositions(shelf);
  const previewPosition = allowed.includes(hero) ? hero : 'left';
  const widgetPosition = allowed.includes(widgets) && widgets !== previewPosition ? widgets : allowed.find(position => position !== previewPosition);
  return { previewPosition, widgetPosition };
}

// Free space above the composition is usable only in the widget's own lane.
export function loungeWidgetTopBoundary(originTop, viewportTop, widget, controls = []) {
  const edge = controls.reduce((top, control) => control.width > 0 && control.height > 0 && widget.left < control.right && widget.left + widget.width > control.left ? Math.max(top, control.bottom + 16) : top, viewportTop + 16);
  return Math.min(16, edge - originTop);
}

export function loungeWidgetHeightBounds(height, preferences, hero, widgetTop = 16) {
  const positions = resolveLoungePanelPositions(preferences.shelfPosition, preferences.previewPosition, preferences.widgetPosition);
  let top = widgetTop, bottom = Math.max(16, height - 16);
  if (positions.previewPosition.startsWith('bottom-') !== positions.widgetPosition.startsWith('bottom-')) {
    if (positions.widgetPosition.startsWith('bottom-')) top = Math.min(bottom, hero.top + hero.height + 16);
    else bottom = Math.max(top, hero.top - 16);
  }
  return { top, bottom, height: bottom - top };
}

export function loungePanelClearance(height, rect, obstacles = []) {
  return obstacles.reduce((limit, card) => rect.left < card.right && rect.left + rect.width > card.left ? Math.min(limit, card.top) : limit, height);
}

// Layout only runs when the host resizes or placement controls change, never
// when a game is selected. Split occupied rows at the midpoint between anchors.
export function loungePanelRects(width, height, preferences, obstacles = [], widgetTop = 16) {
  const gap = 16;
  const w = Math.max(0, width - gap * 2), h = Math.max(0, height - gap * 2);
  const positions = resolveLoungePanelPositions(preferences.shelfPosition, preferences.previewPosition, preferences.widgetPosition);
  const entries = [{ key: 'hero', position: positions.previewPosition, width: preferences.previewWidth, height: preferences.previewBoxHeight, offset: preferences.previewVerticalOffset }];
  if (preferences.widgetAreaEnabled) entries.push({ key: 'widgets', position: positions.widgetPosition, width: preferences.widgetWidth, height: preferences.widgetHeight, offset: preferences.widgetVerticalOffset });
  const hasBottom = entries.some(entry => entry.position.startsWith('bottom-'));
  const hasTop = entries.some(entry => !entry.position.startsWith('bottom-'));
  const splitRows = hasBottom && hasTop;
  const anchor = position => position.endsWith('left') ? 0 : position.endsWith('right') ? 1 : 0.5;
  const rectangles = Object.fromEntries(entries.map(entry => {
    const bottom = entry.position.startsWith('bottom-');
    const peer = entries.find(other => other !== entry && other.position.startsWith('bottom-') === bottom);
    const a = anchor(entry.position), b = peer ? anchor(peer.position) : null;
    const edge = b === null ? null : (a + b) / 2;
    const start = edge !== null && a > b ? edge * w + gap / 2 : 0;
    const end = edge !== null && a < b ? edge * w - gap / 2 : w;
    const boxWidth = Math.max(0, Math.min(w * entry.width / 100, end - start));
    const rowStart = splitRows && bottom ? h / 2 + gap / 2 : 0;
    const x = Math.max(start, Math.min(end - boxWidth, a * w - a * boxWidth));
    const localEnd = Math.max(0, loungePanelClearance(height, { left: gap + x, width: boxWidth }, obstacles) - gap * 2);
    const rowEnd = Math.min(splitRows && !bottom ? h / 2 - gap / 2 : h, localEnd);
    const boxHeight = Math.max(0, Math.min(entry.height, rowEnd - rowStart));
    const y = Math.max(rowStart, Math.min(rowEnd - boxHeight, rowEnd - boxHeight - (entry.offset || 0)));
    return [entry.key, { left: gap + x, top: gap + y, width: boxWidth, height: boxHeight }];
  }));
  // Grow widgets into unused space beside the actual hero, not an arbitrary
  // anchor midpoint. The hero's saved size/position never changes here.
  if (rectangles.widgets) {
    const hero = rectangles.hero, widgets = rectangles.widgets;
    const sameRow = positions.previewPosition.startsWith('bottom-') === positions.widgetPosition.startsWith('bottom-');
    if (sameRow) {
      const widgetsAfter = anchor(positions.widgetPosition) > anchor(positions.previewPosition);
      const start = widgetsAfter ? hero.left + hero.width + gap : gap;
      const end = widgetsAfter ? width - gap : hero.left - gap;
      widgets.width = Math.max(0, Math.min(w * preferences.widgetWidth / 100, end - start));
      widgets.left = Math.max(start, Math.min(end - widgets.width, gap + anchor(positions.widgetPosition) * (w - widgets.width)));
    }
    // Use the actual free row, not a fixed screen-height/pixel slider cap.
    const bounds = loungeWidgetHeightBounds(loungePanelClearance(height, widgets, obstacles), preferences, hero, widgetTop);
    widgets.height = Math.max(0, Math.min(preferences.widgetHeight, bounds.height));
    const travel = bounds.height - widgets.height;
    // Saved -300..300 now spans bottom..top across ALL available travel.
    widgets.top = bounds.top + travel * (300 - Math.max(-300, Math.min(300, preferences.widgetVerticalOffset || 0))) / 600;
  }
  return rectangles;
}
