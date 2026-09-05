import React from 'react';
import { motion } from 'framer-motion';
import { Archive, CalendarDays, ChevronLeft, ChevronRight, Clock3, Download, EyeOff, ExternalLink, FolderOpen, Gamepad2, GripVertical, HardDrive, LockKeyhole, Newspaper, RefreshCw, ShieldCheck, Sparkles, Star, Trophy, X } from 'lucide-react';
import UpdateHistoryModal from './UpdateHistoryModal';

const RANGES = { today: { label: 'Today', days: 1 }, week: { label: 'This week', days: 7 }, month: { label: 'This month', days: 31 } };
const PLATFORM = { steam: 'Steam', epic: 'Epic', gog: 'GOG', ea: 'EA app', ubisoft: 'Ubisoft', battlenet: 'Battle.net', riot: 'Riot', xbox: 'Xbox / Game Pass', rockstar: 'Rockstar', itch: 'itch.io', private: 'Protected', local: 'Local' };
const HOME_SEGMENTS = [
  { id: 'play', label: 'Play & history', hint: 'Your sessions, favourites, ratings, and next adventure.', icon: Gamepad2, panes: ['play-next', 'recent', 'best-games', 'chronicle'] },
  { id: 'updates', label: 'News & updates', hint: 'Available game updates and what just released.', icon: Download, panes: ['updates', 'released-week'] },
  { id: 'system', label: 'Library & PC care', hint: 'Library health, storage, and the things worth checking.', icon: HardDrive, panes: ['health', 'storage'] },
];
const HOME_PANES = [
  ['news', 'News'], ['play-next', 'What should I play?'], ['updates', 'Game Updates'],
  ['health', 'Library Health'], ['best-games', 'My Best Games'], ['released-week', 'Released This Week'], ['storage', 'Storage Control'], ['chronicle', 'Gaming Chronicle'], ['recent', 'Recently active'],
];
const FIXED_HOME_PANES = [['top-played', 'Top 5 played']];
const homePaneLabel = (id) => [...FIXED_HOME_PANES, ...HOME_PANES].find(([known]) => known === id)?.[1] || 'pane';
// These pairs deliberately save vertical space while keeping their contents
// readable: the dashboard becomes one column again automatically on compact
// windows. All items remain individual panes, so they keep the existing
// drag/reorder and hide/show behavior instead of becoming inseparable cards.
const HALF_WIDTH_HOME_PANES = new Set(['play-next', 'recent', 'best-games', 'chronicle', 'health', 'storage']);
// Home can unmount while a game is previewed. Keep a completed, local session
// scan so Storage Control does not look empty when the player comes back.
let STORAGE_SESSION_CACHE = { loading: false, scannedAt: 0, results: [], skipped: [] };

function platformOf(game) {
  // Launcher ownership is deliberately separate from metadata provenance. A
  // standalone/repack game may have Steam artwork or an appid without being
  // owned or launched through Steam, so never infer its platform from those.
  const launcher = (game?.launcher || '').toLowerCase();
  if (PLATFORM[launcher]) return launcher;
  if (/itch\.io/i.test(game?.website || '')) return 'itch';
  return 'local';
}
function hours(minutes) { const value = Number(minutes || 0) / 60; return value ? `${value < 10 ? value.toFixed(1) : Math.round(value)}h` : '—'; }
function relative(ms) { if (!ms) return 'Never'; const days = Math.floor((Date.now() - ms) / 86400000); return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : days < 7 ? `${days}d ago` : days < 31 ? `${Math.floor(days / 7)}w ago` : `${Math.floor(days / 30)}mo ago`; }
function added(ms) { return ms ? new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ms)) : '—'; }

const EMPTY_GAME_UPDATES = { loading: false, items: [], needsSetup: [], ledger: [], checked: 0, launcherManagedCount: 0, scannedAt: 0, error: '' };
function normaliseGameUpdates(value) {
  if (!value || typeof value !== 'object') return EMPTY_GAME_UPDATES;
  return {
    ...EMPTY_GAME_UPDATES,
    items: Array.isArray(value.items) ? value.items : [],
    needsSetup: Array.isArray(value.needsSetup) ? value.needsSetup : [],
    ledger: Array.isArray(value.ledger) ? value.ledger : [],
    checked: Number(value.checked || 0),
    launcherManagedCount: Number(value.launcherManagedCount || 0),
    scannedAt: Number(value.scannedAt || 0),
    error: value.error || '',
  };
}

function maskHomeNews(item, lockedGameCategories) {
  const category = lockedGameCategories?.[item?.gameId];
  return category ? { ...item, gameName: 'Locked game', title: 'Update from protected game', snippet: 'Unlock its category in Library to view the details.', appid: null, url: '', homeLocked: true, lockedCategoryName: category } : item;
}
function maskHomeUpdate(item, lockedGameCategories) {
  const category = lockedGameCategories?.[item?.id];
  return category ? { ...item, name: 'Locked game', platform: 'private', currentVersion: 'Protected', latestVersion: 'Protected', missing: 'Protected until unlock', sourceKind: 'private', homeLocked: true, lockedCategoryName: category } : item;
}
function maskHomeUpdates(value, lockedGameCategories) {
  const updates = normaliseGameUpdates(value);
  return {
    ...updates,
    items: updates.items.map((item) => maskHomeUpdate(item, lockedGameCategories)),
    needsSetup: updates.needsSetup.map((item) => maskHomeUpdate(item, lockedGameCategories)),
  };
}

export default function HomeHub({ games = [], lockedGameCategories = {}, hasPrivateCategories = false, hasLockedPrivateCategories = false, onPanicLock, onSelect, onOpenPlaytimeImport, onOpenTidyUp, resting = false, homeLayout = {}, onUpdateHomeLayout, updatesCache, onUpdateUpdatesCache }) {
  const [range, setRange] = React.useState('week');
  const [rankingScope, setRankingScope] = React.useState('period');
  const [news, setNews] = React.useState({ loading: false, items: [] });
  const [storage, setStorage] = React.useState(() => STORAGE_SESSION_CACHE);
  const [weeklyReleases, setWeeklyReleases] = React.useState({ loading: false, items: [], criteria: '', tier: 'major', fetchedAt: 0, error: '' });
  // Home unmounts while the user opens a game. Start from App's local cache so
  // the update pane does not look empty on return; only a completed scan may
  // replace this list.
  const [gameUpdates, setGameUpdates] = React.useState(() => normaliseGameUpdates(updatesCache));
  const [newsDetail, setNewsDetail] = React.useState(null);
  const [draggedPane, setDraggedPane] = React.useState(null);
  const [draggedPaneSegment, setDraggedPaneSegment] = React.useState(null);
  const [dragPreviewOrders, setDragPreviewOrders] = React.useState(null);
  const [dragInsertion, setDragInsertion] = React.useState(null);
  const [draggedSegment, setDraggedSegment] = React.useState(null);
  const [dragSegmentPreviewOrder, setDragSegmentPreviewOrder] = React.useState(null);
  const [segmentDragInsertion, setSegmentDragInsertion] = React.useState(null);
  const railRef = React.useRef(null);
  const rangeMeta = RANGES[range];
  const visibleTrackableGames = React.useMemo(() => games.filter((game) => !game.homeLocked), [games]);
  const visibleNews = React.useMemo(() => ({ ...news, items: news.items.map((item) => maskHomeNews(item, lockedGameCategories)) }), [news, lockedGameCategories]);
  const visibleGameUpdates = React.useMemo(() => maskHomeUpdates(gameUpdates, lockedGameCategories), [gameUpdates, lockedGameCategories]);
  const visibleStorage = React.useMemo(() => ({
    ...storage,
    skipped: (storage.skipped || []).map((item) => lockedGameCategories?.[item?.id] ? { ...item, name: 'Locked game', reason: 'Protected until unlock' } : item),
  }), [lockedGameCategories, storage]);
  const cutoff = Date.now() - rangeMeta.days * 86400000;
  const played = React.useMemo(() => games.filter((game) => Number(game.lastPlayedAt || 0) >= cutoff).sort((a, b) => Number(b.lastPlayedAt || 0) - Number(a.lastPlayedAt || 0)), [games, cutoff]);
  const topFive = React.useMemo(() => [...(rankingScope === 'all' ? games : played)].filter((game) => Number(game.playtime || 0) > 0).sort((a, b) => Number(b.playtime || 0) - Number(a.playtime || 0)).slice(0, 5), [games, played, rankingScope]);
  const totalMinutes = played.reduce((sum, game) => sum + Number(game.playtime || 0), 0);
  const health = React.useMemo(() => getLibraryHealth(games), [games]);
  const recommendations = React.useMemo(() => getRecommendations(games, visibleNews.items), [games, visibleNews.items]);
  const chronicle = React.useMemo(() => getChronicle(games, visibleNews.items), [games, visibleNews.items]);
  const bestGames = React.useMemo(() => [...games].filter((game) => Number(game.rating || 0) > 0).sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0) || Number(b.playtime || 0) - Number(a.playtime || 0)).slice(0, 5), [games]);
  const segmentOrder = React.useMemo(() => {
    const saved = Array.isArray(homeLayout.segmentOrder) ? homeLayout.segmentOrder : [];
    const known = HOME_SEGMENTS.map((segment) => segment.id);
    return [...saved.filter((id) => known.includes(id)), ...known.filter((id) => !saved.includes(id))];
  }, [homeLayout.segmentOrder]);
  const paneOrders = React.useMemo(() => {
    const savedBySegment = homeLayout.paneOrderBySegment && typeof homeLayout.paneOrderBySegment === 'object' ? homeLayout.paneOrderBySegment : {};
    const legacyOrder = Array.isArray(homeLayout.order) ? homeLayout.order : [];
    return Object.fromEntries(HOME_SEGMENTS.map((segment) => {
      const saved = Array.isArray(savedBySegment[segment.id]) ? savedBySegment[segment.id] : legacyOrder.filter((id) => segment.panes.includes(id));
      return [segment.id, [...saved.filter((id) => segment.panes.includes(id)), ...segment.panes.filter((id) => !saved.includes(id))]];
    }));
  }, [homeLayout.order, homeLayout.paneOrderBySegment]);
  const activePaneOrders = dragPreviewOrders || paneOrders;
  const activeSegmentOrder = dragSegmentPreviewOrder || segmentOrder;
  const hiddenPanes = React.useMemo(() => {
    const saved = Array.isArray(homeLayout.hidden) ? homeLayout.hidden : [];
    // Older Home stored Storage and Chronicle as one combined pane. Preserve a
    // player's old hide choice when that pane becomes two properly grouped
    // cards, rather than unexpectedly restoring both pieces.
    return [...new Set([
      ...saved.filter((id) => HOME_PANES.some(([known]) => known === id)),
      ...(saved.includes('library-tools') ? ['storage', 'chronicle'] : []),
    ])];
  }, [homeLayout.hidden]);
  const updateLayout = (patch) => onUpdateHomeLayout?.({ ...homeLayout, ...patch });
  const reorderPane = React.useCallback((order, source, target, after = false) => {
    if (!source || !target || source === target) return order;
    const next = order.filter((id) => id !== source);
    const targetIndex = next.indexOf(target);
    if (targetIndex < 0) return order;
    next.splice(targetIndex + (after ? 1 : 0), 0, source);
    return next;
  }, []);
  const finishPaneDrag = React.useCallback(() => {
    if (draggedPane && draggedPaneSegment && dragPreviewOrders) updateLayout({ paneOrderBySegment: dragPreviewOrders });
    setDraggedPane(null);
    setDraggedPaneSegment(null);
    setDragPreviewOrders(null);
    setDragInsertion(null);
  }, [draggedPane, draggedPaneSegment, dragPreviewOrders]);
  React.useEffect(() => {
    if (!draggedPane || !draggedPaneSegment) return undefined;
    const onMove = (event) => {
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('[data-home-pane-id]');
      const targetId = target?.dataset?.homePaneId || '';
      const targetSegment = target?.dataset?.homePaneSegment || '';
      // A pane is deliberately trapped inside its own conceptual Home group.
      // This prevents a System card from drifting into Play just because the
      // player scrolls through a long dashboard while holding the handle.
      if (!targetId || targetId === draggedPane || targetSegment !== draggedPaneSegment) return;
      const rect = target.getBoundingClientRect();
      const horizontal = HALF_WIDTH_HOME_PANES.has(draggedPane) && HALF_WIDTH_HOME_PANES.has(targetId);
      const after = horizontal ? event.clientX > rect.left + rect.width / 2 : event.clientY > rect.top + rect.height / 2;
      setDragInsertion({ id: targetId, after, horizontal });
      setDragPreviewOrders((orders) => ({
        ...(orders || paneOrders),
        [draggedPaneSegment]: reorderPane((orders || paneOrders)[draggedPaneSegment], draggedPane, targetId, after),
      }));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', finishPaneDrag, { once: true });
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', finishPaneDrag); };
  }, [draggedPane, draggedPaneSegment, finishPaneDrag, paneOrders, reorderPane]);
  const startPaneDrag = (segmentId, id, event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDraggedPane(id);
    setDraggedPaneSegment(segmentId);
    setDragPreviewOrders(activePaneOrders);
    setDragInsertion(null);
  };
  const finishSegmentDrag = React.useCallback(() => {
    if (draggedSegment && dragSegmentPreviewOrder) updateLayout({ segmentOrder: dragSegmentPreviewOrder });
    setDraggedSegment(null);
    setDragSegmentPreviewOrder(null);
    setSegmentDragInsertion(null);
  }, [draggedSegment, dragSegmentPreviewOrder]);
  React.useEffect(() => {
    if (!draggedSegment) return undefined;
    const onMove = (event) => {
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('[data-home-segment-id]');
      const targetId = target?.dataset?.homeSegmentId || '';
      if (!targetId || targetId === draggedSegment) return;
      const rect = target.getBoundingClientRect();
      const after = event.clientY > rect.top + rect.height / 2;
      setSegmentDragInsertion({ id: targetId, after });
      setDragSegmentPreviewOrder((order) => reorderPane(order || segmentOrder, draggedSegment, targetId, after));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', finishSegmentDrag, { once: true });
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', finishSegmentDrag); };
  }, [draggedSegment, finishSegmentDrag, reorderPane, segmentOrder]);
  const startSegmentDrag = (id, event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDraggedSegment(id);
    setDragSegmentPreviewOrder(activeSegmentOrder);
    setSegmentDragInsertion(null);
  };
  const togglePane = (id, hidden) => updateLayout({ hidden: hidden ? [...new Set([...hiddenPanes, id])] : hiddenPanes.filter((item) => item !== id) });
  const paneProps = (segmentId) => ({ paneOrder: activePaneOrders[segmentId], hiddenPanes, draggedPane, draggedPaneSegment, dragInsertion, startPaneDrag, togglePane, segmentId });

  React.useEffect(() => {
    const cached = normaliseGameUpdates(updatesCache);
    setGameUpdates((current) => cached.scannedAt > current.scannedAt ? cached : current);
  }, [updatesCache]);

  React.useEffect(() => {
    if (resting || !window.api?.fetchAllNews) return undefined;
    // Named games without Steam/GOG/itch identities are intentionally included:
    // the main process gives their official site and web-discovery path a turn.
    const eligible = visibleTrackableGames.filter((game) => game && String(game.name || '').trim());
    if (!eligible.length) { setNews({ loading: false, items: [] }); return undefined; }
    let cancelled = false;
    setNews((value) => ({ ...value, loading: true }));
    window.api.fetchAllNews({ games: eligible.map(({ id, appid, name, website, source, launcher, gogId }) => ({ id, appid, name, website, source, launcher, gogId })), days: rangeMeta.days, force: false })
      .then((result) => { if (!cancelled) setNews({ loading: false, items: (result?.items || []).sort((a, b) => Number(b.date || 0) - Number(a.date || 0)) }); })
      .catch(() => { if (!cancelled) setNews({ loading: false, items: [] }); });
    return () => { cancelled = true; };
  }, [rangeMeta.days, resting, visibleTrackableGames]);

  const refreshWeeklyReleases = React.useCallback(async (force = false) => {
    if (resting || !window.api?.fetchWeeklyReleases) return;
    setWeeklyReleases((value) => ({ ...value, loading: true, error: '' }));
    try {
      const result = await window.api.fetchWeeklyReleases({ force });
      setWeeklyReleases({ loading: false, items: result?.items || [], criteria: result?.criteria || '', tier: result?.tier || 'major', fetchedAt: result?.fetchedAt || 0, error: result?.ok === false ? (result.error || 'Release feed unavailable.') : '' });
    } catch {
      setWeeklyReleases((value) => ({ ...value, loading: false, error: 'Release feed unavailable.' }));
    }
  }, [resting]);

  React.useEffect(() => { refreshWeeklyReleases(false); }, [refreshWeeklyReleases]);

  const refreshGameUpdates = React.useCallback(async (gameIds = [], force = false) => {
    if (resting || !window.api?.scanGameUpdates) return;
    setGameUpdates((value) => ({ ...value, loading: true, error: '' }));
    try {
      const scopedGames = (gameIds.length ? visibleTrackableGames.filter((game) => gameIds.includes(game.id)) : visibleTrackableGames);
      const result = await window.api.scanGameUpdates({ games: scopedGames.map(({ id, name, appid, launcher, source, steamOwned, installedVersion, updateWatchUrl, website, exePath }) => ({ id, name, appid, launcher, source, steamOwned, installedVersion, updateWatchUrl, website, exePath })), force });
      const next = { loading: false, items: result?.items || [], needsSetup: result?.needsSetup || [], ledger: result?.ledger || [], checked: result?.checked || 0, launcherManagedCount: result?.launcherManagedCount || 0, scannedAt: result?.scannedAt || Date.now(), error: result?.ok === false ? (result.error || 'Update scan unavailable.') : '' };
      setGameUpdates(next);
      onUpdateUpdatesCache?.(next);
    } catch {
      setGameUpdates((value) => ({ ...value, loading: false, error: 'Update scan unavailable.' }));
    }
  }, [onUpdateUpdatesCache, resting, visibleTrackableGames]);
  React.useEffect(() => {
    if (resting) return undefined;
    // Home is already mounted behind the CRT intro. Do not let that hidden
    // mount start executable/version inspection while NEO-LIB is booting.
    const timer = window.setTimeout(() => refreshGameUpdates(), 35_000);
    return () => window.clearTimeout(timer);
  }, [refreshGameUpdates, resting]);

  const scrollNews = (direction) => railRef.current?.scrollBy({ left: direction * 420, behavior: 'smooth' });
  const scanStorage = async () => {
    if (!window.api?.scanGameStorage) return;
    setStorage((value) => ({ ...value, loading: true }));
    const result = await window.api.scanGameStorage({ games: visibleTrackableGames.map(({ id, name, exePath, launcher }) => ({ id, name, exePath, launcher })), force: Boolean(storage.scannedAt) });
    const next = { loading: false, scannedAt: result?.scannedAt || 0, results: result?.results || [], skipped: result?.skipped || [] };
    STORAGE_SESSION_CACHE = next;
    setStorage(next);
  };
  const paneContent = {
    'play-next': <PlayNext recommendations={recommendations} onSelect={onSelect} />,
    updates: <GameUpdates updates={visibleGameUpdates} onRefresh={() => refreshGameUpdates([], true)} onResolve={(ids) => refreshGameUpdates(ids, true)} onSelect={onSelect} />,
    health: <LibraryHealth health={health} onOpenTidyUp={onOpenTidyUp} gameCount={games.length} />,
    'best-games': <MyBestGames games={bestGames} onSelect={onSelect} />,
    'released-week': <ReleasedThisWeek releases={weeklyReleases} onRefresh={() => refreshWeeklyReleases(true)} />,
    storage: <StorageCentre games={games} storage={visibleStorage} onScan={scanStorage} onSelect={onSelect} />,
    chronicle: <GamingChronicle entries={chronicle} onSelect={onSelect} />,
    recent: <section className="pb-1"><div className="mb-2 flex items-center gap-2"><Clock3 size={14} className="text-[rgb(var(--accent))]" /><h2 className="text-xs font-black uppercase tracking-[0.18em]">Recent sessions</h2><span className="text-[10px] text-muted">Latest plays · chronological</span></div><div className="overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.3)]">{played.length ? played.slice(0, 5).map((game) => <button key={game.id} onClick={() => onSelect?.(game.id)} className="flex w-full items-center gap-3 border-b border-[rgb(var(--border)/0.55)] px-3 py-2.5 text-left last:border-b-0 hover:bg-[rgb(var(--accent)/0.07)]"><Cover game={game} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{game.name}</span><span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted"><Gamepad2 size={10} />{PLATFORM[platformOf(game)]}</span></span><span className="hidden text-right text-[10px] text-muted sm:block">Played<br /><b className="text-ink">{relative(game.lastPlayedAt)}</b></span><span className="font-mono text-xs font-bold text-[rgb(var(--accent-2))]">{hours(game.playtime)}</span></button>) : <p className="p-5 text-center text-xs text-muted">Your latest sessions will appear here.</p>}</div></section>,
  };
  return <section className="flex h-full flex-col overflow-y-auto px-6 py-6 lg:px-9" data-testid="home-hub">
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[rgb(var(--accent-2))]">Your NEO-LIB</p><h1 className="font-display text-4xl font-black tracking-tight">Home</h1><p className="mt-1.5 text-[13px] text-muted">Your games, your time, and the updates that matter.</p></div>
      <div className="flex flex-wrap justify-end gap-2">{hasPrivateCategories && <button type="button" onClick={onPanicLock} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-400/60 bg-red-400/[0.09] px-3 text-xs font-bold text-red-200 shadow-[0_0_16px_-7px_rgba(248,113,113,.95)] transition hover:bg-red-400/[0.18] hover:text-red-100" title="Lock every private category and return to a safe Library view" aria-label="Lock private categories"><ShieldCheck size={15} />Lock private</button>}<div className="flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)] p-1">{Object.entries(RANGES).map(([key, meta]) => <button key={key} onClick={() => setRange(key)} className={`rounded-md px-3 py-1.5 text-[11px] font-bold transition ${range === key ? 'bg-[rgb(var(--accent)/0.22)] text-ink shadow-[0_0_12px_-4px_rgb(var(--accent))]' : 'text-muted hover:text-ink'}`}>{meta.label}</button>)}</div>{hiddenPanes.length > 0 && <div className="flex items-center gap-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)] p-1">{hiddenPanes.map((id) => <button key={id} onClick={() => togglePane(id, false)} className="rounded px-2 py-1.5 text-[10px] font-bold text-muted hover:bg-[rgb(var(--accent)/0.14)] hover:text-ink">Show {homePaneLabel(id)}</button>)}</div>}</div>
    </header>

    {hasLockedPrivateCategories && <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-400/35 bg-red-400/[0.065] px-4 py-3 shadow-[0_12px_28px_-22px_rgba(248,113,113,.9)]" data-testid="home-private-categories-locked-notice"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-400/40 bg-red-400/[0.10] text-red-200"><LockKeyhole size={15} /></span><span className="min-w-0"><span className="block text-[11px] font-black uppercase tracking-[0.16em] text-red-200">Private categories are locked</span><span className="mt-1 block text-[11px] leading-relaxed text-ink/90">Please unlock them in Library to view stats and news from these games.</span></span></div>}

    {!hiddenPanes.includes('top-played') && <TopPlayed games={topFive} scope={rankingScope} onScope={setRankingScope} rangeLabel={rangeMeta.label} summary={{ totalMinutes, gamesTouched: played.length, today: games.filter((game) => Number(game.lastPlayedAt || 0) >= Date.now() - 86400000).length, library: games.length }} onSelect={onSelect} onHide={() => togglePane('top-played', true)} />}
    {!hiddenPanes.includes('news') && <PinnedNews news={visibleNews} railRef={railRef} onScroll={scrollNews} onOpen={setNewsDetail} onHide={() => togglePane('news', true)} rangeLabel={rangeMeta.label} />}
    <div className="home-segment-list flex flex-col">
      {activeSegmentOrder.map((segmentId) => {
        const segment = HOME_SEGMENTS.find((item) => item.id === segmentId);
        if (!segment) return null;
        const Icon = segment.icon;
        const visible = activePaneOrders[segmentId].filter((id) => !hiddenPanes.includes(id));
        return <HomeSegment key={segmentId} id={segmentId} title={segment.label} hint={segment.hint} icon={<Icon size={15} />} segmentOrder={activeSegmentOrder} draggedSegment={draggedSegment} dragInsertion={segmentDragInsertion} startSegmentDrag={startSegmentDrag}>
          {visible.length ? <div className="grid grid-cols-1 gap-x-5 xl:grid-cols-2">{activePaneOrders[segmentId].map((id) => <HomePane key={id} id={id} {...paneProps(segmentId)}>{paneContent[id]}</HomePane>)}</div> : <p className="px-9 py-4 text-xs text-muted">Every pane in this section is hidden. Use the Show controls above to bring one back.</p>}
        </HomeSegment>;
      })}
    </div>
    {newsDetail && <NewsDetail item={newsDetail} onClose={() => setNewsDetail(null)} />}
  </section>;
}
function RailButton({ children, onClick }) { return <button onClick={onClick} className="grid h-7 w-7 place-items-center rounded-md border border-[rgb(var(--border))] text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink">{children}</button>; }

// News is intentionally a compact fixed rail. It belongs directly below the
// player's Top 5 rather than competing with the full-size movable dashboard
// cards, and it remains separate from the Updates section beneath it.
function PinnedNews({ news, railRef, onScroll, onOpen, onHide, rangeLabel }) {
  return <section className="mb-10 rounded-2xl border border-t-2 border-[rgb(var(--accent)/0.76)] bg-[linear-gradient(112deg,rgb(var(--accent)/0.18),rgb(var(--panel)/0.40)_46%,rgb(var(--accent-2)/0.12))] px-5 py-4 shadow-[0_0_40px_-24px_rgb(var(--accent)),0_18px_46px_-38px_rgb(var(--accent-2))]" data-testid="home-pinned-news">
    <div className="mb-3.5 flex items-center justify-between gap-2"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-[rgb(var(--accent-2)/0.46)] bg-[rgb(var(--accent-2)/0.14)] shadow-[0_0_18px_-4px_rgb(var(--accent-2))]"><Newspaper size={18} className="text-[rgb(var(--accent-2))]" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[rgb(var(--accent-2))]">Weekly game news</p><h2 className="mt-0.5 text-base font-black tracking-wide">What changed in your library</h2><p className="mt-0.5 text-[10.5px] text-muted">Fresh patch notes, updates, and stories · {rangeLabel.toLowerCase()}</p></div></div><div className="flex items-center gap-1"><RailButton onClick={() => onScroll(-1)}><ChevronLeft size={13} /></RailButton><RailButton onClick={() => onScroll(1)}><ChevronRight size={13} /></RailButton><button onClick={onHide} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink" title="Hide This Week's News"><EyeOff size={13} /></button></div></div>
    <div ref={railRef} onWheel={(event) => { if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) { event.currentTarget.scrollLeft += event.deltaY; event.preventDefault(); } }} className="flex gap-3 overflow-x-auto pb-1 [scrollbar-color:rgb(var(--accent))_transparent] [scrollbar-width:thin]">
      {news.loading && <p className="px-1 py-3 text-xs text-muted">Loading this week’s game news…</p>}
      {!news.loading && !news.items.length && <p className="px-1 py-3 text-xs text-muted">No game news in {rangeLabel.toLowerCase()} yet.</p>}
      {news.items.map((item) => <button key={item.id} onClick={() => !item.homeLocked && onOpen?.(item)} disabled={item.homeLocked} className={`group flex w-[min(430px,84vw)] shrink-0 gap-3.5 rounded-xl border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.34)] p-3 text-left transition ${item.homeLocked ? 'cursor-default' : 'hover:-translate-y-0.5 hover:border-[rgb(var(--accent)/0.72)] hover:bg-[rgb(var(--surface)/0.58)]'}`}><NewsCover item={item} /><span className="min-w-0 flex-1"><p className="text-[10.5px] font-bold text-[rgb(var(--accent-2))]">{item.gameName || 'Game update'} · {relative(item.date)}</p><h3 className="mt-1 line-clamp-2 text-[14px] font-black leading-snug group-hover:text-[rgb(var(--accent))]">{item.title}</h3>{item.snippet && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">{item.snippet}</p>}</span></button>)}
    </div>
  </section>;
}

function GameUpdates({ updates, onRefresh, onResolve, onSelect }) {
  const [historyItem, setHistoryItem] = React.useState(null);
  const [downloadError, setDownloadError] = React.useState('');
  const resolvableNeedsSetup = (updates.needsSetup || []).filter((item) => !item.homeLocked);
  const openUpdate = async (item) => {
    setDownloadError('');
    const result = await window.api?.openLauncherDownloads?.(item.platform);
    if (!result?.ok) setDownloadError(result?.error || 'The launcher Downloads page could not be opened.');
  };
  const size = (bytes) => bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`;
  return <><section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-4" data-testid="home-game-updates">
    <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><Download size={15} className="text-[rgb(var(--accent))]" /><div><h2 className="text-xs font-black uppercase tracking-[0.18em]">Game Updates</h2><p className="mt-1 text-[10px] text-muted">Launcher manifests plus safe local-version checks for independent games.</p></div></div><button onClick={onRefresh} disabled={updates.loading} className="inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] font-bold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink disabled:opacity-50"><RefreshCw size={11} className={updates.loading ? 'animate-spin' : ''} />Refresh</button></div>
    {updates.items.length ? <><div className="mt-3 grid gap-2 md:grid-cols-2">{updates.items.map((item) => {
      const needsComparison = item.status === 'attention';
      const tone = needsComparison ? 'amber' : 'emerald';
      const detail = item.homeLocked
        ? 'Update details are protected until this category is unlocked.'
        : needsComparison
        ? `${item.currentVersion && item.currentVersion !== 'Unknown' ? `Local clue ${item.currentVersion} · ` : ''}Latest public version · ${item.latestVersion}`
        : item.sourceKind === 'watch-page'
          ? `New update · ${item.currentVersion} → ${item.latestVersion}`
          : `New update · ${item.platform} · ${size(item.remainingBytes)} remaining`;
      return <div key={item.id} className={`flex items-center gap-3 rounded-lg border p-3 ${needsComparison ? 'border-amber-300/35 bg-amber-300/[0.065]' : 'border-emerald-400/30 bg-emerald-400/[0.055]'}`}>
        <button onClick={() => !item.homeLocked && onSelect?.(item.id)} disabled={item.homeLocked} className={`min-w-0 flex-1 text-left ${item.homeLocked ? 'cursor-default' : ''}`}>
          <span className="block truncate text-xs font-black text-ink">{item.name}</span>
          <span className={`mt-0.5 block text-[10px] font-bold uppercase tracking-wide ${tone === 'amber' ? 'text-amber-200' : 'text-emerald-300'}`}>{detail}</span>
          <span className="mt-1 block text-[10px] text-muted">{item.homeLocked ? 'Unlock its category in Library to reveal this update.' : needsComparison ? item.currentVersion && item.currentVersion !== 'Unknown' ? 'NEO-LIB found a Windows executable version clue, but needs stronger game-owned evidence before comparing it. Check the history.' : 'A newer public patch was found, but this installed build could not reveal its version yet. Check the history to compare.' : 'There is a new update for this game you might want to check out.'}</span>
        </button>
        {item.homeLocked ? <span className="shrink-0 rounded-md border border-[rgb(var(--accent)/0.35)] px-2.5 py-1.5 text-[10px] font-bold text-[rgb(var(--accent-2))]">Locked</span> : <button onClick={() => item.sourceKind === 'watch-page' ? setHistoryItem(item) : openUpdate(item)} className={`shrink-0 rounded-md border px-2.5 py-1.5 text-[10px] font-bold ${tone === 'amber' ? 'border-amber-300/40 text-amber-200 hover:bg-amber-300/10' : 'border-emerald-400/35 text-emerald-300 hover:bg-emerald-400/10'}`}>{item.sourceKind === 'watch-page' ? 'Patch history' : 'Open downloads'}</button>}
      </div>;
    })}</div>{downloadError && <p role="status" className="mt-2 rounded-lg border border-amber-300/30 bg-amber-300/[0.08] px-3 py-2 text-[10px] font-bold text-amber-200">{downloadError}</p>}</> : <div className="mt-3 flex items-center gap-2 rounded-lg border border-[rgb(var(--border)/0.65)] bg-[rgb(var(--surface)/0.25)] p-3 text-[11px] text-muted"><ShieldCheck size={14} className="text-emerald-400" />{updates.loading ? 'Checking update sources…' : updates.error || `No verified updates found across ${updates.checked} checked source${updates.checked === 1 ? '' : 's'}.`}</div>}
    {!updates.loading && updates.needsSetup?.length > 0 && <div className="mt-3 rounded-lg border border-amber-300/25 bg-amber-300/[0.045] p-3 text-[10.5px] text-muted"><div className="flex flex-wrap items-center justify-between gap-2"><b className="text-amber-200">{updates.needsSetup.length} game{updates.needsSetup.length === 1 ? '' : 's'} need stronger update evidence.</b>{resolvableNeedsSetup.length > 0 && <button onClick={() => onResolve?.(resolvableNeedsSetup.map((item) => item.id).filter(Boolean))} className="rounded-md border border-amber-300/35 px-2 py-1 text-[9.5px] font-black text-amber-200 hover:bg-amber-300/10">Resolve checks</button>}</div><p className="mt-1">NEO-LIB already tries game-owned files, nearby manifests, executable metadata, official pages, and a bounded web search. It will not pretend an unproven result is up to date.</p><div className="mt-2 space-y-1.5">{updates.needsSetup.slice(0, 5).map((item) => item.homeLocked ? <p key={item.id} className="block max-w-full truncate text-[10px]"><span className="font-bold text-ink">Locked game</span> · Protected until unlock</p> : <button key={item.id} onClick={() => onResolve?.([item.id])} className="block max-w-full truncate text-left text-[10px] hover:text-ink"><span className="font-bold text-ink">{item.name}</span> · {item.missing} <span className="text-[rgb(var(--accent-2))]">Resolve</span></button>)}</div></div>}
    {!updates.loading && updates.launcherManagedCount > 0 && <p className="mt-2 text-[9.5px] text-muted">{updates.launcherManagedCount} launcher game{updates.launcherManagedCount === 1 ? '' : 's'} kept in launcher-managed state until their client exposes a trustworthy update signal—never counted as an update.</p>}
  </section><UpdateHistoryModal item={historyItem} onClose={() => setHistoryItem(null)} /></>;
}
function TopPlayed({ games, scope, onScope, rangeLabel, summary, onSelect, onHide }) {
  return <section className="mx-auto mb-6 w-full max-w-5xl rounded-2xl border border-[rgb(var(--accent)/0.34)] bg-[linear-gradient(110deg,rgb(var(--accent)/0.13),rgb(var(--panel)/0.44)_44%,rgb(var(--accent-2)/0.09))] p-4 shadow-[0_0_34px_-22px_rgb(var(--accent))]" data-testid="home-top-played"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[rgb(var(--accent)/0.16)]"><Trophy size={17} className="text-[rgb(var(--accent))]" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">Your favorites in motion</p><h2 className="text-sm font-black">Top 5 played</h2></div></div><div className="flex items-center gap-2"><div className="flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.38)] p-0.5 text-[10px] font-bold"><button onClick={() => onScope('period')} className={`rounded-md px-2.5 py-1.5 ${scope === 'period' ? 'bg-[rgb(var(--accent)/0.20)] text-ink' : 'text-muted'}`}>{rangeLabel}</button><button onClick={() => onScope('all')} className={`rounded-md px-2.5 py-1.5 ${scope === 'all' ? 'bg-[rgb(var(--accent)/0.20)] text-ink' : 'text-muted'}`}>All time</button></div><button onClick={onHide} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink" title="Hide Top 5 played"><EyeOff size={13} /></button></div></div><div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-y border-[rgb(var(--border)/0.46)] py-2 text-[10px] text-muted"><span className="font-bold uppercase tracking-[0.14em] text-[rgb(var(--accent-2))]">{rangeLabel} at a glance</span><span><b className="text-ink">{hours(summary?.totalMinutes)}</b> played</span><span><b className="text-ink">{summary?.gamesTouched || 0}</b> games touched</span><span><b className="text-ink">{summary?.today || 0}</b> today</span><span><b className="text-ink">{summary?.library || 0}</b> in Library</span></div>{games.length ? <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{games.map((game, index) => <li key={game.id}><button onClick={() => onSelect?.(game.id)} className="group flex w-full items-center gap-2.5 rounded-xl border border-[rgb(var(--border)/0.8)] bg-[rgb(var(--surface)/0.34)] p-2.5 text-left transition hover:-translate-y-0.5 hover:border-[rgb(var(--accent)/0.6)] hover:bg-[rgb(var(--surface)/0.58)]"><span className="w-4 font-mono text-[10px] font-black text-[rgb(var(--accent-2))]">{index + 1}</span><Cover game={game} className="h-10 w-[68px]" /><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-black group-hover:text-[rgb(var(--accent))]">{game.name}</span><span className="mt-0.5 block text-[9.5px] text-muted">{PLATFORM[platformOf(game)]}</span><span className="mt-1 block text-[11px] font-bold text-[rgb(var(--accent-2))]">{hours(game.playtime)}</span></span></button></li>)}</ol> : <p className="mt-4 text-center text-xs text-muted">Import or track playtime to begin your ranking.</p>}</section>;
}
function HomeSegment({ id, title, hint, icon, children, segmentOrder, draggedSegment, dragInsertion, startSegmentDrag }) {
  const isDragging = draggedSegment === id;
  const isPeer = !!draggedSegment && !isDragging;
  const insertionHere = dragInsertion?.id === id;
  return <motion.section layout transition={{ layout: { duration: 0.26, ease: 'easeOut' } }} style={{ order: segmentOrder.indexOf(id) }} className={`group/homesegment relative mb-12 rounded-[1.35rem] border border-[rgb(var(--border)/0.72)] bg-[linear-gradient(128deg,rgb(var(--panel)/0.31),rgb(var(--surface)/0.16))] px-3 pb-2 pt-3 shadow-[0_20px_52px_-42px_rgb(var(--accent)/0.72)] ${isDragging ? 'z-20 scale-[0.992] ring-1 ring-[rgb(var(--accent)/0.45)]' : isPeer ? 'opacity-60' : ''}`} data-home-segment-id={id} data-testid={`home-segment-${id}`}>
    <div className="mb-4 flex items-center gap-3 border-b border-[rgb(var(--border)/0.58)] px-2 pb-3">
      <button onPointerDown={(event) => startSegmentDrag(id, event)} className={`grid h-8 w-7 shrink-0 cursor-grab place-items-center rounded-lg transition active:cursor-grabbing ${isDragging ? 'bg-[rgb(var(--accent)/0.22)] text-[rgb(var(--accent))] shadow-[0_0_15px_rgb(var(--accent)/0.38)]' : 'text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink'}`} title={`Hold and drag to move the ${title} section`}><GripVertical size={15} /></button>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))]">{icon}</span>
      <div className="min-w-0 flex-1"><h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-ink">{title}</h2><p className="mt-0.5 text-[10px] text-muted">{hint}</p></div>
      <span className="hidden rounded-full border border-[rgb(var(--border)/0.72)] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-muted sm:inline">Reorder section</span>
    </div>
    {insertionHere && <span className={`pointer-events-none absolute -left-2 -right-2 z-30 h-0.5 rounded-full bg-[rgb(var(--accent))] shadow-[0_0_14px_rgb(var(--accent))] ${dragInsertion.after ? '-bottom-6' : '-top-6'}`} />}
    {children}
  </motion.section>;
}

function HomePane({ id, children, paneOrder, hiddenPanes, draggedPane, draggedPaneSegment, dragInsertion, startPaneDrag, togglePane, segmentId }) {
  if (hiddenPanes.includes(id)) return null;
  const isDragging = draggedPane === id;
  const isPeer = !!draggedPane && draggedPaneSegment === segmentId && !isDragging;
  const insertionHere = dragInsertion?.id === id;
  const halfWidth = HALF_WIDTH_HOME_PANES.has(id);
  const insertionClass = dragInsertion?.horizontal
    ? `-bottom-1 -top-1 h-auto w-0.5 ${dragInsertion.after ? '-right-3' : '-left-3'}`
    : `-left-2 -right-2 h-0.5 ${dragInsertion?.after ? '-bottom-3' : '-top-3'}`;
  return <motion.div layout transition={{ layout: { duration: 0.22, ease: 'easeOut' } }} style={{ order: paneOrder.indexOf(id) }} className={`group/homepane relative mb-5 pl-9 ${halfWidth ? 'xl:col-span-1' : 'xl:col-span-2'} ${isDragging ? 'z-20 scale-[0.985] opacity-95' : isPeer ? 'opacity-60' : ''}`} data-home-pane-id={id} data-home-pane-segment={segmentId} data-testid={`home-pane-${id}`}><div className={`absolute left-0 top-2 z-30 flex items-center gap-0.5 transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover/homepane:opacity-100'}`}><button onPointerDown={(event) => startPaneDrag(segmentId, id, event)} className={`grid h-7 w-6 cursor-grab place-items-center rounded-md transition active:cursor-grabbing ${isDragging ? 'bg-[rgb(var(--accent)/0.22)] text-[rgb(var(--accent))] shadow-[0_0_14px_rgb(var(--accent)/0.45)]' : 'text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink'}`} title={`Hold and drag to reorder within ${HOME_SEGMENTS.find((segment) => segment.id === segmentId)?.label || 'this section'}`}><GripVertical size={14} /></button><button onClick={() => togglePane(id, true)} className="grid h-7 w-6 place-items-center rounded-md text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink" title="Hide this Home pane"><EyeOff size={12} /></button></div>{insertionHere && <span className={`pointer-events-none absolute z-30 rounded-full bg-[rgb(var(--accent))] shadow-[0_0_12px_rgb(var(--accent))] ${insertionClass}`} />}{children}</motion.div>;
}
function Stat({ label, value }) { return <div><p className="text-2xl font-black text-ink">{value}</p><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p></div>; }
function Cover({ game, className = 'h-11 w-20' }) {
  if (game?.homeLocked) return <span className={`grid ${className} shrink-0 place-items-center rounded border border-[rgb(var(--accent)/0.38)] bg-[rgb(var(--surface)/0.62)] px-1 text-center text-[rgb(var(--accent-2))]`} title={`Protected category: ${game.homeLockedCategory || 'Private category'}`}><LockKeyhole size={16} /><span className="mt-0.5 line-clamp-2 text-[7px] font-black uppercase leading-tight tracking-wide">{game.homeLockedCategory || 'Private category'}</span></span>;
  const src = game.headerImage || game.coverUrl;
  return src ? <img src={src} alt="" className={`${className} shrink-0 rounded object-cover`} /> : <span className={`grid ${className} shrink-0 place-items-center rounded bg-[rgb(var(--surface)/0.8)] text-[10px] font-bold text-muted`}>{game.name?.slice(0, 2)}</span>;
}
function NewsCover({ item, compact = false }) {
  const size = compact ? 'h-12 w-[84px] rounded-md text-[9px]' : 'h-16 w-[112px] rounded-lg text-[10px]';
  if (item?.homeLocked) return <span className={`grid ${size} shrink-0 place-items-center border border-[rgb(var(--accent)/0.38)] bg-[rgb(var(--surface)/0.62)] px-1 text-center text-[rgb(var(--accent-2))]`}><LockKeyhole size={16} /><span className="mt-0.5 line-clamp-2 text-[7px] font-black uppercase leading-tight tracking-wide">{item.lockedCategoryName || 'Private category'}</span></span>;
  const src = item.platform === 'steam' && item.appid ? `https://cdn.akamai.steamstatic.com/steam/apps/${item.appid}/capsule_184x69.jpg` : '';
  return src ? <img src={src} alt="" className={`${size} shrink-0 object-cover`} onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span className={`grid ${size} shrink-0 place-items-center bg-[rgb(var(--accent)/0.10)] font-bold uppercase tracking-wider text-[rgb(var(--accent-2))]`}>News</span>;
}

function NewsDetail({ item, onClose }) {
  const openFull = () => { if (window.api?.openExternal) window.api.openExternal(item.url); else window.open(item.url, '_blank'); };
  return <div className="fixed inset-0 z-[120] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" onMouseDown={onClose} data-testid="home-news-detail"><article className="w-full max-w-xl overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><header className="flex items-start justify-between gap-3 border-b border-[rgb(var(--border)/0.8)] p-4"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">{item.gameName || 'Game update'} · {relative(item.date)}</p><h2 className="mt-1 text-lg font-black leading-snug">{item.title || 'Game news'}</h2></div><button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted hover:bg-[rgb(var(--accent)/0.10)] hover:text-ink" aria-label="Close news"><X size={16} /></button></header><div className="max-h-[50vh] overflow-y-auto p-4"><p className="whitespace-pre-line text-sm leading-relaxed text-muted">{item.contents || item.snippet || 'Open the full story for the complete update.'}</p></div><footer className="flex justify-end border-t border-[rgb(var(--border)/0.8)] p-3"><button onClick={openFull} className="rounded-md bg-[rgb(var(--accent))] px-3 py-2 text-xs font-bold text-[rgb(var(--surface))]">Read full story ↗</button></footer></article></div>;
}

function MyBestGames({ games, onSelect }) {
  return <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-4"><div className="flex items-center gap-2"><Star size={15} className="fill-[rgb(var(--accent))] text-[rgb(var(--accent))]" /><div><h2 className="text-xs font-black uppercase tracking-[0.18em]">My Best Games</h2><p className="mt-1 text-[10px] text-muted">Your five highest personal ratings. Critic score is only context.</p></div></div>{games.length ? <ol className="mt-3 space-y-1.5">{games.map((game, index) => <li key={game.id}><button onClick={() => onSelect?.(game.id)} className="flex w-full items-center gap-2 rounded-lg border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.28)] p-2 text-left hover:border-[rgb(var(--accent)/0.55)] hover:bg-[rgb(var(--accent)/0.07)]"><span className="w-4 font-mono text-[10px] text-[rgb(var(--accent-2))]">{index + 1}</span><Cover game={game} className="h-8 w-14" /><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-bold">{game.name}</span><span className="mt-0.5 flex items-center gap-1.5 text-[10px]"><span className="text-[rgb(var(--accent))]">★ {Number(game.rating).toFixed(1)}/5</span>{game.metacritic ? <span className="text-muted">Metacritic {game.metacritic}</span> : null}</span></span></button></li>)}</ol> : <p className="mt-3 text-xs text-muted">Rate games from their preview page and your top five will appear here.</p>}</section>;
}

function ReleasedThisWeek({ releases, onRefresh }) {
  const open = (release) => { if (window.api?.openExternal) window.api.openExternal(release.url); else window.open(release.url, '_blank'); };
  const usingFallback = releases.tier === 'semi-major';
  const usingPopularFallback = releases.tier === 'popular';
  const subtitle = usingFallback
    ? 'A quieter week — showing noteworthy releases with real early momentum.'
    : usingPopularFallback
      ? 'No major launch this week — showing popular new releases instead.'
      : 'Not a release dump — only major games with real early momentum.';
  return <section className="rounded-xl border border-[rgb(var(--border))] bg-[linear-gradient(130deg,rgb(var(--accent)/0.10),rgb(var(--panel)/0.35)_46%,rgb(var(--accent-2)/0.07))] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-2"><CalendarDays size={15} className="text-[rgb(var(--accent-2))]" /><div><h2 className="text-xs font-black uppercase tracking-[0.18em]">Released This Week</h2><p className="mt-1 text-[10px] text-muted">{subtitle}</p></div></div><button onClick={onRefresh} disabled={releases.loading} className="inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] font-bold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink disabled:opacity-50" title="Refresh this week's discovery feed"><RefreshCw size={11} className={releases.loading ? 'animate-spin text-[rgb(var(--accent))]' : ''} />{releases.loading ? 'Checking…' : 'Refresh'}</button></div>{(usingFallback || usingPopularFallback) && releases.items.length > 0 && <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--accent-2)/0.35)] bg-[rgb(var(--accent-2)/0.10)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[rgb(var(--accent-2))]">{usingFallback ? 'Noteworthy picks · no major releases found' : 'Popular new releases · no major picks found'}</div>}{releases.loading && !releases.items.length ? <p className="mt-4 text-xs text-muted">Verifying notable new releases…</p> : releases.items.length ? <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{releases.items.map((release) => <button key={release.id} onClick={() => open(release)} className="group flex min-w-0 gap-3 rounded-lg border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.34)] p-2.5 text-left hover:border-[rgb(var(--accent)/0.55)] hover:bg-[rgb(var(--surface)/0.60)]"><img src={release.image} alt="" className="h-14 w-24 shrink-0 rounded-md object-cover" onError={(event) => { event.currentTarget.style.opacity = '0.18'; }} /><span className="min-w-0 flex-1"><span className="flex items-start gap-1"><span className="line-clamp-2 flex-1 text-xs font-black leading-snug group-hover:text-[rgb(var(--accent))]">{release.title}</span><ExternalLink size={11} className="mt-0.5 shrink-0 text-muted" /></span><span className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-muted"><span>{release.platform}</span><span>{release.releaseDate}</span></span><span className="mt-1 block truncate text-[10px] font-bold text-[rgb(var(--accent-2))]">{release.why}</span></span></button>)}</div> : <p className="mt-4 text-xs leading-relaxed text-muted">{releases.error || 'No recent popular releases surfaced through the current verified sources.'}</p>}<p className="mt-3 text-[9.5px] leading-relaxed text-muted/80">{releases.criteria || 'Discovery criteria appear after the first successful refresh.'}</p></section>;
}

function getLibraryHealth(games) {
  // A protected placeholder deliberately has no art, description, or launch
  // path. Do not turn privacy into a false Library Health problem.
  const inspectableGames = games.filter((game) => !game.homeLocked);
  const missingArt = inspectableGames.filter((g) => !(g.coverUrl || g.headerImage || g.background)).length;
  // Metadata arrives from different sources under different fields. Treat a
  // game as detailed when any user-facing description is present, otherwise a
  // large imported library is incorrectly reported as entirely incomplete.
  const missingDetails = inspectableGames.filter((g) => ![g.description, g.about, g.shortDescription].some((value) => String(value || '').trim())).length;
  const noLaunchTarget = inspectableGames.filter((g) => !(g.exePath || g.launchUrl)).length;
  const names = new Map();
  for (const game of inspectableGames) { const key = String(game.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''); if (key) names.set(key, (names.get(key) || 0) + 1); }
  const duplicates = [...names.values()].reduce((total, count) => total + (count > 1 ? count - 1 : 0), 0);
  const issues = missingArt + missingDetails + noLaunchTarget + duplicates;
  const genreProfile = inspectableGames.filter((g) => Array.isArray(g.genreProfile?.rawTags) && g.genreProfile.rawTags.length > 0).length;
  return { missingArt, missingDetails, noLaunchTarget, duplicates, genreProfile, score: Math.max(0, Math.round(100 - ((issues / Math.max(inspectableGames.length, 1)) * 35))) };
}

function LibraryHealth({ health, onOpenTidyUp, gameCount = 0 }) {
  const color = health.score >= 85 ? '#4ade80' : health.score >= 65 ? '#fbbf24' : '#fb4b5c';
  const issues = [
    [health.missingArt, 'missing cover art', '#60a5fa'], [health.missingDetails, 'missing details', '#c084fc'],
    [health.noLaunchTarget, 'no launch target', '#fb7185'], [health.duplicates, 'duplicate candidate', '#fbbf24'],
  ].filter(([count]) => count > 0);
  return <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[rgb(var(--accent-2))]">Library Health</p><div className="mt-1 flex items-baseline gap-2"><span className="text-3xl font-black" style={{ color }}>{health.score}%</span><span className="text-xs text-muted">ready and tidy · {gameCount} games checked</span></div></div>{onOpenTidyUp && <button onClick={onOpenTidyUp} className="rounded-md border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] font-bold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink">Review issues</button>}</div><div className="mt-3 h-2 overflow-hidden rounded-full bg-black/25"><span className="block h-full rounded-full transition-all duration-500" style={{ width: `${health.score}%`, background: `linear-gradient(90deg, ${color}, rgb(var(--accent-2)))`, boxShadow: `0 0 12px ${color}` }} /></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><HealthStat label="Art ready" value={`${Math.max(0, gameCount - health.missingArt)}/${gameCount}`} /><HealthStat label="Details" value={`${Math.max(0, gameCount - health.missingDetails)}/${gameCount}`} /><HealthStat label="Launch targets" value={`${Math.max(0, gameCount - health.noLaunchTarget)}/${gameCount}`} /><HealthStat label="Tagged" value={`${health.genreProfile}/${gameCount}`} /></div><div className="mt-3 flex flex-wrap gap-2">{issues.length ? issues.map(([count, label, issueColor]) => <span key={label} className="rounded-full border px-2 py-1 text-[10px] font-semibold" style={{ color: issueColor, borderColor: `${issueColor}55`, background: `${issueColor}12` }}>{count} {label}{count !== 1 ? 's' : ''}</span>) : <span className="text-xs text-emerald-400">Everything looks healthy.</span>}</div></section>;
}

function HealthStat({ label, value }) { return <div className="rounded-lg border border-[rgb(var(--border)/0.6)] bg-[rgb(var(--surface)/0.25)] px-2.5 py-2"><span className="block text-[9px] font-bold uppercase tracking-wide text-muted">{label}</span><span className="mt-0.5 block text-xs font-black text-ink">{value}</span></div>; }

function LibraryHealthBlob({ health, onOpenTidyUp }) {
  const color = health.score >= 85 ? '#4ade80' : health.score >= 65 ? '#fbbf24' : '#fb4b5c';
  const issues = health.missingArt + health.missingDetails + health.noLaunchTarget + health.duplicates;
  return <button onClick={() => onOpenTidyUp?.()} className="mt-3 flex w-full items-center gap-2.5 rounded-lg border border-[rgb(var(--border)/0.8)] bg-[rgb(var(--surface)/0.28)] px-2.5 py-2 text-left transition hover:border-[rgb(var(--accent)/0.55)] hover:bg-[rgb(var(--accent)/0.07)]" title="Review Library Health"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 9px ${color}` }} /><span className="text-[10px] font-black uppercase tracking-[0.14em]">Library health</span><span className="min-w-0 flex-1"><span className="block h-1.5 overflow-hidden rounded-full bg-black/25"><span className="block h-full rounded-full" style={{ width: `${health.score}%`, background: color }} /></span></span><span className="text-[10px] font-bold" style={{ color }}>{health.score}%</span><span className="text-[9px] text-muted">{issues ? `${issues} to review` : 'All tidy'}</span></button>;
}

function getRecommendations(games, news) {
  const now = Date.now();
  const hasNews = (game) => news.find((item) => item.gameId === game.id || String(item.gameName || '').toLowerCase() === String(game.name || '').toLowerCase());
  const installed = games.filter((game) => game.exePath || game.launchUrl);
  const updated = installed.map((game) => ({ game, news: hasNews(game) })).filter((entry) => entry.news).sort((a, b) => Number(b.news.date || 0) - Number(a.news.date || 0))[0];
  const rediscover = installed.filter((game) => Number(game.lastPlayedAt || 0) && now - Number(game.lastPlayedAt) > 21 * 86400000).sort((a, b) => (Number(b.rating || 0) * 10000000000 + Number(b.playtime || 0)) - (Number(a.rating || 0) * 10000000000 + Number(a.playtime || 0)))[0];
  const fresh = installed.filter((game) => !Number(game.playtime || 0)).sort((a, b) => Number(b.addedAt || 0) - Number(a.addedAt || 0))[0];
  const seen = new Set();
  return [
    updated && { game: updated.game, label: 'NEW UPDATE', reason: `New patch notes appeared ${relative(updated.news.date)}. ${updated.news.title ? `${updated.news.title} — ` : ''}a good reason to return and see what changed.`, action: 'Read update', update: true },
    rediscover && { game: rediscover, label: 'Rediscover', reason: `You last played ${relative(rediscover.lastPlayedAt)}. ${rediscover.rating ? `Your ${Number(rediscover.rating).toFixed(1)}/5 rating` : `${hours(rediscover.playtime)} invested`} says this is worth another session.`, action: 'Open game' },
    fresh && { game: fresh, label: 'Fresh start', reason: `Added ${added(fresh.addedAt)} and still unplayed. Its launch target is ready, so this is an easy first session from your own library.`, action: 'Explore' },
  ].filter(Boolean).filter((entry) => { if (seen.has(entry.game.id)) return false; seen.add(entry.game.id); return true; }).slice(0, 3);
}

function PlayNext({ recommendations, onSelect }) {
  return <section className="rounded-xl border border-[rgb(var(--accent)/0.35)] bg-[linear-gradient(120deg,rgb(var(--accent)/0.12),rgb(var(--panel)/0.35)_48%,rgb(var(--accent-2)/0.08))] p-4 shadow-[0_0_32px_-20px_rgb(var(--accent))]"><div className="flex items-center gap-2.5"><Sparkles size={17} className="text-[rgb(var(--accent-2))]" /><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">What should I play?</p><h2 className="text-sm font-black">A useful nudge from your own library</h2></div></div>{recommendations.length ? <div className="mt-3 space-y-2">{recommendations.map(({ game, label, reason, action, update }) => <button key={game.id} onClick={() => onSelect?.(game.id)} className="group flex min-w-0 items-center gap-3 rounded-xl border border-[rgb(var(--border)/0.85)] bg-[rgb(var(--surface)/0.36)] p-2.5 text-left hover:border-[rgb(var(--accent)/0.55)] hover:bg-[rgb(var(--surface)/0.6)]"><Cover game={game} className="h-12 w-20" /><span className="min-w-0 flex-1"><span className={`block text-[9.5px] font-bold uppercase tracking-wider ${update ? 'new-update-reactive text-emerald-300' : 'text-[rgb(var(--accent-2))]'}`}>{label}</span><span className="block truncate text-[12px] font-black group-hover:text-[rgb(var(--accent))]">{game.name}</span><span className="mt-0.5 block line-clamp-2 text-[10.5px] leading-relaxed text-muted">{reason}</span></span><span className="shrink-0 text-[10px] font-bold text-[rgb(var(--accent))]">{action} ›</span></button>)}</div> : <p className="mt-3 text-xs text-muted">Add or import a few games and NEO-LIB will begin surfacing timely reasons to play them.</p>}</section>;
}

function readableBytes(bytes) { const value = Number(bytes || 0); if (value < 1024 ** 2) return `${Math.round(value / 1024)} KB`; if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`; return `${(value / 1024 ** 3).toFixed(1)} GB`; }

function StorageCentre({ games, storage, onScan, onSelect }) {
  const [openError, setOpenError] = React.useState('');
  const results = storage.results.map((entry) => ({ ...entry, game: games.find((game) => game.id === entry.id) || { id: entry.id, name: entry.name || 'Unknown game' } })).sort((a, b) => Number(b.bytes) - Number(a.bytes));
  const total = results.reduce((sum, entry) => sum + Number(entry.bytes || 0), 0);
  const mods = results.reduce((sum, entry) => sum + Number(entry.modBytes || 0), 0);
  const hasEstimate = results.some((entry) => entry.truncated);
  const openFolder = async (entry) => {
    if (entry.game?.homeLocked) return;
    setOpenError('');
    const result = await window.api?.openPath?.(entry.root);
    if (!result?.ok) setOpenError(result?.error || `Could not open ${entry.root || 'this measured folder'}.`);
  };
  return <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-2"><HardDrive size={15} className="text-[rgb(var(--accent))]" /><div><h2 className="text-xs font-black uppercase tracking-[0.18em]">Storage control centre</h2><p className="mt-1 text-[10px] text-muted">Validated game folders and recognised mod folders only—read-only.</p></div></div><button onClick={onScan} disabled={storage.loading} className="inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] font-bold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink disabled:opacity-50"><RefreshCw size={11} className={storage.loading ? 'animate-spin text-[rgb(var(--accent))]' : ''} />{storage.loading ? 'Scanning…' : storage.scannedAt ? 'Rescan' : 'Scan sizes'}</button></div>{storage.scannedAt ? <><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2"><Stat label="Folders measured" value={results.length} /><Stat label="Total" value={`${hasEstimate ? '≥ ' : ''}${readableBytes(total)}`} /><Stat label="Mod content" value={readableBytes(mods)} /></div>{openError && <p className="mt-3 rounded-lg border border-red-400/30 bg-red-400/[0.07] px-3 py-2 text-[10px] text-red-200">{openError}</p>}{storage.skipped?.length > 0 && <div className="mt-3 rounded-lg border border-amber-300/25 bg-amber-300/[0.05] px-3 py-2"><p className="text-[10px] font-bold text-amber-200">{storage.skipped.length} launch target{storage.skipped.length === 1 ? '' : 's'} skipped instead of guessing.</p><p className="mt-0.5 truncate text-[9.5px] text-muted" title={storage.skipped.slice(0, 3).map((item) => `${item.name}: ${item.reason}`).join(' · ')}>{storage.skipped.slice(0, 3).map((item) => `${item.name}: ${item.reason}`).join(' · ')}</p></div>}<div className="mt-3 max-h-[430px] space-y-1.5 overflow-y-auto pr-1" data-testid="storage-results-list">{results.map((entry) => <div key={entry.id} className="flex items-center gap-2 rounded-lg border border-[rgb(var(--border)/0.68)] bg-[rgb(var(--surface)/0.23)] p-2 transition hover:border-[rgb(var(--accent)/0.45)]"><button onClick={() => onSelect?.(entry.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left"><Cover game={entry.game} className="h-8 w-14" /><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-black text-ink">{entry.game.name}</span><span className="mt-0.5 block truncate font-mono text-[8.5px] text-muted" title={entry.game.homeLocked ? 'Protected folder' : entry.root}>{entry.game.homeLocked ? 'Protected folder' : entry.root}</span><span className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[8.5px] text-muted"><span>{Number(entry.files || 0).toLocaleString()} files</span>{entry.modBytes > 0 && <span className="text-[rgb(var(--accent-2))]">mods {readableBytes(entry.modBytes)}</span>}{entry.truncated && <span className="text-amber-200">partial scan</span>}</span></span></button><div className="flex shrink-0 items-center gap-2"><span className="font-mono text-[10px] font-bold text-ink">{entry.truncated ? '≥ ' : ''}{readableBytes(entry.bytes)}</span>{entry.game.homeLocked ? <span className="inline-flex h-7 items-center rounded-md border border-[rgb(var(--accent)/0.35)] px-2 text-[9px] font-bold text-[rgb(var(--accent-2))]">Locked</span> : <button onClick={() => openFolder(entry)} className="inline-flex h-7 items-center gap-1 rounded-md border border-[rgb(var(--border))] px-2 text-[9px] font-bold text-[rgb(var(--accent-2))] hover:border-[rgb(var(--accent)/0.55)] hover:text-ink" title={`Open measured folder: ${entry.root}`}><FolderOpen size={11} />Open</button>}</div></div>)}{!results.length && <p className="rounded-lg border border-dashed border-[rgb(var(--border))] p-4 text-center text-xs text-muted">No valid game folders were measured. Review the skipped launch targets above, then use Customize to correct a game’s executable.</p>}</div><p className="mt-2 text-[9px] leading-relaxed text-muted/85">Every size is tied to the shown folder. “Partial scan” means NEO-LIB stopped at its safety limit, so the displayed total is at least that large.</p></> : <p className="mt-4 text-xs leading-relaxed text-muted">Scan when you want a current view. NEO-LIB never crawls entire drives; it walks only validated configured game folders.</p>}</section>;
}

function getChronicle(games, news) {
  const entries = [];
  for (const game of games) {
    if (game.addedAt) entries.push({ game, at: Number(game.addedAt), type: 'Added to NEO-LIB', detail: `via ${PLATFORM[platformOf(game)] || 'Local'}` });
    if (game.lastPlayedAt) entries.push({ game, at: Number(game.lastPlayedAt), type: 'Played', detail: `${hours(game.playtime)} total` });
    if (game.ratedAt) entries.push({ game, at: Number(game.ratedAt), type: 'Rated', detail: `${game.rating || 0}/5 personal rating` });
  }
  for (const item of news.slice(0, 12)) {
    const game = games.find((entry) => entry.id === item.gameId || String(entry.name || '').toLowerCase() === String(item.gameName || '').toLowerCase());
    if (game && item.date) entries.push({ game, at: Number(item.date), type: 'New update', detail: item.title || 'Patch notes available' });
  }
  return entries.sort((a, b) => b.at - a.at).slice(0, 24);
}

function GamingChronicle({ entries, onSelect }) {
  const gamesSeen = new Set(entries.map((entry) => entry.game.id)).size;
  const updates = entries.filter((entry) => entry.type === 'New update').length;
  return <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-4"><div className="flex items-center gap-2"><Archive size={15} className="text-[rgb(var(--accent-2))]" /><div><h2 className="text-xs font-black uppercase tracking-[0.18em]">Gaming chronicle</h2><p className="mt-1 text-[10px] text-muted">Your personal library story — milestones, sessions, ratings, and updates.</p></div></div><div className="mt-3 flex gap-4"><span className="text-[10px] text-muted"><b className="text-ink">{entries.length}</b> moments</span><span className="text-[10px] text-muted"><b className="text-ink">{gamesSeen}</b> games</span><span className="text-[10px] text-muted"><b className="text-ink">{updates}</b> updates</span></div>{entries.length ? <div className="mt-3 max-h-[275px] space-y-2 overflow-y-auto pr-1">{entries.map((entry, index) => <button key={`${entry.game.id}-${entry.type}-${entry.at}-${index}`} onClick={() => onSelect?.(entry.game.id)} className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1 text-left hover:bg-[rgb(var(--accent)/0.07)]"><span className="h-2 w-2 shrink-0 rounded-full bg-[rgb(var(--accent-2))] shadow-[0_0_8px_rgb(var(--accent-2))]" /><Cover game={entry.game} className="h-7 w-11" /><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-bold">{entry.game.name} <span className="font-normal text-muted">· {entry.type}</span></span><span className="block truncate text-[10px] text-muted">{entry.detail}</span></span><span className="text-[9px] text-muted">{relative(entry.at)}</span></button>)}</div> : <p className="mt-4 text-xs text-muted">Play, rate, or add games to begin your chronicle.</p>}</section>;
}
