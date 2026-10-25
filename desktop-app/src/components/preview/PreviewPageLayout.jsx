import React from 'react';
import { Move, RotateCcw } from 'lucide-react';
import HomeLayoutEditor from '../home/HomeLayoutEditor';
import PreviewLayoutLivePreview from './PreviewLayoutLivePreview';
import PreviewLayoutInspector from './PreviewLayoutInspector';
import { PREVIEW_SECTIONS, normalizePreviewLayout, previewLayoutDraft, savePreviewLayout, fitPreviewSurface, previewContentMeasurement, previewContentSize } from './preview-layout-model.mjs';

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
        const zoom = previewContentSize(saved.contentSizes[id]) / 100;
        const measured = previewContentMeasurement(content, (intrinsicWidths.current[id] || 0) / zoom);
        next[id] = Math.ceil(measured.height * zoom);
        widths[id] = Math.ceil(measured.width * zoom);
      }
      intrinsicWidths.current = widths;
      setContentHeights(previous => Object.keys(next).every(id => previous[id] === next[id]) ? previous : next);
      setContentWidths(previous => Object.keys(widths).every(id => previous[id] === widths[id]) ? previous : widths);
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const element of host.querySelectorAll('.preview-section-content, .preview-hero-title-inner, [data-preview-hero-actions]')) observer.observe(element);
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
  const editButton = <button type="button" disabled={!onLayoutChange} onClick={openEditor} aria-haspopup="dialog" data-testid="preview-edit-layout" className="absolute right-3 top-3 z-40 inline-flex items-center gap-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.92)] px-2.5 py-2 text-xs font-bold text-ink shadow-lg hover:border-[rgb(var(--accent)/0.7)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]"><Move size={13} />Edit preview layout</button>;
  const box = id => <div className="preview-section relative" data-preview-section={id}>{blocks[id]}{id === 'hero' && editButton}</div>;
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col" data-testid="preview-page-layout">
    <div ref={page} className="preview-fit-viewport min-h-0 flex-1" data-testid="preview-layout-fit">
      <div ref={surface} className="preview-fit-surface" style={{ width: baseWidth, height: saved ? fitted.height : undefined }}>
      {saved ? <div className="relative" style={{ height: fitted.height }} data-testid="preview-custom-canvas">
        {saved.order.map(id => <div key={id} data-preview-section={id} data-preview-kind={id} className="preview-custom-block" style={{ ...fitted.boxes[id], zIndex: saved.order.indexOf(id) + 1 }}>
          <div className="preview-section-content" style={{ zoom: previewContentSize(saved.contentSizes[id]) / 100, height: id === 'hero' ? (fitted.boxes[id].height - 2) / (previewContentSize(saved.contentSizes[id]) / 100) : undefined }}>{blocks[id]}</div>
          {id === 'hero' && editButton}
        </div>)}
      </div> : <>
        {box('hero')}
        <div className="px-3 py-5 sm:px-4 sm:py-6"><section data-testid="game-text-panel" className="mx-auto w-full max-w-[1500px] rounded-2xl border border-[rgb(var(--border)/0.88)] bg-[rgb(var(--panel)/0.56)] p-4 backdrop-blur-md sm:p-6">
          {box('notices')}{box('details')}{box('capabilities')}
          <div className="grid items-start gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))' }}>
            <div className="min-w-0">{box('description')}<div className="mt-5">{box('source')}</div></div>
            <aside className="min-w-0">{box('media')}</aside>
          </div>
        </section><div className="mx-auto mt-5 w-full max-w-[1500px]">{box('history')}</div></div>
      </>}
      </div>
    </div>
    {editor && <HomeLayoutEditor initialDraft={editor} widgets={PREVIEW_SECTIONS} title="Edit game preview layout"
      description="One layout for every game · select a box for sliders · live preview shows this window, not a saved screenshot"
      renderPreview={draft => <PreviewLayoutLivePreview draft={draft} blocks={blocks} viewport={viewport} />}
      renderInspector={props => <><PreviewLayoutInspector {...props} />{saved && <button type="button" data-testid="preview-restore-default" onClick={() => { onLayoutChange?.(null); setEditor(null); }} className="mt-3 inline-flex items-center gap-1 rounded-lg border hairline px-3 py-2 text-xs font-bold hover:bg-surface"><RotateCcw size={13} />Restore default</button>}</>}
      itemLabel="Section" itemsLabel="preview sections" fitToWindow onCancel={() => setEditor(null)} onSave={draft => { const next = savePreviewLayout(draft); if (next) { onLayoutChange(next); setEditor(null); } }} />}
  </div>;
}
