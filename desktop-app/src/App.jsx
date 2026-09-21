import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import GameDetail from './components/GameDetail';
import DealsBar from './components/DealsBar';
import ToolDetail from './components/ToolDetail';
import HoverTips from './components/HoverTips';
import FungistMascot from './components/FungistMascot';
import MajorMascotNotice from './components/MajorMascotNotice';
import HomeHub from './components/HomeHub';
import CoverWall from './components/CoverWall';
import { BgAmbience, WorkspaceEmpty } from './components/ThemeVisuals';
import { checkForUpdates } from './lib/updateChecker';
import { hydrateLibrary, selectWorkspace, filterByLauncher, applyGameSession } from './state/library-state.mjs';
import { gameLockedCategoryMap, redactLockedHomeGames, visibleUnlockedGames } from './state/privacy-state.mjs';
import { hydrateNavigation, preferredLibraryGame, preferredTool } from './state/navigation-state.mjs';
import { hydrateSettings, visualState } from './state/settings-state.mjs';
import { EMPTY_REFRESH_QUEUE } from './state/metadata-refresh-state.mjs';
import { sessionResult, applyPlaytimeImport } from './state/playtime-state.mjs';
import { getRendererApi } from './services/renderer-api.mjs';
import { useRendererStore } from './state/use-renderer-store.mjs';
import { withGpuSetupTools } from './state/tool-bootstrap-state.mjs';
import { mascotLibraryContext } from './services/mascot-library-context.mjs';
import { LAUNCHER_LABELS, assignLauncherCategory, ensureLauncherCategory } from './state/launcher-category-state.mjs';
import { mergeUpdateStatusLedger } from './state/update-ledger-state.mjs';
import { appendMascotNotice } from './components/mascot/fungist-model.mjs';
import AppModalLayer from './components/app/AppModalLayer';
import { createDemoLibrary } from './state/demo-library.mjs';
import { createMetadataWorkflow } from './services/metadata-workflow.mjs';
import { createCategoryPrivacyWorkflow } from './services/category-privacy-workflow.mjs';
import { pickDetectedLauncher } from './services/launcher-detection-workflow.mjs';
import { createAutoSortWorkflow } from './services/auto-sort-workflow.mjs';

// Read app version once — used by the update checker for comparison.
const APP_VERSION = '1.7.8';
import { uid, guessNameFromPath, hashPin, formatPlaytime } from './lib/utils';
import { normalizeGenreProfile, GENRE_TAXONOMY_VERSION } from './lib/genreTaxonomy';
import { setSoundPack } from './lib/sound';
import { playMascotVoice } from './lib/mascotVoice';

const nativeApi = getRendererApi();
const isElectron = Boolean(nativeApi);
const {
  games: DEMO_GAMES,
  categories: DEMO_CATEGORIES,
  tools: DEMO_TOOLS,
  toolCategories: DEMO_TOOL_CATEGORIES,
} = createDemoLibrary(hashPin);

export default function App() {
  const {
    library, setLibrary, settings, setSettings,
    selectedId, setSelectedId, selectedToolId, setSelectedToolId,
    unlockedCategories, setUnlockedCategories,
    persistSettings, updateSetting,
  } = useRendererStore(nativeApi);
  // A game launched by NEO-LIB is still tracked while the window stays open.
  // Rest Mode uses this to pause every non-essential bit of background work.
  const [runningGame, setRunningGame] = React.useState(null);
  // A game started through Steam, Battle.net, or another client is discovered
  // separately. A confident library match enters Rest Mode automatically and
  // explains the transition in the dedicated major-event notice.
  const [externalRunningGame, setExternalRunningGame] = React.useState(null);
  const [externalRestOverride, setExternalRestOverride] = React.useState(false);
  // Rest Mode can also be a deliberate player choice. Keep manual and tray
  // reasons separate from game tracking so waking NEO-LIB never mutates a
  // play session or pretends a game is running.
  const [manualRestActive, setManualRestActive] = React.useState(false);
  const [trayRestActive, setTrayRestActive] = React.useState(false);
  const [wakeTransitionActive, setWakeTransitionActive] = React.useState(false);
  const wakeTransitionTimer = React.useRef(null);
  const [majorMascotNotice, setMajorMascotNotice] = React.useState(null);
  const majorMascotNoticeTimer = React.useRef(null);
  const showMajorMascotNotice = React.useCallback((notice) => {
    if (!notice?.title || !notice?.body) return;
    window.clearTimeout(majorMascotNoticeTimer.current);
    setMajorMascotNotice({ ...notice, key: notice.key || `major-${Date.now()}` });
    majorMascotNoticeTimer.current = window.setTimeout(() => setMajorMascotNotice(null), 7_500);
  }, []);
  const [ratingPromptGame, setRatingPromptGame] = React.useState(null);
  const [managedToolInstallId, setManagedToolInstallId] = React.useState('');
  const automaticGameRestActive = !!runningGame && (
    settings.gameRestMode !== false
    || (runningGame.source === 'external' && externalRestOverride)
  );
  // Everything that is non-essential already observes this one flag: effects,
  // sounds, mascot activity, launcher discovery, news, deals and health
  // polling all sleep together.
  const gameRestActive = automaticGameRestActive || manualRestActive || trayRestActive;
  const restReason = trayRestActive
    ? 'NEO-LIB is resting in the background until you reopen it.'
    : manualRestActive
      ? 'Manual Rest Mode is active until you choose Wake up.'
      : runningGame?.name
        ? `${runningGame.name} is running · background work paused.`
        : 'A tracked game is running · background work paused.';
  const [search, setSearch] = React.useState('');

  const [showAdd, setShowAdd] = React.useState(false);
  const [toolMetadataTarget, setToolMetadataTarget] = React.useState(null);
  const [showWizard, setShowWizard] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [themeStudioOpen, setThemeStudioOpen] = React.useState(false);
  const [mascotCenterOpen, setMascotCenterOpen] = React.useState(false);
  const [controllerCenterOpen, setControllerCenterOpen] = React.useState(false);

  const [catModal, setCatModal] = React.useState({ open: false, initial: null });
  const [categoryManagerOpen, setCategoryManagerOpen] = React.useState(false);
  const [catCtx, setCatCtx] = React.useState({ open: false, category: null, anchor: null });
  const [pinModal, setPinModal] = React.useState({ open: false, mode: 'unlock', category: null, error: '' });
  const [pinThen, setPinThen] = React.useState(null);

  const [fetching, setFetching] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  // Generic prompt modal (replaces window.prompt which Electron disables by default)
  const [promptCfg, setPromptCfg] = React.useState({ open: false });
  const askPrompt = ({ title, label, defaultValue = '', placeholder = '', multiline = false, confirmLabel = 'Save' }) =>
    new Promise((resolve) => {
      setPromptCfg({
        open: true, title, label, defaultValue, placeholder, multiline, confirmLabel,
        onSubmit: (v) => resolve(v),
        onCancel: () => resolve(null),
      });
    });
  const closePrompt = (cancelled) => {
    setPromptCfg((p) => {
      if (cancelled && p.onCancel) p.onCancel();
      return { open: false };
    });
  };

  /* --- Sidebar resize --- */
  const sidebarWidth = settings.sidebarWidth || 320;
  const startResize = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (ev) => {
      const w = Math.max(220, Math.min(640, startW + (ev.clientX - startX)));
      updateSetting({ sidebarWidth: w });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  /* --- Sound pack: apply when settings change --- */
  React.useEffect(() => {
    setSoundPack(gameRestActive || settings.soundsEnabled === false ? 'none' : (settings.soundPack || 'synthwave'));
  }, [gameRestActive, settings.soundsEnabled, settings.soundPack]);

  /* --- CRT boot animation on first paint --- */
  const [bootDone, setBootDone] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setBootDone(true), 1400);
    return () => clearTimeout(t);
  }, []);

  /* --- Tutorial state (first-time popup) --- */
  const [tutorialOpen, setTutorialOpen] = React.useState(false);
  const [tutorialVisualsOpen, setTutorialVisualsOpen] = React.useState(false);
  const [introHiddenThisSession, setIntroHiddenThisSession] = React.useState(false);
  const [fungistWelcomeKey, setFungistWelcomeKey] = React.useState(0);
  const postIntroGreetingScheduled = React.useRef(false);
  React.useEffect(() => {
    // Open tutorial if user hasn't dismissed it AND setting allows
    const seen = isElectron ? settings.tutorialSeen : (typeof localStorage !== 'undefined' && localStorage.getItem('neo-lib-tutorial-seen') === '1');
    if ((!seen || settings.tutorialAlwaysShow) && (introHiddenThisSession || settings.skipIntro)) {
      // Never put tutorial audio or a spotlight over the startup sequence.
      const t = setTimeout(() => setTutorialOpen(true), 340);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [introHiddenThisSession, settings.skipIntro, settings.tutorialSeen, settings.tutorialAlwaysShow]);

  React.useEffect(() => {
    if (!introHiddenThisSession || tutorialOpen || postIntroGreetingScheduled.current) return undefined;
    const timer = window.setTimeout(() => {
      postIntroGreetingScheduled.current = true;
      setFungistWelcomeKey(Date.now());
    }, 620);
    return () => window.clearTimeout(timer);
  }, [introHiddenThisSession, tutorialOpen]);

  /* --- Troubleshoot state (smart refetch) --- */
  const [troubleshoot, setTroubleshoot] = React.useState({ open: false, game: null });
  const [refreshReview, setRefreshReview] = React.useState(null);

  /* --- Auto-sort state --- */
  const [autoSortOpen, setAutoSortOpen] = React.useState(false);
  const [autoSortUndo, setAutoSortUndo] = React.useState(null);

  /* --- Donate modal --- */
  const [donateOpen, setDonateOpen] = React.useState(false);

  /* --- Confetti & sparkle bursts (theme-aware) --- */
  const [confetti, setConfetti] = React.useState({ key: 0, label: '', origin: null });
  const [fungistCompletion, setFungistCompletion] = React.useState({ key: 0, label: '' });
  const [mascotActivity, setMascotActivity] = React.useState(null);
  const [fungistLaunchCelebration, setFungistLaunchCelebration] = React.useState(null);
  const fungistLaunchTimer = React.useRef(null);
  const launchOriginRef = React.useRef(null);
  const fireConfetti = React.useCallback((label = '', origin = null) => {
    setConfetti({ key: Date.now(), label, origin });
    setFungistCompletion({ key: Date.now(), label: String(label || 'Action completed') });
  }, []);

  /* --- Edit metadata modal (manual override for itch.io / indie games) --- */
  const [editMetaGame, setEditMetaGame] = React.useState(null);

  /* --- Auto-update checker (GitHub releases API) --- */
  const [updateInfo, setUpdateInfo] = React.useState(null);
  const [mascotHealth, setMascotHealth] = React.useState({ state: 'checking', health: null });
  const [mascotHealthOpenRequest, setMascotHealthOpenRequest] = React.useState(0);

  /* --- "What's new" changelog modal — shown once per installed version --- */
  const [changelogOpen, setChangelogOpen] = React.useState(false);

  /* --- Unified multi-source metadata picker (v1.2.0). Opened from:
        • GameDetail "Re-fetch info" button
        • AcceptMetadataModal "Try again"
        • Wizard's refetch flow */
  const [fetchPickerGame, setFetchPickerGame] = React.useState(null);
  const [tidyOpen, setTidyOpen] = React.useState(false);
  const [saveManagerGame, setSaveManagerGame] = React.useState(null);
  const [launchDoctorGame, setLaunchDoctorGame] = React.useState(null);

  /* --- Accept-before-add modal (preview proposed metadata before applying) --- */
  const [acceptPreview, setAcceptPreview] = React.useState({ open: false, game: null, proposed: null, busy: false });
  const [metadataRepairQueue, setMetadataRepairQueue] = React.useState(() => ({ ...EMPTY_REFRESH_QUEUE }));

  /* --- Drag-drop overlay state --- */
  const [dragOver, setDragOver] = React.useState(false);
  const [wizardPrefillRoot, setWizardPrefillRoot] = React.useState('');
  const [wizardAutoScan, setWizardAutoScan] = React.useState(false);

  /* --- Launcher detector --- */
  const [detectedLauncher, setDetectedLauncher] = React.useState(null);
  // UI-side companion to the native launch safety lock. It makes a double
  // click harmless while the main process remains the final authority.
  const launchRequestInFlight = React.useRef(false);
  // Live ref to the latest library so the launcher detection effect can check
  // "do we already have games for this launcher?" without re-running on every
  // library mutation (which would flicker the popup).
  const libraryRef = React.useRef(library);
  React.useEffect(() => { libraryRef.current = library; }, [library]);
  // Existing Tools collections deserve the same first-class identity as a
  // newly added program. On the first Tools visit, fill only missing fields
  // for a small bounded batch. Custom names, descriptions, images, categories
  // and paths always win; this never launches, installs, or uploads a tool.
  const toolMetadataBackfillRef = React.useRef(new Set());
  React.useEffect(() => {
    if (!isElectron || settings.mode !== 'tools' || !nativeApi?.fetchToolMetadata) return undefined;
    const candidates = (library.tools || [])
      .filter((tool) => tool?.exePath && (!tool.icon || !tool.shortDescription || !tool.about || !tool.publisher))
      .filter((tool) => !toolMetadataBackfillRef.current.has(tool.id))
      .slice(0, 8);
    if (!candidates.length) return undefined;
    let cancelled = false;
    (async () => {
      for (const tool of candidates) {
        toolMetadataBackfillRef.current.add(tool.id);
        try {
          const [localIcon, details] = await Promise.all([
            tool.icon ? Promise.resolve(tool.icon) : nativeApi.extractIcon?.(tool.exePath),
            nativeApi.fetchToolMetadata({ exePath: tool.exePath, query: tool.name }),
          ]);
          if (cancelled) return;
          setLibrary((current) => ({
            ...current,
            tools: (current.tools || []).map((item) => item.id !== tool.id ? item : {
              ...item,
              icon: item.icon || localIcon || '',
              coverUrl: item.coverUrl || localIcon || '',
              shortDescription: item.shortDescription || details?.shortDescription || '',
              about: item.about || details?.about || '',
              publisher: item.publisher || details?.publisher || '',
              developers: item.developers?.length ? item.developers : (details?.developers || []),
              version: item.version || details?.version || '',
              toolCategory: item.toolCategory || details?.category || '',
              genres: item.genres?.length ? item.genres : (details?.genres || []),
              website: item.website || details?.website || '',
              metadataSource: item.metadataSource || details?.source || 'Windows executable',
              metadataEvidence: item.metadataEvidence?.length ? item.metadataEvidence : (details?.evidence || []),
              metadataFetchedAt: item.metadataFetchedAt || details?.metadataFetchedAt || Date.now(),
              toolKind: 'software',
            }),
          }));
        } catch { /* a missing/unreadable tool remains usable and can be refreshed manually */ }
      }
    })();
    return () => { cancelled = true; };
  }, [library.tools, settings.mode]);
  React.useEffect(() => {
    if (!isElectron || !nativeApi?.detectLaunchers) return undefined;
    if (settings.launcherDetectEnabled === false || gameRestActive) return undefined;
    let cancelled = false;
    const dismissed = settings.launcherDetectDismissed || {};
    const askLater = settings.launcherAskLater || {};
    const tick = async () => {
      try {
        const status = await nativeApi.detectLaunchers();
        if (cancelled) return;
        // Detection only offers the confirmation-first Wizard. It never scans,
        // imports or refreshes metadata merely because a launcher is running.
        const key = pickDetectedLauncher(status, {
          dismissed,
          askLater,
          games: libraryRef.current?.games || [],
        });
        if (key) setDetectedLauncher(key);
      } catch { /* offline or non-Windows — ignore */ }
    };
    tick();
    const t = setInterval(tick, 5 * 60 * 1000); // every 5 minutes
    return () => { cancelled = true; clearInterval(t); };
  }, [gameRestActive, settings.launcherDetectEnabled, settings.launcherDetectDismissed, settings.launcherAskLater]);

  const importDetectedLauncher = () => {
    const key = detectedLauncher;
    setDetectedLauncher(null);
    if (!key) return;
    // Detection opens the same confirmation-first Wizard route as every other
    // launcher. It never begins a bulk import on its own.
    updateSetting({
      launcherDetectDismissed: { ...(settings.launcherDetectDismissed || {}), [key]: true },
    });
    setShowWizard(true);
    notify(`${LAUNCHER_LABELS[key] || key} detected — choose it in the Wizard to review the import first.`);
  };

  /* --- Confirm dialog state --- */
  const [confirmCfg, setConfirmCfg] = React.useState({ open: false });
  const askConfirm = ({ title, message, confirmLabel = 'Yes', cancelLabel = 'No', destructive = false, typedConfirm = undefined }) =>
    new Promise((resolve) => {
      setConfirmCfg({
        open: true, title, message, confirmLabel, cancelLabel, destructive, typedConfirm,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

  /* --- Load on mount --- */
  React.useEffect(() => {
    (async () => {
      if (isElectron) {
        const lib = await nativeApi.loadLibrary();
        const s = await nativeApi.loadSettings();
        // Rating System v2 deliberately starts everyone fresh. Earlier whole-
        // star ratings are not comparable to the new precise fractional scale,
        // so clear them exactly once rather than quietly reinterpreting them.
        const resetRatings = Number(s.ratingSystemVersion || 0) < 2;
        const loadedLibrary = hydrateLibrary(lib, {
          now: Date.now(), resetRatings, normalizeGenres: normalizeGenreProfile,
          taxonomyVersion: GENRE_TAXONOMY_VERSION,
        });
        setLibrary(loadedLibrary);
        // Home stays the default landing screen while last safe selections are
        // restored behind it for seamless Home/Library/Wall navigation.
        const cleanSettings = hydrateSettings(s, { resetRatings });
        const restoredNavigation = hydrateNavigation(cleanSettings, loadedLibrary);
        setSettings(cleanSettings);
        setSelectedId(restoredNavigation.selectedGameId);
        setSelectedToolId(restoredNavigation.selectedToolId);

        // First desktop run: read only the ordinary Windows adapter list, then
        // add managed GPU-Z / CPU-Z and a genuine vendor control-centre shortcut
        // when one exists. This never installs drivers or changes GPU settings.
        if (!s.gpuSetupVersion) {
          nativeApi.detectGpuSetup?.().then((setup) => {
            if (!setup?.ok) return;
            setLibrary((current) => {
              const next = withGpuSetupTools(current, setup);
              // First hydration normally skips its auto-save. Persist this
              // one-time hardware setup directly so a fast GPU query cannot
              // race the initial effect and lose the new Tools shortcuts.
              nativeApi.saveLibrary(next).catch(() => {});
              return next;
            });
            const gpuSettings = {
              ...cleanSettings,
              gpuSetupVersion: 1,
              detectedGpu: {
                name: setup.primary?.name || 'Unknown GPU', vendor: setup.primary?.vendor || 'generic',
                driverVersion: setup.primary?.driverVersion || '', detectedAt: Date.now(),
              },
            };
            setSettings((current) => ({ ...current, ...gpuSettings }));
            nativeApi.saveSettings(gpuSettings).catch(() => {});
          }).catch(() => {});
        }

        // The normal persistence effect skips its first hydration write. Save
        // this intentional migration directly so ratings cannot reappear on a
        // subsequent boot if the user closes NEO-LIB immediately.
        if (resetRatings) {
          await Promise.all([
            nativeApi.saveLibrary(loadedLibrary),
            nativeApi.saveSettings(cleanSettings),
          ]);
        }

        // "What's new" toast — show once per installed version. First-ever
        // run sets the version silently so the tutorial owns the welcome moment.
        if (!s.lastSeenVersion) {
          nativeApi.saveSettings({ ...s, lastSeenVersion: APP_VERSION });
        } else if (s.lastSeenVersion !== APP_VERSION) {
          // Slight delay so it doesn't collide with the tutorial / CRT boot.
          setTimeout(() => setChangelogOpen(true), 2200);
        }
        // Keep selection empty at startup so Home is never obscured by a game.

        // Warm the read-only update evidence cache only after the complete
        // boot/intro window has settled. Local executable resource inspection
        // is separately quarantined in the main process as defence in depth.
        // The main process uses a bounded, rate-limited queue; this never
        // changes launchers or downloads files, and makes a later preview
        // update alert fast even when Home has not been opened.
        window.setTimeout(() => {
          nativeApi.scanGameUpdates?.({ games: loadedLibrary.games.map(({ id, name, appid, launcher, source, steamOwned, installedVersion, updateWatchUrl, website, exePath }) => ({ id, name, appid, launcher, source, steamOwned, installedVersion, updateWatchUrl, website, exePath })) }).then(recordUpdateLedger).catch(() => {});
        }, 35_000);

        // Wire playtime tracking event
        // v1.4.0 — playtime is stored in MINUTES throughout the app (matches
        // Steam's localconfig.vdf unit and StatsPanel expectations). Convert
        // the raw session seconds → minutes here so we stop inflating values.
        nativeApi.onGameExited(({ gameId, seconds }) => {
          setRunningGame((active) => !gameId || active?.id === gameId ? null : active);
          if (!gameId) return;
          setLibrary((curr) => {
            const playedGame = curr.games.find((game) => game.id === gameId);
            const outcome = sessionResult(playedGame, seconds, Date.now());
            if (outcome.shouldPromptRating) window.setTimeout(() => setRatingPromptGame({ game: playedGame, seconds: Number(seconds) }), 650);
            return applyGameSession(curr, gameId, seconds, Date.now());
          });
          // A game process that closes almost immediately can be a wrong exe,
          // launcher bootstrap, or a real failure. We wait for a second event
          // before offering Doctor so a one-off launcher handoff is not noisy.
          if (Number(seconds) > 0 && Number(seconds) < 8) recordLaunchProblem(gameId, 'closed immediately');
        });
        nativeApi.onExternalGameState?.(({ active, gameId, name }) => {
          if (active) {
            const game = { id: gameId, name: name || 'External game', source: 'external' };
            setExternalRunningGame(game);
            setExternalRestOverride(true);
            setRunningGame(game);
            showMajorMascotNotice({
              key: `external-rest-${game.id}-${Date.now()}`,
              kind: 'external-rest',
              title: `${game.name} was detected`,
              body: `It is running outside NEO-LIB, so I automatically put the launcher into Rest Mode. Background effects and non-essential checks are paused, and NEO-LIB will wake again when the game closes.`,
            });
            return;
          }
          setExternalRunningGame(null);
          setExternalRestOverride(false);
          setRunningGame((current) => current?.source === 'external' ? null : current);
        });
      } else {
        setLibrary({
          games: DEMO_GAMES,
          categories: DEMO_CATEGORIES,
          gameOrderByCategory: {
            'cat-fav': ['demo-1', 'demo-2'],
            'cat-rpg': ['demo-2', 'demo-3'],
          },
          tools: DEMO_TOOLS,
          toolCategories: DEMO_TOOL_CATEGORIES,
          toolOrderByCategory: { 'tcat-hw': ['tool-1', 'tool-2'] },
        });
        setSelectedId(null);
        setSelectedToolId(DEMO_TOOLS[0].id);
      }
    })();
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'synthwave');
  }, [settings.theme]);
  React.useEffect(() => {
    const cursor = ['windows', 'neon', 'petal', 'pixel'].includes(settings.cursorTheme)
      ? settings.cursorTheme
      : 'windows';
    document.documentElement.setAttribute('data-neolib-cursor', cursor);
  }, [settings.cursorTheme]);
  React.useEffect(() => {
    const cadence = ['full', 'balanced', 'calm'].includes(settings.motionCadence)
      ? settings.motionCadence
      : 'full';
    document.documentElement.setAttribute('data-motion-cadence', cadence);
  }, [settings.motionCadence]);

  /* ----- Auto-update checker (GitHub releases API) ----- */
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const info = await checkForUpdates(APP_VERSION);
      if (!cancelled) setUpdateInfo(info);
    })();
    return () => { cancelled = true; };
  }, []);
  const openReleasesPage = () => {
    const url = updateInfo?.releaseUrl || 'https://github.com/fufugis/Neo-Lib-Launcher/releases/latest';
    if (nativeApi?.openExternal) nativeApi.openExternal(url);
    else window.open(url, '_blank');
  };

  /* ----- Drag-drop .exe / .lnk / folder onto the app window ----- */
  React.useEffect(() => {
    if (!isElectron) return undefined;
    let leaveTimer;
    const onDragEnter = (e) => {
      e.preventDefault();
      clearTimeout(leaveTimer);
      if (e.dataTransfer?.types?.includes('Files')) setDragOver(true);
    };
    const onDragOver = (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const onDragLeave = (e) => {
      e.preventDefault();
      // Only hide overlay when leaving the window entirely (debounced)
      leaveTimer = setTimeout(() => setDragOver(false), 80);
    };
    const onDrop = async (e) => {
      e.preventDefault();
      clearTimeout(leaveTimer);
      setDragOver(false);
      const files = Array.from(e.dataTransfer?.files || []);
      if (!files.length) return;
      let added = 0;
      for (const f of files) {
        const p = f.path;
        if (!p) continue;
        const lower = p.toLowerCase();
        // .lnk → resolve to underlying target
        if (lower.endsWith('.lnk') && nativeApi?.resolveLnk) {
          const r = await nativeApi.resolveLnk(p);
          if (r?.ok && r.target) {
            addToGames({ name: guessNameFromPath(r.target), exePath: r.target, launchArgs: r.args || '' });
            added += 1;
            continue;
          }
        }
        // .exe / .bat / .cmd → add directly
        if (/\.(exe|bat|cmd)$/i.test(p)) {
          const ico = await nativeApi?.extractIcon?.(p);
          addToGames({ name: guessNameFromPath(p), exePath: p, icon: ico });
          added += 1;
          continue;
        }
        // Folder → open Wizard pre-filled with this root and auto-trigger the scan
        if (!/\.\w{1,5}$/.test(p)) {
          setWizardPrefillRoot(p);
          setWizardAutoScan(true);
          setShowWizard(true);
          notify(`Folder dropped — scanning ${p}`);
        }
      }
      if (added > 0) notify(`Added ${added} game${added !== 1 ? 's' : ''} via drag-drop`);
    };
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Known library games started through Steam, Battle.net, Epic, or another
  // client are watched via an ordinary path-only Windows process check. The
  // check provides an explicit low-usage offer; an idle launcher never counts.
  React.useEffect(() => {
    if (!isElectron || !nativeApi?.watchExternalGames) return undefined;
    const games = (library.games || []).map(({ id, name, exePath, installDir, installdir, launcher }) => ({ id, name, exePath, installDir: installDir || installdir || '', launcher }));
    nativeApi.watchExternalGames({ games }).catch(() => {});
    return undefined;
  }, [library.games]);

  const notify = (msg) => {
    setToast(msg);
    clearTimeout(notify._t);
    notify._t = setTimeout(() => setToast(null), 2500);
  };

  const toggleManualRest = React.useCallback(() => {
    setManualRestActive((active) => {
      const next = !active;
      notify(next
        ? 'NEO-LIB is resting — effects and background checks are paused to free resources.'
        : 'NEO-LIB is awake — normal background activity has resumed.');
      return next;
    });
  }, []);

  React.useEffect(() => () => window.clearTimeout(majorMascotNoticeTimer.current), []);

  // Close-to-tray is intentionally low-usage. The native shell reports the
  // actual hidden/shown transition so this remains correct for the X button,
  // the tray icon and Windows restore—not just for a browser visibility hint.
  React.useEffect(() => {
    if (!nativeApi?.onWindowVisibility) return undefined;
    return nativeApi.onWindowVisibility(({ visible }) => {
      if (!visible) {
        window.clearTimeout(wakeTransitionTimer.current);
        setWakeTransitionActive(false);
        setTrayRestActive(true);
        return;
      }
      // Manual rest remains deliberate. Tray rest gets a visible wake sequence
      // so background work only resumes after the app is fully back on screen.
      if (manualRestActive) {
        setTrayRestActive(false);
        return;
      }
      setWakeTransitionActive(true);
      window.clearTimeout(wakeTransitionTimer.current);
      wakeTransitionTimer.current = window.setTimeout(() => {
        setTrayRestActive(false);
        setWakeTransitionActive(false);
        notify('NEO-LIB is awake again.');
      }, 1500);
    });
  }, [manualRestActive]);
  React.useEffect(() => () => window.clearTimeout(wakeTransitionTimer.current), []);

  /* --- Mode-aware slice keys (library vs tools) --- */
  const isTools = settings.mode === 'tools';
  const workspace = selectWorkspace(library, settings.mode);
  const sliceK = workspace.keys;
  const currentItems = workspace.items;
  const currentCats = workspace.categories;
  const currentOrder = workspace.order;
  const currentSelectedId = isTools ? selectedToolId : selectedId;
  const setCurrentSelectedId = isTools ? setSelectedToolId : setSelectedId;

  const setMode = (m) => updateSetting({ mode: m });

  // The onboarding tour changes the actual visible workspace as it explains
  // it. It never mutates a game, category, or tool; it only selects a safe
  // existing item where one is available so the Preview can be demonstrated.
  const navigateTutorial = React.useCallback((view) => {
    // The Visuals popover is controlled directly during the tutorial. Clicking
    // its toggle from a timer was a race: it could repeatedly open/close and
    // flicker after the Visuals step. This flag makes the transition one-way.
    setTutorialVisualsOpen(view === 'visuals');
    if (view === 'preview') {
      const firstGame = (library.games || [])[0];
      updateSetting({ mode: 'library' });
      setSelectedId(firstGame?.id || null);
      return;
    }
    if (view === 'tools') {
      const firstTool = (library.tools || [])[0];
      updateSetting({ mode: 'tools' });
      setSelectedToolId(firstTool?.id || null);
      return;
    }
    if (view === 'visuals') {
      updateSetting({ mode: 'library' });
      setSelectedId(null);
      return;
    }
    if (view === 'library') {
      updateSetting({ mode: 'library' });
      setSelectedId(null);
      return;
    }
    updateSetting({ mode: 'home' });
    setSelectedId(null);
  }, [library.games, library.tools, updateSetting]);

  // Background poll for unseen news — count items newer than settings.newsLastSeenAt.
  // Runs every 10 min while the app is open. Silent failure if not in Electron.
  const [unseenNewsCount, setUnseenNewsCount] = React.useState(0);
  React.useEffect(() => {
    if (gameRestActive || typeof window === 'undefined' || !nativeApi?.fetchAllNews) return undefined;
    let cancelled = false;
    const check = async () => {
      // Every named library game is news-eligible. Steam/GOG/itch keep their
      // direct feeds, while other launchers and local titles use the bounded
      // public-source fallback in the desktop process.
      const games = (library.games || []).filter((g) => g && String(g.name || '').trim());
      if (!games.length) { setUnseenNewsCount(0); return; }
      try {
        const res = await nativeApi.fetchAllNews({
          games: games.map((g) => ({ id: g.id, appid: g.appid, name: g.name, website: g.website, source: g.source, launcher: g.launcher, gogId: g.gogId })),
          days: 14,
          force: false,
        });
        if (cancelled) return;
        const items = res?.items || [];
        const seenAt = Number(settings.newsLastSeenAt || 0);
        const unseen = items.filter((it) => Number(it.date || 0) > seenAt).length;
        setUnseenNewsCount(unseen);
      } catch { /* ignore */ }
    };
    check();
    const iv = setInterval(check, 10 * 60 * 1000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [gameRestActive, library.games, settings.newsLastSeenAt]);

  // v1.4.0 — Watched games news alert.
  // For games that are either pinned (favorited) OR rated 5⭐, poll once per
  // hour and pop a center-screen popup with chime if any news items are newer
  // than `settings.newsAlertLastAt`. State is persisted so we don't re-fire
  // for the same batch.
  const [newsAlert, setNewsAlert] = React.useState(null);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [feedbackInitialMode, setFeedbackInitialMode] = React.useState('feedback');
  const openFeedback = React.useCallback((m = 'feedback') => {
    setFeedbackInitialMode(m);
    setFeedbackOpen(true);
  }, []);

  // v1.6.0 — Playtime Import preview modal state.
  // Populated when the user opens the Stats panel OR clicks "Refresh hours"
  // from the Visuals menu / right-click. Empty payload = closed.
  const [importPreview, setImportPreview] = React.useState({ open: false, data: {}, ownedAppids: [], currentAccount: null });
  const openPlaytimeImport = React.useCallback(async ({ force = false } = {}) => {
    if (!isElectron || !nativeApi?.importSteamPlaytime) {
      notify('Steam import only available in the desktop build.');
      return;
    }
    try {
      const res = await nativeApi.importSteamPlaytime({ force });
      if (!res?.ok) { notify(res?.error || 'Steam import failed.'); return; }
      setImportPreview({
        open: true,
        data: res.data || {},
        ownedAppids: res.ownedAppids || [],
        currentAccount: res.currentAccount || null,
        debug: res.debug || null,
      });
    } catch (e) {
      notify('Steam import error: ' + (e?.message || 'unknown'));
    }
  }, []);
  const applyImportPatches = React.useCallback((patches) => {
    if (!Array.isArray(patches) || patches.length === 0) {
      setImportPreview((p) => ({ ...p, open: false }));
      return;
    }
    setLibrary((curr) => ({ ...curr, games: applyPlaytimeImport(curr.games, patches, Date.now()) }));
    setImportPreview((p) => ({ ...p, open: false }));
    notify(`Applied ${patches.filter((p) => p.playtime !== undefined).length} playtime change(s).`);
  }, []);
  React.useEffect(() => {
    if (gameRestActive || typeof window === 'undefined' || !nativeApi?.fetchAllNews) return undefined;
    let cancelled = false;
    const pinnedSet = new Set(settings.pinnedGameIds || []);
    const watched = (library.games || []).filter((g) =>
      g && String(g.name || '').trim() && (pinnedSet.has(g.id) || Number(g.rating) === 5)
    );
    const check = async () => {
      if (!watched.length) return;
      try {
        const res = await nativeApi.fetchAllNews({
          games: watched.map((g) => ({ id: g.id, appid: g.appid, name: g.name, website: g.website, source: g.source, launcher: g.launcher, gogId: g.gogId })),
          days: 3,
          force: false,
        });
        if (cancelled) return;
        const items = res?.items || [];
        const lastAt = Number(settings.newsAlertLastAt || Date.now() - 60 * 60 * 1000);
        const fresh = items
          .filter((it) => Number(it.date || 0) > lastAt)
          .sort((a, b) => Number(b.date || 0) - Number(a.date || 0));
        if (fresh.length) {
          const it = fresh[0];
          const game = watched.find((g) => g.id === it.gameId) || {};
          setNewsAlert({
            id: `${it.gameId}-${it.date}`,
            gameId: it.gameId,
            gameName: game.name || it.gameName || 'Watched game',
            source: it.source || 'update',
            title: it.title || 'New update',
            snippet: it.snippet || it.contents || '',
            url: it.url,
            timeLabel: 'just now',
          });
          updateSetting({ newsAlertLastAt: Date.now() });
        }
      } catch { /* ignore */ }
    };
    // First check happens ~30s after mount so the app finishes boot animations
    const first = setTimeout(check, 30_000);
    const iv = setInterval(check, 60 * 60 * 1000); // hourly
    return () => { cancelled = true; clearTimeout(first); clearInterval(iv); };
  }, [gameRestActive, library.games, settings.pinnedGameIds, settings.newsAlertLastAt]);


  /* --- Helpers --- */
  // Fungist receives the existing Game Ready sample rather than creating a
  // second system monitor. Ignore equivalent state snapshots to keep the
  // app quiet between the footer's deliberately slow 15-second checks.
  const onMascotHealthChange = React.useCallback((next) => {
    setMascotHealth((previous) => (
      previous.state === next?.state
      && previous.health?.cpuPercent === next?.health?.cpuPercent
      && previous.health?.ramPercent === next?.health?.ramPercent
        ? previous : (next || { state: 'checking', health: null })
    ));
  }, []);
  const openMascotHealth = React.useCallback(() => setMascotHealthOpenRequest((value) => value + 1), []);
  const scanForExternalRunningGame = React.useCallback(async () => {
    if (!isElectron || !nativeApi?.scanExternalGamesNow) {
      return { ok: false, message: 'Running-game checks are available in the installed Windows app.' };
    }
    const result = await nativeApi.scanExternalGamesNow().catch(() => null);
    if (!result?.ok) return { ok: false, message: result?.busy ? 'The game scan is already running. Try again in a moment.' : 'I could not check running games right now.' };
    if (!result.active) return { ok: true, active: false, message: 'I could not match a running game to a NEO-LIB library entry.' };
    const game = { id: result.gameId, name: result.name || 'A library game', source: 'external' };
    setExternalRunningGame(game);
    setExternalRestOverride(true);
    setRunningGame(game);
    showMajorMascotNotice({
      key: `external-rest-${game.id}-${Date.now()}`,
      kind: 'external-rest',
      title: `${game.name} was detected`,
      body: 'It is running outside NEO-LIB, so I automatically put the launcher into Rest Mode. Background effects and non-essential checks are paused, and NEO-LIB will wake again when the game closes.',
    });
    return { ok: true, active: true, game };
  }, [showMajorMascotNotice]);
  const enableExternalRestMode = React.useCallback((game) => {
    const active = game || externalRunningGame;
    if (!active?.id) return { ok: false, message: 'I need to identify the running game first.' };
    // Retained as a safe idempotent fallback for any older/manual caller. The
    // normal watcher now enters this state automatically after a confident match.
    setExternalRestOverride(true);
    setRunningGame({ ...active, source: 'external' });
    notify(`${active.name} is running from another launcher. NEO-LIB is now resting.`);
    return { ok: true, active: true, game: active };
  }, [externalRunningGame]);
  const askFungist = React.useCallback(async (message, history = [], visibleLibraryGames = []) => {
    if (!nativeApi?.askFungist) return { ok: false, error: 'Fungist chat is available in the NEO-LIB desktop app.' };
    return nativeApi.askFungist({ apiKey: settings.geminiKey || '', message, history, libraryContext: mascotLibraryContext(visibleLibraryGames), model: settings.aiModel || 'gemini-2.5-flash' });
  }, [settings.aiModel, settings.geminiKey]);
  const recordFungistNotice = React.useCallback((entry) => {
    if (!entry?.key) return;
    updateSetting({ fungistInbox: appendMascotNotice(settings.fungistInbox, entry, Date.now()) });
  }, [settings.fungistInbox]);
  const clearFungistInbox = React.useCallback(() => updateSetting({ fungistInbox: [] }), []);
  // Persist a compact, read-only update checklist. It records evidence from
  // the scan rather than guessing, so callers can actively filter known-current
  // games instead of treating an empty alert list as an unknown result.
  const recordUpdateLedger = React.useCallback((result) => {
    setSettings((prev) => {
      const next = mergeUpdateStatusLedger(prev, result);
      if (next === prev) return prev;
      if (isElectron) nativeApi.saveSettings(next);
      return next;
    });
  }, []);
  const withGenreProfile = (data) => {
    if (data?.genreProfile || !(data?.genreTags?.length || data?.genres?.length)) return data;
    const source = data.source || data.launcher || 'web';
    return {
      ...data,
      genreProfile: normalizeGenreProfile({ rawTags: data.genreTags?.length ? data.genreTags : data.genres, source }),
    };
  };
  const checkForAppUpdateNow = async () => {
    const info = await checkForUpdates(APP_VERSION, { force: true });
    setUpdateInfo(info);
    if (info?.error) notify('Could not reach GitHub to check for an update. Try again shortly.');
    else if (info?.available) notify(`NEO-LIB v${info.latestVersion} is available.`);
    else notify('NEO-LIB is up to date.');
  };

  /* --- Items (Games / Tools) --- */
  const addGame = (data) => {
    const g = { id: uid(), categoryIds: [], addedAt: Date.now(), librarySeenAt: null, ...withGenreProfile(data) };
    setLibrary((prev) => ({ ...prev, [sliceK.items]: [g, ...(prev[sliceK.items] || [])] }));
    setCurrentSelectedId(g.id);
    setShowAdd(false);
    notify(`Added ${g.name}`);
    fireConfetti('Added · ' + g.name);
  };
  // Always adds to library.games regardless of current tab — used by wizard + launcher imports.
  // Auto-creates a launcher category if the game came from a launcher import.
  const addToGames = (data) => {
    // FALLBACK: when the local .exe icon couldn't be extracted (common for sub-folder
    // launchers like Cyberpunk's REDLauncher), use the fetched online artwork instead.
    const onlineFallback = data.portraitImage || data.capsuleImage || data.headerImage || data.coverUrl || data.background || null;
    const icon = data.icon || onlineFallback;
    const g = { id: uid(), categoryIds: [], addedAt: Date.now(), librarySeenAt: null, ...withGenreProfile(data), icon };
    g.categoryIds = assignLauncherCategory(g.categoryIds, data.launcher);
    setLibrary((prev) => {
      const cats = ensureLauncherCategory(prev.categories || [], data.launcher);
      return { ...prev, categories: cats, games: [g, ...prev.games] };
    });
    notify(`Added ${g.name}`);
    fireConfetti('Added · ' + g.name);
    return g;
  };
  const updateGame = (id, patch) => {
    const timelinePatch = Object.prototype.hasOwnProperty.call(patch || {}, 'rating')
      ? { ...patch, ratedAt: Date.now() }
      : patch;
    setLibrary((prev) => ({
      ...prev,
      [sliceK.items]: (prev[sliceK.items] || []).map((g) => {
        if (g.id !== id) return g;
        // Whenever direct source genre evidence changes, refresh the separate
        // canonical profile as well. The raw provider genres remain intact;
        // this profile is the safe input for filters and future Auto-sort.
        const next = { ...g, ...timelinePatch };
        if (Object.prototype.hasOwnProperty.call(timelinePatch || {}, 'genres') || Object.prototype.hasOwnProperty.call(timelinePatch || {}, 'genreTags')) {
          next.genreProfile = normalizeGenreProfile({
            rawTags: next.genreTags?.length ? next.genreTags : (next.genres || []),
            source: timelinePatch.source || next.source || 'web',
            existing: g.genreProfile,
          });
        }
        return next;
      }),
    }));
  };
  const addTool = (data) => {
    const tool = {
      id: uid(),
      categoryIds: [],
      addedAt: Date.now(),
      availability: data?.exePath ? 'installed' : 'missing',
      toolKind: 'software',
      ...data,
    };
    setLibrary((prev) => ({ ...prev, tools: [tool, ...(prev.tools || [])] }));
    setSelectedToolId(tool.id);
    setShowAdd(false);
    setToolMetadataTarget(null);
    notify(`Added tool · ${tool.name}`);
  };
  // NEW means the player has not deliberately opened this title from the
  // Library yet. It is intentionally separate from automatic selections made
  // by imports, repair flows, Home, or startup defaults.
  const markGameSeenInLibrary = React.useCallback((id) => {
    if (!id) return;
    setLibrary((prev) => {
      const target = (prev.games || []).find((game) => game.id === id);
      if (!target || target.librarySeenAt != null) return prev;
      return { ...prev, games: prev.games.map((game) => game.id === id ? { ...game, librarySeenAt: Date.now() } : game) };
    });
  }, []);
  const updateTool = (id, patch) => {
    setLibrary((prev) => ({ ...prev, tools: (prev.tools || []).map((tool) => tool.id === id ? { ...tool, ...patch } : tool) }));
  };
  const locateManagedTool = async (tool) => {
    if (!isElectron || !tool?.managedTool) return;
    const exePath = await nativeApi.pickExe();
    if (!exePath) return;
    const result = await nativeApi.verifyManagedTool({ toolId: tool.managedTool, exePath });
    if (!result?.ok) { notify(result?.error || 'That executable could not be used.'); return; }
    updateTool(tool.id, { exePath: result.exePath, availability: 'installed', managedInstalledAt: Date.now(), managedInstallMode: 'located' });
    notify(`${tool.name} located and ready.`);
  };
  const installManagedTool = async (tool) => {
    if (!isElectron || !tool?.managedTool || managedToolInstallId) return;
    setManagedToolInstallId(tool.id);
    try {
      const result = await nativeApi.installManagedTool(tool.managedTool);
      if (!result?.ok) { notify(result?.error || `${tool.name} could not be downloaded.`); return; }
      if (result.exePath) {
        updateTool(tool.id, { exePath: result.exePath, availability: 'installed', managedInstalledAt: Date.now(), managedInstallMode: result.mode || 'official' });
        notify(`${tool.name} is ready in Tools.`);
      } else {
        updateTool(tool.id, { availability: 'missing', officialInstallerOpenedAt: Date.now() });
        notify(result.error || `${tool.name} installer finished. Use Locate if it chose a custom folder.`);
      }
    } catch (error) { notify(`${tool.name} install failed: ${error?.message || 'unknown error'}`); }
    finally { setManagedToolInstallId(''); }
  };
  const recordLaunchProblem = (gameId, reason) => {
    const current = (libraryRef.current?.games || []).find((game) => game.id === gameId);
    if (!current) return;
    const cutoff = Date.now() - 10 * 60 * 1000;
    const launchProblems = [...(current.launchProblems || []), { at: Date.now(), reason }].filter((entry) => Number(entry.at || 0) >= cutoff).slice(-4);
    const patch = { launchProblems, launchDoctorSuggested: launchProblems.length >= 2 };
    updateGame(gameId, patch);
    if (launchProblems.length >= 2) {
      setLaunchDoctorGame({ ...current, ...patch });
      notify(`Launch Doctor · ${current.name} closed immediately more than once.`);
    }
  };
  const removeGame = (id) => {
    setLibrary((prev) => {
      const order = { ...(prev[sliceK.order] || {}) };
      for (const k of Object.keys(order)) order[k] = order[k].filter((x) => x !== id);
      return {
        ...prev,
        [sliceK.items]: (prev[sliceK.items] || []).filter((g) => g.id !== id),
        [sliceK.order]: order,
      };
    });
    // Clean up the pinned-games list if this game was pinned
    if ((settings.pinnedGameIds || []).includes(id)) {
      updateSetting({
        pinnedGameIds: (settings.pinnedGameIds || []).filter((x) => x !== id),
      });
    }
    if (currentSelectedId === id) setCurrentSelectedId(null);
    notify(isTools ? 'Tool removed' : 'Game removed');
  };

  const launchGame = async (g, launchToken = '') => {
    if (launchRequestInFlight.current) {
      notify('A launch request is already being handled.');
      return;
    }
    launchRequestInFlight.current = true;
    try {
      if (!isElectron) {
        notify(`Would launch: ${g.exePath}`);
        return;
      }
      const res = await nativeApi.launchGame({
        exePath: g.exePath, launchArgs: g.launchArgs || '', gameId: g.id, name: g.name, launchToken,
      });
      if (!res.ok) {
        recordLaunchProblem(g.id, res.error || 'could not start');
        notify('Launch failed: ' + (res.error || ''));
      }
      else {
        if (isTools || g.launchTargetType === 'uri') {
          if (isTools) updateSetting({ lastToolId: g.id });
          notify(`${g.name} opened.`);
          return;
        }
        if (settings.fungistEnabled !== false && settings.soundsEnabled !== false && (settings.soundPack || 'synthwave') !== 'none' && settings.fungistVoiceEnabled !== false && settings.fungistNotifications?.gameLaunch !== false) {
          playMascotVoice('play-time', { mascotId: settings.mascotId || 'fungist', volume: settings.fungistVoiceVolume ?? 72, cooldownMs: 12_000 });
        }
        const launchOrigin = launchOriginRef.current;
        updateGame(g.id, { lastPlayedAt: Date.now() });
        window.clearTimeout(fungistLaunchTimer.current);
        setFungistLaunchCelebration({ key: Date.now(), origin: launchOrigin, gameName: g.name });
        fungistLaunchTimer.current = window.setTimeout(() => setFungistLaunchCelebration(null), 1_750);
        setRunningGame({ id: g.id, name: g.name, source: 'neolib' });
        notify(`Launching ${g.name}… NEO-LIB is resting in the background.`);
        // A new play session is also a useful time to refresh version evidence.
        // It runs out of view, is bounded in the main process, and only reads
        // local game files/public update pages.
        window.setTimeout(() => {
          nativeApi.scanGameUpdates?.({ games: library.games.map(({ id, name, appid, launcher, source, steamOwned, installedVersion, updateWatchUrl, website, exePath }) => ({ id, name, appid, launcher, source, steamOwned, installedVersion, updateWatchUrl, website, exePath })) }).then(recordUpdateLedger).catch(() => {});
        }, 1250);
      }
    } finally {
      launchOriginRef.current = null;
      window.setTimeout(() => { launchRequestInFlight.current = false; }, 750);
    }
  };

  /* --- Metadata --- */
  // Ref keeps metadata callbacks current for review and repair workflows
  // without retriggering their owners on every render.
  const refetchGameRef = React.useRef(null);
  const {
    refetchGame,
    applyAcceptedMetadata,
    beginMetadataRepairQueue,
    advanceMetadataRepairQueue,
    stopMetadataRepairQueue,
    requestMetadataRefresh,
  } = createMetadataWorkflow({
    isElectron,
    notify,
    setRefreshReview,
    setFetching,
    nativeApi,
    settings,
    setAcceptPreview,
    setTroubleshoot,
    updateGame,
    libraryRef,
    setMetadataRepairQueue,
    setTidyOpen,
    setSelectedId,
    setMode,
    setFetchPickerGame,
    metadataRepairQueue,
    currentItems,
    setConfirmCfg,
    guessNameFromPath,
  });

  // Keep ref in sync so background callers always invoke the latest refetchGame
  React.useEffect(() => { refetchGameRef.current = refetchGame; });

  /* --- Categories --- */
  const {
    createCategory,
    updateCategory,
    requestDeleteCategory,
    clearRegularCategories,
    reorderCategory,
    moveGameToCategory,
    reorderGameInCategory,
    toggleGameInCategory,
    requestUnlock,
    handleCategoryAction,
    panicLockPrivateLibrary,
  } = createCategoryPrivacyWorkflow({
    setLibrary,
    sliceK,
    setCatModal,
    notify,
    settings,
    unlockedCategories,
    setPinThen,
    setPinModal,
    askPrompt,
    library,
    askConfirm,
    updateGame,
    catCtx,
    setCatCtx,
    setUnlockedCategories,
    setSelectedToolId,
    setSelectedId,
    updateSetting,
    uid,
    hashPin,
    onMascotActivity: setMascotActivity,
  });


  /* --- Auto-sort: create missing reviewed categories, assign, and support one exact undo --- */
  const { applyAutoSort: handleAutoSortApply, undoAutoSort } = createAutoSortWorkflow({
    currentCats,
    currentItems,
    setLibrary,
    sliceK,
    setAutoSortUndo,
    notify,
    fireConfetti,
    autoSortUndo,
    uid,
  });

  const refetchMissingGenres = async (g) => {
    if (!isElectron) return;
    const result = await nativeApi.fetchMetadata({
      query: g.name,
      skipSources: [],
      geminiKey: settings.geminiKey || '',
      aiModel: settings.aiModel || 'gemini-2.5-flash',
      lockedAppid: String(g.launcher || '').toLowerCase() === 'battlenet' ? null : (g.appid || null),
      launcher: g.launcher || '',
      launcherProductId: g.launcherProductId || '',
      force: true,
    });
    if (result?.genres?.length) updateGame(g.id, { genres: result.genres, genreTags: result.genreTags?.length ? result.genreTags : result.genres });
  };

  /* --- Game right-click actions --- */
  const handleGameContext = async (action, g) => {
    if (action === 'pin' || action === 'unpin') {
      const current = settings.pinnedGameIds || [];
      if (action === 'pin') {
        if (current.includes(g.id)) return;
        if (current.length >= 5) {
          notify('Max 5 pinned — unpin one first.');
          return;
        }
        updateSetting({ pinnedGameIds: [...current, g.id] });
        notify(`📌 Pinned ${g.name}`);
      } else {
        updateSetting({ pinnedGameIds: current.filter((id) => id !== g.id) });
        notify(`Unpinned ${g.name}`);
      }
      return;
    }
    if (action === 'remove') {
      const ok = await askConfirm({
        title: 'Remove game from library?',
        message: `"${g.name}" will be removed from your library. The game files on disk are NOT touched — only this library entry is removed.`,
        confirmLabel: 'Remove',
        cancelLabel: 'Cancel',
        destructive: true,
      });
      if (ok) removeGame(g.id);
      return;
    }
    if (action === 'reveal') {
      if (isElectron) {
        const result = await nativeApi.revealInFolder(g.exePath);
        if (!result?.ok) notify(result?.error || 'Could not open this game folder.');
        else if (result?.missingTarget) notify('The configured game file is missing, so NEO-LIB opened its containing folder instead.');
      }
      else notify('Open: ' + g.exePath);
      return;
    }
    if (action === 'save-games') {
      setSaveManagerGame(g);
      return;
    }
    if (action === 'launch-doctor') {
      setLaunchDoctorGame(g);
      return;
    }
    // v1.5.0 — Reset a single game's playtime to 0. Useful when Steam import
    // (or the old buggy game-exit tracker) inflated numbers.
    // v1.6.0 — Confirmation copy made painfully explicit + requires
    // typed-confirmation for values > 100h. Only resets NEO-LIB's local
    // playtime record; Steam's own records are never touched.
    if (action === 'reset-playtime') {
      const currentMins = Number(g.playtime) || 0;
      const currentH = Math.floor(currentMins / 60);
      const requireTyping = currentH > 100;
      const ok = await askConfirm({
        title: 'Reset LOCAL playtime?',
        message:
          `"${g.name}" — currently ${formatPlaytime(currentMins)}.\n\n` +
          `This wipes NEO-LIB's local playtime record only. Steam's own records are NEVER touched. ` +
          `If this game is Steam-owned and signed-in on your machine, the next import will re-add Steam's hours (unless you also uncheck it in the import preview).\n\n` +
          (requireTyping ? `Type RESET to confirm — this is a large value.` : ''),
        confirmLabel: requireTyping ? 'Yes, RESET' : 'Reset to 0',
        cancelLabel: 'Keep it',
        destructive: true,
        typedConfirm: requireTyping ? 'RESET' : undefined,
      });
      if (!ok) return;
      updateGame(g.id, { playtime: 0, lastPlayedAt: 0, playtimeManual: false });
      notify(`Local playtime reset for ${g.name}`);
      return;
    }
    // v1.5.0 / v1.6.0 — Re-import Steam playtime — now opens the preview modal
    // instead of silently writing, so user sees exactly what will change.
    if (action === 'reimport-steam') {
      if (!isElectron || !nativeApi?.importSteamPlaytime) {
        notify('Steam import only available in the desktop build.');
        return;
      }
      openPlaytimeImport({ force: true });
      return;
    }
    if (action === 'refetch') {
      // Open the Troubleshoot modal instead of immediately refetching
      setTroubleshoot({ open: true, game: g });
      return;
    }
    if (action === 'research') {
      const name = await askPrompt({
        title: 'Re-search by name',
        label: 'New search query (will overwrite metadata):',
        defaultValue: g.name || '',
        placeholder: 'e.g. The Witcher 3',
        confirmLabel: 'Search',
      });
      if (name && name.trim()) {
        await refetchGame(g, { query: name.trim(), forceSearch: true, skipCurrentSource: false });
      }
      return;
    }
    if (action === 'rename') {
      const name = await askPrompt({
        title: 'Rename game',
        label: 'Display name',
        defaultValue: g.name || '',
        placeholder: 'Game title',
        confirmLabel: 'Rename',
      });
      if (name && name.trim()) updateGame(g.id, { name: name.trim() });
      return;
    }
    if (action === 'args') {
      const args = await askPrompt({
        title: 'Launch arguments',
        label: 'Arguments passed to the executable',
        defaultValue: g.launchArgs || '',
        placeholder: '-fullscreen -dx11',
        confirmLabel: 'Save',
      });
      if (args !== null) updateGame(g.id, { launchArgs: args });
      return;
    }
    if (action === 'details') {
      setEditMetaGame(g);
      return;
    }
    if (action === 'manage-categories') {
      setCatModal({ open: true, initial: null });
      return;
    }
  };

  /* --- Troubleshoot actions (smart per-field refetch) --- */
  const handleTroubleshoot = async ({ type }) => {
    const g = troubleshoot.game;
    if (!g) return;
    if (type === 'research') {
      setTroubleshoot({ open: false, game: null });
      const name = await askPrompt({
        title: 'Re-search by name',
        label: 'Search for a different game (this will overwrite metadata):',
        defaultValue: g.name,
        confirmLabel: 'Search',
      });
      if (name && name.trim()) {
        await refetchGame(g, { query: name.trim(), forceSearch: true });
      }
      return;
    }
    if (!isElectron) { notify('Re-fetch only works in the installed app.'); return; }
    setTroubleshoot({ open: false, game: null });
    setRefreshReview({ games: [g], index: 0, field: type });
  };

  /* --- Collapsed state --- */
  const toggleCollapsed = (id) =>
    updateSetting({ collapsed: { ...settings.collapsed, [id]: !settings.collapsed[id] } });

  // Launcher filter — only used on Library tab.
  // Uses g.launcher exclusively. g.source (Steam API, GOG API) is metadata-origin
  // and intentionally NOT considered here — a manually-added game whose metadata
  // was fetched from Steam is NOT a Steam-launcher game.
  const launcherFilter = settings.launcherFilter || 'all';
  const visibleGames = React.useMemo(() => filterByLauncher(currentItems, launcherFilter, isTools), [currentItems, isTools, launcherFilter]);
  const selected = currentItems.find((g) => g.id === currentSelectedId) || null;
  const libraryViewMode = settings.libraryViewMode || 'preview';
  const wallActive = settings.mode === 'library' && libraryViewMode === 'wall';
  const preferredLibraryEntry = React.useMemo(() => preferredLibraryGame(library.games || [], settings.lastGameId), [library.games, settings.lastGameId]);
  const preferredToolEntry = React.useMemo(() => preferredTool(library.tools || [], settings.lastToolId), [library.tools, settings.lastToolId]);
  const openLibraryDefault = React.useCallback(() => {
    updateSetting({ mode: 'library', libraryViewMode: 'preview', launcherFilter: 'all' });
    setSelectedId(preferredLibraryEntry?.id || null);
  }, [preferredLibraryEntry, updateSetting]);
  const openToolsDefault = React.useCallback(() => {
    updateSetting({ mode: 'tools' });
    setSelectedToolId(preferredToolEntry?.id || null);
  }, [preferredToolEntry, updateSetting]);
  React.useEffect(() => {
    if ((settings.mode || 'library') === 'library' && libraryViewMode === 'preview' && !selectedId && preferredLibraryEntry) setSelectedId(preferredLibraryEntry.id);
  }, [settings.mode, libraryViewMode, selectedId, preferredLibraryEntry]);
  React.useEffect(() => {
    if (settings.mode === 'tools' && !selectedToolId && preferredToolEntry) setSelectedToolId(preferredToolEntry.id);
  }, [settings.mode, selectedToolId, preferredToolEntry]);
  React.useEffect(() => {
    if (selectedId && selectedId !== settings.lastGameId) updateSetting({ lastGameId: selectedId });
  }, [selectedId, settings.lastGameId, updateSetting]);
  React.useEffect(() => {
    if (selectedToolId && selectedToolId !== settings.lastToolId) updateSetting({ lastToolId: selectedToolId });
  }, [selectedToolId, settings.lastToolId, updateSetting]);
  const coverWallGames = React.useMemo(() => visibleUnlockedGames(visibleGames, currentCats, unlockedCategories), [visibleGames, currentCats, unlockedCategories]);
  // Home must remain useful without accidentally exposing a protected game.
  // Keep time/rating/activity numbers so dashboard totals still make sense,
  // but replace every identifying field (name, art, platform, metadata, path,
  // and online lookup key) with one category-aware protected placeholder.
  const lockedHomeCategoryByGameId = React.useMemo(() => gameLockedCategoryMap(library.games || [], library.categories || [], unlockedCategories), [library.categories, library.games, unlockedCategories]);
  const homeGames = React.useMemo(() => redactLockedHomeGames(library.games || [], library.categories || [], unlockedCategories), [library.games, library.categories, unlockedCategories]);
  const lockedWallCategories = React.useMemo(
    () => currentCats.filter((category) => category.private && !unlockedCategories.includes(category.id)),
    [currentCats, unlockedCategories],
  );
  const favouriteUpdate = React.useMemo(() => {
    const ledger = settings.updateStatusLedger || {};
    const pinned = new Set(settings.pinnedGameIds || []);
    return (library.games || []).find((game) => pinned.has(game.id) && ['available', 'pending'].includes(ledger[game.id]?.status));
  }, [library.games, settings.pinnedGameIds, settings.updateStatusLedger]);
  const activeVisuals = visualState(settings, gameRestActive);
  const specialUiTheme = activeVisuals.specialTheme;
  const activeEffectsLevel = activeVisuals.effectsLevel;
  const specialUiOpacity = activeVisuals.decorationOpacity;
  // Button borders are static, tiny artwork—not a particle system. They keep
  // following the Special-decoration slider and Rest Mode, but must not
  // disappear merely because the player lowers global FX for performance.
  const specialNavDecorationOpacity = activeVisuals.navigationDecorationOpacity;

  return (
    <div className="neolib-app-shell relative flex h-screen w-screen flex-col bg-surface text-ink" data-neolib-resting={gameRestActive ? 'true' : 'false'} data-special-theme={specialUiTheme || undefined} style={{
      '--special-ui-decoration-opacity': specialUiOpacity,
      '--special-nav-decoration-opacity': specialNavDecorationOpacity,
      '--special-anime-art': `url(${import.meta.env.BASE_URL}theme-art/anime-control-vine-v1.png)`,
      '--special-industrial-art': `url(${import.meta.env.BASE_URL}theme-art/industrial-control-machinery-v1.png)`,
      '--special-magical-art': `url(${import.meta.env.BASE_URL}theme-art/magical-control-runes-v1.png)`,
      '--special-anime-button-frame': `url(${import.meta.env.BASE_URL}theme-art/anime-button-frame-v2.png)`,
      '--special-industrial-button-frame': `url(${import.meta.env.BASE_URL}theme-art/industrial-button-frame-v2.png)`,
      '--special-magical-button-frame': `url(${import.meta.env.BASE_URL}theme-art/magical-button-frame-v2.png)`,
    }}>
      <HoverTips />
      {/* Window edge glow — soft inner halo around the frameless window (Riot/Discord style) */}
      <div className="window-edge-glow" aria-hidden="true" />
      <BgAmbience theme={settings.theme} settings={settings} game={selected} resting={gameRestActive} />
      {/* v1.6.4 — BgTexture no longer renders as full-viewport overlay.
          Sidebar renders the texture inside its own body via bgTextureStyle. */}
      <div className="neolib-ui-foreground relative z-20">
        <TitleBar
          search={search}
          setSearch={setSearch}
          currentVersion={APP_VERSION}
          updateAvailable={updateInfo?.available || false}
          latestVersion={updateInfo?.latestVersion || ''}
          onClickUpdate={openReleasesPage}
          onOpenFeedback={openFeedback}
          onDonate={() => { if (settings.fungistEnabled !== false && settings.soundsEnabled !== false && (settings.soundPack || 'synthwave') !== 'none' && settings.fungistVoiceEnabled !== false) playMascotVoice('donate', { mascotId: settings.mascotId || 'fungist', volume: settings.fungistVoiceVolume ?? 72, cooldownMs: 18_000 }); setDonateOpen(true); }}
        />
      </div>

      <div className="neolib-ui-foreground relative z-20 flex min-h-0 flex-1">
        {!wallActive && <Sidebar
          games={visibleGames}
          categories={currentCats}
          gameOrderByCategory={currentOrder}
          collapsed={settings.collapsed || {}}
          unlockedCategories={unlockedCategories}
          search={search}
          selectedId={currentSelectedId}
          rowSize={settings.rowSize ?? 44}
          catTextSize={settings.catTextSize ?? 11}
          catGlow={settings.catGlow ?? 40}
          rowGap={settings.rowGap ?? 2}
          catGap={settings.catGap ?? 8}
          catTopGap={settings.catTopGap ?? 4}
          iconPosition={settings.iconPosition || 'left'}
          categoryMarkerMode={settings.categoryMarkerMode || (settings.showCategoryDot === false ? 'background' : 'dot')}
          showCategoryDot={(settings.categoryMarkerMode || (settings.showCategoryDot === false ? 'background' : 'dot')) === 'dot'}
          pinnedIds={settings.pinnedGameIds || []}
          onChangeRowSize={(v) => updateSetting({ rowSize: v })}
          onChangeCatTextSize={(v) => updateSetting({ catTextSize: v })}
          onChangeCatGlow={(v) => updateSetting({ catGlow: v })}
          onChangeRowGap={(v) => updateSetting({ rowGap: v })}
          onChangeCatGap={(v) => updateSetting({ catGap: v })}
          onChangeCatTopGap={(v) => updateSetting({ catTopGap: v })}
          onChangeIconPosition={(v) => updateSetting({ iconPosition: v })}
          onChangeCategoryMarkerMode={(v) => updateSetting({ categoryMarkerMode: v, showCategoryDot: v === 'dot' })}
          showSubcatStrip={settings.showSubcatStrip !== false}
          onToggleSubcatStrip={(v) => updateSetting({ showSubcatStrip: v })}
          nameTextSize={Number.isFinite(settings.nameTextSize) ? settings.nameTextSize : null}
          onChangeNameTextSize={(v) => updateSetting({ nameTextSize: v })}
          libraryFont={settings.libraryFont || 'system'}
          libraryFontWeight={settings.libraryFontWeight || 'regular'}
          libraryFontCursive={settings.libraryFontCursive === true}
          onChangeLibraryFont={(v) => updateSetting({ libraryFont: v })}
          onChangeLibraryFontWeight={(v) => updateSetting({ libraryFontWeight: v })}
          onChangeLibraryFontCursive={(v) => updateSetting({ libraryFontCursive: v })}
          unseenNewsCount={unseenNewsCount}
          effectsLevel={(() => {
            const map = settings.effectsLevelByTheme || {};
            const perTheme = map[settings.theme || 'synthwave'];
            if (Number.isFinite(perTheme)) return perTheme;
            return Number.isFinite(settings.effectsLevel) ? settings.effectsLevel : 2;
          })()}
          currentTheme={settings.theme || 'synthwave'}
          navDecorationOpacity={specialNavDecorationOpacity}
          onChangeEffectsLevel={(v) => {
            const map = { ...(settings.effectsLevelByTheme || {}) };
            map[settings.theme || 'synthwave'] = v;
            updateSetting({ effectsLevelByTheme: map, effectsLevel: v });
          }}
          motionCadence={settings.motionCadence || 'full'}
          onChangeMotionCadence={(v) => updateSetting({ motionCadence: v })}
          bgTextureId={settings.bgTextureId || 'none'}
          bgTextureOpacity={Number.isFinite(settings.bgTextureOpacity) ? settings.bgTextureOpacity : 40}
          onChangeBgTextureId={(v) => updateSetting({ bgTextureId: v })}
          onChangeBgTextureOpacity={(v) => updateSetting({ bgTextureOpacity: v })}
          cursorTheme={settings.cursorTheme || 'windows'}
          onChangeCursorTheme={(cursorTheme) => updateSetting({ cursorTheme })}
          mode={settings.mode || 'library'}
          onSetMode={(nextMode) => {
            if (nextMode === 'library') openLibraryDefault();
            else if (nextMode === 'tools') openToolsDefault();
            else setMode(nextMode);
          }}
          showCategories={settings.showLibraryCategories !== false}
          onToggleCategories={(showLibraryCategories) => updateSetting({ showLibraryCategories })}
          onManageCategories={() => setCategoryManagerOpen(true)}
          librarySortMode={settings.librarySortMode || 'manual'}
          onChangeLibrarySort={(librarySortMode) => updateSetting({ librarySortMode })}
          libraryViewMode={libraryViewMode}
          onChangeLibraryViewMode={(nextMode) => { updateSetting({ libraryViewMode: nextMode }); if (nextMode === 'wall') { setSelectedId(null); setMode('library'); } else if (nextMode === 'preview') openLibraryDefault(); }}
          tutorialVisualsOpen={tutorialOpen && tutorialVisualsOpen}
          launcherFilter={launcherFilter}
          onSetLauncherFilter={(v) => updateSetting({ launcherFilter: v })}
          onAutoSort={() => setAutoSortOpen(true)}
          twoRow={!!settings.twoRow}
          onToggleTwoRow={(v) => updateSetting({ twoRow: v })}
          libraryIconMode={settings.libraryIconMode === true}
          libraryIconSize={settings.libraryIconSize ?? 48}
          libraryIconSpacing={settings.libraryIconSpacing ?? 8}
          libraryIconRows={settings.libraryIconRows ?? 3}
          onToggleLibraryIconMode={(libraryIconMode) => updateSetting({ libraryIconMode })}
          onChangeLibraryIconSize={(libraryIconSize) => updateSetting({ libraryIconSize })}
          onChangeLibraryIconSpacing={(libraryIconSpacing) => updateSetting({ libraryIconSpacing })}
          onChangeLibraryIconRows={(libraryIconRows) => updateSetting({ libraryIconRows })}
          sidebarWidth={sidebarWidth}
          onStartResize={startResize}
          onGameViewed={markGameSeenInLibrary}
          onSelect={(id) => { setCurrentSelectedId(id); if (id && settings.mode === 'home') setMode('library'); }}
          onAddManual={() => { setToolMetadataTarget(null); setShowAdd(true); }}
          onOpenWizard={() => setShowWizard(true)}
          manualResting={manualRestActive}
          onToggleManualRest={toggleManualRest}
          onOpenFeedback={openFeedback}
          onCreateCategory={() => setCatModal({ open: true, initial: null })}
          onCategoryContext={(category, anchor) => setCatCtx({ open: true, category, anchor })}
          onGameContext={handleGameContext}
          onMoveGameToCategory={moveGameToCategory}
          onReorderGameInCategory={reorderGameInCategory}
          onReorderCategory={reorderCategory}
          onToggleCollapsed={toggleCollapsed}
          onUnlockCategory={requestUnlock}
          gameResting={gameRestActive}
          restReason={restReason}
          runningGameName={runningGame?.name || ''}
          allGames={library.games || []}
          onOpenSettings={() => setShowSettings(true)}
          onOpenThemes={() => setThemeStudioOpen(true)}
          onOpenMascot={() => setMascotCenterOpen(true)}
          onOpenControllerCenter={() => setControllerCenterOpen(true)}
          onOpenChangelog={() => setChangelogOpen(true)}
          onCheckForUpdates={checkForAppUpdateNow}
          onQuit={() => nativeApi?.quit?.()}
          onSystemHealthChange={onMascotHealthChange}
          systemHealthOpenRequest={mascotHealthOpenRequest}
        />}

        <main className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex-1 min-h-0 overflow-hidden">
            {!isTools && settings.mode === 'home' ? (
              <HomeHub games={homeGames} lockedGameCategories={lockedHomeCategoryByGameId} hasPrivateCategories={(library.categories || []).some((category) => category.private)} hasLockedPrivateCategories={(library.categories || []).some((category) => category.private && !unlockedCategories.includes(category.id))} onPanicLock={panicLockPrivateLibrary} resting={gameRestActive} homeLayout={settings.homeLayout || {}} onUpdateHomeLayout={(homeLayout) => updateSetting({ homeLayout })} updatesCache={settings.homeGameUpdatesCache} onUpdateUpdatesCache={(homeGameUpdatesCache) => updateSetting({ homeGameUpdatesCache })} onSelect={(id) => { if (lockedHomeCategoryByGameId[id]) { notify(`Unlock ${lockedHomeCategoryByGameId[id]} in Library to reveal this game.`); return; } setSelectedId(id); setMode('library'); }} onOpenPlaytimeImport={() => openPlaytimeImport({ force: true })} onOpenTidyUp={() => setTidyOpen(true)} />
            ) : !isTools && wallActive ? (
              <CoverWall
                games={coverWallGames}
                density={settings.coverWallDensity || 5}
                onDensityChange={(coverWallDensity) => updateSetting({ coverWallDensity })}
                view={settings.wallView || 'covers'}
                onChangeView={(wallView) => updateSetting({ wallView })}
                onSelect={(id) => { setSelectedId(id); updateSetting({ mode: 'library', libraryViewMode: 'preview' }); }}
                onOpenHome={() => { setSelectedId(null); updateSetting({ mode: 'home', libraryViewMode: 'preview' }); }}
                onOpenLibrary={openLibraryDefault}
                search={search}
                lockedCategories={lockedWallCategories}
                onUnlockCategory={requestUnlock}
              />
            ) : !selected ? (
              <WorkspaceEmpty kind={isTools ? 'tools' : 'library'} />
            ) : (
              <AnimatePresence mode="wait">{isTools ? <ToolDetail key={selected?.id || 'empty'} tool={selected} onLaunch={(tool, token) => launchGame(tool, token)} onRefetch={(tool) => { setToolMetadataTarget(tool); setShowAdd(true); }} onRevealFolder={async (tool) => { if (!isElectron) return notify('Open: ' + tool.exePath); const result = await nativeApi.revealInFolder(tool.exePath); if (!result?.ok) notify(result?.error || 'Could not open this tool folder.'); }} onLocateManagedTool={locateManagedTool} onInstallManagedTool={installManagedTool} installing={managedToolInstallId === selected?.id} /> : <GameDetail key={selected?.id || 'empty'} game={selected} categories={currentCats.filter((c) => !c.private || unlockedCategories.includes(c.id))} fetching={fetching} settings={settings} onLaunch={(game, token, origin) => { launchOriginRef.current = origin || null; return launchGame(game, token); }} onLaunchError={(error) => notify(`Launch blocked: ${error}`)} onRefetch={(g) => setFetchPickerGame(g)} onRevealFolder={async (g) => { if (!isElectron) return notify('Open: ' + g.exePath); const result = await nativeApi.revealInFolder(g.exePath); if (!result?.ok) notify(result?.error || 'Could not open this game folder.'); else if (result?.missingTarget) notify('The configured game file is missing, so NEO-LIB opened its containing folder instead.'); }} onToggleCategory={toggleGameInCategory} onCustomize={(g) => setEditMetaGame(g)} onOpenSaveManager={(g) => setSaveManagerGame(g)} onUpdateGame={updateGame} onLocateManagedTool={locateManagedTool} onInstallManagedTool={installManagedTool} managedToolInstalling={managedToolInstallId === selected?.id} />}</AnimatePresence>
            )}
          </div>
        </main>
      </div>

      {/* One subtle sponsored rail — all deals remain available from its popover. */}
      <div className="neolib-ui-foreground relative z-20">
        <DealsBar
          settings={settings}
          resting={gameRestActive}
          launcherClientPaths={settings.launcherClientPaths || settings.friendsClientPaths || {}}
          onUpdateLauncherClientPaths={(launcherClientPaths) => updateSetting({ launcherClientPaths })}
        />
      </div>

      <FungistMascot
        mascotId={settings.mascotId || 'fungist'}
        effectsLevel={activeEffectsLevel}
        enabled={settings.fungistEnabled !== false}
        resting={gameRestActive}
        notificationSettings={settings.fungistNotifications || {}}
        healthState={mascotHealth.state}
        newsAlert={newsAlert}
        favouriteUpdate={favouriteUpdate}
        appUpdate={updateInfo?.available ? updateInfo : null}
        activity={mascotActivity}
        onMajorNotice={(notice) => showMajorMascotNotice({ ...notice, status: notice.status || 'Needs attention' })}
        onOpenHealth={openMascotHealth}
        externalRunningGame={externalRunningGame}
        onScanRunningGame={scanForExternalRunningGame}
        onEnableExternalRest={enableExternalRestMode}
        onOpenNews={(alert) => {
          if (!alert?.url) return;
          if (isElectron && nativeApi?.openExternal) nativeApi.openExternal(alert.url);
          else window.open(alert.url, '_blank');
        }}
        onOpenGame={(id) => { if (id) { setSelectedId(id); setMode('library'); } }}
        onOpenAppUpdate={openReleasesPage}
        onDismissNews={() => setNewsAlert(null)}
        onAskAi={askFungist}
        onOpenSettings={() => setShowSettings(true)}
        inbox={settings.fungistInbox || []}
        chatHistory={settings.fungistChatHistory || []}
        onSaveChatHistory={(fungistChatHistory) => updateSetting({ fungistChatHistory: Array.isArray(fungistChatHistory) ? fungistChatHistory.slice(-80) : [] })}
        onClearChatHistory={() => updateSetting({ fungistChatHistory: [] })}
        onRecordNotice={recordFungistNotice}
        onClearInbox={clearFungistInbox}
        onUpdatePreferences={updateSetting}
        aiReady={Boolean(settings.geminiKey?.trim())}
        aiModel={settings.aiModel === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' : 'Configured AI model'}
        soundsEnabled={settings.fungistEnabled !== false && settings.soundsEnabled !== false && (settings.soundPack || 'synthwave') !== 'none'}
        voiceEnabled={settings.fungistEnabled !== false && settings.fungistVoiceEnabled !== false}
        voiceVolume={settings.fungistVoiceVolume ?? 72}
        mascotSize={settings.fungistSize ?? 100}
        completion={fungistCompletion}
        launchCelebration={fungistLaunchCelebration}
        welcomeKey={fungistWelcomeKey}
        dockPosition={settings.fungistDockPosition || null}
        contextPosition={settings.fungistContextPosition || null}
        onOpenHome={() => { setCurrentSelectedId(null); setMode('home'); }}
        libraryGames={coverWallGames}
        onLaunchRequested={(game, token, origin) => { launchOriginRef.current = origin || null; return launchGame(game, token); }}
        onReportBug={() => openFeedback('bug')}
      />

      <MajorMascotNotice notice={majorMascotNotice} mascotId={settings.mascotId || 'fungist'} onClose={() => setMajorMascotNotice(null)} />

      <AnimatePresence>
        {wakeTransitionActive && (
          <motion.div
            key="wake-transition"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="fixed inset-0 z-[9998] grid place-items-center bg-[rgb(var(--surface)/0.48)]"
            data-testid="rest-wake-overlay"
            aria-live="polite"
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="rounded-2xl border border-[rgb(var(--accent)/0.72)] bg-[rgb(var(--panel)/0.92)] px-7 py-5 text-center shadow-[0_0_46px_-8px_rgb(var(--accent)/0.8)]"
            >
              <div className="mx-auto mb-2 h-2 w-2 rounded-full bg-[rgb(var(--accent))] shadow-[0_0_18px_rgb(var(--accent))]" />
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-ink">Waking up</p>
              <p className="mt-1 text-[10px] text-muted">Rest Mode is ending…</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AppModalLayer
        context={{
          showAdd,
          isTools,
          setShowAdd,
          addGame,
          toolMetadataTarget,
          setToolMetadataTarget,
          addTool,
          updateTool,
          notify,
          showWizard,
          setShowWizard,
          setWizardPrefillRoot,
          setWizardAutoScan,
          requestMetadataRefresh,
          openTidyUp: () => setTidyOpen(true),
          setMascotActivity,
          addToGames,
          library,
          wizardPrefillRoot,
          wizardAutoScan,
          settings,
          showSettings,
          setShowSettings,
          themeStudioOpen,
          setThemeStudioOpen,
          mascotCenterOpen,
          setMascotCenterOpen,
          openFeedback,
          persistSettings,
          setChangelogOpen,
          controllerCenterOpen,
          setControllerCenterOpen,
          nativeApi,
          saveManagerGame,
          setSaveManagerGame,
          updateGame,
          launchDoctorGame,
          setLaunchDoctorGame,
          changelogOpen,
          updateSetting,
          catModal,
          setCatModal,
          updateCategory,
          createCategory,
          categoryManagerOpen,
          setCategoryManagerOpen,
          requestDeleteCategory,
          clearRegularCategories,
          pinModal,
          setPinModal,
          pinThen,
          catCtx,
          setCatCtx,
          handleCategoryAction,
          promptCfg,
          setPromptCfg,
          closePrompt,
          confirmCfg,
          setConfirmCfg,
          editMetaGame,
          setEditMetaGame,
          acceptPreview,
          setAcceptPreview,
          metadataRepairQueue,
          advanceMetadataRepairQueue,
          applyAcceptedMetadata,
          setFetchPickerGame,
          fetchPickerGame,
          stopMetadataRepairQueue,
          tidyOpen,
          setTidyOpen,
          removeGame,
          setSelectedId,
          setMode,
          beginMetadataRepairQueue,
          ratingPromptGame,
          setRatingPromptGame,
          confetti,
          introHiddenThisSession,
          setIntroHiddenThisSession,
          feedbackOpen,
          feedbackInitialMode,
          setFeedbackOpen,
          importPreview,
          setImportPreview,
          applyImportPatches,
          dragOver,
          refreshReview,
          setRefreshReview,
          troubleshoot,
          setTroubleshoot,
          fetching,
          handleTroubleshoot,
          tutorialOpen,
          navigateTutorial,
          setTutorialVisualsOpen,
          setTutorialOpen,
          isElectron,
          autoSortOpen,
          setAutoSortOpen,
          visibleGames,
          currentCats,
          handleAutoSortApply,
          undoAutoSort,
          autoSortUndo,
          refetchMissingGenres,
          donateOpen,
          setDonateOpen,
          detectedLauncher,
          importDetectedLauncher,
          setDetectedLauncher,
          bootDone,
          toast,
          appVersion: APP_VERSION,
        }}
      />
    </div>
  );
}
