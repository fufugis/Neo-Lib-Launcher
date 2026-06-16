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
  // Per-field selection — defaults to all changed fields ON. User can toggle off the ones they
  // want to keep from the existing game. Only checked fields are written on Accept.
  const [pick, setPick] = React.useState({
    name: true, image: true, description: true, genres: true,
    developer: true, publisher: true, release: true, screenshots: true,
  });
  const dragControls = useDragControls();
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open) {
      setRename(game?.name || '');
      setPick({
        name: true, image: true, description: true, genres: true,
        developer: true, publisher: true, release: true, screenshots: true,
      });
    }
  }, [open, game?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!open || !game) return null;
  const p = proposed || {};
  const nothingFound = !proposed;

  // Quick helpers — "Select all" / "Only changed" / "None"
  const setAllPick = (val) => setPick({
    name: val, image: val, description: val, genres: val,
    developer: val, publisher: val, release: val, screenshots: val,
  });
  const pickOnlyChanged = () => setPick({
    name: !!(p.name && p.name !== game.name),
    image: !!(p.headerImage || p.capsuleImage || p.background),
    description: !!((p.shortDescription || p.about) && (p.shortDescription || p.about) !== (game.shortDescription || game.about)),
    genres: !!(p.genres?.length),
    developer: !!(p.developers?.length),
    publisher: !!(p.publishers?.length),
    release: !!(p.releaseDate && p.releaseDate !== game.releaseDate),
    screenshots: !!(p.screenshots?.length),
  });

  const accept = () => {
    if (!proposed) return;
    // Build the patch from only the fields the user checked.
    const patch = { manualOverride: false, source: p.source || 'web' };
    if (pick.name)        patch.name = p.name || game.name;
    if (pick.description) {
      patch.shortDescription = p.shortDescription || '';
      patch.about = p.about || p.shortDescription || '';
    }
    if (pick.image) {
      patch.headerImage = p.headerImage || game.headerImage;
      patch.capsuleImage = p.capsuleImage || p.headerImage || game.coverUrl;
      patch.coverUrl = p.capsuleImage || p.headerImage || game.coverUrl;
      patch.background = p.background || p.headerImage || game.background;
    }
    if (pick.screenshots) patch.screenshots = p.screenshots || [];
    if (pick.genres)      patch.genres = p.genres || [];
    if (pick.developer)   patch.developers = p.developers || [];
    if (pick.publisher)   patch.publishers = p.publishers || [];
    if (pick.release)     patch.releaseDate = p.releaseDate || '';
    if (p.website) patch.website = p.website;
    if (p.metacritic != null) patch.metacritic = p.metacritic;
    onAccept(patch);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[220] grid place-items-center bg-black/60 backdrop-blur-sm"
        onDoubleClick={onClose}
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
              {/* Field-selector toolbar — pick which fields to apply on Accept */}
              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2 rounded-md hairline bg-panel/40 px-3 py-2">
                <div className="text-[10.5px] uppercase tracking-wider text-muted">
                  Pick which fields to apply
                </div>
                <div className="flex items-center gap-1">
                  <button
                    data-testid="accept-meta-pick-all"
                    onClick={() => setAllPick(true)}
                    className="rounded-md hairline px-2 py-0.5 text-[10px] text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)]"
                  >
                    All
                  </button>
                  <button
                    data-testid="accept-meta-pick-changed"
                    onClick={pickOnlyChanged}
                    className="rounded-md hairline px-2 py-0.5 text-[10px] text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)]"
                  >
                    Only changed
                  </button>
                  <button
                    data-testid="accept-meta-pick-none"
                    onClick={() => setAllPick(false)}
                    className="rounded-md hairline px-2 py-0.5 text-[10px] text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)]"
                  >
                    None
                  </button>
                </div>
              </div>

              {/* Image preview — show proposed hero/cover */}
              {(p.headerImage || p.capsuleImage || p.background) && (
                <div className="md:col-span-2 relative overflow-hidden rounded-md hairline">
                  <img
                    src={p.headerImage || p.background || p.capsuleImage}
                    alt=""
                    className={cn('aspect-[16/5] w-full object-cover transition-opacity', !pick.image && 'opacity-30 grayscale')}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgb(var(--surface))]/85 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-[rgb(var(--accent-2))]">Proposed hero</div>
                      <div className="font-display text-base font-bold text-ink">{p.name}</div>
                    </div>
                    <FieldCheck
                      label="Apply image"
                      checked={pick.image}
                      onToggle={(v) => setPick((s) => ({ ...s, image: v }))}
                      testid="accept-pick-image"
                    />
                  </div>
                </div>
              )}

              <DiffField label="Name" current={game.name} proposed={p.name}
                checked={pick.name} onToggle={(v) => setPick((s) => ({ ...s, name: v }))} testid="accept-pick-name" />
              <DiffField label="Release" current={game.releaseDate || '—'} proposed={p.releaseDate || '—'}
                checked={pick.release} onToggle={(v) => setPick((s) => ({ ...s, release: v }))} testid="accept-pick-release" />
              <DiffField
                label="Developer"
                current={(game.developers || []).join(', ') || '—'}
                proposed={(p.developers || []).join(', ') || '—'}
                checked={pick.developer} onToggle={(v) => setPick((s) => ({ ...s, developer: v }))} testid="accept-pick-developer"
              />
              <DiffField
                label="Publisher"
                current={(game.publishers || []).join(', ') || '—'}
                proposed={(p.publishers || []).join(', ') || '—'}
                checked={pick.publisher} onToggle={(v) => setPick((s) => ({ ...s, publisher: v }))} testid="accept-pick-publisher"
              />
              <DiffField
                label="Genres"
                current={(game.genres || []).join(', ') || '—'}
                proposed={(p.genres || []).join(', ') || '—'}
                full
                checked={pick.genres} onToggle={(v) => setPick((s) => ({ ...s, genres: v }))} testid="accept-pick-genres"
              />
              <DiffField
                label="Description"
                current={game.shortDescription || game.about || '—'}
                proposed={p.shortDescription || p.about || '—'}
                full
                tall
                checked={pick.description} onToggle={(v) => setPick((s) => ({ ...s, description: v }))} testid="accept-pick-description"
              />
              {p.screenshots?.length > 0 && (
                <div className="md:col-span-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted">
                      Proposed screenshots ({p.screenshots.length})
                    </div>
                    <FieldCheck
                      label="Apply screenshots"
                      checked={pick.screenshots}
                      onToggle={(v) => setPick((s) => ({ ...s, screenshots: v }))}
                      testid="accept-pick-screenshots"
                    />
                  </div>
                  <div className={cn('flex gap-1.5 overflow-x-auto pb-1 transition-opacity', !pick.screenshots && 'opacity-40 grayscale')}>
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
                : 'Only the fields you ticked above are written. Untouched fields stay as they are.'}
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

function DiffField({ label, current, proposed, full, tall, checked = true, onToggle, testid }) {
  const same = current === proposed;
  const muted = onToggle && !checked;
  return (
    <div className={cn('rounded-md hairline bg-surface/30 p-2.5 transition-opacity', full && 'md:col-span-2', muted && 'opacity-50')}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
        {onToggle && (
          <FieldCheck
            label="Apply"
            checked={checked}
            onToggle={onToggle}
            testid={testid}
            compact
          />
        )}
      </div>
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

function FieldCheck({ label, checked, onToggle, testid, compact }) {
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full hairline px-2 transition-colors select-none',
        compact ? 'h-5 text-[10px]' : 'h-6 text-[10.5px]',
        checked
          ? 'border-[rgb(var(--accent)/0.6)] bg-[rgb(var(--accent)/0.12)] text-ink'
          : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.4)]'
      )}
    >
      <input
        type="checkbox"
        data-testid={testid}
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        className="accent-[rgb(var(--accent))] cursor-pointer"
      />
      {label}
    </label>
  );
}
