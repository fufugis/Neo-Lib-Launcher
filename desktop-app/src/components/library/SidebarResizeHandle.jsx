import React from 'react';
import { GripVertical } from 'lucide-react';
import { clampSidebarWidth, MAX_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH } from './sidebar-resize-model.mjs';

export default function SidebarResizeHandle({ width, onCommit }) {
  const drag = React.useRef(null);
  React.useEffect(() => () => { delete document.documentElement.dataset.sidebarResizing; }, []);
  const preview = (element, value) => { if (element.parentElement) element.parentElement.style.width = `${value}px`; };
  const cancel = (element) => {
    if (!drag.current) return;
    preview(element, drag.current.startWidth);
    const pointerId = drag.current.pointerId;
    drag.current = null;
    delete document.documentElement.dataset.sidebarResizing;
    if (element.hasPointerCapture?.(pointerId)) element.releasePointerCapture(pointerId);
  };
  const finish = (element) => {
    if (!drag.current) return;
    const next = drag.current.width;
    drag.current = null;
    delete document.documentElement.dataset.sidebarResizing;
    if (next !== width) onCommit?.(next);
  };
  return <div
    role="separator" tabIndex={0} aria-label="Resize Library panel" aria-orientation="vertical"
    aria-valuemin={MIN_SIDEBAR_WIDTH} aria-valuemax={MAX_SIDEBAR_WIDTH} aria-valuenow={width}
    data-testid="sidebar-resize-handle" className="sidebar-resize-handle group absolute right-0 top-0 z-30 flex h-full w-6 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]"
    title="Drag to resize Library · arrow keys also work · double-click to reset"
    style={{ touchAction: 'none' }}
    onPointerDown={(event) => {
      if (event.button !== 0 || drag.current) return;
      event.preventDefault();
      event.currentTarget.focus();
      const startWidth = width;
      drag.current = { pointerId: event.pointerId, startX: event.clientX, startWidth, width: startWidth };
      document.documentElement.dataset.sidebarResizing = 'true';
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={(event) => {
      if (drag.current?.pointerId !== event.pointerId) return;
      const next = clampSidebarWidth(drag.current.startWidth + event.clientX - drag.current.startX, window.innerWidth);
      drag.current.width = next;
      preview(event.currentTarget, next);
    }}
    onPointerUp={(event) => {
      if (drag.current?.pointerId !== event.pointerId) return;
      finish(event.currentTarget);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }}
    onPointerCancel={(event) => cancel(event.currentTarget)}
    onLostPointerCapture={(event) => cancel(event.currentTarget)}
    onDoubleClick={(event) => { preview(event.currentTarget, clampSidebarWidth(320, window.innerWidth)); onCommit?.(clampSidebarWidth(320, window.innerWidth)); }}
    onKeyDown={(event) => {
      if (event.key === 'Escape' && drag.current) { event.preventDefault(); cancel(event.currentTarget); return; }
      const step = event.shiftKey ? 48 : 16;
      const next = event.key === 'ArrowLeft' ? width - step : event.key === 'ArrowRight' ? width + step : event.key === 'Home' ? MIN_SIDEBAR_WIDTH : event.key === 'End' ? MAX_SIDEBAR_WIDTH : null;
      if (next == null) return;
      event.preventDefault();
      onCommit?.(clampSidebarWidth(next, window.innerWidth));
    }}
  >
    <span aria-hidden className="sidebar-resize-handle__line" />
    <span aria-hidden className="sidebar-resize-handle__grip"><GripVertical size={18} /></span>
  </div>;
}
