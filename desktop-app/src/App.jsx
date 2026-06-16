import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar, { CategoryContextMenu } from './components/Sidebar';
import GameDetail from './components/GameDetail';
import ShowcaseStrip from './components/ShowcaseStrip';
import DealsBar from './components/DealsBar';
import DonateModal from './components/DonateModal';
import LauncherDetectModal from './components/LauncherDetectModal';
import SettingsModal from './components/SettingsModal';
import AddGameModal from './components/AddGameModal';
import WizardModal from './components/WizardModal';
import AutoSortModal from './components/AutoSortModal';
import PromptModal from './components/PromptModal';
import ConfirmModal from './components/ConfirmModal';
import TroubleshootModal from './components/TroubleshootModal';
import TutorialModal from './components/TutorialModal';
import CategoryModal from './components/CategoryModal';
import Confetti from './components/Confetti';
import EditMetadataModal from './components/EditMetadataModal';
import AcceptMetadataModal from './components/AcceptMetadataModal';
import { checkForUpdates } from './lib/updateChecker';

// Read app version once — used by the update checker for comparison.
const APP_VERSION = '1.1.0';
import PinModal from './components/PinModal';
import { uid, guessNameFromPath, hashPin } from './lib/utils';
import { setSoundPack } from './lib/sound';

const isElectron = typeof window !== 'undefined' && !!window.api;

/* ---- Browser-preview demo data ---- */
const NOW = Date.now();
const DEMO_GAMES = [
  {
    id: 'demo-1', name: 'Hollow Knight', appid: 367520, source: 'steam',
    exePath: 'C:\\Games\\Hollow Knight\\hollow_knight.exe',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg',
    headerImage: 'https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg',
    background: 'https://cdn.akamai.steamstatic.com/steam/apps/367520/page_bg_generated_v6b.jpg',
    shortDescription: 'Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom of insects and heroes.',
    about: 'Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom of insects and heroes. Explore twisting caverns, ancient cities and deadly wastes; battle tainted creatures and befriend bizarre bugs; and solve ancient mysteries at the kingdom’s heart.',
    genres: ['Action', 'Adventure', 'Indie', 'Metroidvania'],
    developers: ['Team Cherry'], publishers: ['Team Cherry'],
    releaseDate: '24 Feb, 2017', metacritic: 90, website: 'https://hollowknight.com',
    screenshots: [], categoryIds: ['cat-fav'],
    playtime: 16200, lastPlayedAt: NOW - 86400000, addedAt: NOW - 86400000 * 32,
  },
  {
    id: 'demo-2', name: 'Hades', appid: 1145360, source: 'steam',
    exePath: 'C:\\Games\\Hades\\Hades.exe',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1145360/header.jpg',
    headerImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1145360/header.jpg',
    background: 'https://cdn.akamai.steamstatic.com/steam/apps/1145360/page_bg_generated_v6b.jpg',
    shortDescription: 'Defy the god of the dead as you hack and slash out of the Underworld in this rogue-like dungeon crawler.',
    genres: ['Action', 'Indie', 'Rogue-like'],
    developers: ['Supergiant Games'], publishers: ['Supergiant Games'],
    releaseDate: '17 Sep, 2020', metacritic: 93,
    screenshots: [], categoryIds: ['cat-fav', 'cat-rpg'],
    playtime: 38000, lastPlayedAt: NOW - 86400000 * 3, addedAt: NOW - 86400000 * 14,
  },
  {
    id: 'demo-3', name: 'Disco Elysium', appid: 632470, source: 'steam',
    exePath: 'D:\\Games\\Disco Elysium\\disco.exe',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/632470/header.jpg',
    headerImage: 'https://cdn.akamai.steamstatic.com/steam/apps/632470/header.jpg',
    shortDescription: 'Disco Elysium - The Final Cut is a groundbreaking role playing game.',
    genres: ['RPG', 'Adventure'],
    developers: ['ZA/UM'], publishers: ['ZA/UM'],
    releaseDate: '15 Oct, 2019', metacritic: 91,
    screenshots: [], categoryIds: ['cat-rpg'],
    playtime: 0, addedAt: NOW - 86400000 * 5,
  },
];
const DEMO_CATEGORIES = [
  { id: 'cat-fav', name: 'Favourites', colorId: 'orange', private: false },
  { id: 'cat-rpg', name: 'RPGs', colorId: 'cyan', private: false },
  { id: 'cat-secret', name: 'After hours', colorId: 'magenta', private: true, pinHash: hashPin('1234') },
];

const DEMO_TOOLS = [
  {
    id: 'tool-1', name: 'GPU-Z', exePath: 'C:\\Tools\\GPU-Z\\GPU-Z.exe',
    shortDescription: 'A lightweight system utility designed to provide vital information about your video card.',
    about: 'TechPowerUp GPU-Z is a lightweight system utility designed to provide vital information about your video card and graphics processor.',
    genres: ['System info'], website: 'https://www.techpowerup.com/gpuz/',
    categoryIds: ['tcat-hw'], addedAt: NOW - 86400000 * 22, source: 'manual',
  },
  {
    id: 'tool-2', name: 'CPU-Z', exePath: 'C:\\Tools\\CPU-Z\\cpuz_x64.exe',
    shortDescription: 'Gathers information on some of the main devices of your system.',
    about: 'CPU-Z is a freeware utility that gathers information on some of the main devices of your system: processor, mainboard, memory.',
    genres: ['System info'], website: 'https://www.cpuid.com',
    categoryIds: ['tcat-hw'], addedAt: NOW - 86400000 * 9, source: 'manual',
  },
  {
    id: 'tool-3', name: 'OBS Studio', exePath: 'C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe',
    shortDescription: 'Free open-source software for video recording and live streaming.',
    about: 'OBS Studio is free and open source software for video recording and live streaming.',
    genres: ['Recording'], website: 'https://obsproject.com',
    categoryIds: [], addedAt: NOW - 86400000 * 4, source: 'manual',
  },
];
const DEMO_TOOL_CATEGORIES = [
  { id: 'tcat-hw', name: 'Hardware monitors', colorId: 'lime', private: false },
];

export default function App() {
  const [library, setLibrary] = React.useState({
    games: [], categories: [], gameOrderByCategory: {},
  });
  const [settings, setSettings] = React.useState({
    theme: 'synthwave', firstRun: true, geminiKey: '',
    librarySize: 'medium', showcaseMode: 'recent_added',
    collapsed: {},
  });
  const [selectedId, setSelectedId] = React.useState(null);
  const [selectedToolId, setSelectedToolId] = React.useState(null);
  const [unlockedCategories, setUnlockedCategories] = React.useState([]);
  const [search, setSearch] = React.useState('');

  const [showAdd, setShowAdd] = React.useState(false);
  const [showWizard, setShowWizard] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

  const [catModal, setCatModal] = React.useState({ open: false, initial: null });
  const [catCtx, setCatCtx] = React.useState({ open: false, category: null, anchor: null });
  const [pinModal, setPinModal] = React.useState({ open: false, mode: 'unlock', category: null, error: '' });
  const [pinThen, setPinThen] = React.useState(null);

  const [fetching, setFetching] = React.useState(false);
  const [updatingAll, setUpdatingAll] = React.useState(false);
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
    setSoundPack(settings.soundsEnabled === false ? 'none' : (settings.soundPack || 'synthwave'));
  }, [settings.soundsEnabled, settings.soundPack]);

  /* --- CRT boot animation on first paint --- */
  const [bootDone, setBootDone] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setBootDone(true), 1400);
    return () => clearTimeout(t);
  }, []);

  /* --- Tutorial state (first-time popup) --- */
  const [tutorialOpen, setTutorialOpen] = React.useState(false);
  React.useEffect(() => {
    // Open tutorial if user hasn't dismissed it AND setting allows
    const seen = isElectron ? settings.tutorialSeen : (typeof localStorage !== 'undefined' && localStorage.getItem('neo-lib-tutorial-seen') === '1');
    if (!seen || settings.tutorialAlwaysShow) {
      // Slight delay so app + sidebar are rendered
      const t = setTimeout(() => setTutorialOpen(true), 1500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [settings.tutorialSeen, settings.tutorialAlwaysShow]);

  /* --- Troubleshoot state (smart refetch) --- */
  const [troubleshoot, setTroubleshoot] = React.useState({ open: false, game: null });

  /* --- Auto-sort state --- */
  const [autoSortOpen, setAutoSortOpen] = React.useState(false);

  /* --- Donate modal --- */
  const [donateOpen, setDonateOpen] = React.useState(false);

  /* --- Confetti & sparkle bursts (theme-aware) --- */
  const [confetti, setConfetti] = React.useState({ key: 0, label: '', origin: null });
  const fireConfetti = React.useCallback((label = '', origin = null) => {
    setConfetti({ key: Date.now(), label, origin });
  }, []);

  /* --- Edit metadata modal (manual override for itch.io / indie games) --- */
  const [editMetaGame, setEditMetaGame] = React.useState(null);

  /* --- Auto-update checker (GitHub releases API) --- */
  const [updateInfo, setUpdateInfo] = React.useState(null);

  /* --- Accept-before-add modal (preview proposed metadata before applying) --- */
  const [acceptPreview, setAcceptPreview] = React.useState({ open: false, game: null, proposed: null, busy: false });

  /* --- Drag-drop overlay state --- */
  const [dragOver, setDragOver] = React.useState(false);
  const [wizardPrefillRoot, setWizardPrefillRoot] = React.useState('');
  const [wizardAutoScan, setWizardAutoScan] = React.useState(false);

  /* --- Launcher detector --- */
  const [detectedLauncher, setDetectedLauncher] = React.useState(null);
  // Track in-flight silent imports so the polling loop doesn't double-fire
  const silentImportInFlight = React.useRef({});
  React.useEffect(() => {
    if (!isElectron || !window.api?.detectLaunchers) return undefined;
    if (settings.launcherDetectEnabled === false) return undefined;
    let cancelled = false;
    const dismissed = settings.launcherDetectDismissed || {};
    const askLater = settings.launcherAskLater || {};
    const autoImport = settings.launcherAutoImport || {};

    const LAUNCHER_LABELS = { steam: 'Steam', epic: 'Epic Games', ea: 'EA', gog: 'GOG' };

    // Silent diff-and-import for launchers the user previously approved.
    // Adds only NEW games (by appid or exePath), auto-refetches metadata, shows one toast.
    const silentImport = async (key) => {
      if (silentImportInFlight.current[key]) return;
      silentImportInFlight.current[key] = true;
      try {
        let resp = null;
        if (key === 'steam') resp = await window.api.scanSteam();
        else if (key === 'epic') resp = await window.api.scanEpic();
        else return;
        if (cancelled || !resp || !resp.items) return;

        // Read current library through setState callback to avoid stale closure
        let newGames = [];
        const launcherCats = {
          steam: { id: '__launcher_steam__', name: 'Steam', colorId: 'cyan', pinnedBottom: true, logoLabel: 'Steam' },
          epic:  { id: '__launcher_epic__',  name: 'Epic Games', colorId: 'slate', pinnedBottom: true, logoLabel: 'Epic' },
        };
        const launcherCat = launcherCats[key];

        setLibrary((prev) => {
          const existing = new Set();
          (prev.games || []).forEach((g) => {
            if (g.appid) existing.add(`appid:${g.appid}`);
            if (g.exePath) existing.add(`exe:${g.exePath.toLowerCase()}`);
          });
          const toAdd = (resp.items || []).filter((it) => {
            if (it.appid && existing.has(`appid:${it.appid}`)) return false;
            const exe = (it.exe || it.installdir || '').toLowerCase();
            if (exe && existing.has(`exe:${exe}`)) return false;
            return true;
          });
          if (toAdd.length === 0) return prev;
          newGames = toAdd.map((it) => ({
            id: uid(),
            name: it.name,
            exePath: it.exe || it.installdir,
            appid: it.appid,
            launcher: key,
            source: key,
            launchUrl: it.launchUrl,
            categoryIds: launcherCat ? [launcherCat.id] : [],
            addedAt: Date.now(),
          }));
          let cats = prev.categories || [];
          if (launcherCat && !cats.find((c) => c.id === launcherCat.id)) {
            cats = [...cats, launcherCat];
          }
          return { ...prev, categories: cats, games: [...newGames, ...prev.games] };
        });

        if (cancelled || newGames.length === 0) return;
        const label = LAUNCHER_LABELS[key] || key;
        notify(`NEO-LIB detected ${newGames.length} new install${newGames.length !== 1 ? 's' : ''} on ${label} — now imported into NEO-LIB.`);

        // Auto-refetch metadata for each new game (sequential, in the background)
        for (const g of newGames) {
          if (cancelled) return;
          try { await refetchGameRef.current?.(g, { silent: true, autoApply: true }); } catch { /* ignore */ }
        }
      } catch { /* offline / scan failed — ignore */ }
      finally {
        silentImportInFlight.current[key] = false;
      }
    };

    const tick = async () => {
      try {
        const status = await window.api.detectLaunchers();
        if (cancelled) return;
        for (const [key, isRunning] of Object.entries(status)) {
          if (!isRunning) continue;
          // Already approved → silent auto-import path (no modal, ever)
          if (autoImport[key] === true) {
            silentImport(key);
            continue;
          }
          if (dismissed[key]) continue;
          const later = askLater[key];
          if (later && Date.now() - later < 24 * 60 * 60 * 1000) continue;
          setDetectedLauncher(key);
          return;
        }
      } catch { /* offline or non-Windows — ignore */ }
    };
    tick();
    const t = setInterval(tick, 5 * 60 * 1000); // every 5 minutes
    return () => { cancelled = true; clearInterval(t); };
  }, [settings.launcherDetectEnabled, settings.launcherDetectDismissed, settings.launcherAskLater, settings.launcherAutoImport]);

  const importDetectedLauncher = async () => {
    const key = detectedLauncher;
    setDetectedLauncher(null);
    if (!key) return;
    // Remember the user's "Yes" — from now on this launcher imports silently in the background
    updateSetting({
      launcherAutoImport: { ...(settings.launcherAutoImport || {}), [key]: true },
    });
    try {
      let resp = null;
      if (key === 'steam')  resp = await window.api.scanSteam();
      else if (key === 'epic') resp = await window.api.scanEpic();
      else { notify(`${key} import isn't wired yet — coming soon.`); return; }
      if (!resp || resp.ok === false) {
        notify(`Import failed: ${resp?.error || 'No games found.'}`);
        return;
      }
      const items = resp.items || [];
      if (items.length === 0) { notify(`No installed ${key} games found.`); return; }
      const added = [];
      for (const it of items) {
        const g = addToGames({
          name: it.name,
          exePath: it.exe || it.installdir,
          appid: it.appid,
          launcher: key,         // critical: marks the game for the launcher filter
          source: key,
          launchUrl: it.launchUrl,
        });
        if (g) added.push(g);
      }
      notify(`Imported ${added.length} games from ${key} — fetching metadata…`);
      // Auto-refetch metadata for all imported games in the background
      for (const g of added) {
        try { await refetchGame(g, { silent: true, autoApply: true }); } catch { /* ignore */ }
      }
    } catch (e) {
      notify('Import failed: ' + (e?.message || e));
    }
  };

  /* --- Confirm dialog state --- */
  const [confirmCfg, setConfirmCfg] = React.useState({ open: false });
  const askConfirm = ({ title, message, confirmLabel = 'Yes', cancelLabel = 'No', destructive = false }) =>
    new Promise((resolve) => {
      setConfirmCfg({
        open: true, title, message, confirmLabel, cancelLabel, destructive,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

  /* --- Load on mount --- */
  React.useEffect(() => {
    (async () => {
      if (isElectron) {
        const lib = await window.api.loadLibrary();
        const s = await window.api.loadSettings();
        setLibrary({
          games: (lib.games || []).map((g) => ({ categoryIds: [], addedAt: Date.now(), ...g })),
          categories: lib.categories || [],
          gameOrderByCategory: lib.gameOrderByCategory || {},
          tools: (lib.tools || []).map((t) => ({ categoryIds: [], addedAt: Date.now(), ...t })),
          toolCategories: lib.toolCategories || [],
          toolOrderByCategory: lib.toolOrderByCategory || {},
        });
        // Reset collapsed state each session by default — user wanted "always expanded unless I close them"
        const cleanSettings = { ...s };
        if (!s.categoriesCollapsedDefault) cleanSettings.collapsed = {};
        setSettings((prev) => ({ ...prev, ...cleanSettings }));
        // Privacy: never auto-select a game inside a private category on startup.
        // If the first non-private game doesn't exist, leave selection empty.
        const privateCatIds = new Set(
          (lib.categories || []).filter((c) => c.private).map((c) => c.id)
        );
        const firstVisible = (lib.games || []).find((g) => {
          const cats = g.categoryIds || [];
          return !cats.some((cid) => privateCatIds.has(cid));
        });
        if (firstVisible) setSelectedId(firstVisible.id);

        // Wire playtime tracking event
        window.api.onGameExited(({ gameId, seconds }) => {
          if (!gameId) return;
          // We need access to library here — use a setter to avoid stale closure
          setLibrary((curr) => ({
            ...curr,
            games: curr.games.map((g) =>
              g.id === gameId
                ? {
                    ...g,
                    playtime: (g.playtime || 0) + seconds,
                    lastPlayedAt: Date.now(),
                  }
                : g
            ),
          }));
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
        setSelectedId(DEMO_GAMES[0].id);
        setSelectedToolId(DEMO_TOOLS[0].id);
      }
    })();
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'synthwave');
  }, [settings.theme]);

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
    if (window.api?.openExternal) window.api.openExternal(url);
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
        if (lower.endsWith('.lnk') && window.api?.resolveLnk) {
          const r = await window.api.resolveLnk(p);
          if (r?.ok && r.target) {
            addToGames({ name: guessNameFromPath(r.target), exePath: r.target, launchArgs: r.args || '' });
            added += 1;
            continue;
          }
        }
        // .exe / .bat / .cmd → add directly
        if (/\.(exe|bat|cmd)$/i.test(p)) {
          const ico = await window.api?.extractIcon?.(p);
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

  // Persist whenever library changes (after initial load)
  const skipPersist = React.useRef(true);
  React.useEffect(() => {
    if (skipPersist.current) { skipPersist.current = false; return; }
    if (isElectron) window.api.saveLibrary(library);
  }, [library]);

  const persistSettings = (next) => {
    setSettings(next);
    if (isElectron) window.api.saveSettings(next);
  };
  // Functional update — safe against rapid back-to-back calls (e.g. two onClicks in the same handler)
  const updateSetting = (patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (isElectron) window.api.saveSettings(next);
      return next;
    });
  };

  const notify = (msg) => {
    setToast(msg);
    clearTimeout(notify._t);
    notify._t = setTimeout(() => setToast(null), 2500);
  };

  /* --- Mode-aware slice keys (library vs tools) --- */
  const isTools = settings.mode === 'tools';
  const sliceK = isTools
    ? { items: 'tools', cats: 'toolCategories', order: 'toolOrderByCategory' }
    : { items: 'games', cats: 'categories', order: 'gameOrderByCategory' };
  const currentItems = library[sliceK.items] || [];
  const currentCats = library[sliceK.cats] || [];
  const currentOrder = library[sliceK.order] || {};
  const currentSelectedId = isTools ? selectedToolId : selectedId;
  const setCurrentSelectedId = isTools ? setSelectedToolId : setSelectedId;

  const setMode = (m) => updateSetting({ mode: m });

  /* --- Helpers --- */
  const ensureOrder = (catId, gameIds) => {
    const order = currentOrder[catId] || [];
    const set = new Set(order);
    return [...order, ...gameIds.filter((id) => !set.has(id))];
  };

  /* --- Items (Games / Tools) --- */
  const addGame = (data) => {
    const g = { id: uid(), categoryIds: [], addedAt: Date.now(), ...data };
    setLibrary((prev) => ({ ...prev, [sliceK.items]: [g, ...(prev[sliceK.items] || [])] }));
    setCurrentSelectedId(g.id);
    setShowAdd(false);
    notify(`Added ${g.name}`);
  };
  // Always adds to library.games regardless of current tab — used by wizard + launcher imports.
  // Auto-creates a launcher category if the game came from a launcher import.
  const addToGames = (data) => {
    const launcherCats = {
      steam: { id: '__launcher_steam__', name: 'Steam', colorId: 'cyan',   pinnedBottom: true, logoLabel: 'Steam' },
      epic:  { id: '__launcher_epic__',  name: 'Epic Games', colorId: 'slate', pinnedBottom: true, logoLabel: 'Epic' },
    };
    const launcherCat = data.launcher ? launcherCats[data.launcher] : null;
    // FALLBACK: when the local .exe icon couldn't be extracted (common for sub-folder
    // launchers like Cyberpunk's REDLauncher), use the fetched online artwork instead.
    const onlineFallback = data.capsuleImage || data.headerImage || data.coverUrl || data.background || null;
    const icon = data.icon || onlineFallback;
    const g = { id: uid(), categoryIds: [], addedAt: Date.now(), ...data, icon };
    if (launcherCat) {
      g.categoryIds = Array.from(new Set([...(g.categoryIds || []), launcherCat.id]));
    }
    setLibrary((prev) => {
      let cats = prev.categories || [];
      if (launcherCat && !cats.find((c) => c.id === launcherCat.id)) {
        cats = [...cats, launcherCat];
      }
      return { ...prev, categories: cats, games: [g, ...prev.games] };
    });
    notify(`Added ${g.name}`);
    fireConfetti('Added · ' + g.name);
    return g;
  };
  const importMany = (entries) => {
    if (!entries.length) return;
    const newOnes = entries.map((e) => ({ id: uid(), categoryIds: [], addedAt: Date.now(), ...e }));
    setLibrary((prev) => ({ ...prev, games: [...newOnes, ...prev.games] })); // wizard always imports games
    setSelectedId(newOnes[0].id);
    notify(`Imported ${newOnes.length} game${newOnes.length !== 1 ? 's' : ''}`);
    fireConfetti(`+${newOnes.length} games`);
  };
  const updateGame = (id, patch) => {
    setLibrary((prev) => ({
      ...prev,
      [sliceK.items]: (prev[sliceK.items] || []).map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
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

  const launchGame = async (g) => {
    if (!isElectron) {
      notify(`Would launch: ${g.exePath}`);
      return;
    }
    const res = await window.api.launchGame({
      exePath: g.exePath, launchArgs: g.launchArgs || '', gameId: g.id,
    });
    if (!res.ok) notify('Launch failed: ' + (res.error || ''));
    else notify(`Launching ${g.name}…`);
  };

  /* --- Metadata --- */
  // Ref to expose refetchGame to background callers (e.g. silentImport in the
  // launcher polling effect) without retriggering the effect on every render.
  const refetchGameRef = React.useRef(null);
  const refetchGame = async (g, opts = {}) => {
    if (!isElectron) { notify('Re-fetch only works in the installed app.'); return null; }
    setFetching(true);
    const query = opts.query || g.name || guessNameFromPath(g.exePath);
    const skip = [];
    if (opts.skipCurrentSource && g.source) skip.push(g.source);
    // SAFETY: if game already has a Steam appid, lock to that appid so refetch can NEVER
    // accidentally replace this game's data with another game's. User must explicitly
    // request a "Re-search" (different query) to escape the lock.
    const lockedAppid = (!opts.forceSearch && g.appid) ? g.appid : null;
    const result = await window.api.fetchMetadata({
      query,
      skipSources: skip,
      geminiKey: settings.geminiKey || '',
      lockedAppid,
    });
    // Accept-before-add: when called interactively (not silent), open the Accept
    // modal so the user can compare current vs proposed metadata before it's
    // applied. The modal will call onAccept(patch) to commit, or onTryAgain()
    // to re-search with a different name.
    if (!opts.silent && !opts.autoApply) {
      setFetching(false);
      setAcceptPreview({ open: true, game: g, proposed: result, busy: false });
      return result;
    }
    if (!result) {
      setFetching(false);
      if (!opts.silent) {
        notify(`No match for "${query}" — opening Troubleshoot…`);
        setTroubleshoot({ open: true, game: g });
      }
      return null;
    }
    let coverUrl = result.capsuleImage || result.headerImage || null;
    if (coverUrl && coverUrl.startsWith('http')) {
      coverUrl = (await window.api.cacheImage(coverUrl, result.name)) || coverUrl;
    }
    updateGame(g.id, {
      name: result.name || g.name,
      appid: result.appid || g.appid,
      source: result.source,
      coverUrl: coverUrl || g.coverUrl,
      icon: g.icon || coverUrl || result.capsuleImage || result.headerImage || null,
      headerImage: result.headerImage || g.headerImage,
      background: result.background || g.background,
      shortDescription: result.shortDescription || g.shortDescription,
      about: result.about || g.about,
      genres: result.genres?.length ? result.genres : g.genres || [],
      developers: result.developers?.length ? result.developers : g.developers || [],
      publishers: result.publishers?.length ? result.publishers : g.publishers || [],
      releaseDate: result.releaseDate || g.releaseDate || '',
      metacritic: result.metacritic ?? g.metacritic,
      screenshots: result.screenshots?.length ? result.screenshots : g.screenshots || [],
      website: result.website || g.website || '',
    });
    setFetching(false);
    notify(`Updated · ${result.name || g.name} (via ${result.source})`);
    return result;
  };

  // Apply a previewed metadata patch (called from AcceptMetadataModal).
  const applyAcceptedMetadata = async (g, patch) => {
    let coverUrl = patch.capsuleImage || patch.headerImage || patch.coverUrl || null;
    if (coverUrl && coverUrl.startsWith('http')) {
      coverUrl = (await window.api.cacheImage(coverUrl, patch.name)) || coverUrl;
    }
    updateGame(g.id, {
      ...patch,
      coverUrl: coverUrl || g.coverUrl,
      icon: g.icon || coverUrl || patch.headerImage || null,
    });
    notify(`Updated · ${patch.name || g.name} (via ${patch.source || 'manual'})`);
  };

  const refetchAll = async () => {
    if (currentItems.length === 0) return;
    // Skip games the user manually edited — we don't want bulk refetch clobbering
    // hand-tuned itch.io / indie metadata. They can still refetch individually.
    const targets = currentItems.filter((g) => !g.manualOverride);
    const skipped = currentItems.length - targets.length;
    if (targets.length === 0) {
      notify(`All ${currentItems.length} games are manually overridden — nothing to refresh.`);
      return;
    }
    setUpdatingAll(true);
    for (const g of targets) await refetchGame(g, { autoApply: true });
    setUpdatingAll(false);
    notify(
      skipped > 0
        ? `Refreshed ${targets.length} · skipped ${skipped} manual override${skipped !== 1 ? 's' : ''}`
        : 'All refreshed.'
    );
  };
  // Keep ref in sync so background callers always invoke the latest refetchGame
  React.useEffect(() => { refetchGameRef.current = refetchGame; });

  /* --- Categories --- */
  const createCategory = (data) => {
    const c = { id: uid(), private: false, ...data };
    setLibrary((prev) => ({ ...prev, [sliceK.cats]: [...(prev[sliceK.cats] || []), c] }));
    setCatModal({ open: false, initial: null });
    notify(`Category "${c.name}" created`);
  };
  const updateCategory = (id, patch) => {
    setLibrary((prev) => ({
      ...prev,
      [sliceK.cats]: (prev[sliceK.cats] || []).map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };
  const deleteCategory = (id) => {
    setLibrary((prev) => ({
      ...prev,
      [sliceK.cats]: (prev[sliceK.cats] || []).filter((c) => c.id !== id),
      [sliceK.items]: (prev[sliceK.items] || []).map((g) => ({
        ...g, categoryIds: (g.categoryIds || []).filter((x) => x !== id),
      })),
      [sliceK.order]: Object.fromEntries(
        Object.entries(prev[sliceK.order] || {}).filter(([k]) => k !== id)
      ),
    }));
    notify('Category deleted');
  };

  const reorderCategory = (fromId, beforeId) => {
    setLibrary((prev) => {
      const list = [...(prev[sliceK.cats] || [])];
      const from = list.findIndex((c) => c.id === fromId);
      if (from < 0) return prev;
      const [item] = list.splice(from, 1);
      const insertAt = list.findIndex((c) => c.id === beforeId);
      list.splice(insertAt < 0 ? list.length : insertAt, 0, item);
      return { ...prev, [sliceK.cats]: list };
    });
  };

  /* --- Drag & drop --- */
  const moveGameToCategory = (gameId, fromCatId, toCatId, opts = {}) => {
    const { copy = false, beforeGameId } = opts;
    setLibrary((prev) => {
      const items = (prev[sliceK.items] || []).map((g) => {
        if (g.id !== gameId) return g;
        const ids = new Set(g.categoryIds || []);
        if (!copy && fromCatId) ids.delete(fromCatId);
        if (toCatId) ids.add(toCatId);
        return { ...g, categoryIds: Array.from(ids) };
      });
      const order = { ...(prev[sliceK.order] || {}) };
      const targetKey = toCatId || '__uncat__';
      const list = (order[targetKey] || []).filter((x) => x !== gameId);
      if (beforeGameId) {
        const i = list.indexOf(beforeGameId);
        list.splice(i < 0 ? list.length : i, 0, gameId);
      } else list.push(gameId);
      order[targetKey] = list;
      if (!copy && fromCatId) order[fromCatId] = (order[fromCatId] || []).filter((x) => x !== gameId);
      return { ...prev, [sliceK.items]: items, [sliceK.order]: order };
    });
  };

  const reorderGameInCategory = (catId, fromId, beforeId) => {
    setLibrary((prev) => {
      const order = { ...(prev[sliceK.order] || {}) };
      const ids = (order[catId] || []).slice();
      const i = ids.indexOf(fromId);
      if (i < 0) ids.push(fromId);
      else ids.splice(i, 1);
      const j = ids.indexOf(beforeId);
      ids.splice(j < 0 ? ids.length : j, 0, fromId);
      order[catId] = ids;
      return { ...prev, [sliceK.order]: order };
    });
  };

  const toggleGameInCategory = (game, categoryId) => {
    const has = (game.categoryIds || []).includes(categoryId);
    updateGame(game.id, {
      categoryIds: has
        ? (game.categoryIds || []).filter((c) => c !== categoryId)
        : [...(game.categoryIds || []), categoryId],
    });
  };

  /* --- Ghost categories --- */
  const requestUnlock = (category) => {
    setPinThen(() => (pin) => {
      if (hashPin(pin) === category.pinHash) {
        setUnlockedCategories((u) => [...new Set([...u, category.id])]);
        setPinModal({ open: false, mode: 'unlock', category: null, error: '' });
      } else {
        setPinModal((p) => ({ ...p, error: 'Wrong PIN.' }));
      }
    });
    setPinModal({ open: true, mode: 'unlock', category, error: '' });
  };

  const handleCategoryAction = async (action) => {
    const c = catCtx.category;
    setCatCtx({ open: false, category: null, anchor: null });
    if (!c) return;
    if (action === 'edit' || action === 'recolor') {
      setCatModal({ open: true, initial: c });
    } else if (action === 'delete') {
      if (c.private && !unlockedCategories.includes(c.id)) {
        setPinThen(() => (pin) => {
          if (hashPin(pin) === c.pinHash) {
            deleteCategory(c.id);
            setPinModal({ open: false, mode: 'remove', category: null, error: '' });
          } else setPinModal((p) => ({ ...p, error: 'Wrong PIN.' }));
        });
        setPinModal({ open: true, mode: 'remove', category: c, error: '' });
      } else {
        const typed = await askPrompt({
          title: `Delete "${c.name}"?`,
          label: `Type the category name to confirm (games stay in your library):`,
          defaultValue: '',
          placeholder: c.name,
          confirmLabel: 'Delete',
        });
        if (typed && typed.trim() === c.name) deleteCategory(c.id);
        else if (typed !== null) notify('Name did not match — deletion cancelled.');
      }
    } else if (action === 'up' || action === 'down') {
      setLibrary((prev) => {
        const list = [...(prev[sliceK.cats] || [])];
        const i = list.findIndex((x) => x.id === c.id);
        const j = i + (action === 'up' ? -1 : 1);
        if (i < 0 || j < 0 || j >= list.length) return prev;
        [list[i], list[j]] = [list[j], list[i]];
        return { ...prev, [sliceK.cats]: list };
      });
    } else if (action === 'set-private') {
      setPinThen(() => (pin) => {
        updateCategory(c.id, { private: true, pinHash: hashPin(pin) });
        setPinModal({ open: false, mode: 'set', category: null, error: '' });
        notify(`"${c.name}" is now a Ghost category`);
      });
      setPinModal({ open: true, mode: 'set', category: c, error: '' });
    } else if (action === 'remove-private') {
      setPinThen(() => (pin) => {
        if (hashPin(pin) === c.pinHash) {
          updateCategory(c.id, { private: false, pinHash: null });
          setPinModal({ open: false, mode: 'remove', category: null, error: '' });
          notify('Privacy removed.');
        } else setPinModal((p) => ({ ...p, error: 'Wrong PIN.' }));
      });
      setPinModal({ open: true, mode: 'remove', category: c, error: '' });
    }
  };

  /* --- Auto-sort: create missing default categories, then tag games into them --- */
  const handleAutoSortApply = (defaultCats, assignments) => {
    setLibrary((prev) => {
      const existingCats = prev[sliceK.cats] || [];
      const newCats = [...existingCats];
      const nameToCat = {};
      // Pre-populate map with existing cats by name (case-insensitive)
      for (const c of existingCats) nameToCat[c.name.toLowerCase()] = c;
      // Create any missing default categories
      for (const d of defaultCats) {
        if (!nameToCat[d.name.toLowerCase()]) {
          const c = { id: uid(), name: d.name, colorId: d.colorId, private: false };
          newCats.push(c);
          nameToCat[d.name.toLowerCase()] = c;
        }
      }
      // Tag each game into the matched categories (no removal)
      const games = (prev[sliceK.items] || []).map((g) => {
        const ass = assignments.find((a) => a.id === g.id);
        if (!ass || ass.cats.length === 0) return g;
        const existing = new Set(g.categoryIds || []);
        for (const catName of ass.cats) {
          const c = nameToCat[catName.toLowerCase()];
          if (c) existing.add(c.id);
        }
        return { ...g, categoryIds: Array.from(existing) };
      });
      return {
        ...prev,
        [sliceK.cats]: newCats,
        [sliceK.items]: games,
      };
    });
    notify('Auto-sort applied');
    fireConfetti('Auto-sort complete');
  };

  const refetchMissingGenres = async (g) => {
    if (!isElectron) return;
    const result = await window.api.fetchMetadata({
      query: g.name,
      skipSources: [],
      geminiKey: settings.geminiKey || '',
      lockedAppid: g.appid || null,
    });
    if (result?.genres?.length) updateGame(g.id, { genres: result.genres });
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
      if (isElectron) window.api.revealInFolder(g.exePath);
      else notify('Open: ' + g.exePath);
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
    if (type === 'all-locked') {
      setTroubleshoot({ open: false, game: null });
      await refetchGame(g, { skipCurrentSource: true });
      return;
    }
    // Surgical field refetch — fetch full metadata locked to current appid, then apply only the requested field
    if (!isElectron) { notify('Re-fetch only works in the installed app.'); return; }
    setFetching(true);
    const result = await window.api.fetchMetadata({
      query: g.name,
      skipSources: [],
      geminiKey: settings.geminiKey || '',
      lockedAppid: g.appid || null,
    });
    if (!result) {
      setFetching(false);
      notify('No metadata found.');
      return;
    }
    const patch = {};
    if (type === 'icon') {
      let coverUrl = result.capsuleImage || result.headerImage || null;
      if (coverUrl && coverUrl.startsWith('http')) {
        coverUrl = (await window.api.cacheImage(coverUrl, result.name)) || coverUrl;
      }
      patch.icon = coverUrl || g.icon;
      patch.coverUrl = coverUrl || g.coverUrl;
    } else if (type === 'description') {
      patch.about = result.about || g.about;
      patch.shortDescription = result.shortDescription || g.shortDescription;
    } else if (type === 'screenshots') {
      patch.screenshots = result.screenshots?.length ? result.screenshots : g.screenshots;
    } else if (type === 'banner') {
      patch.headerImage = result.headerImage || g.headerImage;
      patch.background = result.background || g.background;
    }
    updateGame(g.id, patch);
    setFetching(false);
    notify(`Updated ${type}.`);
  };

  /* --- Collapsed state --- */
  const toggleCollapsed = (id) =>
    updateSetting({ collapsed: { ...settings.collapsed, [id]: !settings.collapsed[id] } });

  // Launcher filter (All/Steam/Epic/EA/GOG/Other) — only used on Library tab
  // Uses g.launcher exclusively. g.source (Steam API, GOG API) is metadata-origin
  // and intentionally NOT considered here — a manually-added game whose metadata
  // was fetched from Steam is NOT a Steam-launcher game.
  const launcherFilter = settings.launcherFilter || 'all';
  const visibleGames = React.useMemo(() => {
    if (isTools || launcherFilter === 'all') return currentItems;
    return currentItems.filter((g) => {
      const launcher = (g.launcher || '').toLowerCase();
      if (launcherFilter === 'other') {
        return !['steam', 'epic', 'ea', 'gog', 'ubisoft', 'battlenet', 'riot', 'rockstar'].includes(launcher);
      }
      return launcher === launcherFilter;
    });
  }, [currentItems, isTools, launcherFilter]);
  const selected = currentItems.find((g) => g.id === currentSelectedId) || null;

  return (
    <div className="relative flex h-screen w-screen flex-col bg-surface text-ink">
      {/* Window edge glow — soft inner halo around the frameless window (Riot/Discord style) */}
      <div className="window-edge-glow" aria-hidden="true" />
      <BgAmbience theme={settings.theme} settings={settings} game={selected} />
      <TitleBar
        search={search}
        setSearch={setSearch}
        updateAvailable={updateInfo?.available || false}
        latestVersion={updateInfo?.latestVersion || ''}
        onClickUpdate={openReleasesPage}
      />

      <div className="relative z-10 flex min-h-0 flex-1">
        <Sidebar
          games={visibleGames}
          categories={currentCats}
          gameOrderByCategory={currentOrder}
          collapsed={settings.collapsed || {}}
          unlockedCategories={unlockedCategories}
          search={search}
          selectedId={currentSelectedId}
          librarySize={settings.librarySize || 'medium'}
          rowSize={settings.rowSize ?? 44}
          catTextSize={settings.catTextSize ?? 11}
          catGlow={settings.catGlow ?? 40}
          rowGap={settings.rowGap ?? 2}
          catGap={settings.catGap ?? 8}
          iconPosition={settings.iconPosition || 'left'}
          showCategoryDot={settings.showCategoryDot !== false}
          pinnedIds={settings.pinnedGameIds || []}
          onChangeRowSize={(v) => updateSetting({ rowSize: v })}
          onChangeCatTextSize={(v) => updateSetting({ catTextSize: v })}
          onChangeCatGlow={(v) => updateSetting({ catGlow: v })}
          onChangeRowGap={(v) => updateSetting({ rowGap: v })}
          onChangeCatGap={(v) => updateSetting({ catGap: v })}
          onChangeIconPosition={(v) => updateSetting({ iconPosition: v })}
          onToggleCategoryDot={(v) => updateSetting({ showCategoryDot: v })}
          mode={settings.mode || 'library'}
          onSetMode={setMode}
          launcherFilter={launcherFilter}
          onSetLauncherFilter={(v) => updateSetting({ launcherFilter: v })}
          onAutoSort={() => setAutoSortOpen(true)}
          twoRow={!!settings.twoRow}
          onToggleTwoRow={(v) => updateSetting({ twoRow: v })}
          sidebarWidth={sidebarWidth}
          onStartResize={startResize}
          onSelect={setCurrentSelectedId}
          onAddManual={() => setShowAdd(true)}
          onOpenWizard={() => setShowWizard(true)}
          onOpenSettings={() => setShowSettings(true)}
          onUpdateAll={refetchAll}
          onCreateCategory={() => setCatModal({ open: true, initial: null })}
          onCategoryContext={(category, anchor) => setCatCtx({ open: true, category, anchor })}
          onGameContext={handleGameContext}
          onSetLibrarySize={(s) => updateSetting({ librarySize: s })}
          onMoveGameToCategory={moveGameToCategory}
          onReorderGameInCategory={reorderGameInCategory}
          onReorderCategory={reorderCategory}
          onToggleCollapsed={toggleCollapsed}
          onUnlockCategory={requestUnlock}
          updatingAll={updatingAll}
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex-1 min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <GameDetail
                key={selected?.id || 'empty'}
                game={selected}
                categories={currentCats.filter((c) => !c.private || unlockedCategories.includes(c.id))}
                fetching={fetching}
                settings={settings}
                onLaunch={launchGame}
                onRefetch={(g) => setTroubleshoot({ open: true, game: g })}
                onRevealFolder={(g) => (isElectron ? window.api.revealInFolder(g.exePath) : notify('Open: ' + g.exePath))}
                onToggleCategory={toggleGameInCategory}
              />
            </AnimatePresence>
          </div>

          {/* Showcase strip below preview — only on Library tab */}
          {!isTools && (
            <ShowcaseStrip
              games={visibleGames}
              mode={settings.showcaseMode || 'recent_added'}
              setMode={(m) => updateSetting({ showcaseMode: m })}
              onSelect={setCurrentSelectedId}
              selectedId={currentSelectedId}
              settings={settings}
            />
          )}
        </main>
      </div>

      {/* Bottom deals bar — across the full window */}
      {settings.dealsEnabled !== false && settings.dealsBarHidden !== true ? (
        <DealsBar
          settings={settings}
          onClose={() => updateSetting({ dealsBarHidden: true })}
          onDonate={() => setDonateOpen(true)}
        />
      ) : (
        <div
          className="relative z-20 flex h-7 shrink-0 items-center justify-between border-t hairline px-4 text-[10.5px] text-muted/80"
          style={{ backgroundColor: 'rgb(var(--surface) / 0.9)' }}
          data-testid="credits-bar"
        >
          <span>NEO-LIB · made by <span className="text-ink font-semibold">KenLun</span></span>
          <button
            data-testid="credits-bar-donate"
            onClick={() => setDonateOpen(true)}
            className="donate-pulse group flex items-center gap-1.5 rounded-full px-3 h-7 text-[11px] font-bold transition-all hover:scale-105 hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #FFD140 0%, #FFB400 100%)',
              color: '#000',
              boxShadow: '0 0 14px -2px rgba(255, 209, 64, 0.55)',
            }}
            title="Buy KenLun a coffee — directly funds NEO-LIB updates"
          >
            <span className="transition-transform group-hover:rotate-12">☕</span>
            Buy me a coffee
          </button>
        </div>
      )}

      {/* Modals */}
      <AddGameModal open={showAdd} onClose={() => setShowAdd(false)} onCreate={addGame} />
      <WizardModal
        open={showWizard}
        onClose={() => { setShowWizard(false); setWizardPrefillRoot(''); setWizardAutoScan(false); }}
        onAccept={addToGames}
        onAddManual={() => setShowAdd(true)}
        existingExePaths={(library.games || []).map((g) => g.exePath).filter(Boolean)}
        prefilledRoot={wizardPrefillRoot}
        autoScan={wizardAutoScan}
        geminiKey={settings.geminiKey || ''}
      />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} settings={settings} setSettings={persistSettings} />
      <CategoryModal
        open={catModal.open}
        initial={catModal.initial}
        onClose={() => setCatModal({ open: false, initial: null })}
        onSubmit={(data) => {
          if (catModal.initial) {
            updateCategory(catModal.initial.id, data);
            setCatModal({ open: false, initial: null });
          } else createCategory(data);
        }}
      />
      <PinModal
        open={pinModal.open}
        mode={pinModal.mode}
        category={pinModal.category}
        categoryName={pinModal.category?.name}
        error={pinModal.error}
        onClose={() => setPinModal({ open: false, mode: 'unlock', category: null, error: '' })}
        onSubmit={(pin) => pinThen && pinThen(pin)}
      />

      <CategoryContextMenu
        open={catCtx.open}
        anchor={catCtx.anchor}
        category={catCtx.category}
        onClose={() => setCatCtx({ open: false, category: null, anchor: null })}
        onAction={handleCategoryAction}
      />

      <PromptModal
        open={!!promptCfg.open}
        title={promptCfg.title}
        label={promptCfg.label}
        defaultValue={promptCfg.defaultValue}
        placeholder={promptCfg.placeholder}
        multiline={promptCfg.multiline}
        confirmLabel={promptCfg.confirmLabel}
        onSubmit={(v) => { promptCfg.onSubmit && promptCfg.onSubmit(v); setPromptCfg({ open: false }); }}
        onClose={() => closePrompt(true)}
      />

      <ConfirmModal
        open={!!confirmCfg.open}
        title={confirmCfg.title}
        message={confirmCfg.message}
        confirmLabel={confirmCfg.confirmLabel}
        cancelLabel={confirmCfg.cancelLabel}
        destructive={confirmCfg.destructive}
        onConfirm={() => { confirmCfg.onConfirm && confirmCfg.onConfirm(); }}
        onClose={() => {
          setConfirmCfg((p) => {
            if (p.onCancel) p.onCancel();
            return { open: false };
          });
        }}
      />

      <EditMetadataModal
        open={!!editMetaGame}
        game={editMetaGame}
        onClose={() => setEditMetaGame(null)}
        onSave={(patch) => {
          if (!editMetaGame) return;
          updateGame(editMetaGame.id, patch);
          notify(`Saved · ${patch.name || editMetaGame.name}`);
        }}
      />

      <AcceptMetadataModal
        open={acceptPreview.open}
        game={acceptPreview.game}
        proposed={acceptPreview.proposed}
        busy={acceptPreview.busy}
        onClose={() => setAcceptPreview({ open: false, game: null, proposed: null, busy: false })}
        onAccept={(patch) => {
          const g = acceptPreview.game;
          setAcceptPreview({ open: false, game: null, proposed: null, busy: false });
          if (g) applyAcceptedMetadata(g, patch);
        }}
        onTryAgain={async (newName) => {
          const g = acceptPreview.game;
          if (!g) return;
          setAcceptPreview((p) => ({ ...p, busy: true }));
          const result = await window.api.fetchMetadata({
            query: newName,
            skipSources: [],
            geminiKey: settings.geminiKey || '',
            // Force-search bypasses the appid lock — we want to allow finding a totally different game
            lockedAppid: null,
          });
          setAcceptPreview({ open: true, game: g, proposed: result, busy: false });
        }}
      />

      {/* Theme-aware confetti — bumps key when fired, auto-cleans */}
      <Confetti triggerKey={confetti.key} label={confetti.label} origin={confetti.origin} />

      {/* Drag-drop overlay — neon "Drop to add" banner appears when files are over the window */}
      <AnimatePresence>
        {dragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none fixed inset-0 z-[400] grid place-items-center"
            data-testid="drop-overlay"
          >
            <div
              className="absolute inset-2 rounded-2xl"
              style={{
                background: 'rgb(var(--surface) / 0.55)',
                backdropFilter: 'blur(8px)',
                border: '2px dashed rgb(var(--accent) / 0.85)',
                boxShadow: 'inset 0 0 120px -20px rgb(var(--accent) / 0.55), 0 0 60px rgb(var(--accent) / 0.4)',
              }}
            />
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: [0.95, 1.02, 0.98, 1.0] }}
              transition={{ duration: 0.7, repeat: Infinity }}
              className="relative flex flex-col items-center gap-3"
            >
              <div className="text-5xl">✨</div>
              <div
                className="font-display text-2xl font-extrabold uppercase tracking-[0.32em]"
                style={{
                  color: 'rgb(var(--ink))',
                  textShadow: '0 0 12px rgb(var(--accent)), 0 0 24px rgb(var(--accent) / 0.6)',
                }}
              >
                Drop to add
              </div>
              <div className="text-xs text-muted">
                .exe · .lnk · or a folder (opens the Wizard)
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TroubleshootModal
        open={troubleshoot.open}
        game={troubleshoot.game}
        busy={fetching}
        onClose={() => setTroubleshoot({ open: false, game: null })}
        onAction={handleTroubleshoot}
      />

      <TutorialModal
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        onDontShowAgain={() => {
          updateSetting({ tutorialSeen: true, tutorialAlwaysShow: false });
          if (!isElectron && typeof localStorage !== 'undefined') {
            localStorage.setItem('neo-lib-tutorial-seen', '1');
          }
        }}
      />

      <AutoSortModal
        open={autoSortOpen}
        games={visibleGames}
        categories={currentCats}
        onClose={() => setAutoSortOpen(false)}
        onApply={handleAutoSortApply}
        onRefetchMissing={refetchMissingGenres}
      />

      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />

      <LauncherDetectModal
        open={!!detectedLauncher}
        launcher={detectedLauncher}
        onImport={importDetectedLauncher}
        onSkip={(forever) => {
          if (forever) {
            updateSetting({
              launcherDetectDismissed: { ...(settings.launcherDetectDismissed || {}), [detectedLauncher]: true },
            });
          }
          setDetectedLauncher(null);
        }}
        onLater={() => {
          updateSetting({
            launcherAskLater: { ...(settings.launcherAskLater || {}), [detectedLauncher]: Date.now() },
          });
          setDetectedLauncher(null);
        }}
        onClose={() => setDetectedLauncher(null)}
      />

      {!bootDone && settings.crtBootEnabled !== false && <div className="crt-boot" />}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
            data-testid="toast"
            className="pointer-events-none fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full hairline glass px-4 py-2 text-xs"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BgAmbience({ theme, settings = {}, game = null }) {
  if (settings.synthGridEnabled === false) return null;
  const intensity = (settings.gridIntensity ?? 100) / 100;
  // Per-game custom backdrop — when settings.perGameBg is on, the currently selected
  // game's hero is rendered as a giant blurred wash behind the ambient. Subtle,
  // additive, never overwhelms the theme.
  const gameBg = settings.perGameBg && game ? (game.background || game.headerImage || game.coverUrl) : null;
  const gameBgLayer = gameBg ? (
    <motion.div
      key={gameBg}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.22 }}
      transition={{ duration: 0.9 }}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: `url(${gameBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(40px) saturate(1.15)',
        mixBlendMode: 'overlay',
      }}
    />
  ) : null;

  // Vaporwave Day — clouds + neon grid floor
  if (theme === 'synthwave-day') {
    return (
      <>
        {gameBgLayer}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ opacity: intensity }}>
          <div className="vapor-clouds" />
          <div className="vapor-floor" />
        </div>
      </>
    );
  }
  // Synthwave — grid + horizon + accent glow
  if (theme === 'synthwave') {
    return (
      <>
        {gameBgLayer}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ opacity: intensity }}>
          <div className="synth-grid" />
          <div className="synth-horizon" />
          <div
            className="absolute -top-40 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgb(var(--accent)/0.45), transparent 60%)' }}
          />
          {settings.particlesEnabled !== false && <Particles count={10} />}
        </div>
      </>
    );
  }
  // All other themes get their own subtle ambient backdrop
  const ambClass = {
    midnight: 'amb-midnight',
    daybreak: 'amb-daybreak',
    ocean:    'amb-ocean',
    crimson:  'amb-crimson',
    anime:    'amb-anime',
    mint:     'amb-mint',
  }[theme];
  if (!ambClass) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ opacity: intensity }}>
      <div className={ambClass} />
      {theme === 'anime' && <Sakura count={18} />}
      {settings.particlesEnabled !== false && <Particles count={theme === 'crimson' ? 14 : 8} />}
    </div>
  );
}

function Sakura({ count = 18 }) {
  const items = React.useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      left: `${(i * 173) % 100}%`,
      delay: `${(i * 1.7) % 14}s`,
      duration: `${10 + (i % 6) * 3}s`,
      scale: 0.6 + ((i % 5) * 0.18),
    })),
  [count]);
  return (
    <div className="sakura">
      {items.map((p, i) => (
        <span
          key={i}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `scale(${p.scale})`,
          }}
        />
      ))}
    </div>
  );
}

function Particles({ count = 10 }) {
  // Pre-compute deterministic positions so they don't jump on re-render
  const items = React.useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      left: `${(i * 173) % 100}%`,
      delay: `${(i * 1.37) % 12}s`,
      duration: `${10 + (i % 5) * 2}s`,
      scale: 0.6 + ((i % 5) * 0.15),
    }));
  }, [count]);
  return (
    <div className="particles">
      {items.map((p, i) => (
        <span
          key={i}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `scale(${p.scale})`,
          }}
        />
      ))}
    </div>
  );
}
