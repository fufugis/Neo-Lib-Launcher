import React from 'react';
import { motion } from 'framer-motion';
import { Grid3X3, ImageOff, LockKeyhole, Minus, Plus } from 'lucide-react';

function coverFor(game) {
  // Wall is deliberately landscape-first. Wide source art stays much sharper
  // at dense 9x9 / 10x10 layouts than stretching a portrait cover into a tile.
  return game.headerImage || game.capsuleImage || game.background || game.coverUrl || game.icon || '';
}

/**
 * CoverWall is a deliberately calm Library alternative: all visible games in a
 * responsive cover grid, with no permanently-open Preview competing for room.
 * Private titles stay excluded until their own PIN is entered. Their controls
 * live in the Wall header, so private games never leak into the grid just by
 * changing Library view.
 */
export default function CoverWall({ games = [], density = 5, onDensityChange, onSelect, search = '', lockedCategories = [], onUnlockCategory }) {
  const visible = React.useMemo(() => {
    const term = String(search || '').trim().toLowerCase();
    return term ? games.filter((game) => String(game.name || '').toLowerCase().includes(term)) : games;
  }, [games, search]);
  const tiles = Math.max(3, Math.min(10, Number(density) || 5));
  const titleSize = tiles >= 10 ? 8 : tiles >= 9 ? 8.5 : tiles >= 8 ? 9 : tiles >= 7 ? 10 : tiles >= 6 ? 11 : 12;
  return <section className="h-full overflow-y-auto px-5 py-5 lg:px-7" data-testid="library-cover-wall">
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--panel)/0.36)] px-4 py-3 shadow-[0_12px_38px_-28px_rgba(0,0,0,.9)]">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--accent)/0.35)] bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))]"><Grid3X3 size={17} /></span><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">Cover Wall</p><h1 className="text-sm font-black">Your games, all in one view</h1><p className="mt-0.5 text-[10px] text-muted">Click a game to open its Preview. Private games remain protected until you unlock their category.</p></div></div>
      <div className="flex items-center gap-2 rounded-xl border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--surface)/0.42)] p-1.5"><button type="button" onClick={() => onDensityChange?.(Math.max(3, tiles - 1))} disabled={tiles <= 3} className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink disabled:opacity-35" title="Larger cards"><Minus size={14} /></button><input aria-label="Cover Wall density" type="range" min="3" max="10" step="1" value={tiles} onChange={(event) => onDensityChange?.(Number(event.target.value))} className="w-28 accent-[rgb(var(--accent))]" /><button type="button" onClick={() => onDensityChange?.(Math.min(10, tiles + 1))} disabled={tiles >= 10} className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink disabled:opacity-35" title="Smaller cards"><Plus size={14} /></button><span className="min-w-10 text-center text-[10px] font-black text-[rgb(var(--accent-2))]">{tiles}×{tiles}</span></div>
    </header>
    {lockedCategories.length > 0 && <section className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.32)] bg-[rgb(var(--accent)/0.07)] px-3 py-2.5" data-testid="cover-wall-private-categories">
      <span className="inline-flex items-center gap-1.5 pr-1 text-[9px] font-black uppercase tracking-[0.16em] text-[rgb(var(--accent-2))]"><LockKeyhole size={13} />Protected categories</span>
      {lockedCategories.map((category) => <button key={category.id} type="button" onClick={() => onUnlockCategory?.(category)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[rgb(var(--accent)/0.44)] bg-[rgb(var(--panel)/0.54)] px-2.5 py-1.5 text-[10px] font-bold text-ink transition hover:border-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.16)]" title={`Enter PIN to show ${category.name} games`}><LockKeyhole size={12} className="text-[rgb(var(--accent))]" /><span>Show hidden category</span><span className="max-w-36 truncate text-[rgb(var(--accent-2))]">{category.name}</span></button>)}
    </section>}
    {visible.length ? <div className={`grid ${tiles >= 9 ? 'gap-2' : 'gap-3'}`} style={{ gridTemplateColumns: `repeat(${tiles}, minmax(0, 1fr))` }}>{visible.map((game, index) => <motion.button key={game.id} type="button" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: Math.min(index, 20) * 0.018 }} onClick={() => onSelect?.(game.id)} className="group min-w-0 overflow-hidden rounded-xl border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--panel)/0.42)] text-left shadow-[0_10px_25px_-20px_rgba(0,0,0,.95)] transition hover:-translate-y-1 hover:border-[rgb(var(--accent)/0.72)] hover:bg-[rgb(var(--accent)/0.08)] hover:shadow-[0_16px_35px_-18px_rgb(var(--accent)/0.48)]" title={`Open ${game.name || 'game'} Preview`}><div className="relative aspect-[16/10] overflow-hidden bg-[rgb(var(--surface)/0.7)]">{coverFor(game) ? <img src={coverFor(game)} alt="" className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.045]" decoding="async" loading={index < 18 ? 'eager' : 'lazy'} /> : <span className="grid h-full place-items-center text-muted"><ImageOff size={tiles > 6 ? 16 : 22} /></span>}<span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/22 to-transparent" /></div><span className="block truncate px-2.5 py-2 font-bold text-ink group-hover:text-[rgb(var(--accent))]" style={{ fontSize: `${titleSize}px` }}>{game.name || 'Untitled game'}</span></motion.button>)}</div> : <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-[rgb(var(--border)/0.78)] bg-[rgb(var(--panel)/0.25)] px-6 text-center"><div><ImageOff className="mx-auto text-[rgb(var(--accent-2))]" size={24} /><p className="mt-3 text-sm font-bold text-ink">No visible games here</p><p className="mt-1 text-xs text-muted">Try another launcher filter or clear your search.</p></div></div>}
  </section>;
}
