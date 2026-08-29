import React from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Sparkles, Trash2, Check, X, GripVertical, ArrowRight, AlertCircle } from 'lucide-react';
import { formatPlaytime } from '../lib/utils';

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
export default function TidyUpModal({ open, games, onDelete, onSelect, onRepairMetadata, onClose }) {
  const dragControls = useDragControls();
  const [clusters, setClusters] = React.useState([]);
  const [ci, setCi] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClusters(findDuplicates(games || []));
    setCi(0);
  }, [open, games]);

  const reviewGroups = React.useMemo(() => findReviewGroups(games || []), [games]);
  const reviewCount = reviewGroups.reduce((sum, group) => sum + group.games.length, 0);

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
      <motion.div
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
              <h3 className="font-display font-bold uppercase tracking-[0.18em] text-sm">Tidy up · library review</h3>
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
                <div className="space-y-3">{reviewGroups.map((group) => <div key={group.key}><div className="mb-1.5 flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: group.color }}>{group.games.length} {group.label}</p>{group.key === 'identity' && <button onClick={() => onRepairMetadata?.(group.games)} className="rounded-md border border-[rgb(var(--accent)/0.4)] bg-[rgb(var(--accent)/0.08)] px-2 py-1 text-[9.5px] font-bold text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.16)]">Review all identities</button>}</div><div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">{group.games.slice(0, 60).map((game) => <button key={game.id} onClick={() => onSelect?.(game.id)} className="max-w-full truncate rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.35)] px-2 py-1 text-[10.5px] font-semibold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink" title={`Open ${game.name}`}>{game.name}</button>)}</div>{group.games.length > 60 && <p className="mt-1 text-[10px] text-muted">Showing the first 60; refine these from the library as you go.</p>}</div>)}</div>
              </section>
            )}
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
    { key: 'details', label: 'missing details', color: '#c084fc', games: games.filter((game) => !hasDetails(game)) },
    { key: 'art', label: 'missing cover art', color: '#60a5fa', games: games.filter((game) => !(game.coverUrl || game.headerImage || game.background)) },
    { key: 'launch', label: 'missing launch target', color: '#fb7185', games: games.filter((game) => !(game.exePath || game.launchUrl)) },
  ];
  return groups.filter((group) => group.games.length > 0);
}
