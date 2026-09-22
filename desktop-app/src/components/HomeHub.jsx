import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Archive, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Download, EyeOff, ExternalLink, FileUp, FolderOpen, Gamepad2, Grip, GripVertical, HardDrive, LockKeyhole, Maximize2, Menu, Minimize2, Move, Newspaper, Puzzle, RefreshCw, RotateCcw, ShieldCheck, Sparkles, Star, Trophy, Unlock, X } from 'lucide-react';
import UpdateHistoryModal from './UpdateHistoryModal';
import { PLATFORM, added, getChronicle, getLibraryHealth, getRecommendations, hours, maskHomeNews, maskHomeUpdates, normaliseGameUpdates, platformOf, relative } from './home/home-model.mjs';
import { createBoundedOperation } from '../services/bounded-operation.mjs';
import { OPERATION_STATUS } from '../state/operation-state.mjs';
import { HOME_WIDGET_BY_ID, HOME_WIDGET_GRID, homeWidget, normaliseWidgetSize, widgetsForSegment } from './home/home-widget-registry.mjs';
import WidgetManagerModal from './home/WidgetManagerModal';
import { renderForegroundPortal } from './ui/VisualBoundary';

const RANGES = { today: { label: 'Today', days: 1 }, week: { label: 'This week', days: 7 }, month: { label: 'This month', days: 31 } };
const HOME_PANE_IDS = Object.keys(HOME_WIDGET_BY_ID);
const LEGACY_HOME_SEGMENTS = ['pinned', 'play', 'updates', 'system'];
const DEFAULT_HOME_WIDGET_ORDER = LEGACY_HOME_SEGMENTS.flatMap((segment) => widgetsForSegment(segment).map((widget) => widget.id));
const HOME_GRID_ROW_HEIGHT = 108;
const HOME_GRID_GAP = 12;
// Home can unmount while a game is previewed. Keep a completed, local session
// scan so Storage Control does not look empty when the player comes back.
let STORAGE_SESSION_CACHE = { loading: false, scannedAt: 0, results: [], skipped: [] };

function operationFailure(operation, label) {
  if (operation?.status === OPERATION_STATUS.TIMED_OUT) return `${label} timed out. Nothing is stuck; try again.`;
  if (operation?.status === OPERATION_STATUS.CANCELLED) return `${label} cancelled.`;
  return operation?.message || `${label} unavailable.`;
}

export default function HomeHub({ games = [], lockedGameCategories = {}, hasPrivateCategories = false, hasLockedPrivateCategories = false, onPanicLock, onSelect, onOpenPlaytimeImport, onOpenTidyUp, resting = false, homeLayout = {}, onUpdateHomeLayout, updatesCache, onUpdateUpdatesCache }) {
  const [range, setRange] = React.useState('week');
  const [rankingScope, setRankingScope] = React.useState('period');
  const [news, setNews] = React.useState({ loading: false, items: [], error: '', operation: null });
  const [storage, setStorage] = React.useState(() => STORAGE_SESSION_CACHE);
  const [weeklyReleases, setWeeklyReleases] = React.useState({ loading: false, items: [], criteria: '', tier: 'major', fetchedAt: 0, error: '', operation: null });
  // Home unmounts while the user opens a game. Start from App's local cache so
  // the update pane does not look empty on return; only a completed scan may
  // replace this list.
  const [gameUpdates, setGameUpdates] = React.useState(() => normaliseGameUpdates(updatesCache));
  const [newsDetail, setNewsDetail] = React.useState(null);
  const [draggedPane, setDraggedPane] = React.useState(null);
  const [dragPreviewOrder, setDragPreviewOrder] = React.useState(null);
  const [dragInsertion, setDragInsertion] = React.useState(null);
  const [widgetManagerOpen, setWidgetManagerOpen] = React.useState(false);
  const [communityWidgets, setCommunityWidgets] = React.useState([]);
  const [widgetImportNotice, setWidgetImportNotice] = React.useState('');
  const [layoutUnlocked, setLayoutUnlocked] = React.useState(false);
  const [gridColumns, setGridColumns] = React.useState(HOME_WIDGET_GRID.desktop);
  const railRef = React.useRef(null);
  const homeGridHostRef = React.useRef(null);
  const operations = React.useRef({});
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
  const widgetOrder = React.useMemo(() => {
    const saved = Array.isArray(homeLayout.widgetOrder) ? homeLayout.widgetOrder : [];
    const legacyBySegment = homeLayout.paneOrderBySegment && typeof homeLayout.paneOrderBySegment === 'object' ? homeLayout.paneOrderBySegment : {};
    const legacySegmentOrder = Array.isArray(homeLayout.segmentOrder) ? homeLayout.segmentOrder : LEGACY_HOME_SEGMENTS;
    const legacyFlat = legacySegmentOrder.flatMap((segment) => Array.isArray(legacyBySegment[segment]) ? legacyBySegment[segment] : widgetsForSegment(segment).map((widget) => widget.id));
    const legacyOrder = Array.isArray(homeLayout.order) ? homeLayout.order : [];
    const preferred = saved.length ? saved : legacyFlat.length ? legacyFlat : legacyOrder;
    return [...new Set([...preferred.filter((id) => HOME_PANE_IDS.includes(id)), ...DEFAULT_HOME_WIDGET_ORDER])];
  }, [homeLayout.order, homeLayout.paneOrderBySegment, homeLayout.segmentOrder, homeLayout.widgetOrder]);
  const activeWidgetOrder = dragPreviewOrder || widgetOrder;
  const hiddenPanes = React.useMemo(() => {
    const saved = Array.isArray(homeLayout.hidden) ? homeLayout.hidden : [];
    // Older Home stored Storage and Chronicle as one combined pane. Preserve a
    // player's old hide choice when that pane becomes two properly grouped
    // cards, rather than unexpectedly restoring both pieces.
    return [...new Set([
      ...saved.filter((id) => HOME_PANE_IDS.includes(id)),
      ...(saved.includes('library-tools') ? ['storage', 'chronicle'] : []),
    ])];
  }, [homeLayout.hidden]);
  const updateLayout = (patch) => onUpdateHomeLayout?.({ ...homeLayout, ...patch });
  const snapToGrid = homeLayout.snapToGrid !== false;
  const savedWidgetSizes = homeLayout.widgetSizes && typeof homeLayout.widgetSizes === 'object' ? homeLayout.widgetSizes : {};
  const freePositions = homeLayout.freePositions && typeof homeLayout.freePositions === 'object' ? homeLayout.freePositions : {};
  const widgetSize = React.useCallback((id) => normaliseWidgetSize(homeWidget(id), savedWidgetSizes[id], gridColumns), [gridColumns, savedWidgetSizes]);
  const resizeWidget = React.useCallback((id, nextSize) => {
    const next = normaliseWidgetSize(homeWidget(id), nextSize, gridColumns);
    if (!next) return;
    updateLayout({ widgetSizes: { ...savedWidgetSizes, [id]: next } });
  }, [gridColumns, homeLayout, onUpdateHomeLayout, savedWidgetSizes]);
  const resetWidgetSize = React.useCallback((id) => {
    const nextSizes = { ...savedWidgetSizes };
    const nextPositions = { ...freePositions };
    delete nextSizes[id];
    delete nextPositions[id];
    updateLayout({ widgetSizes: nextSizes, freePositions: nextPositions });
  }, [freePositions, homeLayout, onUpdateHomeLayout, savedWidgetSizes]);
  React.useEffect(() => {
    const host = homeGridHostRef.current;
    if (!host) return undefined;
    const chooseColumns = (width) => width >= 1120 ? HOME_WIDGET_GRID.desktop : width >= 720 ? HOME_WIDGET_GRID.compact : HOME_WIDGET_GRID.narrow;
    const sync = () => setGridColumns(chooseColumns(host.getBoundingClientRect().width));
    sync();
    const observer = typeof window.ResizeObserver === 'function' ? new window.ResizeObserver((entries) => setGridColumns(chooseColumns(entries[0]?.contentRect?.width || host.getBoundingClientRect().width))) : null;
    observer?.observe(host);
    window.addEventListener('resize', sync);
    return () => { observer?.disconnect(); window.removeEventListener('resize', sync); };
  }, []);
  const loadCommunityWidgets = React.useCallback(async () => {
    const result = await window.api?.listWidgets?.();
    setCommunityWidgets(result?.ok && Array.isArray(result.widgets) ? result.widgets : []);
  }, []);
  React.useEffect(() => { if (widgetManagerOpen) loadCommunityWidgets(); }, [widgetManagerOpen, loadCommunityWidgets]);
  const importWidget = React.useCallback(async () => {
    if (!window.api?.pickWidgetManifest || !window.api?.importWidget) return { message: 'Widget import is available in the installed desktop app.' };
    const manifestPath = await window.api.pickWidgetManifest();
    if (!manifestPath) return { message: 'Widget import cancelled.' };
    const result = await window.api.importWidget(manifestPath);
    if (!result?.ok) return { message: result?.error || 'Widget package could not be imported.' };
    await loadCommunityWidgets();
    return { message: `${result.widget?.name || 'Widget'} imported safely. It will become available when the isolated community host is ready.` };
  }, [loadCommunityWidgets]);
  const startWidgetImport = React.useCallback(async () => {
    setWidgetManagerOpen(true);
    const result = await importWidget();
    setWidgetImportNotice(result?.message || 'Widget import cancelled.');
  }, [importWidget]);
  const reorderPane = React.useCallback((order, source, target, after = false) => {
    if (!source || !target || source === target) return order;
    const next = order.filter((id) => id !== source);
    const targetIndex = next.indexOf(target);
    if (targetIndex < 0) return order;
    next.splice(targetIndex + (after ? 1 : 0), 0, source);
    return next;
  }, []);
  const finishPaneDrag = React.useCallback(() => {
    if (snapToGrid && draggedPane && dragPreviewOrder) updateLayout({ widgetOrder: dragPreviewOrder });
    setDraggedPane(null);
    setDragPreviewOrder(null);
    setDragInsertion(null);
  }, [dragPreviewOrder, draggedPane, homeLayout, onUpdateHomeLayout, snapToGrid]);
  React.useEffect(() => {
    if (!snapToGrid || !draggedPane) return undefined;
    const onMove = (event) => {
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('[data-home-pane-id]');
      const targetId = target?.dataset?.homePaneId || '';
      if (!targetId || targetId === draggedPane) return;
      const rect = target.getBoundingClientRect();
      const horizontal = widgetSize(draggedPane)?.cols < gridColumns && widgetSize(targetId)?.cols < gridColumns;
      const after = horizontal ? event.clientX > rect.left + rect.width / 2 : event.clientY > rect.top + rect.height / 2;
      setDragInsertion({ id: targetId, after, horizontal });
      setDragPreviewOrder((order) => reorderPane(order || widgetOrder, draggedPane, targetId, after));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', finishPaneDrag, { once: true });
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', finishPaneDrag); };
  }, [draggedPane, finishPaneDrag, gridColumns, reorderPane, snapToGrid, widgetOrder, widgetSize]);
  const startPaneDrag = (id, event) => {
    if (!layoutUnlocked || !snapToGrid || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDraggedPane(id);
    setDragPreviewOrder(activeWidgetOrder);
    setDragInsertion(null);
  };
  const togglePane = (id, hidden) => updateLayout({ hidden: hidden ? [...new Set([...hiddenPanes, id])] : hiddenPanes.filter((item) => item !== id) });
  const updateFreePosition = React.useCallback((id, position) => updateLayout({ freePositions: { ...freePositions, [id]: position } }), [freePositions, homeLayout, onUpdateHomeLayout]);
  const bringWidgetToFront = React.useCallback((id) => {
    const next = [...widgetOrder.filter((widgetId) => widgetId !== id), id];
    updateLayout({ widgetOrder: next });
  }, [homeLayout, onUpdateHomeLayout, widgetOrder]);
  const toggleSnapping = () => {
    if (snapToGrid) {
      const canvas = homeGridHostRef.current;
      const canvasRect = canvas?.getBoundingClientRect();
      const captured = { ...freePositions };
      canvas?.querySelectorAll?.('[data-home-pane-id]').forEach((element) => {
        const rect = element.getBoundingClientRect();
        captured[element.dataset.homePaneId] = { x: Math.max(0, rect.left - canvasRect.left), y: Math.max(0, rect.top - canvasRect.top), width: rect.width, height: rect.height };
      });
      updateLayout({ snapToGrid: false, freePositions: captured });
    } else updateLayout({ snapToGrid: true });
  };
  const paneProps = { paneOrder: activeWidgetOrder, hiddenPanes, draggedPane, dragInsertion, startPaneDrag, togglePane, layoutUnlocked, setLayoutUnlocked, gridColumns, snapToGrid, sizeForWidget: widgetSize, onResize: resizeWidget, onResetSize: resetWidgetSize, onFreePosition: updateFreePosition, onBringFront: bringWidgetToFront, onToggleSnap: toggleSnapping };
  const toggleLayoutLock = () => {
    if (layoutUnlocked) finishPaneDrag();
    setLayoutUnlocked((value) => !value);
  };

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
    const payloadGames = eligible.map(({ id, appid, name, website, source, launcher, gogId }) => ({ id, appid, name, website, source, launcher, gogId }));
    operations.current.news?.cancel('Replaced by a newer Home news request.');
    const operation = createBoundedOperation({
      domain: 'home-news', total: payloadGames.length, timeoutMs: 30_000,
      task: async () => {
        const result = await window.api.fetchAllNews({ games: payloadGames, days: rangeMeta.days, force: false });
        if (!result?.ok) throw new Error(result?.error || 'Home news sources were unavailable.');
        return { ...result, operationCompleted: payloadGames.length };
      },
      onState: (next) => setNews((value) => ({ ...value, operation: next, loading: next.status === OPERATION_STATUS.RUNNING, error: '' })),
    });
    operations.current.news = operation;
    operation.promise.then((outcome) => {
      if (operations.current.news?.id !== operation.id) return;
      if (outcome.state.status === OPERATION_STATUS.SUCCEEDED) setNews({ loading: false, items: (outcome.value?.items || []).sort((a, b) => Number(b.date || 0) - Number(a.date || 0)), error: '', operation: outcome.state });
      else setNews((value) => ({ ...value, loading: false, error: operationFailure(outcome.state, 'Game news'), operation: outcome.state }));
    });
    return () => operation.cancel('Home news request replaced or Home closed.');
  }, [rangeMeta.days, resting, visibleTrackableGames]);

  const refreshWeeklyReleases = React.useCallback(async (force = false) => {
    if (resting || !window.api?.fetchWeeklyReleases) return;
    operations.current.releases?.cancel('Replaced by a newer release request.');
    const operation = createBoundedOperation({ domain: 'weekly-releases', total: 1, timeoutMs: 25_000, task: async () => {
      const result = await window.api.fetchWeeklyReleases({ force });
      if (result?.ok === false) throw new Error(result.error || 'Release feed unavailable.');
      return { ...result, operationCompleted: 1 };
    }, onState: (next) => setWeeklyReleases((value) => ({ ...value, operation: next, loading: next.status === OPERATION_STATUS.RUNNING, error: '' })) });
    operations.current.releases = operation;
    const outcome = await operation.promise;
    if (operations.current.releases?.id !== operation.id) return;
    if (outcome.state.status === OPERATION_STATUS.SUCCEEDED) {
      const result = outcome.value || {};
      setWeeklyReleases({ loading: false, items: result.items || [], criteria: result.criteria || '', tier: result.tier || 'major', fetchedAt: result.fetchedAt || 0, error: '', operation: outcome.state });
    } else setWeeklyReleases((value) => ({ ...value, loading: false, error: operationFailure(outcome.state, 'Release discovery'), operation: outcome.state }));
  }, [resting]);

  React.useEffect(() => { refreshWeeklyReleases(false); }, [refreshWeeklyReleases]);

  const refreshGameUpdates = React.useCallback(async (gameIds = [], force = false) => {
    if (resting || !window.api?.scanGameUpdates) return;
    const scopedGames = (gameIds.length ? visibleTrackableGames.filter((game) => gameIds.includes(game.id)) : visibleTrackableGames);
    operations.current.updates?.cancel('Replaced by a newer update scan.');
    const operation = createBoundedOperation({ domain: 'game-update-scan', total: scopedGames.length, timeoutMs: 45_000, task: async () => {
      const result = await window.api.scanGameUpdates({ games: scopedGames.map(({ id, name, appid, launcher, source, steamOwned, installedVersion, updateWatchUrl, website, exePath }) => ({ id, name, appid, launcher, source, steamOwned, installedVersion, updateWatchUrl, website, exePath })), force });
      if (result?.ok === false) throw new Error(result.error || 'Update scan unavailable.');
      return { ...result, operationCompleted: Number(result?.checked || scopedGames.length) };
    }, onState: (next) => setGameUpdates((value) => ({ ...value, operation: next, loading: next.status === OPERATION_STATUS.RUNNING, error: '' })) });
    operations.current.updates = operation;
    const outcome = await operation.promise;
    if (operations.current.updates?.id !== operation.id) return;
    if (outcome.state.status === OPERATION_STATUS.SUCCEEDED) {
      const result = outcome.value || {};
      const next = { loading: false, items: result.items || [], needsSetup: result.needsSetup || [], ledger: result.ledger || [], checked: result.checked || 0, launcherManagedCount: result.launcherManagedCount || 0, scannedAt: result.scannedAt || Date.now(), error: '', operation: outcome.state };
      setGameUpdates(next);
      onUpdateUpdatesCache?.(next);
    } else setGameUpdates((value) => ({ ...value, loading: false, error: operationFailure(outcome.state, 'Update scan'), operation: outcome.state }));
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
    const payloadGames = visibleTrackableGames.map(({ id, name, exePath, launcher }) => ({ id, name, exePath, launcher }));
    operations.current.storage?.cancel('Replaced by a newer storage scan.');
    const operation = createBoundedOperation({ domain: 'storage-scan', total: payloadGames.length, timeoutMs: 45_000, task: async () => {
      const result = await window.api.scanGameStorage({ games: payloadGames, force: Boolean(storage.scannedAt) });
      if (result?.ok === false) throw new Error(result.error || 'Storage scan unavailable.');
      return { ...result, operationCompleted: Number(result?.results?.length || 0), operationFailed: Number(result?.skipped?.length || 0) };
    }, onState: (next) => setStorage((value) => ({ ...value, operation: next, loading: next.status === OPERATION_STATUS.RUNNING, error: '' })) });
    operations.current.storage = operation;
    const outcome = await operation.promise;
    if (operations.current.storage?.id !== operation.id) return;
    if (![OPERATION_STATUS.SUCCEEDED, OPERATION_STATUS.PARTIAL].includes(outcome.state.status)) {
      setStorage((value) => ({ ...value, loading: false, error: operationFailure(outcome.state, 'Storage scan'), operation: outcome.state }));
      return;
    }
    const result = outcome.value || {};
    const next = { loading: false, scannedAt: result.scannedAt || 0, results: result.results || [], skipped: result.skipped || [], error: outcome.state.status === OPERATION_STATUS.PARTIAL ? 'Some configured targets were skipped safely.' : '', operation: outcome.state };
    STORAGE_SESSION_CACHE = next;
    setStorage(next);
  };
  const paneContent = {
    'top-played': <TopPlayed games={topFive} scope={rankingScope} onScope={setRankingScope} rangeLabel={rangeMeta.label} summary={{ totalMinutes, gamesTouched: played.length, today: games.filter((game) => Number(game.lastPlayedAt || 0) >= Date.now() - 86400000).length, library: games.length }} onSelect={onSelect} />,
    news: <PinnedNews news={visibleNews} railRef={railRef} onScroll={scrollNews} onOpen={setNewsDetail} rangeLabel={rangeMeta.label} />,
    'play-next': <PlayNext recommendations={recommendations} onSelect={onSelect} />,
    updates: <GameUpdates updates={visibleGameUpdates} onRefresh={() => refreshGameUpdates([], true)} onCancel={() => operations.current.updates?.cancel('Cancelled by the player.')} onResolve={(ids) => refreshGameUpdates(ids, true)} onSelect={onSelect} />,
    health: <LibraryHealth health={health} onOpenTidyUp={onOpenTidyUp} gameCount={games.length} />,
    'best-games': <MyBestGames games={bestGames} onSelect={onSelect} />,
    'released-week': <ReleasedThisWeek releases={weeklyReleases} onRefresh={() => refreshWeeklyReleases(true)} onCancel={() => operations.current.releases?.cancel('Cancelled by the player.')} />,
    storage: <StorageCentre games={games} storage={visibleStorage} onScan={scanStorage} onCancel={() => operations.current.storage?.cancel('Cancelled by the player.')} onSelect={onSelect} />,
    chronicle: <GamingChronicle entries={chronicle} onSelect={onSelect} />,
    recent: <section className="pb-1"><div className="mb-2 flex items-center gap-2"><Clock3 size={14} className="text-[rgb(var(--accent))]" /><h2 className="text-xs font-black uppercase tracking-[0.18em]">Recent sessions</h2><span className="text-[10px] text-muted">Latest plays · chronological</span></div><div className="overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.3)]">{played.length ? played.slice(0, 5).map((game) => <button key={game.id} onClick={() => onSelect?.(game.id)} className="flex w-full items-center gap-3 border-b border-[rgb(var(--border)/0.55)] px-3 py-2.5 text-left last:border-b-0 hover:bg-[rgb(var(--accent)/0.07)]"><Cover game={game} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{game.name}</span><span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted"><Gamepad2 size={10} />{PLATFORM[platformOf(game)]}</span></span><span className="hidden text-right text-[10px] text-muted sm:block">Played<br /><b className="text-ink">{relative(game.lastPlayedAt)}</b></span><span className="font-mono text-xs font-bold text-[rgb(var(--accent-2))]">{hours(game.playtime)}</span></button>) : <p className="p-5 text-center text-xs text-muted">Your latest sessions will appear here.</p>}</div></section>,
  };
  const visibleWidgetIds = activeWidgetOrder.filter((id) => !hiddenPanes.includes(id));
  const fallbackFreePosition = (index) => {
    const columns = gridColumns === HOME_WIDGET_GRID.desktop ? 2 : 1;
    const width = gridColumns === HOME_WIDGET_GRID.desktop ? 480 : gridColumns === HOME_WIDGET_GRID.compact ? 420 : 300;
    return { x: (index % columns) * (width + HOME_GRID_GAP), y: Math.floor(index / columns) * 348, width, height: 332 };
  };
  const resolvedFreePositions = Object.fromEntries(visibleWidgetIds.map((id, index) => [id, freePositions[id] || fallbackFreePosition(index)]));
  const freeCanvasWidth = Math.max(320, ...Object.values(resolvedFreePositions).map((position) => Number(position.x || 0) + Number(position.width || 0) + 24));
  const freeCanvasHeight = Math.max(540, ...Object.values(resolvedFreePositions).map((position) => Number(position.y || 0) + Number(position.height || 0) + 24));
  return <section className="flex h-full flex-col overflow-y-auto px-6 py-6 lg:px-9" data-testid="home-hub">
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[rgb(var(--accent-2))]">Your NEO-LIB</p><h1 className="font-display text-4xl font-black tracking-tight">Home</h1><p className="mt-1.5 text-[13px] text-muted">Your games, your time, and the updates that matter.</p></div>
      <div className="flex flex-wrap justify-end gap-2">
        {hasPrivateCategories && <button type="button" onClick={onPanicLock} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-400/60 bg-red-400/[0.09] px-3 text-xs font-bold text-red-200 shadow-[0_0_16px_-7px_rgba(248,113,113,.95)] transition hover:bg-red-400/[0.18] hover:text-red-100" title="Lock every private category and return to a safe Library view" aria-label="Lock private categories"><ShieldCheck size={15} />Lock private</button>}
        <button type="button" onClick={toggleLayoutLock} data-testid="home-layout-lock-toggle" aria-pressed={layoutUnlocked} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition ${layoutUnlocked ? 'border-[rgb(var(--accent)/0.82)] bg-[rgb(var(--accent)/0.22)] text-ink shadow-[0_0_18px_-6px_rgb(var(--accent))]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)] text-ink hover:border-[rgb(var(--accent)/0.65)] hover:bg-[rgb(var(--accent)/0.10)]'}`} title={layoutUnlocked ? 'Save the widget arrangement and lock Home' : 'Unlock Home widgets for moving and resizing'}>{layoutUnlocked ? <Check size={14} /> : <Unlock size={14} />}{layoutUnlocked ? 'Done' : 'Unlock widgets'}</button>
        <button type="button" onClick={toggleSnapping} data-testid="home-layout-snap-toggle" aria-pressed={snapToGrid} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition ${snapToGrid ? 'border-[rgb(var(--accent)/0.48)] bg-[rgb(var(--accent)/0.10)] text-ink' : 'border-[rgb(var(--accent-2)/0.55)] bg-[rgb(var(--accent-2)/0.10)] text-[rgb(var(--accent-2))]'}`} title={snapToGrid ? 'Turn snapping off for free placement and overlapping' : 'Turn snapping on for automatic alignment'}><Grip size={14} />{snapToGrid ? 'Snap on' : 'Free move'}</button>
        <button type="button" onClick={() => setWidgetManagerOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)] px-3 text-xs font-bold text-ink transition hover:border-[rgb(var(--accent)/0.65)] hover:bg-[rgb(var(--accent)/0.10)]" title="Inspect and manage Home widgets"><Puzzle size={14} />Widgets</button>
        <button type="button" onClick={startWidgetImport} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[rgb(var(--accent)/0.62)] bg-[rgb(var(--accent)/0.10)] px-3 text-xs font-bold text-ink transition hover:bg-[rgb(var(--accent)/0.18)]" title="Choose a widget.json package to import"><FileUp size={14} />Import widget</button>
        <div className="flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)] p-1">{Object.entries(RANGES).map(([key, meta]) => <button key={key} onClick={() => setRange(key)} className={`rounded-md px-3 py-1.5 text-[11px] font-bold transition ${range === key ? 'bg-[rgb(var(--accent)/0.22)] text-ink shadow-[0_0_12px_-4px_rgb(var(--accent))]' : 'text-muted hover:text-ink'}`}>{meta.label}</button>)}</div>
        {hiddenPanes.length > 0 && <button type="button" onClick={() => setWidgetManagerOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)] px-3 text-[10px] font-bold text-muted hover:text-ink"><EyeOff size={13} />{hiddenPanes.length} hidden</button>}
      </div>
    </header>

    {hasLockedPrivateCategories && <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-400/35 bg-red-400/[0.065] px-4 py-3 shadow-[0_12px_28px_-22px_rgba(248,113,113,.9)]" data-testid="home-private-categories-locked-notice"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-400/40 bg-red-400/[0.10] text-red-200"><LockKeyhole size={15} /></span><span className="min-w-0"><span className="block text-[11px] font-black uppercase tracking-[0.16em] text-red-200">Private categories are locked</span><span className="mt-1 block text-[11px] leading-relaxed text-ink/90">Please unlock them in Library to view stats and news from these games.</span></span></div>}

    {layoutUnlocked && <div className="mb-4 flex items-center gap-3 rounded-xl border border-[rgb(var(--accent)/0.48)] bg-[rgb(var(--accent)/0.09)] px-4 py-3" role="status" data-testid="home-layout-editing"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgb(var(--accent)/0.18)] text-[rgb(var(--accent-2))]"><Move size={15} /></span><div className="min-w-0 flex-1"><p className="text-xs font-black text-ink">Widget canvas unlocked · {snapToGrid ? 'snapping to grid' : 'free placement'}</p><p className="mt-0.5 text-[10px] text-muted">Drag any widget title bar and use its corner grip to resize. Turn snapping off to place and overlap widgets freely. Right-click a title bar for more actions.</p></div><span className="font-mono text-[10px] text-muted">{snapToGrid ? `${gridColumns} columns` : 'Free canvas'}</span></div>}
    <div className="overflow-auto rounded-2xl [scrollbar-color:rgb(var(--accent))_transparent] [scrollbar-width:thin]">
      <div ref={homeGridHostRef} className={`${snapToGrid ? 'grid grid-flow-row-dense gap-3' : 'relative'} ${layoutUnlocked ? 'bg-[linear-gradient(rgb(var(--border)/0.16)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--border)/0.16)_1px,transparent_1px)] bg-[size:24px_24px] p-2' : ''}`} style={snapToGrid ? { gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`, gridAutoRows: `${HOME_GRID_ROW_HEIGHT}px` } : { width: `${freeCanvasWidth}px`, height: `${freeCanvasHeight}px` }} data-home-canvas data-home-grid={snapToGrid ? 'snap' : 'free'} data-home-grid-columns={gridColumns} data-home-layout-unlocked={layoutUnlocked ? 'true' : 'false'} data-home-snap={snapToGrid ? 'true' : 'false'}>
        {visibleWidgetIds.length ? visibleWidgetIds.map((id, index) => <HomePane key={id} id={id} {...paneProps} freePosition={resolvedFreePositions[id]} stackIndex={index}>{paneContent[id]}</HomePane>) : <p className="p-8 text-center text-xs text-muted">Every Home widget is hidden. Open Widgets to bring one back.</p>}
      </div>
    </div>
    {newsDetail && <NewsDetail item={newsDetail} onClose={() => setNewsDetail(null)} />}
    <WidgetManagerModal open={widgetManagerOpen} onClose={() => setWidgetManagerOpen(false)} communityWidgets={communityWidgets} hiddenIds={hiddenPanes} onToggleBuiltin={togglePane} onImport={importWidget} externalNotice={widgetImportNotice} />
  </section>;
}
function RailButton({ children, onClick }) { return <button onClick={onClick} className="grid h-7 w-7 place-items-center rounded-md border border-[rgb(var(--border))] text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink">{children}</button>; }

// News is intentionally a compact fixed rail. It belongs directly below the
// player's Top 5 rather than competing with the full-size movable dashboard
// cards, and it remains separate from the Updates section beneath it.
function PinnedNews({ news, railRef, onScroll, onOpen, onHide, rangeLabel }) {
  return <section className="mb-10 rounded-2xl border border-t-2 border-[rgb(var(--accent)/0.76)] bg-[linear-gradient(112deg,rgb(var(--accent)/0.18),rgb(var(--panel)/0.40)_46%,rgb(var(--accent-2)/0.12))] px-5 py-4 shadow-[0_0_40px_-24px_rgb(var(--accent)),0_18px_46px_-38px_rgb(var(--accent-2))]" data-testid="home-pinned-news">
    <div className="mb-3.5 flex items-center justify-between gap-2"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-[rgb(var(--accent-2)/0.46)] bg-[rgb(var(--accent-2)/0.14)] shadow-[0_0_18px_-4px_rgb(var(--accent-2))]"><Newspaper size={18} className="text-[rgb(var(--accent-2))]" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[rgb(var(--accent-2))]">Weekly game news</p><h2 className="mt-0.5 text-base font-black tracking-wide">What changed in your library</h2><p className="mt-0.5 text-[10.5px] text-muted">Fresh patch notes, updates, and stories · {rangeLabel.toLowerCase()}</p></div></div><div className="flex items-center gap-1"><RailButton onClick={() => onScroll(-1)}><ChevronLeft size={13} /></RailButton><RailButton onClick={() => onScroll(1)}><ChevronRight size={13} /></RailButton>{onHide && <button onClick={onHide} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink" title="Hide This Week's News"><EyeOff size={13} /></button>}</div></div>
    <div ref={railRef} onWheel={(event) => { if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) { event.currentTarget.scrollLeft += event.deltaY; event.preventDefault(); } }} className="flex gap-3 overflow-x-auto pb-1 [scrollbar-color:rgb(var(--accent))_transparent] [scrollbar-width:thin]">
      {news.loading && <p className="px-1 py-3 text-xs text-muted">Loading this week’s game news…</p>}
      {!news.loading && !news.items.length && <p className={`px-1 py-3 text-xs ${news.error ? 'text-amber-200' : 'text-muted'}`}>{news.error || `No game news in ${rangeLabel.toLowerCase()} yet.`}</p>}
      {news.items.map((item) => <button key={item.id} onClick={() => !item.homeLocked && onOpen?.(item)} disabled={item.homeLocked} className={`group flex w-[min(430px,84vw)] shrink-0 gap-3.5 rounded-xl border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.34)] p-3 text-left transition ${item.homeLocked ? 'cursor-default' : 'hover:-translate-y-0.5 hover:border-[rgb(var(--accent)/0.72)] hover:bg-[rgb(var(--surface)/0.58)]'}`}><NewsCover item={item} /><span className="min-w-0 flex-1"><p className="text-[10.5px] font-bold text-[rgb(var(--accent-2))]">{item.gameName || 'Game update'} · {relative(item.date)}</p><h3 className="mt-1 line-clamp-2 text-[14px] font-black leading-snug group-hover:text-[rgb(var(--accent))]">{item.title}</h3>{item.snippet && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">{item.snippet}</p>}</span></button>)}
    </div>
  </section>;
}

function GameUpdates({ updates, onRefresh, onCancel, onResolve, onSelect }) {
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
    <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><Download size={15} className="text-[rgb(var(--accent))]" /><div><h2 className="text-xs font-black uppercase tracking-[0.18em]">Game Updates</h2><p className="mt-1 text-[10px] text-muted">Launcher manifests plus safe local-version checks for independent games.</p></div></div><button onClick={updates.loading ? onCancel : onRefresh} className="inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] font-bold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink"><RefreshCw size={11} className={updates.loading ? 'animate-spin' : ''} />{updates.loading ? 'Cancel' : 'Refresh'}</button></div>
    <div className="mt-3 max-h-[320px] overflow-y-auto pr-1" data-testid="home-game-update-list">
    {updates.items.length ? <><div className="space-y-1.5">{updates.items.map((item) => {
      const needsComparison = item.status === 'attention';
      const tone = needsComparison ? 'amber' : 'emerald';
      const detail = item.homeLocked
        ? 'Update details are protected until this category is unlocked.'
        : needsComparison
        ? `${item.currentVersion && item.currentVersion !== 'Unknown' ? `Local clue ${item.currentVersion} · ` : ''}Latest public version · ${item.latestVersion}`
        : item.sourceKind === 'watch-page'
          ? `New update · ${item.currentVersion} → ${item.latestVersion}`
          : `New update · ${item.platform} · ${size(item.remainingBytes)} remaining`;
      return <div key={item.id} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${needsComparison ? 'border-amber-300/35 bg-amber-300/[0.065]' : 'border-emerald-400/30 bg-emerald-400/[0.055]'}`}>
        <button onClick={() => !item.homeLocked && onSelect?.(item.id)} disabled={item.homeLocked} className={`min-w-0 flex-1 text-left ${item.homeLocked ? 'cursor-default' : ''}`}>
          <span className="block truncate text-[11px] font-black text-ink">{item.name}</span>
          <span className={`mt-0.5 block text-[9px] font-bold uppercase tracking-wide ${tone === 'amber' ? 'text-amber-200' : 'text-emerald-300'}`}>{detail}</span>
          <span className="mt-0.5 block text-[9px] leading-snug text-muted">{item.homeLocked ? 'Unlock its category in Library to reveal this update.' : needsComparison ? item.currentVersion && item.currentVersion !== 'Unknown' ? 'NEO-LIB found a Windows executable version clue, but needs stronger game-owned evidence before comparing it. Check the history.' : 'A newer public patch was found, but this installed build could not reveal its version yet. Check the history to compare.' : 'There is a new update for this game you might want to check out.'}</span>
        </button>
        {item.homeLocked ? <span className="shrink-0 rounded-md border border-[rgb(var(--accent)/0.35)] px-2 py-1 text-[9px] font-bold text-[rgb(var(--accent-2))]">Locked</span> : <button onClick={() => item.sourceKind === 'watch-page' ? setHistoryItem(item) : openUpdate(item)} className={`shrink-0 rounded-md border px-2 py-1 text-[9px] font-bold ${tone === 'amber' ? 'border-amber-300/40 text-amber-200 hover:bg-amber-300/10' : 'border-emerald-400/35 text-emerald-300 hover:bg-emerald-400/10'}`}>{item.sourceKind === 'watch-page' ? 'Patch history' : 'Open downloads'}</button>}
      </div>;
    })}</div>{downloadError && <p role="status" className="mt-2 rounded-lg border border-amber-300/30 bg-amber-300/[0.08] px-3 py-2 text-[10px] font-bold text-amber-200">{downloadError}</p>}</> : <div className="mt-3 flex items-center gap-2 rounded-lg border border-[rgb(var(--border)/0.65)] bg-[rgb(var(--surface)/0.25)] p-3 text-[11px] text-muted"><ShieldCheck size={14} className="text-emerald-400" />{updates.loading ? 'Checking update sources…' : updates.error || `No verified updates found across ${updates.checked} checked source${updates.checked === 1 ? '' : 's'}.`}</div>}
    {!updates.loading && updates.needsSetup?.length > 0 && <div className="mt-3 rounded-lg border border-amber-300/25 bg-amber-300/[0.045] p-3 text-[10.5px] text-muted"><div className="flex flex-wrap items-center justify-between gap-2"><b className="text-amber-200">{updates.needsSetup.length} game{updates.needsSetup.length === 1 ? '' : 's'} need stronger update evidence.</b>{resolvableNeedsSetup.length > 0 && <button onClick={() => onResolve?.(resolvableNeedsSetup.map((item) => item.id).filter(Boolean))} className="rounded-md border border-amber-300/35 px-2 py-1 text-[9.5px] font-black text-amber-200 hover:bg-amber-300/10">Resolve checks</button>}</div><p className="mt-1">NEO-LIB already tries game-owned files, nearby manifests, executable metadata, official pages, and a bounded web search. It will not pretend an unproven result is up to date.</p><div className="mt-2 space-y-1.5">{updates.needsSetup.slice(0, 5).map((item) => item.homeLocked ? <p key={item.id} className="block max-w-full truncate text-[10px]"><span className="font-bold text-ink">Locked game</span> · Protected until unlock</p> : <button key={item.id} onClick={() => onResolve?.([item.id])} className="block max-w-full truncate text-left text-[10px] hover:text-ink"><span className="font-bold text-ink">{item.name}</span> · {item.missing} <span className="text-[rgb(var(--accent-2))]">Resolve</span></button>)}</div></div>}
    {!updates.loading && updates.launcherManagedCount > 0 && <p className="mt-2 text-[9.5px] text-muted">{updates.launcherManagedCount} launcher game{updates.launcherManagedCount === 1 ? '' : 's'} kept in launcher-managed state until their client exposes a trustworthy update signal—never counted as an update.</p>}
    </div>
  </section><UpdateHistoryModal item={historyItem} onClose={() => setHistoryItem(null)} /></>;
}
function TopPlayed({ games, scope, onScope, rangeLabel, summary, onSelect, onHide }) {
  return <section className="mx-auto mb-6 w-full max-w-5xl rounded-2xl border border-[rgb(var(--accent)/0.34)] bg-[linear-gradient(110deg,rgb(var(--accent)/0.13),rgb(var(--panel)/0.44)_44%,rgb(var(--accent-2)/0.09))] p-4 shadow-[0_0_34px_-22px_rgb(var(--accent))]" data-testid="home-top-played"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[rgb(var(--accent)/0.16)]"><Trophy size={17} className="text-[rgb(var(--accent))]" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">Your favorites in motion</p><h2 className="text-sm font-black">Top 5 played</h2></div></div><div className="flex items-center gap-2"><div className="flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.38)] p-0.5 text-[10px] font-bold"><button onClick={() => onScope('period')} className={`rounded-md px-2.5 py-1.5 ${scope === 'period' ? 'bg-[rgb(var(--accent)/0.20)] text-ink' : 'text-muted'}`}>{rangeLabel}</button><button onClick={() => onScope('all')} className={`rounded-md px-2.5 py-1.5 ${scope === 'all' ? 'bg-[rgb(var(--accent)/0.20)] text-ink' : 'text-muted'}`}>All time</button></div>{onHide && <button onClick={onHide} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink" title="Hide Top 5 played"><EyeOff size={13} /></button>}</div></div><div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-y border-[rgb(var(--border)/0.46)] py-2 text-[10px] text-muted"><span className="font-bold uppercase tracking-[0.14em] text-[rgb(var(--accent-2))]">{rangeLabel} at a glance</span><span><b className="text-ink">{hours(summary?.totalMinutes)}</b> played</span><span><b className="text-ink">{summary?.gamesTouched || 0}</b> games touched</span><span><b className="text-ink">{summary?.today || 0}</b> today</span><span><b className="text-ink">{summary?.library || 0}</b> in Library</span></div>{games.length ? <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{games.map((game, index) => <li key={game.id}><button onClick={() => onSelect?.(game.id)} className="group flex w-full items-center gap-2.5 rounded-xl border border-[rgb(var(--border)/0.8)] bg-[rgb(var(--surface)/0.34)] p-2.5 text-left transition hover:-translate-y-0.5 hover:border-[rgb(var(--accent)/0.6)] hover:bg-[rgb(var(--surface)/0.58)]"><span className="w-4 font-mono text-[10px] font-black text-[rgb(var(--accent-2))]">{index + 1}</span><Cover game={game} className="h-10 w-[68px]" /><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-black group-hover:text-[rgb(var(--accent))]">{game.name}</span><span className="mt-0.5 block text-[9.5px] text-muted">{PLATFORM[platformOf(game)]}</span><span className="mt-1 block text-[11px] font-bold text-[rgb(var(--accent-2))]">{hours(game.playtime)}</span></span></button></li>)}</ol> : <p className="mt-4 text-center text-xs text-muted">Import or track playtime to begin your ranking.</p>}</section>;
}
function HomePane({ id, children, paneOrder, draggedPane, dragInsertion, startPaneDrag, togglePane, layoutUnlocked, setLayoutUnlocked, gridColumns, snapToGrid, sizeForWidget, onResize, onResetSize, freePosition, stackIndex, onFreePosition, onBringFront, onToggleSnap }) {
  const widget = homeWidget(id);
  const isDragging = draggedPane === id;
  const isPeer = !!draggedPane && !isDragging;
  const insertionHere = dragInsertion?.id === id;
  const savedSize = sizeForWidget(id) || { cols: gridColumns, rows: 2 };
  const [draftSize, setDraftSize] = React.useState(null);
  const [draftFreePosition, setDraftFreePosition] = React.useState(null);
  const [movingFreely, setMovingFreely] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState(null);
  const resizeSession = React.useRef(null);
  const moveSession = React.useRef(null);
  const displaySize = draftSize || savedSize;
  const displayFreePosition = draftFreePosition || freePosition;
  React.useEffect(() => { if (!resizeSession.current) setDraftSize(null); }, [savedSize.cols, savedSize.rows]);
  React.useEffect(() => { if (!moveSession.current && !resizeSession.current) setDraftFreePosition(null); }, [freePosition.x, freePosition.y, freePosition.width, freePosition.height]);
  React.useEffect(() => {
    if (!contextMenu) return undefined;
    const close = () => setContextMenu(null);
    const onKey = (event) => { if (event.key === 'Escape') close(); };
    window.addEventListener('pointerdown', close);
    window.addEventListener('blur', close);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('pointerdown', close); window.removeEventListener('blur', close); window.removeEventListener('keydown', onKey); };
  }, [contextMenu]);
  const calculateResize = (event) => {
    const session = resizeSession.current;
    if (!session) return snapToGrid ? savedSize : freePosition;
    if (!session.snap) return {
      ...session.position,
      width: Math.max(160, session.position.width + event.clientX - session.x),
      height: Math.max(80, session.position.height + event.clientY - session.y),
    };
    return normaliseWidgetSize(widget, {
      cols: session.size.cols + Math.round((event.clientX - session.x) / session.columnStep),
      rows: session.size.rows + Math.round((event.clientY - session.y) / session.rowStep),
    }, gridColumns);
  };
  const startResize = (event) => {
    if (!layoutUnlocked || event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    const grid = event.currentTarget.closest('[data-home-grid]');
    const width = grid?.getBoundingClientRect().width || 1;
    resizeSession.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, snap: snapToGrid, size: savedSize, position: freePosition, columnStep: Math.max(1, (width - HOME_GRID_GAP * (gridColumns - 1)) / gridColumns + HOME_GRID_GAP), rowStep: HOME_GRID_ROW_HEIGHT + HOME_GRID_GAP };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (snapToGrid) setDraftSize(savedSize); else { setDraftFreePosition(freePosition); onBringFront(id); }
  };
  const moveResize = (event) => {
    if (resizeSession.current?.pointerId !== event.pointerId) return;
    if (snapToGrid) setDraftSize(calculateResize(event)); else setDraftFreePosition(calculateResize(event));
  };
  const finishResize = (event) => {
    if (resizeSession.current?.pointerId !== event.pointerId) return;
    const next = calculateResize(event);
    resizeSession.current = null;
    setDraftSize(null);
    setDraftFreePosition(null);
    if (snapToGrid) onResize(id, next); else onFreePosition(id, next);
  };
  const startMove = (event) => {
    if (!layoutUnlocked || event.button !== 0 || event.target.closest('button')) return;
    if (snapToGrid) { startPaneDrag(id, event); return; }
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    moveSession.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, position: freePosition };
    setDraftFreePosition(freePosition);
    setMovingFreely(true);
    onBringFront(id);
  };
  const moveFree = (event) => {
    const session = moveSession.current;
    if (!session || session.pointerId !== event.pointerId) return;
    setDraftFreePosition({ ...session.position, x: Math.max(0, session.position.x + event.clientX - session.x), y: Math.max(0, session.position.y + event.clientY - session.y) });
  };
  const finishFreeMove = (event) => {
    const session = moveSession.current;
    if (!session || session.pointerId !== event.pointerId) return;
    const next = { ...session.position, x: Math.max(0, session.position.x + event.clientX - session.x), y: Math.max(0, session.position.y + event.clientY - session.y) };
    moveSession.current = null;
    setMovingFreely(false);
    setDraftFreePosition(null);
    onFreePosition(id, next);
  };
  const openContextMenu = (event) => {
    event.preventDefault(); event.stopPropagation();
    setContextMenu({ x: Math.min(event.clientX, window.innerWidth - 224), y: Math.min(event.clientY, window.innerHeight - 324) });
  };
  const openContextMenuButton = (event) => {
    event.preventDefault(); event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setContextMenu({ x: Math.min(rect.right, window.innerWidth - 224), y: Math.min(rect.bottom + 4, window.innerHeight - 324) });
  };
  const adjust = (width, height) => snapToGrid ? onResize(id, { cols: savedSize.cols + width, rows: savedSize.rows + height }) : onFreePosition(id, { ...freePosition, width: Math.max(160, freePosition.width + width * 40), height: Math.max(80, freePosition.height + height * 40) });
  const insertionClass = dragInsertion?.horizontal
    ? `-bottom-1 -top-1 h-auto w-0.5 ${dragInsertion.after ? '-right-3' : '-left-3'}`
    : `-left-2 -right-2 h-0.5 ${dragInsertion?.after ? '-bottom-3' : '-top-3'}`;
  const placementStyle = snapToGrid
    ? { order: paneOrder.indexOf(id), gridColumn: `span ${displaySize.cols} / span ${displaySize.cols}`, gridRow: `span ${displaySize.rows} / span ${displaySize.rows}` }
    : { position: 'absolute', left: displayFreePosition.x, top: displayFreePosition.y, width: displayFreePosition.width, height: displayFreePosition.height, zIndex: movingFreely ? 90 : stackIndex + 1 };
  const sizeLabel = snapToGrid ? `${displaySize.cols}×${displaySize.rows}` : `${Math.round(displayFreePosition.width)}×${Math.round(displayFreePosition.height)}`;
  return <motion.div layout={snapToGrid} transition={{ layout: { duration: 0.22, ease: 'easeOut' } }} style={placementStyle} className={`group/homepane flex min-h-0 flex-col overflow-hidden rounded-xl border bg-[rgb(var(--surface)/0.16)] transition ${snapToGrid ? 'relative' : ''} ${layoutUnlocked ? 'border-[rgb(var(--accent)/0.48)] ring-1 ring-[rgb(var(--accent)/0.10)]' : 'border-transparent'} ${isDragging || movingFreely ? 'scale-[0.992] opacity-95 shadow-2xl' : isPeer && snapToGrid ? 'opacity-60' : ''}`} data-home-pane-id={id} data-home-widget-size={sizeLabel} data-testid={`home-pane-${id}`}>
    <div onPointerDown={startMove} onPointerMove={moveFree} onPointerUp={finishFreeMove} onPointerCancel={finishFreeMove} onContextMenu={openContextMenu} className={`flex h-8 shrink-0 select-none items-center gap-2 border-b px-2 ${layoutUnlocked ? 'cursor-grab border-[rgb(var(--accent)/0.35)] bg-[rgb(var(--accent)/0.12)] active:cursor-grabbing' : 'border-[rgb(var(--border)/0.38)] bg-[rgb(var(--panel)/0.24)]'}`} data-home-widget-titlebar={id}>
      <GripVertical size={13} className={layoutUnlocked ? 'text-[rgb(var(--accent-2))]' : 'text-muted/55'} />
      <span className="min-w-0 flex-1 truncate text-[10px] font-black uppercase tracking-[0.13em] text-ink">{widget?.label || id}</span>
      <span className="font-mono text-[9px] text-muted">{sizeLabel}</span>
      <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={openContextMenuButton} className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-[rgb(var(--accent)/0.14)] hover:text-ink" aria-label={`Open ${widget?.label || id} widget menu`} title="Widget options"><Menu size={12} /></button>
    </div>
    <div className="min-h-0 flex-1 overflow-auto p-1.5 [scrollbar-color:rgb(var(--accent))_transparent] [scrollbar-width:thin]">{children}</div>
    {layoutUnlocked && <button type="button" onPointerDown={startResize} onPointerMove={moveResize} onPointerUp={finishResize} onPointerCancel={finishResize} className="absolute bottom-0 right-0 z-30 grid h-7 w-7 cursor-nwse-resize place-items-center rounded-tl-lg border-l border-t border-[rgb(var(--accent)/0.45)] bg-[rgb(var(--panel)/0.92)] text-[rgb(var(--accent-2))] shadow-[-4px_-4px_14px_-8px_rgb(var(--accent))]" aria-label={`Resize ${widget?.label || id}`} title="Drag to resize"><Grip size={13} /></button>}
    {insertionHere && <span className={`pointer-events-none absolute z-40 rounded-full bg-[rgb(var(--accent))] shadow-[0_0_12px_rgb(var(--accent))] ${insertionClass}`} />}
    {contextMenu && renderForegroundPortal(<WidgetContextMenu x={contextMenu.x} y={contextMenu.y} label={widget?.label || id} unlocked={layoutUnlocked} snapToGrid={snapToGrid} size={snapToGrid ? savedSize : freePosition} widget={widget} columns={gridColumns} onUnlock={() => { setLayoutUnlocked(true); setContextMenu(null); }} onToggleSnap={() => { onToggleSnap(); setContextMenu(null); }} onBringFront={() => { onBringFront(id); setContextMenu(null); }} onHide={() => { togglePane(id, true); setContextMenu(null); }} onAdjust={(width, height) => { adjust(width, height); setContextMenu(null); }} onReset={() => { onResetSize(id); setContextMenu(null); }} />)}
  </motion.div>;
}

function WidgetContextMenu({ x, y, label, unlocked, snapToGrid, size, widget, columns, onUnlock, onToggleSnap, onBringFront, onHide, onAdjust, onReset }) {
  const canNarrow = snapToGrid ? size.cols > Math.min(widget?.layout?.minCols || 1, columns) : size.width > 160;
  const canWiden = snapToGrid ? size.cols < columns : true;
  const canShorten = snapToGrid ? size.rows > (widget?.layout?.minRows || 1) : size.height > 80;
  const canGrow = true;
  const item = 'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[11px] font-bold text-ink hover:bg-[rgb(var(--accent)/0.12)] disabled:cursor-not-allowed disabled:opacity-35';
  return <div className="fixed z-[170] w-52 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.98)] p-1.5 shadow-2xl backdrop-blur-xl" style={{ left: x, top: y }} role="menu" aria-label={`${label} widget options`} onPointerDown={(event) => event.stopPropagation()}>
    <p className="truncate border-b border-[rgb(var(--border)/0.55)] px-2.5 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[rgb(var(--accent-2))]">{label}</p>
    <button type="button" className={item} onClick={onUnlock}><Move size={13} />{unlocked ? `${snapToGrid ? 'Grid' : 'Free'} editing is active` : 'Move and resize widgets'}</button>
    <button type="button" className={item} onClick={onToggleSnap}><Grip size={13} />{snapToGrid ? 'Turn snapping off' : 'Snap widgets to grid'}</button>
    <button type="button" className={item} onClick={onBringFront}><Sparkles size={13} />{snapToGrid ? 'Move to end' : 'Bring to front'}</button>
    <div className="grid grid-cols-2 gap-1 border-y border-[rgb(var(--border)/0.45)] py-1">
      <button type="button" className={item} disabled={!canNarrow} onClick={() => onAdjust(-1, 0)}><Minimize2 size={13} />Narrower</button>
      <button type="button" className={item} disabled={!canWiden} onClick={() => onAdjust(1, 0)}><Maximize2 size={13} />Wider</button>
      <button type="button" className={item} disabled={!canShorten} onClick={() => onAdjust(0, -1)}><Minimize2 size={13} />Shorter</button>
      <button type="button" className={item} disabled={!canGrow} onClick={() => onAdjust(0, 1)}><Maximize2 size={13} />Taller</button>
    </div>
    <button type="button" className={item} onClick={onReset}><RotateCcw size={13} />Reset size</button>
    <button type="button" className={item} onClick={onHide}><EyeOff size={13} />Hide this widget</button>
  </div>;
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

function ReleaseArtwork({ release }) {
  const [failed, setFailed] = useState(false);
  if (release.image && !failed) return <img src={release.image} alt="" className="h-14 w-24 shrink-0 rounded-md object-cover" onError={() => setFailed(true)} />;
  const initials = String(release.platform || 'Game').split(/\s+/).map(part => part[0]).join('').slice(0, 3).toUpperCase();
  return <span aria-hidden="true" className="flex h-14 w-24 shrink-0 items-center justify-center rounded-md border border-[rgb(var(--accent-2)/0.30)] bg-[linear-gradient(135deg,rgb(var(--accent)/0.18),rgb(var(--accent-2)/0.10))] text-xs font-black tracking-[0.16em] text-[rgb(var(--accent-2))]">{initials}</span>;
}

function ReleasedThisWeek({ releases, onRefresh, onCancel }) {
  const open = (release) => { if (window.api?.openExternal) window.api.openExternal(release.url); else window.open(release.url, '_blank'); };
  const usingFallback = releases.tier === 'semi-major';
  const usingPopularFallback = releases.tier === 'popular';
  const subtitle = usingFallback
    ? 'No major launch is verified — showing noteworthy releases from the last 5 days.'
    : usingPopularFallback
      ? 'No major launch is verified — showing popular releases from the last 5 days.'
      : 'Major launches stay for 14 days; smaller verified releases expire after 5.';
  return <section className="rounded-xl border border-[rgb(var(--border))] bg-[linear-gradient(130deg,rgb(var(--accent)/0.10),rgb(var(--panel)/0.35)_46%,rgb(var(--accent-2)/0.07))] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-2"><CalendarDays size={15} className="text-[rgb(var(--accent-2))]" /><div><h2 className="text-xs font-black uppercase tracking-[0.18em]">Recent Game Releases</h2><p className="mt-1 text-[10px] text-muted">{subtitle}</p></div></div><button onClick={releases.loading ? onCancel : onRefresh} className="inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] font-bold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink" title={releases.loading ? 'Cancel release discovery' : 'Refresh recent release discovery'}><RefreshCw size={11} className={releases.loading ? 'animate-spin text-[rgb(var(--accent))]' : ''} />{releases.loading ? 'Cancel' : 'Refresh'}</button></div>{(usingFallback || usingPopularFallback) && releases.items.length > 0 && <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--accent-2)/0.35)] bg-[rgb(var(--accent-2)/0.10)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[rgb(var(--accent-2))]">{usingFallback ? 'Noteworthy picks · no major releases found' : 'Popular new releases · no major picks found'}</div>}{releases.loading && !releases.items.length ? <p className="mt-4 text-xs text-muted">Checking official publishers and Steam…</p> : releases.items.length ? <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{releases.items.map((release) => <button key={release.id} onClick={() => open(release)} className="group flex min-w-0 gap-3 rounded-lg border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.34)] p-2.5 text-left hover:border-[rgb(var(--accent)/0.55)] hover:bg-[rgb(var(--surface)/0.60)]"><ReleaseArtwork key={`${release.id}-${release.image}`} release={release} /><span className="min-w-0 flex-1"><span className="flex items-start gap-1"><span className="line-clamp-2 flex-1 text-xs font-black leading-snug group-hover:text-[rgb(var(--accent))]">{release.title}</span><ExternalLink size={11} className="mt-0.5 shrink-0 text-muted" /></span><span className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-muted"><span>{release.platform}</span><span>{release.releaseDate}</span></span><span className="mt-1 block truncate text-[10px] font-bold text-[rgb(var(--accent-2))]">{release.why}</span></span></button>)}</div> : <p className="mt-4 text-xs leading-relaxed text-muted">{releases.error || 'No recent qualifying release was verified through the current official sources.'}</p>}<p className="mt-3 text-[9.5px] leading-relaxed text-muted/80">{releases.criteria || 'Discovery criteria appear after the first successful refresh.'}</p></section>;
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

function PlayNext({ recommendations, onSelect }) {
  return <section className="rounded-xl border border-[rgb(var(--accent)/0.35)] bg-[linear-gradient(120deg,rgb(var(--accent)/0.12),rgb(var(--panel)/0.35)_48%,rgb(var(--accent-2)/0.08))] p-4 shadow-[0_0_32px_-20px_rgb(var(--accent))]"><div className="flex items-center gap-2.5"><Sparkles size={17} className="text-[rgb(var(--accent-2))]" /><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">What should I play?</p><h2 className="text-sm font-black">A useful nudge from your own library</h2></div></div>{recommendations.length ? <div className="mt-3 space-y-2">{recommendations.map(({ game, label, reason, action, update }) => <button key={game.id} onClick={() => onSelect?.(game.id)} className="group flex min-w-0 items-center gap-3 rounded-xl border border-[rgb(var(--border)/0.85)] bg-[rgb(var(--surface)/0.36)] p-2.5 text-left hover:border-[rgb(var(--accent)/0.55)] hover:bg-[rgb(var(--surface)/0.6)]"><Cover game={game} className="h-12 w-20" /><span className="min-w-0 flex-1"><span className={`block text-[9.5px] font-bold uppercase tracking-wider ${update ? 'new-update-reactive text-emerald-300' : 'text-[rgb(var(--accent-2))]'}`}>{label}</span><span className="block truncate text-[12px] font-black group-hover:text-[rgb(var(--accent))]">{game.name}</span><span className="mt-0.5 block line-clamp-2 text-[10.5px] leading-relaxed text-muted">{reason}</span></span><span className="shrink-0 text-[10px] font-bold text-[rgb(var(--accent))]">{action} ›</span></button>)}</div> : <p className="mt-3 text-xs text-muted">Add or import a few games and NEO-LIB will begin surfacing timely reasons to play them.</p>}</section>;
}

function readableBytes(bytes) { const value = Number(bytes || 0); if (value < 1024 ** 2) return `${Math.round(value / 1024)} KB`; if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`; return `${(value / 1024 ** 3).toFixed(1)} GB`; }

function StorageCentre({ games, storage, onScan, onCancel, onSelect }) {
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
  return <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-2"><HardDrive size={15} className="text-[rgb(var(--accent))]" /><div><h2 className="text-xs font-black uppercase tracking-[0.18em]">Storage control centre</h2><p className="mt-1 text-[10px] text-muted">Validated game folders and recognised mod folders only—read-only.</p></div></div><button onClick={storage.loading ? onCancel : onScan} className="inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] font-bold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink"><RefreshCw size={11} className={storage.loading ? 'animate-spin text-[rgb(var(--accent))]' : ''} />{storage.loading ? 'Cancel' : storage.scannedAt ? 'Rescan' : 'Scan sizes'}</button></div>{storage.error && <p className="mt-3 rounded-lg border border-amber-300/30 bg-amber-300/[0.07] px-3 py-2 text-[10px] text-amber-200">{storage.error}</p>}{storage.scannedAt ? <><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2"><Stat label="Folders measured" value={results.length} /><Stat label="Total" value={`${hasEstimate ? '≥ ' : ''}${readableBytes(total)}`} /><Stat label="Mod content" value={readableBytes(mods)} /></div>{openError && <p className="mt-3 rounded-lg border border-red-400/30 bg-red-400/[0.07] px-3 py-2 text-[10px] text-red-200">{openError}</p>}{storage.skipped?.length > 0 && <div className="mt-3 rounded-lg border border-amber-300/25 bg-amber-300/[0.05] px-3 py-2"><p className="text-[10px] font-bold text-amber-200">{storage.skipped.length} launch target{storage.skipped.length === 1 ? '' : 's'} skipped instead of guessing.</p><p className="mt-0.5 truncate text-[9.5px] text-muted" title={storage.skipped.slice(0, 3).map((item) => `${item.name}: ${item.reason}`).join(' · ')}>{storage.skipped.slice(0, 3).map((item) => `${item.name}: ${item.reason}`).join(' · ')}</p></div>}<div className="mt-3 max-h-[430px] space-y-1.5 overflow-y-auto pr-1" data-testid="storage-results-list">{results.map((entry) => <div key={entry.id} className="flex items-center gap-2 rounded-lg border border-[rgb(var(--border)/0.68)] bg-[rgb(var(--surface)/0.23)] p-2 transition hover:border-[rgb(var(--accent)/0.45)]"><button onClick={() => onSelect?.(entry.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left"><Cover game={entry.game} className="h-8 w-14" /><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-black text-ink">{entry.game.name}</span><span className="mt-0.5 block truncate font-mono text-[8.5px] text-muted" title={entry.game.homeLocked ? 'Protected folder' : entry.root}>{entry.game.homeLocked ? 'Protected folder' : entry.root}</span><span className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[8.5px] text-muted"><span>{Number(entry.files || 0).toLocaleString()} files</span>{entry.modBytes > 0 && <span className="text-[rgb(var(--accent-2))]">mods {readableBytes(entry.modBytes)}</span>}{entry.truncated && <span className="text-amber-200">partial scan</span>}</span></span></button><div className="flex shrink-0 items-center gap-2"><span className="font-mono text-[10px] font-bold text-ink">{entry.truncated ? '≥ ' : ''}{readableBytes(entry.bytes)}</span>{entry.game.homeLocked ? <span className="inline-flex h-7 items-center rounded-md border border-[rgb(var(--accent)/0.35)] px-2 text-[9px] font-bold text-[rgb(var(--accent-2))]">Locked</span> : <button onClick={() => openFolder(entry)} className="inline-flex h-7 items-center gap-1 rounded-md border border-[rgb(var(--border))] px-2 text-[9px] font-bold text-[rgb(var(--accent-2))] hover:border-[rgb(var(--accent)/0.55)] hover:text-ink" title={`Open measured folder: ${entry.root}`}><FolderOpen size={11} />Open</button>}</div></div>)}{!results.length && <p className="rounded-lg border border-dashed border-[rgb(var(--border))] p-4 text-center text-xs text-muted">No valid game folders were measured. Review the skipped launch targets above, then use Customize to correct a game’s executable.</p>}</div><p className="mt-2 text-[9px] leading-relaxed text-muted/85">Every size is tied to the shown folder. “Partial scan” means NEO-LIB stopped at its safety limit, so the displayed total is at least that large.</p></> : <p className="mt-4 text-xs leading-relaxed text-muted">Scan when you want a current view. NEO-LIB never crawls entire drives; it walks only validated configured game folders.</p>}</section>;
}

function GamingChronicle({ entries, onSelect }) {
  const gamesSeen = new Set(entries.map((entry) => entry.game.id)).size;
  const updates = entries.filter((entry) => entry.type === 'New update').length;
  return <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-4"><div className="flex items-center gap-2"><Archive size={15} className="text-[rgb(var(--accent-2))]" /><div><h2 className="text-xs font-black uppercase tracking-[0.18em]">Gaming chronicle</h2><p className="mt-1 text-[10px] text-muted">Your personal library story — milestones, sessions, ratings, and updates.</p></div></div><div className="mt-3 flex gap-4"><span className="text-[10px] text-muted"><b className="text-ink">{entries.length}</b> moments</span><span className="text-[10px] text-muted"><b className="text-ink">{gamesSeen}</b> games</span><span className="text-[10px] text-muted"><b className="text-ink">{updates}</b> updates</span></div>{entries.length ? <div className="mt-3 max-h-[275px] space-y-2 overflow-y-auto pr-1">{entries.map((entry, index) => <button key={`${entry.game.id}-${entry.type}-${entry.at}-${index}`} onClick={() => onSelect?.(entry.game.id)} className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1 text-left hover:bg-[rgb(var(--accent)/0.07)]"><span className="h-2 w-2 shrink-0 rounded-full bg-[rgb(var(--accent-2))] shadow-[0_0_8px_rgb(var(--accent-2))]" /><Cover game={entry.game} className="h-7 w-11" /><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-bold">{entry.game.name} <span className="font-normal text-muted">· {entry.type}</span></span><span className="block truncate text-[10px] text-muted">{entry.detail}</span></span><span className="text-[9px] text-muted">{relative(entry.at)}</span></button>)}</div> : <p className="mt-4 text-xs text-muted">Play, rate, or add games to begin your chronicle.</p>}</section>;
}
