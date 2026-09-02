import React from 'react';
import Modal from './Modal';
import { Wand2, Check } from 'lucide-react';
import { genreProfileNeedsEnrichment } from '../lib/genreTaxonomy';

/**
 * AutoSortModal — one-click smart sort.
 * Builds a reviewable, deliberately conservative plan from verified identity
 * profiles. Nothing is created until the player keeps the recommendation and
 * accepts its visible assignments. Existing custom categories are untouched.
 *
 * For games with no genre data or only a broad identity, NEO-LIB can refetch
 * source tags online to determine a more useful fit.
 */

// Intentional, limited collection candidates. These are not a replacement for
// a game's full profile or personal categories; three games are required
// before a new shelf is proposed, and only the strongest four are preselected.
const COLLECTION_DEFINITIONS = [
  { id: 'roguelikes', name: 'Roguelikes', colorId: 'violet', core: ['roguelike'] },
  { id: 'survival-horror', name: 'Survival & Horror', colorId: 'crimson', core: ['survival', 'horror'] },
  { id: 'rpgs', name: 'RPGs', colorId: 'amber', core: ['rpg'] },
  { id: 'shooters', name: 'Shooters', colorId: 'cyan', core: ['shooter'] },
  { id: 'strategy', name: 'Strategy', colorId: 'cyan', core: ['strategy'] },
  { id: 'builders', name: 'Builders & Management', colorId: 'mint', core: ['management-building'] },
  { id: 'racing-sports', name: 'Racing & Sports', colorId: 'orange', core: ['racing', 'sports'] },
  { id: 'story', name: 'Story & Visual Novels', colorId: 'magenta', core: ['visual-novel'] },
  { id: 'puzzle-card', name: 'Puzzle & Card Games', colorId: 'slate', core: ['puzzle', 'card-board', 'rhythm-music'] },
];

function profileCoreIds(game) { return new Set((game.genreProfile?.core || []).map((entry) => entry.id)); }
function matchesCollection(game, collection) { const core = profileCoreIds(game); return collection.core.some((id) => core.has(id)); }
function recommendCollections(games) {
  return COLLECTION_DEFINITIONS
    .map((collection) => ({ ...collection, count: games.filter((game) => matchesCollection(game, collection)).length }))
    .filter((collection) => collection.count >= 3)
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 4);
}

export default function AutoSortModal({ open, onClose, games, categories, onApply, onUndo, hasUndo = false, onRefetchMissing }) {
  const [phase, setPhase] = React.useState('preview'); // preview | refetching | applying | done
  const [refetched, setRefetched] = React.useState(0);

  const recommendations = React.useMemo(() => recommendCollections(games), [games]);
  const [selectedIds, setSelectedIds] = React.useState(() => new Set());
  const [excludedAssignments, setExcludedAssignments] = React.useState(() => new Set());
  const [shelfDestination, setShelfDestination] = React.useState({});
  React.useEffect(() => {
    if (!open) return;
    setPhase('preview');
    setRefetched(0);
    setSelectedIds(new Set(recommendations.map((item) => item.id)));
    setExcludedAssignments(new Set());
    setShelfDestination(Object.fromEntries(recommendations.map((item) => [
      item.id,
      categories.some((category) => category.name.toLowerCase() === item.name.toLowerCase()) ? 'existing' : 'new',
    ])));
  }, [open, recommendations, categories]);
  const selectedRecommendations = React.useMemo(
    () => recommendations.filter((collection) => selectedIds.has(collection.id)),
    [recommendations, selectedIds]
  );
  const reviewedCollections = React.useMemo(() => selectedRecommendations.map((collection) => {
    const existing = categories.find((category) => category.name.toLowerCase() === collection.name.toLowerCase());
    const destination = shelfDestination[collection.id] || (existing ? 'existing' : 'new');
    return {
      ...collection,
      destination,
      targetName: destination === 'new' && existing ? `Auto · ${collection.name}` : collection.name,
    };
  }), [selectedRecommendations, categories, shelfDestination]);
  // Compute preview assignments from exact canonical metadata — never text.
  const assignments = React.useMemo(() => {
    const out = [];
    for (const g of games) {
      // A game can appear in at most two reviewed genre shelves. Its exact
      // source profile remains the detailed truth in Preview.
      const matches = reviewedCollections
        .filter((collection) => matchesCollection(g, collection))
        .filter((collection) => !excludedAssignments.has(`${g.id}:${collection.id}`))
        .slice(0, 2);
      out.push({ id: g.id, name: g.name, genres: g.genres || [], cats: matches.map((collection) => collection.targetName), matchIds: matches.map((collection) => collection.id), hasData: !!g.genreProfile?.core?.length });
    }
    return out;
  }, [games, reviewedCollections, excludedAssignments, phase]);

  const counts = React.useMemo(() => {
    const c = {};
    selectedRecommendations.forEach((d) => (c[d.id] = 0));
    assignments.forEach((assignment) => assignment.matchIds.forEach((id) => (c[id] = (c[id] || 0) + 1)));
    return c;
  }, [assignments, selectedRecommendations]);

  const enrichmentTargets = React.useMemo(() => games.filter(genreProfileNeedsEnrichment), [games]);
  const needsEnrichmentCount = enrichmentTargets.length;
  const [selectedEnrichmentIds, setSelectedEnrichmentIds] = React.useState(() => new Set());
  React.useEffect(() => {
    if (open) setSelectedEnrichmentIds(new Set(enrichmentTargets.map((game) => game.id)));
  }, [open, enrichmentTargets]);
  const selectedEnrichmentTargets = enrichmentTargets.filter((game) => selectedEnrichmentIds.has(game.id));

  const refetchMissing = async () => {
    setPhase('refetching');
    const targets = selectedEnrichmentTargets;
    if (!targets.length) return;
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
    onApply(reviewedCollections.map(({ targetName, ...collection }) => ({ ...collection, name: targetName })), assignments);
    setPhase('done');
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
            This is a reviewable plan, not a blind bulk action. NEO-LIB proposes at most four precise collections and only when at least three games have direct matching identity evidence.
            Untick anything you do not want. Existing categories and manual ordering remain untouched; matching games are added only after you apply this plan.
          </p>
        </div>

        {/* Preview counts */}
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted">Recommended collections</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {recommendations.map((c) => {
              const existing = categories.find((category) => category.name.toLowerCase() === c.name.toLowerCase());
              const selected = selectedIds.has(c.id);
              const destination = shelfDestination[c.id] || (existing ? 'existing' : 'new');
              return <div key={c.name} className={`rounded-md hairline px-3 py-2 transition-colors ${selected ? 'border-[rgb(var(--accent)/0.55)] bg-[rgb(var(--accent)/0.08)]' : 'bg-panel/40 opacity-70'}`}>
                <label className="flex cursor-pointer items-start gap-2">
                  <input type="checkbox" checked={selected} onChange={() => setSelectedIds((current) => { const next = new Set(current); if (next.has(c.id)) next.delete(c.id); else next.add(c.id); return next; })} className="mt-0.5 accent-[rgb(var(--accent))]" />
                  <span className="min-w-0"><span className="block text-[11px] font-semibold text-ink">{c.name}</span><span className="block text-[10.5px] text-muted">{Number.isFinite(counts[c.id]) ? counts[c.id] : c.count} verified matches · direct genre-profile evidence</span></span>
                </label>
                {selected && existing && <div className="mt-2 flex flex-wrap gap-1 pl-5" role="group" aria-label={`${c.name} destination`}>
                  <button type="button" onClick={() => setShelfDestination((current) => ({ ...current, [c.id]: 'existing' }))} className={`rounded border px-1.5 py-1 text-[9px] font-semibold ${destination === 'existing' ? 'border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--accent)/0.14)] text-ink' : 'border-[rgb(var(--border)/0.7)] text-muted hover:text-ink'}`}>Use existing</button>
                  <button type="button" onClick={() => setShelfDestination((current) => ({ ...current, [c.id]: 'new' }))} className={`rounded border px-1.5 py-1 text-[9px] font-semibold ${destination === 'new' ? 'border-[rgb(var(--accent-2)/0.65)] bg-[rgb(var(--accent-2)/0.12)] text-ink' : 'border-[rgb(var(--border)/0.7)] text-muted hover:text-ink'}`}>Create “Auto · {c.name}”</button>
                </div>}
                {selected && <p className="mt-1.5 pl-5 text-[9px] text-muted/80">{destination === 'existing' && existing ? `Destination: existing ${existing.name}` : `Destination: new ${existing ? `Auto · ${c.name}` : c.name} shelf`}</p>}
              </div>;
            })}
          </div>
          {!recommendations.length && <p className="mt-2 text-[11px] leading-relaxed text-muted">No category is suggested yet. NEO-LIB needs at least three games with a verified matching identity before it proposes a new genre shelf.</p>}
          {selectedRecommendations.length > 0 && <div className="mt-3 rounded-md border border-[rgb(var(--border)/0.65)] bg-[rgb(var(--surface)/0.18)] px-3 py-2"><p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted">Planned assignments</p><p className="mt-1 text-[10.5px] leading-relaxed text-muted">{assignments.filter((item) => item.cats.length).slice(0, 12).map((item) => `${item.name} → ${item.cats.join(' + ')}`).join(' · ')}{assignments.filter((item) => item.cats.length).length > 12 ? ` · +${assignments.filter((item) => item.cats.length).length - 12} more` : ''}</p></div>}
          {selectedRecommendations.length > 0 && <div className="mt-3 rounded-md border border-[rgb(var(--border)/0.65)] bg-[rgb(var(--surface)/0.18)] p-2.5"><div className="flex items-baseline justify-between gap-3"><p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted">Review every assignment</p><span className="text-[9px] text-muted">Click a tag to exclude it</span></div><div className="mt-2 max-h-36 space-y-1 overflow-y-auto pr-1">{assignments.filter((item) => item.cats.length).map((item) => <div key={item.id} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 hover:bg-[rgb(var(--panel)/0.34)]"><span className="min-w-0 truncate text-[10.5px] font-semibold text-ink" title={item.name}>{item.name}</span><span className="flex shrink-0 flex-wrap justify-end gap-1">{item.cats.map((name, index) => { const collectionId = item.matchIds[index]; return <button key={`${item.id}-${collectionId}`} onClick={() => setExcludedAssignments((current) => new Set(current).add(`${item.id}:${collectionId}`))} className="rounded border border-[rgb(var(--accent)/0.35)] bg-[rgb(var(--accent)/0.08)] px-1.5 py-0.5 text-[9px] font-semibold text-[rgb(var(--accent-2))] hover:border-red-400/60 hover:bg-red-400/10 hover:text-red-200" title={`Exclude ${item.name} from ${name}`}>{name} ×</button>; })}</span></div>)}</div></div>}
        </div>

        {/* Missing-data warning + fix button */}
        {needsEnrichmentCount > 0 && (
          <div className="rounded-lg hairline border-amber-400/40 bg-amber-500/10 p-3">
            <div className="text-[12px] font-semibold text-amber-300 mb-1">
              {needsEnrichmentCount} game{needsEnrichmentCount === 1 ? '' : 's'} need richer genre evidence
            </div>
            <p className="text-[11px] text-amber-200/80 mb-2">
              Broad labels such as Action are not enough for precise sorting. Select only the games you want NEO-LIB to enrich from their trusted source tags; it rebuilds identity evidence without changing your Library categories.
            </p>
            <div className="mb-2 max-h-24 space-y-1 overflow-y-auto rounded-md border border-amber-300/20 bg-black/10 p-1.5">
              {enrichmentTargets.map((game) => <label key={game.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[10.5px] text-amber-100 hover:bg-amber-300/10"><input type="checkbox" checked={selectedEnrichmentIds.has(game.id)} onChange={() => setSelectedEnrichmentIds((current) => { const next = new Set(current); if (next.has(game.id)) next.delete(game.id); else next.add(game.id); return next; })} className="accent-amber-300" /><span className="min-w-0 truncate">{game.name}</span></label>)}
            </div>
            <button
              data-testid="autosort-refetch"
              disabled={phase === 'refetching' || selectedEnrichmentTargets.length === 0}
              onClick={refetchMissing}
              className="rounded-md bg-amber-500/90 px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-amber-400 disabled:opacity-60"
            >
              {phase === 'refetching' ? `Enriching ${refetched}/${selectedEnrichmentTargets.length}…` : `Enrich genres for ${selectedEnrichmentTargets.length} selected`}
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          {hasUndo && <button data-testid="autosort-undo" disabled={phase === 'refetching' || phase === 'applying'} onClick={() => onUndo?.()} className="rounded-md hairline px-3 py-1.5 text-xs font-semibold text-muted hover:border-[rgb(var(--accent-2)/0.55)] hover:text-ink">Undo last Auto-sort</button>}
          <button
            data-testid="autosort-cancel"
            onClick={onClose}
            className="rounded-md hairline px-3 py-1.5 text-xs text-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            data-testid="autosort-apply"
            disabled={phase === 'refetching' || phase === 'applying' || selectedRecommendations.length === 0}
            onClick={apply}
            className="flex items-center gap-1.5 rounded-md bg-[rgb(var(--accent))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--surface))] disabled:opacity-60"
          >
            {phase === 'done' ? <><Check size={12} /> Done</> : `Apply ${selectedRecommendations.length} reviewed collection${selectedRecommendations.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
