import React from 'react';
import { ImagePlus } from 'lucide-react';
import { normalizeLoungePreferences } from './lounge-layout-model.mjs';
import { prepareImportedArtwork } from './lounge-light-analysis.mjs';

export default function LoungeBackgroundImport({ preferences, onChange }) {
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');
  const pickBackground = async () => {
    if (!window.api?.importLoungeBackground) { setError('Choose artwork in the installed Windows app.'); return; }
    setBusy(true); setError(''); setStatus('');
    try {
      const picked = await window.api.importLoungeBackground();
      if (!picked) return;
      if (!picked.ok) { setError(picked.error || 'Could not import this artwork or video.'); return; }
      const next = normalizeLoungePreferences({ ...preferences, backdropMode: 'image', backgroundUrl: picked.url });
      if (!next.backgroundUrl) { setError('This image path could not be saved.'); return; }
      setStatus('Preparing lighting for this artwork…');
      try {
        const profile = await prepareImportedArtwork(picked.url);
        setStatus(profile.persisted ? 'Artwork lighting prepared and saved for reuse.' : 'Lighting works for this session, but its profile could not be saved. If the app was already open during this update, restart it once.');
      } catch { setStatus('Artwork imported; lighting preparation will retry when it loads.'); }
      onChange(next);
    } catch { setError('Could not import this artwork or video.'); }
    finally { setBusy(false); }
  };
  return <section aria-label="Custom Lounge background" className="mt-5 rounded-2xl border border-[rgb(var(--accent)/0.4)] bg-[rgb(var(--panel)/0.45)] p-4">
    <h3 className="text-lg font-black">Custom background</h3>
    <p className="mt-2 text-xs text-muted">Import your own picture or muted looping video. NEO-LIB keeps its own copy and prepares a reusable lighting profile. Animated media uses one representative frame, not continuous analysis. Adjust framing, colours and effects in Visuals.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" disabled={busy} onClick={pickBackground} className="lounge-visual-choice inline-flex min-h-11 items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.65)] px-4 py-2 text-sm font-black"><ImagePlus size={18} />{busy ? 'Preparing artwork…' : 'Import custom background'}</button>
      {preferences.backgroundUrl && <button type="button" disabled={busy} aria-pressed={preferences.backdropMode === 'image'} onClick={() => onChange(normalizeLoungePreferences({ ...preferences, backdropMode: 'image' }))} className="lounge-visual-choice min-h-11 rounded-xl border border-[rgb(var(--border))] px-4 py-2 text-sm font-bold">{preferences.backdropMode === 'image' ? 'Custom background active' : 'Use saved background'}</button>}
    </div>
    <p className="mt-2 text-xs text-muted">Still images, GIF/APNG and supported MP4, M4V, WebM, MOV or OGV video.</p>
    {status && <p role="status" className="mt-2 text-xs text-muted">{status}</p>}
    {error && <p role="alert" className="mt-2 text-sm text-rose-300">{error}</p>}
  </section>;
}
