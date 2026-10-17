import React from 'react';
import { Move, RotateCcw } from 'lucide-react';
import HomeLayoutEditor from '../home/HomeLayoutEditor';
import { PREVIEW_SECTIONS, normalizePreviewLayout, previewLayoutDraft, savePreviewLayout, fitPreviewSurface, previewContentMeasurement } from './preview-layout-model.mjs';

export default function PreviewPageLayout({ blocks, savedLayout, onLayoutChange }) {
  const saved = React.useMemo(() => normalizePreviewLayout(savedLayout), [savedLayout]);
  const [editor, setEditor] = React.useState(null);
  const [viewport, setViewport] = React.useState({ width: 320, height: 600 });
  const [contentHeights, setContentHeights] = React.useState({});
  const [contentWidths, setContentWidths] = React.useState({});
  const baseWidth = Math.max(320, viewport.width);
  const page = React.useRef(null);
  const surface = React.useRef(null);
  const measuredWidth = React.useRef(baseWidth);
  const measuredInput = React.useRef(blocks);
  const intrinsicWidths = React.useRef({});
  React.useLayoutEffect(() => {
    const host = page.current;
    const sync = () => {
      const next = { width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight) };
      setViewport(previous => previous.width === next.width && previous.height === next.height ? previous : next);
    };
    sync();
    const observer = new ResizeObserver(sync); observer.observe(host);
    return () => observer.disconnect();
  }, []);
  React.useLayoutEffect(() => {
    const host = surface.current;
    if (!host || !saved) return undefined;
    let frame;
    const measure = () => {
      if (measuredWidth.current !== baseWidth || measuredInput.current !== blocks) {
        measuredWidth.current = baseWidth; measuredInput.current = blocks;
        intrinsicWidths.current = {};
        setContentHeights({}); setContentWidths({});
        frame = requestAnimationFrame(measure);
        return;
      }
      const next = {}, widths = {};
      for (const element of host.querySelectorAll('[data-preview-section]')) {
        const content = element.querySelector('.preview-section-content');
        const id = element.dataset.previewSection;
        const measured = previewContentMeasurement(content, intrinsicWidths.current[id]);
        next[id] = measured.height;
        widths[id] = measured.width;
      }
      intrinsicWidths.current = widths;
      setContentHeights(previous => Object.keys(next).every(id => previous[id] === next[id]) ? previous : next);
      setContentWidths(previous => Object.keys(widths).every(id => previous[id] === widths[id]) ? previous : widths);
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const element of host.querySelectorAll('.preview-section-content')) observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [saved, blocks, baseWidth]);
  const fitted = saved ? fitPreviewSurface(saved, baseWidth, contentHeights, contentWidths, viewport.height) : { width: baseWidth, height: 0 };
  const openEditor = () => {
    const host = page.current;
    if (!host || !onLayoutChange) return;
    const base = surface.current.getBoundingClientRect();
    const captured = {};
    for (const element of host.querySelectorAll('[data-preview-section]')) {
      const rect = element.getBoundingClientRect();
      captured[element.dataset.previewSection] = { x: rect.left - base.left,
        y: rect.top - base.top, width: rect.width, height: rect.height };
    }
    setEditor(previewLayoutDraft(captured, baseWidth, Math.max(viewport.height, surface.current.offsetHeight), saved));
  };
  const box = id => <div className="preview-section" data-preview-section={id}>{blocks[id]}</div>;
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col" data-testid="preview-page-layout">
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-b hairline bg-[rgb(var(--panel)/0.3)] px-3 py-1.5">
      <span className="mr-auto text-[10px] text-muted">{saved ? 'Custom preview layout · all games' : 'Game preview'}</span>
      {saved && <button type="button" onClick={() => onLayoutChange?.(null)} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted hover:bg-surface"><RotateCcw size={13} />Restore default</button>}
      <button type="button" disabled={!onLayoutChange} onClick={openEditor} aria-haspopup="dialog" data-testid="preview-edit-layout" className="inline-flex items-center gap-1 rounded-md border hairline px-2 py-1.5 text-xs font-bold hover:bg-surface"><Move size={13} />Edit preview layout</button>
    </div>
    <div ref={page} className="preview-fit-viewport min-h-0 flex-1" data-testid="preview-layout-fit">
      <div ref={surface} className="preview-fit-surface" style={{ width: baseWidth, height: saved ? fitted.height : undefined }}>
      {saved ? <div className="relative" style={{ height: fitted.height }} data-testid="preview-custom-canvas">
        {saved.order.map(id => <div key={id} data-preview-section={id} className="preview-custom-block" style={{ ...fitted.boxes[id], zIndex: saved.order.indexOf(id) + 1 }}>
          <div className="preview-section-content">{blocks[id]}</div>
        </div>)}
      </div> : <>
        {box('hero')}
        <div className="px-3 py-5 sm:px-4 sm:py-6"><section data-testid="game-text-panel" className="mx-auto w-full max-w-[1500px] rounded-2xl border border-[rgb(var(--border)/0.88)] bg-[rgb(var(--panel)/0.56)] p-4 backdrop-blur-md sm:p-6">
          {box('notices')}{box('details')}{box('capabilities')}
          <div className="grid items-start gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))' }}>
            <div className="min-w-0">{box('description')}<div className="mt-5">{box('source')}</div></div>
            <aside className="min-w-0">{box('media')}</aside>
          </div>
        </section></div>
      </>}
      </div>
    </div>
    {editor && <HomeLayoutEditor initialDraft={editor} widgets={PREVIEW_SECTIONS} title="Edit game preview layout"
      description="One layout for every game · move sections, narrow boxes or resize · existing content only, not widgets"
      itemLabel="Section" itemsLabel="preview sections" fitToWindow onCancel={() => setEditor(null)} onSave={draft => { const next = savePreviewLayout(draft); if (next) { onLayoutChange(next); setEditor(null); } }} />}
  </div>;
}
