import React from 'react';
import { Archive, CalendarDays, ChevronLeft, ChevronRight, Clock3, EyeOff, ExternalLink, Gamepad2, GripVertical, HardDrive, Newspaper, RefreshCw, Sparkles, Star, Trophy, X } from 'lucide-react';

const RANGES = { today: { label: 'Today', days: 1 }, week: { label: 'This week', days: 7 }, month: { label: 'This month', days: 31 } };
const PLATFORM = { steam: 'Steam', epic: 'Epic', gog: 'GOG', ea: 'EA app', ubisoft: 'Ubisoft', battlenet: 'Battle.net', itch: 'itch.io', local: 'Local' };
const HOME_PANES = [
  ['news', 'News'], ['play-next', 'What should I play?'], ['activity', 'Your week'], ['health', 'Library Health'],
  ['best-games', 'My Best Games'], ['released-week', 'Released This Week'], ['library-tools', 'Storage & Chronicle'], ['recent', 'Recently active'],
];

function platformOf(game) {
  const source = (game?.source || '').toLowerCase();
  if (PLATFORM[source]) return source;
  if (game?.appid) return 'steam';
  if (game?.gogId) return 'gog';
  if (/itch\.io/i.test(game?.website || '')) return 'itch';
  return 'local';
}
function hours(minutes) { const value = Number(minutes || 0) / 60; return value ? `${value < 10 ? value.toFixed(1) : Math.round(value)}h` : '—'; }
function relative(ms) { if (!ms) return 'Never'; const days = Math.floor((Date.now() - ms) / 86400000); return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : days < 7 ? `${days}d ago` : days < 31 ? `${Math.floor(days / 7)}w ago` : `${Math.floor(days / 30)}mo ago`; }
function added(ms) { return ms ? new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ms)) : '—'; }

export default function HomeHub({ games = [], onSelect, onOpenPlaytimeImport, onOpenTidyUp, resting = false, homeLayout = {}, onUpdateHomeLayout }) {
  const [range, setRange] = React.useState('week');
  const [rankingScope, setRankingScope] = React.useState('period');
  const [news, setNews] = React.useState({ loading: false, items: [] });
  const [storage, setStorage] = React.useState({ loading: false, scannedAt: 0, results: [] });
  const [weeklyReleases, setWeeklyReleases] = React.useState({ loading: false, items: [], criteria: '', fetchedAt: 0, error: '' });
  const [newsDetail, setNewsDetail] = React.useState(null);
  const [draggedPane, setDraggedPane] = React.useState(null);
  const railRef = React.useRef(null);
  const rangeMeta = RANGES[range];
  const cutoff = Date.now() - rangeMeta.days * 86400000;
  const played = React.useMemo(() => games.filter((game) => Number(game.lastPlayedAt || 0) >= cutoff).sort((a, b) => Number(b.lastPlayedAt || 0) - Number(a.lastPlayedAt || 0)), [games, cutoff]);
  const topFive = React.useMemo(() => [...(rankingScope === 'all' ? games : played)].filter((game) => Number(game.playtime || 0) > 0).sort((a, b) => Number(b.playtime || 0) - Number(a.playtime || 0)).slice(0, 5), [games, played, rankingScope]);
  const totalMinutes = played.reduce((sum, game) => sum + Number(game.playtime || 0), 0);
  const health = React.useMemo(() => getLibraryHealth(games), [games]);
  const recommendations = React.useMemo(() => getRecommendations(games, news.items), [games, news.items]);
  const chronicle = React.useMemo(() => getChronicle(games, news.items), [games, news.items]);
  const bestGames = React.useMemo(() => [...games].filter((game) => Number(game.rating || 0) > 0).sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0) || Number(b.metacritic || 0) - Number(a.metacritic || 0) || Number(b.playtime || 0) - Number(a.playtime || 0)).slice(0, 10), [games]);
  const paneOrder = React.useMemo(() => {
    const saved = Array.isArray(homeLayout.order) ? homeLayout.order : [];
    return [...saved.filter((id) => HOME_PANES.some(([known]) => known === id)), ...HOME_PANES.map(([id]) => id).filter((id) => !saved.includes(id))];
  }, [homeLayout.order]);
  const hiddenPanes = Array.isArray(homeLayout.hidden) ? homeLayout.hidden : [];
  const updateLayout = (patch) => onUpdateHomeLayout?.({ ...homeLayout, ...patch });
  const movePane = (target) => {
    if (!draggedPane || draggedPane === target) return;
    const next = paneOrder.filter((id) => id !== draggedPane);
    next.splice(next.indexOf(target), 0, draggedPane);
    updateLayout({ order: next });
    setDraggedPane(null);
  };
  const togglePane = (id, hidden) => updateLayout({ hidden: hidden ? [...new Set([...hiddenPanes, id])] : hiddenPanes.filter((item) => item !== id) });
  const paneProps = { paneOrder, hiddenPanes, draggedPane, setDraggedPane, movePane, togglePane };

  React.useEffect(() => {
    if (resting || !window.api?.fetchAllNews) return undefined;
    const eligible = games.filter((game) => game && (game.appid || game.gogId || /itch\.io/.test(game.website || '') || game.source === 'itch'));
    if (!eligible.length) { setNews({ loading: false, items: [] }); return undefined; }
    let cancelled = false;
    setNews((value) => ({ ...value, loading: true }));
    window.api.fetchAllNews({ games: eligible.map(({ id, appid, name, website, source, gogId }) => ({ id, appid, name, website, source, gogId })), days: rangeMeta.days, force: false })
      .then((result) => { if (!cancelled) setNews({ loading: false, items: (result?.items || []).sort((a, b) => Number(b.date || 0) - Number(a.date || 0)) }); })
      .catch(() => { if (!cancelled) setNews({ loading: false, items: [] }); });
    return () => { cancelled = true; };
  }, [games, rangeMeta.days, resting]);

  const refreshWeeklyReleases = React.useCallback(async (force = false) => {
    if (resting || !window.api?.fetchWeeklyReleases) return;
    setWeeklyReleases((value) => ({ ...value, loading: true, error: '' }));
    try {
      const result = await window.api.fetchWeeklyReleases({ force });
      setWeeklyReleases({ loading: false, items: result?.items || [], criteria: result?.criteria || '', fetchedAt: result?.fetchedAt || 0, error: result?.ok === false ? (result.error || 'Release feed unavailable.') : '' });
    } catch {
      setWeeklyReleases((value) => ({ ...value, loading: false, error: 'Release feed unavailable.' }));
    }
  }, [resting]);

  React.useEffect(() => { refreshWeeklyReleases(false); }, [refreshWeeklyReleases]);

  const scrollNews = (direction) => railRef.current?.scrollBy({ left: direction * 420, behavior: 'smooth' });
  const scanStorage = async () => {
    if (!window.api?.scanGameStorage) return;
    setStorage((value) => ({ ...value, loading: true }));
    const result = await window.api.scanGameStorage({ games: games.map(({ id, exePath }) => ({ id, exePath })) });
    setStorage({ loading: false, scannedAt: result?.scannedAt || 0, results: result?.results || [] });
  };
  return <section className="flex h-full flex-col overflow-y-auto px-5 py-5 lg:px-7" data-testid="home-hub">
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[rgb(var(--accent-2))]">Your NEO-LIB</p><h1 className="font-display text-3xl font-black tracking-tight">Home</h1><p className="mt-1 text-xs text-muted">Your games, your time, and the updates that matter.</p></div>
      <div className="flex flex-wrap justify-end gap-2"><div className="flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)] p-1">{Object.entries(RANGES).map(([key, meta]) => <button key={key} onClick={() => setRange(key)} className={`rounded-md px-3 py-1.5 text-[11px] font-bold transition ${range === key ? 'bg-[rgb(var(--accent)/0.22)] text-ink shadow-[0_0_12px_-4px_rgb(var(--accent))]' : 'text-muted hover:text-ink'}`}>{meta.label}</button>)}</div>{hiddenPanes.length > 0 && <div className="flex items-center gap-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)] p-1">{hiddenPanes.map((id) => <button key={id} onClick={() => togglePane(id, false)} className="rounded px-2 py-1.5 text-[10px] font-bold text-muted hover:bg-[rgb(var(--accent)/0.14)] hover:text-ink">Show {HOME_PANES.find(([known]) => known === id)?.[1] || 'pane'}</button>)}</div>}</div>
    </header>

    <HomePane id="news" {...paneProps}><section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Newspaper size={14} className="text-[rgb(var(--accent-2))]" /><h2 className="text-xs font-black uppercase tracking-[0.18em]">News · {rangeMeta.label}</h2></div><div className="flex gap-1"><RailButton onClick={() => scrollNews(-1)}><ChevronLeft size={14} /></RailButton><RailButton onClick={() => scrollNews(1)}><ChevronRight size={14} /></RailButton></div></div>
      <div ref={railRef} onWheel={(event) => { if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) { event.currentTarget.scrollLeft += event.deltaY; event.preventDefault(); } }} className="flex gap-2.5 overflow-x-auto pb-2 [scrollbar-color:rgb(var(--accent))_transparent] [scrollbar-width:thin]">
        {news.loading && <p className="px-1 py-4 text-xs text-muted">Loading your game news…</p>}
        {!news.loading && !news.items.length && <p className="px-1 py-4 text-xs text-muted">No updates in this period yet. News from Steam, GOG, and itch.io will appear here.</p>}
        {news.items.map((item) => <button key={item.id} onClick={() => setNewsDetail(item)} className="group flex w-[min(380px,82vw)] shrink-0 gap-3 rounded-xl border border-[rgb(var(--border)/0.8)] bg-[rgb(var(--surface)/0.35)] p-3.5 text-left transition hover:border-[rgb(var(--accent)/0.55)] hover:bg-[rgb(var(--accent)/0.07)]"><NewsCover item={item} /><span className="min-w-0 flex-1"><p className="text-[10.5px] font-bold text-[rgb(var(--accent-2))]">{item.gameName || 'Game update'} · {relative(item.date)}</p><h3 className="mt-1 line-clamp-2 text-[14px] font-bold leading-snug group-hover:text-[rgb(var(--accent))]">{item.title}</h3>{item.snippet && <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">{item.snippet}</p>}</span></button>)}
      </div>
    </section></HomePane>

    <HomePane id="play-next" {...paneProps}><PlayNext recommendations={recommendations} onSelect={onSelect} /></HomePane>

    <HomePane id="activity" {...paneProps}><section className="grid gap-3 md:grid-cols-[1.1fr_1fr]"><div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[rgb(var(--accent-2))]">{rangeMeta.label}</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-2"><Stat label="Played" value={hours(totalMinutes)} /><Stat label="Games" value={played.length} /><Stat label="Today" value={games.filter((game) => Number(game.lastPlayedAt || 0) >= Date.now() - 86400000).length} /></div></div><button onClick={() => onOpenPlaytimeImport?.()} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[rgb(var(--border))] px-2 py-1.5 text-[10px] font-bold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink" title="Import Steam playtime into your local library"><RefreshCw size={11} className="text-[rgb(var(--accent))]" />Sync hours</button></div></div><div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-4"><div className="mb-2 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Trophy size={14} className="text-[rgb(var(--accent))]" /><h2 className="text-xs font-black uppercase tracking-[0.18em]">Top 5</h2></div><div className="flex rounded border border-[rgb(var(--border))] p-0.5 text-[9px] font-bold"><button onClick={() => setRankingScope('period')} className={`rounded px-1.5 py-1 ${rankingScope === 'period' ? 'bg-[rgb(var(--accent)/0.18)] text-ink' : 'text-muted'}`}>{rangeMeta.label}</button><button onClick={() => setRankingScope('all')} className={`rounded px-1.5 py-1 ${rankingScope === 'all' ? 'bg-[rgb(var(--accent)/0.18)] text-ink' : 'text-muted'}`}>All time</button></div></div>{topFive.length ? <ol className="space-y-1.5">{topFive.map((game, index) => <li key={game.id} className="flex items-center gap-2 text-xs"><span className="w-4 font-mono text-[rgb(var(--accent-2))]">{index + 1}</span><Cover game={game} className="h-7 w-12" /><span className="min-w-0 flex-1 truncate font-semibold">{game.name}</span><span className="text-[10px] text-muted">{PLATFORM[platformOf(game)]}</span><span className="text-muted">{hours(game.playtime)}</span></li>)}</ol> : <p className="text-xs text-muted">Import or track playtime to begin your ranking.</p>}</div></section></HomePane>

    <HomePane id="health" {...paneProps}><LibraryHealth health={health} onOpenTidyUp={onOpenTidyUp} /></HomePane>
    <HomePane id="best-games" {...paneProps}><MyBestGames games={bestGames} onSelect={onSelect} /></HomePane>
    <HomePane id="released-week" {...paneProps}><ReleasedThisWeek releases={weeklyReleases} onRefresh={() => refreshWeeklyReleases(true)} /></HomePane>
    <HomePane id="library-tools" {...paneProps}><section className="grid gap-3 lg:grid-cols-[1.15fr_1fr]">
      <StorageCentre games={games} storage={storage} onScan={scanStorage} onSelect={onSelect} />
      <GamingChronicle entries={chronicle} onSelect={onSelect} />
    </section></HomePane>
    <HomePane id="recent" {...paneProps}><section className="pb-6"><div className="mb-2 flex items-center gap-2"><Clock3 size={14} className="text-[rgb(var(--accent))]" /><h2 className="text-xs font-black uppercase tracking-[0.18em]">Recently active</h2><span className="text-[10px] text-muted">{played.length} games</span></div><div className="overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.3)]">{played.length ? played.map((game) => <button key={game.id} onClick={() => onSelect?.(game.id)} className="flex w-full items-center gap-3 border-b border-[rgb(var(--border)/0.55)] px-3 py-2.5 text-left last:border-b-0 hover:bg-[rgb(var(--accent)/0.07)]"><Cover game={game} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{game.name}</span><span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted"><Gamepad2 size={10} />{PLATFORM[platformOf(game)]}</span></span><span className="hidden text-right text-[10px] text-muted sm:block">Played<br /><b className="text-ink">{relative(game.lastPlayedAt)}</b></span><span className="hidden text-right text-[10px] text-muted md:block">Added<br /><b className="text-ink">{added(game.addedAt)}</b></span><span className="font-mono text-xs font-bold text-[rgb(var(--accent-2))]">{hours(game.playtime)}</span></button>) : <p className="p-5 text-center text-xs text-muted">Your played games will appear here.</p>}</div></section></HomePane>
    {newsDetail && <NewsDetail item={newsDetail} onClose={() => setNewsDetail(null)} />}
  </section>;
}
function RailButton({ children, onClick }) { return <button onClick={onClick} className="grid h-7 w-7 place-items-center rounded-md border border-[rgb(var(--border))] text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink">{children}</button>; }
function HomePane({ id, children, paneOrder, hiddenPanes, draggedPane, setDraggedPane, movePane, togglePane }) {
  if (hiddenPanes.includes(id)) return null;
  return <div onDragOver={(event) => event.preventDefault()} onDrop={() => movePane(id)} style={{ order: paneOrder.indexOf(id) }} className={`group/homepane relative mb-6 ${draggedPane === id ? 'opacity-50' : ''}`} data-testid={`home-pane-${id}`}><div className="absolute -left-4 top-2 z-10 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/homepane:opacity-100"><span draggable onDragStart={() => setDraggedPane(id)} onDragEnd={() => setDraggedPane(null)} className="grid h-6 w-5 cursor-grab place-items-center rounded text-muted active:cursor-grabbing" title="Drag to reorder this Home pane"><GripVertical size={13} /></span><button onClick={() => togglePane(id, true)} className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink" title="Hide this Home pane"><EyeOff size={12} /></button></div>{children}</div>;
}
function Stat({ label, value }) { return <div><p className="text-2xl font-black text-ink">{value}</p><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p></div>; }
function Cover({ game, className = 'h-9 w-16' }) { const src = game.headerImage || game.coverUrl; return src ? <img src={src} alt="" className={`${className} shrink-0 rounded object-cover`} /> : <span className={`grid ${className} shrink-0 place-items-center rounded bg-[rgb(var(--surface)/0.8)] text-[10px] font-bold text-muted`}>{game.name?.slice(0, 2)}</span>; }
function NewsCover({ item }) { const src = item.platform === 'steam' && item.appid ? `https://cdn.akamai.steamstatic.com/steam/apps/${item.appid}/capsule_184x69.jpg` : ''; return src ? <img src={src} alt="" className="h-12 w-[78px] shrink-0 rounded-md object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span className="grid h-12 w-[78px] shrink-0 place-items-center rounded-md bg-[rgb(var(--accent)/0.10)] text-[9px] font-bold uppercase tracking-wider text-[rgb(var(--accent-2))]">News</span>; }

function NewsDetail({ item, onClose }) {
  const openFull = () => { if (window.api?.openExternal) window.api.openExternal(item.url); else window.open(item.url, '_blank'); };
  return <div className="fixed inset-0 z-[120] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" onMouseDown={onClose} data-testid="home-news-detail"><article className="w-full max-w-xl overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><header className="flex items-start justify-between gap-3 border-b border-[rgb(var(--border)/0.8)] p-4"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">{item.gameName || 'Game update'} · {relative(item.date)}</p><h2 className="mt-1 text-lg font-black leading-snug">{item.title || 'Game news'}</h2></div><button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted hover:bg-[rgb(var(--accent)/0.10)] hover:text-ink" aria-label="Close news"><X size={16} /></button></header><div className="max-h-[50vh] overflow-y-auto p-4"><p className="whitespace-pre-line text-sm leading-relaxed text-muted">{item.contents || item.snippet || 'Open the full story for the complete update.'}</p></div><footer className="flex justify-end border-t border-[rgb(var(--border)/0.8)] p-3"><button onClick={openFull} className="rounded-md bg-[rgb(var(--accent))] px-3 py-2 text-xs font-bold text-[rgb(var(--surface))]">Read full story ↗</button></footer></article></div>;
}

function MyBestGames({ games, onSelect }) {
  return <section className="mb-6 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-4"><div className="flex items-center gap-2"><Star size={15} className="fill-[rgb(var(--accent))] text-[rgb(var(--accent))]" /><div><h2 className="text-xs font-black uppercase tracking-[0.18em]">My Best Games</h2><p className="mt-1 text-[10px] text-muted">Your top ten ratings, beside the critic score where available.</p></div></div>{games.length ? <ol className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">{games.map((game, index) => <li key={game.id}><button onClick={() => onSelect?.(game.id)} className="flex w-full items-center gap-2 rounded-lg border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.28)] p-2 text-left hover:border-[rgb(var(--accent)/0.55)] hover:bg-[rgb(var(--accent)/0.07)]"><span className="w-4 font-mono text-[10px] text-[rgb(var(--accent-2))]">{index + 1}</span><Cover game={game} className="h-8 w-14" /><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-bold">{game.name}</span><span className="mt-0.5 flex items-center gap-1.5 text-[10px]"><span className="text-[rgb(var(--accent))]">★ {game.rating}/5</span>{game.metacritic ? <span className="text-muted">MC {game.metacritic}</span> : null}</span></span></button></li>)}</ol> : <p className="mt-3 text-xs text-muted">Rate games from their preview page and your top ten will appear here.</p>}</section>;
}

function ReleasedThisWeek({ releases, onRefresh }) {
  const open = (release) => { if (window.api?.openExternal) window.api.openExternal(release.url); else window.open(release.url, '_blank'); };
  return <section className="rounded-xl border border-[rgb(var(--border))] bg-[linear-gradient(130deg,rgb(var(--accent)/0.10),rgb(var(--panel)/0.35)_46%,rgb(var(--accent-2)/0.07))] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-2"><CalendarDays size={15} className="text-[rgb(var(--accent-2))]" /><div><h2 className="text-xs font-black uppercase tracking-[0.18em]">Released This Week</h2><p className="mt-1 text-[10px] text-muted">Not a release dump — only major games with real early momentum.</p></div></div><button onClick={onRefresh} disabled={releases.loading} className="inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] font-bold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink disabled:opacity-50" title="Refresh this week's discovery feed"><RefreshCw size={11} className={releases.loading ? 'animate-spin text-[rgb(var(--accent))]' : ''} />{releases.loading ? 'Checking…' : 'Refresh'}</button></div>{releases.loading && !releases.items.length ? <p className="mt-4 text-xs text-muted">Verifying notable new releases…</p> : releases.items.length ? <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{releases.items.map((release) => <button key={release.id} onClick={() => open(release)} className="group flex min-w-0 gap-3 rounded-lg border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.34)] p-2.5 text-left hover:border-[rgb(var(--accent)/0.55)] hover:bg-[rgb(var(--surface)/0.60)]"><img src={release.image} alt="" className="h-14 w-24 shrink-0 rounded-md object-cover" onError={(event) => { event.currentTarget.style.opacity = '0.18'; }} /><span className="min-w-0 flex-1"><span className="flex items-start gap-1"><span className="line-clamp-2 flex-1 text-xs font-black leading-snug group-hover:text-[rgb(var(--accent))]">{release.title}</span><ExternalLink size={11} className="mt-0.5 shrink-0 text-muted" /></span><span className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-muted"><span>{release.platform}</span><span>{release.releaseDate}</span></span><span className="mt-1 block truncate text-[10px] font-bold text-[rgb(var(--accent-2))]">{release.why}</span></span></button>)}</div> : <p className="mt-4 text-xs leading-relaxed text-muted">{releases.error || 'No major releases surfaced through the current quality filter this week. The feed is deliberately selective rather than padded with low-visibility releases.'}</p>}<p className="mt-3 text-[9.5px] leading-relaxed text-muted/80">{releases.criteria || 'Discovery criteria appear after the first successful refresh.'}</p></section>;
}

function getLibraryHealth(games) {
  const missingArt = games.filter((g) => !(g.coverUrl || g.headerImage || g.background)).length;
  // Metadata arrives from different sources under different fields. Treat a
  // game as detailed when any user-facing description is present, otherwise a
  // large imported library is incorrectly reported as entirely incomplete.
  const missingDetails = games.filter((g) => ![g.description, g.about, g.shortDescription].some((value) => String(value || '').trim())).length;
  const noLaunchTarget = games.filter((g) => !(g.exePath || g.launchUrl)).length;
  const names = new Map();
  for (const game of games) { const key = String(game.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''); if (key) names.set(key, (names.get(key) || 0) + 1); }
  const duplicates = [...names.values()].reduce((total, count) => total + (count > 1 ? count - 1 : 0), 0);
  const issues = missingArt + missingDetails + noLaunchTarget + duplicates;
  return { missingArt, missingDetails, noLaunchTarget, duplicates, score: Math.max(0, Math.round(100 - ((issues / Math.max(games.length, 1)) * 35))) };
}

function LibraryHealth({ health, onOpenTidyUp }) {
  const color = health.score >= 85 ? '#4ade80' : health.score >= 65 ? '#fbbf24' : '#fb4b5c';
  const issues = [
    [health.missingArt, 'missing cover art', '#60a5fa'], [health.missingDetails, 'missing details', '#c084fc'],
    [health.noLaunchTarget, 'no launch target', '#fb7185'], [health.duplicates, 'duplicate candidate', '#fbbf24'],
  ].filter(([count]) => count > 0);
  return <section className="mb-6 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[rgb(var(--accent-2))]">Library Health</p><div className="mt-1 flex items-baseline gap-2"><span className="text-3xl font-black" style={{ color }}>{health.score}%</span><span className="text-xs text-muted">ready and tidy</span></div></div>{onOpenTidyUp && <button onClick={onOpenTidyUp} className="rounded-md border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] font-bold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink">Review issues</button>}</div><div className="mt-3 h-2 overflow-hidden rounded-full bg-black/25"><span className="block h-full rounded-full transition-all duration-500" style={{ width: `${health.score}%`, background: `linear-gradient(90deg, ${color}, rgb(var(--accent-2)))`, boxShadow: `0 0 12px ${color}` }} /></div><div className="mt-3 flex flex-wrap gap-2">{issues.length ? issues.map(([count, label, issueColor]) => <span key={label} className="rounded-full border px-2 py-1 text-[10px] font-semibold" style={{ color: issueColor, borderColor: `${issueColor}55`, background: `${issueColor}12` }}>{count} {label}{count !== 1 ? 's' : ''}</span>) : <span className="text-xs text-emerald-400">Everything looks healthy.</span>}</div></section>;
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
    updated && { game: updated.game, label: 'Worth another look', reason: `New update · ${updated.news.title || 'read what changed'}`, action: 'Read update' },
    rediscover && { game: rediscover, label: 'Rediscover', reason: `${relative(rediscover.lastPlayedAt)} · ${rediscover.rating ? `${rediscover.rating}/5 personal rating` : 'a game you have not touched in a while'}`, action: 'Open game' },
    fresh && { game: fresh, label: 'Fresh start', reason: `Added ${added(fresh.addedAt)} · not played yet`, action: 'Explore' },
  ].filter(Boolean).filter((entry) => { if (seen.has(entry.game.id)) return false; seen.add(entry.game.id); return true; }).slice(0, 3);
}

function PlayNext({ recommendations, onSelect }) {
  return <section className="mb-6 rounded-xl border border-[rgb(var(--accent)/0.35)] bg-[linear-gradient(120deg,rgb(var(--accent)/0.12),rgb(var(--panel)/0.35)_48%,rgb(var(--accent-2)/0.08))] p-4 shadow-[0_0_32px_-20px_rgb(var(--accent))]"><div className="flex items-center gap-2"><Sparkles size={15} className="text-[rgb(var(--accent-2))]" /><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">What should I play?</p><h2 className="text-sm font-black">A useful nudge from your own library</h2></div></div>{recommendations.length ? <div className="mt-3 grid gap-2 md:grid-cols-3">{recommendations.map(({ game, label, reason, action }) => <button key={game.id} onClick={() => onSelect?.(game.id)} className="group flex min-w-0 items-center gap-2.5 rounded-lg border border-[rgb(var(--border)/0.85)] bg-[rgb(var(--surface)/0.36)] p-2.5 text-left hover:border-[rgb(var(--accent)/0.55)] hover:bg-[rgb(var(--surface)/0.6)]"><Cover game={game} className="h-10 w-16" /><span className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-wider text-[rgb(var(--accent-2))]">{label}</span><span className="block truncate text-xs font-black group-hover:text-[rgb(var(--accent))]">{game.name}</span><span className="mt-0.5 block line-clamp-2 text-[10px] leading-snug text-muted">{reason}</span><span className="mt-1 block text-[10px] font-bold text-[rgb(var(--accent))]">{action} ›</span></span></button>)}</div> : <p className="mt-3 text-xs text-muted">Add or import a few games and NEO-LIB will begin surfacing timely reasons to play them.</p>}</section>;
}

function readableBytes(bytes) { const value = Number(bytes || 0); if (value < 1024 ** 2) return `${Math.round(value / 1024)} KB`; if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`; return `${(value / 1024 ** 3).toFixed(1)} GB`; }

function StorageCentre({ games, storage, onScan, onSelect }) {
  const results = storage.results.map((entry) => ({ ...entry, game: games.find((game) => game.id === entry.id) })).filter((entry) => entry.game).sort((a, b) => Number(b.bytes) - Number(a.bytes));
  const total = results.reduce((sum, entry) => sum + Number(entry.bytes || 0), 0);
  const mods = results.reduce((sum, entry) => sum + Number(entry.modBytes || 0), 0);
  return <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-2"><HardDrive size={15} className="text-[rgb(var(--accent))]" /><div><h2 className="text-xs font-black uppercase tracking-[0.18em]">Storage control centre</h2><p className="mt-1 text-[10px] text-muted">Game folders and recognised mod folders—read-only.</p></div></div><button onClick={onScan} disabled={storage.loading} className="inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] font-bold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink disabled:opacity-50"><RefreshCw size={11} className={storage.loading ? 'animate-spin text-[rgb(var(--accent))]' : ''} />{storage.loading ? 'Scanning…' : storage.scannedAt ? 'Rescan' : 'Scan sizes'}</button></div>{storage.scannedAt ? <><div className="mt-3 flex gap-5"><Stat label="Games measured" value={results.length} /><Stat label="Total" value={readableBytes(total)} /><Stat label="Mod content" value={readableBytes(mods)} /></div><div className="mt-3 space-y-1.5">{results.slice(0, 5).map((entry) => <button key={entry.id} onClick={() => onSelect?.(entry.id)} className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-[rgb(var(--accent)/0.07)]"><Cover game={entry.game} className="h-6 w-10" /><span className="min-w-0 flex-1 truncate text-[11px] font-bold">{entry.game.name}</span>{entry.modBytes > 0 && <span className="text-[9px] text-[rgb(var(--accent-2))]">mods {readableBytes(entry.modBytes)}</span>}<span className="font-mono text-[10px] text-muted">{readableBytes(entry.bytes)}</span></button>)}</div></> : <p className="mt-4 text-xs leading-relaxed text-muted">Scan when you want a current view. NEO-LIB does not crawl every drive in the background.</p>}</section>;
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
  return entries.sort((a, b) => b.at - a.at).slice(0, 7);
}

function GamingChronicle({ entries, onSelect }) {
  return <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-4"><div className="flex items-center gap-2"><Archive size={15} className="text-[rgb(var(--accent-2))]" /><div><h2 className="text-xs font-black uppercase tracking-[0.18em]">Gaming chronicle</h2><p className="mt-1 text-[10px] text-muted">Your local library story, not a social feed.</p></div></div>{entries.length ? <div className="mt-3 space-y-2">{entries.map((entry, index) => <button key={`${entry.game.id}-${entry.type}-${entry.at}-${index}`} onClick={() => onSelect?.(entry.game.id)} className="flex w-full items-center gap-2.5 text-left"><span className="h-2 w-2 shrink-0 rounded-full bg-[rgb(var(--accent-2))] shadow-[0_0_8px_rgb(var(--accent-2))]" /><Cover game={entry.game} className="h-7 w-11" /><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-bold">{entry.game.name} <span className="font-normal text-muted">· {entry.type}</span></span><span className="block truncate text-[10px] text-muted">{entry.detail}</span></span><span className="text-[9px] text-muted">{relative(entry.at)}</span></button>)}</div> : <p className="mt-4 text-xs text-muted">Play, rate, or add games to begin your chronicle.</p>}</section>;
}
