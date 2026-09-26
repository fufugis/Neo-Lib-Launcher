import { normaliseWidgetSize } from './home-widget-registry.mjs';

export const WIDGET_RESIZE_DIRECTIONS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

export function resizeFreeWidget(position, direction, dx, dy) {
  const next = { ...position };
  if (direction.includes('w')) {
    next.x = Math.max(0, Math.min(position.x + dx, position.x + position.width - 160));
    next.width = position.x + position.width - next.x;
  } else if (direction.includes('e')) next.width = Math.max(160, position.width + dx);
  if (direction.includes('n')) {
    next.y = Math.max(0, Math.min(position.y + dy, position.y + position.height - 80));
    next.height = position.y + position.height - next.y;
  } else if (direction.includes('s')) next.height = Math.max(80, position.height + dy);
  return next;
}

export function resizeGridWidget(widget, size, columns, direction, dx, dy, columnStep, rowStep) {
  const horizontal = direction.includes('w') ? -1 : direction.includes('e') ? 1 : 0;
  const vertical = direction.includes('n') ? -1 : direction.includes('s') ? 1 : 0;
  return normaliseWidgetSize(widget, {
    cols: size.cols + horizontal * Math.round(dx / columnStep),
    rows: size.rows + vertical * Math.round(dy / rowStep),
  }, columns);
}
