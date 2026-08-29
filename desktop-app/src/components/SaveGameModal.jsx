import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArchiveRestore, CheckCircle2, Copy, FolderOpen, FolderSearch, HardDriveDownload, ShieldAlert, X } from 'lucide-react';

function readableBytes(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${Math.round(value / 1024)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}
function dateTime(value) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Unknown date'; }

export default function SaveGameModal({ game, onClose, onSaveFolder, onNotice }) {
  const [savePath, setSavePath] = React.useState(game?.saveFolder || '');
  const [info, setInfo] = React.useState(null);
  const [backups, setBackups] = React.useState([]);
  const [busy, setBusy] = React.useState('');
  const [detected, setDetected] = React.useState({ loading: false, candidates: [] });
  const [search, setSearch] = React.useState({ open: false, root: '', loading: false, candidates: [], truncated: false, error: '' });
  const [restoreChoice, setRestoreChoice] = React.useState(null);

  const refresh = React.useCallback(async (path = savePath) => {
    if (!game || !window.api) return;
    const [folder, listed] = await Promise.all([
      path ? window.api.inspectSaveFolder(path) : Promise.resolve(null),
      window.api.listSaveBackups(game.id),
    ]);
    setInfo(folder);
    setBackups(listed?.backups || []);
  }, [game, savePath]);

  React.useEffect(() => { refresh(); }, [refresh]);
  React.useEffect(() => {
    if (!game || game.saveFolder || !window.api?.detectCommonSaveFolders) return undefined;
    let cancelled = false;
    setDetected({ loading: true, candidates: [] });
    window.api.detectCommonSaveFolders({ gameName: game.name, exePath: game.exePath, appid: game.appid })
      .then((result) => { if (!cancelled) setDetected({ loading: false, candidates: result?.candidates || [] }); })
      .catch(() => { if (!cancelled) setDetected({ loading: false, candidates: [] }); });
    return () => { cancelled = true; };
  }, [game?.id, game?.saveFolder, game?.name, game?.exePath, game?.appid]);
  React.useEffect(() => { const close = (event) => { if (event.key === 'Escape') onClose?.(); }; document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close); }, [onClose]);
  if (!game) return null;

  const chooseFolder = async () => {
    const path = await window.api?.pickSaveFolder?.();
    if (!path) return;
    setSavePath(path);
    onSaveFolder?.(path);
    await refresh(path);
  };
  const useDetected = async (candidatePath) => {
    setSavePath(candidatePath);
    onSaveFolder?.(candidatePath);
    await refresh(candidatePath);
  };
  const backup = async () => {
    if (!savePath) return chooseFolder();
    setBusy('backup');
    const result = await window.api?.createSaveBackup?.({ gameId: game.id, gameName: game.name, savePath });
    setBusy('');
    if (!result?.ok) return onNotice?.(result?.error || 'Backup failed.');
    onNotice?.(`Save backup created · ${readableBytes(result.backup.bytes)}`);
    refresh();
  };
  const searchForSaves = async () => {
    const root = await window.api?.pickDirectory?.();
    if (!root) return;
    setSearch({ open: true, root, loading: true, candidates: [], truncated: false, error: '' });
    const result = await window.api?.findSaveCandidates?.({ root, gameName: game.name });
    setSearch({ open: true, root, loading: false, candidates: result?.candidates || [], truncated: !!result?.truncated, error: result?.error || '' });
  };
  const restore = async (backup, mode) => {
    if (!savePath) return chooseFolder();
    setBusy(backup.backupPath);
    const result = await window.api?.restoreSaveBackup?.({ backupPath: backup.backupPath, savePath, mode });
    setBusy('');
    if (result?.conflict) { setRestoreChoice(backup); return; }
    if (!result?.ok) return onNotice?.(result?.error || 'Restore failed.');
    setRestoreChoice(null);
    onNotice?.(mode === 'safe-copy' ? 'Recovered into a separate safe folder.' : 'Recovered into the empty save folder.');
    if (result.restoredTo) window.api?.openPath?.(result.restoredTo);
  };

  return <AnimatePresence>
    <motion.div className="fixed inset-0 z-[130] grid place-items-center bg-black/65 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <motion.section initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} className="flex max-h-[min(760px,90vh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.97)] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.55)] px-5 py-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[rgb(var(--accent-2))]">Save Game Folder</p><h2 className="mt-1 text-lg font-black">{game.name}</h2><p className="mt-1 text-xs text-muted">Local folders and backups only. NEO-LIB never overwrites a live save.</p></div>
          <button onClick={onClose} className="rounded-md p-2 text-muted hover:bg-white/5 hover:text-ink" aria-label="Close save manager"><X size={18} /></button>
        </header>

        <div className="min-h-0 overflow-y-auto p-5">
          <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.32)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-bold">Current save folder</h3><p className="mt-1 break-all font-mono text-[10.5px] text-muted">{savePath || 'Not selected yet'}</p>{info?.ok && <p className="mt-2 text-[11px] text-emerald-300"><CheckCircle2 size={12} className="mr-1 inline" />{info.files.toLocaleString()} files · {readableBytes(info.bytes)}{info.truncated ? ' · size estimate' : ''}</p>}{info && !info.ok && savePath && <p className="mt-2 text-[11px] text-amber-300">{info.error}</p>}</div><div className="flex flex-wrap gap-2"><Action onClick={chooseFolder} icon={<FolderOpen size={14} />}>Choose folder</Action>{savePath && <Action onClick={() => window.api?.openPath?.(savePath)} icon={<FolderOpen size={14} />}>Open folder</Action>}</div></div>
            <div className="mt-3 flex flex-wrap gap-2"><Action onClick={searchForSaves} icon={<FolderSearch size={14} />}>Search a drive / folder</Action><Action primary onClick={backup} disabled={busy === 'backup'} icon={<HardDriveDownload size={14} />}>{busy === 'backup' ? 'Creating backup…' : 'Back up saves'}</Action></div>
            {!savePath && <div className="mt-4 border-t border-[rgb(var(--border)/0.65)] pt-3"><div className="flex items-center gap-2"><FolderSearch size={13} className="text-[rgb(var(--accent-2))]" /><h4 className="text-[11px] font-black uppercase tracking-[0.16em]">Common save folders</h4></div>{detected.loading ? <p className="mt-2 text-[11px] text-muted">Checking standard Windows and Steam locations…</p> : detected.candidates.length ? <div className="mt-2 space-y-1.5">{detected.candidates.map((candidate) => <div key={candidate.path} className="flex flex-wrap items-center gap-2 rounded-lg border border-[rgb(var(--border)/0.65)] bg-[rgb(var(--surface)/0.28)] px-2.5 py-2"><div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-[rgb(var(--accent-2))]">{candidate.source}</p><p className="truncate font-mono text-[9.5px] text-muted" title={candidate.path}>{candidate.path}</p></div><Action onClick={() => useDetected(candidate.path)} icon={<CheckCircle2 size={12} />}>Use</Action></div>)}</div> : <p className="mt-2 text-[11px] leading-relaxed text-muted">No standard existing save folder was found. This does not require launching through NEO-LIB; choose a folder or use the wider search if the game stores saves somewhere custom.</p>}</div>}
          </section>

          <section className="mt-4"><div className="mb-2 flex items-center gap-2"><ArchiveRestore size={15} className="text-[rgb(var(--accent))]" /><h3 className="text-xs font-black uppercase tracking-[0.18em]">NEO-LIB backups</h3><span className="text-[10px] text-muted">{backups.length}</span></div>{backups.length ? <div className="space-y-2">{backups.map((backup) => <div key={backup.backupPath} className="flex flex-wrap items-center gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.25)] p-3"><div className="min-w-[180px] flex-1"><p className="text-xs font-bold">{dateTime(backup.createdAt)}</p><p className="mt-0.5 text-[10px] text-muted">{backup.files?.toLocaleString() || 0} files · {readableBytes(backup.bytes)}</p><p className="mt-1 break-all font-mono text-[9px] text-muted/70">{backup.backupPath}</p></div><Action onClick={() => window.api?.openPath?.(backup.backupPath)} icon={<FolderOpen size={13} />}>View</Action><Action primary onClick={() => restore(backup, 'empty')} disabled={busy === backup.backupPath} icon={<Copy size={13} />}>{busy === backup.backupPath ? 'Recovering…' : 'Recover'}</Action></div>)}</div> : <div className="rounded-xl border border-dashed border-[rgb(var(--border))] p-5 text-center text-xs text-muted">Your backups will live privately inside NEO-LIB’s app-data folder.</div>}</section>

          <section className="mt-4 rounded-xl border border-amber-400/20 bg-amber-300/[0.05] p-3 text-[11px] leading-relaxed text-muted"><ShieldAlert size={14} className="mr-1 inline text-amber-300" /><b className="text-amber-200">Restore safety:</b> if the chosen live save folder contains any files, recovery stops. You can then recover to a separately named <em>NEOLIB Restored</em> folder and inspect or move files yourself. Renaming individual save files may make some games unable to read them.</section>
        </div>
      </motion.section>

      {search.open && <SearchResults search={search} onClose={() => setSearch((value) => ({ ...value, open: false }))} onChoose={async (path) => { setSavePath(path); onSaveFolder?.(path); await refresh(path); setSearch((value) => ({ ...value, open: false })); }} />}
      {restoreChoice && <RestoreChoice backup={restoreChoice} onCancel={() => setRestoreChoice(null)} onSafeCopy={() => restore(restoreChoice, 'safe-copy')} />}
    </motion.div>
  </AnimatePresence>;
}

function Action({ children, icon, primary = false, ...props }) { return <button {...props} className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10.5px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${primary ? 'border-[rgb(var(--accent)/0.6)] bg-[rgb(var(--accent)/0.18)] text-ink hover:bg-[rgb(var(--accent)/0.26)]' : 'border-[rgb(var(--border))] text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink'}`}>{icon}{children}</button>; }

function SearchResults({ search, onClose, onChoose }) { return <div className="absolute inset-0 grid place-items-center bg-black/55 p-6"><section className="w-full max-w-xl rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-2xl"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[rgb(var(--accent-2))]">Save finder</p><h3 className="text-sm font-black">Review possible old save folders</h3></div><button onClick={onClose} className="text-xs text-muted hover:text-ink">Close</button></div><p className="mt-2 break-all text-[10px] text-muted">Searched: {search.root}</p>{search.loading && <p className="py-8 text-center text-xs text-muted">Searching folder names…</p>}{search.error && <p className="mt-4 text-xs text-rose-300">{search.error}</p>}{!search.loading && !search.error && <><p className="mt-3 text-[11px] text-muted">These are name matches only—open or select one after checking it belongs to this game.</p><div className="mt-3 max-h-72 space-y-1 overflow-y-auto">{search.candidates.length ? search.candidates.map((candidate) => <button key={candidate.path} onClick={() => onChoose(candidate.path)} className="block w-full rounded-md border border-transparent px-2.5 py-2 text-left hover:border-[rgb(var(--accent)/0.45)] hover:bg-[rgb(var(--accent)/0.08)]"><span className="block break-all font-mono text-[10px] text-ink">{candidate.path}</span><span className="text-[9px] text-muted">{candidate.matchedTerms} name match{candidate.matchedTerms !== 1 ? 'es' : ''}</span></button>) : <p className="p-4 text-center text-xs text-muted">No matching folder names found. Try a more specific game folder or drive.</p>}</div>{search.truncated && <p className="mt-2 text-[10px] text-amber-300">Search limit reached; narrow the selected folder for more precise results.</p>}</>}</section></div>; }

function RestoreChoice({ backup, onCancel, onSafeCopy }) { return <div className="absolute inset-0 grid place-items-center bg-black/55 p-6"><section className="w-full max-w-md rounded-xl border border-amber-400/30 bg-[rgb(var(--surface))] p-5 shadow-2xl"><ShieldAlert className="text-amber-300" size={22} /><h3 className="mt-3 text-base font-black">Live save folder is not empty</h3><p className="mt-2 text-xs leading-relaxed text-muted">Nothing has been overwritten. Recover this backup into a new, separately named folder instead, then inspect the files before moving anything into the live save folder.</p><div className="mt-4 flex justify-end gap-2"><Action onClick={onCancel}>Cancel</Action><Action primary onClick={onSafeCopy} icon={<Copy size={13} />}>Recover safely</Action></div></section></div>; }
