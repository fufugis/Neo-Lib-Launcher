import React from 'react';
import { ArrowLeft, ListFilter, X } from 'lucide-react';
import { loungeAlphabetCounts } from './lounge-alphabet-model.mjs';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

export default function LoungeJumpPanel({ games, currentLetter, onChoose, onClose }) {
  const firstRef = React.useRef(null);
  const counts = loungeAlphabetCounts(games);
  const firstLetter = counts.has(currentLetter) ? currentLetter : LETTERS.find(letter => counts.has(letter));
  React.useEffect(() => { firstRef.current?.focus(); }, []);
  return <div role="dialog" aria-modal="true" aria-label="Jump to a game letter" data-testid="lounge-jump-panel" className="fixed inset-0 z-[9100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-lg sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="w-full max-w-3xl overflow-hidden rounded-3xl border border-[rgb(var(--accent)/0.55)] bg-[rgb(var(--surface))] shadow-[0_28px_100px_rgb(0_0_0/0.55)]">
      <header className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border))] p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[rgb(var(--accent)/0.18)] text-[rgb(var(--accent-2))]"><ListFilter size={23} /></span><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[rgb(var(--accent-2))]">Browse quickly</p><h2 className="text-xl font-black sm:text-2xl">Jump to a letter</h2></div></div><button type="button" data-controller-close aria-label="Back to Lounge games" onClick={onClose} className="lounge-nav-button rounded-xl border border-[rgb(var(--border))] p-3 focus-visible:outline focus-visible:outline-3 focus-visible:outline-[rgb(var(--accent))]"><X size={21} /></button></header>
      <div className="p-5 sm:p-7"><p className="mb-5 text-sm text-muted">Choose the first letter of a game in this view. Unavailable letters stay dimmed.</p><div className="grid grid-cols-5 gap-2 sm:grid-cols-7 md:grid-cols-9">{LETTERS.map(letter => <button key={letter} ref={firstLetter === letter ? firstRef : undefined} type="button" disabled={!counts.has(letter)} aria-label={`${letter === '#' ? 'Numbers and symbols' : letter}, ${counts.get(letter) || 0} games`} aria-pressed={currentLetter === letter} onClick={() => onChoose(letter)} className={`lounge-guide-destination flex min-h-14 flex-col items-center justify-center rounded-xl border text-lg font-black focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))] disabled:opacity-30 ${currentLetter === letter ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.22)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.62)]'}`}>{letter}<span className="text-[10px] font-semibold text-muted">{counts.get(letter) || 0}</span></button>)}</div><button ref={!firstLetter ? firstRef : undefined} type="button" onClick={() => onChoose('')} className="lounge-guide-destination mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--accent)/0.13)] px-5 text-sm font-black focus-visible:outline focus-visible:outline-3 focus-visible:outline-[rgb(var(--accent))]"><ArrowLeft size={18} /> Show all {games.length} games</button></div>
    </section>
  </div>;
}
