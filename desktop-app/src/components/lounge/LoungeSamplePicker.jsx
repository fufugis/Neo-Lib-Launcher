import React from 'react';
import { Check, Volume2, X } from 'lucide-react';
import { LOUNGE_SAMPLE_GROUPS, LOUNGE_SAMPLE_ROLES } from './lounge-sample-model.mjs';

export default function LoungeSamplePicker({ role, currentId, canPreview, onPreview, onUse, onClose }) {
  const [auditionedId, setAuditionedId] = React.useState(currentId);
  const closeRef = React.useRef(null);
  React.useEffect(() => { closeRef.current?.focus(); }, []);
  const audition = id => {
    setAuditionedId(id);
    if (id !== 'off' && canPreview) onPreview(id);
  };
  const soundRow = id => <div key={id} className={`flex min-h-12 items-center gap-2 rounded-xl border p-1.5 ${auditionedId === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.16)]' : 'border-[rgb(var(--border)/0.7)] bg-[rgb(var(--panel)/0.45)]'}`}>
    <button type="button" data-lounge-sound-preview aria-label={id === 'off' ? 'Preview silence' : `Preview ${id}`} aria-pressed={auditionedId === id} onClick={() => audition(id)} className="lounge-setting-choice flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]">
      <Volume2 size={16} aria-hidden="true" className="shrink-0 text-[rgb(var(--accent-2))]" /><span className="truncate">{id === 'off' ? 'Off · no sound' : id}</span>{currentId === id && <span className="ml-auto shrink-0 text-[10px] font-black uppercase tracking-wide text-[rgb(var(--accent-2))]">Current</span>}
    </button>
    <button type="button" data-lounge-sound-preview onClick={() => onUse(id)} className="lounge-setting-choice inline-flex shrink-0 items-center gap-1 rounded-lg border border-[rgb(var(--accent)/0.6)] bg-[rgb(var(--accent)/0.13)] px-3 py-2 text-xs font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]"><Check size={14} aria-hidden="true" /> Use</button>
  </div>;
  return <div role="dialog" aria-modal="true" aria-label={`Choose ${LOUNGE_SAMPLE_ROLES[role]} sound`} data-testid="lounge-sample-picker" className="fixed inset-0 z-[9200] flex items-center justify-center bg-black/80 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); } }}>
    <section className="flex max-h-[min(86vh,820px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--surface))] shadow-[0_24px_80px_rgb(0_0_0/0.65)]">
      <header className="flex items-start justify-between gap-4 border-b border-[rgb(var(--border)/0.7)] bg-[rgb(var(--panel)/0.7)] px-5 py-4"><div><p className="text-xs font-black uppercase tracking-[0.17em] text-[rgb(var(--accent-2))]">Lounge sound picker</p><h3 className="mt-1 text-lg font-black">{LOUNGE_SAMPLE_ROLES[role]}</h3><p className="mt-1 text-xs text-muted">Click a sound to hear it. Nothing changes until you press Use beside it.</p></div><button ref={closeRef} type="button" data-lounge-sound-preview onClick={onClose} aria-label="Close sound picker without changing" className="lounge-setting-choice rounded-lg border border-[rgb(var(--border))] p-2"><X size={18} /></button></header>
      {!canPreview && <p className="mx-5 mt-4 rounded-lg border border-amber-300/35 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">Preview is paused because app-wide sounds, Lounge focus, Rest Mode or volume currently prevent playback. You can still choose a sound.</p>}
      <div className="min-h-0 overflow-y-auto px-5 py-4">{soundRow('off')}{Object.entries(LOUNGE_SAMPLE_GROUPS).map(([group, samples]) => <section key={group} className="mt-5"><h4 className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-muted">{group}</h4><div className="grid gap-2">{samples.map(soundRow)}</div></section>)}</div>
      <footer className="border-t border-[rgb(var(--border)/0.7)] bg-[rgb(var(--panel)/0.5)] px-5 py-3"><button type="button" data-lounge-sound-preview onClick={onClose} className="lounge-setting-choice rounded-lg border border-[rgb(var(--border))] px-4 py-2 text-sm font-bold">Cancel · keep {currentId === 'off' ? 'Off' : currentId}</button></footer>
    </section>
  </div>;
}
