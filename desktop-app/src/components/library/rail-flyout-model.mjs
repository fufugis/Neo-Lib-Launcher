export function railFlyoutPosition(anchor, box, viewport) {
  return {
    left: Math.max(8, Math.min(anchor.right + 8, viewport.width - box.width - 8)),
    top: Math.max(8, Math.min(anchor.top, viewport.height - box.height - 8)),
  };
}

export function railFlyoutFocusIndex(key, current, count) {
  if (!count) return -1;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'ArrowDown') return (current + 1 + count) % count;
  if (key === 'ArrowUp') return (current - 1 + count) % count;
  return -1;
}
