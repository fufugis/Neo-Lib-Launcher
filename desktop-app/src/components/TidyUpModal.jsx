import React from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Sparkles, Trash2, Check, X, GripVertical, ArrowRight, AlertCircle, Search, ImagePlus, RefreshCw } from 'lucide-react';
import { formatPlaytime } from '../lib/utils';
import { genreProfileNeedsEnrichment } from '../lib/genreTaxonomy';
import { libraryArtworkAudit } from './home/library-artwork-audit.mjs';

/**
 * TidyUpModal — Duplicate finder.
 *
 * Scans the library for duplicate games. Detection rules:
 *   1. Same exePath (case-insensitive) → hard duplicate
 *   2. Same name (normalized) → likely duplicate
 *   3. Two different .exe paths that share the same folder OR share a common
 *      ancestor folder up to 3 levels above → probable same-game repack
 *
 * User is shown each cluster side-by-side and picks which one to keep.
 */
export default function TidyUpModal({ open, games, reviewMode = 'issues', onDelete, onSelect, onRepairMetadata, onFixArtwork, onRefreshMetadata, onClose }) {
  const dragControls = useDragControls();
  const dragBoundsRef = React.useRef(null);
  const [clusters, setClusters] = React.useState([]);
  const [ci, setCi] = React.useState(0);
  const [gameQuery, setGameQuery] = React.useState('');
  const [showAllGames, setShowAllGames] = React.useState(reviewMode === 'all');

  React.useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClusters(findDuplicates(games || []));
    setCi(0);
  }, [open, games]);

  const reviewGroups = React.useMemo(() => findReviewGroups(games || []), [games]);
  const reviewCount = reviewGroups.reduce((sum, group) => sum + group.games.length, 0);
  const auditRows = React.useMemo(() => libraryArtworkAudit(games || []), [games]);

  React.useEffect(() => { setShowAllGames(reviewMode === 'all'); }, [reviewMode, open]);
  const filteredRows = auditRows.filter((row) => (showAllGames || row.needsReview)
    && (!gameQuery.trim() || `${row.game.name || ''} ${row.exeName} ${row.game.exePath || ''}`.toLowerCase().includes(gameQuery.trim().toLowerCase())));

  if (!open) return null;

  const cluster = clusters[ci] || null;
  const total = clusters.length;
  const keep = (id) => {
    if (!cluster) return;
    const toDelete = cluster.games.filter((g) => g.id !== id);
    toDelete.forEach((g) => onDelete(g.id));
    goNext();
  };
  const skipAll = () => onClose();
  const goNext = () => {
    if (ci + 1 >= clusters.length) onClose();
    else setCi(ci + 1);
  };

  return (
    <AnimatePresence>
      <motion.div ref={dragBoundsRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[220] grid place-items-center bg-black/65 backdrop-blur-[2px]"
        onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
        data-testid="tidy-overlay"
      >
        <motion.div
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={dragBoundsRef}
          initial={{ y: 12, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="relative w-[min(880px,96vw)] max-h-[92vh] overflow-hidden rounded-xl hairline glass shadow-2xl flex flex-col"
          data-testid="tidy-modal"
        >
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="cursor-move flex items-center justify-between px-5 py-3 border-b border-[rgb(var(--border))]/60"
          >
            <div className="flex items-center gap-2">
              <GripVertical size={14} className="text-muted" />
              <Sparkles size={14} className="text-[rgb(var(--accent))]" />
              <h3 className="font-display font-bold uppercase tracking-[0.18em] text-sm">Library artwork & metadata review</h3>
              {total > 0 && (
                <span className="rounded-full px-2 py-0.5 text-[10px] hairline text-[rgb(var(--accent-2))] bg-[rgb(var(--accent-2)/0.08)]">
                  {ci + 1} / {total}
                </span>
              )}
            </div>
            <button data-testid="tidy-close" onClick={onClose} className="grid h-7 w-7 place-items-center rounded text-muted hover:text-ink hover:bg-panel">
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {reviewGroups.length > 0 && (
              <section className="mb-5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.22)] p-3.5">
                <div className="mb-3 flex items-center gap-2"><AlertCircle size={14} className="text-[rgb(var(--accent-2))]" /><div><h4 className="text-xs font-black uppercase tracking-[0.16em]">Library health review</h4><p className="mt-0.5 text-[10.5px] text-muted">Choose a game to open it and fill in the missing piece. Nothing is changed automatically.</p></div></div>
                <div className="space-y-3">{reviewGroups.map((group) => <div key={group.key}><div className="mb-1.5 flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: group.color }}>{group.games.length} {group.label}</p>{(group.key === 'identity' || group.key === 'genre-enrichment') && <button onClick={() => onRepairMetadata?.(group.games)} className="rounded-md border border-[rgb(var(--accent)/0.4)] bg-[rgb(var(--accent)/0.08)] px-2 py-1 text-[9.5px] font-bold text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.16)]">{group.key === 'identity' ? 'Review all identities' : 'Enrich source tags'}</button>}</div>{group.key === 'genre-enrichment' && <p className="mb-1.5 text-[10px] leading-relaxed text-muted">These games have a broad label but no useful subgenre or playstyle yet. NEO-LIB will seek direct provider tags before asking you to accept a change.</p>}<div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">{group.games.slice(0, 60).map((game) => <button key={game.id} onClick={() => onSelect?.(game.id)} className="max-w-full truncate rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.35)] px-2 py-1 text-[10.5px] font-semibold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink" title={`Open ${game.name}`}>{game.name}</button>)}</div>{group.games.length > 60 && <p className="mt-1 text-[10px] text-muted">Showing the first 60; refine these from the library as you go.</p>}</div>)}</div>
              </section>
            )}
            <section className="mb-5 rounded-xl border border-[rgb(var(--accent)/0.32)] bg-[rgb(var(--panel)/0.3)] p-3.5" data-testid="library-repair-list">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div><h4 className="text-xs font-black uppercase tracking-[0.16em]">Game-by-game repair list</h4><p className="mt-0.5 text-[10.5px] text-muted">Check the executable, detected title, portrait cover and saved metadata. Nothing changes until you choose a result and apply it.</p></div>
                <div className="flex items-center gap-1 rounded-lg border border-[rgb(var(--border))] p-1 text-[10px]">
                  <button type="button" onClick={() => setShowAllGames(false)} aria-pressed={!showAllGames} className={`rounded px-2 py-1 font-bold ${!showAllGames ? 'bg-[rgb(var(--accent)/0.18)] text-ink' : 'text-muted'}`}>Needs review ({auditRows.filter((row) => row.needsReview).length})</button>
                  <button type="button" onClick={() => setShowAllGames(true)} aria-pressed={showAllGames} className={`rounded px-2 py-1 font-bold ${showAllGames ? 'bg-[rgb(var(--accent)/0.18)] text-ink' : 'text-muted'}`}>All games ({auditRows.length})</button>
                </div>
              </div>
              <label className="mb-3 flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.35)] px-3"><Search size={14} className="shrink-0 text-muted" /><input value={gameQuery} onChange={(event) => setGameQuery(event.target.value)} placeholder="Find by game name or .exe" className="h-9 min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-muted" aria-label="Filter games by name or executable" /></label>
              <div className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
                {filteredRows.map(({ game, cover, reasons, metadata, exeName }) => <article key={game.id} data-testid={`library-repair-row-${game.id}`} className="grid gap-3 rounded-lg border border-[rgb(var(--border)/0.8)] bg-[rgb(var(--surface)/0.28)] p-2.5 sm:grid-cols-[64px_minmax(0,1fr)_auto]">
                  {cover ? <img src={cover} alt={`${game.name} cover for visual review`} className="h-24 w-16 rounded-md bg-black/25 object-contain" /> : <div className="grid h-24 w-16 place-items-center rounded-md border border-dashed border-[rgb(var(--border))] text-center text-[9px] font-bold text-muted">NO<br />COVER</div>}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-ink" title={game.name}>{game.name || 'Unidentified game'}</div>
                    <div className="truncate font-mono text-[10px] text-muted" title={game.exePath || game.launchUrl || ''}>{exeName}</div>
                    <div className="mt-1 flex flex-wrap gap-1">{reasons.length ? reasons.map((reason) => <span key={reason} className="rounded-full border border-amber-300/25 bg-amber-300/[0.08] px-1.5 py-0.5 text-[9px] font-bold text-amber-100">{reason}</span>) : <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] px-1.5 py-0.5 text-[9px] font-bold text-emerald-100">Cover shape OK · visual check available</span>}</div>
                    <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[9px]">{metadata.map((item) => <span key={item.label} className={item.present ? 'text-emerald-200/90' : 'font-bold text-amber-200'}>{item.present ? '✓' : '○'} {item.label}</span>)}</div>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted">{game.about || game.shortDescription || game.description || 'No description saved'}{game.source ? ` · Source: ${game.source}` : ''}</p>
                  </div>
                  <div className="flex gap-1 sm:w-32 sm:flex-col sm:justify-center">
                    <button type="button" disabled={game.artworkLocks?.cover === true} onClick={() => onFixArtwork?.(game)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-[rgb(var(--accent)/0.17)] px-2 py-2 text-[10px] font-black text-ink hover:bg-[rgb(var(--accent)/0.28)] disabled:opacity-40" title={game.artworkLocks?.cover ? 'This cover is protected in Edit game → Artwork' : 'Search recommended cover artwork'}><ImagePlus size={13} />Fix cover</button>
                    <button type="button" disabled={game.manualOverride === true} onClick={() => onRefreshMetadata?.(game)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-[rgb(var(--border))] px-2 py-2 text-[10px] font-bold text-ink hover:border-[rgb(var(--accent-2)/0.55)] disabled:opacity-40" title={game.manualOverride ? 'Manual metadata is protected' : 'Review fresh metadata for this game'}><RefreshCw size={12} />Refresh</button>
                  </div>
                </article>)}
                {!filteredRows.length && <p className="rounded-lg border border-dashed border-[rgb(var(--border))] p-6 text-center text-xs text-muted">{gameQuery ? 'No games match that search.' : showAllGames ? 'No games are in the library.' : 'No obvious artwork or metadata gaps were found. Choose All games to visually inspect every cover.'}</p>}
              </div>
              <p className="mt-2 text-[9.5px] leading-relaxed text-muted">Automatic checks catch missing, known-wide and reused cover images. An image can still be the wrong game or badly framed without detectable file clues, so use All games for a visual pass. Online cover results come from reviewed metadata sources and SteamGridDB when its key is configured; confirm the exact title before applying.</p>
            </section>
            {total === 0 && reviewGroups.length === 0 && (
              <div className="grid h-40 place-items-center text-center text-sm text-muted">
                <div>
                  <Check className="mx-auto mb-2 text-emerald-400" size={28} />
                  <div className="font-display text-base font-bold text-ink mb-1">Nothing to tidy</div>
                  <div>Your library has no duplicates or overlapping folder paths.</div>
                </div>
              </div>
            )}
            {cluster && (
              <>
                <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
                  <AlertCircle size={12} className="text-amber-400" />
                  {cluster.reasonLabel} — pick which one to keep. The others will be removed from your library (the underlying files are NOT deleted from disk).
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {cluster.games.map((g) => (
                    <div key={g.id} className="flex flex-col gap-2 rounded-lg hairline bg-surface/40 p-3" data-testid={`tidy-card-${g.id}`}>
                      {(g.headerImage || g.coverUrl || g.background) ? (
                        <img src={g.headerImage || g.coverUrl || g.background} alt="" className="h-28 w-full rounded object-cover hairline" />
                      ) : (
                        <div className="h-28 w-full rounded hairline bg-panel/60 grid place-items-center text-[11px] text-muted">no cover</div>
                      )}
                      <div className="font-display text-sm font-bold text-ink truncate" title={g.name}>{g.name}</div>
                      <div className="text-[10.5px] text-muted font-mono truncate" title={g.exePath}>{shorten(g.exePath)}</div>
                      <div className="flex items-center gap-1.5 text-[10.5px] text-muted">
                        {g.source && <span className="rounded-full hairline px-1.5">{g.source}</span>}
                        {g.playtime ? <span>{formatPlaytime(g.playtime)} played</span> : <span>never played</span>}
                        {g.manualOverride && <span className="text-[rgb(var(--accent-2))]">manual edits</span>}
                      </div>
                      <button
                        data-testid={`tidy-keep-${g.id}`}
                        onClick={() => keep(g.id)}
                        className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-[rgb(var(--accent))] px-3 h-8 text-xs font-bold text-[rgb(var(--surface))] hover:brightness-110"
                      >
                        <Check size={12} /> Keep this one
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[rgb(var(--border))]/60 bg-panel/70 px-5 py-3">
            <span className="text-[11px] text-muted">
              {total > 0 ? `Scanned ${(games || []).length} games — ${total} duplicate cluster${total === 1 ? '' : 's'}${reviewCount ? ` and ${reviewCount} health item${reviewCount === 1 ? '' : 's'}` : ''} to review.` : reviewCount ? `${reviewCount} library health item${reviewCount === 1 ? '' : 's'} to review.` : 'All clean.'}
            </span>
            <div className="flex items-center gap-2">
              {total > 0 && cluster && (
                <button
                  data-testid="tidy-skip"
                  onClick={goNext}
                  className="inline-flex items-center gap-1.5 rounded-md hairline px-3 h-8 text-xs text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)]"
                >
                  Skip <ArrowRight size={12} />
                </button>
              )}
              <button
                data-testid="tidy-done"
                onClick={skipAll}
                className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--accent-2))] px-4 h-8 text-xs font-bold text-[rgb(var(--surface))] hover:brightness-110"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ---- helpers ---- //
function normName(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}
function shorten(p) {
  if (!p) return '(no exe)';
  return p.replace(/\\/g, '/').split('/').slice(-4).join('/');
}
function commonAncestor(a, b) {
  if (!a || !b) return 0;
  const aa = a.replace(/\\/g, '/').toLowerCase().split('/');
  const bb = b.replace(/\\/g, '/').toLowerCase().split('/');
  let n = 0;
  const len = Math.min(aa.length, bb.length) - 1; // exclude filename
  for (let i = 0; i < len; i += 1) {
    if (aa[i] === bb[i]) n += 1;
    else break;
  }
  return n;
}

/**
 * Cluster games into duplicate groups.
 *
 * v1.2.8 — Rule 3 (paths sharing 3+ folder levels) was DROPPED because ALL
 * Steam games share `Steam\steamapps\common\` (3 ancestors) and got wrongly
 * lumped into a single mega-cluster. When users picked "keep", the other 40+
 * Steam games got deleted. Real duplicates almost always share a normalized
 * name (Rule 2) OR the exact same exePath (Rule 1) — those two rules cover
 * 99% of the cases without any false positives.
 *
 * Extra safety: any cluster larger than 6 games is discarded (real dupes are
 * almost always pairs; anything larger is a bug in the heuristics).
 */
function findDuplicates(games) {
  const clusters = [];
  const visited = new Set();
  for (let i = 0; i < games.length; i += 1) {
    if (visited.has(games[i].id)) continue;
    const group = [games[i]];
    let reason = '';
    for (let j = i + 1; j < games.length; j += 1) {
      if (visited.has(games[j].id)) continue;
      const a = games[i]; const b = games[j];
      // Rule 1 — identical exePath (very rare, but real)
      if (a.exePath && b.exePath && a.exePath.toLowerCase() === b.exePath.toLowerCase()) {
        group.push(b); reason = 'Same .exe path';
      } else if (normName(a.name) === normName(b.name) && normName(a.name)) {
        // Rule 2 — same normalized name
        group.push(b); reason = reason || 'Same game name';
      }
      // Rule 3 removed — was catastrophically over-eager for Steam libraries.
    }
    if (group.length > 1 && group.length <= 6) {
      group.forEach((g) => visited.add(g.id));
      clusters.push({ games: group, reasonLabel: reason });
    }
  }
  return clusters;
}

function findReviewGroups(games) {
  const hasDetails = (game) => [game.description, game.about, game.shortDescription].some((value) => String(value || '').trim());
  const groups = [
    { key: 'identity', label: 'missing game identity', color: '#34d399', games: games.filter((game) => !(game.genreProfile?.core?.length || game.genreProfile?.subgenres?.length || game.genres?.length)) },
    { key: 'genre-enrichment', label: 'broad-only identities', color: '#fbbf24', games: games.filter((game) => (game.genreProfile?.core?.length || game.genreProfile?.subgenres?.length || game.genres?.length) && genreProfileNeedsEnrichment(game.genreProfile)) },
    { key: 'details', label: 'missing details', color: '#c084fc', games: games.filter((game) => !hasDetails(game)) },
    { key: 'art', label: 'cover art needing review', color: '#60a5fa', games: libraryArtworkAudit(games).filter((row) => row.reasons.length).map((row) => row.game) },
    { key: 'launch', label: 'missing launch target', color: '#fb7185', games: games.filter((game) => !(game.exePath || game.launchUrl)) },
  ];
  return groups.filter((group) => group.games.length > 0);
}
