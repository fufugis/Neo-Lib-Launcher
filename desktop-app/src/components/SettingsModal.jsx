import React from 'react';
import { motion } from 'framer-motion';
import { THEMES } from '../lib/utils';
import { Check, Sparkles, Eye, EyeOff, Sliders, Power } from 'lucide-react';
import Modal from './Modal';

export default function SettingsModal({ open, onClose, settings, setSettings }) {
  const setKey = (patch) => setSettings({ ...settings, ...patch });
  const [showKey, setShowKey] = React.useState(false);
  const [autoStart, setAutoStart] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    if (open && typeof window !== 'undefined' && window.api?.getAutoStart) {
      window.api.getAutoStart().then((v) => { if (!cancelled) setAutoStart(!!v); });
    }
    return () => { cancelled = true; };
  }, [open]);

  const toggleAutoStart = async () => {
    const next = !autoStart;
    setAutoStart(next);
    if (window.api?.setAutoStart) await window.api.setAutoStart(next);
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings" wide testid="settings-modal">
      <div className="p-5 space-y-6">
        {/* Themes */}
        <Section title="Theme">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {THEMES.map((t) => (
              <motion.button
                key={t.id}
                data-testid={`theme-${t.id}`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setKey({ theme: t.id })}
                className={
                  'group relative flex items-center gap-3 rounded-lg hairline p-3 text-left transition-all ' +
                  (settings.theme === t.id
                    ? 'border-[rgb(var(--accent)/0.7)] bg-[rgb(var(--accent)/0.08)]'
                    : 'hover:border-[rgb(var(--accent)/0.4)]')
                }
              >
                <span
                  className="h-8 w-8 rounded-md border border-white/10 shadow"
                  style={{ background: t.swatch, boxShadow: `0 0 12px ${t.swatch}55` }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-[11px] text-muted capitalize">{t.id}</div>
                </div>
                {settings.theme === t.id && (
                  <motion.span
                    layoutId="theme-check"
                    className="grid h-5 w-5 place-items-center rounded-full bg-[rgb(var(--accent))] text-[rgb(var(--surface))]"
                  >
                    <Check size={11} strokeWidth={3} />
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>
        </Section>

        {/* Library appearance — sliders moved to the Library popover (Sliders button next to Settings).
            Only sound effects toggle remains here. */}
        <Section title="Sounds">
          <div className="space-y-3">
            <Toggle
              label="Sound effects (Launch button)"
              hint="Short modern blip on hover/click."
              value={settings.soundsEnabled !== false}
              onChange={(v) => setKey({ soundsEnabled: v })}
              testid="opt-sounds"
            />
          </div>
        </Section>

        {/* Visual effects */}
        <Section title="Visual effects">
          <div className="space-y-3">
            <Toggle
              label="Animations"
              hint="Smooth transitions, hover lifts, page reveals."
              value={settings.animationsEnabled !== false}
              onChange={(v) => setKey({ animationsEnabled: v })}
              testid="opt-animations"
            />
            <Toggle
              label="Synthwave grid background"
              hint="Animated retro grid behind the app."
              value={settings.synthGridEnabled !== false}
              onChange={(v) => setKey({ synthGridEnabled: v })}
              testid="opt-synth-grid"
            />
            <Toggle
              label="Sparkle highlights"
              hint="Tiny accent flickers on selected items."
              value={!!settings.sparklesEnabled}
              onChange={(v) => setKey({ sparklesEnabled: v })}
              testid="opt-sparkles"
            />
            <Toggle
              label="Scanlines on banners"
              hint="Subtle retro CRT lines over hero images."
              value={settings.scanlinesEnabled !== false}
              onChange={(v) => setKey({ scanlinesEnabled: v })}
              testid="opt-scanlines"
            />
            <Slider
              label="Background grid intensity"
              value={settings.gridIntensity ?? 100}
              min={0}
              max={150}
              onChange={(v) => setKey({ gridIntensity: v })}
              testid="opt-grid-intensity"
            />
            <Slider
              label="Banner blend (how much the hero image fades into the app)"
              value={settings.bannerBlend ?? 60}
              min={0}
              max={100}
              suffix="%"
              onChange={(v) => setKey({ bannerBlend: v })}
              testid="opt-banner-blend"
            />
          </div>
        </Section>

        {/* App behaviour */}
        <Section title="App behaviour">
          <div className="space-y-3">
            <Toggle
              label="Start with Windows"
              hint="Launch NEO-LIB automatically when you log in."
              value={autoStart}
              onChange={toggleAutoStart}
              testid="opt-autostart"
            />
            <Toggle
              label="Confirm before removing games"
              hint="Show a dialog when deleting a library entry."
              value={settings.confirmRemove !== false}
              onChange={(v) => setKey({ confirmRemove: v })}
              testid="opt-confirm-remove"
            />
            <Toggle
              label="Categories collapsed by default"
              hint="Off = always start expanded (override remembered state)."
              value={!!settings.categoriesCollapsedDefault}
              onChange={(v) => setKey({ categoriesCollapsedDefault: v })}
              testid="opt-cats-collapsed"
            />
          </div>
        </Section>

        {/* AI fallback */}
        <Section title="AI fallback · optional">
          <p className="mb-3 text-xs text-muted leading-relaxed">
            NEO-LIB looks up game metadata for free from Steam, GOG, and the public web. If you want
            an AI fallback for the trickiest obscure games, paste a{' '}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.api?.openExternal('https://aistudio.google.com/app/apikey'); }}
              className="text-[rgb(var(--accent-2))] hover:underline"
            >free Gemini API key</a>{' '}
            below. Stays on this PC, never sent anywhere except Google.
          </p>
          <div className="relative">
            <input
              data-testid="settings-gemini-key"
              type={showKey ? 'text' : 'password'}
              value={settings.geminiKey || ''}
              onChange={(e) => setKey({ geminiKey: e.target.value.trim() })}
              placeholder="AIza…"
              className="w-full rounded-md bg-surface/60 hairline px-3 h-9 pr-9 text-sm font-mono focus:outline-none focus:border-[rgb(var(--accent)/0.6)]"
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              title={showKey ? 'Hide' : 'Show'}
            >
              {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </Section>

        <Section title="About">
          <p className="text-xs text-muted leading-relaxed">
            NEO-LIB v1.0. Local-first. Metadata sourced from Steam, GOG, DuckDuckGo and Google.
            Library data lives in <span className="font-mono text-ink">%APPDATA%/NEO-LIB</span>.
          </p>
        </Section>

        <div className="flex justify-end pt-1">
          <button
            data-testid="settings-done-btn"
            onClick={onClose}
            className="neon rounded-full bg-[rgb(var(--accent))] px-6 py-2 text-xs font-bold text-[rgb(var(--surface))]"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="mb-3 font-display text-[13px] font-bold uppercase tracking-[0.18em] text-ink border-l-2 border-[rgb(var(--accent))] pl-3 neon-text">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Toggle({ label, hint, value, onChange, testid }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg hairline bg-surface/40 px-3 py-2.5 hover:border-[rgb(var(--accent)/0.4)] transition-colors">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium">{label}</div>
        {hint && <div className="text-[11px] text-muted">{hint}</div>}
      </div>
      <button
        type="button"
        data-testid={testid}
        onClick={() => onChange(!value)}
        className={
          'relative h-5 w-9 shrink-0 rounded-full transition-colors ' +
          (value ? 'bg-[rgb(var(--accent))] shadow-[0_0_10px_-2px_rgb(var(--accent))]' : 'bg-[rgb(var(--border))]')
        }
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
          style={{ left: value ? '18px' : '2px' }}
        />
      </button>
    </label>
  );
}

function Slider({ label, value, min, max, onChange, suffix = '', testid }) {
  return (
    <div className="rounded-lg hairline bg-surface/40 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="text-[13px] font-medium">{label}</div>
        <div className="text-[11px] text-[rgb(var(--accent-2))] neon-text-cyan">
          {value}{suffix}
        </div>
      </div>
      <input
        type="range"
        data-testid={testid}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[rgb(var(--accent))]"
      />
    </div>
  );
}
