import React from 'react';
import { CheckSquare, Gamepad2, Loader2, ScanSearch, Square } from 'lucide-react';
import { RETRO_PLATFORMS, ROM_EXTENSION_GROUPS, detectRomPlatform, retroPlatform, romDisplayName, romExtensions, romLibraryEntry } from '../../lib/emulation-library-model.mjs';

const normalizedPath = value => String(value || '').trim().replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();

export function normalizeRetroProfiles(profiles) {
  return (Array.isArray(profiles) ? profiles : []).slice(0, 20).flatMap((profile, index) => {
    const id = String(profile?.id || `retro-${index + 1}`).replace(/[^a-z0-9-]/gi, '-').slice(0, 64);
    if (!id) return [];
    return [{
      id,
      name: String(profile?.name || 'Retro Profile').trim().slice(0, 80) || 'Retro Profile',
      platform: Object.hasOwn(ROM_EXTENSION_GROUPS, profile?.platform) ? profile.platform : 'generic',
      emulatorPath: String(profile?.emulatorPath || '').trim().slice(0, 1024),
      romFolder: String(profile?.romFolder || '').trim().slice(0, 1024),
      argumentPrefix: String(profile?.argumentPrefix || '').trim().slice(0, 240),
      workingDirectory: String(profile?.workingDirectory || '').trim().slice(0, 1024),
      trackingMethod: profile?.trackingMethod === 'manual' ? 'manual' : 'emulator-process',
    }];
  });
}

export default function RetroProfilesPanel({ profiles, onChange, onImportRoms, existingGames = [] }) {
  const [drafts, setDrafts] = React.useState(() => normalizeRetroProfiles(profiles));
  const [scan, setScan] = React.useState({ profileId: '', rows: [], busy: false, message: '' });
  React.useEffect(() => setDrafts(normalizeRetroProfiles(profiles)), [profiles]);
  const update = (id, patch) => setDrafts((current) => current.map((profile) => profile.id === id ? { ...profile, ...patch } : profile));
  const save = () => onChange?.(normalizeRetroProfiles(drafts));
  const add = () => setDrafts((current) => [...current, { id: `retro-${Date.now()}`, name: 'New Retro Profile', platform: 'generic', emulatorPath: '', romFolder: '', argumentPrefix: '', workingDirectory: '', trackingMethod: 'emulator-process' }]);
  const remove = (id) => { const next = drafts.filter((profile) => profile.id !== id); setDrafts(next); onChange?.(normalizeRetroProfiles(next)); if (scan.profileId === id) setScan({ profileId: '', rows: [], busy: false, message: '' }); };
  const chooseExecutable = async (id) => { const result = await window.api?.pickExe?.(); const path = typeof result === 'string' ? result : result?.exePath; if (path) update(id, { emulatorPath: path }); };
  const chooseFolder = async (id) => { const path = await window.api?.pickDirectory?.(); if (path) update(id, { romFolder: path }); };
  const scanProfile = async (profile) => {
    if (!profile.emulatorPath || !profile.romFolder) { setScan({ profileId: profile.id, rows: [], busy: false, message: 'Choose both the installed emulator and ROM folder first.' }); return; }
    if (!window.api?.scanRoms) { setScan({ profileId: profile.id, rows: [], busy: false, message: 'ROM scanning is available in the installed NEO-LIB app.' }); return; }
    setScan({ profileId: profile.id, rows: [], busy: true, message: 'Scanning the selected ROM folder…' });
    const result = await window.api.scanRoms({ root: profile.romFolder, extensions: romExtensions(profile.platform), maxDepth: 6, maxFiles: 2000 });
    if (!result?.ok) { setScan({ profileId: profile.id, rows: [], busy: false, message: result?.error || 'ROM scan failed.' }); return; }
    const existing = new Set(existingGames.map(game => normalizedPath(game.romPath)).filter(Boolean));
    const rows = result.items.filter(item => !existing.has(normalizedPath(item.path))).map(item => ({ ...item, name: romDisplayName(item.path), platform: detectRomPlatform(item.path, profile.platform), selected: true }));
    const skipped = result.items.length - rows.length;
    setScan({ profileId: profile.id, rows, busy: false, message: `${rows.length} new ROM${rows.length === 1 ? '' : 's'} ready for review${skipped ? ` · ${skipped} already imported` : ''}${result.truncated ? ' · result limit reached' : ''}.` });
  };
  const updateRow = (path, patch) => setScan((current) => ({ ...current, rows: current.rows.map(row => row.path === path ? { ...row, ...patch } : row) }));
  const setAll = (selected) => setScan((current) => ({ ...current, rows: current.rows.map(row => ({ ...row, selected })) }));
  const importRows = () => {
    const profile = drafts.find(item => item.id === scan.profileId);
    if (!profile) return;
    const entries = scan.rows.filter(row => row.selected && row.platform !== 'generic').flatMap(row => {
      const entry = romLibraryEntry({ profile: { ...profile, platform: row.platform }, romPath: row.path, sizeBytes: row.sizeBytes });
      if (!entry) return [];
      const platform = retroPlatform(row.platform);
      const name = String(row.name || entry.name).trim().slice(0, 180) || entry.name;
      return [{ ...entry, name, metadataQuery: `${name} ${platform.shortLabel}` }];
    });
    if (!entries.length) return;
    onChange?.(normalizeRetroProfiles(drafts));
    const imported = Number(onImportRoms?.(entries)) || 0;
    if (!imported) { setScan((current) => ({ ...current, message: 'No new ROMs were imported.' })); return; }
    const importedPaths = new Set(entries.map(entry => normalizedPath(entry.romPath)));
    setScan((current) => ({ ...current, rows: current.rows.filter(row => !importedPaths.has(normalizedPath(row.path))), message: `Imported ${imported} ROM${imported === 1 ? '' : 's'}. Review suggested descriptions and case art before saving.` }));
  };

  const selectedCount = scan.rows.filter(row => row.selected && row.platform !== 'generic').length;
  const unresolvedCount = scan.rows.filter(row => row.selected && row.platform === 'generic').length;
  return <div className="mt-4 space-y-3 border-t border-[rgb(var(--border)/0.52)] pt-4">
    <p className="text-[10.5px] leading-relaxed text-muted">NEO-LIB never supplies emulators, BIOS files or ROMs. Each scan stays inside the folder you choose, shows a review list, and launches an imported ROM only through its saved emulator profile.</p>
    {drafts.map((profile) => <div key={profile.id} className="rounded-lg border border-[rgb(var(--border)/0.68)] bg-panel/35 p-3">
      <div className="mb-2 flex items-center gap-2"><input aria-label="Retro Profile name" value={profile.name} onChange={(event) => update(profile.id, { name: event.target.value })} className="min-w-0 flex-1 rounded-md bg-panel/60 hairline px-2.5 py-1.5 text-xs text-ink focus:border-[rgb(var(--accent)/0.6)] focus:outline-none" /><button type="button" onClick={() => remove(profile.id)} className="rounded-md px-2 py-1.5 text-[10px] text-muted hover:bg-red-400/10 hover:text-red-300">Remove</button></div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-[10px] text-muted">Platform<select value={profile.platform} onChange={(event) => update(profile.id, { platform: event.target.value })} className="mt-1 w-full rounded-md bg-panel/60 hairline px-2.5 py-1.5 text-xs text-ink focus:border-[rgb(var(--accent)/0.6)] focus:outline-none"><option value="generic">Auto-detect clear extensions</option>{Object.entries(RETRO_PLATFORMS).map(([id, platform]) => <option key={id} value={id}>{platform.label}</option>)}</select><span className="mt-1 block text-[9px] text-muted">{romExtensions(profile.platform).join(' ')}</span></label>
        <label className="text-[10px] text-muted">Tracking<select value={profile.trackingMethod} onChange={(event) => update(profile.id, { trackingMethod: event.target.value })} className="mt-1 w-full rounded-md bg-panel/60 hairline px-2.5 py-1.5 text-xs text-ink focus:border-[rgb(var(--accent)/0.6)] focus:outline-none"><option value="emulator-process">Emulator process</option><option value="manual">Manual only</option></select></label>
      </div>
      <PathField label="Installed emulator" value={profile.emulatorPath} onChoose={() => chooseExecutable(profile.id)} onChange={(value) => update(profile.id, { emulatorPath: value })} chooseLabel="Choose .exe" />
      <PathField label="ROM folder" value={profile.romFolder} onChoose={() => chooseFolder(profile.id)} onChange={(value) => update(profile.id, { romFolder: value })} chooseLabel="Choose folder" />
      <div className="mt-2 grid gap-2 sm:grid-cols-2"><label className="text-[10px] text-muted">Argument before ROM path<input value={profile.argumentPrefix} onChange={(event) => update(profile.id, { argumentPrefix: event.target.value })} placeholder="Optional, e.g. -L core.dll" className="mt-1 w-full rounded-md bg-panel/60 hairline px-2.5 py-1.5 text-xs text-ink focus:border-[rgb(var(--accent)/0.6)] focus:outline-none" /></label><label className="text-[10px] text-muted">Working folder<input value={profile.workingDirectory} onChange={(event) => update(profile.id, { workingDirectory: event.target.value })} placeholder="Optional" className="mt-1 w-full rounded-md bg-panel/60 hairline px-2.5 py-1.5 text-xs text-ink focus:border-[rgb(var(--accent)/0.6)] focus:outline-none" /></label></div>
      <button type="button" data-testid={`retro-profile-scan-${profile.id}`} onClick={() => scanProfile(profile)} disabled={scan.busy} className="mt-3 inline-flex items-center gap-2 rounded-md border border-[rgb(var(--accent)/0.42)] bg-[rgb(var(--accent)/0.08)] px-3 py-2 text-[10px] font-bold text-ink hover:bg-[rgb(var(--accent)/0.15)] disabled:opacity-45">{scan.busy && scan.profileId === profile.id ? <Loader2 size={12} className="animate-spin" /> : <ScanSearch size={12} />} Scan and review ROMs</button>
    </div>)}
    {scan.profileId && <section data-testid="retro-rom-review" className="rounded-xl border border-[rgb(var(--accent)/0.44)] bg-[rgb(var(--surface)/0.55)] p-3">
      <div className="flex flex-wrap items-center gap-2"><Gamepad2 size={14} className="text-[rgb(var(--accent))]" /><strong className="text-xs text-ink">ROM import review</strong><span className="text-[10px] text-muted">{scan.message}</span><div className="ml-auto flex gap-1"><button type="button" onClick={() => setAll(true)} className="rounded px-2 py-1 text-[9px] text-muted hover:bg-panel hover:text-ink">All</button><button type="button" onClick={() => setAll(false)} className="rounded px-2 py-1 text-[9px] text-muted hover:bg-panel hover:text-ink">None</button></div></div>
      <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-1">{scan.rows.map(row => <div key={row.path} className={`grid grid-cols-[24px_minmax(120px,1fr)_170px] items-center gap-2 rounded-lg border px-2 py-1.5 ${row.selected ? 'border-[rgb(var(--accent)/0.45)] bg-[rgb(var(--accent)/0.07)]' : 'border-[rgb(var(--border)/0.55)] bg-panel/20'}`}>
        <button type="button" aria-label={`${row.selected ? 'Exclude' : 'Include'} ${row.name}`} onClick={() => updateRow(row.path, { selected: !row.selected })} className="text-[rgb(var(--accent))]">{row.selected ? <CheckSquare size={15} /> : <Square size={15} />}</button>
        <label className="min-w-0"><span className="sr-only">ROM title</span><input value={row.name} onChange={(event) => updateRow(row.path, { name: event.target.value })} className="w-full truncate rounded bg-transparent px-1 py-1 text-[10.5px] font-semibold text-ink outline-none focus:bg-panel/70" title={row.path} /><span className="block truncate px-1 text-[8.5px] text-muted" title={row.path}>{row.path}</span></label>
        <select aria-label={`Platform for ${row.name}`} value={row.platform} onChange={(event) => updateRow(row.path, { platform: event.target.value })} className="min-w-0 rounded-md bg-panel/60 hairline px-2 py-1.5 text-[9px] text-ink outline-none"><option value="generic">Choose platform</option>{Object.entries(RETRO_PLATFORMS).map(([id, platform]) => <option key={id} value={id}>{platform.shortLabel}</option>)}</select>
      </div>)}</div>
      {unresolvedCount > 0 && <p className="mt-2 rounded-md border border-amber-300/30 bg-amber-300/[0.06] px-2.5 py-2 text-[9.5px] text-amber-100">Choose a platform for {unresolvedCount} ambiguous disc/archive file{unresolvedCount === 1 ? '' : 's'} before importing. NEO-LIB will not guess.</p>}
      {!scan.busy && !scan.rows.length && <p className="mt-3 rounded-lg hairline p-3 text-[10px] text-muted">No new supported ROMs were found for this profile.</p>}
      <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setScan({ profileId: '', rows: [], busy: false, message: '' })} className="rounded-md hairline px-3 py-2 text-[10px] text-muted hover:text-ink">Close review</button><button type="button" data-testid="retro-import-selected" disabled={!selectedCount} onClick={importRows} className="rounded-md bg-[rgb(var(--accent))] px-3 py-2 text-[10px] font-black text-[rgb(var(--surface))] disabled:opacity-40">Import {selectedCount} selected</button></div>
    </section>}
    <div className="flex flex-wrap gap-2"><button type="button" data-testid="retro-profile-add" onClick={add} className="rounded-md hairline px-3 py-2 text-xs text-muted hover:border-[rgb(var(--accent)/0.5)] hover:text-ink">Add profile</button><button type="button" data-testid="retro-profile-save" onClick={save} className="rounded-md bg-[rgb(var(--accent))] px-3 py-2 text-xs font-bold text-[rgb(var(--surface))] hover:brightness-110">Save Retro Profiles</button></div>
  </div>;
}

function PathField({ label, value, onChoose, onChange, chooseLabel }) {
  return <label className="mt-2 block text-[10px] text-muted">{label}<div className="mt-1 flex gap-2"><input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 rounded-md bg-panel/60 hairline px-2.5 py-1.5 font-mono text-[10px] text-ink focus:border-[rgb(var(--accent)/0.6)] focus:outline-none" /><button type="button" onClick={onChoose} className="shrink-0 rounded-md hairline px-2 text-[10px] text-muted hover:border-[rgb(var(--accent)/0.5)] hover:text-ink">{chooseLabel}</button></div></label>;
}
