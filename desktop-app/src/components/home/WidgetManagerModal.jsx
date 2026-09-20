import React from 'react';
import { Eye, EyeOff, FileUp, Info, Loader2, Puzzle, ShieldCheck } from 'lucide-react';
import Modal from '../Modal';
import { BUILTIN_HOME_WIDGETS } from './home-widget-registry.mjs';

function WidgetCard({ widget, hidden, onToggle }) {
  const community = widget.kind === 'community';
  return <article className="rounded-xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--panel)/0.28)] p-3.5">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-ink">{widget.name || widget.label}</p><p className="mt-0.5 text-[11px] text-muted">by {widget.author?.name || 'NEO-LIB'} · {widget.version ? `v${widget.version}` : 'built in'}</p></div><span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${community ? 'border-amber-300/35 bg-amber-300/[0.08] text-amber-100' : hidden ? 'border-[rgb(var(--border))] text-muted' : 'border-emerald-300/35 bg-emerald-300/[0.08] text-emerald-100'}`}>{community ? 'Host pending' : hidden ? 'Hidden' : 'Shown'}</span></div>
    <p className="mt-2 text-[11px] leading-relaxed text-ink/80">{widget.description || 'A built-in NEO-LIB Home widget.'}</p>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[rgb(var(--border)/0.5)] pt-2.5"><span className="text-[10px] text-muted">Minimum {widget.layout?.minCols || 4} × {widget.layout?.minRows || 2} · default {widget.layout?.defaultCols || 6} × {widget.layout?.defaultRows || 2}</span>{community ? <span className="inline-flex items-center gap-1 text-[10px] text-amber-100"><ShieldCheck size={12} />Installed safely</span> : <button type="button" onClick={() => onToggle?.(widget.id, !hidden)} className="inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] font-bold text-ink hover:border-[rgb(var(--accent)/0.6)] hover:bg-[rgb(var(--accent)/0.10)]">{hidden ? <Eye size={12} /> : <EyeOff size={12} />}{hidden ? 'Show' : 'Hide'}</button>}</div>
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
  return <Modal open={open} onClose={onClose} title="Home widgets" wide testid="home-widget-manager-modal"><div className="space-y-5 p-5">
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgb(var(--accent)/0.38)] bg-[rgb(var(--accent)/0.07)] p-4"><div className="flex min-w-0 items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgb(var(--accent)/0.18)] text-[rgb(var(--accent-2))]"><Puzzle size={18} /></span><div><p className="text-sm font-bold">Your Home, your layout</p><p className="mt-0.5 text-[11px] leading-relaxed text-muted">Built-in widgets can be hidden now. Community packages are stored and inspected safely until their isolated widget host arrives.</p></div></div><button type="button" disabled={busy} onClick={importWidget} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[rgb(var(--accent))] px-3 py-2 text-xs font-bold text-[rgb(var(--surface))] disabled:opacity-60">{busy ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}Import widget</button></section>
    {(notice || externalNotice) && <p className="rounded-lg border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface)/0.32)] px-3 py-2 text-xs text-ink">{notice || externalNotice}</p>}
    <section><div className="mb-2 flex items-center gap-2"><Info size={14} className="text-[rgb(var(--accent-2))]" /><h3 className="text-[11px] font-black uppercase tracking-[0.17em]">Built-in widgets</h3></div><div className="grid gap-3 sm:grid-cols-2">{BUILTIN_HOME_WIDGETS.map((widget) => <WidgetCard key={widget.id} widget={widget} hidden={hiddenIds.includes(widget.id)} onToggle={onToggleBuiltin} />)}</div></section>
    <section><div className="mb-2 flex items-center gap-2"><ShieldCheck size={14} className="text-amber-100" /><h3 className="text-[11px] font-black uppercase tracking-[0.17em]">Imported community widgets</h3></div>{communityWidgets.length ? <div className="grid gap-3 sm:grid-cols-2">{communityWidgets.map((widget) => <WidgetCard key={widget.id} widget={{ ...widget, kind: 'community' }} />)}</div> : <p className="rounded-xl border border-dashed border-[rgb(var(--border)/0.7)] px-4 py-5 text-center text-xs text-muted">No community widgets installed yet. Choose a package’s <b>widget.json</b> to import it.</p>}</section>
    <p className="rounded-lg bg-[rgb(var(--surface)/0.22)] px-3 py-2 text-[10px] leading-relaxed text-muted">Package details come from the author’s manifest: name, version, author, description, size limits and requested future permissions. Imported code is not running yet, and it has no access to NEO-LIB or Windows.</p>
  </div></Modal>;
}
