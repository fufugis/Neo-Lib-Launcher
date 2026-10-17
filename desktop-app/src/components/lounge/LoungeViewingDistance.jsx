import React from 'react';

const VIEWING_DISTANCES = [
  ['compact', 'Near · desk', '48px top buttons · 36px filter strip', 'Top actions are icons first; filter names stay visible.'],
  ['near', 'Nearby · relaxed desk', '57 × 60px top buttons · 39px filter strip', 'A little more room, with visible navigation names.'],
  ['comfortable', 'Medium · sofa', '66 × 72px top buttons · 42px filter strip', 'Names remain visible for quick reading.'],
  ['far', 'Further · living room', '81 × 84px top buttons · 45px filter strip', 'Larger names, icons and targets for a little more distance.'],
  ['large', 'Far · across room', '96 × 96px top buttons · 48px filter strip', 'Larger icons and targets, plus roomier popups with slightly bigger text.'],
];

export function ViewingDistancePicker({ value, onChange }) {
  const savedIndex = VIEWING_DISTANCES.findIndex(([id]) => id === value);
  const index = savedIndex < 0 ? 2 : savedIndex;
  const [, label, dimensions, note] = VIEWING_DISTANCES[index];
  const sliderId = React.useId();
  const step = index + 1;
  const changeStep = next => onChange(VIEWING_DISTANCES[Math.max(0, Math.min(4, next - 1))][0]);
  return <fieldset data-testid="lounge-viewing-distance" className="lounge-viewing-distance mt-5 rounded-xl border-2 border-[rgb(var(--accent)/0.7)] bg-[rgb(var(--accent)/0.12)] px-4 pb-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]">
    <legend className="px-2 text-base font-black text-[rgb(var(--accent-2))]">Viewing distance</legend>
    <p id={`${sliderId}-help`} className="mt-1 text-xs text-muted">Sitting further away? Increase the size of Lounge buttons, labels, filters and console tabs.</p>
    <div className="my-4 flex min-h-16 items-center gap-3">
      <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[rgb(var(--accent)/0.18)]"><span className="rounded-md border-2 border-[rgb(var(--accent))]" style={{ width: 20 + index * 4, height: 20 + index * 4 }} /></span>
      <div className="min-w-0"><label htmlFor={sliderId} className="block text-base font-black">{label}</label><span className="block text-xs font-bold text-[rgb(var(--accent-2))]">Step {step} of 5</span><span className="mt-1 block text-xs text-muted">{dimensions}</span></div>
    </div>
    <div className="flex items-center gap-3">
      <button type="button" aria-label="Decrease viewing distance" disabled={step === 1} onClick={() => changeStep(step - 1)} className="lounge-setting-choice h-10 w-10 shrink-0 rounded-lg border border-[rgb(var(--accent)/0.6)] text-lg font-black disabled:opacity-40">−</button>
      <div className="min-w-0 flex-1">
        <input id={sliderId} type="range" min="1" max="5" step="1" value={step} aria-valuetext={`${label}, step ${step} of 5`} aria-describedby={`${sliderId}-help ${sliderId}-note`} onChange={event => changeStep(Number(event.target.value))} className="h-10 w-full cursor-pointer accent-[rgb(var(--accent))]" />
        <div aria-hidden="true" className="flex justify-between px-1 text-xs font-black text-[rgb(var(--accent-2))]">{VIEWING_DISTANCES.map(([id], tick) => <span key={id}>{tick + 1}</span>)}</div>
        <div aria-hidden="true" className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-wide text-muted"><span>Near</span><span>Medium</span><span>Far</span></div>
      </div>
      <button type="button" aria-label="Increase viewing distance" disabled={step === 5} onClick={() => changeStep(step + 1)} className="lounge-setting-choice h-10 w-10 shrink-0 rounded-lg border border-[rgb(var(--accent)/0.6)] text-lg font-black disabled:opacity-40">+</button>
    </div>
    <p id={`${sliderId}-note`} className="mt-4 text-xs font-semibold text-ink">{note}</p>
    <p className="mt-2 text-xs text-muted">Preview text and game covers keep their own size controls.</p>
  </fieldset>;
}
