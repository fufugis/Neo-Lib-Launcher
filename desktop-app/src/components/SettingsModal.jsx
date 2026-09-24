import React from 'react';
import { BUILD_INFO } from '../build-info.mjs';
import { SOUND_PACKS, setSoundPack, playLaunch, playHover } from '../lib/sound';
import { Sparkles, Eye, EyeOff, Heart, DownloadCloud, MessageCircle } from 'lucide-react';
import Modal from './Modal';
import { DONATE_PAYPAL_URL } from './DonateModal';
import qrUrl from '../assets/donate-qr.png';
import { SettingsSection as Section, SettingsToggle as Toggle } from './settings/SettingsControls';

export default function SettingsModal({ open, onClose, settings, setSettings, onShowChangelog, currentVersion = '1.7.9' }) {
  const setKey = (patch) => setSettings({ ...settings, ...patch });
  const [showKey, setShowKey] = React.useState(false);
  const [showArtworkKey, setShowArtworkKey] = React.useState(false);
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
        <div className="mb-5 rounded-xl border border-[rgb(var(--accent)/0.24)] bg-[rgb(var(--accent)/0.055)] p-3">
          <div className="flex items-start gap-2.5"><Sparkles size={16} className="mt-0.5 shrink-0 text-[rgb(var(--accent))]" /><div><p className="text-[12px] font-black text-ink">Appearance has its own home</p><p className="mt-0.5 text-[10px] leading-relaxed text-muted">Use Themes and Visual Tweaks from the gear menu beside Home. Settings stays focused on how NEO-LIB behaves.</p></div></div>
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
            <Toggle
              label="Show game deals"
              hint="Show the small sponsored deals strip. Turning it off hides deals without affecting your library or game metadata."
              value={settings.dealsEnabled !== false}
              onChange={(v) => setKey({ dealsEnabled: v })}
              testid="opt-game-deals"
            />
          </div>
        </Section>

        <Section title="Artwork catalogue · optional">
          <p className="mb-3 text-xs leading-relaxed text-muted">
            Add your own{' '}<a href="#" onClick={(event) => { event.preventDefault(); window.api?.openExternal('https://www.steamgriddb.com/profile/preferences/api'); }} className="text-[rgb(var(--accent-2))] hover:underline">SteamGridDB API key</a>{' '}
            to search community cover, hero, logo and icon artwork from Game Workshop. NEO-LIB sends the key only to SteamGridDB after you deliberately search; every image remains a preview until you choose it and save the game.
          </p>
          <div className="relative">
            <input data-testid="settings-steamgriddb-key" type={showArtworkKey ? 'text' : 'password'} value={settings.steamGridDbKey || ''} onChange={(event) => setKey({ steamGridDbKey: event.target.value.trim() })} placeholder="SteamGridDB API key" className="h-9 w-full rounded-md bg-surface/60 hairline px-3 pr-9 font-mono text-sm focus:border-[rgb(var(--accent)/0.6)] focus:outline-none" />
            <button onClick={() => setShowArtworkKey((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink" title={showArtworkKey ? 'Hide' : 'Show'}>{showArtworkKey ? <EyeOff size={13} /> : <Eye size={13} />}</button>
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
            NEO-LIB v{currentVersion}. Local-first. Metadata sourced from Steam, GOG, itch.io, VNDB, DLsite, DuckDuckGo and Google; optional reviewed artwork can come from SteamGridDB.
            Library data lives in <span className="font-mono text-ink">%APPDATA%/NEO-LIB</span>.
          </p>
          <div className="mt-2 rounded-md border border-[rgb(var(--border)/0.8)] bg-[rgb(var(--panel)/0.45)] px-2.5 py-2 text-[10px] leading-relaxed text-muted" data-testid="settings-build-info">
            <div><b className="text-ink">Build {BUILD_INFO.id}</b> · {BUILD_INFO.architecture}</div>
            <div className="mt-0.5 font-mono text-[9px]" title={BUILD_INFO.fingerprint || 'Development source'}>
              {BUILD_INFO.revision}{BUILD_INFO.builtAt ? ` · ${new Date(BUILD_INFO.builtAt).toLocaleString()}` : ''}
            </div>
          </div>
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

