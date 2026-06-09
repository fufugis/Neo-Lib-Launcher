import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Flame, Plus, Sparkles, Shuffle, ChevronLeft, ChevronRight } from 'lucide-react';
import { SHOWCASE_MODES, sortGamesForShowcase, formatPlaytime, cn } from '../lib/utils';

const ICONS = {
  recent_added:  <Plus size={11} />,
  recent_played: <Clock size={11} />,
  most_played:   <Flame size={11} />,
  untouched:     <Sparkles size={11} />,
  random:        <Shuffle size={11} />,
};

export default function ShowcaseStrip({ games, mode, setMode, onSelect, selectedId }) {
  const sorted = React.useMemo(() => sortGamesForShowcase(games, mode).slice(0, 30), [games, mode]);
  const scrollRef = React.useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  if (games.length === 0) return null;

  return (
    <div
      className="relative border-t hairline bg-panel/30"
      data-testid="showcase-strip"
    >
      <div className="flex items-center justify-between px-6 pt-3 pb-1.5">
        <div className="flex items-center gap-1.5">
          {SHOWCASE_MODES.map((m) => (
            <button
              key={m.id}
              data-testid={`showcase-mode-${m.id}`}
              onClick={() => setMode(m.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] uppercase tracking-wider transition-all',
                mode === m.id
                  ? 'bg-[rgb(var(--accent)/0.14)] text-ink hairline border-[rgb(var(--accent)/0.55)]'
                  : 'text-muted hover:text-ink'
              )}
            >
              <span className="text-[rgb(var(--accent))]">{ICONS[m.id]}</span>
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <ScrollBtn onClick={() => scroll(-1)}><ChevronLeft size={13} /></ScrollBtn>
          <ScrollBtn onClick={() => scroll(1)}><ChevronRight size={13} /></ScrollBtn>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-6 pb-4 pt-2 [scrollbar-width:thin]"
        style={{ scrollbarWidth: 'thin' }}
      >
        <AnimatePresence mode="popLayout">
          {sorted.map((g, i) => (
            <Tile
              key={g.id}
              g={g}
              mode={mode}
              selected={selectedId === g.id}
              index={i}
              onClick={() => onSelect(g.id)}
            />
          ))}
        </AnimatePresence>
        {sorted.length === 0 && (
          <div className="px-2 py-6 text-xs text-muted">Nothing here yet.</div>
        )}
      </div>
    </div>
  );
}

function ScrollBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="grid h-6 w-6 place-items-center rounded-md hairline text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.4)]"
    >
      {children}
    </button>
  );
}

function Tile({ g, mode, selected, index, onClick }) {
  const stat = (() => {
    if (mode === 'most_played' || mode === 'recent_played') {
      return g.playtime ? formatPlaytime(g.playtime) : 'Never';
    }
    if (mode === 'recent_added') {
      return g.addedAt ? new Date(g.addedAt).toLocaleDateString() : '—';
    }
    if (mode === 'untouched') return 'Untouched';
    return '';
  })();

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ delay: Math.min(index * 0.018, 0.18) }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      data-testid={`showcase-tile-${g.id}`}
      className={cn(
        'group relative h-[88px] w-[152px] shrink-0 overflow-hidden rounded-lg hairline bg-surface/60 text-left transition-shadow',
        selected ? 'ring-1 ring-[rgb(var(--accent))] shadow-[0_0_18px_-2px_rgb(var(--accent)/0.55)]' : ''
      )}
    >
      {(g.coverUrl || g.headerImage) ? (
        <img
          src={g.headerImage || g.coverUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
        />
      ) : (
        <div className="absolute inset-0">
          <div className="synth-grid opacity-60" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-2">
        <div className="truncate text-[11.5px] font-semibold text-white">
          {g.name}
        </div>
        {stat && (
          <div className="truncate text-[10px] text-[rgb(var(--accent-2))] neon-text-cyan">
            {stat}
          </div>
        )}
      </div>
    </motion.button>
  );
}
