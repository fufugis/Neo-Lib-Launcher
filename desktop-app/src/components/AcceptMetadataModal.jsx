import React from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Check, X, GripVertical, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

const isElectron = typeof window !== 'undefined' && !!window.api;

/**
 * AcceptMetadataModal — preview proposed metadata BEFORE it overwrites the
 * game's existing fields. Side-by-side view: current → proposed.
 *
 * Buttons:
 *   - Accept      → apply patch, close
 *   - Try again…  → opens a name prompt + re-runs the fetcher
 *   - Cancel      → close without changes
 *
 * Props:
 *   open                 — boolean
 *   game                 — the existing game object
 *   proposed             — the result from fetchMetadata (null = nothing found)
 *   onAccept(patch)      — fires when user clicks Accept
 *   onTryAgain(newName)  — fires when user types a different name + clicks "Try again"
 *   onClose()            — fires on cancel/backdrop click
 *   busy                 — boolean, dims the modal during retries
 */
export default function AcceptMetadataModal({ open, game, proposed, onAccept, onTryAgain, onClose, busy }) {
  const [rename, setRename] = React.useState('');
  const dragControls = useDragControls();
  React.useEffect(() => {
    if (open) setRename(game?.name || '');
  }, [open, game?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !game) return null;
  const p = proposed || {};
  const nothingFound = !proposed;

  const accept = () => {
    if (!proposed) return;
    onAccept({
      // Map the fetcher result to a partial game update
      name: p.name || game.name,
      shortDescription: p.shortDescription || '',
      about: p.about || p.shortDescription || '',
      headerImage: p.headerImage || game.headerImage,
      capsuleImage: p.capsuleImage || p.headerImage || game.coverUrl,
      coverUrl: p.capsuleImage || p.headerImage || game.coverUrl,
      background: p.background || p.headerImage || game.background,
      screenshots: p.screenshots || [],
      genres: p.genres || [],
      developers: p.developers || [],
      publishers: p.publishers || [],
      releaseDate: p.releaseDate || '',
      website: p.website || '',
      metacritic: p.metacritic ?? game.metacritic ?? null,
      source: p.source || 'web',
      manualOverride: false,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[220] grid place-items-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        data-testid="accept-meta-overlay"
      >
        <motion.div
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0}
          initial={{ y: 12, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'relative w-[min(880px,94vw)] max-h-[90vh] overflow-y-auto rounded-xl hairline glass shadow-2xl',
            busy && 'pointer-events-none opacity-70'
          )}
          data-testid="accept-meta-modal"
        >
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="cursor-move flex items-center justify-between px-5 py-3 border-b border-[rgb(var(--border))]/60 select-none"
          >
            <div className="flex items-center gap-2">
              <GripVertical size={14} className="text-muted" />
              <h3 className="font-display font-bold tracking-[0.18em] text-sm uppercase">
                Review metadata · {game.name}
              </h3>
              {p.source && (
                <span className="rounded-full px-2 py-0.5 text-[10px] hairline text-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.08)]">
                  via {p.source}
                </span>
              )}
            </div>
            <button
              data-testid="accept-meta-close"
              onClick={onClose}
              className="grid h-7 w-7 place-items-center rounded text-muted hover:text-ink hover:bg-panel"
            >
              <X size={14} />
            </button>
          </div>

          {nothingFound ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full hairline bg-panel/60 text-muted">
                <RefreshCw size={20} />
              </div>
              <h4 className="mb-1.5 text-sm font-semibold text-ink">No match found online.</h4>
              <p className="mx-auto max-w-md text-[12px] text-muted leading-relaxed">
                NEO-LIB couldn&apos;t find a confident metadata match for <span className="text-ink">{game.name}</span>.
                Try a different name (often the title alone, without version/build/demo tags).
              </p>
            </div>
          ) : (
            <div className="grid gap-3 p-5 md:grid-cols-2">
              {/* Image preview — show proposed hero/cover */}
              {(p.headerImage || p.capsuleImage || p.background) && (
                <div className="md:col-span-2 relative overflow-hidden rounded-md hairline">
                  <img
                    src={p.headerImage || p.background || p.capsuleImage}
                    alt=""
                    className="aspect-[16/5] w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgb(var(--surface))]/85 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <div className="text-[9px] uppercase tracking-wider text-[rgb(var(--accent-2))]">Proposed hero</div>
                    <div className="font-display text-base font-bold text-ink">{p.name}</div>
                  </div>
                </div>
              )}

              <DiffField label="Name" current={game.name} proposed={p.name} />
              <DiffField label="Release" current={game.releaseDate || '—'} proposed={p.releaseDate || '—'} />
              <DiffField
                label="Developer"
                current={(game.developers || []).join(', ') || '—'}
                proposed={(p.developers || []).join(', ') || '—'}
              />
              <DiffField
                label="Publisher"
                current={(game.publishers || []).join(', ') || '—'}
                proposed={(p.publishers || []).join(', ') || '—'}
              />
              <DiffField
                label="Genres"
                current={(game.genres || []).join(', ') || '—'}
                proposed={(p.genres || []).join(', ') || '—'}
                full
              />
              <DiffField
                label="Description"
                current={game.shortDescription || game.about || '—'}
                proposed={p.shortDescription || p.about || '—'}
                full
                tall
              />
              {p.screenshots?.length > 0 && (
                <div className="md:col-span-2">
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">
                    Proposed screenshots ({p.screenshots.length})
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {p.screenshots.slice(0, 8).map((s, i) => (
                      <img
                        key={i}
                        src={s}
                        alt=""
                        className="h-16 w-28 shrink-0 rounded-md object-cover hairline"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* "Try a different name" pill */}
          <div className="px-5 pb-4">
            <div className="rounded-md hairline bg-panel/40 px-3 py-2">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">
                {nothingFound ? 'Search with a different name' : 'Wrong game? Re-search with a different name'}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  data-testid="accept-meta-rename-input"
                  value={rename}
                  onChange={(e) => setRename(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && rename.trim()) onTryAgain(rename.trim()); }}
                  placeholder={game.name}
                  className="flex-1 rounded-md bg-surface/40 hairline px-3 h-8 text-xs text-ink placeholder:text-muted/70 focus:outline-none focus:border-[rgb(var(--accent)/0.6)]"
                />
                <button
                  data-testid="accept-meta-tryagain"
                  onClick={() => rename.trim() && onTryAgain(rename.trim())}
                  className="inline-flex items-center gap-1.5 rounded-md hairline px-3 h-8 text-xs text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.6)] hover:bg-[rgb(var(--accent)/0.08)]"
                >
                  <RefreshCw size={11} />
                  Try again
                </button>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-[rgb(var(--border))]/60 bg-panel/80 backdrop-blur px-5 py-3">
            <div className="text-[11px] text-muted">
              {nothingFound
                ? 'Skip the network and use Edit Metadata to fill fields manually.'
                : 'Accepting overwrites current fields. Manual overrides are not preserved here.'}
            </div>
            <div className="flex items-center gap-2">
              {p.website && (
                <button
                  data-testid="accept-meta-source"
                  onClick={() => {
                    if (isElectron && window.api?.openExternal) window.api.openExternal(p.website);
                    else window.open(p.website, '_blank');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md hairline px-2.5 h-8 text-[11px] text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)]"
                  title="Open the source page"
                >
                  <ExternalLink size={11} /> Source
                </button>
              )}
              <button
                data-testid="accept-meta-cancel"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-md hairline px-3 h-8 text-xs text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)]"
              >
                Cancel
              </button>
              <button
                data-testid="accept-meta-accept"
                disabled={nothingFound}
                onClick={accept}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-4 h-8 text-xs font-bold shadow-[0_0_14px_-2px_rgb(var(--accent)/0.7)]',
                  nothingFound
                    ? 'bg-panel/60 text-muted/50 cursor-not-allowed'
                    : 'bg-[rgb(var(--accent))] text-[rgb(var(--surface))] hover:brightness-110'
                )}
              >
                <Check size={13} /> Accept
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DiffField({ label, current, proposed, full, tall }) {
  const same = current === proposed;
  return (
    <div className={cn('rounded-md hairline bg-surface/30 p-2.5', full && 'md:col-span-2')}>
      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="grid gap-1 sm:grid-cols-2">
        <div className={cn('rounded bg-panel/40 px-2 py-1 text-[11.5px]', tall ? 'min-h-[3rem]' : '')}>
          <div className="mb-0.5 text-[9px] uppercase tracking-wider text-muted/60">Current</div>
          <div className="text-muted whitespace-pre-wrap break-words">{current || '—'}</div>
        </div>
        <div
          className={cn(
            'rounded px-2 py-1 text-[11.5px]',
            tall ? 'min-h-[3rem]' : '',
            same
              ? 'bg-panel/40'
              : 'bg-[rgb(var(--accent)/0.10)] ring-1 ring-[rgb(var(--accent)/0.45)]'
          )}
        >
          <div className="mb-0.5 text-[9px] uppercase tracking-wider text-[rgb(var(--accent-2))]">
            Proposed{same ? ' · same' : ''}
          </div>
          <div className="text-ink whitespace-pre-wrap break-words">{proposed || '—'}</div>
        </div>
      </div>
    </div>
  );
}
