import React from 'react';
import { controllerFocusTargets, nextControllerFocus } from '../../input/controller-focus.mjs';
import { applyWallFilter } from '../library/wall-filter-model.mjs';
import LoungeDetails from './LoungeDetails';
import LoungeControlHints from './LoungeControlHints';
import LoungeCover from './LoungeCover';
import { artworkBackdrop } from '../../lib/game-artwork-model.mjs';
import { BgAmbience } from '../ThemeVisuals';
import { customThemeCanvas } from '../../themes/stock-theme-registry.mjs';

// This is a browsing surface, not a game launcher. Launching from a pad needs
// the separate trusted-input contract before it can be added here.
export default function NeoLounge({ games, favoriteIds = [], updateLedger = {}, initialGameId = null, initialLayout = 'wall', onLayoutChange, theme = 'synthwave', themeSettings = {}, mascotId = 'fungist', mascotEnabled = true, onExit, onOpenPreview, controllerEnabled }) {
  const [selectedId, setSelectedId] = React.useState(initialGameId);
  const [layout, setLayout] = React.useState(initialLayout === 'browser' ? 'browser' : 'wall');
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
  const selectedBackdrop = selected ? artworkBackdrop(selected) : '';
  const changeLayout = (next) => {
    if (next === layout) return;
    setLayout(next);
    onLayoutChange?.(next);
    focusAfterViewChange.current = true;
  };

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
  }, [view, layout]);
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

  const coverButton = (game) => <button key={game.id} type="button" data-lounge-game data-lounge-selected={selected?.id === game.id ? 'true' : undefined} aria-label={`Open preview for ${game.name || 'Untitled game'}${updateLedger[game.id]?.status === 'available' ? ', possible update flagged' : ''}`} aria-current={selected?.id === game.id ? 'true' : undefined} onFocus={() => { focusedGameId.current = game.id; setSelectedId(game.id); }} onMouseEnter={() => previewOnHover(game.id)} onClick={() => requestPreview(game.id)} className={`lounge-game-card group relative overflow-hidden rounded-2xl border-2 text-left transition duration-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--accent))] ${layout === 'browser' ? 'w-[clamp(92px,9vw,140px)] shrink-0' : 'w-full'} ${selected?.id === game.id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)] shadow-[0_0_0_3px_rgb(var(--accent)/0.65),0_0_35px_rgb(var(--accent)/0.55)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.84)] hover:border-[rgb(var(--accent)/0.65)]'}`}>
    <span className={`relative block overflow-hidden bg-[rgb(var(--accent)/0.18)] ${layout === 'browser' ? 'aspect-square' : 'aspect-[2/3]'}`}><LoungeCover game={game} />{updateLedger[game.id]?.status === 'available' && <span className="absolute right-2 top-2 rounded-lg bg-amber-300 px-2 py-1 text-xs font-bold text-black">Update flagged</span>}{selected?.id === game.id && <span className="absolute bottom-2 left-2 rounded-md bg-[rgb(var(--accent))] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[rgb(var(--surface))] shadow-lg">Selected</span>}</span>
    <span className="block truncate px-3 py-3 text-base font-semibold" title={game.name}>{game.name || 'Untitled game'}</span>
  </button>;

  return <section ref={surfaceRef} data-testid="neo-lounge" data-controller-surface="lounge" data-lounge-layout={layout} role="dialog" aria-modal="true" aria-busy={transitionBusy} aria-label="NEO Lounge" aria-describedby="lounge-control-help" onKeyDown={onKeyDown} className="fixed inset-0 z-[9000] isolate flex flex-col overflow-hidden bg-[rgb(var(--surface))] text-ink" style={{ backgroundImage: customThemeCanvas(theme), backgroundSize: 'cover', backgroundPosition: 'center' }}>
    <BgAmbience theme={theme} settings={themeSettings} game={selected} />
    <header className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.86)] px-4 py-4 backdrop-blur-xl sm:px-8 sm:py-5">
      <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[rgb(var(--accent))]">NEO Lounge</p><h1 className="text-xl font-bold sm:text-3xl">Your games, from the couch</h1></div>
      <button ref={exitRef} type="button" data-controller-close disabled={transitionBusy} onClick={requestExit} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-6 py-3 text-lg font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] disabled:opacity-60">Exit Lounge · Esc</button>
    </header>
    <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7">
      <LoungeControlHints controllerEnabled={controllerEnabled} />
      <div className="mb-5 flex flex-wrap items-center gap-3" role="group" aria-label="Lounge layout">
        {[['wall', 'Wall'], ['browser', 'Game browser']].map(([id, label]) => <button key={id} type="button" data-lounge-layout-button aria-pressed={layout === id} onClick={() => changeLayout(id)} className={`rounded-xl border px-5 py-2 text-base font-bold focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))] ${layout === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.3)] shadow-[0_0_18px_rgb(var(--accent)/0.32)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.82)]'}`}>{label}</button>)}
      </div>
      <nav aria-label="Lounge game filters" className="mb-5 flex flex-wrap gap-3">{[['all', 'All games'], ['favorites', 'Favorites'], ['recent', 'Recently played']].map(([id, label]) => <button key={id} type="button" data-lounge-filter aria-pressed={view === id} onClick={() => chooseView(id)} className={`rounded-xl border px-5 py-2 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] ${view === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.22)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel))]'}`}>{label}</button>)}</nav>
      {shownGames.length ? layout === 'browser' ? <div className="space-y-5">
        <div className="flex gap-4 overflow-x-auto px-8 pb-8 pt-4" aria-label="Game shelf">{shownGames.map(coverButton)}</div>
        {selected && <div className="relative flex min-h-[30vh] items-end overflow-hidden rounded-3xl border border-[rgb(var(--accent)/0.45)] bg-[rgb(var(--panel))] shadow-[0_0_45px_rgb(var(--accent)/0.18)]" data-testid="lounge-selected-stage">
          {selectedBackdrop && <img src={selectedBackdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75" />}
          <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--surface)/0.97)] via-[rgb(var(--surface)/0.66)] to-[rgb(var(--surface)/0.15)]" />
          <div className="relative max-w-3xl p-6 sm:p-10"><p className="text-xs font-black uppercase tracking-[0.25em] text-[rgb(var(--accent-2))]">Now browsing</p><h2 className="mt-2 text-3xl font-black sm:text-5xl">{selected.name || 'Untitled game'}</h2><p className="mt-3 line-clamp-3 max-w-xl text-base text-ink">{selected.shortDescription || selected.description || selected.about || selected.launcher || 'Open Preview to see this game’s details.'}</p><button type="button" disabled={transitionBusy} onClick={() => requestPreview(selected.id)} className="mt-5 rounded-xl border border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.28)] px-6 py-3 text-lg font-bold focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))] disabled:opacity-60">Open Preview</button></div>
        </div>}
      </div> : <div className="grid gap-5 px-2 pb-5 pt-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, clamp(170px, 18vw, 320px)), 1fr))' }}>{shownGames.map(coverButton)}</div> : <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.8)] p-8 text-xl">{safeGames.length ? 'No games in this view yet. Try All games.' : 'No unlocked games to browse. Exit Lounge to manage your library.'}</div>}
    </div>
    {transitionError && <p role="alert" className="relative z-10 border-t border-rose-300/35 bg-rose-400/10 px-8 py-2 text-sm font-semibold text-rose-200">{transitionError}</p>}
    {selected && <LoungeDetails game={selected} updateLedger={updateLedger} view={view} mascotId={mascotId} mascotEnabled={mascotEnabled} busy={transitionBusy} onOpenPreview={requestPreview} />}
  </section>;
}
