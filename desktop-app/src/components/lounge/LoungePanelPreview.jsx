import React from 'react';
import { HOME_WIDGET_BY_ID } from '../home/home-widget-registry.mjs';
import { loungePanelRects } from './lounge-widget-layout.mjs';

export default function LoungePanelPreview({ preferences, children }) {
  const active = preferences.specialTheme !== 'theme' || preferences.widgetAreaEnabled || preferences.previewPosition.startsWith('bottom-');
  const [size, setSize] = React.useState({ width: window.innerWidth, height: window.innerHeight });
  React.useLayoutEffect(() => {
    if (!active) return;
    const host = document.querySelector('[data-testid="lounge-widget-composition"]');
    if (!host) return;
    const sync = () => setSize({ width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight), shelf: host.closest('.lounge-browser')?.dataset.shelfPosition, obstacles: JSON.parse(host.dataset.cardClearance || '[]'), widgetTop: Number(host.dataset.widgetTop ?? 16) });
    sync();
    const observer = new ResizeObserver(sync); observer.observe(host);
    const attributes = new MutationObserver(sync); attributes.observe(host, { attributes: true, attributeFilter: ['data-card-clearance', 'data-widget-top'] });
    return () => { observer.disconnect(); attributes.disconnect(); };
  }, [active, preferences.shelfPosition]);
  const rects = active ? loungePanelRects(size.width, size.height, { ...preferences, shelfPosition: size.shelf || preferences.shelfPosition }, size.obstacles, size.widgetTop) : null;
  const previewTop = Math.min(0, size.widgetTop || 0);
  const previewHeight = size.height - previewTop;
  const style = rect => ({ position: 'absolute', left: `${rect.left / size.width * 100}%`, top: `${(rect.top - previewTop) / previewHeight * 100}%`, width: `${rect.width / size.width * 100}%`, height: `${rect.height / previewHeight * 100}%` });
  return <div className="relative flex min-h-0 min-w-0 flex-1 items-end overflow-hidden rounded-xl p-1" style={{ justifyContent: { left: 'flex-start', center: 'center', right: 'flex-end' }[preferences.previewPosition] }}>
    {active ? <div className="lounge-mini-composition-slot" style={style(rects.hero)}>{children}</div> : children}
    {preferences.widgetAreaEnabled && <div data-testid="lounge-mini-widget-area" className="grid gap-1 overflow-hidden rounded-lg p-1 text-[8px] text-white" style={{ ...style(rects.widgets), border: preferences.widgetShowBox ? '1px solid rgb(255 255 255 / .35)' : 'none', background: preferences.widgetShowBox ? `rgb(var(--panel) / ${preferences.previewPanelOpacity / 100})` : 'transparent', gridAutoRows: 'minmax(0, 1fr)' }}>
      <div className="lounge-widget-zoom grid gap-1" style={{ '--lounge-widget-zoom': preferences.widgetZoom / 100, gridAutoRows: 'minmax(0, 1fr)' }}>
        {preferences.widgetIds.map(id => <div key={id} className="overflow-hidden rounded bg-white/5 p-1"><div className="lounge-home-widget-zoom"><b>{HOME_WIDGET_BY_ID[id]?.label}</b><i className="mt-1 block h-1 w-3/4 rounded bg-white/25" /></div></div>)}
      </div>
    </div>}
  </div>;
}
