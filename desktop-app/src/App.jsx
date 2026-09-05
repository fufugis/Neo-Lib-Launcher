import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar, { CategoryContextMenu } from './components/Sidebar';
import GameDetail from './components/GameDetail';
import DealsBar from './components/DealsBar';
import DonateModal from './components/DonateModal';
import LauncherDetectModal from './components/LauncherDetectModal';
import SettingsModal from './components/SettingsModal';
import SettingsRecoveryBoundary from './components/SettingsRecoveryBoundary';
import AddGameModal from './components/AddGameModal';
import ToolMetadataModal from './components/ToolMetadataModal';
import ToolDetail from './components/ToolDetail';
import WizardModal from './components/WizardModal';
import AutoSortModal from './components/AutoSortModal';
import PromptModal from './components/PromptModal';
import ConfirmModal from './components/ConfirmModal';
import TroubleshootModal from './components/TroubleshootModal';
import RefreshCandidatesModal from './components/RefreshCandidatesModal';
import TutorialModal from './components/TutorialModal';
import HoverTips from './components/HoverTips';
import PostPlayRatingModal from './components/PostPlayRatingModal';
import CategoryModal from './components/CategoryModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import Confetti from './components/Confetti';
import StartupIntro from './components/StartupIntro';
import FungistMascot from './components/FungistMascot';
import FeedbackModal from './components/FeedbackModal';
import PlaytimeImportModal from './components/PlaytimeImportModal';
import EditMetadataModal from './components/EditMetadataModal';
import AcceptMetadataModal from './components/AcceptMetadataModal';
import FetchSourcePicker from './components/FetchSourcePicker';
import ChangelogModal from './components/ChangelogModal';
import HomeHub from './components/HomeHub';
import CoverWall from './components/CoverWall';
import TidyUpModal from './components/TidyUpModal';
import SaveGameModal from './components/SaveGameModal';
import LaunchDoctorModal from './components/LaunchDoctorModal';
import { checkForUpdates } from './lib/updateChecker';

// Read app version once — used by the update checker for comparison.
const APP_VERSION = '1.7.5';
import PinModal from './components/PinModal';
import { uid, guessNameFromPath, hashPin, formatPlaytime } from './lib/utils';
import { normalizeGenreProfile, GENRE_TAXONOMY_VERSION } from './lib/genreTaxonomy';
import { setSoundPack } from './lib/sound';
import { playFungistVoice } from './lib/mascotVoice';

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

const HARDWARE_TOOLS_CATEGORY = { id: '__hardware_tools__', name: 'Hardware & graphics', colorId: 'lime', private: false, pinnedBottom: true };

function sameToolName(a, b) {
  return String(a || '').replace(/[^a-z0-9]/gi, '').toLowerCase() === String(b || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

/** Adds first-run hardware conveniences without replacing a user's own tools. */
function withGpuSetupTools(current, setup) {
  const utilities = setup?.utilities || {};
  const existing = current.tools || [];
  const managedDefaults = [
    {
      id: 'managed-gpuz', name: 'GPU-Z', managedTool: 'gpuz', exePath: utilities.gpuz?.exePath || '',
      availability: utilities.gpuz?.exePath ? 'installed' : 'missing', categoryIds: [HARDWARE_TOOLS_CATEGORY.id],
      shortDescription: 'Official TechPowerUp utility for graphics-card information.',
      about: 'GPU-Z shows detailed graphics-card, sensor, driver, and PCIe information. NEO-LIB can locate an existing copy or download the official portable utility after you ask.',
      genres: ['System info'], website: 'https://www.techpowerup.com/gpuz/', source: 'managed-hardware', addedAt: Date.now(),
    },
    {
      id: 'managed-cpuz', name: 'CPU-Z', managedTool: 'cpuz', exePath: utilities.cpuz?.exePath || '',
      availability: utilities.cpuz?.exePath ? 'installed' : 'missing', categoryIds: [HARDWARE_TOOLS_CATEGORY.id],
      shortDescription: 'Official CPUID utility for processor, memory, and mainboard information.',
      about: 'CPU-Z reports processor, mainboard, memory, and live clock information. NEO-LIB can locate it or download CPUID’s official interactive installer after you ask.',
      genres: ['System info'], website: 'https://www.cpuid.com/softwares/cpu-z.html', source: 'managed-hardware', addedAt: Date.now(),
    },
  ];
  let tools = existing.map((tool) => {
    const managed = managedDefaults.find((item) => sameToolName(item.name, tool.name));
    if (!managed) return tool;
    // A manually added utility stays the user's tool; NEO-LIB merely enables
    // its Locate/Install treatment and never overwrites a working path.
    return { ...managed, ...tool, managedTool: managed.managedTool, availability: tool.exePath || managed.exePath ? 'installed' : 'missing' };
  });
  for (const tool of managedDefaults) if (!tools.some((item) => sameToolName(item.name, tool.name))) tools.push(tool);

  const control = setup?.controlCenter;
  if (control?.target) {
    const controlTool = {
      id: 'managed-gpu-control-center', name: control.name, exePath: control.target,
      launchTargetType: control.exePath ? 'exe' : 'uri', categoryIds: [HARDWARE_TOOLS_CATEGORY.id],
      shortDescription: /^vendor-/.test(control.source) ? 'Detected graphics-driver control centre.' : 'Windows graphics settings shortcut (vendor control centre was not found locally).',
      about: /^vendor-/.test(control.source)
        ? 'A local shortcut to the graphics control centre detected for your installed GPU.'
        : 'A safe Windows fallback shortcut. Install your GPU vendor’s control centre later and NEO-LIB can refresh this shortcut in a future hardware refresh.',
      genres: ['Graphics settings'], source: 'gpu-setup', addedAt: Date.now(),
    };
    // Upgrade a previous Windows fallback on the next startup when a vendor
    // control centre becomes discoverable (for example Store-based NVIDIA
    // Control Panel). The shortcut itself is managed, never a user tool.
    const existingControl = tools.find((tool) => tool.id === controlTool.id);
    tools = existingControl
      ? tools.map((tool) => tool.id === controlTool.id ? { ...controlTool, addedAt: tool.addedAt || controlTool.addedAt } : tool)
      : [...tools, controlTool];
  }
  const hasManaged = tools.some((tool) => tool.managedTool || tool.id === 'managed-gpu-control-center');
  const categories = hasManaged && !(current.toolCategories || []).some((category) => category.id === HARDWARE_TOOLS_CATEGORY.id)
    ? [...(current.toolCategories || []), HARDWARE_TOOLS_CATEGORY]
    : (current.toolCategories || []);
  return { ...current, tools, toolCategories: categories };
}

// Older launcher imports sometimes stored the first alphabetic EXE in a game
// folder (converter/editor/helper) instead of the playable target. Native
// launcher rescans now choose correctly; this renderer check lets that stronger
// evidence repair an existing entry without overwriting a deliberate custom
// executable that already looks playable.
function isImportedHelperTarget(value = '') {
  const filename = String(value).split(/[\\/]/).pop()?.toLowerCase() || '';
  return /(?:unins|setup|crash|redist|support|helper|assistant|convert|importer|editor|benchmark|diagnostic|updater|reporter)/i.test(filename);
}

// This compact snapshot is created only after the player manually sends a
// Fungist chat message. It deliberately excludes paths, saves, account data,
// and locked Private entries; it contains just enough local library detail for
// recommendations, comparisons, and exact game-name commands.
function fungistLibrarySnapshot(games = []) {
  const entries = (games || []).slice(0, 420).map((game) => {
    const profileTags = Array.isArray(game.genreProfile?.tags) ? game.genreProfile.tags.map((tag) => typeof tag === 'string' ? tag : (tag?.label || tag?.name || '')).filter(Boolean) : [];
    const tags = [...new Set([...(game.genres || []), ...(game.genreTags || []), ...profileTags])].slice(0, 10);
    const rating = Number(game.myRating ?? game.rating ?? 0);
    const hours = Number(game.playtimeMinutes || game.playtime || 0);
    return `${game.name || 'Untitled'}${game.source || game.launcher ? ` [${game.source || game.launcher}]` : ''}${tags.length ? ` — ${tags.join(', ')}` : ''}${rating ? ` — my rating ${rating.toFixed(1)}/5` : ''}${hours ? ` — ${Math.round(hours / 60)}h played` : ''}`;
  });
  const suffix = games.length > entries.length ? `\n…plus ${games.length - entries.length} more visible games.` : '';
  return `Visible NEO-LIB games (${games.length}):\n${entries.join('\n')}${suffix}`.slice(0, 24_000);
}

export default function App() {
  const [library, setLibrary] = React.useState({
    games: [], categories: [], gameOrderByCategory: {},
  });
  const [settings, setSettings] = React.useState({
    theme: 'synthwave', firstRun: true, geminiKey: '', aiModel: 'gemini-2.5-flash', fungistNotifications: {},
    librarySize: 'medium', showcaseMode: 'recent_added',
    collapsed: {},
  });
  const [selectedId, setSelectedId] = React.useState(null);
  const [selectedToolId, setSelectedToolId] = React.useState(null);
  // A game launched by NEO-LIB is still tracked while the window stays open.
  // Rest Mode uses this to pause every non-essential bit of background work.
  const [runningGame, setRunningGame] = React.useState(null);
  // A game started through Steam, Battle.net, or another client is discovered
  // separately. Fungist can offer the player a clear one-click Rest Mode
  // choice instead of silently hiding the launcher at an awkward moment.
  const [externalRunningGame, setExternalRunningGame] = React.useState(null);
  const [externalRestOverride, setExternalRestOverride] = React.useState(false);
  const [ratingPromptGame, setRatingPromptGame] = React.useState(null);
  const [managedToolInstallId, setManagedToolInstallId] = React.useState('');
  const gameRestActive = !!runningGame && (
    settings.gameRestMode !== false
    || (runningGame.source === 'external' && externalRestOverride)
  );
  const [unlockedCategories, setUnlockedCategories] = React.useState([]);
  const [search, setSearch] = React.useState('');

  const [showAdd, setShowAdd] = React.useState(false);
  const [toolMetadataTarget, setToolMetadataTarget] = React.useState(null);
  const [showWizard, setShowWizard] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

  const [catModal, setCatModal] = React.useState({ open: false, initial: null });
  const [categoryManagerOpen, setCategoryManagerOpen] = React.useState(false);
  const [catCtx, setCatCtx] = React.useState({ open: false, category: null, anchor: null });
  const [pinModal, setPinModal] = React.useState({ open: false, mode: 'unlock', category: null, error: '' });
  const [pinThen, setPinThen] = React.useState(null);

  const [fetching, setFetching] = React.useState(false);
  const [updatingAll, setUpdatingAll] = React.useState(false);
  const [metadataRefreshProgress, setMetadataRefreshProgress] = React.useState({ done: 0, total: 0, mode: '' });
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
  const [metadataRepairQueue, setMetadataRepairQueue] = React.useState({ active: false, ids: [], index: 0, repaired: 0, skipped: 0 });

  /* --- Drag-drop overlay state --- */
  const [dragOver, setDragOver] = React.useState(false);
  const [wizardPrefillRoot, setWizardPrefillRoot] = React.useState('');
  const [wizardAutoScan, setWizardAutoScan] = React.useState(false);

  /* --- Launcher detector --- */
  const [detectedLauncher, setDetectedLauncher] = React.useState(null);
  // Track in-flight silent imports so the polling loop doesn't double-fire
  const silentImportInFlight = React.useRef({});
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
    if (!isElectron || settings.mode !== 'tools' || !window.api?.fetchToolMetadata) return undefined;
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
            tool.icon ? Promise.resolve(tool.icon) : window.api.extractIcon?.(tool.exePath),
            window.api.fetchToolMetadata({ exePath: tool.exePath, query: tool.name }),
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
    if (!isElectron || !window.api?.detectLaunchers) return undefined;
    if (settings.launcherDetectEnabled === false || gameRestActive) return undefined;
    let cancelled = false;
    const dismissed = settings.launcherDetectDismissed || {};
    const askLater = settings.launcherAskLater || {};
    const autoImport = settings.launcherAutoImport || {};

    const LAUNCHER_LABELS = { steam: 'Steam', epic: 'Epic Games', ea: 'EA', gog: 'GOG', ubisoft: 'Ubisoft Connect', battlenet: 'Battle.net', riot: 'Riot Client', xbox: 'Xbox / Game Pass', rockstar: 'Rockstar Games', itch: 'itch.io' };

    // Silent diff-and-import for launchers the user previously approved.
    // Adds only NEW games (by appid or exePath), auto-refetches metadata, shows one toast.
    const silentImport = async (key) => {
      if (silentImportInFlight.current[key]) return;
      silentImportInFlight.current[key] = true;
      try {
        let resp = null;
        if (key === 'steam') resp = await window.api.scanSteam();
        else if (key === 'epic') resp = await window.api.scanEpic();
        else if (key === 'gog') resp = await window.api.scanGog();
        else if (key === 'ea') resp = await window.api.scanEa();
        else if (key === 'ubisoft') resp = await window.api.scanUbisoft();
        else if (key === 'battlenet') resp = await window.api.scanBattlenet();
        else if (key === 'riot') resp = await window.api.scanRiot();
        else if (key === 'xbox') resp = await window.api.scanXbox();
        else if (key === 'rockstar') resp = await window.api.scanRockstar();
        else if (key === 'itch') resp = await window.api.scanItch();
        else return;
        if (cancelled || !resp || !resp.items) return;

        // Read current library through setState callback to avoid stale closure
        let newGames = [];
        const launcherCats = {
          steam: { id: '__launcher_steam__', name: 'Steam', colorId: 'cyan', pinnedBottom: true, logoLabel: 'Steam' },
          epic:  { id: '__launcher_epic__',  name: 'Epic Games', colorId: 'slate', pinnedBottom: true, logoLabel: 'Epic' },
          gog:   { id: '__launcher_gog__',   name: 'GOG', colorId: 'violet', pinnedBottom: true, logoLabel: 'GOG' },
          ea:    { id: '__launcher_ea__',    name: 'EA App', colorId: 'orange', pinnedBottom: true, logoLabel: 'EA' },
          ubisoft: { id: '__launcher_ubisoft__', name: 'Ubisoft', colorId: 'blue', pinnedBottom: true, logoLabel: 'Ubi' },
          battlenet: { id: '__launcher_battlenet__', name: 'Battle.net', colorId: 'cyan', pinnedBottom: true, logoLabel: 'Bnet' },
          riot: { id: '__launcher_riot__', name: 'Riot', colorId: 'red', pinnedBottom: true, logoLabel: 'Riot' },
          xbox: { id: '__launcher_xbox__', name: 'Xbox / Game Pass', colorId: 'green', pinnedBottom: true, logoLabel: 'Xbox' },
          rockstar: { id: '__launcher_rockstar__', name: 'Rockstar', colorId: 'yellow', pinnedBottom: true, logoLabel: 'R*' },
          itch: { id: '__launcher_itch__', name: 'itch.io', colorId: 'red', pinnedBottom: true, logoLabel: 'itch' },
        };
        const launcherCat = launcherCats[key];

        setLibrary((prev) => {
          const existing = new Set();
          (prev.games || []).forEach((g) => {
            if (g.appid) existing.add(`appid:${g.appid}`);
            if (g.gogId) existing.add(`gog:${g.gogId}`);
            if (g.launcherProductId) existing.add(`launcher-product:${g.launcherProductId}`);
            if (g.exePath) existing.add(`exe:${g.exePath.toLowerCase()}`);
          });
          const scannedItems = resp.items || [];
          const repairByIdentity = new Map();
          scannedItems.forEach((it) => {
            if (it.appid) repairByIdentity.set(`appid:${it.appid}`, it);
            if (it.gogId) repairByIdentity.set(`gog:${it.gogId}`, it);
            if (it.launcherProductId) repairByIdentity.set(`launcher-product:${it.launcherProductId}`, it);
          });
          const repairedGames = (prev.games || []).map((game) => {
            const identity = game.appid ? `appid:${game.appid}` : game.gogId ? `gog:${game.gogId}` : game.launcherProductId ? `launcher-product:${game.launcherProductId}` : '';
            const stronger = identity ? repairByIdentity.get(identity) : null;
            const repairedPath = stronger?.exe || stronger?.launchExe || '';
            if (!stronger || !repairedPath || !isImportedHelperTarget(game.exePath) || isImportedHelperTarget(repairedPath)) return game;
            return { ...game, exePath: repairedPath, launchUrl: stronger.launchUrl || game.launchUrl, launchTargetRepairedAt: Date.now() };
          });
          const repairedCount = repairedGames.filter((game, index) => game !== (prev.games || [])[index]).length;
          const toAdd = scannedItems.filter((it) => {
            if (it.appid && existing.has(`appid:${it.appid}`)) return false;
            if (it.gogId && existing.has(`gog:${it.gogId}`)) return false;
            if (it.launcherProductId && existing.has(`launcher-product:${it.launcherProductId}`)) return false;
            const exe = (it.exe || it.installdir || '').toLowerCase();
            if (exe && existing.has(`exe:${exe}`)) return false;
            return true;
          });
          if (toAdd.length === 0 && repairedCount === 0) return prev;
          newGames = toAdd.map((it) => ({
            id: uid(),
            name: it.name,
            exePath: it.exe || it.installdir,
            appid: it.appid,
            gogId: it.gogId,
            launcherProductId: it.launcherProductId,
            installedVersion: it.installedVersion || '',
            launcher: key,
            source: key,
            launchUrl: it.launchUrl,
            categoryIds: launcherCat ? [launcherCat.id] : [],
            addedAt: Date.now(),
            librarySeenAt: null,
          }));
          let cats = prev.categories || [];
          if (launcherCat && !cats.find((c) => c.id === launcherCat.id)) {
            cats = [...cats, launcherCat];
          }
          return { ...prev, categories: cats, games: [...newGames, ...repairedGames] };
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
          if (dismissed[key]) continue;
          const later = askLater[key];
          if (later && Date.now() - later < 24 * 60 * 60 * 1000) continue;

          // Imports must remain a deliberate Wizard action. Older builds
          // silently refreshed an already-known launcher while it was running,
          // which made accidental duplicate imports possible.
          const hasExisting = !!libraryRef.current?.games?.some(
            (g) => g.launcher === key || g.source === key || g.source === `${key}-import`
          );
          if (hasExisting) {
            continue;
          }

          setDetectedLauncher(key);
          return;
        }
      } catch { /* offline or non-Windows — ignore */ }
    };
    tick();
    const t = setInterval(tick, 5 * 60 * 1000); // every 5 minutes
    return () => { cancelled = true; clearInterval(t); };
  }, [gameRestActive, settings.launcherDetectEnabled, settings.launcherDetectDismissed, settings.launcherAskLater, settings.launcherAutoImport]);

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
    notify(`${LAUNCHER_LABELS[key]?.name || key} detected — choose it in the Wizard to review the import first.`);
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
        const lib = await window.api.loadLibrary();
        const s = await window.api.loadSettings();
        // Rating System v2 deliberately starts everyone fresh. Earlier whole-
        // star ratings are not comparable to the new precise fractional scale,
        // so clear them exactly once rather than quietly reinterpreting them.
        const resetRatings = Number(s.ratingSystemVersion || 0) < 2;
        const loadedLibrary = {
          games: (lib.games || []).map((g) => {
            const hydrated = { categoryIds: [], addedAt: Date.now(), ...g };
            // Existing libraries should not suddenly receive a wall of NEW
            // badges after upgrading. Only games added from this version on
            // start with an explicit unseen marker.
            if (!Object.prototype.hasOwnProperty.call(hydrated, 'librarySeenAt')) {
              hydrated.librarySeenAt = hydrated.addedAt || Date.now();
            }
            if (resetRatings) {
              delete hydrated.rating;
              delete hydrated.ratedAt;
            }
            // Lightweight local migration: existing libraries get a profile
            // from their already-stored direct genre evidence. No network
            // calls, no category changes, and no guessing from descriptions.
            const directGenreEvidence = hydrated.genreTags?.length ? hydrated.genreTags : (hydrated.genres || []);
            if ((!hydrated.genreProfile || hydrated.genreProfile.taxonomyVersion !== GENRE_TAXONOMY_VERSION) && directGenreEvidence.length) {
              hydrated.genreProfile = normalizeGenreProfile({ rawTags: directGenreEvidence, source: hydrated.source || 'web' });
            }
            return hydrated;
          }),
          categories: lib.categories || [],
          gameOrderByCategory: lib.gameOrderByCategory || {},
          tools: (lib.tools || []).map((t) => ({ categoryIds: [], addedAt: Date.now(), ...t })),
          toolCategories: lib.toolCategories || [],
          toolOrderByCategory: lib.toolOrderByCategory || {},
        };
        setLibrary(loadedLibrary);
        // Reset collapsed state each session by default — user wanted "always expanded unless I close them"
        const cleanSettings = { ...s };
        if (!s.categoriesCollapsedDefault) cleanSettings.collapsed = {};
        // Home is the default landing screen. Tools is the only workspace that
        // remains selected across restarts; legacy News/Stats modes migrate home.
        if (cleanSettings.mode !== 'tools') cleanSettings.mode = 'home';
        if (resetRatings) cleanSettings.ratingSystemVersion = 2;
        setSettings((prev) => ({ ...prev, ...cleanSettings }));

        // First desktop run: read only the ordinary Windows adapter list, then
        // add managed GPU-Z / CPU-Z and a genuine vendor control-centre shortcut
        // when one exists. This never installs drivers or changes GPU settings.
        if (!s.gpuSetupVersion) {
          window.api.detectGpuSetup?.().then((setup) => {
            if (!setup?.ok) return;
            setLibrary((current) => {
              const next = withGpuSetupTools(current, setup);
              // First hydration normally skips its auto-save. Persist this
              // one-time hardware setup directly so a fast GPU query cannot
              // race the initial effect and lose the new Tools shortcuts.
              window.api.saveLibrary(next).catch(() => {});
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
            window.api.saveSettings(gpuSettings).catch(() => {});
          }).catch(() => {});
        }

        // The normal persistence effect skips its first hydration write. Save
        // this intentional migration directly so ratings cannot reappear on a
        // subsequent boot if the user closes NEO-LIB immediately.
        if (resetRatings) {
          await Promise.all([
            window.api.saveLibrary(loadedLibrary),
            window.api.saveSettings(cleanSettings),
          ]);
        }

        // "What's new" toast — show once per installed version. First-ever
        // run sets the version silently so the tutorial owns the welcome moment.
        if (!s.lastSeenVersion) {
          window.api.saveSettings({ ...s, lastSeenVersion: APP_VERSION });
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
          window.api.scanGameUpdates?.({ games: loadedLibrary.games.map(({ id, name, appid, launcher, source, steamOwned, installedVersion, updateWatchUrl, website, exePath }) => ({ id, name, appid, launcher, source, steamOwned, installedVersion, updateWatchUrl, website, exePath })) }).then(recordUpdateLedger).catch(() => {});
        }, 35_000);

        // Wire playtime tracking event
        // v1.4.0 — playtime is stored in MINUTES throughout the app (matches
        // Steam's localconfig.vdf unit and StatsPanel expectations). Convert
        // the raw session seconds → minutes here so we stop inflating values.
        window.api.onGameExited(({ gameId, seconds }) => {
          setRunningGame((active) => !gameId || active?.id === gameId ? null : active);
          if (!gameId) return;
          const addMinutes = (Number(seconds) || 0) / 60;
          setLibrary((curr) => {
            const playedGame = curr.games.find((game) => game.id === gameId);
            const meaningfulSession = Number(seconds) >= 15 * 60;
            const canPrompt = playedGame && !Number(playedGame.rating) && !playedGame.ratingPromptDismissed && Number(playedGame.ratingPromptSnoozedUntil || 0) <= Date.now();
            if (meaningfulSession && canPrompt) window.setTimeout(() => setRatingPromptGame({ game: playedGame, seconds: Number(seconds) }), 650);
            return {
            ...curr,
            games: curr.games.map((g) =>
              g.id === gameId
                ? {
                    ...g,
                    playtime: (Number(g.playtime) || 0) + addMinutes,
                    lastPlayedAt: Date.now(),
                  }
                : g
            ),
          }; });
          // A game process that closes almost immediately can be a wrong exe,
          // launcher bootstrap, or a real failure. We wait for a second event
          // before offering Doctor so a one-off launcher handoff is not noisy.
          if (Number(seconds) > 0 && Number(seconds) < 8) recordLaunchProblem(gameId, 'closed immediately');
        });
        window.api.onExternalGameState?.(({ active, gameId, name }) => {
          if (active) {
            setExternalRunningGame({ id: gameId, name: name || 'External game', source: 'external' });
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

  // Known library games started through Steam, Battle.net, Epic, or another
  // client are watched via an ordinary path-only Windows process check. The
  // check provides an explicit low-usage offer; an idle launcher never counts.
  React.useEffect(() => {
    if (!isElectron || !window.api?.watchExternalGames) return undefined;
    const games = (library.games || []).map(({ id, name, exePath }) => ({ id, name, exePath }));
    window.api.watchExternalGames({ games }).catch(() => {});
    return undefined;
  }, [library.games]);

  const persistSettings = (next) => {
    setSettings(next);
    if (isElectron) window.api.saveSettings(next);
  };
  // Functional update — safe against rapid back-to-back calls (e.g. two onClicks in the same handler)
  const updateSetting = React.useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (isElectron) window.api.saveSettings(next);
      return next;
    });
  }, []);

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
    if (gameRestActive || typeof window === 'undefined' || !window.api?.fetchAllNews) return undefined;
    let cancelled = false;
    const check = async () => {
      // Every named library game is news-eligible. Steam/GOG/itch keep their
      // direct feeds, while other launchers and local titles use the bounded
      // public-source fallback in the desktop process.
      const games = (library.games || []).filter((g) => g && String(g.name || '').trim());
      if (!games.length) { setUnseenNewsCount(0); return; }
      try {
        const res = await window.api.fetchAllNews({
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
    if (!isElectron || !window.api?.importSteamPlaytime) {
      notify('Steam import only available in the desktop build.');
      return;
    }
    try {
      const res = await window.api.importSteamPlaytime({ force });
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
    setLibrary((curr) => ({
      ...curr,
      games: curr.games.map((g) => {
        const p = patches.find((x) => x.id === g.id);
        return p ? { ...g, ...p } : g;
      }),
    }));
    setImportPreview((p) => ({ ...p, open: false }));
    notify(`Applied ${patches.filter((p) => p.playtime !== undefined).length} playtime change(s).`);
  }, []);
  React.useEffect(() => {
    if (gameRestActive || typeof window === 'undefined' || !window.api?.fetchAllNews) return undefined;
    let cancelled = false;
    const pinnedSet = new Set(settings.pinnedGameIds || []);
    const watched = (library.games || []).filter((g) =>
      g && String(g.name || '').trim() && (pinnedSet.has(g.id) || Number(g.rating) === 5)
    );
    const check = async () => {
      if (!watched.length) return;
      try {
        const res = await window.api.fetchAllNews({
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
  const ensureOrder = (catId, gameIds) => {
    const order = currentOrder[catId] || [];
    const set = new Set(order);
    return [...order, ...gameIds.filter((id) => !set.has(id))];
  };

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
    if (!isElectron || !window.api?.scanExternalGamesNow) {
      return { ok: false, message: 'Running-game checks are available in the installed Windows app.' };
    }
    const result = await window.api.scanExternalGamesNow().catch(() => null);
    if (!result?.ok) return { ok: false, message: result?.busy ? 'The game scan is already running. Try again in a moment.' : 'I could not check running games right now.' };
    if (!result.active) return { ok: true, active: false, message: 'I could not match a running game to a NEO-LIB library entry.' };
    const game = { id: result.gameId, name: result.name || 'A library game', source: 'external' };
    setExternalRunningGame(game);
    return { ok: true, active: true, game };
  }, []);
  const enableExternalRestMode = React.useCallback((game) => {
    const active = game || externalRunningGame;
    if (!active?.id) return { ok: false, message: 'I need to identify the running game first.' };
    // This is a one-game opt-in even when the player keeps the global default
    // off. The override clears automatically when the exact process exits.
    setExternalRestOverride(true);
    setRunningGame({ ...active, source: 'external' });
    notify(`${active.name} is running from another launcher. NEO-LIB is now resting.`);
    return { ok: true, active: true, game: active };
  }, [externalRunningGame]);
  const askFungist = React.useCallback(async (message, history = [], visibleLibraryGames = []) => {
    if (!window.api?.askFungist) return { ok: false, error: 'Fungist chat is available in the NEO-LIB desktop app.' };
    return window.api.askFungist({ apiKey: settings.geminiKey || '', message, history, libraryContext: fungistLibrarySnapshot(visibleLibraryGames), model: settings.aiModel || 'gemini-2.5-flash' });
  }, [settings.aiModel, settings.geminiKey]);
  const recordFungistNotice = React.useCallback((entry) => {
    if (!entry?.key) return;
    const item = { ...entry, createdAt: Date.now() };
    updateSetting({ fungistInbox: [item, ...(Array.isArray(settings.fungistInbox) ? settings.fungistInbox : [])].slice(0, 60) });
  }, [settings.fungistInbox]);
  const clearFungistInbox = React.useCallback(() => updateSetting({ fungistInbox: [] }), []);
  // Persist a compact, read-only update checklist. It records evidence from
  // the scan rather than guessing, so callers can actively filter known-current
  // games instead of treating an empty alert list as an unknown result.
  const recordUpdateLedger = React.useCallback((result) => {
    const entries = Array.isArray(result?.ledger) ? result.ledger.filter((entry) => entry?.id && entry?.status) : [];
    if (!entries.length) return;
    setSettings((prev) => {
      const prior = prev.updateStatusLedger && typeof prev.updateStatusLedger === 'object' ? prev.updateStatusLedger : {};
      const merged = { ...prior };
      entries.forEach((entry) => { merged[entry.id] = entry; });
      // Keep the local settings file bounded even for a very large library.
      const trimmed = Object.fromEntries(Object.entries(merged).sort((a, b) => Number(b[1]?.checkedAt || 0) - Number(a[1]?.checkedAt || 0)).slice(0, 1500));
      const next = { ...prev, updateStatusLedger: trimmed };
      if (isElectron) window.api.saveSettings(next);
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

  /* --- Items (Games / Tools) --- */
  const addGame = (data) => {
    const g = { id: uid(), categoryIds: [], addedAt: Date.now(), librarySeenAt: null, ...withGenreProfile(data) };
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
      gog:   { id: '__launcher_gog__',   name: 'GOG', colorId: 'violet', pinnedBottom: true, logoLabel: 'GOG' },
      ea:    { id: '__launcher_ea__',    name: 'EA App', colorId: 'orange', pinnedBottom: true, logoLabel: 'EA' },
      ubisoft: { id: '__launcher_ubisoft__', name: 'Ubisoft', colorId: 'blue', pinnedBottom: true, logoLabel: 'Ubi' },
      battlenet: { id: '__launcher_battlenet__', name: 'Battle.net', colorId: 'cyan', pinnedBottom: true, logoLabel: 'Bnet' },
      riot: { id: '__launcher_riot__', name: 'Riot', colorId: 'red', pinnedBottom: true, logoLabel: 'Riot' },
      xbox: { id: '__launcher_xbox__', name: 'Xbox / Game Pass', colorId: 'green', pinnedBottom: true, logoLabel: 'Xbox' },
      rockstar: { id: '__launcher_rockstar__', name: 'Rockstar', colorId: 'yellow', pinnedBottom: true, logoLabel: 'R*' },
      itch: { id: '__launcher_itch__', name: 'itch.io', colorId: 'red', pinnedBottom: true, logoLabel: 'itch' },
    };
    const launcherCat = data.launcher ? launcherCats[data.launcher] : null;
    // FALLBACK: when the local .exe icon couldn't be extracted (common for sub-folder
    // launchers like Cyberpunk's REDLauncher), use the fetched online artwork instead.
    const onlineFallback = data.capsuleImage || data.headerImage || data.coverUrl || data.background || null;
    const icon = data.icon || onlineFallback;
    const g = { id: uid(), categoryIds: [], addedAt: Date.now(), librarySeenAt: null, ...withGenreProfile(data), icon };
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
    const newOnes = entries.map((e) => ({ id: uid(), categoryIds: [], addedAt: Date.now(), librarySeenAt: null, ...withGenreProfile(e) }));
    setLibrary((prev) => ({ ...prev, games: [...newOnes, ...prev.games] })); // wizard always imports games
    setSelectedId(newOnes[0].id);
    notify(`Imported ${newOnes.length} game${newOnes.length !== 1 ? 's' : ''}`);
    fireConfetti(`+${newOnes.length} games`);
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
    const exePath = await window.api.pickExe();
    if (!exePath) return;
    const result = await window.api.verifyManagedTool({ toolId: tool.managedTool, exePath });
    if (!result?.ok) { notify(result?.error || 'That executable could not be used.'); return; }
    updateTool(tool.id, { exePath: result.exePath, availability: 'installed', managedInstalledAt: Date.now(), managedInstallMode: 'located' });
    notify(`${tool.name} located and ready.`);
  };
  const installManagedTool = async (tool) => {
    if (!isElectron || !tool?.managedTool || managedToolInstallId) return;
    setManagedToolInstallId(tool.id);
    try {
      const result = await window.api.installManagedTool(tool.managedTool);
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
      const res = await window.api.launchGame({
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
        if (settings.fungistEnabled !== false && settings.soundsEnabled !== false && (settings.soundPack || 'synthwave') !== 'none' && settings.fungistVoiceEnabled !== false) {
          playFungistVoice('play-time', { volume: settings.fungistVoiceVolume ?? 72, cooldownMs: 12_000 });
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
          window.api.scanGameUpdates?.({ games: library.games.map(({ id, name, appid, launcher, source, steamOwned, installedVersion, updateWatchUrl, website, exePath }) => ({ id, name, appid, launcher, source, steamOwned, installedVersion, updateWatchUrl, website, exePath })) }).then(recordUpdateLedger).catch(() => {});
        }, 1250);
      }
    } finally {
      launchOriginRef.current = null;
      window.setTimeout(() => { launchRequestInFlight.current = false; }, 750);
    }
  };

  /* --- Metadata --- */
  // Ref to expose refetchGame to background callers (e.g. silentImport in the
  // launcher polling effect) without retriggering the effect on every render.
  const refetchGameRef = React.useRef(null);
  const refetchGame = async (g, opts = {}) => {
    if (!isElectron) { notify('Re-fetch only works in the installed app.'); return null; }
    if (!opts.silent && !opts.autoApply && !opts.forceSearch) {
      setRefreshReview({ games: [g], index: 0, field: 'all-locked', options: opts });
      return null;
    }
    setFetching(true);
    const query = opts.query || g.name || guessNameFromPath(g.exePath);
    const skip = [];
    if (opts.skipCurrentSource && g.source) skip.push(g.source);
    // SAFETY: if game already has a Steam appid, lock to that appid so refetch can NEVER
    // accidentally replace this game's data with another game's. User must explicitly
    // request a "Re-search" (different query) to escape the lock.
    // Battle.net owns its own product identity. An old/cross-store appid must
    // never bypass Blizzard's exact catalogue route during Re-fetch info.
    const lockedAppid = (!opts.forceSearch && g.appid && String(g.launcher || '').toLowerCase() !== 'battlenet') ? g.appid : null;

    // An imported launcher record can have a technical or shortened display
    // name. If the first automatic lookup comes up empty, quietly retry with
    // bounded clues from the selected executable, game folder, parent folder,
    // and nearby title/readme fields. This is the same evidence shown in the
    // manual picker, now used before asking the player to rescue a failed
    // import. Exact Steam app IDs remain locked and never fuzzy-researched.
    const queries = [query];
    if (!lockedAppid && g.exePath && window.api?.deriveMetadataHints) {
      try {
        const hints = await window.api.deriveMetadataHints({ exePath: g.exePath, currentName: g.name || query });
        for (const hint of (hints?.hints || []).slice(0, 8)) {
          const candidate = String(hint?.query || '').trim();
          if (candidate && !queries.some((existing) => existing.toLowerCase() === candidate.toLowerCase())) queries.push(candidate);
        }
      } catch { /* local hints are best effort; normal lookup still proceeds */ }
    }

    let result = null;
    let resolvedQuery = query;
    for (const candidate of queries) {
      result = await window.api.fetchMetadata({
        query: candidate,
        skipSources: skip,
        geminiKey: settings.geminiKey || '',
        aiModel: settings.aiModel || 'gemini-2.5-flash',
        lockedAppid,
        launcher: g.launcher || '',
        launcherProductId: g.launcherProductId || '',
        force: !opts.silent,
      });
      if (result) {
        resolvedQuery = candidate;
        break;
      }
    }
    // Accept-before-add: when called interactively (not silent), open the Accept
    // modal so the user can compare current vs proposed metadata before it's
    // applied. The modal will call onAccept(patch) to commit, or onTryAgain()
    // to re-search with a different name.
    // Battle.net's maintained product catalogue is an exact local-product
    // match, not a fuzzy store candidate.  Re-fetch should therefore do what
    // the button promises for existing WoW/Warcraft III imports: apply the
    // known Blizzard record directly instead of opening a generic accept
    // screen that makes the refresh appear to have done nothing.
    const authoritativeBattleNet = String(g.launcher || '').toLowerCase() === 'battlenet'
      && result?.source === 'battlenet'
      && !opts.forceSearch;
    if (!opts.silent && !opts.autoApply && !authoritativeBattleNet) {
      setFetching(false);
      setAcceptPreview({ open: true, game: g, proposed: result, busy: false });
      return result;
    }
    if (!result) {
      setFetching(false);
      if (!opts.silent && !opts.quiet) {
        notify(`No match for "${resolvedQuery}" — opening Troubleshoot…`);
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
      genreTags: result.genreTags?.length ? result.genreTags : g.genreTags || [],
      developers: result.developers?.length ? result.developers : g.developers || [],
      publishers: result.publishers?.length ? result.publishers : g.publishers || [],
      releaseDate: result.releaseDate || g.releaseDate || '',
      metacritic: result.metacritic ?? g.metacritic,
      screenshots: result.screenshots?.length ? result.screenshots : g.screenshots || [],
      website: result.website || g.website || '',
      metadataFetchedAt: Date.now(),
    });
    setFetching(false);
    if (!opts.quiet) notify(`Updated · ${result.name || g.name} (via ${result.source})`);
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

  const beginMetadataRepairQueue = (queueGames) => {
    const ids = (queueGames || []).map((game) => game?.id).filter(Boolean);
    if (!ids.length) { notify('No unidentified games to review.'); return; }
    const first = (libraryRef.current.games || []).find((game) => game.id === ids[0]);
    setMetadataRepairQueue({ active: true, ids, index: 0, repaired: 0, skipped: 0 });
    setTidyOpen(false);
    if (first) {
      setSelectedId(first.id);
      setMode('library');
      setFetchPickerGame(first);
    }
  };

  const advanceMetadataRepairQueue = (outcome = 'skipped') => {
    if (!metadataRepairQueue.active) return;
    const repaired = metadataRepairQueue.repaired + (outcome === 'repaired' ? 1 : 0);
    const skipped = metadataRepairQueue.skipped + (outcome === 'skipped' ? 1 : 0);
    let nextIndex = metadataRepairQueue.index + 1;
    const currentGames = libraryRef.current.games || [];
    while (nextIndex < metadataRepairQueue.ids.length && !currentGames.some((game) => game.id === metadataRepairQueue.ids[nextIndex])) {
      nextIndex += 1;
    }
    setAcceptPreview({ open: false, game: null, proposed: null, busy: false });
    setFetchPickerGame(null);
    if (nextIndex >= metadataRepairQueue.ids.length) {
      setMetadataRepairQueue({ active: false, ids: [], index: 0, repaired: 0, skipped: 0 });
      notify(`Identity review complete · ${repaired} repaired · ${skipped} skipped`);
      return;
    }
    const nextId = metadataRepairQueue.ids[nextIndex];
    const nextGame = currentGames.find((game) => game.id === nextId);
    setMetadataRepairQueue((queue) => ({ ...queue, index: nextIndex, repaired, skipped }));
    if (nextGame) {
      setSelectedId(nextGame.id);
      setFetchPickerGame(nextGame);
    }
  };

  const stopMetadataRepairQueue = () => {
    const { repaired, skipped } = metadataRepairQueue;
    setMetadataRepairQueue({ active: false, ids: [], index: 0, repaired: 0, skipped: 0 });
    setFetchPickerGame(null);
    setAcceptPreview({ open: false, game: null, proposed: null, busy: false });
    notify(`Identity review stopped · ${repaired} repaired · ${skipped} skipped`);
  };

  const metadataRefreshTargets = (mode = 'missing') => {
    const eligible = currentItems.filter((g) => !g.manualOverride);
    if (mode === 'full') return eligible;
    return eligible.filter((g) => {
      const missingArt = !(g.coverUrl || g.headerImage || g.background);
      const missingCopy = !(g.about || g.shortDescription);
      const missingIdentity = !(g.genres?.length || g.genreTags?.length || g.genreProfile?.core?.length);
      const lastFetch = Number(g.metadataFetchedAt || g.metadataUpdatedAt || 0);
      const stale = lastFetch > 0 && Date.now() - lastFetch > 90 * 24 * 60 * 60 * 1000;
      return missingArt || missingCopy || missingIdentity || stale;
    });
  };

  const requestMetadataRefresh = (mode = 'missing') => {
    const targets = metadataRefreshTargets(mode);
    const manual = currentItems.filter((g) => g.manualOverride).length;
    if (!targets.length) {
      notify(mode === 'full'
        ? 'No non-manual games are available for a full refresh.'
        : 'No incomplete or stale non-manual metadata needs a refresh.');
      return;
    }
    const isFull = mode === 'full';
    setConfirmCfg({
      open: true,
      title: isFull ? 'Full metadata refresh?' : 'Refresh missing metadata?',
      message: isFull
        ? `This will re-check metadata for ${targets.length} game${targets.length === 1 ? '' : 's'} and may take a while. Manual metadata is protected${manual ? `; ${manual} manual entr${manual === 1 ? 'y is' : 'ies are'} skipped.` : '.'}`
        : `This will refresh ${targets.length} game${targets.length === 1 ? '' : 's'} with missing identity, artwork, description, or older stored metadata. Manual metadata is protected${manual ? `; ${manual} manual entr${manual === 1 ? 'y is' : 'ies are'} skipped.` : '.'}`,
      confirmLabel: isFull ? `Refresh all ${targets.length}` : `Refresh ${targets.length}`,
      cancelLabel: 'Not now',
      onConfirm: () => refetchAll(mode),
    });
  };

  const refetchAll = async (mode = 'missing') => {
    if (currentItems.length === 0) return;
    const targets = metadataRefreshTargets(mode);
    const skipped = currentItems.length - targets.length;
    if (!targets.length) {
      notify(mode === 'full' ? 'No non-manual games are available for a full refresh.' : 'No incomplete or stale non-manual metadata needs a refresh.');
      return;
    }
    if (!isElectron) { notify('Re-fetch only works in the installed app.'); return; }
    setRefreshReview({ games: targets, index: 0, field: 'all-locked' });
    notify(`Review ${targets.length} games individually. Nothing is replaced without your selection.${skipped ? ` ${skipped} entries left untouched.` : ''}`);
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

  // Category removal is deliberately assignment-only: records, artwork,
  // playtime and the game itself always remain in the library.
  const requestDeleteCategory = async (category) => {
    if (!category) return;
    if (category.private && !unlockedCategories.includes(category.id)) {
      setPinThen(() => (pin) => {
        if (hashPin(pin) === category.pinHash) {
          deleteCategory(category.id);
          setPinModal({ open: false, mode: 'remove', category: null, error: '' });
        } else setPinModal((p) => ({ ...p, error: 'Wrong PIN.' }));
      });
      setPinModal({ open: true, mode: 'remove', category, error: '' });
      return;
    }
    const typed = await askPrompt({
      title: `Remove "${category.name}"?`,
      label: 'Type the category name to confirm. Its games move to Uncategorized and stay in NEO-LIB:',
      defaultValue: '',
      placeholder: category.name,
      confirmLabel: 'Remove category',
    });
    if (typed && typed.trim() === category.name) deleteCategory(category.id);
    else if (typed !== null) notify('Name did not match — removal cancelled.');
  };

  const clearRegularCategories = async () => {
    const count = (library.categories || []).filter((category) => !category.private).length;
    if (!count) return;
    const confirmed = await askConfirm({
      title: `Remove ${count} regular ${count === 1 ? 'category' : 'categories'}?`,
      message: 'Every game will remain in NEO-LIB and return to Uncategorized. Private categories stay protected, so hidden games cannot accidentally appear in your normal library.',
      confirmLabel: 'Remove regular categories',
      cancelLabel: 'Keep categories',
      destructive: true,
      typedConfirm: 'REMOVE',
    });
    if (!confirmed) return;
    setLibrary((prev) => {
      const removedIds = new Set((prev.categories || []).filter((category) => !category.private).map((category) => category.id));
      return {
        ...prev,
        categories: (prev.categories || []).filter((category) => category.private),
        games: (prev.games || []).map((game) => ({ ...game, categoryIds: (game.categoryIds || []).filter((id) => !removedIds.has(id)) })),
        gameOrderByCategory: Object.fromEntries(Object.entries(prev.gameOrderByCategory || {}).filter(([id]) => !removedIds.has(id))),
      };
    });
    notify(`${count} ${count === 1 ? 'category' : 'categories'} removed · games are now Uncategorized`);
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
      await requestDeleteCategory(c);
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
    const existingCats = currentCats;
    const nameToCat = {};
    for (const category of existingCats) nameToCat[category.name.toLowerCase()] = category;
    const addedCategories = [];
    for (const definition of defaultCats) {
      if (nameToCat[definition.name.toLowerCase()]) continue;
      const category = { id: uid(), name: definition.name, colorId: definition.colorId, private: false };
      nameToCat[definition.name.toLowerCase()] = category;
      addedCategories.push(category);
    }
    const before = currentItems
      .filter((game) => assignments.some((assignment) => assignment.id === game.id && assignment.cats.length))
      .map((game) => ({ id: game.id, categoryIds: [...(game.categoryIds || [])] }));
    setLibrary((prev) => {
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
        [sliceK.cats]: [...(prev[sliceK.cats] || []), ...addedCategories],
        [sliceK.items]: games,
      };
    });
    setAutoSortUndo({ before, addedCategoryIds: addedCategories.map((category) => category.id) });
    notify(`Auto-sort applied · ${defaultCats.length} reviewed collection${defaultCats.length === 1 ? '' : 's'}`);
    fireConfetti('Auto-sort complete');
  };

  const undoAutoSort = () => {
    if (!autoSortUndo) return;
    setLibrary((prev) => {
      const beforeById = new Map(autoSortUndo.before.map((entry) => [entry.id, entry.categoryIds]));
      const games = (prev[sliceK.items] || []).map((game) => beforeById.has(game.id)
        ? { ...game, categoryIds: beforeById.get(game.id) }
        : game);
      const createdIds = new Set(autoSortUndo.addedCategoryIds || []);
      const categories = (prev[sliceK.cats] || []).filter((category) => {
        if (!createdIds.has(category.id)) return true;
        return games.some((game) => (game.categoryIds || []).includes(category.id));
      });
      return { ...prev, [sliceK.cats]: categories, [sliceK.items]: games };
    });
    setAutoSortUndo(null);
    notify('Last Auto-sort assignment restored.');
  };

  const refetchMissingGenres = async (g) => {
    if (!isElectron) return;
    const result = await window.api.fetchMetadata({
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
        const result = await window.api.revealInFolder(g.exePath);
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
      if (!isElectron || !window.api?.importSteamPlaytime) {
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
  const visibleGames = React.useMemo(() => {
    if (isTools || launcherFilter === 'all') return currentItems;
    return currentItems.filter((g) => {
      const launcher = (g.launcher || '').toLowerCase();
      if (launcherFilter === 'other') {
        return !['steam', 'epic', 'ea', 'gog', 'ubisoft', 'battlenet', 'riot', 'xbox', 'rockstar', 'itch'].includes(launcher);
      }
      return launcher === launcherFilter;
    });
  }, [currentItems, isTools, launcherFilter]);
  const selected = currentItems.find((g) => g.id === currentSelectedId) || null;
  const libraryViewMode = settings.libraryViewMode || 'preview';
  const preferredLibraryGame = React.useMemo(() => {
    const games = library.games || [];
    return [...games].sort((a, b) => Number(b.lastPlayedAt || b.lastPlayed || 0) - Number(a.lastPlayedAt || a.lastPlayed || 0))[0] || null;
  }, [library.games]);
  const preferredTool = React.useMemo(() => {
    const tools = library.tools || [];
    return tools.find((tool) => tool.id === settings.lastToolId) || tools[0] || null;
  }, [library.tools, settings.lastToolId]);
  const openLibraryDefault = React.useCallback(() => {
    updateSetting({ mode: 'library', libraryViewMode: 'preview', launcherFilter: 'all' });
    setSelectedId(preferredLibraryGame?.id || null);
  }, [preferredLibraryGame, updateSetting]);
  const openToolsDefault = React.useCallback(() => {
    updateSetting({ mode: 'tools' });
    setSelectedToolId(preferredTool?.id || null);
  }, [preferredTool, updateSetting]);
  React.useEffect(() => {
    if ((settings.mode || 'library') === 'library' && libraryViewMode === 'preview' && !selectedId && preferredLibraryGame) setSelectedId(preferredLibraryGame.id);
  }, [settings.mode, libraryViewMode, selectedId, preferredLibraryGame]);
  React.useEffect(() => {
    if (settings.mode === 'tools' && !selectedToolId && preferredTool) setSelectedToolId(preferredTool.id);
  }, [settings.mode, selectedToolId, preferredTool]);
  const coverWallGames = React.useMemo(() => {
    const lockedPrivateIds = new Set(currentCats.filter((category) => category.private && !unlockedCategories.includes(category.id)).map((category) => category.id));
    return visibleGames.filter((game) => !(game.categoryIds || []).some((categoryId) => lockedPrivateIds.has(categoryId)));
  }, [visibleGames, currentCats, unlockedCategories]);
  // Home must remain useful without accidentally exposing a protected game.
  // Keep time/rating/activity numbers so dashboard totals still make sense,
  // but replace every identifying field (name, art, platform, metadata, path,
  // and online lookup key) with one category-aware protected placeholder.
  const lockedHomeCategoryByGameId = React.useMemo(() => {
    const lockedCategories = (library.categories || []).filter((category) => category.private && !unlockedCategories.includes(category.id));
    const categoryById = new Map(lockedCategories.map((category) => [category.id, category]));
    return Object.fromEntries((library.games || []).flatMap((game) => {
      const category = (game.categoryIds || []).map((id) => categoryById.get(id)).find(Boolean);
      return category ? [[game.id, category.name || 'Private category']] : [];
    }));
  }, [library.categories, library.games, unlockedCategories]);
  const homeGames = React.useMemo(() => (library.games || []).map((game) => {
    const categoryName = lockedHomeCategoryByGameId[game.id];
    if (!categoryName) return game;
    return {
      id: game.id,
      name: 'Locked game',
      launcher: 'private',
      homeLocked: true,
      homeLockedCategory: categoryName,
      playtime: game.playtime,
      lastPlayed: game.lastPlayed,
      lastPlayedAt: game.lastPlayedAt,
      addedAt: game.addedAt,
      rating: game.rating,
      myRating: game.myRating,
      ratedAt: game.ratedAt,
    };
  }), [library.games, lockedHomeCategoryByGameId]);
  const panicLockPrivateLibrary = React.useCallback(() => {
    const privateCategoryIds = new Set((library.categories || []).filter((category) => category.private).map((category) => category.id));
    if (!privateCategoryIds.size) return;
    const safeGames = (library.games || []).filter((game) => !(game.categoryIds || []).some((categoryId) => privateCategoryIds.has(categoryId)));
    const safeGame = safeGames.length ? safeGames[Math.floor(Math.random() * safeGames.length)] : null;
    // React batches these state changes: an exposed private Preview is replaced
    // by a safe game in the same render that re-locks every PIN category.
    setUnlockedCategories([]);
    setSelectedToolId(null);
    setSelectedId(safeGame?.id || null);
    updateSetting({ mode: 'library', libraryViewMode: 'preview' });
    notify(safeGame ? 'Private categories veiled. Safe Preview selected.' : 'Private categories veiled. No non-private game is available for Preview.');
  }, [library.categories, library.games, updateSetting]);
  const lockedWallCategories = React.useMemo(
    () => currentCats.filter((category) => category.private && !unlockedCategories.includes(category.id)),
    [currentCats, unlockedCategories],
  );
  const favouriteUpdate = React.useMemo(() => {
    const ledger = settings.updateStatusLedger || {};
    const pinned = new Set(settings.pinnedGameIds || []);
    return (library.games || []).find((game) => pinned.has(game.id) && ['available', 'pending'].includes(ledger[game.id]?.status));
  }, [library.games, settings.pinnedGameIds, settings.updateStatusLedger]);
  const specialUiTheme = ['anime', 'colorful', 'pro'].includes(settings.theme) ? settings.theme : '';
  const storedEffectsLevel = settings.effectsLevelByTheme?.[settings.theme];
  const activeEffectsLevel = Math.max(0, Math.min(4, Number.isFinite(storedEffectsLevel) ? storedEffectsLevel : (Number.isFinite(settings.effectsLevel) ? settings.effectsLevel : 2)));
  const specialUiOpacity = gameRestActive || !specialUiTheme
    ? 0
    : (Math.max(0, Math.min(100, Number(settings.specialDecorationOpacity ?? 46))) / 100) * [0, 0.65, 0.85, 1, 1][activeEffectsLevel];
  // Button borders are static, tiny artwork—not a particle system. They keep
  // following the Special-decoration slider and Rest Mode, but must not
  // disappear merely because the player lowers global FX for performance.
  const specialNavDecorationOpacity = gameRestActive || !specialUiTheme
    ? 0
    : Math.max(0, Math.min(100, Number(settings.specialDecorationOpacity ?? 46))) / 100;

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
          onDonate={() => { if (settings.fungistEnabled !== false && settings.soundsEnabled !== false && (settings.soundPack || 'synthwave') !== 'none' && settings.fungistVoiceEnabled !== false) playFungistVoice('donate', { volume: settings.fungistVoiceVolume ?? 72, cooldownMs: 18_000 }); setDonateOpen(true); }}
        />
      </div>

      <div className="neolib-ui-foreground relative z-20 flex min-h-0 flex-1">
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
          sidebarWidth={sidebarWidth}
          onStartResize={startResize}
          onGameViewed={markGameSeenInLibrary}
          onSelect={(id) => { setCurrentSelectedId(id); if (id && settings.mode === 'home') setMode('library'); }}
          onAddManual={() => { setToolMetadataTarget(null); setShowAdd(true); }}
          onOpenWizard={() => setShowWizard(true)}
          onOpenFeedback={openFeedback}
          onUpdateAll={requestMetadataRefresh}
          onTidyUp={() => setTidyOpen(true)}
          onCreateCategory={() => setCatModal({ open: true, initial: null })}
          onCategoryContext={(category, anchor) => setCatCtx({ open: true, category, anchor })}
          onGameContext={handleGameContext}
          onSetLibrarySize={(s) => updateSetting({ librarySize: s })}
          onOpenPlaytimeImport={() => openPlaytimeImport({ force: true })}
          onMoveGameToCategory={moveGameToCategory}
          onReorderGameInCategory={reorderGameInCategory}
          onReorderCategory={reorderCategory}
          onToggleCollapsed={toggleCollapsed}
          onUnlockCategory={requestUnlock}
          updatingAll={updatingAll}
          metadataRefreshProgress={metadataRefreshProgress}
          gameResting={gameRestActive}
          runningGameName={runningGame?.name || ''}
          allGames={library.games || []}
          onOpenSettings={() => setShowSettings(true)}
          onSystemHealthChange={onMascotHealthChange}
          systemHealthOpenRequest={mascotHealthOpenRequest}
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex-1 min-h-0 overflow-hidden">
            {!isTools && settings.mode === 'home' ? (
              <HomeHub games={homeGames} lockedGameCategories={lockedHomeCategoryByGameId} hasPrivateCategories={(library.categories || []).some((category) => category.private)} hasLockedPrivateCategories={(library.categories || []).some((category) => category.private && !unlockedCategories.includes(category.id))} onPanicLock={panicLockPrivateLibrary} resting={gameRestActive} homeLayout={settings.homeLayout || {}} onUpdateHomeLayout={(homeLayout) => updateSetting({ homeLayout })} updatesCache={settings.homeGameUpdatesCache} onUpdateUpdatesCache={(homeGameUpdatesCache) => updateSetting({ homeGameUpdatesCache })} onSelect={(id) => { if (lockedHomeCategoryByGameId[id]) { notify(`Unlock ${lockedHomeCategoryByGameId[id]} in Library to reveal this game.`); return; } setSelectedId(id); setMode('library'); }} onOpenPlaytimeImport={() => openPlaytimeImport({ force: true })} onOpenTidyUp={() => setTidyOpen(true)} />
            ) : !isTools && libraryViewMode === 'wall' ? (
              <CoverWall games={coverWallGames} density={settings.coverWallDensity || 5} onDensityChange={(coverWallDensity) => updateSetting({ coverWallDensity })} onSelect={(id) => { setSelectedId(id); updateSetting({ mode: 'library', libraryViewMode: 'preview' }); }} search={search} lockedCategories={lockedWallCategories} onUnlockCategory={requestUnlock} />
            ) : !selected ? (
              <WorkspaceEmpty kind={isTools ? 'tools' : 'library'} />
            ) : (
              <AnimatePresence mode="wait">{isTools ? <ToolDetail key={selected?.id || 'empty'} tool={selected} onLaunch={(tool, token) => launchGame(tool, token)} onRefetch={(tool) => { setToolMetadataTarget(tool); setShowAdd(true); }} onRevealFolder={async (tool) => { if (!isElectron) return notify('Open: ' + tool.exePath); const result = await window.api.revealInFolder(tool.exePath); if (!result?.ok) notify(result?.error || 'Could not open this tool folder.'); }} onLocateManagedTool={locateManagedTool} onInstallManagedTool={installManagedTool} installing={managedToolInstallId === selected?.id} /> : <GameDetail key={selected?.id || 'empty'} game={selected} categories={currentCats.filter((c) => !c.private || unlockedCategories.includes(c.id))} fetching={fetching} settings={settings} onLaunch={(game, token, origin) => { launchOriginRef.current = origin || null; return launchGame(game, token); }} onLaunchError={(error) => notify(`Launch blocked: ${error}`)} onRefetch={(g) => setFetchPickerGame(g)} onRevealFolder={async (g) => { if (!isElectron) return notify('Open: ' + g.exePath); const result = await window.api.revealInFolder(g.exePath); if (!result?.ok) notify(result?.error || 'Could not open this game folder.'); else if (result?.missingTarget) notify('The configured game file is missing, so NEO-LIB opened its containing folder instead.'); }} onToggleCategory={toggleGameInCategory} onCustomize={(g) => setEditMetaGame(g)} onOpenSaveManager={(g) => setSaveManagerGame(g)} onUpdateGame={updateGame} onLocateManagedTool={locateManagedTool} onInstallManagedTool={installManagedTool} managedToolInstalling={managedToolInstallId === selected?.id} />}</AnimatePresence>
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
        enabled={settings.fungistEnabled !== false}
        resting={gameRestActive}
        notificationSettings={settings.fungistNotifications || {}}
        healthState={mascotHealth.state}
        newsAlert={newsAlert}
        favouriteUpdate={favouriteUpdate}
        appUpdate={updateInfo?.available ? updateInfo : null}
        onOpenHealth={openMascotHealth}
        externalRunningGame={externalRunningGame}
        onScanRunningGame={scanForExternalRunningGame}
        onEnableExternalRest={enableExternalRestMode}
        onOpenNews={(alert) => {
          if (!alert?.url) return;
          if (isElectron && window.api?.openExternal) window.api.openExternal(alert.url);
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
        completion={fungistCompletion}
        launchCelebration={fungistLaunchCelebration}
        welcomeKey={fungistWelcomeKey}
        dockPosition={settings.fungistDockPosition || null}
        onOpenHome={() => { setCurrentSelectedId(null); setMode('home'); }}
        libraryGames={coverWallGames}
        onLaunchRequested={(game, token, origin) => { launchOriginRef.current = origin || null; return launchGame(game, token); }}
        onReportBug={() => openFeedback('bug')}
      />

      {/* Modals */}
      <AddGameModal open={showAdd && !isTools} onClose={() => setShowAdd(false)} onCreate={addGame} />
      <ToolMetadataModal
        open={showAdd && isTools}
        tool={toolMetadataTarget}
        onClose={() => { setShowAdd(false); setToolMetadataTarget(null); }}
        onCreate={addTool}
        onUpdate={updateTool}
        onNotice={notify}
      />
      <WizardModal
        open={showWizard}
        onClose={() => { setShowWizard(false); setWizardPrefillRoot(''); setWizardAutoScan(false); }}
        onAccept={addToGames}
        onAddManual={() => setShowAdd(true)}
        existingExePaths={(library.games || []).map((g) => g.exePath).filter(Boolean)}
        existingGames={library.games || []}
        prefilledRoot={wizardPrefillRoot}
        autoScan={wizardAutoScan}
        geminiKey={settings.geminiKey || ''}
        aiModel={settings.aiModel || 'gemini-2.5-flash'}
      />
      <SettingsRecoveryBoundary open={showSettings} onClose={() => setShowSettings(false)} onReportBug={() => openFeedback('bug')}>
        <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} settings={settings} setSettings={persistSettings} onShowChangelog={() => setChangelogOpen(true)} currentVersion={APP_VERSION} />
      </SettingsRecoveryBoundary>
      <SaveGameModal
        game={saveManagerGame}
        onClose={() => setSaveManagerGame(null)}
        onSaveFolder={(saveFolder) => { if (saveManagerGame) { updateGame(saveManagerGame.id, { saveFolder }); setSaveManagerGame((game) => game ? { ...game, saveFolder } : game); } }}
        onNotice={notify}
      />
      <LaunchDoctorModal
        game={launchDoctorGame}
        onClose={() => setLaunchDoctorGame(null)}
        onUseExecutable={(exePath) => {
          if (!launchDoctorGame) return;
          updateGame(launchDoctorGame.id, { exePath, launchDoctorSuggested: false, launchProblems: [] });
          notify(`Launch target updated · ${launchDoctorGame.name}`);
          setLaunchDoctorGame(null);
        }}
      />
      <ChangelogModal
        open={changelogOpen}
        currentVersion={APP_VERSION}
        lastSeenVersion={settings.lastSeenVersion}
        theme={settings.theme}
        onClose={() => {
          setChangelogOpen(false);
          // Persist so we don't show it again for this version
          if (settings.lastSeenVersion !== APP_VERSION) {
            updateSetting({ lastSeenVersion: APP_VERSION });
          }
        }}
      />
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
      <CategoryManagerModal
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        categories={library.categories || []}
        games={library.games || []}
        onCreate={() => { setCategoryManagerOpen(false); setCatModal({ open: true, initial: null }); }}
        onEdit={(category) => { setCategoryManagerOpen(false); setCatModal({ open: true, initial: category }); }}
        onDelete={requestDeleteCategory}
        onClearRegular={clearRegularCategories}
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
        typedConfirm={confirmCfg.typedConfirm}
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
        onClose={() => metadataRepairQueue.active ? advanceMetadataRepairQueue('skipped') : setAcceptPreview({ open: false, game: null, proposed: null, busy: false })}
        onAccept={async (patch) => {
          const g = acceptPreview.game;
          setAcceptPreview({ open: false, game: null, proposed: null, busy: false });
          if (g) await applyAcceptedMetadata(g, patch);
          if (metadataRepairQueue.active) advanceMetadataRepairQueue('repaired');
        }}
        onTryAgain={async () => {
          // v1.2.0: refetch from accept-preview now opens the unified
          // multi-source picker. User-driven, no more black-box auto cycle.
          const g = acceptPreview.game;
          if (!g) return;
          setAcceptPreview({ open: false, game: null, proposed: null, busy: false });
          setFetchPickerGame(g);
        }}
      />

      {/* Unified multi-source metadata picker — v1.2.0
          One modal handles: Re-fetch from GameDetail, Try again from
          Accept preview, and Wizard refetch. */}
      <FetchSourcePicker
        open={!!fetchPickerGame}
        game={fetchPickerGame}
        geminiKey={settings.geminiKey || ''}
        aiModel={settings.aiModel || 'gemini-2.5-flash'}
        progress={metadataRepairQueue.active ? {
          current: metadataRepairQueue.index + 1,
          total: metadataRepairQueue.ids.length,
          repaired: metadataRepairQueue.repaired,
          skipped: metadataRepairQueue.skipped,
        } : null}
        onStopQueue={stopMetadataRepairQueue}
        onClose={() => metadataRepairQueue.active ? advanceMetadataRepairQueue('skipped') : setFetchPickerGame(null)}
        onPick={(metadata) => {
          const g = fetchPickerGame;
          setFetchPickerGame(null);
          if (g) setAcceptPreview({ open: true, game: g, proposed: metadata, busy: false });
        }}
      />

      <TidyUpModal
        open={tidyOpen}
        games={library.games || []}
        onDelete={(id) => removeGame(id)}
        onSelect={(id) => { setSelectedId(id); setMode('library'); setTidyOpen(false); }}
        onRepairMetadata={beginMetadataRepairQueue}
        onClose={() => setTidyOpen(false)}
      />

      <PostPlayRatingModal
        game={ratingPromptGame?.game || null}
        seconds={ratingPromptGame?.seconds || 0}
        onRate={(rating) => {
          if (ratingPromptGame?.game?.id) updateGame(ratingPromptGame.game.id, { rating, ratingPromptSnoozedUntil: 0 });
          setRatingPromptGame(null);
          notify(`Rated ${ratingPromptGame?.game?.name || 'game'} · ${Number(rating).toFixed(1)}`);
        }}
        onSnooze={() => {
          if (ratingPromptGame?.game?.id) updateGame(ratingPromptGame.game.id, { ratingPromptSnoozedUntil: Date.now() + 7 * 24 * 60 * 60 * 1000 });
          setRatingPromptGame(null);
        }}
        onNever={() => {
          if (ratingPromptGame?.game?.id) updateGame(ratingPromptGame.game.id, { ratingPromptDismissed: true });
          setRatingPromptGame(null);
        }}
      />

      {/* Theme-aware confetti — bumps key when fired, auto-cleans */}
      <Confetti triggerKey={confetti.key} label={confetti.label} origin={confetti.origin} />

      {/* v1.4.0 — 3-second synthwave intro on every boot (skippable) */}
      {(introHiddenThisSession || settings.skipIntro) ? null : (
        <StartupIntro
          muted={settings.soundsEnabled === false}
          onDone={() => {
            setIntroHiddenThisSession(true);
          }}
        />
      )}

      {/* v1.5.0 — Feedback / Bug / Suggestion modal (Discord webhook) */}
      <FeedbackModal
        open={feedbackOpen}
        initialMode={feedbackInitialMode}
        appVersion={APP_VERSION}
        theme={settings.theme}
        onClose={() => setFeedbackOpen(false)}
      />

      {/* v1.6.0 — Playtime Import Preview */}
      <PlaytimeImportModal
        open={importPreview.open}
        games={library.games || []}
        steamData={importPreview.data}
        ownedAppids={importPreview.ownedAppids}
        currentAccount={importPreview.currentAccount}
        debug={importPreview.debug}
        onApply={applyImportPatches}
        onClose={() => setImportPreview((p) => ({ ...p, open: false }))}
        onRefreshSingle={async ({ appid }) => {
          if (!appid || !window.api?.importSteamPlaytime) return null;
          const res = await window.api.importSteamPlaytime({ force: true });
          return res?.data?.[String(appid)] || null;
        }}
        onRefreshAll={async () => {
          if (!window.api?.importSteamPlaytime) return;
          const res = await window.api.importSteamPlaytime({ force: true });
          if (res?.ok) {
            setImportPreview((p) => ({
              ...p,
              data: res.data || {},
              ownedAppids: res.ownedAppids || [],
              currentAccount: res.currentAccount || p.currentAccount,
              debug: res.debug || p.debug,
            }));
          }
        }}
      />

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

      {refreshReview && <RefreshCandidatesModal
        key={`${refreshReview.games[refreshReview.index].id}:${refreshReview.field}`}
        game={refreshReview.games[refreshReview.index]}
        field={refreshReview.field}
        options={{ geminiKey: settings.geminiKey || '', aiModel: settings.aiModel || 'gemini-2.5-flash', ...refreshReview.options }}
        progress={refreshReview.games.length > 1 ? `${refreshReview.index + 1} of ${refreshReview.games.length}` : null}
        onClose={() => setRefreshReview(null)}
        onSkip={refreshReview.games.length > 1 ? () => setRefreshReview(review => review.index + 1 < review.games.length ? { ...review, index: review.index + 1 } : null) : null}
        onApply={async patch => {
          const game = refreshReview.games[refreshReview.index];
          updateGame(game.id, refreshReview.field === 'all-locked' ? { ...patch, metadataFetchedAt: Date.now() } : patch);
          notify(`Saved selected ${refreshReview.field === 'all-locked' ? 'metadata' : refreshReview.field} · ${game.name}`);
          setRefreshReview(review => review.index + 1 < review.games.length ? { ...review, index: review.index + 1 } : null);
        }}
      />}
      <TroubleshootModal
        open={troubleshoot.open}
        game={troubleshoot.game}
        busy={fetching}
        onClose={() => setTroubleshoot({ open: false, game: null })}
        onAction={handleTroubleshoot}
      />

      <TutorialModal
        open={tutorialOpen}
        soundsEnabled={settings.fungistEnabled !== false && settings.soundsEnabled !== false && (settings.soundPack || 'synthwave') !== 'none'}
        voiceEnabled={settings.fungistEnabled !== false && settings.fungistVoiceEnabled !== false}
        voiceVolume={settings.fungistVoiceVolume ?? 72}
        onNavigate={navigateTutorial}
        onClose={() => { setTutorialVisualsOpen(false); setTutorialOpen(false); }}
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
        onUndo={undoAutoSort}
        hasUndo={!!autoSortUndo}
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

function BgAmbience({ theme, settings = {}, game = null, resting = false }) {
  // `synthGridEnabled` and `particlesEnabled` were retired legacy switches.
  // They could silently hide every modern FX layer after an upgrade, even when
  // the player selected Low–Max effects. Effects intensity is now the one
  // reliable master control; Rest Mode remains the only global hard stop.
  if (resting) return null;
  // Effects Level (0=None, 1=Low, 2=Med, 3=High, 4=Max) — persisted per-theme
  // in settings.effectsLevelByTheme[theme], so Synthwave can be Max and Modern
  // can be Low without cross-contamination. Falls back to settings.effectsLevel
  // (legacy global) then to 2 (Medium) for first-run.
  const perThemeMap = settings.effectsLevelByTheme || {};
  const perTheme = perThemeMap[theme];
  const rawLevel = Number.isFinite(perTheme)
    ? perTheme
    : (Number.isFinite(settings.effectsLevel) ? settings.effectsLevel : 2);
  const level = Math.max(0, Math.min(4, rawLevel));
  const cadence = ['full', 'balanced', 'calm'].includes(settings.motionCadence) ? settings.motionCadence : 'full';
  // Balanced remains fluid; it saves GPU work by reducing the expensive
  // decorative actors instead of turning smooth animation into visible steps.
  const cadenceProfile = cadence === 'calm'
    ? { duration: 1.7, particle: 0.48, sakura: 0.45, glow: 0.48, extraLayers: 0.34, opacity: 0.76 }
    : cadence === 'balanced'
      ? { duration: 1.12, particle: 0.78, sakura: 0.74, glow: 0.72, extraLayers: 0.6, opacity: 0.9 }
      : { duration: 1, particle: 1, sakura: 1, glow: 1, extraLayers: 1, opacity: 1 };
  const motionDurationScale = cadenceProfile.duration;
  const LEVEL_MAP = [
    { intensity: 0.00, particles: 0,  sakura: 0,  crimsonBoost: 0, edgeGlow: 0.0, extraLayers: 0 },
    { intensity: 0.55, particles: 6,  sakura: 10, crimsonBoost: 3, edgeGlow: 0.25, extraLayers: 0 },
    { intensity: 1.00, particles: 16, sakura: 24, crimsonBoost: 6, edgeGlow: 0.55, extraLayers: 1 },
    { intensity: 1.55, particles: 34, sakura: 48, crimsonBoost: 14, edgeGlow: 0.85, extraLayers: 2 },
    { intensity: 2.10, particles: 64, sakura: 88, crimsonBoost: 28, edgeGlow: 1.20, extraLayers: 3 },
  ];
  const lvl = LEVEL_MAP[level];
  const intensity = ((settings.gridIntensity ?? 100) / 100) * lvl.intensity * cadenceProfile.opacity;
  const particleBaseCount = Math.round(lvl.particles * cadenceProfile.particle);
  const sakuraCount = Math.round(lvl.sakura * cadenceProfile.sakura);
  const edgeGlow = lvl.edgeGlow * cadenceProfile.glow;
  const extraLayerCount = Math.round(lvl.extraLayers * cadenceProfile.extraLayers);
  const showParticles = particleBaseCount > 0;
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

  // Global edge glow — a giant vignette of the accent color that pulses around
  // the window edges. Scales with the effects level so it's invisible at 0,
  // subtle at Med, and unmistakable at Max. This is what makes higher levels
  // feel "alive" — the whole viewport gets rimmed with accent light.
  const edgeGlowLayer = edgeGlow > 0 ? (
    <motion.div
      key={`edge-${theme}-${level}`}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5]"
      initial={{ opacity: edgeGlow * 0.6 }}
      animate={{ opacity: [edgeGlow * 0.55, edgeGlow * 1.0, edgeGlow * 0.55] }}
      transition={{ duration: 4.5 * motionDurationScale, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        boxShadow: `inset 0 0 ${Math.round(60 + edgeGlow * 120)}px ${Math.round(20 + edgeGlow * 40)}px rgb(var(--accent) / ${(0.15 + edgeGlow * 0.25).toFixed(2)})`,
      }}
    />
  ) : null;

  // Extra floating layers (only at High/Max) — soft radial blobs of accent-2
  // that drift across the viewport. Cheap on GPU (just background-position
  // animation), heavy on vibe.
  const extraLayersEl = extraLayerCount > 0 ? (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[3]">
      {Array.from({ length: extraLayerCount }).map((_, i) => (
        <motion.div
          key={`blob-${i}`}
          className="absolute rounded-full visual-motion"
          style={{
            width: 500 + i * 120, height: 500 + i * 120,
            left: `${20 + i * 25}%`, top: `${10 + i * 30}%`,
            background: `radial-gradient(circle, rgb(var(--accent${i % 2 === 0 ? '' : '-2'}) / ${(0.10 + edgeGlow * 0.06).toFixed(2)}) 0%, transparent 65%)`,
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 60, -40, 0],
            y: [0, -30, 40, 0],
          }}
          transition={{ duration: (22 + i * 4) * motionDurationScale, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  ) : null;

  // Vaporwave Day — clouds + neon grid floor
  if (theme === 'synthwave-day') {
    return (
      <>
        {gameBgLayer}
        {extraLayersEl}
        <div aria-hidden data-visual-cadence={cadence} className="fx-cadence-layer pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ opacity: intensity }}>
          {level > 0 && <ThemeArtwork theme={theme} level={level} cadence={cadence} />}
          <div className="vapor-clouds" />
          <div className="vapor-floor" />
          {showParticles && <Particles count={particleBaseCount} theme={theme} />}
        </div>
        {edgeGlowLayer}
      </>
    );
  }
  // Synthwave — grid + horizon + accent glow
  if (theme === 'synthwave') {
    return (
      <>
        {gameBgLayer}
        {extraLayersEl}
        <div aria-hidden data-visual-cadence={cadence} className="fx-cadence-layer pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ opacity: intensity }}>
          {level > 0 && <ThemeArtwork theme={theme} level={level} cadence={cadence} />}
          <div className="synth-grid" />
          <div className="synth-horizon" />
          <div
            className="absolute -top-40 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgb(var(--accent)/0.45), transparent 60%)' }}
          />
          {showParticles && <Particles count={particleBaseCount} theme={theme} />}
        </div>
        {edgeGlowLayer}
      </>
    );
  }
  // All other themes get their own subtle ambient backdrop.
  // v1.2.8 — any theme (including future ones like Gaming/Modern that don't
  // have a dedicated ambClass) still gets particles + edge glow so the
  // effects slider is meaningful everywhere.
  // Special themes (Anime, Magical, Industrial) get amb-* backdrops PLUS extra
  // shooting-star and sparkle layers on top of the standard particle count.
  const ambClass = {
    midnight: 'amb-midnight',
    daybreak: 'amb-daybreak',
    ocean:    'amb-ocean',
    crimson:  'amb-crimson',
    anime:    'amb-anime',
    mint:     'amb-mint',
    gaming:   'amb-gaming',
    modern:   'amb-modern',
    home:     'amb-home',
    colorful: 'amb-colorful',
    pro:      'amb-pro',
    'generic-gray': 'amb-generic-gray',
    'generic-blue': 'amb-generic-blue',
  }[theme];
  const isSpecial = ['anime', 'colorful', 'pro'].includes(theme);
  const specialDecorationOpacity = Math.max(0, Math.min(100, Number(settings.specialDecorationOpacity ?? 46))) / 100;
  // Special themes bump particle count so they always feel "extra"
  const particleCount = isSpecial
    ? Math.max(particleBaseCount * 1.5, Math.round(12 * cadenceProfile.particle)) | 0
    : (theme === 'crimson' ? particleBaseCount + Math.round(lvl.crimsonBoost * cadenceProfile.particle) : particleBaseCount);
  return (
    <>
      {extraLayersEl}
      <div aria-hidden data-visual-cadence={cadence} className="fx-cadence-layer pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ opacity: intensity }}>
        {ambClass && <div className={ambClass} />}
        {level > 0 && <ThemeArtwork theme={theme} level={level} cadence={cadence} />}
        {isSpecial && level > 0 && specialDecorationOpacity > 0 && <SpecialThemeDecoration theme={theme} opacity={specialDecorationOpacity} />}
        {theme !== 'anime' && level > 0 && <ThemeIllustration theme={theme} level={level} />}
        {theme === 'anime' && sakuraCount > 0 && <Sakura count={sakuraCount} />}
        {/* Shooting stars — Magical only, only if effects level >= Low */}
        {theme === 'colorful' && level > 0 && (
          <div className="shooting-stars">
            {Array.from({ length: Math.max(2, level + 1) }).map((_, i) => (
              <span
                key={i}
                style={{
                  top: `${8 + i * 22}%`,
                  animationDelay: `${i * 1.6}s`,
                  animationDuration: `${5 + (i % 3)}s`,
                }}
              />
            ))}
          </div>
        )}
        {showParticles && <Particles count={particleCount} theme={theme} />}
      </div>
      {edgeGlowLayer}
    </>
  );
}

/**
 * Purpose-built raster atmosphere for themes that benefit from a calm, more
 * physical backdrop than lines and particles alone can provide. These stay
 * beneath every UI surface, never animate at Rest, and fade with the existing
 * FX level so readability remains the priority.
 */
function ThemeArtwork({ theme, level = 2, cadence = 'full' }) {
  const filename = {
    synthwave: 'synthwave-atmosphere.png',
    'synthwave-day': 'synthwave-day-atmosphere.png',
    midnight: 'midnight-atmosphere.png',
    daybreak: 'daybreak-atmosphere.png',
    mint: 'mint-atmosphere.png',
    ocean: 'ocean-atmosphere.png',
    crimson: 'crimson-atmosphere.png',
    anime: 'anime-atmosphere.png',
    gaming: 'gaming-atmosphere.png',
    modern: 'modern-atmosphere.png',
    colorful: 'colorful-atmosphere.png',
    pro: 'industrial-atmosphere.png',
    home: 'home-atmosphere.png',
    'generic-gray': 'generic-gray-atmosphere.png',
    'generic-blue': 'generic-blue-atmosphere.png',
  }[theme];
  if (!filename) return null;
  const motionClass = cadence === 'calm' ? '' : 'theme-artwork-drift';
  // The earlier treatment was too dim to read as actual art beneath glass
  // panels. This stays below every interaction layer, but is now deliberately
  // present at normal FX levels instead of behaving like a nearly invisible
  // colour wash.
  const opacity = Math.min(0.58, 0.22 + (level * 0.08));
  return (
    <div
      aria-hidden
      className={`theme-artwork theme-artwork-${theme} ${motionClass}`}
      style={{
        opacity,
        backgroundImage: `url(${import.meta.env.BASE_URL}theme-art/${filename})`,
      }}
    />
  );
}

// Small, theme-owned foreground flourishes for the three showpiece modes.
// They are decorative background actors only: no event listeners, no polling,
// and Rest Mode removes the whole ambient layer before they can render.
function SpecialThemeDecoration({ theme, opacity = 0.46 }) {
  const asset = {
    anime: 'anime-control-vine-v1.png',
    pro: 'industrial-control-machinery-v1.png',
    colorful: 'magical-control-runes-v1.png',
  }[theme];
  if (!asset) return null;
  // The atmosphere layer already respects FX level. Give the showpiece art a
  // slightly stronger presence than a normal particle so an ordinary 46%
  // player setting still reads as deliberate illustration rather than a faint
  // colour wash. At 0% the component is not mounted at all.
  return <div aria-hidden className={`special-theme-decoration special-decoration--${theme}`} style={{ opacity: Math.min(0.92, Math.max(0, opacity * 1.35)) }}><img src={`${import.meta.env.BASE_URL}theme-art/${asset}`} alt="" className="special-theme-decoration-art" /></div>;
}

function WorkspaceEmpty({ kind }) {
  const tools = kind === 'tools';
  return <section className="grid h-full place-items-center px-6 py-8" data-testid={`workspace-empty-${kind}`}>
    <div className="max-w-sm rounded-2xl border border-dashed border-[rgb(var(--border)/0.78)] bg-[rgb(var(--panel)/0.34)] px-7 py-8 text-center shadow-[0_20px_60px_-42px_rgba(0,0,0,.9)]">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[rgb(var(--accent-2))]">{tools ? 'Your tools' : 'Your library'}</p>
      <h1 className="mt-2 text-lg font-black text-ink">{tools ? 'Add programs first' : 'No game selected'}</h1>
      <p className="mt-2 text-xs leading-relaxed text-muted">{tools ? 'Add a program from the Tools menu. Your most recently used tool will appear here afterwards.' : 'Choose a game from the Library, or use Add to bring one into NEO-LIB.'}</p>
    </div>
  </section>;
}

/** Original, low-opacity vector motifs for each theme. They are decorative
 * rather than franchise artwork, so every theme gets a recognisable identity
 * while the library and selected game's own art remain the focus. */
function ThemeIllustration({ theme, level = 2 }) {
  const art = {
    synthwave: <><circle cx="1282" cy="262" r="144" /><path d="M1090 262h384M1116 308h332M1144 354h276M0 792l300-182 168 92 196-208 192 198 238-242 222 282" /></>,
    'synthwave-day': <><path d="M0 610c132-104 232-82 346 12 122-118 248-130 384-14 144-92 276-84 402 18 144-112 290-118 468-14" /><path d="M160 752c80-170 168-246 254-244M212 704c84-36 164-28 236 18M1394 754c-72-160-154-238-244-246M1170 722c70-44 150-52 230-12" /><circle cx="1246" cy="212" r="98" /></>,
    midnight: <><path d="M1250 110a144 144 0 1 0 122 214 132 132 0 1 1-122-214Z" /><path d="M122 672l162-106 128 76 146-170 112 160 162-92 118 132 148-182 148 182" /><path d="M408 184l26 52 56 8-41 39 10 56-51-28-50 28 10-56-42-39 57-8zM824 108l17 35 39 5-28 28 7 39-35-19-35 19 8-39-29-28 39-5z" /></>,
    daybreak: <><circle cx="1250" cy="326" r="126" /><path d="M1042 612V370h416v242M1100 612V432h300v180M0 710h810M890 710h710M1120 760h360" /><path d="M1034 370c64-138 170-204 316-204s252 66 316 204" /></>,
    ocean: <><path d="M1022 276c0-122 94-206 190-206s190 84 190 206c0 70-54 110-190 110s-190-40-190-110Z" /><path d="M1090 386c-36 98-22 166 28 244M1160 386c-20 128-8 220 42 306M1238 386c18 116 28 204-10 296M1308 386c38 96 44 178 10 246" /><path d="M0 690c142-86 278-86 420 0s280 86 426 0 290-86 454 0 230 86 300 0" /></>,
    crimson: <><path d="M1210 304c-92-148-246-36-156 84-138-16-150 168-10 158-70 126 110 190 166 66 58 124 238 60 168-66 140 10 128-174-10-158 90-120-64-232-156-84Z" /><path d="M1210 386c-62 36-76 98-46 156M1210 386c70 22 100 82 60 148M1210 386c4 76-28 126-82 156M1134 628c-36 90-106 128-194 152M1288 628c36 90 104 128 194 152" /><path d="M78 788l282-114 92 52 174-168 154 174 204-118 218 162 330-176" /></>,
    mint: <><path d="M244 770c32-232 126-384 286-466M276 620c-102-6-174-54-216-144 112-24 206 22 286 144M410 482c-30-98-2-178 84-242 48 94 18 176-84 242M1356 778c-26-216-114-366-270-450M1334 626c102-10 172-60 206-150-112-18-202 32-272 150M1194 494c28-102-4-180-94-240-44 96-12 176 94 240" /><path d="M440 764c160-102 540-102 712 0" /></>,
    gaming: <><path d="M72 696h1456M196 696V432h1208v264M344 432l100-160h712l100 160M588 696V540h424v156" /><path d="M682 504c0-74 58-132 130-132s130 58 130 132c0 84-76 136-130 170-54-34-130-86-130-170Z" /></>,
    modern: <><path d="M1042 736V240h154v496M1218 736V382h128v354M1370 736V172h170v564M92 736V454h244v282M362 736V292h196v444M590 736V510h176v226" /><path d="M54 146h526M54 190h404M1008 112h532M1170 764h370" /></>,
    colorful: <><path d="M1210 128l42 116 120 4-94 76 32 118-100-62-102 62 34-118-96-76 122-4z" /><path d="M144 716l192-120 178 110 190-220 192 212 194-130 170 150 178-106" /><circle cx="418" cy="214" r="64" /><circle cx="630" cy="330" r="28" /><circle cx="1468" cy="620" r="52" /></>,
    pro: <><path d="M1030 178h378l118 116v378l-118 116h-378l-118-116V294zM1110 258h218l78 78v294l-78 78h-218l-78-78V336z" /><path d="M0 704h900M0 750h900M100 704l72 46 72-46 72 46 72-46 72 46 72-46 72 46 72-46 72 46 72-46" /></>,
  }[theme];
  if (!art) return null;
  return (
    <div aria-hidden className={`theme-illustration theme-illustration--${theme}`} style={{ opacity: 0.13 + level * 0.055 }}>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="presentation">{art}</svg>
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

function Particles({ count = 10, theme = 'synthwave' }) {
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
    <div className={`particles particles--${theme}`}>
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


/* ---------- Background texture layer (v1.4.0, revised v1.6.4) ----------
   v1.6.4 — Moved OUT of the fixed viewport overlay. The full-window mix-blend
   overlay was muddying hero banners and preview screenshots on the right pane.
   Now rendered as a `background-image` layer INSIDE the sidebar only, where
   the user actually wanted the "not blank" look. Hero/preview area stays
   pristine. Exposed as a helper hook that returns inline style — Sidebar
   picks it up and applies it to its own background. */
export function useBgTextureStyle(textureId = 'none', opacity = 40) {
  return React.useMemo(() => {
    if (!textureId || textureId === 'none' || opacity <= 0) return null;
    const patterns = {
      grain: {
        backgroundImage:
          'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),' +
          'radial-gradient(rgba(0,0,0,0.35) 1px, transparent 1px)',
        backgroundSize: '3px 3px, 5px 5px',
        backgroundPosition: '0 0, 1px 1px',
      },
      grid: {
        backgroundImage:
          'linear-gradient(rgb(var(--accent) / 0.9) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgb(var(--accent-2) / 0.75) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      },
      diagonal: {
        backgroundImage:
          'repeating-linear-gradient(135deg, rgb(var(--accent) / 0.7) 0 1px, transparent 1px 14px)',
      },
      hex: {
        backgroundImage:
          'radial-gradient(circle at 25% 25%, rgb(var(--accent) / 0.9) 1.5px, transparent 2px),' +
          'radial-gradient(circle at 75% 75%, rgb(var(--accent-2) / 0.8) 1.5px, transparent 2px)',
        backgroundSize: '28px 28px',
      },
      dots: {
        backgroundImage: 'radial-gradient(rgb(var(--accent) / 0.85) 1.2px, transparent 2px)',
        backgroundSize: '18px 18px',
      },
      scanlines: { backgroundImage: 'repeating-linear-gradient(0deg, rgb(var(--accent) / 0.85) 0 1px, transparent 1px 6px)' },
      circuit: { backgroundImage: 'linear-gradient(rgb(var(--accent) / 0.7) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--accent) / 0.7) 1px, transparent 1px), radial-gradient(rgb(var(--accent-2) / 0.9) 1.5px, transparent 2.5px)', backgroundSize: '24px 24px, 24px 24px, 24px 24px', backgroundPosition: '0 0, 0 0, 12px 12px' },
      chevron: { backgroundImage: 'repeating-linear-gradient(45deg, rgb(var(--accent) / 0.8) 0 2px, transparent 2px 12px), repeating-linear-gradient(-45deg, rgb(var(--accent-2) / 0.7) 0 2px, transparent 2px 12px)' },
      weave: { backgroundImage: 'repeating-linear-gradient(0deg, rgb(var(--accent) / 0.42) 0 1px, transparent 1px 8px), repeating-linear-gradient(90deg, rgb(var(--accent-2) / 0.30) 0 1px, transparent 1px 8px)', backgroundSize: '16px 16px' },
      brushed: { backgroundImage: 'repeating-linear-gradient(105deg, rgb(var(--accent) / 0.30) 0 1px, transparent 1px 5px), repeating-linear-gradient(105deg, transparent 0 8px, rgb(var(--accent-2) / 0.18) 8px 9px, transparent 9px 17px)' },
      stardust: { backgroundImage: 'radial-gradient(circle at 20% 30%, rgb(var(--accent-2) / 0.7) 0 1px, transparent 1.8px), radial-gradient(circle at 75% 70%, rgb(var(--accent) / 0.6) 0 1.2px, transparent 2px)', backgroundSize: '34px 34px, 53px 53px' },
    };
    return { ...patterns[textureId], opacity: Math.max(0, Math.min(100, opacity)) / 100 };
  }, [textureId, opacity]);
}
function BgTexture() { return null; /* deprecated in v1.6.4 — see useBgTextureStyle */ }
