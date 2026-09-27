import React from 'react';
import { ArrowLeft, CalendarDays, Clock3, Gamepad2, Grid2X2, Heart, History, House, ListFilter, PanelsTopLeft, Play, Settings2, Sparkles, Trophy } from 'lucide-react';
import { controllerFocusTargets, nextControllerFocus } from '../../input/controller-focus.mjs';
import { applyWallFilter } from '../library/wall-filter-model.mjs';
import LoungeDetails from './LoungeDetails';
import LoungeControlHints from './LoungeControlHints';
import LoungeCover from './LoungeCover';
import LoungeGamePanel from './LoungeGamePanel';
import LoungeBrowserStage from './LoungeBrowserStage';
import LoungeSettingsPanel from './LoungeSettingsPanel';
import LoungeLivingBackdrop from './LoungeLivingBackdrop';
import LoungeGuidePanel from './LoungeGuidePanel';
import { continueLoungeGames, inProgressLoungeGames, recentlyActiveLoungeGames, recentlyAddedLoungeGames, sortLoungeBrowseGames } from './lounge-guide-model.mjs';
import LoungeVisualBuilder from './LoungeVisualBuilder';
import LoungeJumpPanel from './LoungeJumpPanel';
import LoungeMascotNotice from './LoungeMascotNotice';
import LoungeParticleLayer from './LoungeParticleLayer';
import { normalizeLoungePreferences } from './lounge-layout-model.mjs';
import { filterLoungeLetter } from './lounge-alphabet-model.mjs';
import { BgAmbience } from '../ThemeVisuals';
import { customThemeManifest } from '../../themes/stock-theme-registry.mjs';
import { playLoungeBrowse, playLoungeCue } from '../../lib/sound';
import { loungeAmbienceUrl } from './lounge-ambience.mjs';

// Controller browsing is supported; launching still requires trusted mouse/keyboard input.
export default function NeoLounge({ games, favoriteIds = [], updateLedger = {}, initialGameId = null, initialLayout = 'browser', initialPreferences, onLayoutChange, onPreferencesChange, theme = 'synthwave', themeSettings = {}, mascotId = 'fungist', mascotEnabled = true, onExit, onLaunch, resting = false, soundsEnabled = true, controllerEnabled }) {
  const [selectedId, setSelectedId] = React.useState(initialGameId);
  const [layout, setLayout] = React.useState(initialLayout === 'wall' ? 'wall' : 'browser');
  const [view, setView] = React.useState('all');
  const [letter, setLetter] = React.useState('');
  const [jumpOpen, setJumpOpen] = React.useState(false);
  const [transitionError, setTransitionError] = React.useState('');
  const [transitionBusy, setTransitionBusy] = React.useState(false);
  const [detailsId, setDetailsId] = React.useState(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [guideOpen, setGuideOpen] = React.useState(() => normalizeLoungePreferences(initialPreferences).entryScreen === 'home');
  const [visualOpen, setVisualOpen] = React.useState(false);
  const [pageVisible, setPageVisible] = React.useState(() => document.visibilityState !== 'hidden');
  const [audioFocused, setAudioFocused] = React.useState(() => document.hasFocus());
  const [ambienceError, setAmbienceError] = React.useState('');
  const [preferences, setPreferences] = React.useState(() => normalizeLoungePreferences(initialPreferences));
  const [dismissedNoticeId, setDismissedNoticeId] = React.useState(null);
  const transitionLock = React.useRef(false);
  const focusAfterViewChange = React.useRef(false);
  const focusedGameId = React.useRef(null);
  const surfaceRef = React.useRef(null);
  const ambienceAudioRef = React.useRef(null);
  const detailsRef = React.useRef(null);
  const detailsBrowsed = React.useRef(false);
  const settingsFocusRef = React.useRef(null);
  const guideFocusRef = React.useRef(null);
  const visualFocusRef = React.useRef(null);
  const visualButtonRef = React.useRef(null);
  const homeButtonRef = React.useRef(null);
  const jumpFocusRef = React.useRef(null);
  const preferencesSaveTimer = React.useRef(null);
  const pendingPreferences = React.useRef(null);
  const exitRef = React.useRef(null);
  const lastPointerDown = React.useRef(0);
  const lastAction = React.useRef(0);
  const lastFocusedControl = React.useRef(null);
  const safeGames = Array.isArray(games) ? games : [];
  const viewGames = view === 'favorites' ? sortLoungeBrowseGames(applyWallFilter(safeGames, 'favorites', favoriteIds), preferences.browseSort)
    : view === 'recent' ? applyWallFilter(safeGames, 'recently-played')
      : view === 'most' ? applyWallFilter(safeGames, 'most-played')
        : view === 'continue' ? continueLoungeGames(safeGames)
          : view === 'added' ? recentlyAddedLoungeGames(safeGames)
            : view === 'week' ? recentlyActiveLoungeGames(safeGames)
              : view === 'progress' ? inProgressLoungeGames(safeGames) : sortLoungeBrowseGames(safeGames, preferences.browseSort);
  const shownGames = filterLoungeLetter(viewGames, letter);
  const viewLabel = { all: 'All games', continue: 'Continue playing', favorites: 'Favorites', recent: 'Recently played', week: 'Played this week', progress: 'In progress', added: 'Recently added', most: 'Most played' }[view] || 'this view';
  React.useEffect(() => {
    surfaceRef.current?.querySelector('[data-lounge-filter][aria-pressed="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [view]);
  const selected = shownGames.find((game) => game.id === selectedId) || shownGames[0] || null;
  const selectedIndex = shownGames.findIndex(game => game.id === selected?.id);
  const soundsActive = preferences.browseSoundEnabled && soundsEnabled && !resting && pageVisible && preferences.browseSoundVolume > 0;
  const ambienceUrl = loungeAmbienceUrl(preferences);
  const ambienceActive = Boolean(ambienceUrl) && soundsEnabled && !resting && !transitionBusy && pageVisible && audioFocused && preferences.ambienceVolume > 0;
  const retryAmbience = () => {
    if (!ambienceActive || !ambienceAudioRef.current) return;
    ambienceAudioRef.current.play().then(() => setAmbienceError('')).catch(() => setAmbienceError('Playback was blocked. Try again or choose another MP3.'));
  };
  React.useEffect(() => {
    if (ambienceAudioRef.current) ambienceAudioRef.current.volume = preferences.ambienceVolume / 100;
  }, [preferences.ambienceVolume]);
  React.useEffect(() => {
    const audio = ambienceAudioRef.current;
    if (!audio) return;
    if (!ambienceActive) { audio.pause(); return; }
    audio.play().then(() => setAmbienceError('')).catch(() => setAmbienceError('Playback was blocked. Try again or choose another MP3.'));
    return () => audio.pause();
  }, [ambienceUrl, ambienceActive]);
  const moveVolume = Math.round(preferences.browseSoundVolume * preferences.browseMoveLevel / 100);
  const previewSound = kind => { if (soundsActive) playLoungeCue(kind, kind === 'move' ? moveVolume : preferences.browseSoundVolume, preferences.browseSoundStyle); };
  const selectGame = id => {
    if (selected?.id === id) return;
    setSelectedId(id);
    if (soundsActive && moveVolume > 0) playLoungeBrowse(moveVolume, preferences.browseSoundStyle);
  };
  const detailsGame = shownGames.find(game => game.id === detailsId) || null;
  const detailsIndex = shownGames.findIndex(game => game.id === detailsId);
  const loungeStyle = customThemeManifest(theme)?.lounge || {};
  const themeLevel = themeSettings.effectsLevelByTheme?.[theme] ?? themeSettings.effectsLevel ?? 2;
  const loungeLevel = preferences.motion === 'off' ? 0 : preferences.fxLevel !== 'theme' ? preferences.fxLevel : themeLevel === 0 ? 0 : Math.min(4, Math.max(0, themeLevel + (loungeStyle.fxBoost ?? 0)));
  const fxEnabled = !resting && pageVisible && loungeLevel > 0;
  const loungeThemeSettings = { ...themeSettings, motionCadence: preferences.motion === 'subtle' ? 'calm' : themeSettings.motionCadence, effectsLevelByTheme: { ...themeSettings.effectsLevelByTheme, [theme]: loungeLevel } };
  const visualStyle = {
    '--lounge-glow': fxEnabled ? (loungeStyle.focusGlow ?? 0.75) : 0.2,
    '--lounge-flow-opacity': fxEnabled ? (loungeStyle.flowOpacity ?? 0.36) : 0,
    '--lounge-flow-seconds': `${(loungeStyle.flowSeconds ?? 18) * (preferences.motion === 'subtle' ? 1.8 : 1)}s`,
    '--lounge-panel-opacity': preferences.panelOpacity / 100,
    '--lounge-art-opacity': loungeStyle.artOpacity ?? 0.75,
    '--lounge-card-lift': `${loungeStyle.cardLift ?? 4}px`,
    '--lounge-cover-size': `${preferences.coverSize}px`,
    '--lounge-card-gap': `${preferences.gap}px`,
    '--lounge-shelf-width': `${preferences.shelfWidth}px`,
    '--lounge-wall-cover-size': `${preferences.wallCoverSize}px`,
  };
  const changeLayout = (next) => {
    if (next === layout) return;
    setLayout(next);
    onLayoutChange?.(next);
    focusAfterViewChange.current = !settingsOpen;
  };
  const flushPreferences = () => {
    window.clearTimeout(preferencesSaveTimer.current);
    if (pendingPreferences.current) { onPreferencesChange?.(pendingPreferences.current); pendingPreferences.current = null; }
  };
  const changePreferences = next => {
    const safe = normalizeLoungePreferences(next);
    setPreferences(safe);
    pendingPreferences.current = safe;
    window.clearTimeout(preferencesSaveTimer.current);
    preferencesSaveTimer.current = window.setTimeout(flushPreferences, 280);
  };
  React.useEffect(() => () => {
    window.clearTimeout(preferencesSaveTimer.current);
    if (pendingPreferences.current) onPreferencesChange?.(pendingPreferences.current);
  }, []);
  React.useEffect(() => {
    const syncVisibility = () => setPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', syncVisibility);
    return () => document.removeEventListener('visibilitychange', syncVisibility);
  }, []);
  React.useEffect(() => {
    const focus = () => setAudioFocused(true);
    const blur = () => setAudioFocused(false);
    window.addEventListener('focus', focus);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('focus', focus); window.removeEventListener('blur', blur); };
  }, []);

  React.useEffect(() => {
    if (!guideOpen) surfaceRef.current?.querySelector('[data-lounge-selected="true"], [data-lounge-game], [data-controller-close]')?.focus();
  }, []);
  React.useEffect(() => {
    if (selectedId && !shownGames.some((game) => game.id === selectedId)) setSelectedId(null);
  }, [shownGames, selectedId]);
  React.useEffect(() => {
    if (!focusAfterViewChange.current) return;
    focusAfterViewChange.current = false;
    surfaceRef.current?.querySelector('[data-lounge-selected="true"], [data-lounge-filter][aria-pressed="true"]')?.focus();
  }, [view, layout, letter]);
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
  const openDetails = (id) => { detailsRef.current = document.activeElement; detailsBrowsed.current = false; setDetailsId(id); };
  const closeDetails = () => {
    const cover = detailsBrowsed.current ? [...(surfaceRef.current?.querySelectorAll('[data-lounge-game]') || [])].find(element => element.dataset.loungeGameId === String(detailsId)) : null;
    setDetailsId(null);
    window.requestAnimationFrame(() => (cover || detailsRef.current)?.focus?.());
  };
  const stepDetails = direction => {
    if (shownGames.length < 2 || detailsIndex < 0) return;
    const next = shownGames[(detailsIndex + direction + shownGames.length) % shownGames.length];
    detailsBrowsed.current = true;
    selectGame(next.id);
    setDetailsId(next.id);
  };
  const openSettings = () => { settingsFocusRef.current = document.activeElement; setSettingsOpen(true); };
  const closeSettings = () => { flushPreferences(); setSettingsOpen(false); window.requestAnimationFrame(() => settingsFocusRef.current?.focus?.()); };
  const openGuide = () => { guideFocusRef.current = document.activeElement; setGuideOpen(true); };
  const closeGuide = () => { flushPreferences(); setGuideOpen(false); window.requestAnimationFrame(() => (guideFocusRef.current || homeButtonRef.current)?.focus?.()); };
  const openVisual = () => { visualFocusRef.current = document.activeElement; setVisualOpen(true); };
  const closeVisual = () => { flushPreferences(); setVisualOpen(false); window.requestAnimationFrame(() => visualFocusRef.current?.focus?.()); };
  const openVisualFromGuide = () => { flushPreferences(); visualFocusRef.current = visualButtonRef.current; setGuideOpen(false); setVisualOpen(true); };
  const openVisualFromSettings = () => { flushPreferences(); visualFocusRef.current = visualButtonRef.current; setSettingsOpen(false); setVisualOpen(true); };
  const browseFromGuide = filter => { flushPreferences(); setGuideOpen(false); focusAfterViewChange.current = true; setLetter(''); setView(filter); changeLayout('wall'); window.requestAnimationFrame(() => surfaceRef.current?.querySelector('[data-lounge-selected="true"], [data-lounge-game], [data-lounge-filter][aria-pressed="true"]')?.focus()); };
  const openGameFromGuide = id => {
    flushPreferences();
    guideFocusRef.current = guideFocusRef.current || document.activeElement;
    detailsRef.current = guideFocusRef.current;
    detailsBrowsed.current = false;
    setGuideOpen(false);
    setView('all');
    setSelectedId(id);
    setDetailsId(id);
  };
  const chooseView = (id) => {
    if (id === view) return;
    focusAfterViewChange.current = true;
    setLetter('');
    setView(id);
  };
  const openJump = () => { jumpFocusRef.current = document.activeElement; setJumpOpen(true); };
  const closeJump = () => { setJumpOpen(false); window.requestAnimationFrame(() => jumpFocusRef.current?.focus?.()); };
  const chooseLetter = next => { focusAfterViewChange.current = true; setSelectedId(null); setLetter(next); setJumpOpen(false); if (next === letter) window.requestAnimationFrame(() => { focusAfterViewChange.current = false; surfaceRef.current?.querySelector('[data-lounge-selected="true"], [data-lounge-game], [data-lounge-filter][aria-pressed="true"]')?.focus(); }); };
  const previewOnHover = (id) => {
    if (surfaceRef.current?.querySelector('[data-lounge-game]:focus')) return;
    selectGame(id);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); previewSound('back'); if (jumpOpen) closeJump(); else if (visualOpen) closeVisual(); else if (settingsOpen) closeSettings(); else if (detailsId) closeDetails(); else if (guideOpen) closeGuide(); else requestExit(); return; }
    if (event.key === 'Tab') {
      const scope = jumpOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-jump-panel"]') : visualOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-visual-builder"]') : settingsOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-settings-panel"]') : detailsId ? surfaceRef.current?.querySelector('[data-testid="lounge-game-panel"]') : guideOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-guide-panel"]') : surfaceRef.current;
      const targets = [...(scope?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]') || [])].filter(element => element.getClientRects().length);
      if (event.shiftKey && document.activeElement === targets[0]) { event.preventDefault(); targets.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === targets.at(-1)) { event.preventDefault(); targets[0]?.focus(); }
      return;
    }
    if (event.target?.matches?.('input, select, textarea, [role="slider"]')) return;
    const direction = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[event.key];
    if (!direction) return;
    const targets = controllerFocusTargets(jumpOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-jump-panel"]') : visualOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-visual-builder"]') : settingsOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-settings-panel"]') : detailsId ? surfaceRef.current?.querySelector('[data-testid="lounge-game-panel"]') : guideOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-guide-panel"]') : surfaceRef.current);
    const next = nextControllerFocus(targets, document.activeElement, direction);
    if (next) { event.preventDefault(); next.focus(); next.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }); }
  };

  const coverButton = (game, index) => <button key={game.id} type="button" data-lounge-game data-lounge-game-id={game.id} data-lounge-selected={selected?.id === game.id ? 'true' : undefined} data-lounge-side={layout === 'browser' ? index < selectedIndex ? 'before' : index > selectedIndex ? 'after' : 'active' : undefined} aria-label={`Open Lounge details for ${game.name || 'Untitled game'}${updateLedger[game.id]?.status === 'available' ? ', possible update flagged' : ''}`} aria-current={selected?.id === game.id ? 'true' : undefined} onFocus={() => { focusedGameId.current = game.id; selectGame(game.id); }} onMouseEnter={() => previewOnHover(game.id)} onPointerMove={(event) => { if (event.pointerType === 'mouse') selectGame(game.id); }} onClick={() => openDetails(game.id)} className={`lounge-game-card group relative overflow-hidden rounded-2xl border-2 text-left transition duration-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--accent))] ${layout === 'browser' ? 'lounge-browser-card shrink-0' : 'w-full'} ${selected?.id === game.id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.84)] hover:border-[rgb(var(--accent)/0.65)]'}`}>
    <span className={`relative block overflow-hidden bg-[rgb(var(--accent)/0.18)] ${layout === 'browser' ? 'aspect-square' : 'aspect-[2/3]'}`}><LoungeCover game={game} />{updateLedger[game.id]?.status === 'available' && <span className="absolute right-2 top-2 rounded-lg bg-amber-300 px-2 py-1 text-xs font-bold text-black">Update flagged</span>}{selected?.id === game.id && <span className="absolute bottom-2 left-2 rounded-full border border-white/60 bg-black/65 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg backdrop-blur-md">In focus</span>}</span>
    <span className="block truncate px-3 py-3 text-base font-semibold" title={game.name}>{game.name || 'Untitled game'}</span>
  </button>;

  return <section ref={surfaceRef} data-testid="neo-lounge" data-controller-surface="lounge" data-lounge-layout={layout} data-lounge-control-size={preferences.controlSize} data-lounge-motion={preferences.motion} data-lounge-fx={fxEnabled ? 'on' : 'off'} data-lounge-paused={!pageVisible || resting ? 'true' : undefined} role="dialog" aria-modal="true" aria-busy={transitionBusy} aria-label="NEO Lounge" aria-describedby="lounge-control-help" onKeyDown={onKeyDown} onPointerDownCapture={() => { lastPointerDown.current = Date.now(); }} onFocusCapture={event => { const button = event.target.closest?.('button'); if (!button || button === lastFocusedControl.current) return; lastFocusedControl.current = button; if (!button.hasAttribute('data-lounge-game') && Date.now() - Math.max(lastPointerDown.current, lastAction.current) > 250) previewSound('move'); }} onClickCapture={event => { const button = event.target.closest?.('button'); if (!button || button.disabled || button.hasAttribute('data-lounge-sound-preview')) return; lastAction.current = Date.now(); previewSound(button.matches('[data-controller-close], [aria-label^="Dismiss"]') ? 'back' : 'confirm'); }} className="fixed inset-0 z-[9000] isolate flex flex-col overflow-hidden bg-[rgb(var(--surface))] text-ink" style={visualStyle}>
    <audio ref={ambienceAudioRef} src={ambienceUrl || undefined} loop preload="none" aria-hidden="true" onError={() => { if (ambienceUrl) setAmbienceError('This ambience file could not be played. Choose another MP3.'); }} />
    <LoungeLivingBackdrop theme={theme} game={selected} loungeLevel={loungeLevel} motion={preferences.motion} active={fxEnabled} flowOpacity={loungeStyle.flowOpacity} flowSeconds={loungeStyle.flowSeconds} preferences={preferences} />
    <BgAmbience theme={theme} settings={loungeThemeSettings} game={selected} resting={resting || !pageVisible} particlesEnabled={preferences.particleStyle === 'theme'} />
    {fxEnabled && <LoungeParticleLayer styleId={preferences.particleStyle} level={loungeLevel} motion={preferences.motion} />}
    <div className="lounge-flow pointer-events-none absolute inset-0" aria-hidden="true" />
    <header className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.86)] px-4 py-3 backdrop-blur-xl sm:px-8">
      <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[rgb(var(--accent))]">NEO Lounge</p><h1 className="text-lg font-bold sm:text-2xl">Your games, from the couch</h1></div>
      <nav aria-label="Lounge navigation" className="flex flex-wrap items-center gap-2"><button ref={homeButtonRef} type="button" onClick={openGuide} aria-label="Lounge Home and Guide" className="lounge-header-control lounge-nav-button inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--accent)/0.18)] px-4 text-base font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]"><House size={20} /> Home</button><button type="button" onClick={openSettings} aria-label="Customize Lounge layout" className="lounge-header-control lounge-nav-button inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]"><Settings2 size={19} /> Layout</button><button ref={visualButtonRef} type="button" onClick={openVisual} aria-label="Open Lounge visual builder" className="lounge-header-control lounge-nav-button inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]"><Sparkles size={19} /> Visuals</button><button ref={exitRef} type="button" data-controller-close disabled={transitionBusy} onClick={requestExit} className="lounge-header-control lounge-nav-button inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 text-base font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] disabled:opacity-60"><ArrowLeft size={20} /> Back</button></nav>
    </header>
    <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-5">
      <div className="lounge-toolbar mb-3 flex items-center gap-2 rounded-2xl border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--panel)/0.6)] p-1.5 backdrop-blur-xl"><div className="flex shrink-0 items-center gap-1" role="group" aria-label="Lounge layout">
        {[['wall', 'Wall'], ['browser', 'Game browser']].map(([id, label]) => <button key={id} type="button" data-lounge-layout-button aria-pressed={layout === id} onClick={() => changeLayout(id)} className={`lounge-mode-toggle inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))] ${layout === id ? 'border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--accent)/0.22)]' : 'border-transparent bg-transparent hover:bg-[rgb(var(--panel)/0.82)]'}`}>{id === 'wall' ? <Grid2X2 size={16} /> : <PanelsTopLeft size={16} />}{label}</button>)}
      </div><nav aria-label="Lounge game filters" className="lounge-filter-strip flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap">{[['all', 'All games', Grid2X2], ['continue', 'Continue playing', Play], ['favorites', 'Favorites', Heart], ['recent', 'Recently played', History], ['week', 'Played this week', Clock3], ['progress', 'In progress', Play], ['added', 'Recently added', CalendarDays], ['most', 'Most played', Trophy]].map(([id, label, Icon]) => <button key={id} type="button" data-lounge-filter aria-pressed={view === id} onClick={() => chooseView(id)} className={`lounge-filter-toggle inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] ${view === id ? 'border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--accent)/0.22)]' : 'border-transparent bg-transparent hover:bg-[rgb(var(--panel))]'}`}><Icon size={16} aria-hidden="true" />{label}</button>)}<button type="button" onClick={openJump} aria-label={letter ? `Jump to letter, showing ${letter}` : 'Jump to a game letter'} aria-pressed={Boolean(letter)} className={`lounge-filter-toggle inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] ${letter ? 'border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--accent)/0.18)]' : 'border-transparent hover:bg-[rgb(var(--panel))]'}`}><ListFilter size={16} /> {letter ? `${letter} · ${shownGames.length}` : 'A–Z'}</button></nav></div>
      <LoungeControlHints controllerEnabled={controllerEnabled} />
      {shownGames.length ? layout === 'browser' ? <div className="lounge-browser relative flex min-h-0 gap-4 pb-5" data-shelf-position={preferences.shelfPosition} style={{ '--lounge-stage-height': `${preferences.stageHeight}px` }}>
        <div className="lounge-browser-shelf relative z-10 flex min-h-0 shrink-0 overflow-auto rounded-2xl border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--panel)/0.56)] p-3 backdrop-blur-xl" aria-label="Game shelf">{shownGames.map(coverButton)}</div>
        <LoungeBrowserStage game={selected} index={shownGames.findIndex(game => game.id === selected?.id)} total={shownGames.length} preferences={preferences} updateLedger={updateLedger} onOpenDetails={openDetails} />
      </div> : <div className="lounge-wall-grid grid px-2 pb-5 pt-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, var(--lounge-wall-cover-size)), 1fr))' }}>{shownGames.map(coverButton)}</div> : <section data-lounge-empty aria-live="polite" className="lounge-empty-state relative isolate flex min-h-72 flex-col items-start justify-center overflow-hidden rounded-3xl border border-[rgb(var(--accent)/0.4)] px-7 py-9 sm:px-12"><div aria-hidden="true" className="lounge-empty-orb pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full" /><span className="relative grid h-16 w-16 place-items-center rounded-2xl border border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent-2))]"><Gamepad2 size={32} /></span><p className="relative mt-5 text-xs font-black uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">NEO Lounge</p><h2 className="relative mt-1 text-2xl font-black sm:text-3xl">{!safeGames.length ? 'Your Lounge is waiting' : letter ? `No ${letter} games here` : `No ${viewLabel.toLowerCase()} games yet`}</h2><p className="relative mt-2 max-w-xl text-sm leading-relaxed text-muted">{!safeGames.length ? 'Add games in your desktop Library, then come back to browse them from the couch.' : letter ? `This letter has no games in ${viewLabel}. Clear the letter to see the full view.` : `${viewLabel} has no matches in your unlocked library. Your other games are still here.`}</p><button type="button" data-controller-close={!safeGames.length ? true : undefined} onClick={!safeGames.length ? requestExit : letter ? () => { focusAfterViewChange.current = true; setLetter(''); } : () => chooseView('all')} className="lounge-nav-button relative mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--accent)/0.2)] px-5 text-sm font-black text-ink focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgb(var(--accent))]">{!safeGames.length ? <ArrowLeft size={19} /> : letter ? <ListFilter size={19} /> : <Grid2X2 size={19} />}{!safeGames.length ? 'Exit Lounge' : letter ? 'Clear letter' : 'Show all games'}</button></section>}
    </div>
    {transitionError && <p role="alert" className="relative z-10 border-t border-rose-300/35 bg-rose-400/10 px-8 py-2 text-sm font-semibold text-rose-200">{transitionError}</p>}
    {selected && layout === 'wall' && <LoungeDetails game={selected} updateLedger={updateLedger} view={view} mascotId={mascotId} mascotEnabled={mascotEnabled} busy={transitionBusy} onOpenDetails={openDetails} />}
    {mascotEnabled && selected && dismissedNoticeId !== selected.id && !detailsId && !settingsOpen && !guideOpen && !visualOpen && !jumpOpen && <LoungeMascotNotice game={selected} updateLedger={updateLedger} mascotId={mascotId} onDismiss={() => setDismissedNoticeId(selected.id)} />}
    {detailsGame && <LoungeGamePanel game={detailsGame} position={detailsIndex + 1} total={shownGames.length} updateLedger={updateLedger} onPrevious={() => stepDetails(-1)} onNext={() => stepDetails(1)} onClose={closeDetails} onLaunch={onLaunch} />}
    {settingsOpen && <LoungeSettingsPanel preferences={preferences} layout={layout} soundsEnabled={soundsEnabled && !resting && pageVisible} onLayoutChange={changeLayout} onChange={changePreferences} onOpenVisual={openVisualFromSettings} onPreviewSound={previewSound} ambienceError={ambienceError} onRetryAmbience={retryAmbience} onClose={closeSettings} />}
    {guideOpen && <LoungeGuidePanel games={safeGames} favoriteIds={favoriteIds} preferences={preferences} onPreferencesChange={changePreferences} updateLedger={updateLedger} onOpenGame={openGameFromGuide} onBrowse={browseFromGuide} onCustomize={openVisualFromGuide} onClose={closeGuide} />}
    {visualOpen && <LoungeVisualBuilder preferences={preferences} game={selected} theme={theme} loungeLevel={loungeLevel} flowOpacity={loungeStyle.flowOpacity} flowSeconds={loungeStyle.flowSeconds} soundsEnabled={soundsEnabled && !resting && pageVisible} effectsActive={fxEnabled} onChange={changePreferences} onPreviewSound={previewSound} ambienceError={ambienceError} onRetryAmbience={retryAmbience} onClose={closeVisual} />}
    {jumpOpen && <LoungeJumpPanel games={viewGames} currentLetter={letter} onChoose={chooseLetter} onClose={closeJump} />}
  </section>;
}
