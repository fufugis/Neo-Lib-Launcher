import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import GameDetail from './components/GameDetail';
import SettingsModal from './components/SettingsModal';
import AddGameModal from './components/AddGameModal';
import WizardModal from './components/WizardModal';
import { uid, guessNameFromPath } from './lib/utils';

const isElectron = typeof window !== 'undefined' && !!window.api;

// --- Demo data shown when running in plain browser preview (no Electron) --- //
const DEMO_GAMES = [
  {
    id: 'demo-1',
    name: 'Hollow Knight',
    appid: 367520,
    exePath: 'C:\\Games\\Hollow Knight\\hollow_knight.exe',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg',
    headerImage: 'https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg',
    background: 'https://cdn.akamai.steamstatic.com/steam/apps/367520/page_bg_generated_v6b.jpg',
    shortDescription:
      'Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom of insects and heroes.',
    about:
      'Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom of insects and heroes. Explore twisting caverns, ancient cities and deadly wastes; battle tainted creatures and befriend bizarre bugs; and solve ancient mysteries at the kingdom’s heart.',
    genres: ['Action', 'Adventure', 'Indie', 'Metroidvania'],
    developers: ['Team Cherry'],
    publishers: ['Team Cherry'],
    releaseDate: '24 Feb, 2017',
    metacritic: 90,
    website: 'https://hollowknight.com',
    screenshots: [
      'https://cdn.akamai.steamstatic.com/steam/apps/367520/ss_d6033e77098b80fb1e0b06d8eed8b3a8e4ff6da2.1920x1080.jpg',
      'https://cdn.akamai.steamstatic.com/steam/apps/367520/ss_b3a26b1d75bdc2cdbb98b13c1ab8ee4c1cce6e60.1920x1080.jpg',
    ],
  },
  {
    id: 'demo-2',
    name: 'Hades',
    appid: 1145360,
    exePath: 'C:\\Games\\Hades\\Hades.exe',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1145360/header.jpg',
    headerImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1145360/header.jpg',
    background: 'https://cdn.akamai.steamstatic.com/steam/apps/1145360/page_bg_generated_v6b.jpg',
    shortDescription:
      'Defy the god of the dead as you hack and slash out of the Underworld in this rogue-like dungeon crawler.',
    genres: ['Action', 'Indie', 'Rogue-like', 'Hack and Slash'],
    developers: ['Supergiant Games'],
    publishers: ['Supergiant Games'],
    releaseDate: '17 Sep, 2020',
    metacritic: 93,
    website: 'https://supergiantgames.com/games/hades',
    screenshots: [],
  },
];

export default function App() {
  const [library, setLibrary] = React.useState({ games: [] });
  const [settings, setSettings] = React.useState({ theme: 'midnight', firstRun: true });
  const [selectedId, setSelectedId] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [showAdd, setShowAdd] = React.useState(false);
  const [showWizard, setShowWizard] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [fetching, setFetching] = React.useState(false);
  const [updatingAll, setUpdatingAll] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  // --- Load on mount --- //
  React.useEffect(() => {
    (async () => {
      if (isElectron) {
        const lib = await window.api.loadLibrary();
        const s = await window.api.loadSettings();
        setLibrary(lib);
        setSettings(s);
        if (lib.games?.[0]) setSelectedId(lib.games[0].id);
      } else {
        // Browser preview mode
        setLibrary({ games: DEMO_GAMES });
        setSelectedId(DEMO_GAMES[0].id);
      }
    })();
  }, []);

  // --- Apply theme on document --- //
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'midnight');
  }, [settings.theme]);

  // --- Persistence --- //
  const persistLibrary = React.useCallback(
    (next) => {
      setLibrary(next);
      if (isElectron) window.api.saveLibrary(next);
    },
    []
  );
  const persistSettings = React.useCallback((next) => {
    setSettings(next);
    if (isElectron) window.api.saveSettings(next);
  }, []);

  // --- Game ops --- //
  const addGame = (data) => {
    const g = { id: uid(), ...data };
    const next = { ...library, games: [g, ...library.games] };
    persistLibrary(next);
    setSelectedId(g.id);
    setShowAdd(false);
    notify(`Added ${g.name}`);
  };
  const importMany = (entries) => {
    if (!entries.length) return;
    const newOnes = entries.map((e) => ({ id: uid(), ...e }));
    const next = { ...library, games: [...newOnes, ...library.games] };
    persistLibrary(next);
    setSelectedId(newOnes[0].id);
    notify(`Imported ${newOnes.length} game${newOnes.length !== 1 ? 's' : ''}`);
  };
  const updateGame = (id, patch) => {
    const next = {
      ...library,
      games: library.games.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    };
    persistLibrary(next);
  };
  const removeGame = (id) => {
    const next = { ...library, games: library.games.filter((g) => g.id !== id) };
    persistLibrary(next);
    if (selectedId === id) setSelectedId(next.games[0]?.id || null);
    notify('Game removed');
  };

  const launchGame = async (g) => {
    if (!isElectron) {
      notify(`Would launch: ${g.exePath}`);
      return;
    }
    const res = await window.api.launchGame(g.exePath);
    if (!res.ok) notify('Launch failed: ' + (res.error || ''));
    else notify(`Launching ${g.name}…`);
  };

  // --- Re-fetch metadata online (Steam) --- //
  const refetchGame = async (g, opts = {}) => {
    if (!isElectron) {
      notify('Re-fetch is only available in the installed app.');
      return null;
    }
    setFetching(true);
    const query = opts.query || g.name || guessNameFromPath(g.exePath);
    const results = await window.api.searchSteam(query);
    if (!results || results.length === 0) {
      setFetching(false);
      notify('No matches found online.');
      return null;
    }
    // Prefer a different appid if this is a "try again" (got it wrong)
    let pick = results[0];
    if (opts.skipAppid && results.length > 1) {
      pick = results.find((r) => r.appid !== opts.skipAppid) || results[0];
    }
    const details = await window.api.steamDetails(pick.appid);
    let coverUrl = null;
    if (details) coverUrl = await window.api.cacheImage(details.capsuleImage || details.headerImage, details.name);
    const patch = {
      name: details?.name || g.name,
      appid: pick.appid,
      coverUrl: coverUrl || details?.headerImage || g.coverUrl,
      headerImage: details?.headerImage,
      background: details?.background,
      shortDescription: details?.shortDescription,
      about: details?.aboutTheGame,
      genres: details?.genres || [],
      developers: details?.developers || [],
      publishers: details?.publishers || [],
      releaseDate: details?.releaseDate || g.releaseDate || '',
      metacritic: details?.metacritic,
      screenshots: details?.screenshots || [],
      website: details?.website || g.website || '',
    };
    updateGame(g.id, patch);
    setFetching(false);
    notify(`Updated info for ${patch.name}`);
    return patch;
  };

  const refetchAll = async () => {
    if (library.games.length === 0) return;
    setUpdatingAll(true);
    for (const g of library.games) {
      await refetchGame(g);
    }
    setUpdatingAll(false);
    notify('All games refreshed.');
  };

  // --- Context-menu actions on a row --- //
  const handleContext = async (action, g) => {
    if (action === 'remove') return removeGame(g.id);
    if (action === 'reveal') {
      if (isElectron) window.api.revealInFolder(g.exePath);
      else notify(`Would reveal: ${g.exePath}`);
      return;
    }
    if (action === 'refetch') {
      // Re-search and skip currently-assigned appid so AI/search "tries differently"
      await refetchGame(g, { skipAppid: g.appid });
      return;
    }
    if (action === 'edit') {
      const name = prompt('New name:', g.name);
      if (name) updateGame(g.id, { name });
    }
  };

  const notify = (msg) => {
    setToast(msg);
    clearTimeout(notify._t);
    notify._t = setTimeout(() => setToast(null), 2500);
  };

  const selected = library.games.find((g) => g.id === selectedId) || null;

  return (
    <div className="flex h-screen w-screen flex-col bg-surface text-ink">
      <TitleBar search={search} setSearch={setSearch} />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          games={library.games}
          search={search}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAddManual={() => setShowAdd(true)}
          onOpenWizard={() => setShowWizard(true)}
          onOpenSettings={() => setShowSettings(true)}
          onUpdateAll={refetchAll}
          onContextAction={handleContext}
          updatingAll={updatingAll}
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          <AnimatePresence mode="wait">
            <GameDetail
              key={selected?.id || 'empty'}
              game={selected}
              fetching={fetching}
              onLaunch={launchGame}
              onRefetch={(g) => refetchGame(g, { skipAppid: g.appid })}
              onRevealFolder={(g) => (isElectron ? window.api.revealInFolder(g.exePath) : notify('Open: ' + g.exePath))}
            />
          </AnimatePresence>
        </main>
      </div>

      <AddGameModal open={showAdd} onClose={() => setShowAdd(false)} onCreate={addGame} />
      <WizardModal open={showWizard} onClose={() => setShowWizard(false)} onImport={importMany} />
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        setSettings={persistSettings}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            data-testid="toast"
            className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full hairline glass px-4 py-2 text-xs"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
