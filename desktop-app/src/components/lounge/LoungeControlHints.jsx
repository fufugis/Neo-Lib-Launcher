import React from 'react';
import { ChevronDown, CircleHelp, Gamepad2 } from 'lucide-react';

function Key({ children }) {
  return <kbd className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2 py-1 font-mono text-xs font-bold text-ink">{children}</kbd>;
}

// Standard-mapping positions, not brand-specific Xbox/PlayStation glyphs.
export default function LoungeControlHints({ controllerEnabled }) {
  const [open, setOpen] = React.useState(false);
  return <div className="lounge-hints mb-4 text-sm text-muted" aria-label="Lounge controls">
    <p id="lounge-control-help" className="sr-only">{controllerEnabled ? 'Stick or D-pad moves between controls, south opens game details, and east goes back. ' : ''}Arrow keys move between controls, Enter opens a game, and Escape exits Lounge. Game launch requires a direct mouse click or keyboard press.</p>
    <button type="button" aria-expanded={open} aria-controls="lounge-control-guide" onClick={() => setOpen(value => !value)} className="lounge-hints-toggle inline-flex min-h-10 items-center gap-2 rounded-full border border-[rgb(var(--border)/0.8)] bg-[rgb(var(--panel)/0.7)] px-3.5 py-1.5 text-sm font-semibold text-ink backdrop-blur-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]">{controllerEnabled ? <Gamepad2 size={18} className="text-[rgb(var(--accent-2))]" /> : <CircleHelp size={17} className="text-[rgb(var(--accent-2))]" />}<span>Controls</span><span className="hidden font-normal text-muted sm:inline" data-testid={controllerEnabled ? 'lounge-controls-controller' : 'lounge-controls-keyboard'}>{controllerEnabled ? 'Stick / D-pad move · South opens · East backs' : 'Arrows move · Enter opens · Esc exits'}</span><ChevronDown size={15} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} /></button>
    <div id="lounge-control-guide" className={open ? 'lounge-hints-panel mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.88)] p-3 backdrop-blur-xl' : 'hidden'}>
      <span className="inline-flex items-center gap-1.5"><Key>← ↑ ↓ →</Key> Move</span>
      <span className="inline-flex items-center gap-1.5"><Key>Enter</Key> Activate</span>
      <span className="inline-flex items-center gap-1.5"><Key>Esc</Key> Exit</span>
      {controllerEnabled && <><span className="inline-flex items-center gap-1.5"><Key>Stick / D-pad</Key> Move</span><span className="inline-flex items-center gap-1.5"><Key>South</Key> Open details</span><span className="inline-flex items-center gap-1.5"><Key>East</Key> Back</span><span className="inline-flex items-center gap-1.5"><Key>Shoulders</Key> Change view</span></>}
      <span className="basis-full text-xs">Focusing a cover shows its facts; activating it opens details here. Launch requires a direct mouse click or keyboard press.</span>
    </div>
  </div>;
}
