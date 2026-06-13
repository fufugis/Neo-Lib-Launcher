import React from 'react';
import Modal from './Modal';
import { Wand2, Check } from 'lucide-react';

/**
 * AutoSortModal — one-click smart sort.
 * Creates (if missing) 6 default categories and assigns each game to one or more
 * of them based on its detected genres. Games are added — never removed from
 * existing categories. Existing custom categories are kept intact.
 *
 * For games without genre data, NEO-LIB will refetch metadata online in the
 * background to determine the best fit.
 */

// 6 default categories with their colors and matching genre keywords
const DEFAULT_CATEGORIES = [
  { name: 'Action',    colorId: 'red',    keywords: ['action', 'fighting', 'beat \'em up', 'hack and slash', 'brawler'] },
  { name: 'RPG',       colorId: 'amber',  keywords: ['rpg', 'role-playing', 'roleplaying', 'role playing', 'jrpg', 'crpg', 'mmorpg'] },
  { name: 'Shooter',   colorId: 'rose',   keywords: ['shooter', 'fps', 'tps', 'first-person', 'third-person shooter', 'battle royale', 'tactical'] },
  { name: 'Strategy',  colorId: 'cyan',   keywords: ['strategy', 'rts', 'turn-based', '4x', 'tactics', 'moba', 'tower defense'] },
  { name: 'Adventure', colorId: 'emerald',keywords: ['adventure', 'open world', 'exploration', 'platformer', 'metroidvania', 'point and click'] },
  { name: 'Indie',     colorId: 'purple', keywords: ['indie', 'roguelike', 'roguelite', 'puzzle', 'simulation', 'sandbox', 'survival', 'casual'] },
];

function classifyGame(game) {
  const haystack = (game.genres || []).join(' ').toLowerCase() + ' ' +
                   (game.shortDescription || '').toLowerCase() + ' ' +
                   (game.about || '').toLowerCase();
  if (!haystack.trim()) return [];
  const matches = [];
  for (const cat of DEFAULT_CATEGORIES) {
    if (cat.keywords.some((kw) => haystack.includes(kw))) matches.push(cat.name);
  }
  // Fallback: if nothing matched but we have genres, put it in Indie (catch-all)
  if (matches.length === 0 && (game.genres || []).length > 0) matches.push('Indie');
  return matches;
}

export default function AutoSortModal({ open, onClose, games, categories, onApply, onRefetchMissing }) {
  const [phase, setPhase] = React.useState('preview'); // preview | refetching | applying | done
  const [refetched, setRefetched] = React.useState(0);

  // Compute preview assignments
  const assignments = React.useMemo(() => {
    const out = [];
    for (const g of games) {
      const cats = classifyGame(g);
      out.push({ id: g.id, name: g.name, genres: g.genres || [], cats, hasData: !!(g.genres && g.genres.length) });
    }
    return out;
  }, [games, phase]);

  const counts = React.useMemo(() => {
    const c = {};
    DEFAULT_CATEGORIES.forEach((d) => (c[d.name] = 0));
    assignments.forEach((a) => a.cats.forEach((n) => (c[n] = (c[n] || 0) + 1)));
    return c;
  }, [assignments]);

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
    onApply(DEFAULT_CATEGORIES, assignments);
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
            Creates 6 default categories (if missing) and <strong className="text-ink">copies</strong> each game into the matching ones based on its detected genres.
            Your existing categories are untouched — games are added to the new categories, never removed from yours.
          </p>
        </div>

        {/* Preview counts */}
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted">Preview</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DEFAULT_CATEGORIES.map((c) => (
              <div key={c.name} className="rounded-md hairline bg-panel/40 px-3 py-2">
                <div className="text-[11px] font-semibold text-ink">{c.name}</div>
                <div className="text-[10.5px] text-muted">{counts[c.name] || 0} games</div>
              </div>
            ))}
          </div>
        </div>

        {/* Missing-data warning + fix button */}
        {noGenreCount > 0 && (
          <div className="rounded-lg hairline border-amber-400/40 bg-amber-500/10 p-3">
            <div className="text-[12px] font-semibold text-amber-300 mb-1">
              {noGenreCount} game{noGenreCount === 1 ? '' : 's'} have no genre data yet
            </div>
            <p className="text-[11px] text-amber-200/80 mb-2">
              Sorting works best when every game has genres. Press the button below to fetch missing info online —
              then re-run sort.
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
            disabled={phase === 'refetching' || phase === 'applying'}
            onClick={apply}
            className="flex items-center gap-1.5 rounded-md bg-[rgb(var(--accent))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--surface))] disabled:opacity-60"
          >
            {phase === 'done' ? <><Check size={12} /> Done</> : 'Apply auto-sort'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
