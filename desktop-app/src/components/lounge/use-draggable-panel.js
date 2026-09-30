import React from 'react';

export default function useDraggablePanel() {
  const panelRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  const onPointerDown = event => {
    if (event.button !== 0 || event.target.closest('button, input, select, textarea, a, [data-no-drag]')) return;
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = event => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const margin = 12;
    const left = Math.min(Math.max(margin, drag.left + event.clientX - drag.startX), Math.max(margin, window.innerWidth - drag.width - margin));
    const top = Math.min(Math.max(margin, drag.top + event.clientY - drag.startY), Math.max(margin, window.innerHeight - drag.height - margin));
    setOffset({ x: left - (window.innerWidth - drag.width) / 2, y: top - (window.innerHeight - drag.height) / 2 });
  };

  const stopDragging = event => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  return {
    panelRef,
    panelStyle: { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` },
    dragHandleProps: { onPointerDown, onPointerMove, onPointerUp: stopDragging, onPointerCancel: stopDragging, onLostPointerCapture: stopDragging, style: { cursor: 'grab', touchAction: 'none', userSelect: 'none' } },
  };
}
