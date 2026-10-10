import React from 'react';
import { formatPlaytime } from '../../lib/utils';
import { renderForegroundPortal } from '../ui/VisualBoundary';
import { playtimePieSliceAtPoint, pieTooltipPosition } from './playtime-pie-model.mjs';

// Hover state stays in the chart, rather than rerendering the widget's filters
// or game list on every pointer move. No timers, network calls or frame loop.
export default React.memo(function PlaytimePieChart({ chart }) {
  const [hover, setHover] = React.useState(null);
  const [size, setSize] = React.useState({ width: 280, height: 80 });
  const tooltip = React.useRef(null);
  const active = hover?.chart === chart ? hover : null;
  const showing = Boolean(active);
  React.useLayoutEffect(() => {
    if (!active || !tooltip.current) return;
    const rect = tooltip.current.getBoundingClientRect();
    setSize(previous => previous.width === rect.width && previous.height === rect.height ? previous : { width: rect.width, height: rect.height });
  }, [active?.slice]);
  React.useEffect(() => {
    if (!showing) return undefined;
    const clear = () => setHover(null);
    window.addEventListener('blur', clear);
    window.addEventListener('resize', clear);
    document.addEventListener('scroll', clear, true);
    document.addEventListener('visibilitychange', clear);
    return () => { window.removeEventListener('blur', clear); window.removeEventListener('resize', clear);
      document.removeEventListener('scroll', clear, true); document.removeEventListener('visibilitychange', clear); };
  }, [showing]);
  const move = event => {
    if (event.pointerType === 'touch') return;
    const slice = playtimePieSliceAtPoint(chart, event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
    setHover(slice ? { chart, slice, x: event.clientX, y: event.clientY } : null);
  };
  const position = active ? pieTooltipPosition(active.x, active.y, size.width, size.height, window.innerWidth, window.innerHeight) : null;
  return <>
    <div role="img" data-testid="playtime-pie-chart"
      aria-label={`Playtime distribution: ${chart.slices.map(slice => `${slice.label} ${slice.percent.toFixed(1)}%, ${formatPlaytime(slice.minutes)}`).join(', ')}`}
      onPointerMove={move} onPointerLeave={() => setHover(null)} onPointerCancel={() => setHover(null)}
      className="aspect-square w-40 max-w-full shrink-0 rounded-full border border-[rgb(var(--border))]" style={{ backgroundImage: chart.gradient }} />
    {active && renderForegroundPortal(<div ref={tooltip} role="tooltip" data-testid="playtime-pie-tooltip"
      className="playtime-pie-tooltip" style={position}>
      <strong><span aria-hidden="true" style={{ background: active.slice.color }} />{active.slice.label}</strong>
      <p>{active.slice.percent.toFixed(1)}% · {formatPlaytime(active.slice.minutes)}</p>
      <small>Of filtered recorded playtime</small>
    </div>)}
  </>;
});
