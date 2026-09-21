import React from 'react';
import { Eye, EyeOff, FileUp, Info, Loader2, Puzzle, ShieldCheck } from 'lucide-react';
import Modal from '../Modal';
import { BUILTIN_HOME_WIDGETS } from './home-widget-registry.mjs';

function WidgetCard({ widget, hidden, onToggle }) {
  const community = widget.kind === 'community';
  const author = widget.author?.name || 'NEO-LIB';
  return <article className={`flex min-h-[142px] flex-col rounded-xl border bg-[rgb(var(--panel)/0.28)] p-3 ${hidden ? 'border-[rgb(var(--border)/0.52)] opacity-75' : 'border-[rgb(var(--border)/0.72)]'}`}>
    <div className="flex items-start gap-2"><p className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{widget.name || widget.label}<span className="ml-1.5 font-normal text-muted">by {author}</span></p>{!community && <button type="button" onClick={() => onToggle?.(widget.id, !hidden)} className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border transition ${hidden ? 'border-[rgb(var(--border))] text-muted hover:text-ink' : 'border-[rgb(var(--accent)/0.45)] bg-[rgb(var(--accent)/0.10)] text-[rgb(var(--accent-2))] hover:bg-[rgb(var(--accent)/0.18)]'}`} aria-label={`${hidden ? 'Show' : 'Hide'} ${widget.name || widget.label}`} title={`${hidden ? 'Show' : 'Hide'} this widget`}>{hidden ? <EyeOff size={13} /> : <Eye size={13} />}</button>}</div>
    <p className="mt-1.5 line-clamp-3 flex-1 text-[11px] leading-relaxed text-ink/80">{widget.description || 'A built-in NEO-LIB Home widget.'}</p>
    <div className="mt-2 flex items-center justify-between gap-2 border-t border-[rgb(var(--border)/0.45)] pt-2"><span className="font-mono text-[9px] text-muted" title={`Minimum ${widget.layout?.minCols || 4} by ${widget.layout?.minRows || 2}; default ${widget.layout?.defaultCols || 6} by ${widget.layout?.defaultRows || 2}`}>{widget.layout?.minCols || 4}×{widget.layout?.minRows || 2} min · {widget.layout?.defaultCols || 6}×{widget.layout?.defaultRows || 2} default</span>{community ? <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-100"><ShieldCheck size={11} />Installed · host pending</span> : <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${hidden ? 'text-muted' : 'text-emerald-200'}`}>{hidden ? 'Hidden' : 'Visible'}</span>}</div>
  </article>;
}

export default function WidgetManagerModal({ open, onClose, communityWidgets = [], hiddenIds = [], onToggleBuiltin, onImport, externalNotice = '' }) {
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  React.useEffect(() => { if (open) { setBusy(false); setNotice(''); } }, [open]);
  const importWidget = async () => {
    setBusy(true); setNotice('');
    try { const result = await onImport?.(); setNotice(result?.message || 'Widget import cancelled.'); }
    catch { setNotice('Widget import could not be completed.'); }
    finally { setBusy(false); }
  };
  return <Modal open={open} onClose={onClose} title="Home widgets" wide testid="home-widget-manager-modal"><div className="space-y-4 p-4">
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgb(var(--accent)/0.38)] bg-[rgb(var(--accent)/0.07)] p-3"><div className="flex min-w-0 items-start gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgb(var(--accent)/0.18)] text-[rgb(var(--accent-2))]"><Puzzle size={16} /></span><div><p className="text-sm font-bold">Your Home, your layout</p><p className="mt-0.5 text-[11px] leading-relaxed text-muted">Use the eye on each card to show or hide it. Unlock Home to move and resize visible widgets.</p></div></div><button type="button" disabled={busy} onClick={importWidget} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[rgb(var(--accent))] px-3 py-2 text-xs font-bold text-[rgb(var(--surface))] disabled:opacity-60">{busy ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}Import widget</button></section>
    {(notice || externalNotice) && <p className="rounded-lg border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface)/0.32)] px-3 py-2 text-xs text-ink">{notice || externalNotice}</p>}
    <section><div className="mb-2 flex items-center gap-2"><Info size={14} className="text-[rgb(var(--accent-2))]" /><h3 className="text-[11px] font-black uppercase tracking-[0.17em]">Built-in widgets</h3></div><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{BUILTIN_HOME_WIDGETS.map((widget) => <WidgetCard key={widget.id} widget={widget} hidden={hiddenIds.includes(widget.id)} onToggle={onToggleBuiltin} />)}</div></section>
    <section><div className="mb-2 flex items-center gap-2"><ShieldCheck size={14} className="text-amber-100" /><h3 className="text-[11px] font-black uppercase tracking-[0.17em]">Imported community widgets</h3></div>{communityWidgets.length ? <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{communityWidgets.map((widget) => <WidgetCard key={widget.id} widget={{ ...widget, kind: 'community' }} />)}</div> : <p className="rounded-xl border border-dashed border-[rgb(var(--border)/0.7)] px-4 py-4 text-center text-xs text-muted">No community widgets installed yet. Choose a package’s <b>widget.json</b> to import it.</p>}</section>
    <p className="rounded-lg bg-[rgb(var(--surface)/0.22)] px-3 py-2 text-[10px] leading-relaxed text-muted">Community packages stay stored and inspected only. Their code cannot run or access NEO-LIB or Windows until the isolated widget host is complete.</p>
  </div></Modal>;
}
