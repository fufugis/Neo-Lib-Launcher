import React from 'react';
import { loungeGuide, loungeSessionContext } from './lounge-context.mjs';

const mascotPortrait = (id) => id === 'fifi'
  ? `${import.meta.env.BASE_URL}mascot/fifi/poses/fifi-idle-v1.png`
  : `${import.meta.env.BASE_URL}mascot/fungist-3d-sleep.png`;

function Fact({ label, value }) {
  return <span className="min-w-0 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.5)] px-3 py-2"><span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</span><span className="mt-1 block truncate text-sm font-semibold">{value}</span></span>;
}

export default function LoungeDetails({ game, updateLedger, view, mascotId = 'fungist', mascotEnabled, busy = false, onOpenPreview }) {
  const context = loungeSessionContext(game, updateLedger);
  if (!context) return null;
  const mascotName = mascotId === 'fifi' ? 'FiFi' : 'Fungist';
  return <footer className="max-h-[40vh] shrink-0 overflow-y-auto border-t border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-4 py-4 sm:px-8" data-testid="lounge-details">
    <div className="flex flex-wrap items-center gap-4">
      <div className="min-w-40 flex-1"><p className="truncate text-2xl font-bold">{game.name}</p><p className="text-sm text-muted">{game.launcher || game.source || 'Library game'}</p></div>
      <div className="grid min-w-48 flex-[2] grid-cols-1 gap-2 sm:grid-cols-3"><Fact label="Played" value={context.playtime} /><Fact label="Last session" value={context.lastPlayed} /><Fact label="Journey" value={context.journey} /></div>
      <button type="button" disabled={busy} onClick={() => onOpenPreview(game.id)} className="shrink-0 rounded-xl border border-[rgb(var(--accent)/0.8)] bg-[rgb(var(--accent)/0.2)] px-7 py-3 text-lg font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] disabled:opacity-60">Open Preview</button>
    </div>
    {(context.updateFlagged || mascotEnabled) && <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
      {context.updateFlagged && <p className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-amber-100">{context.updateNote}</p>}
      {mascotEnabled && <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--accent)/0.08)] px-3 py-1.5" data-testid="lounge-mascot-guide"><img src={mascotPortrait(mascotId)} alt="" className="h-9 w-9 shrink-0 object-contain" /><p className="text-muted"><b className="text-ink">{mascotName} tip:</b> {loungeGuide(view, context)}</p></div>}
    </div>}
  </footer>;
}
