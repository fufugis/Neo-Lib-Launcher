import React from 'react';
import { fitPreviewSurface, previewContentMeasurement, previewContentSize, savePreviewLayout } from './preview-layout-model.mjs';

// The miniature must not steal DOM/video refs owned by the real game page.
function previewBlock(node) {
  if (!React.isValidElement(node)) return node;
  const props = typeof node.type === 'string' ? { ref: null } : {};
  return React.cloneElement(node, props, React.Children.map(node.props.children, previewBlock));
}

// Presentation only: real blocks, inert controls, no game actions or native calls.
export default function PreviewLayoutLivePreview({ draft, blocks, viewport }) {
  const host = React.useRef(null);
  const content = React.useRef(null);
  const [size, setSize] = React.useState({ width: 1, height: 1 });
  const [measured, setMeasured] = React.useState({ heights: {}, widths: {} });
  const floors = React.useRef({});
  const layout = React.useMemo(() => savePreviewLayout(draft), [draft]);
  const measurementKey = JSON.stringify([viewport.width, layout.contentSizes, layout.order.map(id => layout.positions[id].width)]);
  React.useLayoutEffect(() => {
    const element = host.current;
    const sync = () => setSize(previous => element.clientWidth === previous.width && element.clientHeight === previous.height ? previous : { width: element.clientWidth, height: element.clientHeight });
    sync(); const observer = new ResizeObserver(sync); observer.observe(element);
    return () => observer.disconnect();
  }, []);
  React.useLayoutEffect(() => {
    floors.current = {};
    const measure = () => {
      const heights = {}, widths = {};
      for (const element of content.current.querySelectorAll('[data-live-preview-section]')) {
        const id = element.dataset.livePreviewSection;
        const zoom = previewContentSize(layout.contentSizes[id]) / 100;
        const value = previewContentMeasurement(element.querySelector('.preview-section-content'), (floors.current[id] || 0) / zoom);
        heights[id] = Math.ceil(value.height * zoom); widths[id] = Math.ceil(value.width * zoom);
      }
      floors.current = widths;
      setMeasured(previous => JSON.stringify(previous) === JSON.stringify({ heights, widths }) ? previous : { heights, widths });
    };
    measure(); const observer = new ResizeObserver(measure);
    for (const element of content.current.querySelectorAll('.preview-section-content, .preview-hero-title-inner, [data-preview-hero-actions]')) observer.observe(element);
    return () => observer.disconnect();
  }, [measurementKey, blocks]);
  const fitted = fitPreviewSurface(layout, viewport.width, measured.heights, measured.widths, viewport.height);
  const scale = Math.max(0.001, Math.min(size.width / viewport.width, size.height / viewport.height));
  return <section className="preview-layout-live" data-testid="preview-layout-live">
    <header><b>Live preview · current window</b><span>{Math.round(viewport.width)} × {Math.round(viewport.height)}px{fitted.height > viewport.height ? ' · page continues below' : ' · fits vertically'}</span></header>
    <div ref={host} className="preview-layout-live-frame">
      <div className="preview-layout-window-frame" style={{ width: viewport.width * scale, height: viewport.height * scale }}>
        <div ref={content} className="preview-layout-live-content" inert="" aria-hidden="true" style={{ width: viewport.width, height: Math.max(viewport.height, fitted.height), transform: `scale(${scale})` }}>
          {layout.order.map(id => <div key={id} data-live-preview-section={id} data-preview-kind={id} className="preview-custom-block" style={fitted.boxes[id]}>
            <div className="preview-section-content" style={{ zoom: previewContentSize(layout.contentSizes[id]) / 100, height: id === 'hero' ? (fitted.boxes[id].height - 2) / (previewContentSize(layout.contentSizes[id]) / 100) : undefined }}>{previewBlock(blocks[id])}</div>
          </div>)}
        </div>
      </div>
    </div>
  </section>;
}
