import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar, { CategoryContextMenu } from './components/Sidebar';
import GameDetail from './components/GameDetail';
import ShowcaseStrip from './components/ShowcaseStrip';
import SettingsModal from './components/SettingsModal';
import AddGameModal from './components/AddGameModal';
import WizardModal from './components/WizardModal';
import CategoryModal from './components/CategoryModal';
import PinModal from './components/PinModal';
import { uid, guessNameFromPath, hashPin } from './lib/utils';

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
        });
        setSettings((prev) => ({ ...prev, ...s }));
        if (lib.games?.[0]) setSelectedId(lib.games[0].id);

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
        });
        setSelectedId(DEMO_GAMES[0].id);
      }
    })();
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'synthwave');
  }, [settings.theme]);

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
  const updateSetting = (patch) => persistSettings({ ...settings, ...patch });

  const notify = (msg) => {
    setToast(msg);
    clearTimeout(notify._t);
    notify._t = setTimeout(() => setToast(null), 2500);
  };

  /* --- Helpers --- */
  const ensureOrder = (catId, gameIds) => {
    const order = library.gameOrderByCategory[catId] || [];
    const set = new Set(order);
    return [...order, ...gameIds.filter((id) => !set.has(id))];
  };

  /* --- Games --- */
  const addGame = (data) => {
    const g = { id: uid(), categoryIds: [], addedAt: Date.now(), ...data };
    setLibrary((prev) => ({ ...prev, games: [g, ...prev.games] }));
    setSelectedId(g.id);
    setShowAdd(false);
    notify(`Added ${g.name}`);
  };
  const importMany = (entries) => {
    if (!entries.length) return;
    const newOnes = entries.map((e) => ({ id: uid(), categoryIds: [], addedAt: Date.now(), ...e }));
    setLibrary((prev) => ({ ...prev, games: [...newOnes, ...prev.games] }));
    setSelectedId(newOnes[0].id);
    notify(`Imported ${newOnes.length} game${newOnes.length !== 1 ? 's' : ''}`);
  };
  const updateGame = (id, patch) => {
    setLibrary((prev) => ({
      ...prev,
      games: prev.games.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  };
  const removeGame = (id) => {
    setLibrary((prev) => {
      const order = { ...prev.gameOrderByCategory };
      for (const k of Object.keys(order)) order[k] = order[k].filter((x) => x !== id);
      return {
        ...prev,
        games: prev.games.filter((g) => g.id !== id),
        gameOrderByCategory: order,
      };
    });
    if (selectedId === id) setSelectedId(null);
    notify('Game removed');
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
  const refetchGame = async (g, opts = {}) => {
    if (!isElectron) { notify('Re-fetch only works in the installed app.'); return null; }
    setFetching(true);
    const query = opts.query || g.name || guessNameFromPath(g.exePath);
    const skip = [];
    if (opts.skipCurrentSource && g.source) skip.push(g.source);
    const result = await window.api.fetchMetadata({ query, skipSources: skip, geminiKey: settings.geminiKey || '' });
    if (!result) {
      setFetching(false);
      notify('No metadata found anywhere online.');
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

  const refetchAll = async () => {
    if (library.games.length === 0) return;
    setUpdatingAll(true);
    for (const g of library.games) await refetchGame(g);
    setUpdatingAll(false);
    notify('All games refreshed.');
  };

  /* --- Categories --- */
  const createCategory = (data) => {
    const c = { id: uid(), private: false, ...data };
    setLibrary((prev) => ({ ...prev, categories: [...prev.categories, c] }));
    setCatModal({ open: false, initial: null });
    notify(`Category "${c.name}" created`);
  };
  const updateCategory = (id, patch) => {
    setLibrary((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };
  const deleteCategory = (id) => {
    setLibrary((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
      games: prev.games.map((g) => ({ ...g, categoryIds: (g.categoryIds || []).filter((x) => x !== id) })),
      gameOrderByCategory: Object.fromEntries(
        Object.entries(prev.gameOrderByCategory).filter(([k]) => k !== id)
      ),
    }));
    notify('Category deleted');
  };

  // Drop one category before another (in `categories` array order)
  const reorderCategory = (fromId, beforeId) => {
    setLibrary((prev) => {
      const list = [...prev.categories];
      const from = list.findIndex((c) => c.id === fromId);
      const to = list.findIndex((c) => c.id === beforeId);
      if (from < 0 || to < 0 || from === to) return prev;
      const [item] = list.splice(from, 1);
      const insertAt = list.findIndex((c) => c.id === beforeId);
      list.splice(insertAt, 0, item);
      return { ...prev, categories: list };
    });
  };

  /* --- Game ↔ category drag/drop --- */
  // fromCatId / toCatId may be null (uncategorized).
  const moveGameToCategory = (gameId, fromCatId, toCatId, opts = {}) => {
    const { copy = false, beforeGameId } = opts;
    setLibrary((prev) => {
      const games = prev.games.map((g) => {
        if (g.id !== gameId) return g;
        const ids = new Set(g.categoryIds || []);
        if (!copy && fromCatId) ids.delete(fromCatId);
        if (toCatId) ids.add(toCatId);
        return { ...g, categoryIds: Array.from(ids) };
      });
      // Adjust order for target
      const order = { ...prev.gameOrderByCategory };
      const targetKey = toCatId || '__uncat__';
      const list = (order[targetKey] || []).filter((x) => x !== gameId);
      if (beforeGameId) {
        const i = list.indexOf(beforeGameId);
        list.splice(i < 0 ? list.length : i, 0, gameId);
      } else {
        list.push(gameId);
      }
      order[targetKey] = list;
      // Also remove from source category order if moving
      if (!copy && fromCatId) {
        order[fromCatId] = (order[fromCatId] || []).filter((x) => x !== gameId);
      }
      return { ...prev, games, gameOrderByCategory: order };
    });
  };

  const reorderGameInCategory = (catId, fromId, beforeId) => {
    setLibrary((prev) => {
      const key = catId;
      const order = { ...prev.gameOrderByCategory };
      const ids = (order[key] || []).slice();
      const i = ids.indexOf(fromId);
      if (i < 0) ids.push(fromId);
      else ids.splice(i, 1);
      const j = ids.indexOf(beforeId);
      ids.splice(j < 0 ? ids.length : j, 0, fromId);
      order[key] = ids;
      return { ...prev, gameOrderByCategory: order };
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
    } else if (action === 'up' || action === 'down') {
      setLibrary((prev) => {
        const list = [...prev.categories];
        const i = list.findIndex((x) => x.id === c.id);
        const j = i + (action === 'up' ? -1 : 1);
        if (i < 0 || j < 0 || j >= list.length) return prev;
        [list[i], list[j]] = [list[j], list[i]];
        return { ...prev, categories: list };
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

  /* --- Game right-click actions --- */
  const handleGameContext = async (action, g) => {
    if (action === 'remove') return removeGame(g.id);
    if (action === 'reveal') {
      if (isElectron) window.api.revealInFolder(g.exePath);
      else notify('Open: ' + g.exePath);
      return;
    }
    if (action === 'open-dir') {
      if (isElectron) window.api.openContainingDir(g.exePath);
      else notify('Open dir: ' + g.exePath);
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
      if (cover) updateGame(g.id, { coverUrl: cover });
      return;
    }
    if (action === 'manage-categories') {
      setCatModal({ open: true, initial: null });
      return;
    }
  };

  /* --- Collapsed state --- */
  const toggleCollapsed = (id) =>
    updateSetting({ collapsed: { ...settings.collapsed, [id]: !settings.collapsed[id] } });

  const visibleGames = library.games; // sidebar handles filter; showcase considers all visible games
  const selected = library.games.find((g) => g.id === selectedId) || null;

  return (
    <div className="relative flex h-screen w-screen flex-col bg-surface text-ink">
      <BgAmbience theme={settings.theme} />
      <TitleBar search={search} setSearch={setSearch} />

      <div className="relative z-10 flex min-h-0 flex-1">
        <Sidebar
          games={library.games}
          categories={library.categories}
          gameOrderByCategory={library.gameOrderByCategory}
          collapsed={settings.collapsed || {}}
          unlockedCategories={unlockedCategories}
          search={search}
          selectedId={selectedId}
          librarySize={settings.librarySize || 'medium'}
          onSelect={setSelectedId}
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
                categories={library.categories.filter((c) => !c.private || unlockedCategories.includes(c.id))}
                fetching={fetching}
                onLaunch={launchGame}
                onRefetch={(g) => refetchGame(g, { skipCurrentSource: true })}
                onRevealFolder={(g) => (isElectron ? window.api.revealInFolder(g.exePath) : notify('Open: ' + g.exePath))}
                onToggleCategory={toggleGameInCategory}
              />
            </AnimatePresence>
          </div>

          {/* Showcase strip below preview */}
          <ShowcaseStrip
            games={visibleGames}
            mode={settings.showcaseMode || 'recent_added'}
            setMode={(m) => updateSetting({ showcaseMode: m })}
            onSelect={setSelectedId}
            selectedId={selectedId}
          />
        </main>
      </div>

      {/* Modals */}
      <AddGameModal open={showAdd} onClose={() => setShowAdd(false)} onCreate={addGame} />
      <WizardModal
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onImport={importMany}
        onAddManual={() => setShowAdd(true)}
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

function BgAmbience({ theme }) {
  if (theme !== 'synthwave') return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="synth-grid" />
      <div className="synth-horizon" />
      <div
        className="absolute -top-40 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgb(var(--accent)/0.45), transparent 60%)' }}
      />
    </div>
  );
}
