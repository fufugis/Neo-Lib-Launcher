import React from 'react';
import { Check } from 'lucide-react';
import { LOUNGE_CONSOLES, emulatorZoneStatus } from './lounge-emulator-zone.mjs';

export default function LoungeEmulatorChecklist({ hidden, profiles, onChange }) {
  const statuses = React.useMemo(() => new Map(LOUNGE_CONSOLES.map(console => [console.id, emulatorZoneStatus(profiles, [], console.id)])), [profiles]);
  const excluded = new Set(hidden);
  return <fieldset className="mt-4" data-testid="lounge-emulator-checklist">
    <legend className="text-sm font-bold">Consoles shown in the carousel</legend>
    <p className="mt-1 text-xs text-muted">Checked consoles are visible. Grey means no emulator is set in a saved profile. Hiding a console never removes its emulator or games.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={() => onChange([])} className="lounge-setting-choice rounded-lg border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-bold">Show all consoles</button>
      <button type="button" onClick={() => onChange(LOUNGE_CONSOLES.filter(console => !statuses.get(console.id).emulatorConfigured).map(console => console.id))} className="lounge-setting-choice rounded-lg border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-bold">Only configured</button>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-1.5" role="group" aria-label="Visible emulator consoles">
      {LOUNGE_CONSOLES.map(console => {
        const checked = !excluded.has(console.id), configured = statuses.get(console.id).emulatorConfigured;
        return <button key={console.id} type="button" role="checkbox" aria-checked={checked} data-testid={`lounge-emulator-visible-${console.id}`}
          onClick={() => onChange(checked ? [...hidden, console.id] : hidden.filter(id => id !== console.id))}
          className={`lounge-setting-choice flex min-h-10 items-center gap-2 rounded-lg border px-2.5 py-2 text-left ${checked ? 'border-[rgb(var(--accent)/0.55)] bg-[rgb(var(--accent)/0.08)]' : 'border-[rgb(var(--border))]'}`}>
          <span aria-hidden="true" className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${checked ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.2)]' : 'border-[rgb(var(--border))]'}`}>{checked && <Check size={12} />}</span>
          <span className="min-w-0"><span className={`block text-xs font-semibold leading-tight ${configured ? 'text-ink' : 'text-muted'}`}>{console.label}</span><small className="block text-[10px] text-muted">{configured ? 'Emulator set' : 'Not set'}</small></span>
        </button>;
      })}
    </div>
  </fieldset>;
}
