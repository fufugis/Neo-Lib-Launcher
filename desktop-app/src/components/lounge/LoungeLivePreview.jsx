import React from 'react';
import { loungePreviewViewport } from './lounge-preview-viewport.mjs';
import { createPreviewMirror, previewMotionOnly } from './lounge-preview-mirror.mjs';

// Read only the live foreground, never dialogs or another miniature. Freeze
// computed geometry so the real window's media queries/scroll positions survive.
export default function LoungeLivePreview({ preferences, children, testId = 'lounge-live-layout-preview' }) {
  const frame = React.useRef(null), scene = React.useRef(null), foreground = React.useRef(null);
  const refresh = React.useRef(null);
  const [resolution, setResolution] = React.useState('');
  React.useLayoutEffect(() => {
    const source = document.querySelector('[data-testid="neo-lounge"]');
    if (!source) return;
    let disposed = false, timer = null, raf = null, motionFrame = null;
    const mirror = createPreviewMirror();
    const moving = new Set();
    const sync = () => {
      if (disposed || !frame.current || !scene.current || !foreground.current) return;
      const rect = source.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const { scale, left, top } = loungePreviewViewport(rect.width, rect.height, frame.current.clientWidth, frame.current.clientHeight);
      Object.assign(scene.current.style, { width: `${rect.width}px`, height: `${rect.height}px`, transform: `scale(${scale})`, left: `${left}px`, top: `${top}px` });
      const computed = getComputedStyle(source);
      for (const key of computed) if (key.startsWith('--')) scene.current.style.setProperty(key, computed.getPropertyValue(key));
      scene.current.style.backgroundColor = computed.backgroundColor;
      const roots = [...source.children].filter(node => node.matches('.lounge-main-header, .lounge-main-content'));
      mirror.sync(roots, rect, foreground.current);
      const dpr = window.devicePixelRatio || 1;
      setResolution(`${Math.round(rect.width)} × ${Math.round(rect.height)} layout · ${Math.round(rect.width * dpr)} × ${Math.round(rect.height * dpr)} pixels`);
    };
    const schedule = () => { if (timer !== null || disposed) return; timer = window.setTimeout(() => { timer = null; raf = requestAnimationFrame(sync); }, 100); };
    refresh.current = () => { mirror.invalidate(); schedule(); };
    const invalidateLayout = node => {
      // A changed child's intrinsic size can change its flex/grid siblings.
      const element = node.nodeType === 1 ? node : node.parentElement;
      mirror.invalidate(element?.closest('.lounge-main-header, .lounge-main-content'));
    };
    const patchMotion = () => {
      motionFrame = null;
      for (const node of moving) if (!mirror.patchMotion(node)) { mirror.invalidate(node); schedule(); }
      moving.clear();
    };
    const onSourceEvent = event => {
      if ([...source.children].some(node => node.matches('.lounge-main-header, .lounge-main-content') && node.contains(event.target))) {
        if (event.type !== 'scroll') invalidateLayout(event.target);
        schedule();
      }
    };
    raf = requestAnimationFrame(sync);
    const resize = new ResizeObserver(() => { mirror.invalidate(); schedule(); }); resize.observe(source); resize.observe(frame.current);
    const changes = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes' && record.attributeName === 'style' && previewMotionOnly(record.oldValue || '', record.target.getAttribute('style') || '')) {
          moving.add(record.target);
          if (motionFrame === null) motionFrame = requestAnimationFrame(patchMotion);
        } else { invalidateLayout(record.target); schedule(); }
      }
    });
    for (const node of source.children) if (node.matches('.lounge-main-header, .lounge-main-content')) changes.observe(node, { attributes: true, attributeOldValue: true, childList: true, characterData: true, subtree: true });
    source.addEventListener('scroll', onSourceEvent, true);
    source.addEventListener('load', onSourceEvent, true);
    source.addEventListener('transitionend', onSourceEvent, true);
    window.addEventListener('resize', refresh.current);
    const onResize = refresh.current;
    return () => { disposed = true; refresh.current = null; resize.disconnect(); changes.disconnect(); moving.clear(); clearTimeout(timer); cancelAnimationFrame(raf); cancelAnimationFrame(motionFrame); source.removeEventListener('scroll', onSourceEvent, true); source.removeEventListener('load', onSourceEvent, true); source.removeEventListener('transitionend', onSourceEvent, true); window.removeEventListener('resize', onResize); };
  }, []);
  React.useLayoutEffect(() => { refresh.current?.(); }, [preferences]);
  return <div className="min-w-0 w-full">
    <div className="mb-2 text-[10px] text-muted">{resolution || 'Measuring Lounge…'} · screen-fit preview</div>
    <div ref={frame} data-testid={testId} className="lounge-settings-live-preview lounge-live-preview-frame relative h-[clamp(120px,23dvh,280px)] overflow-hidden rounded-xl border border-[rgb(var(--accent)/0.45)] bg-black/30" aria-hidden="true" inert="">
      <div ref={scene} className="absolute origin-top-left overflow-hidden pointer-events-none">
        {children}
        <div ref={foreground} className="absolute inset-0 z-20 pointer-events-none" />
      </div>
    </div>
  </div>;
}
