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
  const picked = items.filter(item => selected.includes(item.key) && !failedImages.has(item.key));
  return <Modal open onClose={onClose} wide title={`Choose ${field === 'all-locked' ? 'metadata' : field} · ${game.name}`} testid="refresh-candidates-modal">
    <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
      <p className="text-sm text-muted">{progress ? `Game ${progress}. ` : ''}Nothing changes until you apply your selection. Check the title and source: search results may include other editions or games.</p>
      <div className="rounded-lg hairline p-3 text-xs text-muted">Current: {field === 'description' ? <div className="whitespace-pre-wrap max-h-28 overflow-auto">{game.about || game.shortDescription || 'Missing'}</div>
        : field === 'all-locked' ? game.name
        : <div className="flex gap-2 overflow-auto">{(field === 'screenshots' ? game.screenshots || [] : [field === 'icon' ? game.icon || game.coverUrl : game.background || game.headerImage]).filter(Boolean).map((url, i) => <img key={i} src={url} alt="Current artwork" className="h-16 w-24 object-contain" />)}</div>}</div>
      {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
      {field === 'screenshots' && <p className="text-xs text-muted">Select multiple images. Applying replaces the current screenshot collection with exactly your selection.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {items.slice(0, limit).map(item => <button key={item.key} disabled={failedImages.has(item.key)} aria-pressed={selected.includes(item.key)} onClick={() => choose(item.key)} className={`rounded-lg border-2 p-3 text-left min-w-0 ${selected.includes(item.key) ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.12)]' : 'border-[rgb(var(--border))] bg-panel'}`}>
          <div className="text-sm font-semibold break-words">{item.name}</div><div className="text-xs text-muted mb-2">{item.source} · {selected.includes(item.key) ? 'Selected' : 'Click to select'}</div>
          {field === 'description' ? <div className="max-h-48 overflow-auto whitespace-pre-wrap text-sm">{item.value}</div>
          : field === 'all-locked' ? <div className="space-y-2 text-sm">{(item.record.headerImage || item.record.capsuleImage) && <img src={item.record.headerImage || item.record.capsuleImage} alt="Proposed artwork" className="w-full h-28 object-contain" />}<div className="max-h-32 overflow-auto whitespace-pre-wrap">{item.record.about || item.record.shortDescription || 'No description'}</div><div>{(item.record.genres || []).join(', ')}</div><div>{item.record.screenshots?.length || 0} screenshots · {(item.record.developers || []).join(', ')}</div></div>
          : failedImages.has(item.key) ? <div className="text-sm">Image unavailable — choose another result.</div> : <img src={item.value} alt={`${item.name} ${field} candidate`} className="w-full h-36 object-contain" onError={() => setFailedImages(old => new Set([...old, item.key]))} />}
        </button>)}
      </div>
      {field === 'all-locked' && picked.length > 0 && <details className="hairline rounded p-3 text-sm"><summary>Review every field that will change</summary><div className="max-h-64 overflow-auto space-y-3 mt-3">{Object.entries(selectedRefreshPatch(field, picked)).map(([key, value]) => <div key={key}><strong>{key}</strong><div className="whitespace-pre-wrap break-words">{Array.isArray(value) ? value.join('\n') : String(value)}</div></div>)}</div></details>}
      {busy && <p role="status">Searching sources… You can cancel without changing anything.</p>}
      {!busy && !items.length && <p>No usable results found. Keep your current data or try another search.</p>}
      {(items.length > limit || more) ? <button className="hairline rounded px-4 py-2" disabled={busy} onClick={() => { const next = limit + 5; setLimit(next); load(next); }}>Show more (+5)</button> : !busy && <p className="text-xs text-muted">No more results from the available sources.</p>}
      <div className="sticky bottom-0 bg-panel border-t border-[rgb(var(--border))] pt-3 flex gap-3 justify-end">
        <button className="hairline rounded px-3 py-2" onClick={onClose}>{progress ? 'Stop review' : 'Cancel'}</button>
        {onSkip && <button className="hairline rounded px-3 py-2" onClick={onSkip}>Skip game</button>}
        <button disabled={!picked.length || busy} className="rounded px-4 py-2 bg-[rgb(var(--accent))] text-[rgb(var(--surface))] disabled:opacity-40" onClick={async () => { setBusy(true); try { await onApply(selectedRefreshPatch(field, picked)); } catch (e) { setError(e.message || 'Could not save selection'); setBusy(false); } }}>Apply selected{field === 'screenshots' ? ` (${picked.length})` : ''}</button>
      </div>
    </div>
  </Modal>;
}
