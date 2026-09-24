import React from 'react';
import { Eye, EyeOff, FileUp, Info, Loader2, Power, Puzzle, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import Modal from '../Modal';
import { BUILTIN_HOME_WIDGETS } from './home-widget-registry.mjs';

const PERMISSION_LABELS = Object.freeze({ storage: 'Private storage', 'library.read': 'Redacted Library', network: 'HTTPS network' });

function BuiltinCard({ widget, hidden, onToggle }) {
  return <article className={`flex min-h-[132px] flex-col rounded-xl border bg-[rgb(var(--panel)/0.28)] p-3 ${hidden ? 'border-[rgb(var(--border)/0.52)] opacity-75' : 'border-[rgb(var(--border)/0.72)]'}`}>
    <div className="flex items-start gap-2"><p className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{widget.label}<span className="ml-1.5 font-normal text-muted">by NEO-LIB</span></p><button type="button" onClick={() => onToggle?.(widget.id, !hidden)} className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border transition ${hidden ? 'border-[rgb(var(--border))] text-muted' : 'border-[rgb(var(--accent)/0.45)] bg-[rgb(var(--accent)/0.10)] text-[rgb(var(--accent-2))]'}`} aria-label={`${hidden ? 'Show' : 'Hide'} ${widget.label}`}>{hidden ? <EyeOff size={13} /> : <Eye size={13} />}</button></div>
    <p className="mt-1.5 line-clamp-3 flex-1 text-[11px] leading-relaxed text-ink/80">{widget.description}</p>
    <p className="mt-2 border-t border-[rgb(var(--border)/0.45)] pt-2 font-mono text-[9px] text-muted">{widget.layout.minCols}×{widget.layout.minRows} min · {widget.layout.defaultCols}×{widget.layout.defaultRows} default</p>
  </article>;
}

function CommunityCard({ widget, config, onChange, onRemove }) {
  const enabled = config?.enabled === true && config?.version === widget.version && widget.compatible;
  const grants = config?.version === widget.version && Array.isArray(config?.grants) ? config.grants : [];
  const toggleGrant = (permission) => onChange(widget.id, { ...config, version: widget.version, enabled: false, grants: grants.includes(permission) ? grants.filter((item) => item !== permission) : [...grants, permission] });
  return <article className={`flex min-h-[178px] flex-col rounded-xl border bg-[rgb(var(--panel)/0.28)] p-3 ${enabled ? 'border-emerald-400/35' : 'border-[rgb(var(--border)/0.72)]'}`}>
    <div className="flex items-start gap-2"><p className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{widget.name}<span className="ml-1.5 font-normal text-muted">by {widget.author?.name}</span></p><button type="button" disabled={!widget.compatible} onClick={() => onChange(widget.id, { ...config, version: widget.version, enabled: !enabled, grants })} className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border ${enabled ? 'border-emerald-400/45 bg-emerald-400/10 text-emerald-200' : 'border-[rgb(var(--border))] text-muted'} disabled:opacity-35`} title={enabled ? 'Disable widget' : 'Enable widget'}><Power size={13} /></button></div>
    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink/80">{widget.description}</p>
    <div className="mt-2 flex flex-wrap gap-1">{widget.permissions.length ? widget.permissions.map((permission) => <label key={permission} className={`flex cursor-pointer items-center gap-1 rounded border px-1.5 py-1 text-[9px] ${grants.includes(permission) ? 'border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--accent)/0.10)] text-ink' : 'border-[rgb(var(--border))] text-muted'}`}><input type="checkbox" checked={grants.includes(permission)} onChange={() => toggleGrant(permission)} className="accent-[rgb(var(--accent))]" />{PERMISSION_LABELS[permission]}</label>) : <span className="text-[9px] text-emerald-200">Requests no capabilities</span>}</div>
    <div className="mt-auto flex items-center justify-between gap-2 border-t border-[rgb(var(--border)/0.45)] pt-2"><span className="font-mono text-[9px] text-muted">v{widget.version} · API {widget.apiVersion} · {widget.layout.minCols}×{widget.layout.minRows} min</span><div className="flex items-center gap-1">{widget.compatible ? <span className={`text-[9px] font-bold ${enabled ? 'text-emerald-200' : 'text-amber-100'}`}>{enabled ? 'Enabled' : 'Disabled'}</span> : <span className="text-[9px] font-bold text-red-300">Incompatible</span>}<button type="button" onClick={() => onRemove(widget)} className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-red-400/10 hover:text-red-300" title="Uninstall safely"><Trash2 size={11} /></button></div></div>
  </article>;
}

export default function WidgetManagerModal({ open, onClose, communityWidgets = [], recoverableWidgets = [], communityConfig = {}, hiddenIds = [], onToggleBuiltin, onImport, onCommunityConfig, onRemove, onRestore, externalNotice = '' }) {
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  React.useEffect(() => { if (open) { setBusy(false); setNotice(''); } }, [open]);
  const act = async (task, fallback) => {
    setBusy(true); setNotice('');
    try { const result = await task?.(); setNotice(result?.message || fallback); } catch { setNotice(fallback); } finally { setBusy(false); }
  };
  return <Modal open={open} onClose={onClose} title="Home widgets" wide testid="home-widget-manager-modal"><div className="space-y-4 p-4">
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgb(var(--accent)/0.38)] bg-[rgb(var(--accent)/0.07)] p-3"><div className="flex min-w-0 items-start gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgb(var(--accent)/0.18)] text-[rgb(var(--accent-2))]"><Puzzle size={16} /></span><div><p className="text-sm font-bold">Your Home, your canvas</p><p className="mt-0.5 text-[11px] leading-relaxed text-muted">Imported widgets stay disabled until you enable them. Grant only the capabilities you trust.</p></div></div><button type="button" disabled={busy} onClick={() => act(onImport, 'Widget import cancelled.')} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[rgb(var(--accent))] px-3 py-2 text-xs font-bold text-[rgb(var(--surface))] disabled:opacity-60">{busy ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}Import widget</button></section>
    {(notice || externalNotice) && <p className="rounded-lg border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface)/0.32)] px-3 py-2 text-xs text-ink">{notice || externalNotice}</p>}
    <section><div className="mb-2 flex items-center gap-2"><Info size={14} className="text-[rgb(var(--accent-2))]" /><h3 className="text-[11px] font-black uppercase tracking-[0.17em]">Built-in widgets</h3></div><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{BUILTIN_HOME_WIDGETS.map((widget) => <BuiltinCard key={widget.id} widget={widget} hidden={hiddenIds.includes(widget.id)} onToggle={onToggleBuiltin} />)}</div></section>
    <section><div className="mb-2 flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-200" /><h3 className="text-[11px] font-black uppercase tracking-[0.17em]">Imported community widgets</h3></div>{communityWidgets.length ? <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{communityWidgets.map((widget) => <CommunityCard key={widget.id} widget={widget} config={communityConfig[widget.id]} onChange={onCommunityConfig} onRemove={(item) => act(() => onRemove?.(item), 'Widget removal failed.')} />)}</div> : <p className="rounded-xl border border-dashed border-[rgb(var(--border)/0.7)] px-4 py-4 text-center text-xs text-muted">No community widgets installed yet. Choose a package’s <b>widget.json</b> to import it.</p>}</section>
    {recoverableWidgets.length > 0 && <section><h3 className="mb-2 text-[11px] font-black uppercase tracking-[0.17em]">Recovery</h3><div className="flex flex-wrap gap-2">{recoverableWidgets.map((widget) => <button key={`${widget.id}-${widget.installedAt}`} disabled={busy} onClick={() => act(() => onRestore?.(widget), 'Widget recovery failed.')} className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--border))] px-2.5 py-2 text-[10px] font-bold text-muted hover:text-ink"><RotateCcw size={11} />Restore {widget.name} · v{widget.version}</button>)}</div></section>}
    <p className="rounded-lg bg-[rgb(var(--surface)/0.22)] px-3 py-2 text-[10px] leading-relaxed text-muted">Community code runs in a sandboxed frame without Node, Electron, Windows, files, settings, credentials, other widgets or private games. Removal keeps a recoverable local copy.</p>
  </div></Modal>;
}
