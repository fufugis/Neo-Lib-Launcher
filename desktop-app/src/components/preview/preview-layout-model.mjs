export const PREVIEW_SECTIONS = Object.freeze([
  { id: 'hero', label: 'Hero, title and launch controls' }, { id: 'notices', label: 'Setup, updates and news' },
  { id: 'details', label: 'Game details' }, { id: 'capabilities', label: 'Capabilities and achievements' },
  { id: 'description', label: 'Description and genres' }, { id: 'media', label: 'Game media' },
  { id: 'source', label: 'Source and installation information' },
  { id: 'history', label: 'News and update history' },
]);
const ids = PREVIEW_SECTIONS.map(section => section.id);
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const previewContentSize = value => clamp(finite(value, 100), 70, 150);

export function updatePreviewSection(draft, id, field, value) {
  if (!ids.includes(id) || !draft.positions[id]) return draft;
  if (field === 'contentSize') return { ...draft, contentSizes: { ...draft.contentSizes, [id]: previewContentSize(value) } };
  if (!['x', 'y', 'width', 'height'].includes(field)) return draft;
  const box = draft.positions[id];
  if (field === 'width' || field === 'height') {
    const next = { ...box, [field]: clamp(finite(value, box[field]), field === 'width' ? 160 : 80, field === 'width' ? draft.width - box.x : 10000) };
    return { ...draft, height: Math.max(draft.height, next.y + next.height + 24), positions: { ...draft.positions, [id]: next } };
  }
  const maximum = field === 'x' ? draft.width - box.width : draft.height - box.height;
  return { ...draft, positions: { ...draft.positions, [id]: { ...box, [field]: clamp(finite(value, box[field]), 0, Math.max(0, maximum)) } } };
}

export function normalizePreviewLayout(value) {
  if (!value || value.version !== 1 || !value.positions || typeof value.positions !== 'object') return null;
  const positions = {};
  for (const id of ids) {
    // Older saved layouts keep every requested rectangle. New sections append
    // beneath the old surface rather than invalidating or overlapping it.
    const box = value.positions[id] || (id === 'history' ? { x: 0, y: Math.max(0, ...Object.values(positions).map(box => box.y + box.height)) + 16, width: 1, height: 520 } : null);
    if (!box || !['x', 'y', 'width', 'height'].every(key => Number.isFinite(box[key]))) return null;
    const width = clamp(box.width, 0.1, 1);
    positions[id] = { x: clamp(box.x, 0, 1 - width), y: clamp(box.y, 0, 20000), width, height: clamp(box.height, 80, 10000) };
  }
  const contentSizes = Object.fromEntries(ids.filter(id => value.contentSizes?.[id] != null).map(id => [id, previewContentSize(value.contentSizes[id])]));
  return { version: 1, positions, contentSizes, order: [...new Set([...(Array.isArray(value.order) ? value.order : []).filter(id => ids.includes(id)), ...ids])], snap: value.snap !== false };
}

export function previewLayoutDraft(captured, width, height, saved) {
  width = Math.max(320, finite(width, 1200));
  const layout = normalizePreviewLayout(saved);
  // Reserve even absent notices/capabilities for other games sharing this layout.
  // Otherwise a zero-height optional row would overlap the next section on Save.
  const measured = Object.fromEntries(ids.filter(id => captured[id]).map(id => [id, { ...captured[id] }]));
  if (!layout) for (const id of ids) {
    const box = measured[id];
    if (!box || box.height >= 80) continue;
    const end = box.y + box.height;
    const extra = 80 - box.height;
    for (const otherId of ids) if (otherId !== id && measured[otherId]?.y >= end) measured[otherId].y += extra;
    box.height = 80;
  }
  const positions = Object.fromEntries(ids.map((id, index) => {
    // Reopen the requested geometry, not a content-expanded runtime measurement.
    const raw = layout ? { ...layout.positions[id], x: layout.positions[id].x * width, width: layout.positions[id].width * width } : measured[id] || { x: 0, y: index * 180, width, height: 160 };
    const boxWidth = clamp(finite(raw.width, width), 160, width);
    return [id, { x: clamp(finite(raw.x, 0), 0, width - boxWidth), y: clamp(finite(raw.y, 0), 0, 20000), width: boxWidth, height: clamp(finite(raw.height, 160), 80, 10000) }];
  }));
  return { positions, contentSizes: layout?.contentSizes || {}, order: layout?.order || ids, snap: layout?.snap !== false, width,
    height: Math.max(900, finite(height, 900), ...Object.values(positions).map(box => box.y + box.height)) + 300 };
}

export function savePreviewLayout(draft) {
  if (!draft?.positions || !ids.every(id => draft.positions[id])) return null;
  const width = Math.max(320, finite(draft.width, 1200));
  return normalizePreviewLayout({ version: 1, snap: draft.snap, order: draft.order, contentSizes: draft.contentSizes,
    positions: Object.fromEntries(ids.map(id => {
      const box = draft.positions[id];
      return [id, { ...box, x: box.x / width, width: box.width / width }];
    })) });
}

export function previewCanvasBox(box, viewportWidth) {
  const available = Math.max(1, finite(viewportWidth, 320));
  const width = Math.min(available, Math.max(Math.min(160, available), box.width * available));
  return { left: clamp(box.x * available, 0, available - width), top: box.y, width, height: box.height };
}

// A full-width child reports the space allocated by the last fit, not an
// intrinsic width. Only genuine overflow can raise the retained width floor.
export function previewContentMeasurement(content, previousWidth = 0) {
  const overflow = content.scrollWidth > content.clientWidth + 1;
  const title = content.querySelector?.('.preview-hero-title-inner');
  const actions = content.querySelector?.('[data-preview-hero-actions]');
  // Hero uses the chosen height, but only its readable content is a size floor.
  // Measuring its allocated height would feed the last fit back into the next.
  return { height: title && actions ? title.offsetHeight + actions.offsetHeight : Math.max(content.offsetHeight, content.scrollHeight),
    width: Math.max(previousWidth, overflow ? content.scrollWidth : 0) };
}

// Content may grow, but never becomes a nested scrollport or covers a neighbour.
// Resolve in geometric reading order, independent of user-selected stacking order.
export function fitPreviewSurface(layout, viewportWidth, contentHeights = {}, contentWidths = {}, viewportHeight = 900) {
  const width = Math.max(1, finite(viewportWidth, 320));
  const boxes = {};
  const ordered = [...layout.order].sort((a, b) => layout.positions[a].y - layout.positions[b].y || layout.positions[a].x - layout.positions[b].x || ids.indexOf(a) - ids.indexOf(b));
  for (const id of ordered) {
    const box = previewCanvasBox(layout.positions[id], width);
    box.height = Math.max(box.height, Math.ceil(finite(contentHeights[id], 0)) + 2);
    // Width is player-owned. Content must wrap instead of undoing a resize.
    for (let pass = 0; pass <= ordered.length; pass++) {
      const collisions = Object.values(boxes).filter(other => box.left < other.left + other.width - 0.1 && other.left < box.left + box.width - 0.1 && box.top < other.top + other.height + 12 && other.top < box.top + box.height + 12);
      if (!collisions.length) break;
      box.top = Math.max(...collisions.map(other => other.top + other.height + 12));
    }
    boxes[id] = box;
  }
  return { boxes, width: Math.max(width, ...Object.values(boxes).map(box => box.left + box.width)), height: Math.max(1, ...Object.values(boxes).map(box => box.top + box.height + 12)) };
}
