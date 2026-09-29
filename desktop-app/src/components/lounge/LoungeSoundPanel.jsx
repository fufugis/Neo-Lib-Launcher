import React from 'react';
import { Music2, X } from 'lucide-react';
import LoungeSoundControls from './LoungeSoundControls';

export default function LoungeSoundPanel({ preferences, soundsEnabled, onChange, onPreviewSound, ambienceError, onRetryAmbience, onClose }) {
  const closeRef = React.useRef(null);
  React.useEffect(() => { closeRef.current?.focus(); }, []);
  return <div role="dialog" aria-modal="true" aria-label="Lounge sound and music" data-testid="lounge-sound-panel" className="lounge-settings-scrim fixed inset-0 z-[9100] flex justify-end bg-black/75" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="lounge-settings-drawer relative flex h-full w-full max-w-[520px] flex-col overflow-hidden border-l border-[rgb(var(--accent)/0.58)] bg-[rgb(var(--surface))] shadow-[-30px_0_90px_rgb(var(--accent)/0.18)]">
      <header className="lounge-settings-heading relative overflow-hidden border-b border-[rgb(var(--border))] px-6 pb-5 pt-6"><div className="lounge-settings-aura pointer-events-none absolute inset-0" aria-hidden="true" /><div className="relative flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-[rgb(var(--accent-2))]"><Music2 size={16} /> Lounge only</p><h2 className="mt-2 text-3xl font-black">Sound &amp; Music</h2><p className="mt-2 max-w-sm text-sm text-muted">Choose browsing cues, preview samples, and set background ambience in one place.</p></div><button ref={closeRef} type="button" data-controller-close onClick={onClose} aria-label="Close Lounge sound and music" className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.8)] p-2 text-ink"><X size={20} /></button></div></header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8"><LoungeSoundControls preferences={preferences} soundsEnabled={soundsEnabled} onChange={onChange} onPreview={onPreviewSound} ambienceError={ambienceError} onRetryAmbience={onRetryAmbience} /></div>
    </aside>
  </div>;
}
