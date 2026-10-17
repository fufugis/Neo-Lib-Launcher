import React from 'react';
import { ImagePlus } from 'lucide-react';
import { applyLoungeBackground, normalizeLoungeBackgrounds } from './lounge-layout-model.mjs';
import { prepareImportedArtwork } from './lounge-light-analysis.mjs';

export default function LoungeBackgroundImport({ preferences, onChange }) {
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');
  const latest = React.useRef(preferences); latest.current = preferences;
  const mounted = React.useRef(true);
  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const pickBackground = async () => {
    if (busy) return;
    if (normalizeLoungeBackgrounds(latest.current.customBackgrounds, latest.current.backgroundUrl).length >= 48) { setError('You can keep up to 48 custom backgrounds.'); return; }
    if (!window.api?.importLoungeBackground) { setError('Choose artwork in the installed Windows app.'); return; }
    setBusy(true); setError(''); setStatus('');
    try {
      const picked = await window.api.importLoungeBackground();
      if (!picked || !mounted.current) return;
      if (!picked.ok) { setError(picked.error || 'Could not import this artwork or video.'); return; }
      setStatus('Preparing lighting for this artwork…');
      try {
        const profile = await prepareImportedArtwork(picked.url);
        setStatus(profile.persisted ? 'Artwork lighting prepared and saved for reuse.' : 'Lighting works for this session, but its profile could not be saved. If the app was already open during this update, restart it once.');
      } catch { setStatus('Artwork imported; lighting preparation will retry when it loads.'); }
      if (!mounted.current) return;
      const next = applyLoungeBackground(latest.current, { url: picked.url, name: picked.name || 'Custom background' });
      if (next.backgroundUrl !== picked.url) { setError('This image path could not be saved.'); return; }
      onChange(next);
    } catch { if (mounted.current) setError('Could not import this artwork or video.'); }
    finally { if (mounted.current) setBusy(false); }
  };
  return <div aria-label="Add custom Lounge background" className="mb-4">
      <button type="button" disabled={busy} onClick={pickBackground} className="lounge-visual-choice inline-flex min-h-11 items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.65)] px-4 py-2 text-sm font-black" title="Import a picture or supported video as a Lounge theme. Adjust its effects in Visuals."><ImagePlus size={18} />{busy ? 'Preparing artwork…' : 'Add custom background'}</button>
    {status && <p role="status" className="mt-2 text-xs text-muted">{status}</p>}
    {error && <p role="alert" className="mt-2 text-sm text-rose-300">{error}</p>}
  </div>;
}
