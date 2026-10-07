import React from 'react';
import { Flag, Check } from 'lucide-react';
import { JOURNEY_STATUSES, normalizeJourneyStatus } from '../../lib/game-journey-model.mjs';
import { renderForegroundPortal } from '../ui/VisualBoundary';

export default function PreviewJourneyControl({game, onUpdateGame}) {
  const [anchor, setAnchor] = React.useState(null);
  const trigger = React.useRef(null), menu = React.useRef(null);
  const status = normalizeJourneyStatus(game.journeyStatus);
  React.useEffect(() => {setAnchor(null);}, [game.id]);
  React.useEffect(() => {
    if (!anchor) return;
    menu.current?.querySelector('[aria-checked="true"]')?.focus();
    const outside = event => {if (!menu.current?.contains(event.target) && !trigger.current?.contains(event.target)) setAnchor(null);};
    const escape = event => {if (event.key === 'Escape') {event.preventDefault(); setAnchor(null); trigger.current?.focus();}};
    const resize = () => setAnchor(null);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', resize);
    return () => {document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); window.removeEventListener('resize', resize);};
  }, [anchor]);
  const navigate = event => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const choices = [...menu.current.querySelectorAll('[role="menuitemradio"]')];
    const current = choices.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length;
    choices[next]?.focus();
  };
  return <>
    <button type="button" ref={trigger} data-testid="detail-journey-btn" aria-haspopup="menu" aria-expanded={Boolean(anchor)} onClick={() => {
      if (anchor) {setAnchor(null); return;}
      const rect = trigger.current.getBoundingClientRect();
      setAnchor({left: Math.max(8, Math.min(rect.left, window.innerWidth - 248)), top: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 330))});
    }} className="inline-flex items-center gap-2 rounded-full hairline bg-panel/60 px-4 py-2 text-xs font-bold text-ink hover:border-accent/40"><Flag size={13} />Journey</button>
    {anchor && renderForegroundPortal(<div ref={menu} role="menu" aria-label="Set game progress" onKeyDown={navigate} style={{position: 'fixed', ...anchor, zIndex: 1000, maxHeight: 'calc(100vh - 16px)'}} className="w-60 overflow-y-auto rounded-lg hairline bg-[rgb(var(--panel))] p-2 shadow-2xl">
      <p className="px-2 pb-2 text-xs font-bold text-ink">Set game progress</p>
      {JOURNEY_STATUSES.map(choice => <button type="button" role="menuitemradio" aria-checked={choice.id === status} key={choice.id} disabled={!onUpdateGame} onClick={() => {onUpdateGame?.(game.id, {journeyStatus: choice.id}); setAnchor(null); trigger.current?.focus();}} className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs text-ink hover:bg-[rgb(var(--accent)/0.15)] focus:bg-[rgb(var(--accent)/0.15)] disabled:opacity-40">{choice.label}{choice.id === status && <Check size={12} />}</button>)}
    </div>)}
  </>;
}
