import React from 'react';
import { normalizeExternalLibraryRoots } from '../../lib/externalLibraryRoots.mjs';

export default function ExternalLibraryRootsPanel({ roots = [], onChange }) {
  const [name, setName] = React.useState('');
  const [kind, setKind] = React.useState('removable');
  const [location, setLocation] = React.useState('');
  const [privateRoot, setPrivateRoot] = React.useState(true);
  const [message, setMessage] = React.useState('');
  const [status, setStatus] = React.useState({});
  const [revealed, setRevealed] = React.useState([]);
  const entries = normalizeExternalLibraryRoots(roots);

  const chooseFolder = async () => {
    const picked = await window.api?.pickDirectory?.();
    if (!picked) return;
    setLocation(picked);
    if (!name.trim()) setName(picked.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || 'Library drive');
  };
  const add = () => {
    const candidate = { id: `root-${Date.now()}`, name, kind, location, private: privateRoot };
    const next = normalizeExternalLibraryRoots([...entries, candidate]);
    if (next.length !== entries.length + 1) { setMessage('Enter a valid, unique folder or HTTPS catalogue link.'); return; }
    onChange?.(next);
    setName(''); setLocation(''); setMessage('Saved. No games were scanned or copied.');
  };
  const remove = (id) => { onChange?.(entries.filter((root) => root.id !== id)); setMessage('Pointer removed. Your games and files were not touched.'); };
  const check = async (root) => {
    if (!window.api?.checkLibraryRoot) { setStatus((current) => ({ ...current, [root.id]: 'Available only in the installed app.' })); return; }
    setStatus((current) => ({ ...current, [root.id]: 'Checking…' }));
    const result = await window.api.checkLibraryRoot(root.location).catch(() => ({ available: false }));
    setStatus((current) => ({ ...current, [root.id]: result?.available ? 'Online' : 'Offline or unavailable' }));
  };

  return <div className="mt-4 space-y-3 border-t border-[rgb(var(--border)/0.52)] pt-4" data-testid="external-library-roots-panel">
    <p className="text-[10.5px] leading-relaxed text-muted">Save a pointer to a folder you chose. NEO-LIB will not scan, copy or upload it. A game whose executable is inside this folder will be blocked with a clear message if the drive or NAS is offline. Cloud links are catalogue bookmarks only.</p>
    <div className="grid gap-2 sm:grid-cols-[minmax(120px,1fr)_150px]">
      <label className="text-[10px] text-muted">Name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="My external games" className="mt-1 w-full rounded-md bg-panel/60 hairline px-2.5 py-1.5 text-xs text-ink" /></label>
      <label className="text-[10px] text-muted">Type<select value={kind} onChange={(event) => { setKind(event.target.value); setLocation(''); }} className="mt-1 w-full rounded-md bg-panel/60 hairline px-2.5 py-1.5 text-xs text-ink"><option value="removable">External drive</option><option value="network">NAS / network</option><option value="local">Local folder</option><option value="cloud">Cloud catalogue</option></select></label>
    </div>
    <div className="flex flex-wrap items-end gap-2">
      <label className="min-w-[200px] flex-1 text-[10px] text-muted">{kind === 'cloud' ? 'HTTPS catalogue link' : 'Folder path'}<input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={1024} placeholder={kind === 'cloud' ? 'https://example.com/my-library' : 'D:\\Games or \\\\server\\share\\Games'} className="mt-1 w-full rounded-md bg-panel/60 hairline px-2.5 py-1.5 text-xs text-ink" /></label>
      {kind !== 'cloud' && <button type="button" onClick={chooseFolder} className="rounded-md hairline px-3 py-2 text-[10px] font-semibold text-ink">Choose folder</button>}
      <button type="button" onClick={add} className="rounded-md bg-[rgb(var(--accent))] px-3 py-2 text-[10px] font-bold text-[rgb(var(--surface))]">Save pointer</button>
    </div>
    <label className="flex items-center gap-2 text-[10px] text-muted"><input type="checkbox" checked={privateRoot} onChange={(event) => setPrivateRoot(event.target.checked)} /> Hide this path until I reveal it</label>
    {message && <p className="text-[10px] text-muted" role="status">{message}</p>}
    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">{entries.map((root) => <div key={root.id} className="rounded-lg hairline bg-panel/30 px-3 py-2 text-[10px]">
      <div className="flex flex-wrap items-center gap-2"><strong className="text-xs text-ink">{root.name}</strong><span className="text-muted">{root.kind}</span><span className="text-muted">{status[root.id] || (root.kind === 'cloud' ? 'Bookmark only' : 'Not checked')}</span><div className="ml-auto flex gap-2">{root.kind !== 'cloud' && <button type="button" onClick={() => check(root)} className="text-[rgb(var(--accent-2))] hover:underline">Check</button>}{root.kind === 'cloud' && <button type="button" onClick={() => window.api?.openExternal?.(root.location)} className="text-[rgb(var(--accent-2))] hover:underline">Open link</button>}{root.private && <button type="button" onClick={() => setRevealed((current) => current.includes(root.id) ? current.filter((id) => id !== root.id) : [...current, root.id])} className="text-[rgb(var(--accent-2))] hover:underline">{revealed.includes(root.id) ? 'Hide path' : 'Reveal path'}</button>}<button type="button" onClick={() => remove(root.id)} className="text-muted hover:text-ink">Remove</button></div></div>
      {(!root.private || revealed.includes(root.id)) && <div className="mt-1 break-all text-muted">{root.location}</div>}
    </div>)}</div>
  </div>;
}
