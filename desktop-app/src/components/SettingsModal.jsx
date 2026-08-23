import React from 'react';
import { motion } from 'framer-motion';
import { THEMES } from '../lib/utils';
import { SOUND_PACKS, setSoundPack, playLaunch, playHover } from '../lib/sound';
import { Check, Sparkles, Eye, EyeOff, Sliders, Power, Heart, DownloadCloud, MessageCircle } from 'lucide-react';
import Modal from './Modal';
import { DONATE_PAYPAL_URL } from './DonateModal';
import qrUrl from '../assets/donate-qr.png';

export default function SettingsModal({ open, onClose, settings, setSettings, onShowChangelog }) {
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
      {/* v1.2.8 — 2-column grid so fewer scrolls. Theme keeps full width because
          the grid of theme swatches already tiles nicely. Everything else auto-
          flows into masonry-ish columns via CSS. */}
      <div className="p-5">
        <div className="mb-5">
          <Section title="Theme">
          {[
            { tone: 'special', label: 'Special (extra eye-candy)' },
            { tone: 'dark',    label: 'Dark' },
            { tone: 'middle',  label: 'Middle' },
            { tone: 'bright',  label: 'Bright' },
          ].map((group) => (
            <div key={group.tone} className="mb-2 last:mb-0">
              <div className="mb-1 text-[9.5px] uppercase tracking-[0.24em] text-muted/80">
                {group.label}
              </div>
              <div className="grid grid-cols-6 gap-1 lg:grid-cols-7">
                {THEMES.filter((t) => t.tone === group.tone).map((t) => {
                  const active = settings.theme === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      data-testid={`theme-${t.id}`}
                      whileHover={{ y: -1, scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setKey({ theme: t.id })}
                      title={t.label}
                      className={
                        'group relative flex flex-col items-center gap-0.5 rounded-md hairline px-1 py-1 text-center transition-all ' +
                        (active
                          ? 'border-[rgb(var(--accent)/0.85)] bg-[rgb(var(--accent)/0.12)]'
                          : 'hover:border-[rgb(var(--accent)/0.4)]')
                      }
                    >
                      <span
                        className="h-5 w-full rounded-sm border border-white/10"
                        style={{
                          background: t.gradient || t.swatch,
                          boxShadow: active
                            ? `0 0 8px ${t.swatch}88, inset 0 0 4px rgba(255,255,255,0.15)`
                            : `0 0 2px ${t.swatch}33`,
                        }}
                      />
                      <div className="w-full truncate text-[9px] font-medium leading-tight opacity-90">
                        {t.label}
                      </div>
                      {active && (
                        <motion.span
                          layoutId="theme-check"
                          className="absolute -right-0.5 -top-0.5 grid h-3 w-3 place-items-center rounded-full bg-[rgb(var(--accent))] text-[rgb(var(--surface))]"
                        >
                          <Check size={7} strokeWidth={4} />
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </Section>
        </div>

        {/* All other sections tile into a 2-column grid via CSS columns so
            each Section stays intact and never breaks across columns. */}
        <div className="settings-columns">
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

        {/* v1.4.0 — All visual settings live in the sidebar "Visuals" menu now.
            Keeping only a redirect hint here so users know where to look. */}
        <Section title="Visual effects">
          <div className="rounded-md hairline bg-panel/30 p-3 text-[11.5px] text-muted flex items-start gap-2">
            <span className="mt-0.5 text-[rgb(var(--accent))]">→</span>
            <span>
              All visual controls — <strong className="text-ink">theme effects intensity, background
              texture &amp; opacity, row size, category text, glow, spacing, icon position, category
              dot, sub-category strip</strong> — live in the new <em>Visuals</em> button in the sidebar
              toolbar. Look for the pill between <em>Refresh</em> and <em>Two-column</em>.
            </span>
          </div>
        </Section>

        {/* Deals — sponsored content visibility (no public-facing affiliate fields here;
            affiliate IDs are baked at build time in `src/lib/affiliateConfig.js`) */}
        <Section title="Deals">
          <div className="space-y-3">
            <Toggle
              label="Show deals bar at the bottom"
              hint="Rotates Epic free games, Steam discounts, and Instant Gaming hot deals. Pulled live, no tracking."
              value={settings.dealsEnabled !== false}
              onChange={(v) => setKey({ dealsEnabled: v, dealsBarHidden: false })}
              testid="opt-deals"
            />
            <Toggle
              label="Show featured deal banner"
              hint="A slim sponsored card above the deals bar. Rotates through Instant Gaming hot deals (paying affiliate)."
              value={settings.featuredBannerEnabled !== false}
              onChange={(v) => setKey({ featuredBannerEnabled: v, featuredBannerHidden: false })}
              testid="opt-featured-banner"
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
              label="Close to system tray"
              hint="When ON, the X button hides NEO-LIB to the system tray (next to the clock) instead of quitting. Right-click the tray icon to fully quit."
              value={!!settings.minimizeToTray}
              onChange={(v) => {
                setKey({ minimizeToTray: v });
                if (window.api?.setMinimizeToTray) window.api.setMinimizeToTray(v);
              }}
              testid="opt-minimize-tray"
            />
            <Toggle
              label="Show in Discord status"
              hint="When you launch a game through NEO-LIB, your Discord status reads 'Playing <game name> · via NEO-LIB'. Needs Discord desktop running. (Requires NEO-LIB's Discord Application ID to be configured in the build — see README.)"
              value={settings.discordRpcEnabled !== false}
              onChange={(v) => {
                setKey({ discordRpcEnabled: v });
                if (window.api?.setDiscordRpc) window.api.setDiscordRpc(v);
              }}
              testid="opt-discord-rpc"
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
            NEO-LIB v1.6.0. Local-first. Metadata sourced from Steam, GOG, itch.io, VNDB, DLsite, DuckDuckGo and Google.
            Library data lives in <span className="font-mono text-ink">%APPDATA%/NEO-LIB</span>.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              data-testid="settings-check-updates-btn"
              onClick={() => {
                const url = 'https://github.com/fufugis/Neo-Lib-Launcher/releases/latest';
                if (window.api?.openExternal) window.api.openExternal(url);
                else window.open(url, '_blank');
              }}
              className="inline-flex items-center gap-2 rounded-md hairline px-3 h-8 text-[12px] text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.6)] hover:bg-[rgb(var(--accent)/0.08)] transition-all"
              title="Opens the latest release page on GitHub"
            >
              <DownloadCloud size={13} className="text-[rgb(var(--accent))]" />
              Check for updates
            </button>
            {onShowChangelog && (
              <button
                data-testid="settings-show-changelog-btn"
                onClick={() => { onClose(); onShowChangelog(); }}
                className="inline-flex items-center gap-2 rounded-md hairline px-3 h-8 text-[12px] text-muted hover:text-ink hover:border-[rgb(var(--accent-2)/0.6)] hover:bg-[rgb(var(--accent-2)/0.08)] transition-all"
                title="See what changed in the latest releases"
              >
                <Sparkles size={13} className="text-[rgb(var(--accent-2))]" />
                What&apos;s new
              </button>
            )}
            <button
              data-testid="settings-discord-btn"
              onClick={() => {
                const url = 'https://discord.gg/spk6QWREk8';
                if (window.api?.openExternal) window.api.openExternal(url);
                else window.open(url, '_blank');
              }}
              className="inline-flex items-center gap-2 rounded-md px-3 h-8 text-[12px] font-bold text-white transition-all hover:scale-[1.03]"
              style={{
                background: 'linear-gradient(135deg, #5865F2 0%, #7289DA 100%)',
                boxShadow: '0 0 10px -3px rgba(88,101,242,0.6)',
              }}
              title="Join the NEO-LIB Discord — submit bugs, suggest features, stay updated"
            >
              <MessageCircle size={13} />
              Join Discord
            </button>
          </div>
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
        </div>
        {/* /settings-columns */}

        <div className="flex justify-end pt-4">
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
        className="neo-tooltip-trigger group relative mb-2 inline-flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.20em] text-muted/90 border-l-2 border-[rgb(var(--accent))] pl-2 transition-colors hover:text-ink"
      >
        {title}
        {hint && (
          <>
            <span
              className="ml-0.5 grid h-3.5 w-3.5 place-items-center rounded-full text-[8.5px] font-bold opacity-0 group-hover:opacity-100 transition-opacity hairline bg-panel/60 text-[rgb(var(--accent))]"
              aria-hidden
            >
              ?
            </span>
            <span className="neo-tooltip" role="tooltip">{hint}</span>
          </>
        )}
      </h3>
      {children}
    </section>
  );
}

function Toggle({ label, hint, value, onChange, testid }) {
  return (
    <label className="neo-tooltip-trigger relative flex cursor-pointer items-center gap-3 rounded-lg hairline bg-surface/40 px-3 py-2 hover:border-[rgb(var(--accent)/0.4)] transition-colors">
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
      {hint && <span className="neo-tooltip" role="tooltip">{hint}</span>}
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



/**
 * EffectsLevelSlider — 5 discrete stages (None / Low / Medium / High / Max) that
 * scale particles, sakura, glow opacity, and ambient overlays together. One
 * knob so users can dial down flashiness for battery-saver / focus modes,
 * or crank it for retro-arcade demo screens.
 */
const EFFECTS_STAGES = ['None', 'Low', 'Medium', 'High', 'Max'];
const EFFECTS_HINT = {
  0: 'Particles, sakura, and neon glow are off.',
  1: 'A tiny dusting of ambient life.',
  2: 'Balanced — the default retro look.',
  3: 'Lots of drifting particles, brighter grid glow.',
  4: 'Full arcade — max particles, max glow, max sparkle.',
};
function EffectsLevelSlider({ value, onChange, theme = 'synthwave' }) {
  const v = Math.max(0, Math.min(4, value | 0));
  const themeLabel = theme.charAt(0).toUpperCase() + theme.slice(1).replace('-', ' ');
  return (
    <div data-testid="effects-level-wrapper">
      <div className="mb-1.5 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-medium">
            Effects intensity
            <span className="ml-1.5 rounded bg-panel/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted">
              {themeLabel} theme
            </span>
          </div>
          <div className="text-[11px] text-muted mt-0.5">{EFFECTS_HINT[v]}</div>
        </div>
        <div
          className="text-[11px] font-bold neon-text-cyan"
          style={{ color: 'rgb(var(--accent-2))' }}
        >
          {EFFECTS_STAGES[v]}
        </div>
      </div>
      <input
        type="range"
        data-testid="opt-effects-level"
        min={0}
        max={4}
        step={1}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[rgb(var(--accent))]"
      />
      {/* Stage tick marks */}
      <div className="mt-1 flex justify-between px-0.5 text-[9px] uppercase tracking-widest text-muted/70">
        {EFFECTS_STAGES.map((s) => <span key={s}>{s}</span>)}
      </div>
    </div>
  );
}

