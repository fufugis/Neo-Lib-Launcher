import React from 'react';
import { renderForegroundPortal } from '../ui/VisualBoundary';

// Keep the menu outside the Library's clipped stacking context and the rail.
export default function LibraryCategoriesPopover({ anchorRef, panelRef, children }) {
  const [position, setPosition] = React.useState({ left: 8, top: 8, visibility: 'hidden' });
  React.useLayoutEffect(() => {
    const place = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const bounds = panel.getBoundingClientRect();
      const left = Math.max(8, Math.min(anchor.left, window.innerWidth - bounds.width - 8));
      const below = anchor.bottom + 4;
      const above = anchor.top - bounds.height - 4;
      const top = Math.max(8, Math.min(below + bounds.height <= window.innerHeight - 8 ? below : above, window.innerHeight - bounds.height - 8));
      setPosition(previous => previous.left === left && previous.top === top && previous.visibility === 'visible'
        ? previous : { left, top, visibility: 'visible' });
    };
    place();
    const observer = new ResizeObserver(place);
    if (anchorRef.current) observer.observe(anchorRef.current);
    if (panelRef.current) observer.observe(panelRef.current);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchorRef, panelRef]);
  return renderForegroundPortal(<div ref={panelRef} id="library-categories-popover" data-testid="sidebar-categories-options"
    data-controller-surface="popover" aria-label="Library categories"
    className="library-toolbar-popover rounded-lg hairline p-1.5 shadow-2xl"
    style={{ position: 'fixed', ...position, width: 256, maxWidth: 'calc(100vw - 16px)', maxHeight: 'calc(100vh - 16px)', overflowY: 'auto', overscrollBehavior: 'contain' }}>
    {children}
  </div>);
}
