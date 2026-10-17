// Presentation only: outer canvas positions, dimensions and permissions never change.
export function normalizeHomeContentSize(value) {
  return Number.isFinite(Number(value)) && value != null
    ? Math.max(100, Math.min(180, Math.round(Number(value) / 5) * 5)) : 100;
}

export function homeContentSize(layout = {}, id) {
  return normalizeHomeContentSize(layout.widgetContentSizes?.[id] ?? layout.contentSize);
}

export function homeContentSizePatch(layout, id, value) {
  if (!id) return { contentSize: normalizeHomeContentSize(value) };
  return { widgetContentSizes: { ...(layout.widgetContentSizes || {}), [id]: normalizeHomeContentSize(value) } };
}
