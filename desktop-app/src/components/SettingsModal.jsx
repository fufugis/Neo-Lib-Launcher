import React from 'react';
import { motion } from 'framer-motion';
import { THEMES } from '../lib/utils';
import { SOUND_PACKS, setSoundPack, playLaunch, playHover } from '../lib/sound';
import { Check, Sparkles, Eye, EyeOff, Sliders, Power, Heart, DownloadCloud } from 'lucide-react';
import Modal from './Modal';
import { DONATE_PAYPAL_URL } from './DonateModal';
import qrUrl from '../assets/donate-qr.png';

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
        {/* Themes — grouped by tone (dark vs bright) */}
        <Section title="Theme">
          {[
            { tone: 'dark',   label: 'Dark themes' },
            { tone: 'bright', label: 'Bright themes' },
          ].map((group) => (
            <div key={group.tone} className="mb-3 last:mb-0">
              <div className="mb-1.5 text-[10px] uppercase tracking-[0.22em] text-muted/80">
                {group.label}
              </div>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                {THEMES.filter((t) => t.tone === group.tone).map((t) => (
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
            </div>
          ))}
        </Section>

        {/* Library appearance — sliders moved to the Library popover (Sliders button next to Settings).
            Sound effects + sound pack live here. */}
        <Section title="Sounds">
          <div className="space-y-3">
            <Toggle
              label="Enable UI sounds"
              hint="Short blip on hover and launch."
              value={settings.soundsEnabled !== false}
              onChange={(v) => setKey({ soundsEnabled: v })}
              testid="opt-sounds"
            />
            <div className="rounded-lg hairline bg-surface/40 px-3 py-2.5">
              <div className="mb-2 text-[13px] font-medium">Sound pack</div>
              <div className="grid grid-cols-2 gap-1.5">
                {SOUND_PACKS.map((p) => (
                  <button
                    key={p.id}
                    data-testid={`sound-pack-${p.id}`}
                    onClick={() => {
                      setKey({ soundPack: p.id });
                      // Play a sample so user hears the choice immediately
                      setSoundPack(p.id);
                      playLaunch();
                      setTimeout(() => playHover(), 250);
                    }}
                    className={
                      'rounded-md hairline px-2 py-1.5 text-left text-[11px] transition-colors ' +
                      ((settings.soundPack || 'synthwave') === p.id
                        ? 'border-[rgb(var(--accent)/0.7)] bg-[rgb(var(--accent)/0.12)] text-ink'
                        : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.4)]')
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Tutorial */}
        <Section title="Onboarding">
          <div className="space-y-3">
            <Toggle
              label="Show tutorial on every startup"
              hint="If on, the welcome tour opens each time NEO-LIB launches."
              value={settings.tutorialAlwaysShow === true}
              onChange={(v) => setKey({ tutorialAlwaysShow: v })}
              testid="opt-tutorial-always"
            />
            <button
              data-testid="opt-tutorial-reopen"
              onClick={() => { setKey({ tutorialSeen: false, tutorialAlwaysShow: settings.tutorialAlwaysShow }); onClose(); }}
              className="w-full rounded-md hairline px-3 py-2 text-xs text-ink hover:bg-[rgb(var(--accent)/0.08)]"
            >
              Replay tutorial now
            </button>
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
            <Toggle
              label="Floating particles"
              hint="Soft accent-colored particles drift up behind the app."
              value={settings.particlesEnabled !== false}
              onChange={(v) => setKey({ particlesEnabled: v })}
              testid="opt-particles"
            />
            <Toggle
              label="Per-game ambient backdrop"
              hint="Tints the background with the selected game's hero image (subtle wash, never overwhelms the theme)."
              value={!!settings.perGameBg}
              onChange={(v) => setKey({ perGameBg: v })}
              testid="opt-per-game-bg"
            />
            <Toggle
              label="CRT boot animation"
              hint="Old-TV power-on flash on app start (1.4s)."
              value={settings.crtBootEnabled !== false}
              onChange={(v) => setKey({ crtBootEnabled: v })}
              testid="opt-crt-boot"
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

        {/* Deals — sponsored content visibility (no public-facing affiliate fields here;
            affiliate IDs are baked at build time in `src/lib/affiliateConfig.js`) */}
        <Section title="Deals">
          <div className="space-y-3">
            <Toggle
              label="Show deals bar at the bottom"
              hint="Rotates Epic free games and Steam top discounts. Pulled live, no tracking."
              value={settings.dealsEnabled !== false}
              onChange={(v) => setKey({ dealsEnabled: v, dealsBarHidden: false })}
              testid="opt-deals"
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
            NEO-LIB v1.1.1. Local-first. Metadata sourced from Steam, GOG, itch.io, VNDB, DLsite, DuckDuckGo and Google.
            Library data lives in <span className="font-mono text-ink">%APPDATA%/NEO-LIB</span>.
          </p>
          <button
            data-testid="settings-check-updates-btn"
            onClick={() => {
              const url = 'https://github.com/fufugis/Neo-Lib-Launcher/releases/latest';
              if (window.api?.openExternal) window.api.openExternal(url);
              else window.open(url, '_blank');
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-md hairline px-3 h-8 text-[12px] text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.6)] hover:bg-[rgb(var(--accent)/0.08)] transition-all"
            title="Opens the latest release page on GitHub"
          >
            <DownloadCloud size={13} className="text-[rgb(var(--accent))]" />
            Check for updates
          </button>
        </Section>

        {/* Support & credits */}
        <Section title="Support NEO-LIB">
          <div className="rounded-lg hairline bg-surface/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-[13px]">
              <Heart size={14} className="text-[rgb(var(--accent))]" />
              <span>Made with care by <span className="text-ink font-semibold">KenLun</span></span>
            </div>
            <p className="text-[11.5px] text-muted leading-relaxed">
              NEO-LIB is free and ad-light. If it&apos;s saved you time, consider buying me a coffee — it directly funds future updates.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                data-testid="settings-donate-btn"
                onClick={() => { window.api?.openExternal ? window.api.openExternal(DONATE_PAYPAL_URL) : window.open(DONATE_PAYPAL_URL, '_blank'); }}
                className="font-bold text-black hover:opacity-90 transition-opacity"
                style={{
                  background: '#FFD140',
                  borderRadius: '0.25rem',
                  padding: '0 1.5rem',
                  height: '2.25rem',
                  fontFamily: '"Helvetica Neue",Arial,sans-serif',
                  fontSize: '0.875rem',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                Buy me a coffee
              </button>
              <img src={qrUrl} alt="Donate QR" className="h-36 w-36 rounded-md bg-white p-1.5" />
            </div>
          </div>
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

function Section({ title, hint, children }) {
  return (
    <section>
      <h3
        className="group mb-2 inline-flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.20em] text-muted/90 border-l-2 border-[rgb(var(--accent))] pl-2 transition-colors hover:text-ink"
        title={hint || ''}
      >
        {title}
        {hint && (
          <span
            className="ml-0.5 grid h-3.5 w-3.5 place-items-center rounded-full text-[8.5px] font-bold opacity-0 group-hover:opacity-100 transition-opacity hairline bg-panel/60 text-[rgb(var(--accent))]"
            aria-hidden
          >
            ?
          </span>
        )}
      </h3>
      {children}
    </section>
  );
}

function Toggle({ label, hint, value, onChange, testid }) {
  return (
    <label
      className="flex cursor-pointer items-center gap-3 rounded-lg hairline bg-surface/40 px-3 py-2 hover:border-[rgb(var(--accent)/0.4)] transition-colors"
      title={hint || ''}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium leading-tight">{label}</div>
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


