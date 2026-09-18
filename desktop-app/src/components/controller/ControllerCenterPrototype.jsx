import React from 'react';
import { Bluetooth, CheckCircle2, Gamepad2, Radio, RefreshCw, Settings2 } from 'lucide-react';

/**
 * Dormant C0 prototype. It accepts normalized controller data only and owns no
 * detection, polling, Windows calls or saved settings. A later milestone can
 * place it in the shared modal layer after real desktop acceptance.
 */
export default function ControllerCenterPrototype({ inventory, selectedFingerprint = '', onSelect, onManageWindows, onOpenSteamController, onRefresh, refreshedAt = 0 }) {
  const controllers = Array.isArray(inventory?.controllers) ? inventory.controllers : [];
  const selected = controllers.find((controller) => controller.fingerprint === selectedFingerprint) || controllers.find((controller) => controller.index === inventory?.selectedIndex) || controllers[0] || null;
  const pressed = Array.isArray(inventory?.selectedInput?.pressed) ? inventory.selectedInput.pressed : [];
  const axes = Array.isArray(inventory?.selectedInput?.axes) ? inventory.selectedInput.axes : [];

  return <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.96)] p-4" data-testid="controller-center-prototype">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--accent)/0.13)] text-[rgb(var(--accent))]"><Gamepad2 size={20} /></span>
        <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">Controller Center</p><h2 className="mt-0.5 text-sm font-black">{controllers.length ? `${controllers.length} connected` : 'No controller detected'}</h2></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onRefresh} className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.62)] px-3 py-2 text-[10px] font-black text-ink hover:border-[rgb(var(--accent)/0.5)]"><RefreshCw size={13} />Refresh</button>
        <button type="button" onClick={onManageWindows} className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--accent)/0.38)] bg-[rgb(var(--accent)/0.09)] px-3 py-2 text-[10px] font-black text-[rgb(var(--accent-2))]"><Bluetooth size={13} />Manage in Windows</button>
        <button type="button" onClick={onOpenSteamController} className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.62)] px-3 py-2 text-[10px] font-black text-ink hover:border-[rgb(var(--accent)/0.5)]"><Gamepad2 size={13} />Steam Input</button>
      </div>
    </header>

    <p className="mt-3 text-[10px] leading-relaxed text-muted">NEO-LIB can show controllers available to its interface. Pairing, removal and device security remain in Windows.</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {controllers.map((controller) => {
        const active = controller.fingerprint === selected?.fingerprint;
        return <button key={`${controller.fingerprint}-${controller.index}`} type="button" aria-pressed={active} onClick={() => onSelect?.(controller.fingerprint)} className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${active ? 'border-[rgb(var(--accent)/0.68)] bg-[rgb(var(--accent)/0.12)]' : 'border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.32)] hover:border-[rgb(var(--accent)/0.4)]'}`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgb(var(--surface)/0.65)]"><Gamepad2 size={16} /></span>
          <span className="min-w-0 flex-1"><b className="block truncate text-[11px] text-ink">{controller.id}</b><span className="mt-0.5 flex items-center gap-1 text-[9px] text-muted"><Radio size={9} />{controller.mapping === 'standard' ? 'Standard mapping' : 'Mapping not identified'}</span></span>
          {active && <CheckCircle2 size={15} className="shrink-0 text-emerald-300" />}
        </button>;
      })}
      {!controllers.length && <div className="sm:col-span-2 grid min-h-28 place-items-center rounded-xl border border-dashed border-[rgb(var(--border)/0.75)] px-5 text-center"><div><Settings2 size={18} className="mx-auto text-muted" /><p className="mt-2 text-[10px] text-muted">Connect a controller, press one of its buttons, then refresh this panel.</p></div></div>}
    </div>

    {selected && <div className="mt-3 rounded-xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.34)] p-3" data-testid="controller-input-test">
      <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[rgb(var(--accent-2))]">Live input test</p><p className="mt-0.5 text-[10px] text-muted">Press a button or move a stick on the preferred controller.</p></div><span className={`rounded-full border px-2 py-1 text-[9px] font-black ${pressed.length || axes.some(Boolean) ? 'border-emerald-400/45 bg-emerald-400/10 text-emerald-300' : 'border-[rgb(var(--border)/0.7)] text-muted'}`}>{pressed.length || axes.some(Boolean) ? 'Input detected' : 'Waiting'}</span></div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg bg-[rgb(var(--panel)/0.55)] px-3 py-2 text-[10px]"><b className="text-ink">Buttons</b><span className="ml-2 text-muted">{pressed.length ? pressed.map((button) => `${button.index + 1}${button.value < 1 ? ` · ${Math.round(button.value * 100)}%` : ''}`).join(', ') : 'None pressed'}</span></div>
        <div className="rounded-lg bg-[rgb(var(--panel)/0.55)] px-3 py-2 text-[10px]"><b className="text-ink">Axes</b><span className="ml-2 text-muted">{axes.some(Boolean) ? axes.map((axis, index) => axis ? `${index + 1}: ${axis.toFixed(2)}` : null).filter(Boolean).join(', ') : 'Centered'}</span></div>
      </div>
    </div>}
    <footer className="mt-3 rounded-lg bg-[rgb(var(--surface)/0.32)] px-3 py-2 text-[9px] leading-relaxed text-muted">Battery level, wireless strength and disconnect controls are not shown because the browser controller API cannot report them reliably. NEO-LIB stores only the preferred device fingerprint, never input history.{refreshedAt ? ` Last checked ${new Date(refreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : ''}</footer>
  </section>;
}
