import React from 'react';
import { ArrowLeft, CalendarDays, Clock3, Gamepad2, Grid2X2, Heart, History, House, ListFilter, Monitor, Moon, Music2, PanelsTopLeft, Play, Settings2, Sparkles, Trophy } from 'lucide-react';
import { controllerFocusTargets, nextControllerFocus } from '../../input/controller-focus.mjs';
import { applyWallFilter } from '../library/wall-filter-model.mjs';
import LoungeDetails from './LoungeDetails';
import LoungeControlHints from './LoungeControlHints';
import LoungeCover from './LoungeCover';
import LoungeGamePanel from './LoungeGamePanel';
import LoungeBrowserStage from './LoungeBrowserStage';
import LoungeWidgetArea from './LoungeWidgetArea';
import LoungeSettingsPanel from './LoungeSettingsPanel';
import LoungeSoundPanel from './LoungeSoundPanel';
import LoungeLivingBackdrop from './LoungeLivingBackdrop';
import LoungeFrameDiagnostics from './LoungeFrameDiagnostics';
import LoungeGuidePanel from './LoungeGuidePanel';
import { continueLoungeGames, inProgressLoungeGames, recentlyActiveLoungeGames, recentlyAddedLoungeGames, sortLoungeBrowseGames } from './lounge-guide-model.mjs';
import LoungeVisualBuilder from './LoungeVisualBuilder';
import LoungeThemeGallery from './LoungeThemeGallery';
import LoungeJumpPanel from './LoungeJumpPanel';
import LoungeMascotNotice from './LoungeMascotNotice';
import LoungeParticleLayer from './LoungeParticleLayer';
import { emulatorZoneGames, emulatorZoneStatus, loungeConsoleVisibleCount, LOUNGE_CONSOLES, nextLoungeConsole, visibleLoungeConsoles, shownLoungeConsoles, reconcileLoungeConsole } from './lounge-emulator-zone.mjs';
import { loungeControllerRoute } from './lounge-controller-route.mjs';
import { loungeEffectPreferences } from './lounge-effect-model.mjs';
import { advanceConsoleWheel } from './lounge-console-wheel.mjs';
import { scrollLoungeStripToControl } from './lounge-strip-scroll.mjs';
import { centeredCarouselTarget, glideCarouselPosition, carouselCrossAxisClearance } from './lounge-carousel-centering.mjs';
import { normalizeLoungeResume } from './lounge-resume-model.mjs';
import { LOUNGE_CONSOLE_LOGOS } from './lounge-console-logos.mjs';
import { LOUNGE_QUICK_LINKS, loungeFramePaletteStyle, loungeSceneParticleStyle, normalizeLoungePreferences, showLoungeBrowseFilter } from './lounge-layout-model.mjs';
import { filterLoungeLetter } from './lounge-alphabet-model.mjs';
import { BgAmbience } from '../ThemeVisuals';
import { customThemeManifest, stockThemeManifest, themePaletteStyle } from '../../themes/stock-theme-registry.mjs';
import { playLoungeCue } from '../../lib/sound';
import { loungeAmbienceUrl } from './lounge-ambience.mjs';
import { playLoungeSample, previewLoungeSample, stopLoungeSamples } from './lounge-sample-player';

// Controller browsing is supported; launching still requires trusted mouse/keyboard input.
const EMPTY_GAMES = [];
const EMPTY_FAVORITES = [];
const QUICK_LINK_ICONS = { continue: Play, favorites: Heart, recent: History, added: CalendarDays, most: Trophy, all: Grid2X2, visual: Sparkles };
function ConsoleLogo({ id, label, shortLabel, large = false }) { const src = LOUNGE_CONSOLE_LOGOS[id]; return src ? <img src={src} alt={label} className={large ? 'lounge-console-logo lounge-console-logo--large' : 'lounge-console-logo'} draggable="false" /> : <span className="lounge-console-logo-fallback">{shortLabel}</span>; }
const LoungeTopButton = React.forwardRef(function LoungeTopButton({ Icon, label, accent, onClick, pressed, disabled, testId, homeZone = false, controllerClose = false }, ref) {
  return <button ref={ref} type="button" data-testid={testId} data-lounge-home-zone={homeZone || undefined} data-controller-close={controllerClose || undefined} aria-label={label} aria-pressed={pressed} disabled={disabled} onClick={onClick} className="lounge-top-icon lounge-nav-button" style={{ '--lounge-icon-color': accent }}>
    <Icon size={29} strokeWidth={2.1} aria-hidden="true" />
    <span className="lounge-top-icon__label" aria-hidden="true">{label}</span>
  </button>;
});
const CONSOLE_ACCENTS = Object.freeze({ atari2600: '255 147 91', c64: '185 149 255', nes: '255 94 105', snes: '191 150 255', n64: '108 214 120', gb: '176 204 130', gbc: '255 162 88', gba: '141 163 255', nds: '163 197 255', '3ds': '255 101 132', gamecube: '171 145 255', wii: '110 204 236', wiiu: '112 194 255', switch: '255 91 103', genesis: '154 185 255', dreamcast: '255 164 93', ps1: '120 177 255', ps2: '95 165 255', psp: '135 192 255', arcade: '255 197 90' });
const FILTER_ACCENTS = Object.freeze({ wall: '151 171 255', browser: '98 213 255', all: '117 218 255', continue: '108 230 177', favorites: '255 128 175', recent: '174 145 255', week: '111 206 255', progress: '255 188 108', added: '132 220 190', most: '255 211 109', az: '163 191 255', visual: '130 235 201' });
const LoungeThemeAmbience = React.memo(BgAmbience);
const LoungeGameCard = React.memo(function LoungeGameCard({ game, layout, selected, distance, coverFrame, frameColor, updateAvailable, actions }) {
  const browser = layout === 'browser';
  const cardRef = React.useRef(null);
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    if (!browser || !window.IntersectionObserver) { setVisible(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { root: cardRef.current?.closest('.lounge-browser-shelf'), rootMargin: '1000px' });
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [browser]);
  const renderArtwork = !browser || visible || selected;
  return <button ref={cardRef} data-lounge-card-visible={renderArtwork ? 'true' : 'false'} type="button" data-lounge-game data-lounge-game-id={game.id} data-lounge-cover-frame={browser ? coverFrame : undefined} data-lounge-frame-color={browser ? frameColor : undefined} data-lounge-selected={selected ? 'true' : undefined} data-lounge-distance={browser ? distance : undefined} aria-label={`Open Lounge details for ${game.name || 'Untitled game'}${updateAvailable ? ', possible update flagged' : ''}`} aria-current={selected ? 'true' : undefined} onFocus={() => actions.current.focus(game.id)} onClick={() => actions.current.open(game.id)} className={`lounge-game-card group relative overflow-hidden rounded-2xl border-2 text-left transition duration-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--accent))] ${browser ? 'lounge-browser-card shrink-0' : 'w-full'} ${selected ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.84)] hover:border-[rgb(var(--accent)/0.65)]'}`}>
    <span className={`relative block overflow-hidden bg-[rgb(var(--accent)/0.18)] ${browser ? '' : 'aspect-[2/3]'}`} style={browser ? { aspectRatio: 'var(--lounge-card-aspect, 1 / 1)' } : undefined}>{renderArtwork && <LoungeCover game={game} />}{updateAvailable && <span className="absolute right-2 top-2 rounded-lg bg-amber-300 px-2 py-1 text-xs font-bold text-black">Update flagged</span>}</span>
    <span className="lounge-card-caption flex h-10 items-center justify-center overflow-hidden px-1.5 py-1 text-center" title={game.name}><span className="lounge-card-caption__text font-bold" style={{ fontSize: game.name?.length > 32 ? 10 : game.name?.length > 22 ? 11 : 12 }}>{game.name || 'Untitled game'}</span></span>
    {browser && renderArtwork && <i className="lounge-card-frame" aria-hidden="true" />}
  </button>;
});
export default function NeoLounge({ games, retroProfiles = [], favoriteIds = EMPTY_FAVORITES, updateLedger = {}, initialGameId = null, initialLayout = 'browser', initialPreferences, initialResume, onResumeChange, savedPresets = [], onSavedPresetsChange, onLayoutChange, onPreferencesChange, theme = 'synthwave', themeSettings = {}, mascotId = 'fungist', mascotEnabled = true, onExit, onLaunch, resting = false, idlePowerSaving = false, restReason = '', soundsEnabled = true, controllerEnabled, privateGameCount = 0, privateGamesUnlocked = false, onRequestPrivateGames }) {
  const startingResume = React.useRef(normalizeLoungeResume(initialResume)).current;
  const [selectedId, setSelectedId] = React.useState(startingResume.gameId || initialGameId);
  const [layout, setLayout] = React.useState(startingResume.zone === 'emulator' ? 'browser' : initialLayout === 'wall' ? 'wall' : 'browser');
  const homeLayoutRef = React.useRef(initialLayout === 'wall' ? 'wall' : 'browser');
  const [view, setView] = React.useState(startingResume.view);
  const [zone, setZone] = React.useState(startingResume.zone);
  const [consoleGamesOpen, setConsoleGamesOpen] = React.useState(false);
  const [consoleId, setConsoleId] = React.useState(() => startingResume.consoleId || LOUNGE_CONSOLES.find(console => (Array.isArray(games) ? games : []).some(game => game?.source === 'emulation' && game.retroPlatform === console.id))?.id || LOUNGE_CONSOLES[0].id);
  const [letter, setLetter] = React.useState('');
  const [jumpOpen, setJumpOpen] = React.useState(false);
  const [transitionError, setTransitionError] = React.useState('');
  const [transitionBusy, setTransitionBusy] = React.useState(false);
  const [detailsId, setDetailsId] = React.useState(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [soundOpen, setSoundOpen] = React.useState(false);
  const [guideOpen, setGuideOpen] = React.useState(() => normalizeLoungePreferences(initialPreferences).entryScreen === 'home');
  const [visualOpen, setVisualOpen] = React.useState(false);
  const [themesOpen, setThemesOpen] = React.useState(false);
  const [pageVisible, setPageVisible] = React.useState(() => document.visibilityState !== 'hidden');
  const [audioFocused, setAudioFocused] = React.useState(() => document.hasFocus());
  const [ambienceError, setAmbienceError] = React.useState('');
  const [preferences, setPreferences] = React.useState(() => normalizeLoungePreferences(initialPreferences));
  const renderPreferences = React.useMemo(() => loungeEffectPreferences(preferences), [preferences]);
  const [dismissedNoticeId, setDismissedNoticeId] = React.useState(null);
  const transitionLock = React.useRef(false);
  const focusAfterViewChange = React.useRef(false);
  const focusedGameId = React.useRef(null);
  const surfaceRef = React.useRef(null);
  const browserRef = React.useRef(null);
  const shelfRef = React.useRef(null);
  const scrollCarouselRef = React.useRef(null);
  const lastCenteredGame = React.useRef(null);
  const carouselGeometry = React.useRef(null);
  const recenterCarousel = React.useRef(null);
  const carouselMotion = React.useRef({ frame: 0, target: 0, position: 0, axis: 'left', shelf: null, lastFrameAt: 0 });
  const cardActions = React.useRef({ focus: () => {}, open: () => {} });
  const wheelNavigation = React.useRef({ lastAt: 0, lastStepAt: 0, remainder: 0, selectedId: null });
  const consoleWheel = React.useRef({});
  const consoleWheelHandler = React.useRef(null);
  const ambienceAudioRef = React.useRef(null);
  const detailsRef = React.useRef(null);
  const detailsBrowsed = React.useRef(false);
  const settingsFocusRef = React.useRef(null);
  const soundFocusRef = React.useRef(null);
  const guideFocusRef = React.useRef(null);
  const visualFocusRef = React.useRef(null);
  const themesFocusRef = React.useRef(null);
  const visualButtonRef = React.useRef(null);
  const themesButtonRef = React.useRef(null);
  const homeButtonRef = React.useRef(null);
  const jumpFocusRef = React.useRef(null);
  const preferencesSaveTimer = React.useRef(null);
  const pendingPreferences = React.useRef(null);
  const resumeSaveTimer = React.useRef(null);
  const pendingResume = React.useRef(null);
  const lastSavedResume = React.useRef(startingResume);
  const onResumeChangeRef = React.useRef(onResumeChange);
  onResumeChangeRef.current = onResumeChange;
  const exitRef = React.useRef(null);
  const lastPointerDown = React.useRef(0);
  const lastAction = React.useRef(0);
  const lastFocusedControl = React.useRef(null);
  const safeGames = Array.isArray(games) ? games : EMPTY_GAMES;
  const shownConsoles = React.useMemo(() => shownLoungeConsoles(preferences.hiddenEmulators), [preferences.hiddenEmulators]);
  const resolvedConsoleId = reconcileLoungeConsole(consoleId, shownConsoles);
  const consoleStatuses = React.useMemo(() => new Map(LOUNGE_CONSOLES.map(console => [console.id, emulatorZoneStatus(retroProfiles, safeGames, console.id)])), [retroProfiles, safeGames]);
  React.useEffect(() => {
    if (resolvedConsoleId === consoleId) return;
    setConsoleId(resolvedConsoleId);
    setConsoleGamesOpen(false);
    setDetailsId(null);
    setSelectedId(null);
    setLetter('');
    focusAfterViewChange.current = true;
  }, [resolvedConsoleId, consoleId]);
  const pcGames = React.useMemo(() => safeGames.filter(game => game?.source !== 'emulation'), [safeGames]);
  const viewGames = React.useMemo(() => {
    const sourceGames = zone === 'emulator' ? emulatorZoneGames(safeGames, resolvedConsoleId) : pcGames;
    return view === 'favorites' ? sortLoungeBrowseGames(applyWallFilter(sourceGames, 'favorites', favoriteIds), preferences.browseSort)
      : view === 'recent' ? applyWallFilter(sourceGames, 'recently-played')
        : view === 'most' ? applyWallFilter(sourceGames, 'most-played')
          : view === 'continue' ? continueLoungeGames(sourceGames)
            : view === 'added' ? recentlyAddedLoungeGames(sourceGames)
              : view === 'week' ? recentlyActiveLoungeGames(sourceGames)
                : view === 'progress' ? inProgressLoungeGames(sourceGames) : sortLoungeBrowseGames(sourceGames, preferences.browseSort);
  }, [safeGames, pcGames, favoriteIds, view, zone, resolvedConsoleId, preferences.browseSort]);
  const shownGames = React.useMemo(() => filterLoungeLetter(viewGames, letter), [viewGames, letter]);
  const viewLabel = { all: 'All games', continue: 'Continue playing', favorites: 'Favorites', recent: 'Recently played', week: 'Played this week', progress: 'In progress', added: 'Recently added', most: 'Most played' }[view] || 'this view';
  const activeConsole = shownConsoles.find(console => console.id === resolvedConsoleId) || { id: '', label: 'No visible consoles' };
  const [consoleViewportWidth, setConsoleViewportWidth] = React.useState(() => window.innerWidth);
  React.useEffect(() => {
    const resize = () => setConsoleViewportWidth(window.innerWidth);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const visibleConsoles = visibleLoungeConsoles(activeConsole.id, shownConsoles, loungeConsoleVisibleCount(Math.min(preferences.emulatorCarouselWidth, consoleViewportWidth - 64), preferences.emulatorSize));
  const consoleStatus = consoleStatuses.get(activeConsole.id) || { configured: false, emulatorConfigured: false, count: 0 };
  React.useEffect(() => {
    scrollLoungeStripToControl(surfaceRef.current?.querySelector('[data-lounge-filter][aria-pressed="true"]'));
  }, [view]);
  const selected = shownGames.find((game) => game.id === selectedId) || shownGames[0] || null;
  const selectedIndex = shownGames.findIndex(game => game.id === selected?.id);
  React.useEffect(() => {
    const next = normalizeLoungeResume({ zone, view, consoleId, gameId: selected?.id });
    window.clearTimeout(resumeSaveTimer.current);
    if (Object.keys(next).every(key => next[key] === lastSavedResume.current[key])) { pendingResume.current = null; return; }
    pendingResume.current = next;
    resumeSaveTimer.current = window.setTimeout(() => {
      const value = pendingResume.current;
      pendingResume.current = null;
      if (value) { lastSavedResume.current = value; onResumeChangeRef.current?.(value); }
    }, 360);
  }, [zone, view, consoleId, selected?.id]);
  React.useEffect(() => {
    const flush = () => {
      window.clearTimeout(resumeSaveTimer.current);
      const value = pendingResume.current; pendingResume.current = null;
      if (value) onResumeChangeRef.current?.(value);
    };
    window.addEventListener('neolib:lounge-flush', flush);
    return () => { window.removeEventListener('neolib:lounge-flush', flush); flush(); };
  }, []);
  React.useEffect(() => { wheelNavigation.current.selectedId = selected?.id ?? null; }, [selected?.id]);
  React.useEffect(() => { wheelNavigation.current.remainder = 0; }, [view, letter, layout, zone, consoleId]);
  React.useLayoutEffect(() => {
    if (guideOpen) {
      const motion = carouselMotion.current;
      if (motion.frame) window.cancelAnimationFrame(motion.frame);
      motion.frame = 0;
      motion.lastFrameAt = 0;
      return;
    }
    if (layout !== 'browser') { lastCenteredGame.current = null; return; }
    const shelf = shelfRef.current;
    if (!shelf || !selected) return;
    const centerSelection = () => {
      // Native focus/old hot-reload scroll positions must not compound the
      // composited translation. Input selects cards; only the track travels.
      shelf.scrollLeft = 0; shelf.scrollTop = 0;
      const card = shelf.querySelector('[data-lounge-selected="true"]');
      if (!card) return;
      let geometry = carouselGeometry.current;
      if (!geometry) {
      const vertical = window.getComputedStyle(shelf).flexDirection === 'column';
      const viewport = vertical ? shelf.clientHeight : shelf.clientWidth;
      const cardSize = vertical ? card.offsetHeight : card.offsetWidth;
      const selectedScale = preferences.selectedGameScale / 100;
      const edge = Math.max(12, (viewport - cardSize) / 2 + cardSize * (selectedScale - 1) / 2);
      const crossAxisSize = vertical ? card.offsetWidth : card.offsetHeight;
      const glowInset = renderPreferences.coverGlow === 'off' ? 20 : 72 * Math.max(1, selectedScale) * Math.sqrt(renderPreferences.coverGlowStrength / 100);
      const clearance = carouselCrossAxisClearance(crossAxisSize, selectedScale, !vertical, glowInset);
      const padding = vertical ? `${edge}px ${clearance.before}px` : `${clearance.before}px ${edge}px ${clearance.after}px`;
      if (shelf.style.padding !== padding) shelf.style.padding = padding;
      if (!vertical) {
        const desiredOffset = Number(preferences.carouselVerticalOffset) || 0;
        const browserTop = shelf.offsetParent?.getBoundingClientRect().top ?? 0;
        // Glow clearance belongs to the scroll viewport, not the visible card
        // baseline. Let that transparent tail extend below the screen so it
        // cannot consume the slider's downward travel.
        const unshiftedBottom = browserTop + shelf.offsetTop + shelf.offsetHeight - clearance.after;
        const roomBelow = Math.max(0, Math.floor(window.innerHeight - 16 - unshiftedBottom));
        const unshiftedTop = browserTop + shelf.offsetTop;
        const roomAbove = Math.max(0, Math.floor(unshiftedTop - 16));
        const appliedOffset = `${Math.max(-roomAbove, Math.min(desiredOffset, roomBelow))}px`;
        if (shelf.style.getPropertyValue('--lounge-carousel-applied-offset') !== appliedOffset) shelf.style.setProperty('--lounge-carousel-applied-offset', appliedOffset);
      }
      const track = shelf.querySelector('.lounge-browser-track');
      const offsets = [...shelf.querySelectorAll('[data-lounge-game]')].map(node => {
        const trackOffset = node.offsetParent === track ? (vertical ? track.offsetTop : track.offsetLeft) : 0;
        return trackOffset + (vertical ? node.offsetTop : node.offsetLeft);
      });
      geometry = { vertical, viewport, cardSize, offsets, maximum: Math.max(0, (offsets.at(-1) || 0) + cardSize + edge - viewport) };
      carouselGeometry.current = geometry;
      }
      const { vertical, viewport, cardSize } = geometry;
      const target = centeredCarouselTarget(0, geometry.offsets[selectedIndex] ?? 0, 0, cardSize, viewport);
      const axis = vertical ? 'top' : 'left';
      const destination = Math.max(0, Math.min(target, geometry.maximum));
      const reducedMotion = settingsOpen || soundOpen || visualOpen || themesOpen || preferences.motion === 'off' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const motion = carouselMotion.current;
      const track = shelf.querySelector('.lounge-browser-track');
      if (!track) return;
      motion.track = track;
      const paintPosition = () => {
        motion.track.style.transform = motion.axis === 'top' ? `translate3d(0, ${-motion.position}px, 0)` : `translate3d(${-motion.position}px, 0, 0)`;
      };
      if (motion.shelf !== shelf || motion.axis !== axis) {
        if (motion.frame) window.cancelAnimationFrame(motion.frame);
        motion.frame = 0;
        motion.lastFrameAt = 0;
        motion.shelf = shelf;
        motion.axis = axis;
        motion.position = 0;
      }
      motion.target = destination;
      if (reducedMotion || lastCenteredGame.current == null) {
        if (motion.frame) window.cancelAnimationFrame(motion.frame);
        motion.frame = 0;
        motion.lastFrameAt = 0;
        motion.position = destination;
        shelf.scrollTop = 0; shelf.scrollLeft = 0;
        paintPosition();
      } else if (!motion.frame) {
        const animate = timestamp => {
          if (!motion.shelf?.isConnected || !motion.track?.isConnected) { motion.frame = 0; motion.lastFrameAt = 0; return; }
          // Translate the track with retained fractional progress, without
          // scroll rounding or layout reads in the animation callback.
          const current = motion.position;
          const distance = motion.target - current;
          if (Math.abs(distance) < 0.55) {
            motion.position = motion.target;
            paintPosition();
            motion.frame = 0;
            motion.lastFrameAt = 0;
            return;
          }
          motion.position = glideCarouselPosition(current, motion.target, motion.lastFrameAt ? timestamp - motion.lastFrameAt : 16.7);
          paintPosition();
          motion.lastFrameAt = timestamp;
          motion.frame = window.requestAnimationFrame(animate);
        };
        motion.frame = window.requestAnimationFrame(animate);
      }
      lastCenteredGame.current = selected.id;
    };
    recenterCarousel.current = centerSelection;
    centerSelection();
  }, [layout, selected?.id, preferences.shelfPosition, preferences.coverSize, preferences.gap, preferences.coverAspect, preferences.carouselShowTitles, preferences.shelfWidth, preferences.selectedGameScale, preferences.carouselVerticalOffset, preferences.stageHeight, preferences.motion, preferences.browseSort, renderPreferences.coverGlow, renderPreferences.coverGlowStrength, view, letter, zone, consoleId, shownGames.length, settingsOpen, soundOpen, visualOpen, themesOpen, guideOpen, consoleGamesOpen]);
  React.useLayoutEffect(() => {
    carouselGeometry.current = null;
    recenterCarousel.current?.();
    const invalidate = () => { carouselGeometry.current = null; recenterCarousel.current?.(); };
    const observer = window.ResizeObserver ? new window.ResizeObserver(invalidate) : null;
    if (shelfRef.current) observer?.observe(shelfRef.current);
    window.addEventListener('resize', invalidate);
    return () => { observer?.disconnect(); window.removeEventListener('resize', invalidate); };
  }, [layout, preferences.shelfPosition, preferences.coverSize, preferences.gap, preferences.coverAspect, preferences.carouselShowTitles, preferences.shelfWidth, preferences.selectedGameScale, preferences.carouselVerticalOffset, preferences.stageHeight, preferences.motion, preferences.browseSort, renderPreferences.coverGlow, renderPreferences.coverGlowStrength, view, letter, zone, consoleId, shownGames, settingsOpen, soundOpen, visualOpen, themesOpen, guideOpen, consoleGamesOpen]);
  React.useEffect(() => () => {
    const motion = carouselMotion.current;
    if (motion.frame) window.cancelAnimationFrame(motion.frame);
    motion.frame = 0;
    motion.lastFrameAt = 0;
  }, []);
  const soundsActive = preferences.browseSoundEnabled && soundsEnabled && !resting && pageVisible && preferences.browseSoundVolume > 0;
  React.useEffect(() => {
    if (!soundsActive || preferences.browseSoundStyle !== 'samples') stopLoungeSamples();
    return () => stopLoungeSamples();
  }, [soundsActive, preferences.browseSoundStyle]);
  const ambienceUrl = loungeAmbienceUrl(preferences);
  const ambienceActive = Boolean(ambienceUrl) && soundsEnabled && !resting && !idlePowerSaving && !transitionBusy && pageVisible && audioFocused && preferences.ambienceVolume > 0;
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
  const previewSound = kind => {
    if (!soundsActive) return;
    const volume = kind === 'move' ? moveVolume : preferences.browseSoundVolume;
    if (preferences.browseSoundStyle === 'samples') void playLoungeSample(kind, volume, preferences.loungeSamples);
    else playLoungeCue(kind === 'explore' ? 'confirm' : kind, volume, preferences.browseSoundStyle);
  };
  const previewPickerSound = (kind, sampleId) => {
    if (sampleId === undefined) { previewSound(kind); return; }
    if (!soundsEnabled || resting || !pageVisible || !audioFocused || preferences.browseSoundVolume <= 0) return;
    void previewLoungeSample(kind, sampleId, preferences.browseSoundVolume);
  };
  const selectGame = id => {
    if (selected?.id === id) return;
    setSelectedId(id);
    if (soundsActive && moveVolume > 0) previewSound('move');
  };
  const detailsGame = safeGames.find(game => game.id === detailsId) || null;
  const detailsIndex = shownGames.findIndex(game => game.id === detailsId);
  const requestedTheme = preferences.specialTheme === 'theme' ? preferences.desktopThemeOverride : '';
  const effectiveTheme = requestedTheme && (stockThemeManifest(requestedTheme) || customThemeManifest(requestedTheme)) ? requestedTheme : theme;
  const loungeStyle = (customThemeManifest(effectiveTheme) || stockThemeManifest(effectiveTheme))?.lounge || {};
  const themeLevel = themeSettings.effectsLevelByTheme?.[effectiveTheme] ?? themeSettings.effectsLevel ?? 2;
  const loungeLevel = preferences.motion === 'off' ? 0 : preferences.fxLevel !== 'theme' ? preferences.fxLevel : themeLevel === 0 ? 0 : Math.min(4, Math.max(0, themeLevel + (loungeStyle.fxBoost ?? 0)));
  const fxPreferences = React.useMemo(() => loungeEffectPreferences(preferences, loungeLevel), [preferences, loungeLevel]);
  const fxEnabled = !resting && !idlePowerSaving && pageVisible && loungeLevel > 0;
  const editingOpen = settingsOpen || soundOpen || visualOpen || themesOpen || guideOpen;
  const ambientFxEnabled = fxEnabled && !editingOpen;
  const loungeParticleStyle = preferences.particleStyle === 'theme' ? loungeSceneParticleStyle(preferences.specialTheme) : preferences.particleStyle;
  const loungeThemeSettings = React.useMemo(() => ({ ...themeSettings, motionCadence: preferences.motion === 'subtle' ? 'calm' : themeSettings.motionCadence, effectsLevelByTheme: { ...themeSettings.effectsLevelByTheme, [effectiveTheme]: loungeLevel } }), [themeSettings, preferences.motion, effectiveTheme, loungeLevel]);
  const visualStyle = {
    '--lounge-emulator-size': preferences.emulatorSize / 100,
    '--lounge-emulator-width': `${preferences.emulatorCarouselWidth}px`,
    '--lounge-console-columns': visibleConsoles.map(console => Math.abs(console.offset) < 2 ? '1.2fr' : '1fr').join(' '),
    ...(preferences.specialTheme === 'theme' ? themePaletteStyle(effectiveTheme) : {}),
    ...(stockThemeManifest(preferences.specialTheme) ? themePaletteStyle(preferences.specialTheme) : {}),
    ...loungeFramePaletteStyle(preferences.frameColor, preferences.frameCustomColor),
    '--lounge-glow': ambientFxEnabled ? (loungeStyle.focusGlow ?? 0.75) : 0.2,
    '--lounge-card-glow-gain': fxPreferences.coverGlowStrength / 100,
    '--lounge-card-glow-radius': Math.sqrt(fxPreferences.coverGlowStrength / 100),
    '--lounge-card-glow-near-alpha': `${Math.min(100, fxPreferences.coverGlowStrength * 0.88)}%`,
    '--lounge-card-glow-far-alpha': `${Math.min(100, fxPreferences.coverGlowStrength * 0.62)}%`,
    '--lounge-card-glow-visibility': fxPreferences.coverGlowStrength === 0 ? 'hidden' : 'visible',
    '--lounge-flow-opacity': ambientFxEnabled ? (loungeStyle.flowOpacity ?? 0.36) * fxPreferences.themeFlow / 100 : 0,
    '--lounge-atmosphere-opacity': preferences.atmosphereOpacity / 100,
    '--lounge-light-bloom': fxPreferences.lightBloom / 100,
    '--lounge-vignette': fxPreferences.vignette / 100,
    '--lounge-vignette-blur': `${fxPreferences.vignette * 0.9}px`,
    '--lounge-vignette-alpha': fxPreferences.vignette / 100 * 0.32,
    '--lounge-wave-size': `${150 + preferences.waveScale}%`,
    '--lounge-flow-seconds': `${(loungeStyle.flowSeconds ?? 18) * (preferences.motion === 'subtle' ? 1.8 : 1)}s`,
    '--lounge-panel-opacity': preferences.panelOpacity / 100,
    '--lounge-shelf-opacity': preferences.shelfOpacity / 100,
    '--lounge-shelf-edge-opacity': preferences.shelfOpacity / 100 * 0.65,
    '--lounge-shelf-shadow-opacity': preferences.shelfOpacity / 100 * 0.16,
    '--lounge-preview-panel-opacity': preferences.previewPanelOpacity / 100,
    '--lounge-preview-box-width': String(preferences.previewWidth) + '%',
    '--lounge-preview-box-height': String(preferences.previewBoxHeight) + 'px',
    '--lounge-preview-offset': String(preferences.previewVerticalOffset) + 'px',
    '--lounge-carousel-offset': String(preferences.carouselVerticalOffset) + 'px',
    '--lounge-selected-cover-scale': String(preferences.selectedGameScale / 100),
    '--lounge-preview-radius': String(preferences.previewCornerRadius) + 'px',
    '--lounge-preview-text-scale': preferences.previewTextScale / 100,
    '--lounge-preview-cover-scale': preferences.previewCoverScale / 100,
    '--lounge-preview-justify': { left: 'flex-start', center: 'center', right: 'flex-end' }[preferences.previewPosition],
    '--lounge-art-opacity': loungeStyle.artOpacity ?? 0.75,
    '--lounge-card-lift': `${loungeStyle.cardLift ?? 4}px`,
    '--lounge-cover-size': `${preferences.coverSize}px`,
    '--lounge-card-gap': `${preferences.gap}px`,
    '--lounge-card-aspect': preferences.coverAspect === 'tall' ? '0.6 / 1' : '2 / 3',
    '--lounge-shelf-width': `${preferences.shelfWidth}px`,
    '--lounge-side-cover-size': `${Math.min(preferences.coverSize, Math.floor((preferences.shelfWidth - 32) / 1.45))}px`,
    '--lounge-wall-cover-size': `${preferences.wallCoverSize}px`,
  };
  const changeLayout = (next) => {
    if (zone === 'emulator') {
      homeLayoutRef.current = next;
      onLayoutChange?.(next);
      return;
    }
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
  const preferencesCallbackRef = React.useRef(onPreferencesChange);
  const piePreferenceWriter = React.useRef(null);
  piePreferenceWriter.current = playtimePieFilters => changePreferences({ ...preferences, playtimePieFilters });
  const changePlaytimePieFilters = React.useCallback(filters => piePreferenceWriter.current?.(filters), []);
  preferencesCallbackRef.current = onPreferencesChange;
  React.useEffect(() => {
    const flush = () => {
      window.clearTimeout(preferencesSaveTimer.current);
      const value = pendingPreferences.current; pendingPreferences.current = null;
      if (value) preferencesCallbackRef.current?.(value);
    };
    window.addEventListener('neolib:lounge-flush', flush);
    return () => { window.removeEventListener('neolib:lounge-flush', flush); flush(); };
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
    if (!guideOpen) surfaceRef.current?.querySelector('[data-lounge-selected="true"], [data-lounge-game], [data-controller-close]')?.focus({ preventScroll: true });
  }, []);
  React.useEffect(() => {
    if (selectedId && !shownGames.some((game) => game.id === selectedId)) setSelectedId(null);
  }, [shownGames, selectedId]);
  React.useEffect(() => {
    if (!focusAfterViewChange.current) return;
    focusAfterViewChange.current = false;
    const selector = zone === 'emulator' && !consoleGamesOpen ? '[data-lounge-console][aria-pressed="true"]' : '[data-lounge-game][data-lounge-selected="true"]';
    (surfaceRef.current?.querySelector(selector) || surfaceRef.current?.querySelector('[data-lounge-collapse-games], [data-lounge-filter][aria-pressed="true"]'))?.focus({ preventScroll: true });
  }, [view, layout, letter, zone, consoleId, consoleGamesOpen]);
  React.useEffect(() => {
    if (focusedGameId.current == null || shownGames.some((game) => game.id === focusedGameId.current)) return;
    focusedGameId.current = null;
    if (document.hasFocus() && !surfaceRef.current?.contains(document.activeElement)) {
      surfaceRef.current?.querySelector('[data-lounge-selected="true"], [data-lounge-filter][aria-pressed="true"]')?.focus({ preventScroll: true });
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
  const openDetails = React.useCallback((id) => { detailsRef.current = document.activeElement; detailsBrowsed.current = false; setDetailsId(id); }, []);
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
  const openSound = () => { soundFocusRef.current = document.activeElement; setSoundOpen(true); };
  const closeSound = () => { flushPreferences(); setSoundOpen(false); window.requestAnimationFrame(() => soundFocusRef.current?.focus?.()); };
  const openGuide = () => { guideFocusRef.current = document.activeElement; setGuideOpen(true); };
  const closeGuide = () => { flushPreferences(); setGuideOpen(false); window.requestAnimationFrame(() => (guideFocusRef.current || homeButtonRef.current)?.focus?.()); };
  const openVisual = () => { visualFocusRef.current = document.activeElement; setVisualOpen(true); };
  const closeVisual = () => { flushPreferences(); setVisualOpen(false); window.requestAnimationFrame(() => visualFocusRef.current?.focus?.()); };
  const openThemes = () => { themesFocusRef.current = document.activeElement; setThemesOpen(true); };
  const closeThemes = () => { flushPreferences(); setThemesOpen(false); window.requestAnimationFrame(() => themesFocusRef.current?.focus?.()); };
  const tuneVisualsFromThemes = () => { flushPreferences(); visualFocusRef.current = themesButtonRef.current; setThemesOpen(false); setVisualOpen(true); };
  const openVisualFromGuide = () => { flushPreferences(); visualFocusRef.current = visualButtonRef.current; setGuideOpen(false); setVisualOpen(true); };
  const browseFromGuide = filter => { flushPreferences(); setGuideOpen(false); focusAfterViewChange.current = true; setLetter(''); setView(filter); if (zone === 'emulator') { chooseZone('home'); homeLayoutRef.current = 'wall'; setLayout('wall'); onLayoutChange?.('wall'); } else changeLayout('wall'); window.requestAnimationFrame(() => surfaceRef.current?.querySelector('[data-lounge-selected="true"], [data-lounge-game], [data-lounge-filter][aria-pressed="true"]')?.focus()); };
  const openGameFromGuide = id => {
    flushPreferences();
    guideFocusRef.current = guideFocusRef.current || document.activeElement;
    detailsRef.current = guideFocusRef.current;
    detailsBrowsed.current = false;
    setGuideOpen(false);
    if (zone === 'emulator') chooseZone('home');
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
  const chooseZone = next => {
    if (zone === next) return;
    setDetailsId(null);
    setLetter('');
    setSelectedId(null);
    setZone(next);
    setConsoleGamesOpen(false);
    if (next === 'emulator') { homeLayoutRef.current = layout; setLayout('browser'); }
    else setLayout(homeLayoutRef.current);
    focusAfterViewChange.current = true;
  };
  const chooseConsole = id => {
    if (!shownConsoles.some(console => console.id === id)) return;
    if (id === consoleId) return;
    setConsoleGamesOpen(false);
    setDetailsId(null);
    setSelectedId(null);
    setLetter('');
    setConsoleId(id);
    focusAfterViewChange.current = true;
  };
  const openConsoleGames = id => {
    chooseConsole(id);
    setView('all');
    setLetter('');
    setConsoleGamesOpen(true);
    focusAfterViewChange.current = true;
  };
  const collapseConsoleGames = () => {
    setConsoleGamesOpen(false);
    setDetailsId(null);
    window.requestAnimationFrame(() => surfaceRef.current?.querySelector('[data-lounge-console][aria-pressed="true"]')?.focus({ preventScroll: true }));
  };
  const openJump = () => { jumpFocusRef.current = document.activeElement; setJumpOpen(true); };
  const closeJump = () => { setJumpOpen(false); window.requestAnimationFrame(() => jumpFocusRef.current?.focus?.()); };
  const chooseLetter = next => { focusAfterViewChange.current = true; setSelectedId(null); setLetter(next); setJumpOpen(false); if (next === letter) window.requestAnimationFrame(() => { focusAfterViewChange.current = false; surfaceRef.current?.querySelector('[data-lounge-selected="true"], [data-lounge-game], [data-lounge-filter][aria-pressed="true"]')?.focus(); }); };
  const scrollCarousel = event => {
    if (event.ctrlKey || shownGames.length < 2) return;
    const state = wheelNavigation.current;
    const now = Date.now();
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    const pixels = delta * (event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? 240 : 1);
    if (!pixels) return;
    event.preventDefault();
    event.stopPropagation();
    state.remainder = Math.max(-360, Math.min(360, (now - state.lastAt > 150 ? 0 : state.remainder) + pixels));
    state.lastAt = now;
    if (Math.abs(state.remainder) < 64 || now - state.lastStepAt < 48) return;
    const direction = Math.sign(state.remainder);
    state.remainder -= direction * 64;
    state.lastStepAt = now;
    const currentIndex = shownGames.findIndex(game => game.id === (state.selectedId ?? selected?.id));
    const nextIndex = Math.max(0, Math.min(shownGames.length - 1, currentIndex + direction));
    const nextGame = shownGames[nextIndex];
    if (!nextGame || nextIndex === currentIndex) { state.remainder = 0; return; }
    state.selectedId = nextGame.id;
    const nextButton = shelfRef.current?.firstElementChild?.children[nextIndex];
    if (nextButton) nextButton.focus({ preventScroll: true });
    selectGame(nextGame.id);
  };
  scrollCarouselRef.current = scrollCarousel;
  consoleWheelHandler.current = event => {
    if (zone !== 'emulator' || jumpOpen || detailsId || settingsOpen || soundOpen || visualOpen || themesOpen || guideOpen) return;
    const inDock = event.target?.closest?.('.lounge-console-dock');
    if (!inDock && (consoleGamesOpen || event.target?.closest?.('.lounge-browse-dock, .lounge-top-nav, .lounge-hints, input, textarea, select'))) return;
    const result = advanceConsoleWheel(consoleWheel.current, event, Date.now());
    consoleWheel.current = result.state;
    if (!result.handled) return;
    event.preventDefault(); event.stopPropagation();
    if (result.direction) {
      const next = nextLoungeConsole(consoleWheel.current.consoleId || consoleId, result.direction, shownConsoles);
      consoleWheel.current.consoleId = next;
      chooseConsole(next);
    }
  };
  React.useEffect(() => { consoleWheel.current.consoleId = consoleId; }, [consoleId]);
  React.useEffect(() => {
    consoleWheel.current = { consoleId };
    const surface = surfaceRef.current;
    if (zone !== 'emulator' || !surface) return undefined;
    const onWheel = event => consoleWheelHandler.current?.(event);
    surface.addEventListener('wheel', onWheel, { passive: false });
    return () => surface.removeEventListener('wheel', onWheel);
  }, [zone]);
  React.useEffect(() => {
    const browser = browserRef.current;
    if (!browser) return undefined;
    const onWheel = event => { if (!event.target?.closest?.('[data-testid="lounge-widget-area"]')) scrollCarouselRef.current?.(event); };
    browser.addEventListener('wheel', onWheel, { passive: false });
    return () => browser.removeEventListener('wheel', onWheel);
  }, [layout, shownGames.length > 0, zone, consoleGamesOpen]);

  const onKeyDown = (event) => {
    if (zone === 'emulator' && consoleGamesOpen && !jumpOpen && !detailsId && !settingsOpen && !soundOpen && !visualOpen && !themesOpen && !guideOpen && ((event.key === 'ArrowDown' && event.target?.matches?.('[data-lounge-game]')) || event.key === 'Escape')) {
      event.preventDefault(); event.stopPropagation(); previewSound('back'); collapseConsoleGames(); return;
    }
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); previewSound('back'); if (jumpOpen) closeJump(); else if (visualOpen) closeVisual(); else if (themesOpen) closeThemes(); else if (settingsOpen) closeSettings(); else if (soundOpen) closeSound(); else if (detailsId) closeDetails(); else if (guideOpen) closeGuide(); else if (zone === 'emulator') chooseZone('home'); else requestExit(); return; }
    const pickerScope = surfaceRef.current?.querySelector('[data-testid="lounge-sample-picker"]');
    if (event.key === 'Tab') {
      const scope = pickerScope || (jumpOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-jump-panel"]') : visualOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-visual-builder"]') : themesOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-theme-gallery"]') : settingsOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-settings-panel"]') : soundOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-sound-panel"]') : detailsId ? surfaceRef.current?.querySelector('[data-testid="lounge-game-panel"]') : guideOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-guide-panel"]') : surfaceRef.current);
      const targets = [...(scope?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]') || [])].filter(element => element.getClientRects().length);
      if (event.shiftKey && document.activeElement === targets[0]) { event.preventDefault(); targets.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === targets.at(-1)) { event.preventDefault(); targets[0]?.focus(); }
      return;
    }
    if (event.target?.matches?.('input, select, textarea, [role="slider"]')) return;
    if (zone === 'emulator' && !detailsId && !settingsOpen && !soundOpen && !visualOpen && !themesOpen && !guideOpen && (event.key === 'PageUp' || event.key === 'PageDown')) {
      event.preventDefault();
      chooseConsole(nextLoungeConsole(consoleId, event.key === 'PageUp' ? -1 : 1, shownConsoles));
      return;
    }
    const direction = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[event.key];
    if (!direction) return;
    const targets = controllerFocusTargets(pickerScope || (jumpOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-jump-panel"]') : visualOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-visual-builder"]') : themesOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-theme-gallery"]') : settingsOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-settings-panel"]') : soundOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-sound-panel"]') : detailsId ? surfaceRef.current?.querySelector('[data-testid="lounge-game-panel"]') : guideOpen ? surfaceRef.current?.querySelector('[data-testid="lounge-guide-panel"]') : surfaceRef.current));
    const route = !pickerScope && !jumpOpen && !visualOpen && !themesOpen && !settingsOpen && !soundOpen && !detailsId && !guideOpen ? loungeControllerRoute(surfaceRef.current, document.activeElement, direction, targets) : null;
    if (route?.click) { event.preventDefault(); route.click.click(); return; }
    const next = route ? route.focus : nextControllerFocus(targets, document.activeElement, direction);
    if (next) { event.preventDefault(); const shelfGame = layout === 'browser' && next.matches?.('.lounge-browser-card'); next.focus({ preventScroll: true }); if (!shelfGame && !scrollLoungeStripToControl(next)) next.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }); }
  };

  cardActions.current.focus = id => { focusedGameId.current = id; selectGame(id); };
  cardActions.current.open = openDetails;
  const coverButton = (game, index) => <LoungeGameCard key={game.id} game={game} layout={layout} selected={selected?.id === game.id} distance={layout === 'browser' ? Math.min(3, Math.abs(index - selectedIndex)) : undefined} coverFrame={preferences.coverFrame} frameColor={preferences.frameColor} updateAvailable={updateLedger[game.id]?.status === 'available'} actions={cardActions} />;

  return <section ref={surfaceRef} data-testid="neo-lounge" data-controller-surface="lounge" data-lounge-zone={zone} data-theme={effectiveTheme} data-lounge-layout={layout} data-lounge-carousel-titles={preferences.carouselShowTitles ? 'true' : 'false'} data-lounge-scene={preferences.specialTheme} data-lounge-control-size={preferences.controlSize} data-lounge-motion={preferences.motion} data-lounge-fx={ambientFxEnabled ? 'on' : 'off'} data-lounge-cover-glow={renderPreferences.coverGlow} data-lounge-cover-frame={preferences.coverFrame} data-lounge-editing={editingOpen ? 'true' : undefined} data-lounge-paused={!pageVisible || resting ? 'true' : undefined} role="dialog" aria-modal="true" aria-busy={transitionBusy} aria-label="NEO Lounge" aria-describedby="lounge-control-help" onKeyDown={onKeyDown} onPointerDownCapture={() => { lastPointerDown.current = Date.now(); }} onFocusCapture={event => { const button = event.target.closest?.('button'); if (!button || button === lastFocusedControl.current) return; lastFocusedControl.current = button; if (!button.hasAttribute('data-lounge-game') && Date.now() - Math.max(lastPointerDown.current, lastAction.current) > 250) previewSound('move'); }} onClickCapture={event => { const button = event.target.closest?.('button'); if (!button || button.disabled || button.hasAttribute('data-lounge-sound-preview')) return; lastAction.current = Date.now(); previewSound(button.matches('[data-controller-close], [aria-label^="Dismiss"]') ? 'back' : button.matches('[data-lounge-game], .lounge-stage-action') ? 'explore' : 'confirm'); }} className="fixed inset-0 z-[9000] isolate flex flex-col overflow-hidden bg-[rgb(var(--surface))] text-ink" style={visualStyle}>
    <audio ref={ambienceAudioRef} src={ambienceUrl || undefined} loop preload="none" aria-hidden="true" onError={() => { if (ambienceUrl) setAmbienceError('This ambience file could not be played. Choose another MP3.'); }} />
    <LoungeLivingBackdrop theme={effectiveTheme} game={preferences.backdropMode === 'game' ? selected : null} loungeLevel={loungeLevel} motion={preferences.motion} active={ambientFxEnabled} flowOpacity={loungeStyle.flowOpacity} flowSeconds={loungeStyle.flowSeconds} preferences={preferences} />
    {import.meta.env.DEV && <LoungeFrameDiagnostics browserRef={browserRef} />}
    {preferences.specialTheme === 'theme' && <LoungeThemeAmbience theme={effectiveTheme} settings={loungeThemeSettings} game={preferences.backdropMode === 'game' ? selected : null} resting={resting || idlePowerSaving || !pageVisible || editingOpen} particlesEnabled={preferences.particleStyle === 'theme'} loungeMode />}
    {ambientFxEnabled && <LoungeParticleLayer styleId={loungeParticleStyle} level={loungeLevel} motion={preferences.motion} amount={preferences.particleAmount} randomness={preferences.particleRandomness} color={preferences.particleColor} opacity={preferences.particleOpacity} size={preferences.particleSize} trail={preferences.particleTrail} glow={preferences.particleGlow} speed={preferences.particleSpeed} />}
    <div className="lounge-flow pointer-events-none absolute inset-0" aria-hidden="true" />
    <header className="lounge-main-header relative z-30 flex shrink-0 flex-col items-start gap-2 border-b border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.86)] px-4 py-2 sm:px-8">
      <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[rgb(var(--accent))]">NEO Lounge</p><h1 className="text-lg font-bold sm:text-2xl">Your games, from the couch</h1>{resting && <span role="status" title={restReason} className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--accent)/0.45)] bg-[rgb(var(--panel)/0.8)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--accent-2))]"><Moon size={12} aria-hidden="true" /> Rest active · background work paused</span>}</div>
      <nav aria-label="Lounge navigation" className="lounge-top-nav flex flex-wrap items-center gap-2">
        <LoungeTopButton ref={homeButtonRef} Icon={House} label="Home" accent="100 213 255" homeZone pressed={guideOpen} onClick={() => zone === 'emulator' ? chooseZone('home') : openGuide()} />
        <LoungeTopButton Icon={Settings2} label="Settings" accent="255 199 111" testId="lounge-settings-toggle" pressed={settingsOpen} onClick={openSettings} />
        <LoungeTopButton Icon={Music2} label="Sound & Music" accent="255 133 203" testId="lounge-sound-toggle" pressed={soundOpen} onClick={openSound} />
        <LoungeTopButton ref={themesButtonRef} Icon={PanelsTopLeft} label="Themes" accent="172 143 255" pressed={themesOpen} onClick={openThemes} />
        <LoungeTopButton ref={visualButtonRef} Icon={Sparkles} label="Visuals" accent="104 230 185" pressed={visualOpen} onClick={openVisual} />
        <LoungeTopButton ref={exitRef} Icon={ArrowLeft} label="Back to launcher" accent="255 143 161" controllerClose disabled={transitionBusy} onClick={requestExit} />
      </nav>
    </header>
    <div data-console-games-open={consoleGamesOpen ? 'true' : 'false'} className="lounge-main-content relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-8 sm:py-5">
      <div className="lounge-browse-dock" aria-label="Game browsing controls">
      <div data-testid="lounge-source-pane" data-lounge-source={zone} className="lounge-source-pane mb-2 flex max-w-full shrink-0 flex-wrap items-center gap-2 self-start rounded-2xl border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--panel)/0.7)] p-2">
        <div className="lounge-source-tabs flex items-center gap-1" role="tablist" aria-label="Game source">
          <button type="button" role="tab" data-lounge-source="pc" aria-selected={zone === 'home'} aria-label="PC games" onClick={() => chooseZone('home')} className="lounge-source-tab lounge-nav-button"><Monitor size={19} aria-hidden="true" /><span>PC</span></button>
          <button type="button" role="tab" data-testid="lounge-emulator-zone-toggle" data-lounge-source="emulator" aria-selected={zone === 'emulator'} aria-label="Emulator games" onClick={() => chooseZone('emulator')} className="lounge-source-tab lounge-nav-button"><Gamepad2 size={19} aria-hidden="true" /><span>Emulator</span></button>
        </div>
      </div>
        {zone === 'emulator' && <div className="lounge-console-dock rounded-2xl border border-[rgb(var(--border)/0.78)]"><div className="lounge-console-picker min-w-0">
          {/* Hidden command targets retain controller wraparound without visible arrows or tab stops. */}
          <button type="button" hidden tabIndex={-1} aria-hidden="true" data-lounge-console-step="left" onClick={() => chooseConsole(nextLoungeConsole(consoleId, -1, shownConsoles))} />
          <nav data-testid="lounge-console-strip" aria-label="Emulator consoles" className="lounge-console-strip lounge-console-window">
            {visibleConsoles.map(console => { const status = consoleStatuses.get(console.id); return <button key={console.id} type="button" data-lounge-console data-emulator-configured={status.emulatorConfigured ? 'true' : 'false'} data-offset={console.offset} aria-pressed={resolvedConsoleId === console.id} onClick={() => openConsoleGames(console.id)} aria-label={`${console.label}, ${status.count} game${status.count === 1 ? '' : 's'}${status.configured ? '' : ', setup needed'}`} className="lounge-console-tab lounge-nav-button" style={{ '--lounge-icon-color': status.emulatorConfigured ? CONSOLE_ACCENTS[console.id] || '154 206 255' : '161 170 183' }}><ConsoleLogo id={console.id} label={console.label} shortLabel={console.shortLabel} /><span className="lounge-console-tab__label" aria-hidden="true">{console.label}</span></button>; })}
            {!shownConsoles.length && <div className="col-span-full flex flex-col items-center gap-2 p-3 text-sm text-muted"><span>All consoles are hidden.</span><button type="button" onClick={openSettings} className="lounge-nav-button rounded-lg border border-[rgb(var(--border))] px-4 py-2 text-ink">Choose visible emulators</button></div>}
          </nav>
          <button type="button" hidden tabIndex={-1} aria-hidden="true" data-lounge-console-step="right" onClick={() => chooseConsole(nextLoungeConsole(consoleId, 1, shownConsoles))} />
        </div></div>}
      {zone === 'home' && preferences.specialTheme !== 'theme' && preferences.quickLinks.length > 0 && <nav aria-label="Lounge top shortcuts" className="lounge-scene-shortcuts relative z-10 mb-2 flex max-w-full shrink-0 items-center gap-2 overflow-x-auto py-2">{preferences.quickLinks.map(id => { const Icon = QUICK_LINK_ICONS[id]; return <button key={id} type="button" aria-label={LOUNGE_QUICK_LINKS[id]} aria-pressed={id === 'visual' ? visualOpen : view === id} onClick={() => id === 'visual' ? openVisual() : chooseView(id)} className="lounge-top-choice lounge-scene-shortcut lounge-nav-button" style={{ '--lounge-icon-color': FILTER_ACCENTS[id] || '141 203 255' }}><Icon size={25} aria-hidden="true" /><span className="lounge-top-choice__label" aria-hidden="true">{LOUNGE_QUICK_LINKS[id]}</span></button>; })}</nav>}
      <div className="lounge-toolbar mb-3 flex w-fit max-w-full self-start items-center gap-2 rounded-2xl border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--panel)/0.6)] p-1.5">{zone === 'home' && <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Lounge layout">
        {[['wall', 'Wall'], ['browser', 'Game browser']].map(([id, label]) => <button key={id} type="button" data-lounge-layout-button aria-pressed={layout === id} onClick={() => changeLayout(id)} aria-label={label} className="lounge-top-choice lounge-mode-toggle lounge-nav-button" style={{ '--lounge-icon-color': FILTER_ACCENTS[id] }}>{id === 'wall' ? <Grid2X2 size={25} aria-hidden="true" /> : <PanelsTopLeft size={25} aria-hidden="true" />}<span className="lounge-top-choice__label" aria-hidden="true">{label}</span></button>)}
      </div>}<nav aria-label="Lounge game filters" className="lounge-filter-strip flex min-w-0 flex-none max-w-full items-center gap-1 overflow-x-auto whitespace-nowrap">{[['all', 'All games', Grid2X2], ['continue', 'Continue playing', Play], ['favorites', 'Favorites', Heart], ['recent', 'Recently played', History], ['week', 'Played this week', Clock3], ['progress', 'In progress', Play], ['added', 'Recently added', CalendarDays], ['most', 'Most played', Trophy]].filter(([id]) => showLoungeBrowseFilter(id, preferences.hiddenBrowseFilters, view === id)).map(([id, label, Icon]) => <button key={id} type="button" data-lounge-filter aria-label={label} aria-pressed={view === id} onClick={() => chooseView(id)} className="lounge-top-choice lounge-filter-toggle lounge-nav-button" style={{ '--lounge-icon-color': FILTER_ACCENTS[id] }}><Icon size={25} aria-hidden="true" /><span className="lounge-top-choice__label" aria-hidden="true">{label}</span></button>)}{showLoungeBrowseFilter('az', preferences.hiddenBrowseFilters, Boolean(letter) || jumpOpen) && <button type="button" onClick={openJump} aria-label={letter ? `Jump to letter, showing ${letter}` : 'Jump to a game letter'} aria-pressed={Boolean(letter)} className="lounge-top-choice lounge-filter-toggle lounge-nav-button" style={{ '--lounge-icon-color': FILTER_ACCENTS.az }}><ListFilter size={25} aria-hidden="true" /><span className="lounge-top-choice__label" aria-hidden="true">{letter ? `${letter} · ${shownGames.length}` : 'A–Z'}</span></button>}</nav></div>
      </div>
      <LoungeControlHints controllerEnabled={controllerEnabled} zone={zone} />
      {zone === 'emulator' && consoleGamesOpen && <button type="button" data-lounge-collapse-games onClick={collapseConsoleGames} className="lounge-console-collapse lounge-nav-button">↓ Back to consoles</button>}
      {(zone !== 'emulator' || consoleGamesOpen) && <div className="lounge-game-content">
      {shownGames.length ? layout === 'browser' ? <div ref={browserRef} className="lounge-browser relative flex min-h-0 gap-4 pb-5" data-shelf-position={zone === 'emulator' ? 'bottom' : preferences.shelfPosition} style={{ '--lounge-stage-height': `${preferences.stageHeight}px` }}>
        <div ref={shelfRef} className="lounge-browser-shelf relative z-10 flex min-h-0 shrink-0 overflow-auto" aria-label="Game shelf"><div className="lounge-browser-track flex shrink-0">{shownGames.map(coverButton)}</div></div>
        {preferences.specialTheme !== 'theme' || preferences.widgetAreaEnabled || preferences.previewPosition.startsWith('bottom-') ? <LoungeWidgetArea favoriteIds={favoriteIds} onPlaytimePieFiltersChange={changePlaytimePieFilters} game={selected} index={shownGames.findIndex(game => game.id === selected?.id)} total={shownGames.length} preferences={zone === 'emulator' ? { ...preferences, shelfPosition: 'bottom' } : preferences} updateLedger={updateLedger} onOpenDetails={openDetails} games={safeGames} resting={resting || idlePowerSaving} /> : <LoungeBrowserStage game={selected} index={shownGames.findIndex(game => game.id === selected?.id)} total={shownGames.length} preferences={preferences} updateLedger={updateLedger} onOpenDetails={openDetails} />}
      </div> : <div className="lounge-wall-grid grid px-2 pb-5 pt-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, var(--lounge-wall-cover-size)), 1fr))' }}>{shownGames.map(coverButton)}</div> : zone === 'emulator' ? <section data-lounge-empty data-testid="lounge-emulator-empty" aria-live="polite" className="lounge-empty-state relative isolate flex min-h-72 flex-col items-start justify-center overflow-hidden rounded-3xl border border-[rgb(var(--accent)/0.4)] px-7 py-9 sm:px-12"><div aria-hidden="true" className="lounge-empty-orb pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full" /><span className="relative grid h-16 w-16 place-items-center rounded-2xl border border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent-2))]"><Gamepad2 size={32} /></span><p className="relative mt-5 text-xs font-black uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">{activeConsole.label}</p><h2 className="relative mt-1 text-2xl font-black sm:text-3xl">{consoleStatus.configured ? 'No imported games yet' : 'This console needs setup'}</h2><p className="relative mt-2 max-w-xl text-sm leading-relaxed text-muted">{consoleStatus.configured ? 'Return to the launcher and open Wizard → Retro Library → Manage profiles to scan and review games for this console.' : 'Return to the launcher and open Wizard → Retro Library → Manage profiles. Choose your installed emulator and ROM folder, then scan and review your own games.'} NEO-LIB does not supply emulators, BIOS files or ROMs.</p><div className="relative mt-6 flex flex-wrap gap-2"><button type="button" onClick={requestExit} className="lounge-nav-button inline-flex min-h-12 items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--accent)/0.2)] px-5 text-sm font-black"><ArrowLeft size={18} /> Return to launcher</button><button type="button" onClick={() => chooseZone('home')} className="lounge-nav-button inline-flex min-h-12 items-center gap-2 rounded-xl border border-[rgb(var(--border))] px-5 text-sm font-bold"><House size={18} /> Lounge Home</button></div></section> : <section data-lounge-empty aria-live="polite" className="lounge-empty-state relative isolate flex min-h-72 flex-col items-start justify-center overflow-hidden rounded-3xl border border-[rgb(var(--accent)/0.4)] px-7 py-9 sm:px-12"><div aria-hidden="true" className="lounge-empty-orb pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full" /><span className="relative grid h-16 w-16 place-items-center rounded-2xl border border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent-2))]"><Gamepad2 size={32} /></span><p className="relative mt-5 text-xs font-black uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">NEO Lounge</p><h2 className="relative mt-1 text-2xl font-black sm:text-3xl">{!safeGames.length ? 'Your Lounge is waiting' : letter ? `No ${letter} games here` : `No ${viewLabel.toLowerCase()} games yet`}</h2><p className="relative mt-2 max-w-xl text-sm leading-relaxed text-muted">{!safeGames.length ? 'Add games in your desktop Library, then come back to browse them from the couch.' : letter ? `This letter has no games in ${viewLabel}. Clear the letter to see the full view.` : `${viewLabel} has no matches in your unlocked library. Your other games are still here.`}</p><button type="button" data-controller-close={!safeGames.length ? true : undefined} onClick={!safeGames.length ? requestExit : letter ? () => { focusAfterViewChange.current = true; setLetter(''); } : () => chooseView('all')} className="lounge-nav-button relative mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--accent)/0.2)] px-5 text-sm font-black text-ink focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgb(var(--accent))]">{!safeGames.length ? <ArrowLeft size={19} /> : letter ? <ListFilter size={19} /> : <Grid2X2 size={19} />}{!safeGames.length ? 'Exit Lounge' : letter ? 'Clear letter' : 'Show all games'}</button></section>}
      </div>}
    </div>
    {transitionError && <p role="alert" className="relative z-10 border-t border-rose-300/35 bg-rose-400/10 px-8 py-2 text-sm font-semibold text-rose-200">{transitionError}</p>}
    {selected && layout === 'wall' && <LoungeDetails game={selected} updateLedger={updateLedger} view={view} mascotId={mascotId} mascotEnabled={mascotEnabled} busy={transitionBusy} onOpenDetails={openDetails} />}
    {mascotEnabled && selected && dismissedNoticeId !== selected.id && !detailsId && !settingsOpen && !soundOpen && !guideOpen && !visualOpen && !themesOpen && !jumpOpen && <LoungeMascotNotice game={selected} updateLedger={updateLedger} mascotId={mascotId} onDismiss={() => setDismissedNoticeId(selected.id)} />}
    {detailsGame && <LoungeGamePanel game={detailsGame} position={Math.max(1, detailsIndex + 1)} total={detailsIndex < 0 ? 1 : shownGames.length} updateLedger={updateLedger} onPrevious={() => stepDetails(-1)} onNext={() => stepDetails(1)} onClose={closeDetails} onLaunch={onLaunch} />}
    {settingsOpen && <LoungeSettingsPanel preferences={preferences} retroProfiles={retroProfiles} panelShelfPosition={zone === 'emulator' ? 'bottom' : preferences.shelfPosition} layout={layout} game={selected} privateGameCount={privateGameCount} privateGamesUnlocked={privateGamesUnlocked} onRequestPrivateGames={onRequestPrivateGames} onLayoutChange={changeLayout} onChange={changePreferences} onClose={closeSettings} />}
    {soundOpen && <LoungeSoundPanel preferences={preferences} soundsEnabled={soundsEnabled && !resting && pageVisible && audioFocused} onChange={changePreferences} onPreviewSound={previewPickerSound} ambienceError={ambienceError} onRetryAmbience={retryAmbience} onClose={closeSound} />}
    {guideOpen && <LoungeGuidePanel games={pcGames} favoriteIds={favoriteIds} preferences={preferences} onPreferencesChange={changePreferences} updateLedger={updateLedger} onOpenGame={openGameFromGuide} onBrowse={browseFromGuide} onCustomize={openVisualFromGuide} onClose={closeGuide} />}
    {themesOpen && <LoungeThemeGallery preferences={preferences} layout={layout} savedPresets={savedPresets} onSavedPresetsChange={onSavedPresetsChange} onLayoutChange={changeLayout} desktopTheme={theme} onChange={changePreferences} onTuneVisuals={tuneVisualsFromThemes} onClose={closeThemes} />}
    {visualOpen && <LoungeVisualBuilder preferences={preferences} game={selected} games={shownGames} theme={effectiveTheme} loungeLevel={loungeLevel} flowOpacity={loungeStyle.flowOpacity} flowSeconds={loungeStyle.flowSeconds} effectsActive={fxEnabled} panelShelfPosition={zone === 'emulator' ? 'bottom' : preferences.shelfPosition} onChange={changePreferences} onClose={closeVisual} />}
    {jumpOpen && <LoungeJumpPanel games={viewGames} currentLetter={letter} onChoose={chooseLetter} onClose={closeJump} />}
  </section>;
}
