import React from 'react';

/** One-second, theme-aware explanations for the existing labelled controls. */
export default function HoverTips() {
  const [tip, setTip] = React.useState(null);
  const tipRef = React.useRef(null);
  React.useEffect(() => {
    let timer = null;
    let activeEl = null;
    const clear = () => { if (timer) clearTimeout(timer); timer = null; if (activeEl?.dataset.neolibTip) { activeEl.setAttribute('title', activeEl.dataset.neolibTip); delete activeEl.dataset.neolibTip; } activeEl = null; setTip(null); };
    const enter = (event) => {
      const target = event.target?.closest?.('[title]');
      if (!target || !target.title) return;
      clear();
      const label = target.title;
      activeEl = target;
      target.dataset.neolibTip = label;
      target.removeAttribute('title');
      timer = window.setTimeout(() => {
        const rect = target.getBoundingClientRect();
        setTip({ label, x: rect.left + rect.width / 2, y: rect.bottom + 10, anchorTop: rect.top, anchorBottom: rect.bottom });
      }, 1000);
    };
    const leave = (event) => { if (activeEl?.contains(event.relatedTarget)) return; clear(); };
    window.addEventListener('mouseover', enter);
    window.addEventListener('mouseout', leave);
    return () => { clear(); window.removeEventListener('mouseover', enter); window.removeEventListener('mouseout', leave); };
  }, []);
  React.useLayoutEffect(() => {
    if (!tip || !tipRef.current) return;
    const rect = tipRef.current.getBoundingClientRect();
    const edge = 12;
    const nextX = Math.max(edge + rect.width / 2, Math.min(window.innerWidth - edge - rect.width / 2, tip.x));
    const belowFits = tip.anchorBottom + 10 + rect.height <= window.innerHeight - edge;
    const nextY = belowFits ? tip.anchorBottom + 10 : Math.max(edge, tip.anchorTop - rect.height - 10);
    if (Math.abs(nextX - tip.x) > 0.5 || Math.abs(nextY - tip.y) > 0.5) setTip((current) => current && { ...current, x: nextX, y: nextY });
  }, [tip]);
  if (!tip) return null;
  return <div ref={tipRef} className="neolib-hover-tip" role="tooltip" style={{ left: tip.x, top: tip.y }}>{tip.label}</div>;
}
