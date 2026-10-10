const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const HOME_EDITOR_GRID = 24;

export function normalizeEditorBox(raw = {}) {
  raw = raw || {};
  return { x: clamp(finite(raw.x, 0), 0, 100000), y: clamp(finite(raw.y, 0), 0, 100000),
    width: clamp(finite(raw.width, 300), 160, 100000), height: clamp(finite(raw.height, 240), 80, 100000) };
}

export function createHomeEditorDraft(widgets, captured, layout = {}, canvas = {}) {
  const positions = Object.fromEntries(widgets.map((widget, index) => [widget.id,
    normalizeEditorBox(captured[widget.id] || layout.freePositions?.[widget.id] || { x: 0, y: index * 260, width: 480, height: 240 })]));
  return { positions, order: widgets.map(widget => widget.id), snap: layout.editorSnapToGrid !== false,
    width: Math.max(320, finite(canvas.width, 320), ...Object.values(positions).map(box => box.x + box.width + 24)),
    height: Math.max(540, finite(canvas.height, 540), ...Object.values(positions).map(box => box.y + box.height + 24)) };
}

export function adjustEditorBox(box, dx, dy, canvas, snap = true, resize = false) {
  const initial = normalizeEditorBox(box);
  const align = value => snap ? Math.round(value / HOME_EDITOR_GRID) * HOME_EDITOR_GRID : Math.round(value);
  const width = Math.max(160, finite(canvas.width, 320));
  const height = Math.max(80, finite(canvas.height, 540));
  const next = resize ? { ...initial,
    width: clamp(align(initial.width + finite(dx, 0)), 160, Math.max(160, width - initial.x)),
    height: clamp(align(initial.height + finite(dy, 0)), 80, Math.max(80, height - initial.y)),
  } : { ...initial,
    x: clamp(align(initial.x + finite(dx, 0)), 0, Math.max(0, width - initial.width)),
    y: clamp(align(initial.y + finite(dy, 0)), 0, Math.max(0, height - initial.height)),
  };
  return next;
}

export function homeEditorSavePatch(layout, draft, activeIds) {
  const allowed = new Set(activeIds);
  const editedIds = draft.order.filter(id => allowed.has(id));
  // Unknown/hidden widget data and unrelated settings remain core-owned.
  const positions = { ...(layout.freePositions || {}) };
  for (const id of editedIds) positions[id] = normalizeEditorBox(draft.positions[id]);
  return { freePositions: positions, snapToGrid: false, editorSnapToGrid: draft.snap === true,
    widgetOrder: [...new Set([...(layout.widgetOrder || []).filter(id => !editedIds.includes(id)), ...editedIds])] };
}

export function homeEditorFitZoom(draft, viewport) {
  return clamp(Math.min((viewport.width - 48) / draft.width, (viewport.height - 48) / draft.height, 0.75), 0.1, 1);
}
