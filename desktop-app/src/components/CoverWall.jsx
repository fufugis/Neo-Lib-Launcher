import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, CheckSquare, Clock3, Cloud, ExternalLink, Gamepad2, Grid3X3, HardDrive, Heart, Home, ImageOff, Library, List, LockKeyhole, Minus, Play, Plus, Radio, ShieldAlert, SlidersHorizontal, Square, Star, Trophy, UserRound, Users, Wrench, X } from 'lucide-react';
import { artworkBackdrop, portraitArtwork } from '../lib/game-artwork-model.mjs';
import { formatPlaytime } from '../lib/utils';
import { applyWallFilter, WALL_FILTERS } from './library/wall-filter-model.mjs';
import { gameSignals } from '../lib/game-signals-model.mjs';
import { JOURNEY_STATUSES, journeyStatusDefinition } from '../lib/game-journey-model.mjs';
import { normalizeWallColumns, visibleWallColumns } from './library/wall-columns-model.mjs';

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
export default function CoverWall({ games = [], favoriteIds = [], density = 5, onDensityChange, onOpenPreview, onLaunch, search = '', lockedCategories = [], onUnlockCategory, view = 'covers', onChangeView, onOpenHome, onOpenLibrary, wallColumns, onWallColumnsChange, collectionCategories = [], onBulkFavorite, onBulkJourneyStatus, onBulkAddCategory }) {
  const [wallFilter, setWallFilter] = React.useState('all');
  const [peekId, setPeekId] = React.useState('');
  const [columnMenuOpen, setColumnMenuOpen] = React.useState(false);
  const [sort, setSort] = React.useState({ id: 'game', direction: 'asc' });
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState([]);
  const visible = React.useMemo(() => {
    const term = String(search || '').trim().toLowerCase();
    const searched = term ? games.filter((game) => String(game.name || '').toLowerCase().includes(term)) : games;
    return applyWallFilter(searched, wallFilter, favoriteIds);
  }, [favoriteIds, games, search, wallFilter]);
  const tiles = Math.max(3, Math.min(10, Number(density) || 5));
  const detailed = view === 'details';
  const peekGame = visible.find((game) => game.id === peekId) || null;
  const columns = React.useMemo(() => normalizeWallColumns(wallColumns), [wallColumns]);
  const shownColumns = React.useMemo(() => visibleWallColumns(columns), [columns]);
  const selectedCount = selectedIds.length;
  const toggleSelected = (id) => setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const finishSelection = () => { setSelectionMode(false); setSelectedIds([]); };
  const beginSelection = () => { setPeekId(''); setSelectedIds([]); setSelectionMode(true); };

  React.useEffect(() => {
    if (peekId && !peekGame) setPeekId('');
  }, [peekGame, peekId]);

  React.useEffect(() => {
    if (!peekGame) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setPeekId(''); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [peekGame]);

  return <section className="relative h-full overflow-y-auto px-5 py-4 lg:px-7" data-testid="library-cover-wall" data-wall-layout={detailed ? 'details' : 'covers'}>
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
      {detailed && <button type="button" data-testid="wall-columns-toggle" onClick={() => setColumnMenuOpen((open) => !open)} className="inline-flex h-8 items-center gap-1.5 rounded-lg hairline px-2.5 text-[10.5px] font-semibold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink"><SlidersHorizontal size={12} /> Columns</button>}
      {selectionMode ? <CollectionActions count={selectedCount} categories={collectionCategories} onDone={finishSelection} onFavorite={(value) => { onBulkFavorite?.(selectedIds, value); }} onJourneyStatus={(journeyStatus) => { onBulkJourneyStatus?.(selectedIds, journeyStatus); }} onAddCategory={(categoryId) => onBulkAddCategory?.(selectedIds, categoryId)} /> : <button type="button" data-testid="wall-select-games" onClick={beginSelection} className="inline-flex h-8 items-center gap-1.5 rounded-lg hairline px-2.5 text-[10.5px] font-semibold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink"><CheckSquare size={12} /> Select games</button>}
      <div className="ml-auto flex items-center gap-1.5"><button type="button" onClick={onOpenHome} data-testid="wall-open-home" className="inline-flex h-8 items-center gap-1.5 rounded-lg hairline px-2.5 text-[10.5px] font-semibold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink"><Home size={12} /> Home</button><button type="button" onClick={onOpenLibrary} data-testid="wall-open-library" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--accent)/0.09)] px-2.5 text-[10.5px] font-semibold text-ink hover:bg-[rgb(var(--accent)/0.16)]"><Library size={12} /> Library</button></div>
    </header>
    {detailed && columnMenuOpen && <ColumnMenu columns={columns} onChange={onWallColumnsChange} />}
    {lockedCategories.length > 0 && <section className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.32)] bg-[rgb(var(--accent)/0.07)] px-3 py-2.5" data-testid="cover-wall-private-categories"><span className="inline-flex items-center gap-1.5 pr-1 text-[9px] font-black uppercase tracking-[0.16em] text-[rgb(var(--accent-2))]"><LockKeyhole size={13} />Protected categories</span>{lockedCategories.map((category) => <button key={category.id} type="button" onClick={() => onUnlockCategory?.(category)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[rgb(var(--accent)/0.44)] bg-[rgb(var(--panel)/0.54)] px-2.5 py-1.5 text-[10px] font-bold text-ink transition hover:border-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.16)]" title={`Enter PIN to show ${category.name} games`}><LockKeyhole size={12} className="text-[rgb(var(--accent))]" /><span>Show hidden category</span><span className="max-w-36 truncate text-[rgb(var(--accent-2))]">{category.name}</span></button>)}</section>}
    {detailed ? <WallDetailSections games={visible} columns={shownColumns} sort={sort} onSort={(id) => setSort((current) => ({ id, direction: current.id === id && current.direction === 'asc' ? 'desc' : 'asc' }))} onSelect={(id) => selectionMode ? toggleSelected(id) : setPeekId((current) => current === id ? '' : id)} selectionMode={selectionMode} selectedIds={selectedIds} /> : <WallCoverSections games={visible} tiles={tiles} onSelect={(id) => selectionMode ? toggleSelected(id) : setPeekId((current) => current === id ? '' : id)} selectionMode={selectionMode} selectedIds={selectedIds} />}
    {peekGame && <WallPeek game={peekGame} onClose={() => setPeekId('')} onOpenPreview={() => onOpenPreview?.(peekGame.id)} onLaunch={() => onLaunch?.(peekGame)} />}
  </section>;
}

function CollectionActions({ count, categories, onDone, onFavorite, onJourneyStatus, onAddCategory }) {
  return <div data-testid="wall-collection-actions" className="flex flex-wrap items-center gap-1 rounded-lg border border-[rgb(var(--accent)/0.46)] bg-[rgb(var(--accent)/0.08)] p-1"><span className="px-1.5 text-[9px] font-bold text-ink">{count} selected</span><button type="button" disabled={!count} onClick={() => onFavorite(true)} className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[9px] font-bold text-muted hover:bg-[rgb(var(--accent)/0.16)] hover:text-ink disabled:opacity-35"><Heart size={11} /> Favorite</button><button type="button" disabled={!count} onClick={() => onFavorite(false)} className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[9px] font-bold text-muted hover:bg-[rgb(var(--accent)/0.16)] hover:text-ink disabled:opacity-35">Unfavorite</button><select aria-label="Add selected Wall games to a category" disabled={!count || !categories.length} defaultValue="" onChange={(event) => { if (event.target.value) onAddCategory(event.target.value); event.target.value = ''; }} className="h-7 max-w-28 rounded-md bg-transparent px-1 text-[9px] font-bold text-muted outline-none disabled:opacity-35"><option value="">Add to…</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><select aria-label="Set Journey Status for selected games" disabled={!count} defaultValue="" onChange={(event) => { if (event.target.value) onJourneyStatus(event.target.value); event.target.value = ''; }} className="h-7 max-w-28 rounded-md bg-transparent px-1 text-[9px] font-bold text-muted outline-none disabled:opacity-35"><option value="">Set status…</option>{JOURNEY_STATUSES.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select><button type="button" onClick={onDone} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-[rgb(var(--accent)/0.16)] hover:text-ink" title="Leave selection mode"><X size={12} /></button></div>;
}

function WallCovers({ games, tiles, onSelect, selectionMode, selectedIds }) {
  if (!games.length) return <EmptyWall />;
  return <div className={`grid ${tiles >= 9 ? 'gap-2' : 'gap-3'}`} style={{ gridTemplateColumns: `repeat(${tiles}, minmax(0, 1fr))` }}>
    {games.map((game, index) => {
      const rating = personalRating(game);
      const selected = selectedIds.includes(game.id);
      return <motion.button key={game.id} type="button" aria-pressed={selectionMode ? selected : undefined} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: Math.min(index, 20) * 0.018 }} onClick={() => onSelect?.(game.id)} className={`group relative min-w-0 overflow-hidden rounded-xl border bg-[rgb(var(--panel)/0.42)] text-left shadow-[0_10px_25px_-20px_rgba(0,0,0,.95)] transition hover:-translate-y-1 hover:border-[rgb(var(--accent)/0.72)] hover:bg-[rgb(var(--accent)/0.08)] hover:shadow-[0_16px_35px_-18px_rgb(var(--accent)/0.48)] ${selected ? 'border-[rgb(var(--accent))] ring-2 ring-[rgb(var(--accent)/0.55)]' : 'border-[rgb(var(--border)/0.78)]'}`} title={selectionMode ? `Select ${game.name || 'game'}` : `Open ${game.name || 'game'} details`}>
        <div className="relative aspect-[2/3] overflow-hidden bg-[rgb(var(--surface)/0.7)]">
          <CoverArtwork game={game} eager={index < 18} />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/22 to-transparent" />
          {rating && <span data-testid={`cover-wall-rating-${game.id}`} className="pointer-events-none absolute right-1.5 top-1.5 z-10 inline-flex min-w-12 items-center justify-center gap-1 rounded-md border border-amber-100 bg-amber-300 px-2 py-1 text-[11px] font-bold leading-none tracking-normal text-amber-950 shadow-none" style={{ textShadow: 'none' }} title={`Your personal rating: ${rating} out of 5`} aria-label={`Your personal rating: ${rating} out of 5`}><Star size={10} strokeWidth={2.4} fill="currentColor" />{rating}</span>}
          {selectionMode && <span className="pointer-events-none absolute left-1.5 top-1.5 z-10 grid h-6 w-6 place-items-center rounded-md bg-black/62 text-white">{selected ? <CheckSquare size={15} /> : <Square size={15} />}</span>}
        </div>
        <span data-testid="cover-wall-title" className="flex min-h-9 items-center truncate px-2.5 py-2 text-[12px] font-bold leading-tight text-ink group-hover:text-[rgb(var(--accent))]" title={game.name || 'Untitled game'}>{game.name || 'Untitled game'}</span>
      </motion.button>;
    })}
  </div>;
}

function WallCoverSections({ games, ...props }) {
  if (!games.length) return <EmptyWall />;
  const standard = games.filter(game => game.source !== 'emulation');
  const retro = retroGameGroups(games);
  return <div className="space-y-7" data-testid="wall-platform-sections">
    {standard.length > 0 && <WallCovers games={standard} {...props} />}
    {retro.map(([platform, platformGames]) => <section key={platform} data-testid={`wall-retro-${platform}`}>
      <RetroSectionHeading games={platformGames} />
      <WallCovers games={platformGames} {...props} />
    </section>)}
  </div>;
}

function WallDetailSections({ games, ...props }) {
  if (!games.length) return <EmptyWall />;
  const standard = games.filter(game => game.source !== 'emulation');
  const retro = retroGameGroups(games);
  return <div className="space-y-7" data-testid="wall-detail-platform-sections">
    {standard.length > 0 && <WallDetails games={standard} {...props} />}
    {retro.map(([platform, platformGames]) => <section key={platform}><RetroSectionHeading games={platformGames} /><WallDetails games={platformGames} {...props} /></section>)}
  </div>;
}

function retroGameGroups(games) {
  const groups = new Map();
  games.filter(game => game.source === 'emulation').forEach((game) => { const key = game.retroPlatform || 'generic'; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(game); });
  return [...groups.entries()].sort((left, right) => String(left[1][0]?.platform || left[0]).localeCompare(String(right[1][0]?.platform || right[0])));
}

function RetroSectionHeading({ games }) {
  return <div className="mb-2 flex items-center gap-2 border-b border-[rgb(var(--accent)/0.32)] pb-2"><Gamepad2 size={13} className="text-[rgb(var(--accent))]" /><h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-ink">{games[0]?.platform || 'Retro games'}</h2><span className="rounded-full bg-[rgb(var(--accent)/0.12)] px-2 py-0.5 text-[9px] text-muted">{games.length}</span></div>;
}

function WallDetails({ games, columns, sort, onSort, onSelect, selectionMode, selectedIds }) {
  if (!games.length) return <EmptyWall />;
  const sorted = [...games].sort((left, right) => compareWallGames(left, right, sort.id) * (sort.direction === 'desc' ? -1 : 1));
  const template = columns.map((column) => `minmax(${column.minWidth}px,${column.width}px)`).join(' ');
  const selectionTemplate = selectionMode ? `28px ${template}` : template;
  return <section className="overflow-x-auto rounded-2xl border border-[rgb(var(--border)/0.8)] bg-[rgb(var(--panel)/0.40)]" data-testid="wall-details-list"><div className="grid min-w-max gap-3 border-b border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.48)] px-4 py-2 text-[9px] font-black uppercase tracking-[0.13em] text-muted" style={{ gridTemplateColumns: selectionTemplate }}>{selectionMode && <span>Select</span>}{columns.map((column) => <button key={column.id} onClick={() => onSort(column.id)} className="truncate text-left hover:text-ink">{column.label}{sort.id === column.id ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''}</button>)}</div>{sorted.map((game, index) => { const selected = selectedIds.includes(game.id); return <motion.button key={game.id} type="button" aria-pressed={selectionMode ? selected : undefined} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1 }} transition={{ duration: 0.16, delay: Math.min(index, 18) * 0.012 }} onClick={() => onSelect?.(game.id)} className={`grid min-w-max w-full items-center gap-3 border-b border-[rgb(var(--border)/0.52)] px-4 py-2.5 text-left last:border-b-0 hover:bg-[rgb(var(--accent)/0.075)] ${selected ? 'bg-[rgb(var(--accent)/0.10)]' : ''}`} style={{ gridTemplateColumns: selectionTemplate }}>{selectionMode && <span className="text-[rgb(var(--accent))]">{selected ? <CheckSquare size={16} /> : <Square size={16} />}</span>}{columns.map((column) => <WallCell key={column.id} column={column.id} game={game} />)}</motion.button>; })}</section>;
}

function ColumnMenu({ columns, onChange }) {
  const update = (id, patch) => onChange?.(columns.map((column) => column.id === id ? { ...column, ...patch } : column));
  return <section data-testid="wall-columns-menu" className="mb-3 rounded-xl border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--panel)/0.78)] p-3"><p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-muted">Visible columns</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{columns.map((column) => <label key={column.id} className="flex items-center gap-2 rounded-lg border border-[rgb(var(--border)/0.5)] px-2.5 py-2 text-xs text-muted"><input type="checkbox" checked={column.visible} disabled={column.id === 'game'} onChange={() => update(column.id, { visible: !column.visible })} /><span className="flex-1">{column.label}</span><input aria-label={`${column.label} width`} type="range" min={column.minWidth} max="360" value={column.width} onChange={(event) => update(column.id, { width: Number(event.target.value) })} className="w-16 accent-[rgb(var(--accent))]" /></label>)}</div></section>;
}

function WallCell({ column, game }) {
  if (column === 'game') return <span className="flex min-w-0 items-center gap-3"><span className="h-10 w-7 shrink-0 overflow-hidden rounded border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.66)]"><CoverArtwork game={game} /></span><span className="min-w-0"><b className="block truncate text-[12px] text-ink">{game.name || 'Untitled game'}</b><small className="mt-0.5 flex items-center gap-1 truncate text-[9.5px] text-muted"><Gamepad2 size={10} />{game.launcher || game.source || 'Local game'}</small></span></span>;
  const values = { mainGenre: primaryGenre(game), journeyStatus: journeyStatusDefinition(game.journeyStatus).label, released: friendlyDate(game.releaseDate), lastPlayed: friendlyDate(game.lastPlayedAt), installSize: installSize(game), playtime: Number(game.playtime) > 0 ? formatPlaytime(game.playtime) : '—', source: game.launcher || game.source || 'Local game', rating: personalRating(game) || '—' };
  return <span className="truncate text-[10.5px] text-muted" title={values[column]}>{values[column]}</span>;
}

function compareWallGames(left, right, column) {
  const values = { game: (game) => game.name || '', mainGenre: primaryGenre, journeyStatus: (game) => journeyStatusDefinition(game.journeyStatus).label, released: (game) => game.releaseDate || '', lastPlayed: (game) => game.lastPlayedAt || 0, installSize: (game) => game.installSizeBytes || 0, playtime: (game) => game.playtime || 0, source: (game) => game.launcher || game.source || '', rating: (game) => game.rating || 0 };
  return String(values[column](left)).localeCompare(String(values[column](right)), undefined, { numeric: true });
}

function WallPeek({ game, onClose, onOpenPreview, onLaunch }) {
  const journey = journeyStatusDefinition(game.journeyStatus);
  const signals = gameSignals(game);
  const screenshots = (Array.isArray(game.screenshots) ? game.screenshots : [])
    .filter((image) => typeof image === 'string' && image.trim())
    .slice(0, 3);
  const cover = portraitArtwork(game) || artworkBackdrop(game);
  return <div className="absolute inset-0 z-30 bg-black/38 backdrop-blur-[1px]" data-testid="wall-peek-backdrop" onClick={onClose}>
    <motion.aside
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 28 }}
      transition={{ duration: 0.16 }}
      onClick={(event) => event.stopPropagation()}
      className="absolute inset-y-3 right-3 flex w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[rgb(var(--accent)/0.42)] bg-[rgb(var(--panel)/0.96)] shadow-2xl"
      data-testid="wall-peek"
      aria-label={`${game.name || 'Game'} quick preview`}
    >
      <div className="flex items-start gap-3 border-b border-[rgb(var(--border)/0.58)] p-3">
        <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.7)]">
          {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-muted"><ImageOff size={16} /></span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent-2))]">{game.launcher || game.source || 'Local library'}</p>
          <h2 className="mt-1 truncate text-base font-bold text-ink" title={game.name}>{game.name || 'Untitled game'}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-[rgb(var(--accent)/0.35)] bg-[rgb(var(--accent)/0.10)] px-2 py-1 text-[9px] font-bold text-ink">{journey.label}</span>
            <span className="rounded-full border border-[rgb(var(--border)/0.72)] px-2 py-1 text-[9px] text-muted">{Number(game.playtime) > 0 ? formatPlaytime(game.playtime) : 'Not played yet'}</span>
          </div>
        </div>
        <button onClick={onClose} data-testid="wall-peek-close" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink" title="Close quick preview"><X size={15} /></button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {game.shortDescription || game.about ? <p className="text-xs leading-relaxed text-muted">{game.shortDescription || String(game.about).slice(0, 280)}</p> : null}
        {signals.length ? <section className="mt-4"><h3 className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">Game signals</h3><div className="mt-2 flex flex-wrap gap-1.5">{signals.map((signal) => <Signal key={signal.id} signal={signal} />)}</div></section> : null}
        {screenshots.length ? <section className="mt-4"><h3 className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">Screenshots</h3><div className="mt-2 grid grid-cols-3 gap-1.5">{screenshots.map((image, index) => <img key={`${image}-${index}`} src={image} alt="" className="aspect-video w-full rounded-md border border-[rgb(var(--border)/0.62)] object-cover" />)}</div></section> : null}
        <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-muted">
          <PeekFact label="Genre" value={primaryGenre(game)} />
          <PeekFact label="Released" value={friendlyDate(game.releaseDate)} />
          <PeekFact label="Install size" value={installSize(game)} />
          <PeekFact label="Last played" value={friendlyDate(game.lastPlayedAt)} />
        </div>
      </div>

      <div className="flex gap-2 border-t border-[rgb(var(--border)/0.58)] p-3">
        <button data-neolib-launch="true" data-testid="wall-peek-play" onClick={onLaunch} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[rgb(var(--accent))] px-3 py-2 text-xs font-bold text-[rgb(var(--surface))] hover:brightness-110"><Play size={13} fill="currentColor" />Play</button>
        <button data-testid="wall-peek-open-preview" onClick={onOpenPreview} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg hairline px-3 py-2 text-xs font-bold text-ink hover:border-[rgb(var(--accent)/0.58)]"><ExternalLink size={13} />Full Preview</button>
      </div>
    </motion.aside>
  </div>;
}

function PeekFact({ label, value }) {
  return <div className="rounded-lg border border-[rgb(var(--border)/0.58)] bg-[rgb(var(--surface)/0.26)] px-2.5 py-2"><span className="block text-[8px] font-bold uppercase tracking-[0.13em] text-muted">{label}</span><span className="mt-0.5 block truncate text-[10px] text-ink" title={value}>{value}</span></div>;
}

const SIGNAL_ICONS = Object.freeze({
  'single-player': UserRound,
  'online-multiplayer': Users,
  'local-multiplayer': Users,
  'co-op': Users,
  pvp: Users,
  'controller-full': Gamepad2,
  'controller-partial': Gamepad2,
  achievements: Trophy,
  'cloud-saves': Cloud,
  workshop: Wrench,
  'remote-play': Radio,
  'adult-content': ShieldAlert,
  'sexual-content': ShieldAlert,
  'graphic-violence': ShieldAlert,
  horror: ShieldAlert,
});

function Signal({ signal }) {
  const Icon = SIGNAL_ICONS[signal.id] || ShieldAlert;
  return <span title={`${signal.label} · ${signal.source}${signal.detail ? ` · ${signal.detail}` : ''}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgb(var(--border)/0.62)] bg-[rgb(var(--surface)/0.32)] text-[rgb(var(--accent-2))]"><Icon size={14} aria-label={signal.label} /></span>;
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
    <span className="relative w-full [text-shadow:0_1px_3px_rgb(0_0_0/.88)]">{game.source === 'emulation' ? <span className="mb-2 inline-flex items-center gap-1 rounded border border-white/30 bg-black/35 px-1.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-white"><Gamepad2 size={10} />{game.platform || 'Retro'}</span> : <ImageOff size={15} className="mb-2 text-white/80" />}<b className="block break-words text-[12px] font-bold leading-tight text-white">{game.name || 'Untitled game'}</b><small className="mt-1 block text-[8px] font-bold uppercase tracking-[0.12em] text-white/70">{backdrop && !backdropFailed ? 'Backdrop artwork' : game.source === 'emulation' ? 'Awaiting reviewed case art' : 'NEO-LIB fallback cover'}</small></span>
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
