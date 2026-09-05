import React from 'react';
import { ExternalLink, FileText, FolderOpen, Play, RefreshCw, Settings2, Wrench } from 'lucide-react';

const isElectron = typeof window !== 'undefined' && !!window.api;

/** A software-aware Preview. It deliberately avoids game-specific news, ratings and genres. */
export default function ToolDetail({ tool, onLaunch, onRefetch, onRevealFolder, onLocateManagedTool, onInstallManagedTool, installing = false }) {
  if (!tool) return null;
  const icon = tool.icon || tool.coverUrl || '';
  const launch = async () => {
    let token = '';
    if (isElectron && tool.launchTargetType !== 'uri') {
      const armed = await window.api?.armGameLaunch?.();
      if (!armed?.ok) return;
      token = armed.token || '';
    }
    onLaunch?.(tool, token);
  };
  return <div className="h-full overflow-y-auto px-4 py-5 sm:px-6">
    <section className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-[rgb(var(--border)/0.82)] bg-[rgb(var(--panel)/0.70)] shadow-[0_28px_80px_-52px_rgba(0,0,0,.96)] backdrop-blur-md">
      <header className="relative overflow-hidden border-b border-[rgb(var(--border)/0.7)] bg-[linear-gradient(125deg,rgb(var(--accent)/0.20),rgb(var(--surface)/0.38)_48%,rgb(var(--accent-2)/0.12))] px-5 py-6 sm:px-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[rgb(var(--accent)/0.16)] blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          {icon ? <img src={icon} alt="" className="h-20 w-20 rounded-2xl border border-[rgb(var(--border)/0.78)] bg-[rgb(var(--surface)/0.45)] object-cover p-1" /> : <div className="grid h-20 w-20 place-items-center rounded-2xl border border-dashed border-[rgb(var(--border)/0.78)] bg-[rgb(var(--surface)/0.30)] text-[rgb(var(--accent))]"><Wrench size={28} /></div>}
          <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[rgb(var(--accent-2))]">Tool workspace</p><h1 className="mt-1 break-words text-2xl font-black text-ink sm:text-3xl">{tool.name}</h1><p className="mt-1 text-sm text-muted">{tool.publisher || tool.developers?.[0] || 'Software details can be refreshed at any time.'}</p></div>
        </div>
      </header>
      <div className="flex flex-wrap gap-2 border-b border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface)/0.20)] px-5 py-3 sm:px-7">
        <button data-neolib-launch onClick={launch} disabled={tool.availability === 'missing'} className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-4 py-2 text-xs font-bold text-[rgb(var(--surface))] disabled:opacity-50"><Play size={14} /> {tool.availability === 'missing' ? 'Set up required' : 'Open tool'}</button>
        <button onClick={() => onRefetch?.(tool)} className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border)/0.72)] px-3 py-2 text-xs hover:border-[rgb(var(--accent)/0.65)]"><RefreshCw size={14} /> Re-fetch info</button>
        {tool.exePath && <button onClick={() => onRevealFolder?.(tool)} className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border)/0.72)] px-3 py-2 text-xs hover:border-[rgb(var(--accent)/0.65)]"><FolderOpen size={14} /> Locate</button>}
        {tool.website && <button onClick={() => window.api?.openExternal?.(tool.website)} className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border)/0.72)] px-3 py-2 text-xs hover:border-[rgb(var(--accent)/0.65)]"><ExternalLink size={14} /> Official page</button>}
        {tool.managedTool && tool.availability === 'missing' && <><button onClick={() => onLocateManagedTool?.(tool)} className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border)/0.72)] px-3 py-2 text-xs"><FolderOpen size={14} /> Locate app</button><button disabled={installing} onClick={() => onInstallManagedTool?.(tool)} className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border)/0.72)] px-3 py-2 text-xs"><Settings2 size={14} /> {installing ? 'Preparing…' : 'Official install'}</button></>}
      </div>
      <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className="min-w-0 rounded-xl border border-[rgb(var(--border)/0.65)] bg-[rgb(var(--surface)/0.16)] p-4"><div className="flex items-center gap-2"><FileText size={15} className="text-[rgb(var(--accent))]" /><h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">About this tool</h2></div><p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink/90">{tool.about || tool.shortDescription || 'No description yet. Re-fetch info to identify this program from its executable and public software sources.'}</p></section>
        <aside className="overflow-hidden rounded-xl border border-[rgb(var(--border)/0.65)] bg-[rgb(var(--surface)/0.16)]"><Meta label="Category" value={tool.toolCategory || tool.genres?.[0] || 'Windows utility'} /><Meta label="Publisher" value={tool.publisher || tool.developers?.[0] || 'Not reported'} /><Meta label="Version" value={tool.version || 'Not reported'} /><Meta label="Details source" value={tool.metadataSource || tool.source || 'Manual'} /><Meta label="Evidence" value={(tool.metadataEvidence || []).join(' · ') || 'Awaiting refresh'} /></aside>
      </div>
      <p className="mx-5 mb-5 break-all rounded-lg border border-[rgb(var(--border)/0.44)] bg-[rgb(var(--surface)/0.18)] px-3 py-2 text-[10px] text-muted sm:mx-7">{tool.exePath || 'No local program path is configured.'}</p>
    </section>
  </div>;
}

function Meta({ label, value }) { return <div className="border-b border-[rgb(var(--border)/0.55)] px-3.5 py-3 last:border-b-0"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">{label}</p><p className="mt-1 break-words text-xs leading-5 text-ink">{value}</p></div>; }
