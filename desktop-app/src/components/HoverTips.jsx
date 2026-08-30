import React from 'react';

/** One-second, theme-aware explanations for the existing labelled controls. */
export default function HoverTips() {
  const [tip, setTip] = React.useState(null);
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
        setTip({ label, x: Math.min(window.innerWidth - 18, Math.max(18, rect.left + rect.width / 2)), y: Math.min(window.innerHeight - 12, rect.bottom + 10) });
      }, 1000);
    };
    const leave = (event) => { if (activeEl?.contains(event.relatedTarget)) return; clear(); };
    window.addEventListener('mouseover', enter);
    window.addEventListener('mouseout', leave);
    return () => { clear(); window.removeEventListener('mouseover', enter); window.removeEventListener('mouseout', leave); };
  }, []);
  if (!tip) return null;
  return <div className="neolib-hover-tip" role="tooltip" style={{ left: tip.x, top: tip.y }}>{tip.label}</div>;
}
