import React from 'react';
import { Bluetooth, CheckCircle2, Gamepad2, Radio, RefreshCw, Settings2 } from 'lucide-react';

// Presentation only: live input and Windows presence arrive as separate,
// normalized results. This component cannot pair devices or read PnP input.
export default function ControllerCenterPrototype({ inventory, windowsInventory = { devices: [] }, windowsScanning = false, windowsCheckedAt = 0, selectedFingerprint = '', navigationEnabled = false, onNavigationEnabledChange, onSelect, onManageWindows, onOpenSteamController, onRefresh, refreshedAt = 0 }) {
  const controllers = Array.isArray(inventory?.controllers) ? inventory.controllers : [];
  const windowsDevices = Array.isArray(windowsInventory?.devices) ? windowsInventory.devices : [];
  const selected = controllers.find((controller) => controller.fingerprint === selectedFingerprint) || controllers.find((controller) => controller.index === inventory?.selectedIndex) || controllers[0] || null;
  const eventOnly = selected && inventory?.eventOnlyIndexes?.includes(selected.index);
  const pressed = Array.isArray(inventory?.selectedInput?.pressed) ? inventory.selectedInput.pressed : [];
  const axes = Array.isArray(inventory?.selectedInput?.axes) ? inventory.selectedInput.axes : [];

  return <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.96)] p-4" data-testid="controller-center-prototype">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--accent)/0.13)] text-[rgb(var(--accent))]"><Gamepad2 size={20} /></span>
        <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">Controller Center</p><h2 className="mt-0.5 text-sm font-black">{controllers.length ? `${controllers.length} ready for input` : windowsDevices.length ? `Windows sees ${windowsDevices.length} controller${windowsDevices.length === 1 ? '' : 's'}` : inventory?.access === 'blocked' ? 'Controller access blocked' : inventory?.access === 'unavailable' ? 'Controller input unavailable' : 'No controller available to NEO-LIB'}</h2></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onRefresh} disabled={windowsScanning} className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.62)] px-3 py-2 text-[10px] font-black text-ink hover:border-[rgb(var(--accent)/0.5)] disabled:opacity-65"><RefreshCw size={13} className={windowsScanning ? 'animate-spin' : ''} />{windowsScanning ? 'Scanning…' : 'Refresh'}</button>
        <button type="button" onClick={onManageWindows} className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--accent)/0.38)] bg-[rgb(var(--accent)/0.09)] px-3 py-2 text-[10px] font-black text-[rgb(var(--accent-2))]"><Bluetooth size={13} />Manage in Windows</button>
        <button type="button" onClick={onOpenSteamController} className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.62)] px-3 py-2 text-[10px] font-black text-ink hover:border-[rgb(var(--accent)/0.5)]"><Gamepad2 size={13} />Steam Input</button>
      </div>
    </header>

    <p className="mt-3 text-[10px] leading-relaxed text-muted">Live input comes from NEO-LIB's gamepad interface. Refresh also checks which controllers Windows currently sees; Windows presence alone does not enable button control. Pairing, removal and device security remain in Windows.</p>
    <label className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.34)] p-3 text-[10px] text-ink">
      <span><b className="block">Navigate NEO-LIB with controller</b><span className="mt-1 block text-muted">Optional desktop focus and menu controls. Launching games still requires mouse or keyboard.</span></span>
      <input type="checkbox" checked={navigationEnabled} onChange={(event) => onNavigationEnabledChange?.(event.target.checked)} aria-label="Navigate NEO-LIB with controller" />
    </label>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {controllers.map((controller) => {
        const active = controller.fingerprint === selected?.fingerprint;
        return <button key={`${controller.fingerprint}-${controller.index}`} type="button" aria-pressed={active} onClick={() => onSelect?.(controller.fingerprint)} className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${active ? 'border-[rgb(var(--accent)/0.68)] bg-[rgb(var(--accent)/0.12)]' : 'border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.32)] hover:border-[rgb(var(--accent)/0.4)]'}`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgb(var(--surface)/0.65)]"><Gamepad2 size={16} /></span>
          <span className="min-w-0 flex-1"><b className="block truncate text-[11px] text-ink">{controller.id}</b><span className="mt-0.5 flex items-center gap-1 text-[9px] text-muted"><Radio size={9} />{controller.mapping === 'standard' ? 'Standard mapping' : 'Mapping not identified'}</span></span>
          {active && <CheckCircle2 size={15} className="shrink-0 text-emerald-300" />}
        </button>;
      })}
      {!controllers.length && <div className="sm:col-span-2 grid min-h-28 place-items-center rounded-xl border border-dashed border-[rgb(var(--border)/0.75)] px-5 text-center"><div><Settings2 size={18} className="mx-auto text-muted" /><p className="mt-2 text-[10px] text-muted">{windowsDevices.length ? 'Windows sees your controller, but NEO-LIB cannot read its buttons yet. Focus NEO-LIB, press a button, then Refresh.' : 'Focus NEO-LIB and press a controller button, then Refresh. Windows or Steam may see a device that this app cannot yet read.'}</p><p className="mt-2 text-[10px] text-muted">8BitDo Ultimate 2 Wireless on Windows: try its 2.4G USB receiver/dock or a USB cable for standard gamepad input. Steam Input may see Bluetooth devices separately.</p></div></div>}
    </div>

    <div className="mt-3 rounded-xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.25)] p-3" data-testid="windows-controller-inventory">
      <div className="flex items-center justify-between gap-2"><b className="text-[10px] text-ink">Seen by Windows</b><span className="text-[9px] text-muted">{windowsScanning ? 'Scanning connected devices…' : windowsCheckedAt ? `Checked ${new Date(windowsCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not checked'}</span></div>
      {windowsInventory?.ok === false && <p className="mt-2 text-[10px] text-amber-200">{windowsInventory.error || 'Windows controller scan unavailable.'}</p>}
      {windowsInventory?.ok === true && !windowsDevices.length && <p className="mt-2 text-[10px] text-muted">Windows returned no connected controller devices.</p>}
      {windowsDevices.map((device, index) => <div key={`${device.name}-${device.kind}-${index}`} className="mt-2 flex items-center gap-2 rounded-lg bg-[rgb(var(--panel)/0.6)] px-2.5 py-2 text-[10px]"><Gamepad2 size={14} className="shrink-0 text-[rgb(var(--accent))]" /><span className="min-w-0 flex-1 truncate font-bold text-ink">{device.name}</span><span className="shrink-0 text-muted">{device.kind} · presence only</span></div>)}
    </div>

    {eventOnly && <p className="mt-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-[10px] text-amber-100">A connection event arrived, but live input is not yet available. Try another button press or the controller's Windows-compatible mode before enabling navigation.</p>}
    {selected && <div className="mt-3 rounded-xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.34)] p-3" data-testid="controller-input-test">
      <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[rgb(var(--accent-2))]">Live input test</p><p className="mt-0.5 text-[10px] text-muted">Press a button or move a stick on the preferred controller.</p></div><span className={`rounded-full border px-2 py-1 text-[9px] font-black ${pressed.length || axes.some(Boolean) ? 'border-emerald-400/45 bg-emerald-400/10 text-emerald-300' : 'border-[rgb(var(--border)/0.7)] text-muted'}`}>{pressed.length || axes.some(Boolean) ? 'Input detected' : 'Waiting'}</span></div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg bg-[rgb(var(--panel)/0.55)] px-3 py-2 text-[10px]"><b className="text-ink">Buttons</b><span className="ml-2 text-muted">{pressed.length ? pressed.map((button) => `${button.index + 1}${button.value < 1 ? ` · ${Math.round(button.value * 100)}%` : ''}`).join(', ') : 'None pressed'}</span></div>
        <div className="rounded-lg bg-[rgb(var(--panel)/0.55)] px-3 py-2 text-[10px]"><b className="text-ink">Axes</b><span className="ml-2 text-muted">{axes.some(Boolean) ? axes.map((axis, index) => axis ? `${index + 1}: ${axis.toFixed(2)}` : null).filter(Boolean).join(', ') : 'Centered'}</span></div>
      </div>
    </div>}
    <footer className="mt-3 rounded-lg bg-[rgb(var(--surface)/0.32)] px-3 py-2 text-[9px] leading-relaxed text-muted">Battery level, wireless strength and disconnect controls are not shown because the browser controller API cannot report them reliably. NEO-LIB stores your preferred-device fingerprint and navigation switch, never input history.{refreshedAt ? ` Last checked ${new Date(refreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : ''}</footer>
  </section>;
}
