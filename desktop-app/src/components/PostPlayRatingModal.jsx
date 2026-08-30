import React from 'react';
import { motion } from 'framer-motion';
import { Clock3, Gamepad2, Star } from 'lucide-react';
import Modal from './Modal';

export default function PostPlayRatingModal({ game, seconds = 0, onRate, onSnooze, onNever }) {
  const [whole, setWhole] = React.useState(null);
  React.useEffect(() => { setWhole(null); }, [game?.id]);
  if (!game) return null;
  const choices = whole === 5 ? [5] : whole ? Array.from({ length: 10 }, (_, index) => Number((whole + index / 10).toFixed(1))) : [];
  const minutes = Math.max(1, Math.round(Number(seconds || 0) / 60));
  return <Modal open onClose={onSnooze} title="How was your session?" testid="post-play-rating-modal">
    <div className="p-5">
      <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-xl bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))]"><Gamepad2 size={22} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--accent-2))]">Played for about {minutes} min</p><h3 className="mt-0.5 text-[17px] font-black">Rate {game.name}</h3></div></div>
      <p className="mt-4 text-[11.5px] leading-relaxed text-muted">Your private rating improves My Best Games and NEO-LIB’s recommendations. Choose a star, then refine it to a tenth.</p>
      <div className="mt-4 flex justify-center gap-2">{[1, 2, 3, 4, 5].map((value) => <motion.button key={value} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.94 }} onClick={() => setWhole(value)} className={`grid h-11 w-11 place-items-center rounded-xl border transition ${whole === value ? 'border-[#ffcc4a] bg-[#ffcc4a]/15 text-[#ffcc4a] shadow-[0_0_18px_rgba(255,204,74,.35)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.35)] text-muted hover:text-[#ffcc4a]'}`} title={`Choose ${value}.0 to ${value}.9`}><Star size={24} fill={whole === value ? 'currentColor' : 'none'} /></motion.button>)}</div>
      {whole && <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4"><p className="mb-2 text-center text-[9px] font-black uppercase tracking-[0.18em] text-muted">Choose the precise score</p><div className={`grid gap-1.5 ${whole === 5 ? 'grid-cols-1' : 'grid-cols-5'}`}>{choices.map((rating) => <button key={rating} onClick={() => onRate?.(rating)} className="rounded-lg border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.08)] px-2 py-2 text-[11px] font-black text-ink hover:bg-[#ffcc4a] hover:text-[#2d1c00]">{rating.toFixed(1)}</button>)}</div></motion.div>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[rgb(var(--border)/0.65)] pt-4"><button onClick={onNever} className="text-[9.5px] font-semibold text-muted hover:text-red-300">Don’t ask again for this game</button><button onClick={onSnooze} className="inline-flex items-center gap-1.5 rounded-lg hairline px-3 py-2 text-[10px] font-bold text-muted hover:text-ink"><Clock3 size={12} /> Ask after another session</button></div>
    </div>
  </Modal>;
}
