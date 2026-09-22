import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock3, Gamepad2, Grid3X3, HardDrive, Home, ImageOff, Library, List, LockKeyhole, Minus, Plus, Star } from 'lucide-react';
import { artworkBackdrop, portraitArtwork } from '../lib/game-artwork-model.mjs';
import { formatPlaytime } from '../lib/utils';
import { applyWallFilter, WALL_FILTERS } from './library/wall-filter-model.mjs';

function personalRating(game) {
  const rating = Number(game?.rating);
  return Number.isFinite(rating) && rating > 0 ? Math.min(5, Math.max(0, rating)).toFixed(1) : '';
}

function primaryGenre(game) {
  const profile = game?.genreProfile || {};
  const direct = profile.coreGenres || profile.subgenres || game?.genreTags || game?.genres || [];
  const value = Array.isArray(direct) ? direct[0] : '';
  return typeof value === 'object' ? value.label || value.name || '' : String(value || '—');
}

function friendlyDate(value) {
  if (!value) return '—';
  if (typeof value === 'string' && !/^\d+$/.test(value)) return value;
  const date = new Date(Number(value));
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date) : '—';
}

function installSize(game) {
  const bytes = Number(game?.installSizeBytes);
  if (!Number.isFinite(bytes) || bytes < 0) return 'Not measured';
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(bytes >= 10 * 1024 ** 3 ? 0 : 1)} GB`;
}

/** Wall is a full-width, quiet browsing mode with no sidebar. */
export default function CoverWall({ games = [], favoriteIds = [], density = 5, onDensityChange, onSelect, search = '', lockedCategories = [], onUnlockCategory, view = 'covers', onChangeView, onOpenHome, onOpenLibrary }) {
  const [wallFilter, setWallFilter] = React.useState('all');
  const visible = React.useMemo(() => {
    const term = String(search || '').trim().toLowerCase();
    const searched = term ? games.filter((game) => String(game.name || '').toLowerCase().includes(term)) : games;
    return applyWallFilter(searched, wallFilter, favoriteIds);
  }, [favoriteIds, games, search, wallFilter]);
  const tiles = Math.max(3, Math.min(10, Number(density) || 5));
  const detailed = view === 'details';

  return <section className="h-full overflow-y-auto px-5 py-4 lg:px-7" data-testid="library-cover-wall" data-wall-layout={detailed ? 'details' : 'covers'}>
    <header data-testid="wall-compact-toolbar" className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--panel)/0.52)] px-3 py-2 shadow-[0_10px_28px_-25px_rgba(0,0,0,.9)]">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[rgb(var(--accent)/0.35)] bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))]"><Grid3X3 size={15} /></span>
      <div className="mr-2 min-w-40"><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[rgb(var(--accent-2))]">Full library wall</p><h1 className="text-[13px] font-bold leading-tight">Browse your whole collection</h1></div>
      <div className="flex items-center gap-1 rounded-lg border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.34)] p-1" aria-label="Wall view">
        <button type="button" data-testid="wall-view-covers" onClick={() => onChangeView?.('covers')} className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[10.5px] font-semibold transition ${!detailed ? 'bg-[rgb(var(--accent)/0.16)] text-ink ring-1 ring-[rgb(var(--accent)/0.58)]' : 'text-muted hover:bg-[rgb(var(--accent)/0.08)] hover:text-ink'}`} title="Side-by-side portrait covers"><Grid3X3 size={14} /> Covers</button>
        <button type="button" data-testid="wall-view-details" onClick={() => onChangeView?.('details')} className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[10.5px] font-semibold transition ${detailed ? 'bg-[rgb(var(--accent-2)/0.14)] text-ink ring-1 ring-[rgb(var(--accent-2)/0.58)]' : 'text-muted hover:bg-[rgb(var(--accent-2)/0.08)] hover:text-ink'}`} title="Detailed library list"><List size={14} /> Details</button>
      </div>
      <div className="flex items-center gap-1 rounded-lg border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.34)] p-1" aria-label="Filter Wall games" data-testid="wall-quick-filters">
        {WALL_FILTERS.map((filter) => <button key={filter.id} type="button" data-testid={`wall-filter-${filter.id}`} aria-pressed={wallFilter === filter.id} onClick={() => setWallFilter(filter.id)} className={`h-8 whitespace-nowrap rounded-md px-2.5 text-[9.5px] font-bold uppercase tracking-[0.08em] transition ${wallFilter === filter.id ? 'bg-[rgb(var(--accent)/0.18)] text-ink ring-1 ring-[rgb(var(--accent)/0.62)] shadow-[0_0_12px_-7px_rgb(var(--accent))]' : 'text-muted hover:bg-[rgb(var(--accent)/0.08)] hover:text-ink'}`}>{filter.label}</button>)}
      </div>
      <span className="text-[9.5px] text-muted">{visible.length} game{visible.length === 1 ? '' : 's'}</span>
      {!detailed && <div className="flex h-9 items-center gap-1 rounded-lg border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.34)] px-1" aria-label="Cover size"><button type="button" onClick={() => onDensityChange?.(Math.max(3, tiles - 1))} disabled={tiles <= 3} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink disabled:opacity-35" title="Larger cards"><Minus size={13} /></button><input aria-label="Cover Wall density" type="range" min="3" max="10" step="1" value={tiles} onChange={(event) => onDensityChange?.(Number(event.target.value))} className="w-20 accent-[rgb(var(--accent))]" /><button type="button" onClick={() => onDensityChange?.(Math.min(10, tiles + 1))} disabled={tiles >= 10} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink disabled:opacity-35" title="Smaller cards"><Plus size={13} /></button><span className="min-w-8 text-center text-[9px] font-bold text-[rgb(var(--accent-2))]">{tiles}×{tiles}</span></div>}
      <div className="ml-auto flex items-center gap-1.5"><button type="button" onClick={onOpenHome} data-testid="wall-open-home" className="inline-flex h-8 items-center gap-1.5 rounded-lg hairline px-2.5 text-[10.5px] font-semibold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink"><Home size={12} /> Home</button><button type="button" onClick={onOpenLibrary} data-testid="wall-open-library" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--accent)/0.09)] px-2.5 text-[10.5px] font-semibold text-ink hover:bg-[rgb(var(--accent)/0.16)]"><Library size={12} /> Library</button></div>
    </header>
    {lockedCategories.length > 0 && <section className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.32)] bg-[rgb(var(--accent)/0.07)] px-3 py-2.5" data-testid="cover-wall-private-categories"><span className="inline-flex items-center gap-1.5 pr-1 text-[9px] font-black uppercase tracking-[0.16em] text-[rgb(var(--accent-2))]"><LockKeyhole size={13} />Protected categories</span>{lockedCategories.map((category) => <button key={category.id} type="button" onClick={() => onUnlockCategory?.(category)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[rgb(var(--accent)/0.44)] bg-[rgb(var(--panel)/0.54)] px-2.5 py-1.5 text-[10px] font-bold text-ink transition hover:border-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.16)]" title={`Enter PIN to show ${category.name} games`}><LockKeyhole size={12} className="text-[rgb(var(--accent))]" /><span>Show hidden category</span><span className="max-w-36 truncate text-[rgb(var(--accent-2))]">{category.name}</span></button>)}</section>}
    {detailed ? <WallDetails games={visible} onSelect={onSelect} /> : <WallCovers games={visible} tiles={tiles} onSelect={onSelect} />}
  </section>;
}

function WallCovers({ games, tiles, onSelect }) {
  if (!games.length) return <EmptyWall />;
  return <div className={`grid ${tiles >= 9 ? 'gap-2' : 'gap-3'}`} style={{ gridTemplateColumns: `repeat(${tiles}, minmax(0, 1fr))` }}>
    {games.map((game, index) => {
      const rating = personalRating(game);
      return <motion.button key={game.id} type="button" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: Math.min(index, 20) * 0.018 }} onClick={() => onSelect?.(game.id)} className="group min-w-0 overflow-hidden rounded-xl border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--panel)/0.42)] text-left shadow-[0_10px_25px_-20px_rgba(0,0,0,.95)] transition hover:-translate-y-1 hover:border-[rgb(var(--accent)/0.72)] hover:bg-[rgb(var(--accent)/0.08)] hover:shadow-[0_16px_35px_-18px_rgb(var(--accent)/0.48)]" title={`Open ${game.name || 'game'} Preview`}>
        <div className="relative aspect-[2/3] overflow-hidden bg-[rgb(var(--surface)/0.7)]">
          <CoverArtwork game={game} eager={index < 18} />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/22 to-transparent" />
          {rating && <span data-testid={`cover-wall-rating-${game.id}`} className="pointer-events-none absolute right-1.5 top-1.5 z-10 inline-flex min-w-12 items-center justify-center gap-1 rounded-md border border-amber-100 bg-amber-300 px-2 py-1 text-[11px] font-bold leading-none tracking-normal text-amber-950 shadow-none" style={{ textShadow: 'none' }} title={`Your personal rating: ${rating} out of 5`} aria-label={`Your personal rating: ${rating} out of 5`}><Star size={10} strokeWidth={2.4} fill="currentColor" />{rating}</span>}
        </div>
        <span data-testid="cover-wall-title" className="flex min-h-9 items-center truncate px-2.5 py-2 text-[12px] font-bold leading-tight text-ink group-hover:text-[rgb(var(--accent))]" title={game.name || 'Untitled game'}>{game.name || 'Untitled game'}</span>
      </motion.button>;
    })}
  </div>;
}

function WallDetails({ games, onSelect }) {
  if (!games.length) return <EmptyWall />;
  return <section className="overflow-x-auto rounded-2xl border border-[rgb(var(--border)/0.8)] bg-[rgb(var(--panel)/0.40)]" data-testid="wall-details-list"><div className="grid min-w-[820px] grid-cols-[minmax(230px,2fr)_minmax(105px,1fr)_120px_120px_110px_105px_80px] gap-3 border-b border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.48)] px-4 py-2 text-[9px] font-black uppercase tracking-[0.13em] text-muted"><span>Game</span><span>Main genre</span><span>Released</span><span>Last played</span><span>Install size</span><span>Hours played</span><span>Rating</span></div>{games.map((game, index) => <motion.button key={game.id} type="button" initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1 }} transition={{ duration: 0.16, delay: Math.min(index, 18) * 0.012 }} onClick={() => onSelect?.(game.id)} className="grid min-w-[820px] w-full grid-cols-[minmax(230px,2fr)_minmax(105px,1fr)_120px_120px_110px_105px_80px] items-center gap-3 border-b border-[rgb(var(--border)/0.52)] px-4 py-2.5 text-left last:border-b-0 hover:bg-[rgb(var(--accent)/0.075)]"><span className="flex min-w-0 items-center gap-3"><span className="h-10 w-7 shrink-0 overflow-hidden rounded border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.66)]"><CoverArtwork game={game} /></span><span className="min-w-0"><b className="block truncate text-[12px] text-ink">{game.name || 'Untitled game'}</b><small className="mt-0.5 flex items-center gap-1 truncate text-[9.5px] text-muted"><Gamepad2 size={10} />{game.launcher || game.source || 'Local game'}</small></span></span><span className="truncate text-[11px] text-muted">{primaryGenre(game)}</span><span className="inline-flex items-center gap-1 truncate text-[10.5px] text-muted"><CalendarDays size={11} className="text-[rgb(var(--accent-2))]" />{friendlyDate(game.releaseDate)}</span><span className="inline-flex items-center gap-1 truncate text-[10.5px] text-muted"><Clock3 size={11} className="text-[rgb(var(--accent-2))]" />{friendlyDate(game.lastPlayedAt)}</span><span className="inline-flex items-center gap-1 truncate text-[10.5px] text-muted"><HardDrive size={11} className="text-[rgb(var(--accent-2))]" />{installSize(game)}</span><span className="font-mono text-[11px] font-bold text-[rgb(var(--accent))]">{Number(game.playtime) > 0 ? formatPlaytime(game.playtime) : '—'}</span><span className="inline-flex items-center gap-1 font-bold text-amber-300"><Star size={12} fill={personalRating(game) ? 'currentColor' : 'none'} />{personalRating(game) || '—'}</span></motion.button>)}</section>;
}

function EmptyWall() { return <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-[rgb(var(--border)/0.78)] bg-[rgb(var(--panel)/0.25)] px-6 text-center"><div><ImageOff className="mx-auto text-[rgb(var(--accent-2))]" size={24} /><p className="mt-3 text-sm font-bold text-ink">No visible games here</p><p className="mt-1 text-xs text-muted">Try another launcher filter or clear your search.</p></div></div>; }

function CoverArtwork({ game, eager }) {
  const [failed, setFailed] = React.useState(false);
  const [backdropFailed, setBackdropFailed] = React.useState(false);
  const portrait = portraitArtwork(game);
  const backdrop = artworkBackdrop(game);
  if (portrait && !failed) return <img src={portrait} alt="" className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.045]" decoding="async" loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />;
  const fallback = fallbackCoverStyle(game);
  return <span data-testid="cover-artwork-fallback" className="relative grid h-full w-full place-items-end overflow-hidden p-3 text-left" style={fallback}>
    {backdrop && !backdropFailed && <img src={backdrop} alt="" className="absolute inset-0 h-full w-full scale-[1.04] object-cover saturate-[1.14] contrast-[1.06] transition duration-300 group-hover:scale-[1.09]" decoding="async" loading={eager ? 'eager' : 'lazy'} onError={() => setBackdropFailed(true)} />}
    <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/18 to-transparent" />
    {!backdrop || backdropFailed ? <span className="absolute -right-8 top-7 h-28 w-28 rotate-12 rounded-[30%] border border-white/20 bg-white/10" /> : null}
    <span className="relative w-full [text-shadow:0_1px_3px_rgb(0_0_0/.88)]"><ImageOff size={15} className="mb-2 text-white/80" /><b className="block break-words text-[12px] font-bold leading-tight text-white">{game.name || 'Untitled game'}</b><small className="mt-1 block text-[8px] font-bold uppercase tracking-[0.12em] text-white/70">{backdrop && !backdropFailed ? 'Backdrop artwork' : 'NEO-LIB fallback cover'}</small></span>
  </span>;
}

function fallbackCoverStyle(game) {
  const name = String(game?.name || 'NEO-LIB');
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) hash = ((hash << 5) - hash + name.charCodeAt(index)) | 0;
  const hue = Math.abs(hash) % 360;
  const second = (hue + 58 + (Math.abs(hash >> 4) % 72)) % 360;
  return { background: `linear-gradient(145deg, hsl(${hue} 66% 42%), hsl(${second} 72% 24%))` };
}
