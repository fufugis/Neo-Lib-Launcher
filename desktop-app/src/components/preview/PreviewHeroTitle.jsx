import React from 'react';
import { motion } from 'framer-motion';
import { Clock3, HardDrive, Loader2, Star } from 'lucide-react';

/** Title, release date and player-owned rating layered over GameDetail's hero art. */
export default function PreviewHeroTitle({ game, onUpdateGame, installSize, measuringSize, onMeasureSize }) {
  return (
    <div className="relative aspect-[16/2.1] w-full">
      <div className="absolute inset-0 flex items-end px-8 pb-3">
        <div className="max-w-3xl">
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="mb-1.5 flex items-center gap-3 text-[9.5px] uppercase tracking-[0.32em] text-[rgb(var(--accent-2))] neon-text-cyan"
          >
            <span className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-[rgb(var(--accent-2))]" />My rating</span>
            <StarRating value={Number(game.rating) || 0} onChange={(value) => onUpdateGame?.(game.id, { rating: value })} />
          </motion.div>
          <motion.h1
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 180 }}
            className="font-display text-[34px] font-extrabold leading-[1.02] tracking-tight neon-text"
            data-testid="detail-title"
            style={{ textShadow: '0 2px 24px rgb(var(--surface) / 0.95), 0 0 18px rgb(var(--accent) / 0.4)' }}
          >
            {game.name}
          </motion.h1>
          {game.releaseDate && <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.18 }} className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">Released · {game.releaseDate}</motion.div>}
          <GameFacts game={game} installSize={installSize} measuringSize={measuringSize} onMeasureSize={onMeasureSize} />
        </div>
      </div>
    </div>
  );
}

function GameFacts({ game, installSize, measuringSize, onMeasureSize }) {
  const minutes = Math.max(0, Number(game.playtime || 0));
  const time = minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60 ? `${minutes % 60}m` : ''}`.trim() : `${minutes}m`;
  const bytes = Number(installSize?.bytes ?? game.installSizeBytes);
  const hasSize = Number.isFinite(bytes) && bytes >= 0;
  const readable = hasSize ? `${installSize?.truncated || game.installSizePartial ? '≥ ' : ''}${bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(bytes >= 10 * 1024 ** 3 ? 0 : 1)} GB` : `${Math.max(0, Math.round(bytes / 1024 ** 2))} MB`}` : 'Not measured';
  return <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.22 }} className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-[rgb(var(--border)/0.48)] pt-2.5 text-[10px] text-muted" data-testid="preview-game-facts">
    <span className="inline-flex items-center gap-1.5"><Clock3 size={13} className="text-[rgb(var(--accent-2))]" /><span><b className="block text-[8px] uppercase tracking-[0.14em] text-muted">Time played</b><strong className="font-mono text-[11px] text-ink">{time}</strong></span></span>
    <span className="inline-flex items-center gap-1.5"><HardDrive size={13} className="text-[rgb(var(--accent-2))]" /><span><b className="block text-[8px] uppercase tracking-[0.14em] text-muted">Install size</b><strong className="font-mono text-[11px] text-ink">{readable}</strong></span></span>
    {!hasSize && game.exePath && <button type="button" disabled={measuringSize} onClick={onMeasureSize} className="inline-flex items-center gap-1 rounded-md border border-[rgb(var(--border)/0.7)] px-2 py-1 text-[9px] font-bold text-ink hover:border-[rgb(var(--accent)/0.65)] disabled:opacity-60">{measuringSize ? <Loader2 size={11} className="animate-spin" /> : <HardDrive size={11} />}Scan size</button>}
  </motion.div>;
}

function StarRating({ value = 0, onChange }) {
  const [hover, setHover] = React.useState(0);
  const [openFor, setOpenFor] = React.useState(null);
  const rootRef = React.useRef(null);
  const shown = hover || value;
  React.useEffect(() => {
    const close = (event) => { if (rootRef.current && !rootRef.current.contains(event.target)) setOpenFor(null); };
    const escape = (event) => { if (event.key === 'Escape') setOpenFor(null); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, []);
  return (
    <span ref={rootRef} className="relative inline-flex items-center gap-0.5" onMouseLeave={() => setHover(0)} data-testid="game-star-rating" onClick={(event) => event.stopPropagation()}>
      {[1, 2, 3, 4, 5].map((index) => {
        const fillRatio = Math.max(0, Math.min(1, shown - (index - 1)));
        const filled = fillRatio > 0;
        return (
          <button
            key={index}
            data-testid={`star-${index}`}
            title={`Choose a ${index}.0–${index}.9 rating`}
            onMouseEnter={() => setHover(index)}
            onClick={(event) => { event.stopPropagation(); setOpenFor((current) => current === index ? null : index); }}
            className="relative grid h-6 w-6 place-items-center transition-transform hover:scale-110"
            style={{ color: filled ? '#ffcc4a' : 'rgb(var(--muted) / 0.5)', filter: filled ? 'drop-shadow(0 0 4px rgba(255,204,74,0.7))' : 'none' }}
          >
            <Star className="absolute" size={19} strokeWidth={2} fill="none" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillRatio * 100}%` }} aria-hidden="true"><Star className="absolute left-[2px] top-[2px] text-[#ffcc4a]" size={19} strokeWidth={2} fill="#ffcc4a" /></span>
          </button>
        );
      })}
      <span className="ml-1 min-w-7 text-[10px] font-black tracking-normal text-[#ffdc72]" aria-label={value ? `${value.toFixed(1)} out of 5 stars` : 'No rating'}>{value ? value.toFixed(1) : '—'}</span>
      {openFor && <span className="absolute left-0 top-[calc(100%+7px)] z-[80] grid w-[186px] grid-cols-5 gap-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.98)] p-2 shadow-2xl" role="menu" aria-label={`Choose ${openFor}-star rating`}><button onClick={() => { onChange?.(0); setOpenFor(null); }} className="col-span-5 rounded px-2 py-1 text-left text-[10px] font-bold text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink">Clear my rating</button>{(openFor === 5 ? [5] : Array.from({ length: 10 }, (_, index) => Number((openFor + index / 10).toFixed(1)))).map((rating) => <button key={rating} onClick={() => { onChange?.(rating); setOpenFor(null); }} className={`rounded px-1 py-1.5 text-[10px] font-black transition ${value === rating ? 'bg-[#ffcc4a] text-[#2d1c00]' : 'bg-[rgb(var(--surface)/0.5)] text-ink hover:bg-[rgb(var(--accent)/0.2)]'}`}>{rating.toFixed(1)}</button>)}</span>}
    </span>
  );
}
