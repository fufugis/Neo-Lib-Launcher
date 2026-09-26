import React from 'react';
import { controllerFocusTargets, nextControllerFocus } from '../../input/controller-focus.mjs';
import { applyWallFilter } from '../library/wall-filter-model.mjs';
import LoungeDetails from './LoungeDetails';
import LoungeControlHints from './LoungeControlHints';
import LoungeCover from './LoungeCover';

// This is a browsing surface, not a game launcher. Launching from a pad needs
// the separate trusted-input contract before it can be added here.
export default function NeoLounge({ games, favoriteIds = [], updateLedger = {}, initialGameId = null, mascotId = 'fungist', mascotEnabled = true, onExit, onOpenPreview, controllerEnabled }) {
  const [selectedId, setSelectedId] = React.useState(initialGameId);
  const [view, setView] = React.useState('all');
  const [transitionError, setTransitionError] = React.useState('');
  const [transitionBusy, setTransitionBusy] = React.useState(false);
  const transitionLock = React.useRef(false);
  const focusAfterViewChange = React.useRef(false);
  const focusedGameId = React.useRef(null);
  const surfaceRef = React.useRef(null);
  const exitRef = React.useRef(null);
  const safeGames = Array.isArray(games) ? games : [];
  const shownGames = view === 'favorites' ? applyWallFilter(safeGames, 'favorites', favoriteIds)
    : view === 'recent' ? applyWallFilter(safeGames, 'recently-played') : safeGames;
  const selected = shownGames.find((game) => game.id === selectedId) || shownGames[0] || null;

  React.useEffect(() => {
    surfaceRef.current?.querySelector('[data-lounge-selected="true"], [data-lounge-game], [data-controller-close]')?.focus();
  }, []);
  React.useEffect(() => {
    if (selectedId && !shownGames.some((game) => game.id === selectedId)) setSelectedId(null);
  }, [shownGames, selectedId]);
  React.useEffect(() => {
    if (!focusAfterViewChange.current) return;
    focusAfterViewChange.current = false;
    surfaceRef.current?.querySelector('[data-lounge-selected="true"], [data-lounge-filter][aria-pressed="true"]')?.focus();
  }, [view]);
  React.useEffect(() => {
    if (focusedGameId.current == null || shownGames.some((game) => game.id === focusedGameId.current)) return;
    focusedGameId.current = null;
    if (document.hasFocus() && !surfaceRef.current?.contains(document.activeElement)) {
      surfaceRef.current?.querySelector('[data-lounge-selected="true"], [data-lounge-filter][aria-pressed="true"]')?.focus();
    }
  }, [shownGames]);
  React.useEffect(() => {
    if (transitionError && !transitionBusy) exitRef.current?.focus();
  }, [transitionError, transitionBusy]);

  const requestTransition = async (action) => {
    if (transitionLock.current) return;
    transitionLock.current = true;
    setTransitionBusy(true);
    setTransitionError('');
    try {
      if (await action() !== true) setTransitionError('Could not leave fullscreen. Please try Exit Lounge again.');
    } catch { setTransitionError('Could not leave fullscreen. Please try Exit Lounge again.'); }
    transitionLock.current = false;
    setTransitionBusy(false);
  };
  const requestExit = () => void requestTransition(onExit);
  const requestPreview = (id) => void requestTransition(() => onOpenPreview(id));
  const chooseView = (id) => {
    if (id === view) return;
    focusAfterViewChange.current = true;
    setView(id);
  };
  const previewOnHover = (id) => {
    if (surfaceRef.current?.querySelector('[data-lounge-game]:focus')) return;
    setSelectedId(id);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); requestExit(); return; }
    if (event.key === 'Tab') {
      const targets = controllerFocusTargets(surfaceRef.current);
      if (event.shiftKey && document.activeElement === targets[0]) { event.preventDefault(); targets.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === targets.at(-1)) { event.preventDefault(); targets[0]?.focus(); }
      return;
    }
    const direction = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[event.key];
    if (!direction) return;
    const targets = controllerFocusTargets(surfaceRef.current);
    const next = nextControllerFocus(targets, document.activeElement, direction);
    if (next) { event.preventDefault(); next.focus(); next.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }); }
  };

  return <section ref={surfaceRef} data-testid="neo-lounge" data-controller-surface="lounge" role="dialog" aria-modal="true" aria-busy={transitionBusy} aria-label="NEO Lounge" aria-describedby="lounge-control-help" onKeyDown={onKeyDown} className="fixed inset-0 z-[9000] flex flex-col overflow-hidden bg-[rgb(var(--surface))] text-ink">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-4 py-4 sm:px-8 sm:py-5">
      <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[rgb(var(--accent))]">NEO Lounge</p><h1 className="text-xl font-bold sm:text-3xl">Your games, from the couch</h1></div>
      <button ref={exitRef} type="button" data-controller-close disabled={transitionBusy} onClick={requestExit} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-6 py-3 text-lg font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] disabled:opacity-60">Exit Lounge · Esc</button>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7">
      <LoungeControlHints controllerEnabled={controllerEnabled} />
      <nav aria-label="Lounge game filters" className="mb-5 flex flex-wrap gap-3">{[['all', 'All games'], ['favorites', 'Favorites'], ['recent', 'Recently played']].map(([id, label]) => <button key={id} type="button" data-lounge-filter aria-pressed={view === id} onClick={() => chooseView(id)} className={`rounded-xl border px-5 py-2 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] ${view === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.22)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel))]'}`}>{label}</button>)}</nav>
      {shownGames.length ? <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, clamp(170px, 18vw, 320px)), 1fr))' }}>
        {shownGames.map((game) => <button key={game.id} type="button" data-lounge-game data-lounge-selected={selected?.id === game.id ? 'true' : undefined} aria-label={`Open preview for ${game.name || 'Untitled game'}${updateLedger[game.id]?.status === 'available' ? ', possible update flagged' : ''}`} aria-current={selected?.id === game.id ? 'true' : undefined} onFocus={() => { focusedGameId.current = game.id; setSelectedId(game.id); }} onMouseEnter={() => previewOnHover(game.id)} onClick={() => requestPreview(game.id)} className={`overflow-hidden rounded-2xl border-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] ${selected?.id === game.id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.12)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel))]'}`}>
          <span className="relative block aspect-[2/3] overflow-hidden bg-[rgb(var(--accent)/0.18)]"><LoungeCover game={game} />{updateLedger[game.id]?.status === 'available' && <span className="absolute right-2 top-2 rounded-lg bg-amber-300 px-2 py-1 text-xs font-bold text-black">Update flagged</span>}</span>
          <span className="block truncate px-3 py-3 text-base font-semibold" title={game.name}>{game.name || 'Untitled game'}</span>
        </button>)}
      </div> : <div className="rounded-2xl border border-[rgb(var(--border))] p-8 text-xl">{safeGames.length ? 'No games in this view yet. Try All games.' : 'No unlocked games to browse. Exit Lounge to manage your library.'}</div>}
    </div>
    {transitionError && <p role="alert" className="border-t border-rose-300/35 bg-rose-400/10 px-8 py-2 text-sm font-semibold text-rose-200">{transitionError}</p>}
    {selected && <LoungeDetails game={selected} updateLedger={updateLedger} view={view} mascotId={mascotId} mascotEnabled={mascotEnabled} busy={transitionBusy} onOpenPreview={requestPreview} />}
  </section>;
}
