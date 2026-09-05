import React from 'react';
import { motion } from 'framer-motion';
import { THEMES } from '../lib/utils';
import { SOUND_PACKS, setSoundPack, playLaunch, playHover } from '../lib/sound';
import { FUNGIST_VOICE_LINES, playFungistVoice } from '../lib/mascotVoice';
import { Check, Sparkles, Eye, EyeOff, Sliders, Power, Heart, DownloadCloud, MessageCircle } from 'lucide-react';
import Modal from './Modal';
import { DONATE_PAYPAL_URL } from './DonateModal';
import qrUrl from '../assets/donate-qr.png';

const AI_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Google Gemini', detail: 'Fast, capable, and the current connected model.' },
];

const FUNGIST_MASCOT_ASSET = `${import.meta.env.BASE_URL}mascot/fungist-stand.png`;

const FUNGIST_NOTIFICATIONS = [
  { id: 'pcHigh', label: 'High PC use', hint: 'Major red alert when CPU or RAM remains high.' },
  { id: 'pcCheck', label: 'PC check', hint: 'Yellow reminder when the PC is elevated before gaming.' },
  { id: 'favouriteNews', label: 'Favourite game news', hint: 'A light green sparkly notice for new news on a favourite.' },
  { id: 'favouriteUpdates', label: 'Favourite game updates', hint: 'A light green notice when a favourited game has a verified update.' },
  { id: 'appUpdates', label: 'NEO-LIB updates', hint: 'A light green notice when a newer NEO-LIB version is available.' },
  { id: 'completion', label: 'Completion celebrations', hint: 'Smile, celebration pose, and completed chime after successful NEO-LIB actions.' },
  { id: 'idleNap', label: 'Idle nap', hint: 'Lets Fungist show his sleep pose after a quiet period. Any click or alert wakes him.' },
];

export default function SettingsModal({ open, onClose, settings, setSettings, onShowChangelog, currentVersion = '1.7.5' }) {
  const setKey = (patch) => setSettings({ ...settings, ...patch });
  const [showKey, setShowKey] = React.useState(false);
  const [autoStart, setAutoStart] = React.useState(false);
  const [aiTest, setAiTest] = React.useState({ state: 'idle', message: '' });

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
  // Hiding the companion must be a complete quiet mode: its saved voice choice
  // is remembered, but no Fungist sounds can escape while the mascot is off.
  const setMascotVisible = (visible) => {
    if (visible) {
      setKey({
        fungistEnabled: true,
        fungistVoiceEnabled: settings.fungistVoiceEnabledBeforeDisable !== false,
      });
      return;
    }
    setKey({
      fungistEnabled: false,
      fungistVoiceEnabledBeforeDisable: settings.fungistVoiceEnabled !== false,
      fungistVoiceEnabled: false,
    });
  };
  const testAiKey = async () => {
    if (!settings.geminiKey?.trim()) {
      setAiTest({ state: 'error', message: 'Paste a Gemini API key first.' });
      return;
    }
    if (!window.api?.testGemini) {
      setAiTest({ state: 'error', message: 'AI testing is available in the installed desktop app.' });
      return;
    }
    setAiTest({ state: 'loading', message: 'Testing Gemini with a harmless game lookup…' });
    const result = await window.api.testGemini({ apiKey: settings.geminiKey, model: settings.aiModel || 'gemini-2.5-flash' });
    setAiTest(result?.ok
      ? { state: 'ok', message: `Connected · ${result.model} identified ${result.name || 'the test game'}.` }
      : { state: 'error', message: result?.error || 'Gemini could not be reached.' });
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings" wide testid="settings-modal">
      {/* v1.2.8 — 2-column grid so fewer scrolls. Theme keeps full width because
          the grid of theme swatches already tiles nicely. Everything else auto-
          flows into masonry-ish columns via CSS. */}
      <div className="p-5">
        <div className="mb-5">
          <Section title="Theme">
          {/* v1.6.5 — actually vertical this time. Categories are columns,
              left → right: Bright · Middle · Dark · Special. Themes stack
              vertically inside their column instead of wrapping horizontally. */}
          <div className="grid max-w-full gap-2 overflow-x-auto pb-1" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 148px))' }} data-testid="theme-picker-columns">
          {[
            { tone: 'bright',  label: 'Bright' },
            { tone: 'middle',  label: 'Mid' },
            { tone: 'dark',    label: 'Dark' },
            { tone: 'special', label: 'Special' },
          ].map((group) => (
            <div key={group.tone} className="flex flex-col gap-1.5">
              <div className="mb-0.5 text-center text-[9.5px] uppercase tracking-[0.24em] text-muted/80">
                {group.label}
              </div>
              {THEMES.filter((t) => t.tone === group.tone).map((t) => {
                const active = settings.theme === t.id;
                return (
                  <motion.button
                    key={t.id}
                    data-testid={`theme-${t.id}`}
                    whileHover={{ y: -1, scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setKey({ theme: t.id })}
                    title={t.label}
                    className={
                      'group relative flex w-full flex-col items-center gap-1 rounded-md hairline px-1.5 py-1.5 text-center transition-all ' +
                      (active
                        ? 'border-[rgb(var(--accent)/0.85)] bg-[rgb(var(--accent)/0.12)]'
                        : 'hover:border-[rgb(var(--accent)/0.4)]')
                    }
                  >
                    {/* Swatch ~20% shorter than before (28px → 22px); text size untouched. */}
                    <span
                      className="theme-swatch-drift h-[22px] w-full rounded-sm border border-white/10"
                      style={{
                        background: t.gradient || t.swatch,
                        // Theme samples should breathe, not race. The prior
                        // animated treatment was visually louder than the
                        // actual picker controls, so each bar now takes 48s
                        // to make one restrained drift across its gradient.
                        backgroundSize: '170% 100%',
                        animationDuration: '48s',
                        boxShadow: active
                          ? `0 0 8px ${t.swatch}88, inset 0 0 4px rgba(255,255,255,0.15)`
                          : `0 0 2px ${t.swatch}33`,
                      }}
                    />
                    <div className="w-full text-[11.5px] font-semibold leading-tight opacity-95">
                      {t.label}
                    </div>
                    {active && (
                      <motion.span
                        layoutId="theme-check"
                        className="absolute -right-0.5 -top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-[rgb(var(--accent))] text-[rgb(var(--surface))]"
                      >
                        <Check size={8} strokeWidth={4} />
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          ))}
          </div>
          <div className="mt-3 rounded-lg hairline bg-[rgb(var(--surface)/0.38)] px-3 py-2.5" data-testid="special-decoration-control">
            <div className="flex items-center justify-between gap-3"><div><div className="text-[12px] font-medium">Special theme decoration</div><p className="mt-0.5 text-[10px] leading-relaxed text-muted">Controls the subtle Anime petals, Industrial machinery, and Magical sparkle accents. Set to 0% for clean colour-only themes.</p></div><span className="shrink-0 text-[11px] font-black text-[rgb(var(--accent-2))]">{Math.round(Number(settings.specialDecorationOpacity ?? 46))}%</span></div>
            <input aria-label="Special theme decoration" type="range" min="0" max="100" step="1" value={Number(settings.specialDecorationOpacity ?? 46)} onChange={(event) => setKey({ specialDecorationOpacity: Number(event.target.value) })} className="mt-2 w-full accent-[rgb(var(--accent))]" />
          </div>
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
            <div className={`rounded-lg hairline bg-surface/40 px-3 py-2.5 transition-opacity ${settings.fungistEnabled === false ? 'opacity-55' : ''}`}>
              <Toggle
                label="Fungist voice lines"
                hint={settings.fungistEnabled === false ? 'Turn on Show NEO-LIB mascot below to restore Fungist voice lines.' : 'Short voice reactions for welcome, alerts, game launches, and chat. They obey UI Sounds and Rest Mode; each line is event-limited so Fungist never talks constantly.'}
                value={settings.fungistVoiceEnabled !== false}
                onChange={(v) => { if (settings.fungistEnabled !== false) setKey({ fungistVoiceEnabled: v }); }}
                testid="opt-fungist-voice"
                disabled={settings.fungistEnabled === false}
              />
              <label className="mt-3 block">
                <span className="flex items-center justify-between gap-3 text-[10px] font-bold text-ink"><span>Voice volume</span><span className="text-muted">{Math.round(Number(settings.fungistVoiceVolume ?? 72))}%</span></span>
                <input aria-label="Fungist voice volume" disabled={settings.fungistEnabled === false} type="range" min="20" max="100" step="1" value={Number(settings.fungistVoiceVolume ?? 72)} onChange={(event) => setKey({ fungistVoiceVolume: Number(event.target.value) })} className="mt-1.5 w-full accent-[rgb(var(--accent))] disabled:cursor-not-allowed" />
              </label>
              <details className="mt-3 rounded-md border border-[rgb(var(--border)/0.62)] bg-[rgb(var(--surface)/0.24)] px-2.5 py-2">
                <summary className="cursor-pointer text-[10px] font-bold text-[rgb(var(--accent-2))]">Preview voice map · {FUNGIST_VOICE_LINES.length} lines</summary>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {FUNGIST_VOICE_LINES.map((line) => <button key={line.id} type="button" disabled={settings.fungistEnabled === false || settings.soundsEnabled === false || (settings.soundPack || 'synthwave') === 'none' || settings.fungistVoiceEnabled === false} onClick={() => playFungistVoice(line.id, { volume: settings.fungistVoiceVolume ?? 72, cooldownMs: 0, priority: true })} title={line.use} className="rounded-md hairline px-2 py-1.5 text-left text-[10px] text-muted hover:border-[rgb(var(--accent)/0.5)] hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"><span className="block font-bold text-ink">{line.label}</span><span className="mt-0.5 block leading-snug">{line.use}</span></button>)}
                </div>
              </details>
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

        {/* App behaviour */}
        <Section title="App behaviour">
          <div className="space-y-3">
            <Toggle
              label="Rest NEO-LIB while a game is running"
              hint="On by default. Pauses visual effects, animations, sounds, health polling, launcher scans, news checks, deal rotation, and social checks while a game launched through NEO-LIB is open."
              value={settings.gameRestMode !== false}
              onChange={(v) => setKey({ gameRestMode: v })}
              testid="opt-game-rest-mode"
            />
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

        <Section title="NEO-LIB Mascot">
          <div className="space-y-3">
            <div className="rounded-lg hairline bg-surface/40 px-3 py-2.5">
              <div className="mb-2.5">
                <div className="text-[13px] font-medium">Choose your mascot</div>
                <p className="mt-0.5 text-[10px] leading-relaxed text-muted">Your active companion appears in the tutorial, gives optional attention notices, and can open the AI chat.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" aria-pressed={(settings.mascotId || 'fungist') === 'fungist'} onClick={() => setKey({ mascotId: 'fungist' })} data-testid="mascot-picker-fungist" className={`group overflow-hidden rounded-lg border p-2 text-left transition ${((settings.mascotId || 'fungist') === 'fungist') ? 'border-[rgb(var(--accent)/0.75)] bg-[rgb(var(--accent)/0.12)] shadow-[0_0_18px_-10px_rgb(var(--accent))]' : 'border-[rgb(var(--border)/0.75)] hover:border-[rgb(var(--accent)/0.45)]'}`}>
                  <div className="flex items-center gap-2"><img src={FUNGIST_MASCOT_ASSET} alt="Fungist mascot" className="h-12 w-12 object-contain" /><span className="min-w-0"><span className="block text-[11px] font-black text-ink">Fungist</span><span className="mt-0.5 block text-[9px] text-muted">Original NEO-LIB companion</span></span></div>
                  <span className="mt-2 inline-flex rounded-full border border-[rgb(var(--accent)/0.45)] bg-[rgb(var(--accent)/0.1)] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-[rgb(var(--accent))]">{((settings.mascotId || 'fungist') === 'fungist') ? 'Selected' : 'Choose'}</span>
                </button>
                <div aria-label="More mascots coming soon" className="flex min-h-[92px] flex-col items-center justify-center rounded-lg border border-dashed border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface)/0.22)] px-2 text-center opacity-70">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--border)/0.7)] text-lg text-muted">?</span><span className="mt-1.5 text-[10px] font-black text-muted">Coming soon</span><span className="mt-0.5 text-[8.5px] text-muted/80">More companions will appear here.</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg hairline bg-[rgb(var(--accent)/0.045)] px-3 py-2.5">
              <Toggle
                label="Show NEO-LIB mascot"
                hint="Hiding Fungist also mutes every mascot voice line. You can always bring the mascot back here in Settings → NEO-LIB Mascot."
                value={settings.fungistEnabled !== false}
                onChange={setMascotVisible}
                testid="opt-fungist-enabled"
              />
              {settings.fungistEnabled === false && <p role="status" className="mt-2 rounded-md border border-[rgb(var(--accent-2)/0.34)] bg-[rgb(var(--accent-2)/0.07)] px-2.5 py-2 text-[10px] leading-relaxed text-muted"><b className="text-ink">Mascot hidden and muted.</b> You can enable Fungist again anytime in Settings → NEO-LIB Mascot.</p>}
            </div>
            <div className="rounded-lg hairline bg-surface/40 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[13px] font-medium">Mascot AI chat model</div>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted">This controls mascot chat. Only genuinely connected models are selectable.</p>
                </div>
                <span className="shrink-0 rounded-full border border-[rgb(var(--accent)/0.45)] bg-[rgb(var(--accent)/0.1)] px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[rgb(var(--accent))]">Current</span>
              </div>
              <div className="mt-2 grid gap-1.5">
                {AI_MODELS.map((model) => {
                  const selected = (settings.aiModel || 'gemini-2.5-flash') === model.id;
                  return <button key={model.id} type="button" aria-pressed={selected} onClick={() => setKey({ aiModel: model.id })} className={`rounded-md border px-2.5 py-2 text-left transition-colors ${selected ? 'border-[rgb(var(--accent)/0.7)] bg-[rgb(var(--accent)/0.12)] text-ink' : 'border-[rgb(var(--border)/0.75)] text-muted hover:border-[rgb(var(--accent)/0.4)] hover:text-ink'}`}><span className="flex items-center justify-between gap-2"><span className="text-[11px] font-bold">{model.label}</span>{selected && <Check size={13} className="text-[rgb(var(--accent))]" />}</span><span className="mt-0.5 block text-[9.5px] leading-relaxed opacity-80">{model.provider} · {model.detail}</span></button>;
                })}
              </div>
              <p className="mt-2 text-[9.5px] text-muted">More models appear here only after their provider connection is implemented and tested.</p>
            </div>
            <div className="rounded-lg hairline bg-surface/40 px-3 py-2.5">
              <div className="mb-1 text-[13px] font-medium">Mascot notifications</div>
              <p className="mb-2 text-[10px] leading-relaxed text-muted">Choose exactly what your mascot may interrupt you about. Rest Mode still pauses every reaction.</p>
              <div className="space-y-2">
                {FUNGIST_NOTIFICATIONS.map((notification) => <Toggle key={notification.id} label={notification.label} hint={notification.hint} value={(settings.fungistNotifications || {})[notification.id] !== false} onChange={(value) => setKey({ fungistNotifications: { ...(settings.fungistNotifications || {}), [notification.id]: value } })} testid={`fungist-notification-${notification.id}`} />)}
              </div>
            </div>
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
            >Gemini API key</a>{' '}
            below. It is saved locally in your NEO-LIB settings and is sent only to Google when you choose Ask AI, Fungist chat, or Auto fetch uses the AI fallback.
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
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button onClick={testAiKey} disabled={aiTest.state === 'loading'} className="rounded-md border border-[rgb(var(--accent)/0.45)] bg-[rgb(var(--accent)/0.08)] px-3 py-1.5 text-[10px] font-black text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.16)] disabled:opacity-50">
              {aiTest.state === 'loading' ? 'Testing connection…' : 'Test AI connection'}
            </button>
            {aiTest.state !== 'idle' && <span className={`text-[10px] ${aiTest.state === 'ok' ? 'text-emerald-300' : aiTest.state === 'error' ? 'text-rose-300' : 'text-muted'}`}>{aiTest.message}</span>}
          </div>
        </Section>

        <Section title="About">
          <p className="text-xs text-muted leading-relaxed">
            NEO-LIB v{currentVersion}. Local-first. Metadata sourced from Steam, GOG, itch.io, VNDB, DLsite, DuckDuckGo and Google.
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

function Toggle({ label, hint, value, onChange, testid, disabled = false }) {
  return (
    <div className={`neo-tooltip-trigger relative flex min-h-[42px] items-center justify-between gap-3 rounded-lg hairline bg-surface/40 px-3 py-2 transition-colors ${disabled ? 'cursor-not-allowed opacity-55' : 'hover:border-[rgb(var(--accent)/0.4)]'}`}>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium leading-tight">{label}</div>
      </div>
      <button
        type="button"
        data-testid={testid}
        aria-pressed={value}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={
          'relative h-5 w-10 shrink-0 self-center rounded-full transition-colors disabled:cursor-not-allowed ' +
          (value ? 'bg-[rgb(var(--accent))] shadow-[0_0_10px_-2px_rgb(var(--accent))]' : 'bg-[rgb(var(--border))]')
        }
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
          style={{ left: value ? '22px' : '2px' }}
        />
      </button>
      {hint && <span className="neo-tooltip" role="tooltip">{hint}</span>}
    </div>
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
  const themeLabel = ({ colorful: 'Magical', pro: 'Industrial' }[theme] || theme.charAt(0).toUpperCase() + theme.slice(1).replace('-', ' '));
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

