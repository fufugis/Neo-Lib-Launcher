import React from 'react';

function Key({ children }) {
  return <kbd className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2 py-1 font-mono text-xs font-bold text-ink">{children}</kbd>;
}

// Standard-mapping positions, not brand-specific Xbox/PlayStation glyphs.
export default function LoungeControlHints({ controllerEnabled }) {
  return <div id="lounge-control-help" className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted" aria-label="Lounge controls">
    <span className="inline-flex items-center gap-1.5"><Key>← ↑ ↓ →</Key> Move</span>
    <span className="inline-flex items-center gap-1.5"><Key>Enter</Key> Activate</span>
    <span className="inline-flex items-center gap-1.5"><Key>Esc</Key> Exit</span>
    {controllerEnabled && <><span className="inline-flex items-center gap-1.5"><Key>Stick / D-pad</Key> Move</span><span className="inline-flex items-center gap-1.5"><Key>South</Key> Activate</span><span className="inline-flex items-center gap-1.5"><Key>East</Key> Back</span><span className="inline-flex items-center gap-1.5"><Key>Shoulders</Key> Change view</span></>}
    <span className="basis-full text-xs">Focusing a cover shows its facts; activating it opens Preview. Lounge never launches a game directly.</span>
  </div>;
}
