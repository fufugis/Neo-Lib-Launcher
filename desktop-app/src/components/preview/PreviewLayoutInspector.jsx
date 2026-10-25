import React from 'react';
import { PREVIEW_SECTIONS, previewContentSize, updatePreviewSection } from './preview-layout-model.mjs';

export default function PreviewLayoutInspector({ draft, selectedId, onChange }) {
  const section = PREVIEW_SECTIONS.find(item => item.id === selectedId);
  const box = draft.positions[selectedId];
  if (!section || !box) return <p>Click a section to adjust it.</p>;
  const change = (field, value) => onChange(previous => updatePreviewSection(previous, selectedId, field, value));
  return <section className="preview-layout-inspector" data-testid="preview-layout-inspector" aria-label="Selected preview section">
    <p className="preview-editor-eyebrow">Selected section</p><h3>{section.label}</h3>
    <p>Click any box to select it. Drag its corner to resize.</p>
    <label>Content size <output>{previewContentSize(draft.contentSizes?.[selectedId])}%</output>
      <input aria-label="Section content size" type="range" min="70" max="150" step="5" value={previewContentSize(draft.contentSizes?.[selectedId])} onChange={event => change('contentSize', event.target.value)} />
    </label>
    {['x', 'y'].map(axis => <label key={axis}>{axis.toUpperCase()} position <output>{Math.round(box[axis])}px</output>
      <input aria-label={`Section ${axis.toUpperCase()} position`} type="range" min="0" max={Math.max(0, axis === 'x' ? draft.width - box.width : draft.height - box.height)} step="1" value={box[axis]} onChange={event => change(axis, event.target.value)} />
    </label>)}
    {['width', 'height'].map(axis => <label key={axis}>{axis === 'width' ? 'Width' : 'Height'} <output>{Math.round(box[axis])}px</output>
      <input aria-label={`Section ${axis}`} type="number" min={axis === 'width' ? 160 : 80} max={axis === 'width' ? draft.width - box.x : 10000} step="1" value={Math.round(box[axis])} onChange={event => change(axis, event.target.value)} />
    </label>)}
    <p>{Math.round(box.width)} × {Math.round(box.height)}px · changes apply with Save layout.</p>
    <p>Content can expand the page to remain readable. The live window frame shows the visible area; content below it stays reachable by page scrolling.</p>
  </section>;
}
