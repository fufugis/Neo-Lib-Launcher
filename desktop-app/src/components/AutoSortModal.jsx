import React from 'react';
import Modal from './Modal';
import { Wand2, Check } from 'lucide-react';

/**
 * AutoSortModal — one-click smart sort.
 * Recommends a small set of genre collections based on the library's verified
 * identity profiles. Games are added — never removed from existing categories.
 * Existing custom categories are kept intact.
 *
 * For games without genre data, NEO-LIB will refetch metadata online in the
 * background to determine the best fit.
 */

// Intentional, limited collection candidates. These are not a replacement for
// a game's full profile or for personal categories; Auto-sort recommends at
// most six based on what is truly present in this particular library.
const COLLECTION_DEFINITIONS = [
  { id: 'roguelikes', name: 'Roguelikes', colorId: 'violet', core: ['roguelike'] },
  { id: 'survival-horror', name: 'Survival & Horror', colorId: 'crimson', core: ['survival', 'horror'] },
  { id: 'rpgs', name: 'RPGs', colorId: 'amber', core: ['rpg'] },
  { id: 'shooters', name: 'Shooters', colorId: 'cyan', core: ['shooter'] },
  { id: 'strategy', name: 'Strategy', colorId: 'cyan', core: ['strategy'] },
  { id: 'builders', name: 'Builders & Management', colorId: 'mint', core: ['management-building', 'simulation'] },
  { id: 'racing-sports', name: 'Racing & Sports', colorId: 'orange', core: ['racing', 'sports'] },
  { id: 'story', name: 'Story & Visual Novels', colorId: 'magenta', core: ['visual-novel', 'adventure'] },
  { id: 'puzzle-card', name: 'Puzzle & Card Games', colorId: 'slate', core: ['puzzle', 'card-board', 'rhythm-music'] },
];

function profileCoreIds(game) { return new Set((game.genreProfile?.core || []).map((entry) => entry.id)); }
function matchesCollection(game, collection) { const core = profileCoreIds(game); return collection.core.some((id) => core.has(id)); }
function recommendCollections(games) {
  return COLLECTION_DEFINITIONS
    .map((collection) => ({ ...collection, count: games.filter((game) => matchesCollection(game, collection)).length }))
    .filter((collection) => collection.count >= 2)
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 6);
}

export default function AutoSortModal({ open, onClose, games, categories, onApply, onRefetchMissing }) {
  const [phase, setPhase] = React.useState('preview'); // preview | refetching | applying | done
  const [refetched, setRefetched] = React.useState(0);

  const recommendations = React.useMemo(() => recommendCollections(games), [games]);
  // Compute preview assignments from exact canonical metadata — never text.
  const assignments = React.useMemo(() => {
    const out = [];
    for (const g of games) {
      const cats = recommendations.filter((collection) => matchesCollection(g, collection)).map((collection) => collection.name);
      out.push({ id: g.id, name: g.name, genres: g.genres || [], cats, hasData: !!g.genreProfile?.core?.length });
    }
    return out;
  }, [games, recommendations, phase]);

  const counts = React.useMemo(() => {
    const c = {};
    recommendations.forEach((d) => (c[d.name] = 0));
    assignments.forEach((a) => a.cats.forEach((n) => (c[n] = (c[n] || 0) + 1)));
    return c;
  }, [assignments, recommendations]);

  const noGenreCount = assignments.filter((a) => !a.hasData).length;

  const refetchMissing = async () => {
    setPhase('refetching');
    const targets = games.filter((g) => !(g.genres && g.genres.length));
    let n = 0;
    for (const g of targets) {
      try { await onRefetchMissing?.(g); } catch { /* skip games that fail */ }
      n += 1;
      setRefetched(n);
    }
    setPhase('preview');
  };

  const apply = () => {
    setPhase('applying');
    onApply(recommendations, assignments);
    setPhase('done');
    setTimeout(() => onClose(), 900);
  };

  if (!open) return null;

  return (
    <Modal open onClose={onClose} title="Smart Auto-Sort" testid="autosort-modal" wide>
      <div className="p-5 space-y-5">
        <div className="rounded-lg hairline bg-surface/40 p-4">
          <div className="mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[rgb(var(--accent-2))]">
            <Wand2 size={11} /> What this does
          </div>
          <p className="text-[12.5px] text-muted leading-relaxed">
            Recommends up to six meaningful genre collections from verified game identities—only when at least two games fit.
            Your existing categories are untouched; it copies matching games into collections and never removes your choices.
          </p>
        </div>

        {/* Preview counts */}
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted">Recommended collections</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {recommendations.map((c) => (
              <div key={c.name} className="rounded-md hairline bg-panel/40 px-3 py-2">
                <div className="text-[11px] font-semibold text-ink">{c.name}</div>
                <div className="text-[10.5px] text-muted">{counts[c.name] || 0} games</div>
              </div>
            ))}
          </div>
          {!recommendations.length && <p className="mt-2 text-[11px] leading-relaxed text-muted">No collection is suggested yet. NEO-LIB needs at least two games with a verified matching identity before it creates a genre collection.</p>}
        </div>

        {/* Missing-data warning + fix button */}
        {noGenreCount > 0 && (
          <div className="rounded-lg hairline border-amber-400/40 bg-amber-500/10 p-3">
            <div className="text-[12px] font-semibold text-amber-300 mb-1">
              {noGenreCount} game{noGenreCount === 1 ? '' : 's'} have no genre data yet
            </div>
            <p className="text-[11px] text-amber-200/80 mb-2">
              Sorting only uses verified identity profiles. Press the button below to refresh missing source metadata, then re-run this preview.
            </p>
            <button
              data-testid="autosort-refetch"
              disabled={phase === 'refetching'}
              onClick={refetchMissing}
              className="rounded-md bg-amber-500/90 px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-amber-400 disabled:opacity-60"
            >
              {phase === 'refetching' ? `Fetching ${refetched}/${noGenreCount}…` : `Fetch genres for ${noGenreCount} games`}
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            data-testid="autosort-cancel"
            onClick={onClose}
            className="rounded-md hairline px-3 py-1.5 text-xs text-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            data-testid="autosort-apply"
            disabled={phase === 'refetching' || phase === 'applying' || recommendations.length === 0}
            onClick={apply}
            className="flex items-center gap-1.5 rounded-md bg-[rgb(var(--accent))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--surface))] disabled:opacity-60"
          >
            {phase === 'done' ? <><Check size={12} /> Done</> : 'Apply recommended collections'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
