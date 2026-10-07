import React from 'react';
import RetroConnectionsPanel from './RetroConnectionsPanel';
import { reviewedRetroPatch, retroEntryFromSource } from '../../lib/retro-source-model.mjs';
const button = 'rounded-md hairline px-3 py-2 text-xs text-ink disabled:opacity-40';
const control = 'rounded-md hairline bg-panel/60 px-3 py-2 text-xs text-ink';

export default function RetroSourcesPanel({ profiles = [], existingGames = [], onImportRoms, onApplyMetadata }) {
  const [source, setSource] = React.useState('skraper');
  const [profileId, setProfileId] = React.useState('');
  const [systemId, setSystemId] = React.useState('');
  const [platforms, setPlatforms] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [gameId, setGameId] = React.useState('');
  const [consent, setConsent] = React.useState(false);
  const [replace, setReplace] = React.useState(false);
  const [exportCovers, setExportCovers] = React.useState(false);
  const [rows, setRows] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [details, setDetails] = React.useState(null);
  const [checked, setChecked] = React.useState(new Set());
  const [page, setPage] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const mounted = React.useRef(true);
  const downloadId = React.useRef('');
  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; if (downloadId.current) window.api.cancelRomMDownload({ id: downloadId.current }).catch(() => {}); }; }, []);
  const profile = profiles.find(item => item.id === profileId);
  const localGames = existingGames.filter(item => item.source === 'emulation' && (!profileId || item.emulatorProfileId === profileId));
  const localGame = localGames.find(item => item.id === gameId);
  const reset = () => { setRows([]); setSelected(null); setDetails(null); setChecked(new Set()); setPage(0); setMessage(''); setConsent(false); setReplace(false); setHasMore(false); };
  const run = async action => {
    if (busy) return;
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { if (mounted.current) setMessage(error.message || 'This request failed safely.'); }
    finally { if (mounted.current) setBusy(false); }
  };
  const requireResult = result => { if (!result?.ok) throw Error(result?.error || 'Source could not be reached.'); return result; };
  const browse = async offset => {
    const result = requireResult(await window.api.searchRetroSource({ source, query, systemId, offset }));
    if (!mounted.current) return;
    setRows(result.games); setHasMore(result.hasMore); setPage(offset / 50); setSelected(null); setDetails(null);
    setMessage(result.games.length ? 'Confirm the game and platform before using its data.' : 'No matches. Try a different title or platform.');
  };
  const choose = async row => {
    const result = source === 'skraper'
      ? requireResult(await window.api.prepareRetroGamelistArtwork({ profileId, paths: row.media }))
      : requireResult(await window.api.retroSourceDetails({ source, id: row.id }));
    if (!mounted.current) return;
    setSelected(row);
    setDetails(source === 'skraper' ? { metadata: { ...row, metadataSource: 'skraper-export', headerImage: result.images.image, background: result.images.image, logoImage: result.images.logo }, assets: Object.values(result.images).map((url, index) => ({ id: String(index), url })), warnings: [] } : result);
    setMessage('Preview only. Your library is unchanged until you use an action below.');
  };
  const importExport = async () => {
    const chosen = rows.filter(row => checked.has(row.romPath));
    if (chosen.length > 100) throw Error('Import up to 100 reviewed games at a time.');
    const entries = [];
    for (const row of chosen) {
      const result = requireResult(await window.api.prepareRetroGamelistArtwork({ profileId, paths: row.media }));
      entries.push(retroEntryFromSource(profile, row, { ...row, metadataSource: 'skraper-export', portraitImage: exportCovers ? result.images.image : undefined, headerImage: exportCovers ? undefined : result.images.image, background: exportCovers ? undefined : result.images.image, logoImage: result.images.logo }));
    }
    if (mounted.current) { onImportRoms?.(entries); setChecked(new Set()); }
  };
  const download = async () => {
    if (!profile || !selected || !systemId || selected.systemId !== systemId || details.systemId !== systemId) throw Error('Choose the corresponding server platform and your matching saved emulator profile.');
    downloadId.current = selected.id; setDownloading(true);
    let result;
    try { result = requireResult(await window.api.downloadRomMGame({ id: selected.id, consent, systemId, revision: details.connectionRevision })); }
    finally { downloadId.current = ''; if (mounted.current) setDownloading(false); }
    if (!mounted.current) return;
    try { onImportRoms?.([retroEntryFromSource(profile, result, details.metadata)]); }
    catch (error) { setMessage(`Downloaded privately, without launching. ${error.message}`); }
  };
  if (!window.api?.searchRetroSource) return null;
  return <section className="rounded-xl hairline bg-panel/30 p-4 space-y-3" aria-label="Retro sources and import review">
    <h3 className="text-sm font-bold text-ink">Retro sources · artwork and collections</h3>
    <details className="rounded-lg hairline p-3"><summary className="cursor-pointer text-xs text-ink">Configure ScreenScraper / RomM connections</summary><div className="mt-3"><RetroConnectionsPanel /></div></details>
    <p className="text-xs text-muted">Save your emulator profiles above first. Imports add new games only; existing ROMs, progress and protected artwork are preserved. Downloads are never launched automatically.</p>
    <div className="flex flex-wrap gap-2">{[['skraper','Skraper export'],['screenscraper','ScreenScraper'],['romm','RomM']].map(([id, name]) => <button type="button" key={id} className={button} disabled={busy} aria-pressed={source === id} onClick={() => { reset(); setSource(id); setPlatforms([]); setSystemId(''); }}>{name}</button>)}</div>
    <label className="block text-xs text-muted">Saved emulator profile<select value={profileId} disabled={busy} onChange={e => { reset(); setProfileId(e.target.value); setGameId(''); }} className={`${control} ml-2`}><option value="">Choose a profile</option>{profiles.map(item => <option key={item.id} value={item.id}>{item.name} · {item.platform}</option>)}</select></label>
    {source === 'skraper' ? <>
      <p className="text-xs text-muted">Choose a gamelist.xml inside the profile’s ROM folder. Relative images/logos are copied privately. Export images are treated as scene artwork—not guessed to be portrait covers.</p>
      <label className="flex gap-2 text-xs text-muted"><input type="checkbox" checked={exportCovers} disabled={busy} onChange={e => setExportCovers(e.target.checked)} />I reviewed the exported images: use them as box covers instead of scene artwork.</label>
      <button type="button" className={button} disabled={busy || !profile?.romFolder || !profile?.emulatorPath || profile?.platform === 'generic'} onClick={() => run(async () => {
        const result = requireResult(await window.api.inspectRetroGamelist({ profileId })); if (!mounted.current) return;
        setRows(result.items); setPage(0); setSelected(null); setDetails(null); setChecked(new Set()); setMessage(`${result.items.length} valid games; ${result.skipped} unsupported, missing or unsafe paths skipped. Review up to 100 per import.`);
      })}>Open and review export</button>
    </> : <>
      <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={busy} onClick={() => run(async () => { const result = requireResult(await window.api.retroSourcePlatforms({ source })); if (mounted.current) setPlatforms(result.platforms); })}>Load source platforms</button><select aria-label="Source platform" className={control} value={systemId} disabled={busy} onChange={e => { reset(); setSystemId(e.target.value); }}><option value="">Choose source platform</option>{platforms.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <div className="flex gap-2"><input aria-label="Retro title search" className={`${control} min-w-0 flex-1`} disabled={busy} placeholder="Game title" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); run(() => browse(0)); } }} /><button type="button" className={button} disabled={busy || source === 'screenscraper' && !query.trim()} onClick={() => run(() => browse(0))}>Search / browse</button></div>
      <label className="block text-xs text-muted">Existing local ROM (optional for artwork search)<select aria-label="Local ROM to enrich" className={`${control} mt-1 w-full`} value={gameId} disabled={busy} onChange={e => { setGameId(e.target.value); setConsent(false); }}><option value="">Choose a saved game</option>{localGames.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      {source === 'screenscraper' && <><label className="flex gap-2 text-xs text-muted"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} />I approve sending this ROM’s filename, size and MD5/SHA1 checksums to ScreenScraper (never the ROM itself).</label><button type="button" className={button} disabled={busy || !gameId || !systemId || !consent} onClick={() => run(async () => { const result = requireResult(await window.api.identifyRetroRom({ gameId, systemId, consent })); if (mounted.current) { setRows(result.games); setSelected(null); setDetails(null); } })}>Identify saved ROM by checksum</button></>}
    </>}
    <p role="status" className="text-xs text-muted">{busy ? 'Working… large ROM checksums or downloads may take time.' : message}</p>
    {downloading && <button type="button" className={button} onClick={() => window.api.cancelRomMDownload({ id: downloadId.current }).catch(() => setMessage('Could not cancel; the download remains bounded.'))}>Cancel ROM download</button>}
    <div className="max-h-64 overflow-y-auto space-y-1">{(source === 'skraper' ? rows.slice(page * 100, (page + 1) * 100) : rows).map(row => <div key={row.romPath || row.id} className="flex gap-2 rounded-md hairline p-2">
      {source === 'skraper' && <input aria-label={`Include ${row.name}`} type="checkbox" disabled={busy} checked={checked.has(row.romPath)} onChange={e => setChecked(old => { const next = new Set(old); if (e.target.checked) next.add(row.romPath); else next.delete(row.romPath); return next; })} />}
      <button type="button" disabled={busy} className="min-w-0 flex-1 text-left text-xs text-ink" onClick={() => run(() => choose(row))}>{row.name || row.romPath}<span className="block truncate text-muted">{row.platform || row.romPath} {row.matchedBy === 'checksum' ? '· checksum match' : ''}</span></button>
    </div>)}</div>
    {source === 'skraper' && rows.length > 0 && <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={busy || !page} onClick={() => setPage(page - 1)}>Previous 100</button><button type="button" className={button} disabled={busy || (page + 1) * 100 >= rows.length} onClick={() => setPage(page + 1)}>Next 100</button><button type="button" className={button} disabled={busy} onClick={() => setChecked(new Set(rows.slice(page * 100, (page + 1) * 100).map(row => row.romPath)))}>Select this page</button><button type="button" className={button} disabled={busy || !checked.size || checked.size > 100} onClick={() => run(importExport)}>Import {checked.size} reviewed games</button></div>}
    {source === 'romm' && <div className="flex gap-2"><button type="button" className={button} disabled={busy || page === 0} onClick={() => run(() => browse((page - 1) * 50))}>Previous</button><button type="button" className={button} disabled={busy || !hasMore} onClick={() => run(() => browse((page + 1) * 50))}>Next</button></div>}
    {selected && details && <div className="rounded-lg hairline p-3 space-y-3">
      <h4 className="font-bold text-sm text-ink">Review: {details.metadata.name || selected.name}</h4>
      <p className="text-xs text-muted whitespace-pre-line">{String(details.metadata.about || 'No description supplied.').slice(0, 2000)}</p>
      <p className="text-xs text-muted">{details.metadata.releaseDate} · {(details.metadata.genres || []).join(', ')} · {source}</p>
      <div className="flex gap-2 overflow-x-auto">{details.assets.map(asset => <img key={asset.id} src={asset.url} alt="Reviewed source artwork" className="h-36 max-w-64 rounded object-contain" />)}</div>
      {(details.warnings || []).map((warning, i) => <p key={i} className="text-xs text-amber-200">{warning}</p>)}
      {source !== 'skraper' && localGame && onApplyMetadata && <><label className="flex gap-2 text-xs text-muted"><input type="checkbox" checked={replace} disabled={busy} onChange={e => setReplace(e.target.checked)} />Replace existing metadata/artwork after my review (protected artwork is always kept). Otherwise, only fill empty fields.</label><button type="button" className={button} disabled={busy} onClick={() => { const patch = reviewedRetroPatch(localGame, details.metadata, { replace }); if (Object.keys(patch).length) onApplyMetadata(localGame.id, patch); setMessage(Object.keys(patch).length ? `Reviewed fields applied to ${localGame.name}. Launch settings and progress were kept.` : 'No eligible empty fields. Protected artwork was kept.'); }}>Apply reviewed fields to {localGame.name}</button></>}
      {source === 'romm' && <><label className="flex gap-2 text-xs text-muted"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} />I own/hold permission to download this ROM and confirm this server platform matches my saved emulator profile.</label><button type="button" className={button} disabled={busy || !consent || !profile?.emulatorPath || profile?.platform === 'generic' || !systemId || selected.systemId !== systemId} onClick={() => run(download)}>Download selected ROM and import reviewed game</button><p className="text-xs text-muted">One file at a time, up to 8 GiB. Multi-file games require manual extraction and a folder scan. Nothing launches automatically.</p></>}
      {details.mediaAvailable && <div className="flex gap-2">{[['manual','Open supplied PDF manual'],['video','Open supplied video']].map(([kind, name]) => <button key={kind} type="button" className={button} disabled={busy} onClick={() => run(async () => { requireResult(await window.api.openRetroSourceMedia({ source, id: selected.id, kind })); if (mounted.current) setMessage('Media opened in your system viewer.'); })}>{name}</button>)}</div>}
    </div>}
  </section>;
}
