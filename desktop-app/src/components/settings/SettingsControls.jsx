import React from 'react';

export function SettingsSection({ title, hint, children }) {
  return (
    <section>
      <h3 className="neo-tooltip-trigger group relative mb-2 inline-flex items-center gap-1.5 border-l-2 border-[rgb(var(--accent))] pl-2 font-display text-[11px] font-bold uppercase tracking-[0.20em] text-muted/90 transition-colors hover:text-ink">
        {title}
        {hint && (
          <>
            <span className="ml-0.5 grid h-3.5 w-3.5 place-items-center rounded-full hairline bg-panel/60 text-[8.5px] font-bold text-[rgb(var(--accent))] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>?</span>
            <span className="neo-tooltip" role="tooltip">{hint}</span>
          </>
        )}
      </h3>
      {children}
    </section>
  );
}

export function SettingsToggle({ label, hint, value, onChange, testid, disabled = false }) {
  return (
    <div className={`neo-tooltip-trigger relative flex min-h-[42px] items-center justify-between gap-3 rounded-lg hairline bg-surface/40 px-3 py-2 transition-colors ${disabled ? 'cursor-not-allowed opacity-55' : 'hover:border-[rgb(var(--accent)/0.4)]'}`}>
      <div className="min-w-0 flex-1"><div className="text-[12px] font-medium leading-tight">{label}</div></div>
      <button type="button" data-testid={testid} aria-pressed={value} disabled={disabled} onClick={() => onChange(!value)} className={`relative h-5 w-10 shrink-0 self-center rounded-full transition-colors disabled:cursor-not-allowed ${value ? 'bg-[rgb(var(--accent))] shadow-[0_0_10px_-2px_rgb(var(--accent))]' : 'bg-[rgb(var(--border))]'}`}>
        <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all" style={{ left: value ? '22px' : '2px' }} />
      </button>
      {hint && <span className="neo-tooltip" role="tooltip">{hint}</span>}
    </div>
  );
}

export function SettingsSlider({ label, value, min, max, onChange, suffix = '', testid }) {
  return (
    <div className="rounded-lg hairline bg-surface/40 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="text-[13px] font-medium">{label}</div>
        <div className="text-[11px] text-[rgb(var(--accent-2))] neon-text-cyan">{value}{suffix}</div>
      </div>
      <input type="range" data-testid={testid} min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-[rgb(var(--accent))]" />
    </div>
  );
}

export const EFFECTS_STAGES = ['None', 'Low', 'Medium', 'High', 'Max'];

const EFFECTS_HINT = {
  0: 'Particles, sakura, and neon glow are off.',
  1: 'A tiny dusting of ambient life.',
  2: 'Balanced — the default retro look.',
  3: 'Lots of drifting particles, brighter grid glow.',
  4: 'Full arcade — max particles, max glow, max sparkle.',
};

export function EffectsLevelSlider({ value, onChange, theme = 'synthwave' }) {
  const stage = Math.max(0, Math.min(4, value | 0));
  const themeLabel = ({ colorful: 'Magical', pro: 'Industrial' }[theme] || theme.charAt(0).toUpperCase() + theme.slice(1).replace('-', ' '));
  return (
    <div data-testid="effects-level-wrapper">
      <div className="mb-1.5 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-medium">Effects intensity <span className="ml-1.5 rounded bg-panel/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted">{themeLabel} theme</span></div>
          <div className="mt-0.5 text-[11px] text-muted">{EFFECTS_HINT[stage]}</div>
        </div>
        <div className="text-[11px] font-bold neon-text-cyan" style={{ color: 'rgb(var(--accent-2))' }}>{EFFECTS_STAGES[stage]}</div>
      </div>
      <input type="range" data-testid="opt-effects-level" min={0} max={4} step={1} value={stage} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-[rgb(var(--accent))]" />
      <div className="mt-1 flex justify-between px-0.5 text-[9px] uppercase tracking-widest text-muted/70">{EFFECTS_STAGES.map((label) => <span key={label}>{label}</span>)}</div>
    </div>
  );
}
