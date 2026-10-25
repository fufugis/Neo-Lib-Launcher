import React from 'react';
import { CalendarDays, ExternalLink, Newspaper, RefreshCw, Settings2 } from 'lucide-react';
import { newsSourceUrl } from './game-history-model.mjs';

export default function GameNewsHistory({game,history,onUpdateGame}) {
  const [count,setCount]=React.useState(5);
  const [editing,setEditing]=React.useState(false);
  const [url,setUrl]=React.useState(game.newsUrl||'');
  const [error,setError]=React.useState('');
  React.useEffect(()=>{setUrl(game.newsUrl||'');setError('');setEditing(false);setCount(5);},[game.id,game.newsUrl]);
  const save=event=>{
    event.preventDefault();const value=newsSourceUrl(url);
    if(value===null){setError('Use a public https:// game news page or RSS/Atom feed.');return;}
    onUpdateGame?.(game.id,{newsUrl:value});setEditing(false);setError('');
  };
  const open=url=>{const safe=newsSourceUrl(url);if(!safe)return;if(window.api?.openExternal)window.api.openExternal(safe);else window.open(safe,'_blank','noopener,noreferrer');};
  const items=history.items||[];
  return <section data-testid="game-news-history" aria-labelledby={'game-news-heading-'+game.id} className="min-w-0 rounded-2xl border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--panel)/0.42)] p-4 sm:p-5">
    <header className="flex flex-wrap items-start justify-between gap-3 border-b hairline pb-4">
      <div className="min-w-0"><h2 id={'game-news-heading-'+game.id} className="flex items-center gap-2 text-base font-black text-ink"><Newspaper size={19} className="shrink-0 text-[rgb(var(--accent))]"/>News &amp; update history</h2><p className="mt-1 text-[11px] text-muted">Developer posts, patches and events · press coverage when official posts are absent · newest first</p></div>
      <div className="flex flex-wrap items-center gap-2">
        {items.length>5&&<button type="button" data-testid="game-history-count" onClick={()=>setCount(count===5?10:5)} className="rounded-lg border hairline px-2 py-1.5 text-xs font-bold hover:bg-surface">{count===5?'Show 10':'Show 5'}</button>}
        <button type="button" data-testid="game-history-refresh" onClick={history.refresh} disabled={history.loading} aria-label="Refresh game history" className="rounded-lg border hairline p-2 text-muted hover:text-ink disabled:opacity-50"><RefreshCw size={14} className={history.loading?'animate-spin':''}/></button>
        {onUpdateGame&&<button type="button" data-testid="game-history-source" onClick={()=>setEditing(value=>!value)} aria-expanded={editing} className="inline-flex items-center gap-1 rounded-lg border hairline px-2 py-1.5 text-xs font-bold hover:bg-surface"><Settings2 size={13}/>News source</button>}
      </div>
    </header>
    {editing&&<form onSubmit={save} data-testid="game-history-source-form" className="my-4 rounded-xl border hairline bg-surface/40 p-3">
      <label className="block text-xs font-bold text-ink" htmlFor={'game-news-url-'+game.id}>Game news page or RSS/Atom feed</label>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">Use this game’s developer or publisher page. Leave blank for automatic sources. Only public HTTPS is read—no login, cookies or page scripts.</p>
      <div className="mt-2 flex flex-wrap gap-2"><input id={'game-news-url-'+game.id} aria-label="Game news source URL" type="url" maxLength={4096} value={url} onChange={event=>setUrl(event.target.value)} placeholder="https://…" className="min-w-0 flex-1 rounded-lg border hairline bg-panel px-3 py-2 text-xs"/><button type="submit" className="rounded-lg bg-[rgb(var(--accent)/0.18)] px-3 py-2 text-xs font-bold text-ink">Save source</button></div>
      {error&&<p role="alert" className="mt-2 text-xs text-amber-300">{error}</p>}
    </form>}
    {history.loading&&!items.length&&<p role="status" className="py-6 text-sm text-muted">Checking this game’s public news sources…</p>}
    {!history.loading&&!items.length&&<div data-testid="game-history-empty" className="py-6 text-sm leading-relaxed text-muted"><p className="font-bold text-ink">{history.error?'News could not be loaded right now.':'No dated news found for this game yet.'}</p><p className="mt-1">{history.error?'Try Refresh when connected, or choose a game-specific news source.':'Older games and publishers without public feeds may have no available history. Add a game-specific page or feed using News source.'}</p></div>}
    {(history.stale||history.error&&items.length>0)&&<p role="status" className="pt-3 text-xs text-amber-200">Showing the last available history. The source could not be refreshed.</p>}
    <ol className="mt-3 space-y-3" data-testid="game-history-list">
      {items.slice(0,count).map(item=><li key={item.id||item.url} data-testid="game-history-entry" className="relative min-w-0 border-l-2 border-[rgb(var(--accent)/0.4)] pl-4 py-2">
        <span aria-hidden="true" className="absolute -left-[5px] top-4 h-2 w-2 rounded-full bg-[rgb(var(--accent))]"/>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted"><time dateTime={new Date(item.date).toISOString()} className="inline-flex items-center gap-1 font-bold text-ink"><CalendarDays size={11}/>{new Date(item.date).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}</time><span className="rounded border border-[rgb(var(--accent)/0.3)] bg-[rgb(var(--accent)/0.08)] px-1.5 py-0.5 font-bold text-[rgb(var(--accent))]">{item.kind||'News'}</span><span className="break-words">{item.sourceLabel||item.platform}</span></div>
        <h3 className="mt-2 break-words text-sm font-bold leading-snug text-ink">{item.title}</h3>
        {item.snippet&&<p className="mt-1.5 whitespace-pre-line break-words text-xs leading-relaxed text-muted">{item.snippet}</p>}
        <button type="button" onClick={()=>open(item.url)} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[rgb(var(--accent))] hover:underline">Read original<ExternalLink size={11}/></button>
      </li>)}
    </ol>
    {items.length>0&&<p className="mt-3 border-t hairline pt-3 text-[10px] text-muted">Latest {Math.min(count,items.length)} available posts · dates supplied by the source · articles open in your browser</p>}
  </section>;
}
