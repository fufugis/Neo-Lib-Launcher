import React from 'react';
import { FilePlus, Loader2, RefreshCw, Search, Check, Info, ImageIcon } from 'lucide-react';
import Modal from './Modal';
import { guessNameFromPath } from '../lib/utils';

const isElectron = typeof window !== 'undefined' && !!window.api;

/**
 * Dedicated software metadata flow. Tools are not games: selected executable
 * identity wins, recognised vendors come next, and a bounded public software
 * lookup is a last resort. Nothing in this UI downloads, installs, launches,
 * or uploads the selected program.
 */
export default function ToolMetadataModal({ open, tool = null, onClose, onCreate, onUpdate, onNotice }) {
  const [exePath, setExePath] = React.useState('');
  const [launchArgs, setLaunchArgs] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [icon, setIcon] = React.useState('');
  const [proposed, setProposed] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setExePath(tool?.exePath || '');
    setLaunchArgs(tool?.launchArgs || '');
    setQuery(tool?.name || guessNameFromPath(tool?.exePath || '') || '');
    setIcon(tool?.icon || '');
    setProposed(null);
    setBusy(false);
    setError('');
  }, [open, tool?.id]);

  const findDetails = async (path = exePath, overrideQuery = query) => {
    if (!path && !overrideQuery.trim()) return;
    setBusy(true);
    setError('');
    try {
      const result = await window.api?.fetchToolMetadata?.({ exePath: path, query: overrideQuery.trim() });
      if (!result?.name) throw new Error('No usable software details were found.');
      setProposed(result);
      if (result.name && (!query.trim() || query === guessNameFromPath(path))) setQuery(result.name);
    } catch (reason) {
      setError(reason?.message || 'Tool metadata could not be checked.');
    } finally { setBusy(false); }
  };

  const pick = async () => {
    const picked = await window.api?.pickExe?.();
    if (!picked) return;
    let target = picked;
    let args = '';
    if (/\.lnk$/i.test(picked) && window.api?.resolveLnk) {
      const resolved = await window.api.resolveLnk(picked);
      if (resolved?.ok && resolved.target) { target = resolved.target; args = resolved.args || ''; }
    }
    const title = guessNameFromPath(target);
    setExePath(target);
    setLaunchArgs(args);
    setQuery(title);
    setProposed(null);
    setError('');
    const localIcon = await window.api?.extractIcon?.(target);
    setIcon(localIcon || '');
    await findDetails(target, title);
  };

  const apply = async () => {
    const data = proposed || {};
    let image = icon;
    if (!image && data.image?.startsWith('http')) image = (await window.api?.cacheImage?.(data.image, data.name || query)) || data.image;
    const next = {
      ...(tool || {}),
      name: data.name || query || guessNameFromPath(exePath) || 'Untitled tool',
      exePath: exePath || tool?.exePath || '',
      launchArgs: launchArgs || tool?.launchArgs || '',
      icon: image || tool?.icon || '',
      coverUrl: image || tool?.coverUrl || '',
      shortDescription: data.shortDescription || tool?.shortDescription || '',
      about: data.about || tool?.about || '',
      developers: data.developers?.length ? data.developers : (tool?.developers || []),
      publisher: data.publisher || tool?.publisher || '',
      genres: data.genres?.length ? data.genres : (tool?.genres || []),
      toolCategory: data.category || tool?.toolCategory || '',
      website: data.website || tool?.website || '',
      version: data.version || tool?.version || '',
      metadataSource: data.source || tool?.metadataSource || 'manual',
      metadataEvidence: data.evidence || tool?.metadataEvidence || [],
      metadataFetchedAt: data.metadataFetchedAt || Date.now(),
      toolKind: 'software',
    };
    if (tool) onUpdate?.(tool.id, next);
    else onCreate?.(next);
    onNotice?.(`${next.name} details ${tool ? 'updated' : 'ready'}.`);
    onClose?.();
  };

  const title = tool ? `Refresh tool details · ${tool.name}` : 'Add Tool';
  const displayedName = proposed?.name || query || guessNameFromPath(exePath) || 'Your software';
  return (
    <Modal open={open} onClose={onClose} title={title} wide testid="tool-metadata-modal">
      <div className="space-y-4 p-5">
        <div className="rounded-xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--panel)/0.28)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">1 · Program</p>
          <div className="mt-2 flex items-center gap-3">
            {icon ? <img src={icon} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-[rgb(var(--border)/0.7)] object-cover" /> : <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-dashed border-[rgb(var(--border)/0.7)] text-muted"><ImageIcon size={18} /></div>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{exePath || 'No program selected'}</p>
              <p className="mt-0.5 text-[11px] text-muted">NEO-LIB reads the icon and Windows file details locally first.</p>
            </div>
            <button onClick={pick} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[rgb(var(--border)/0.75)] px-3 py-2 text-xs hover:border-[rgb(var(--accent)/0.7)] hover:bg-[rgb(var(--accent)/0.10)]"><FilePlus size={14} /> Browse</button>
          </div>
        </div>

        <div className={`rounded-xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--panel)/0.22)] p-4 ${!exePath && !tool ? 'opacity-55' : ''}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">2 · Identify & enrich</p>
              <p className="mt-1 text-[11px] text-muted">Windows identity → recognised software → public official software details.</p>
            </div>
            <button disabled={busy || (!exePath && !query.trim())} onClick={() => findDetails()} className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-3 py-2 text-xs font-semibold text-[rgb(var(--surface))] disabled:opacity-50">
              {busy ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />} Find details
            </button>
          </div>
          <div className="relative mt-3">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') findDetails(); }} placeholder="Software name, e.g. GPU-Z or OBS Studio" className="h-9 w-full rounded-lg border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.35)] pl-9 pr-3 text-sm outline-none focus:border-[rgb(var(--accent)/0.75)]" />
          </div>
        </div>

        {error && <div className="rounded-lg border border-red-400/45 bg-red-500/10 px-3 py-2 text-xs text-red-100">{error}</div>}

        {proposed && <section className="overflow-hidden rounded-xl border border-[rgb(var(--accent)/0.48)] bg-[rgb(var(--accent)/0.07)]" data-testid="tool-metadata-review">
          <div className="flex items-center gap-2 border-b border-[rgb(var(--accent)/0.28)] px-4 py-2.5"><Check size={15} className="text-[rgb(var(--accent-2))]" /><div><p className="text-sm font-bold text-ink">{displayedName}</p><p className="text-[10px] text-muted">Review before saving · {proposed.source}</p></div></div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <InfoLine label="Publisher" value={proposed.publisher || 'Not reported'} fresh />
            <InfoLine label="Version" value={proposed.version || 'Not reported'} fresh />
            <InfoLine label="Type" value={proposed.category || 'Windows utility'} fresh />
            <InfoLine label="Evidence" value={(proposed.evidence || []).join(' · ') || 'Name search'} fresh />
            <div className="sm:col-span-2 rounded-lg border border-[rgb(var(--border)/0.55)] bg-[rgb(var(--surface)/0.18)] p-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Description</p><p className="mt-1 text-xs leading-5 text-ink/90">{proposed.about || proposed.shortDescription}</p></div>
          </div>
        </section>}

        <p className="rounded-lg bg-[rgb(var(--surface)/0.24)] px-3 py-2 text-[10px] leading-relaxed text-muted">No download, install, launch, or file upload happens here. NEO-LIB only reads the chosen program&apos;s normal Windows identity and public software pages.</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-[rgb(var(--border)/0.7)] px-4 py-2 text-xs text-muted hover:text-ink">Cancel</button>
          <button disabled={!exePath && !tool?.exePath} onClick={apply} className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-4 py-2 text-xs font-bold text-[rgb(var(--surface))] disabled:opacity-50"><Check size={14} /> {tool ? 'Save tool details' : 'Add tool'}</button>
        </div>
      </div>
    </Modal>
  );
}

function InfoLine({ label, value, fresh }) {
  return <div className="rounded-lg border border-[rgb(var(--border)/0.55)] bg-[rgb(var(--surface)/0.18)] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">{label}{fresh && <span className="ml-1 text-[rgb(var(--accent-2))]">NEW</span>}</p><p className="mt-1 break-words text-xs text-ink">{value}</p></div>;
}
