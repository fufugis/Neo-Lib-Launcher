import React from 'react';
import Modal from './Modal';
import { createRefreshSearch, selectedRefreshPatch } from '../lib/refreshCandidates.mjs';

export default function RefreshCandidatesModal({ game, field, options, progress, onClose, onSkip, onApply }) {
  const [items, setItems] = React.useState([]);
  const [limit, setLimit] = React.useState(5);
  const [selected, setSelected] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [more, setMore] = React.useState(true);
  const [error, setError] = React.useState('');
  const [failedImages, setFailedImages] = React.useState(new Set());
  const [customCoverUrl, setCustomCoverUrl] = React.useState('');
  const session = React.useRef(null);
  const generation = React.useRef(0);
  const loading = React.useRef(false);
  const load = async (count) => {
    if (loading.current) return;
    loading.current = true; setBusy(true); setError('');
    const version = generation.current;
    const current = () => version === generation.current;
    try {
      const result = await session.current.next(count, () => !current());
      if (!current()) return;
      setItems(result.candidates); setMore(result.more);
      if (result.failures.length) setError('Some sources were unavailable or timed out. Available results are shown; you can continue searching.');
    } catch (reason) { if (current()) setError(reason.message || 'Search failed. Please try again.'); }
    finally { if (current()) { loading.current = false; setBusy(false); } }
  };
  React.useEffect(() => {
    generation.current++;
    loading.current = false;
    session.current = createRefreshSearch(window.api, game, field, options);
    load(5);
    return () => { generation.current++; };
  }, []); // Parent keys each review session by game and field.
  const choose = (key) => setSelected(previous => field === 'screenshots'
    ? previous.includes(key) ? previous.filter(k => k !== key) : [...previous, key]
    : [key]);
  const manualCover = field === 'cover' && /^https:\/\//i.test(customCoverUrl.trim())
    ? { key: 'manual-cover-url', name: game.name || 'Custom image', source: 'Google Images · player selected', value: customCoverUrl.trim(), record: { name: game.name || 'Custom image', source: 'Google Images · player selected', portraitImage: customCoverUrl.trim() } }
    : null;
  const visibleItems = [...items.slice(0, limit), ...(manualCover && selected.includes(manualCover.key) ? [manualCover] : [])];
  const picked = [...items.filter(item => selected.includes(item.key) && !failedImages.has(item.key)), ...(manualCover && selected.includes(manualCover.key) ? [manualCover] : [])];
  const reviewLabel = field === 'all-locked' ? 'metadata' : field;
  const currentArtwork = (field === 'cover' ? [game.portraitImage || game.coverUrl || game.capsuleImage] : [game.portraitImage || game.coverUrl, game.headerImage, game.background, game.logoImage || game.logo]).filter(Boolean);
  return <Modal open onClose={onClose} wide title={`Choose ${field === 'cover' ? 'cover art' : reviewLabel} · ${game.name}`} testid="refresh-candidates-modal">
    <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
      <p className="text-sm text-muted">{progress ? `Game ${progress}. ` : ''}Nothing changes until you apply your selection. Check the title and source: search results may include other editions or games.{game.source === 'emulation' ? ` This ROM is filed under ${game.platform || 'your chosen console'}; confirm the result belongs to that version.` : ''}</p>
      <div className="rounded-lg hairline p-3 text-xs text-muted">Current: {field === 'description' ? <div className="whitespace-pre-wrap max-h-28 overflow-auto">{game.about || game.shortDescription || 'Missing'}</div>
        : field === 'all-locked' ? game.name
        : field === 'artwork' ? <div className="mt-2 grid grid-cols-4 gap-2">{currentArtwork.length ? currentArtwork.map((url, index) => <img key={`${url}:${index}`} src={url} alt="Current artwork" className="h-20 w-full rounded object-contain bg-black/20" />) : <span>No artwork</span>}</div>
        : <div className="flex gap-2 overflow-auto">{(field === 'screenshots' ? game.screenshots || [] : [field === 'cover' ? game.portraitImage || game.coverUrl || game.capsuleImage : field === 'icon' ? game.icon || game.coverUrl : game.background || game.headerImage]).filter(Boolean).map((url, i) => <img key={i} src={url} alt="Current artwork" className={field === 'cover' ? 'h-24 w-16 rounded object-contain' : 'h-16 w-24 object-contain'} />)}</div>}</div>
      {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
      {field === 'cover' && <div className="rounded-lg border border-[rgb(var(--accent-2)/0.28)] bg-[rgb(var(--accent-2)/0.05)] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold text-ink">Recommended portrait covers</p><p className="text-[10px] text-muted">SteamGridDB suggestions appear when its key is configured. You can also bring a direct image URL from Google Images.</p></div><button type="button" onClick={() => window.api?.openExternal?.(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${game.name || ''} game cover portrait`)}`)} className="rounded-md border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] font-bold text-ink hover:border-[rgb(var(--accent-2)/0.6)]">Open Google Images</button></div><div className="mt-2 flex gap-2"><input type="url" value={customCoverUrl} onChange={(event) => setCustomCoverUrl(event.target.value)} placeholder="Paste a direct https image URL" aria-label="Direct image URL for game cover" className="min-w-0 flex-1 rounded-md bg-[rgb(var(--surface)/0.45)] px-2.5 py-2 text-xs text-ink outline-none placeholder:text-muted" /><button type="button" disabled={!/^https:\/\//i.test(customCoverUrl.trim())} onClick={() => setSelected(['manual-cover-url'])} className="rounded-md bg-[rgb(var(--accent-2)/0.16)] px-3 text-[10px] font-bold text-ink disabled:opacity-40">Preview URL</button></div><p className="mt-1.5 text-[9px] text-muted">Google Images opens in your browser. Copy an image address back here, verify it is the correct title/edition, preview it and apply it yourself.</p></div>}
      {field === 'screenshots' && <p className="text-xs text-muted">Select multiple images. Applying replaces the current screenshot collection with exactly your selection.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {visibleItems.map(item => <button key={item.key} disabled={failedImages.has(item.key)} aria-pressed={selected.includes(item.key)} onClick={() => choose(item.key)} className={`rounded-lg border-2 p-3 text-left min-w-0 ${selected.includes(item.key) ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.12)]' : 'border-[rgb(var(--border))] bg-panel'}`}>
          <div className="text-sm font-semibold break-words">{item.name}</div><div className="text-xs text-muted mb-2">{item.source} · {selected.includes(item.key) ? 'Selected' : 'Click to select'}</div>
          {field === 'description' ? <div className="max-h-48 overflow-auto whitespace-pre-wrap text-sm">{item.value}</div>
          : field === 'all-locked' ? <div className="space-y-2 text-sm">{(item.record.headerImage || item.record.capsuleImage) && <img src={item.record.headerImage || item.record.capsuleImage} alt="Proposed artwork" className="w-full h-28 object-contain" />}<div className="max-h-32 overflow-auto whitespace-pre-wrap">{item.record.about || item.record.shortDescription || 'No description'}</div><div>{(item.record.genres || []).join(', ')}</div><div>{item.record.screenshots?.length || 0} screenshots · {(item.record.developers || []).join(', ')}</div></div>
          : field === 'cover' ? <div><img src={item.value || item.record.portraitImage || item.record.capsuleImage} alt="Recommended portrait cover" className="mx-auto h-56 max-w-full rounded bg-black/20 object-contain" /><p className="mt-2 text-xs text-muted">Portrait cover recommendation · {item.source}</p></div>
          : field === 'artwork' ? <div className="grid grid-cols-2 gap-2">{[item.record.portraitImage || item.record.capsuleImage || item.record.icon, item.record.headerImage, item.record.background, item.record.logoImage || item.record.logo].filter(Boolean).map((url, index) => <img key={`${url}:${index}`} src={url} alt="Suggested artwork" className="h-28 w-full rounded bg-black/20 object-contain" />)}</div>
          : failedImages.has(item.key) ? <div className="text-sm">Image unavailable — choose another result.</div> : <img src={item.value} alt={`${item.name} ${field} candidate`} className="w-full h-36 object-contain" onError={() => setFailedImages(old => new Set([...old, item.key]))} />}
        </button>)}
      </div>
      {(field === 'all-locked' || field === 'artwork') && picked.length > 0 && <details className="hairline rounded p-3 text-sm"><summary>Review every field that will change</summary><div className="max-h-64 overflow-auto space-y-3 mt-3">{Object.entries(selectedRefreshPatch(field, picked, game)).filter(([key]) => !['artworkRevisions', 'artworkSources'].includes(key)).map(([key, value]) => <div key={key}><strong>{key}</strong><div className="whitespace-pre-wrap break-words">{Array.isArray(value) ? value.join('\n') : String(value)}</div></div>)}</div></details>}
      {busy && <p role="status">Searching sources… You can cancel without changing anything.</p>}
      {!busy && !items.length && !manualCover && <p>No usable results found. Keep your current data or try another search.</p>}
      {(items.length > limit || more) ? <button className="hairline rounded px-4 py-2" disabled={busy} onClick={() => { const next = limit + 5; setLimit(next); load(next); }}>Show more (+5)</button> : !busy && <p className="text-xs text-muted">No more results from the available sources.</p>}
      <div className="sticky bottom-0 bg-panel border-t border-[rgb(var(--border))] pt-3 flex gap-3 justify-end">
        <button className="hairline rounded px-3 py-2" onClick={onClose}>{progress ? 'Stop review' : 'Cancel'}</button>
        {onSkip && <button className="hairline rounded px-3 py-2" onClick={onSkip}>Skip game</button>}
        <button disabled={!picked.length || busy} className="rounded px-4 py-2 bg-[rgb(var(--accent))] text-[rgb(var(--surface))] disabled:opacity-40" onClick={async () => { setBusy(true); try { await onApply(selectedRefreshPatch(field, picked, game)); } catch (e) { setError(e.message || 'Could not save selection'); setBusy(false); } }}>Apply selected{field === 'screenshots' ? ` (${picked.length})` : ''}</button>
      </div>
    </div>
  </Modal>;
}
