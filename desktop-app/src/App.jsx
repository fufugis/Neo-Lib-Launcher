import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar, { CategoryContextMenu } from './components/Sidebar';
import GameDetail from './components/GameDetail';
import SettingsModal from './components/SettingsModal';
import AddGameModal from './components/AddGameModal';
import WizardModal from './components/WizardModal';
import CategoryModal from './components/CategoryModal';
import PinModal from './components/PinModal';
import { uid, guessNameFromPath, hashPin } from './lib/utils';

const isElectron = typeof window !== 'undefined' && !!window.api;

/* --- Browser-preview demo data --- */
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
    screenshots: [], categoryIds: [],
  },
];
const DEMO_CATEGORIES = [
  { id: 'cat-fav', name: 'Favourites', colorId: 'orange', private: false },
  { id: 'cat-rpg', name: 'RPGs', colorId: 'cyan', private: false },
  { id: 'cat-secret', name: 'After hours', colorId: 'magenta', private: true, pinHash: hashPin('1234') },
];

export default function App() {
  const [library, setLibrary] = React.useState({ games: [], categories: [] });
  const [settings, setSettings] = React.useState({ theme: 'synthwave', firstRun: true, geminiKey: '' });
  const [selectedId, setSelectedId] = React.useState(null);
  const [activeCategoryId, setActiveCategoryId] = React.useState('__all__');
  const [unlockedCategories, setUnlockedCategories] = React.useState([]);
  const [search, setSearch] = React.useState('');

  const [showAdd, setShowAdd] = React.useState(false);
  const [showWizard, setShowWizard] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

  // Category modals
  const [catModal, setCatModal] = React.useState({ open: false, initial: null });
  const [catCtx, setCatCtx] = React.useState({ open: false, category: null, anchor: null });
  const [pinModal, setPinModal] = React.useState({ open: false, mode: 'unlock', category: null, error: '' });
  const [pinThen, setPinThen] = React.useState(null); // callback after PIN entered

  const [fetching, setFetching] = React.useState(false);
  const [updatingAll, setUpdatingAll] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  // --- Load --- //
  React.useEffect(() => {
    (async () => {
      if (isElectron) {
        const lib = await window.api.loadLibrary();
        const s = await window.api.loadSettings();
        const merged = {
          games: (lib.games || []).map((g) => ({ categoryIds: [], ...g })),
          categories: lib.categories || [],
        };
        setLibrary(merged);
        setSettings({ theme: 'synthwave', geminiKey: '', ...s });
        if (merged.games[0]) setSelectedId(merged.games[0].id);
      } else {
        setLibrary({ games: DEMO_GAMES, categories: DEMO_CATEGORIES });
        setSelectedId(DEMO_GAMES[0].id);
      }
    })();
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'synthwave');
  }, [settings.theme]);

  // --- Persistence --- //
  const persistLibrary = React.useCallback((next) => {
    setLibrary(next);
    if (isElectron) window.api.saveLibrary(next);
  }, []);
  const persistSettings = React.useCallback((next) => {
    setSettings(next);
    if (isElectron) window.api.saveSettings(next);
  }, []);

  // --- Notifications --- //
  const notify = (msg) => {
    setToast(msg);
    clearTimeout(notify._t);
    notify._t = setTimeout(() => setToast(null), 2500);
  };

  // --- Game ops --- //
  const addGame = (data) => {
    const g = { id: uid(), categoryIds: [], ...data };
    persistLibrary({ ...library, games: [g, ...library.games] });
    setSelectedId(g.id);
    setShowAdd(false);
    notify(`Added ${g.name}`);
  };
  const importMany = (entries) => {
    if (!entries.length) return;
    const newOnes = entries.map((e) => ({ id: uid(), categoryIds: [], ...e }));
    persistLibrary({ ...library, games: [...newOnes, ...library.games] });
    setSelectedId(newOnes[0].id);
    notify(`Imported ${newOnes.length} game${newOnes.length !== 1 ? 's' : ''}`);
  };
  const updateGame = (id, patch) => {
    persistLibrary({
      ...library,
      games: library.games.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    });
  };
  const removeGame = (id) => {
    const next = { ...library, games: library.games.filter((g) => g.id !== id) };
    persistLibrary(next);
    if (selectedId === id) setSelectedId(next.games[0]?.id || null);
    notify('Game removed');
  };
  const moveGame = (id, dir) => {
    const list = [...library.games];
    const i = list.findIndex((g) => g.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    persistLibrary({ ...library, games: list });
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

  // --- Multi-source metadata --- //
  const refetchGame = async (g, opts = {}) => {
    if (!isElectron) {
      notify('Re-fetch works only in the installed app.');
      return null;
    }
    setFetching(true);
    const query = opts.query || g.name || guessNameFromPath(g.exePath);
    const skip = [];
    // If user said "got it wrong", make it skip the current source (so it tries differently)
    if (opts.skipCurrentSource && g.source) skip.push(g.source);

    const result = await window.api.fetchMetadata({
      query,
      skipSources: skip,
      geminiKey: settings.geminiKey || '',
    });
    if (!result) {
      setFetching(false);
      notify('No metadata found anywhere online.');
      return null;
    }
    // Cache cover if it's an external URL
    let coverUrl = result.capsuleImage || result.headerImage || null;
    if (coverUrl && coverUrl.startsWith('http')) {
      coverUrl = (await window.api.cacheImage(coverUrl, result.name)) || coverUrl;
    }
    const patch = {
      name: result.name || g.name,
      appid: result.appid || g.appid,
      source: result.source,
      coverUrl: coverUrl || g.coverUrl,
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
    };
    updateGame(g.id, patch);
    setFetching(false);
    notify(`Updated · ${patch.name} (via ${result.source})`);
    return patch;
  };

  const refetchAll = async () => {
    if (library.games.length === 0) return;
    setUpdatingAll(true);
    for (const g of library.games) await refetchGame(g);
    setUpdatingAll(false);
    notify('All games refreshed.');
  };

  // --- Categories --- //
  const createCategory = (data) => {
    const c = { id: uid(), private: false, ...data };
    persistLibrary({ ...library, categories: [...library.categories, c] });
    setCatModal({ open: false, initial: null });
    notify(`Category "${c.name}" created`);
  };
  const updateCategory = (id, patch) => {
    persistLibrary({
      ...library,
      categories: library.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };
  const deleteCategory = (id) => {
    persistLibrary({
      ...library,
      categories: library.categories.filter((c) => c.id !== id),
      games: library.games.map((g) => ({
        ...g,
        categoryIds: (g.categoryIds || []).filter((cid) => cid !== id),
      })),
    });
    if (activeCategoryId === id) setActiveCategoryId('__all__');
    notify('Category deleted');
  };
  const moveCategory = (id, dir) => {
    const list = [...library.categories];
    const i = list.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    persistLibrary({ ...library, categories: list });
  };

  const toggleGameInCategory = (game, categoryId) => {
    const has = (game.categoryIds || []).includes(categoryId);
    const next = has
      ? (game.categoryIds || []).filter((c) => c !== categoryId)
      : [...(game.categoryIds || []), categoryId];
    updateGame(game.id, { categoryIds: next });
  };

  // Drag from sidebar onto a category chip — add (don't remove other categories)
  const assignGameToCategory = (gameId, categoryId) => {
    const g = library.games.find((x) => x.id === gameId);
    if (!g) return;
    if (!(g.categoryIds || []).includes(categoryId)) {
      updateGame(gameId, { categoryIds: [...(g.categoryIds || []), categoryId] });
      notify(`Added "${g.name}" → ${library.categories.find((c) => c.id === categoryId)?.name}`);
    }
  };

  // --- Ghost / PIN flow --- //
  const requestUnlock = (category) => {
    setPinThen(() => (pin) => {
      if (hashPin(pin) === category.pinHash) {
        setUnlockedCategories((u) => [...new Set([...u, category.id])]);
        setActiveCategoryId(category.id);
        setPinModal({ open: false, mode: 'unlock', category: null, error: '' });
      } else {
        setPinModal((p) => ({ ...p, error: 'Wrong PIN.' }));
      }
    });
    setPinModal({ open: true, mode: 'unlock', category, error: '' });
  };

  const handleCategoryAction = (action) => {
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
        if (confirm(`Delete "${c.name}"? Games stay in your library.`)) deleteCategory(c.id);
      }
    } else if (action === 'up') {
      moveCategory(c.id, -1);
    } else if (action === 'down') {
      moveCategory(c.id, 1);
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

  // --- Game right-click actions --- //
  const handleGameContext = async (action, g) => {
    if (action === 'remove') return removeGame(g.id);
    if (action === 'reveal') {
      if (isElectron) window.api.revealInFolder(g.exePath);
      else notify(`Open: ${g.exePath}`);
      return;
    }
    if (action === 'refetch') {
      await refetchGame(g, { skipCurrentSource: true });
      return;
    }
    if (action === 'rename') {
      const name = prompt('New name:', g.name);
      if (name) updateGame(g.id, { name });
      return;
    }
    if (action === 'args') {
      const args = prompt('Launch arguments (passed to the exe):', g.launchArgs || '');
      if (args !== null) updateGame(g.id, { launchArgs: args });
      return;
    }
    if (action === 'details') {
      const cover = prompt('Cover image URL (leave empty to keep current):', g.coverUrl || '');
      if (cover !== null) updateGame(g.id, { coverUrl: cover || g.coverUrl });
      return;
    }
    if (action === 'manage-categories') {
      // Quick: open category modal preset to add a new one if none exist, else select first
      setCatModal({ open: true, initial: null });
      return;
    }
  };

  const selected = library.games.find((g) => g.id === selectedId) || null;

  return (
    <div className="relative flex h-screen w-screen flex-col bg-surface text-ink">
      {/* Background ambience for synthwave */}
      <BgAmbience theme={settings.theme} />

      <TitleBar search={search} setSearch={setSearch} />

      <div className="relative z-10 flex min-h-0 flex-1">
        <Sidebar
          games={library.games}
          categories={library.categories}
          activeCategoryId={activeCategoryId}
          unlockedCategories={unlockedCategories}
          search={search}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onSelectCategory={setActiveCategoryId}
          onAddManual={() => setShowAdd(true)}
          onOpenWizard={() => setShowWizard(true)}
          onOpenSettings={() => setShowSettings(true)}
          onUpdateAll={refetchAll}
          onCreateCategory={() => setCatModal({ open: true, initial: null })}
          onCategoryContext={(category, anchor) => setCatCtx({ open: true, category, anchor })}
          onGameContext={handleGameContext}
          onMoveGame={moveGame}
          onAssignGameToCategory={assignGameToCategory}
          onUnlockCategory={requestUnlock}
          updatingAll={updatingAll}
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          <AnimatePresence mode="wait">
            <GameDetail
              key={selected?.id || 'empty'}
              game={selected}
              categories={library.categories.filter((c) => !c.private || unlockedCategories.includes(c.id))}
              fetching={fetching}
              onLaunch={launchGame}
              onRefetch={(g) => refetchGame(g, { skipCurrentSource: true })}
              onRevealFolder={(g) => (isElectron ? window.api.revealInFolder(g.exePath) : notify('Open: ' + g.exePath))}
              onToggleCategory={toggleGameInCategory}
            />
          </AnimatePresence>
        </main>
      </div>

      {/* Modals */}
      <AddGameModal open={showAdd} onClose={() => setShowAdd(false)} onCreate={addGame} />
      <WizardModal open={showWizard} onClose={() => setShowWizard(false)} onImport={importMany} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} settings={settings} setSettings={persistSettings} />
      <CategoryModal
        open={catModal.open}
        initial={catModal.initial}
        onClose={() => setCatModal({ open: false, initial: null })}
        onSubmit={(data) => {
          if (catModal.initial) {
            updateCategory(catModal.initial.id, data);
            setCatModal({ open: false, initial: null });
          } else {
            createCategory(data);
          }
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

      {/* Category context menu */}
      <CategoryContextMenu
        open={catCtx.open}
        anchor={catCtx.anchor}
        category={catCtx.category}
        onClose={() => setCatCtx({ open: false, category: null, anchor: null })}
        onAction={handleCategoryAction}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
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

/* Subtle animated synthwave background visible behind low-contrast surfaces */
function BgAmbience({ theme }) {
  if (theme !== 'synthwave') return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="synth-grid" />
      <div className="synth-horizon" />
      <div
        className="absolute -top-40 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgb(var(--accent)/0.45), transparent 60%)',
        }}
      />
    </div>
  );
}
