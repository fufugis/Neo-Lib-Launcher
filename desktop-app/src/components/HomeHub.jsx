import React from 'react';
import { ChevronLeft, ChevronRight, Clock3, Gamepad2, Newspaper, RefreshCw, Trophy } from 'lucide-react';

const RANGES = { today: { label: 'Today', days: 1 }, week: { label: 'This week', days: 7 }, month: { label: 'This month', days: 31 } };
const PLATFORM = { steam: 'Steam', epic: 'Epic', gog: 'GOG', ea: 'EA app', ubisoft: 'Ubisoft', battlenet: 'Battle.net', itch: 'itch.io', local: 'Local' };

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

export default function HomeHub({ games = [], onSelect, onOpenPlaytimeImport }) {
  const [range, setRange] = React.useState('week');
  const [rankingScope, setRankingScope] = React.useState('period');
  const [news, setNews] = React.useState({ loading: false, items: [] });
  const railRef = React.useRef(null);
  const rangeMeta = RANGES[range];
  const cutoff = Date.now() - rangeMeta.days * 86400000;
  const played = React.useMemo(() => games.filter((game) => Number(game.lastPlayedAt || 0) >= cutoff).sort((a, b) => Number(b.lastPlayedAt || 0) - Number(a.lastPlayedAt || 0)), [games, cutoff]);
  const topFive = React.useMemo(() => [...(rankingScope === 'all' ? games : played)].filter((game) => Number(game.playtime || 0) > 0).sort((a, b) => Number(b.playtime || 0) - Number(a.playtime || 0)).slice(0, 5), [games, played, rankingScope]);
  const totalMinutes = played.reduce((sum, game) => sum + Number(game.playtime || 0), 0);

  React.useEffect(() => {
    if (!window.api?.fetchAllNews) return undefined;
    const eligible = games.filter((game) => game && (game.appid || game.gogId || /itch\.io/.test(game.website || '') || game.source === 'itch'));
    if (!eligible.length) { setNews({ loading: false, items: [] }); return undefined; }
    let cancelled = false;
    setNews((value) => ({ ...value, loading: true }));
    window.api.fetchAllNews({ games: eligible.map(({ id, appid, name, website, source, gogId }) => ({ id, appid, name, website, source, gogId })), days: rangeMeta.days, force: false })
      .then((result) => { if (!cancelled) setNews({ loading: false, items: (result?.items || []).sort((a, b) => Number(b.date || 0) - Number(a.date || 0)) }); })
      .catch(() => { if (!cancelled) setNews({ loading: false, items: [] }); });
    return () => { cancelled = true; };
  }, [games, rangeMeta.days]);

  const scrollNews = (direction) => railRef.current?.scrollBy({ left: direction * 420, behavior: 'smooth' });
  return <section className="h-full overflow-y-auto px-5 py-5 lg:px-7" data-testid="home-hub">
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[rgb(var(--accent-2))]">Your NEO-LIB</p><h1 className="font-display text-3xl font-black tracking-tight">Home</h1><p className="mt-1 text-xs text-muted">Your games, your time, and the updates that matter.</p></div>
      <div className="flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)] p-1">{Object.entries(RANGES).map(([key, meta]) => <button key={key} onClick={() => setRange(key)} className={`rounded-md px-3 py-1.5 text-[11px] font-bold transition ${range === key ? 'bg-[rgb(var(--accent)/0.22)] text-ink shadow-[0_0_12px_-4px_rgb(var(--accent))]' : 'text-muted hover:text-ink'}`}>{meta.label}</button>)}</div>
    </header>

    <section className="mb-6 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Newspaper size={14} className="text-[rgb(var(--accent-2))]" /><h2 className="text-xs font-black uppercase tracking-[0.18em]">News · {rangeMeta.label}</h2></div><div className="flex gap-1"><RailButton onClick={() => scrollNews(-1)}><ChevronLeft size={14} /></RailButton><RailButton onClick={() => scrollNews(1)}><ChevronRight size={14} /></RailButton></div></div>
      <div ref={railRef} onWheel={(event) => { if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) { event.currentTarget.scrollLeft += event.deltaY; event.preventDefault(); } }} className="flex gap-2.5 overflow-x-auto pb-2 [scrollbar-color:rgb(var(--accent))_transparent] [scrollbar-width:thin]">
        {news.loading && <p className="px-1 py-4 text-xs text-muted">Loading your game news…</p>}
        {!news.loading && !news.items.length && <p className="px-1 py-4 text-xs text-muted">No updates in this period yet. News from Steam, GOG, and itch.io will appear here.</p>}
        {news.items.map((item) => <button key={item.id} onClick={() => window.api?.openExternal ? window.api.openExternal(item.url) : window.open(item.url, '_blank')} className="group w-[min(330px,78vw)] shrink-0 rounded-lg border border-[rgb(var(--border)/0.8)] bg-[rgb(var(--surface)/0.35)] p-3 text-left transition hover:border-[rgb(var(--accent)/0.55)] hover:bg-[rgb(var(--accent)/0.07)]"><p className="text-[10px] font-bold text-[rgb(var(--accent-2))]">{item.gameName || 'Game update'} · {relative(item.date)}</p><h3 className="mt-1 line-clamp-2 text-[13px] font-bold leading-snug group-hover:text-[rgb(var(--accent))]">{item.title}</h3>{item.snippet && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">{item.snippet}</p>}</button>)}
      </div>
    </section>

    <section className="mb-6 grid gap-3 md:grid-cols-[1.1fr_1fr]"><div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[rgb(var(--accent-2))]">{rangeMeta.label}</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-2"><Stat label="Played" value={hours(totalMinutes)} /><Stat label="Games" value={played.length} /><Stat label="Today" value={games.filter((game) => Number(game.lastPlayedAt || 0) >= Date.now() - 86400000).length} /></div></div><button onClick={() => onOpenPlaytimeImport?.()} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[rgb(var(--border))] px-2 py-1.5 text-[10px] font-bold text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink" title="Import Steam playtime into your local library"><RefreshCw size={11} className="text-[rgb(var(--accent))]" />Sync hours</button></div></div><div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.34)] p-4"><div className="mb-2 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Trophy size={14} className="text-[rgb(var(--accent))]" /><h2 className="text-xs font-black uppercase tracking-[0.18em]">Top 5</h2></div><div className="flex rounded border border-[rgb(var(--border))] p-0.5 text-[9px] font-bold"><button onClick={() => setRankingScope('period')} className={`rounded px-1.5 py-1 ${rankingScope === 'period' ? 'bg-[rgb(var(--accent)/0.18)] text-ink' : 'text-muted'}`}>{rangeMeta.label}</button><button onClick={() => setRankingScope('all')} className={`rounded px-1.5 py-1 ${rankingScope === 'all' ? 'bg-[rgb(var(--accent)/0.18)] text-ink' : 'text-muted'}`}>All time</button></div></div>{topFive.length ? <ol className="space-y-1">{topFive.map((game, index) => <li key={game.id} className="flex items-center gap-2 text-xs"><span className="w-4 font-mono text-[rgb(var(--accent-2))]">{index + 1}</span><span className="min-w-0 flex-1 truncate font-semibold">{game.name}</span><span className="text-[10px] text-muted">{PLATFORM[platformOf(game)]}</span><span className="text-muted">{hours(game.playtime)}</span></li>)}</ol> : <p className="text-xs text-muted">Import or track playtime to begin your ranking.</p>}</div></section>

    <section className="pb-6"><div className="mb-2 flex items-center gap-2"><Clock3 size={14} className="text-[rgb(var(--accent))]" /><h2 className="text-xs font-black uppercase tracking-[0.18em]">Recently active</h2><span className="text-[10px] text-muted">{played.length} games</span></div><div className="overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.3)]">{played.length ? played.map((game) => <button key={game.id} onClick={() => onSelect?.(game.id)} className="flex w-full items-center gap-3 border-b border-[rgb(var(--border)/0.55)] px-3 py-2.5 text-left last:border-b-0 hover:bg-[rgb(var(--accent)/0.07)]"><Cover game={game} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{game.name}</span><span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted"><Gamepad2 size={10} />{PLATFORM[platformOf(game)]}</span></span><span className="hidden text-right text-[10px] text-muted sm:block">Played<br /><b className="text-ink">{relative(game.lastPlayedAt)}</b></span><span className="hidden text-right text-[10px] text-muted md:block">Added<br /><b className="text-ink">{added(game.addedAt)}</b></span><span className="font-mono text-xs font-bold text-[rgb(var(--accent-2))]">{hours(game.playtime)}</span></button>) : <p className="p-5 text-center text-xs text-muted">Your played games will appear here.</p>}</div></section>
  </section>;
}
function RailButton({ children, onClick }) { return <button onClick={onClick} className="grid h-7 w-7 place-items-center rounded-md border border-[rgb(var(--border))] text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink">{children}</button>; }
function Stat({ label, value }) { return <div><p className="text-2xl font-black text-ink">{value}</p><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p></div>; }
function Cover({ game }) { const src = game.headerImage || game.coverUrl; return src ? <img src={src} alt="" className="h-9 w-16 shrink-0 rounded object-cover" /> : <span className="grid h-9 w-16 shrink-0 place-items-center rounded bg-[rgb(var(--surface)/0.8)] text-[10px] font-bold text-muted">{game.name?.slice(0, 2)}</span>; }
