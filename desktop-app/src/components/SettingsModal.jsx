import React from 'react';
import { motion } from 'framer-motion';
import { THEMES } from '../lib/utils';
import { Check, Sparkles, Eye, EyeOff } from 'lucide-react';
import Modal from './Modal';

export default function SettingsModal({ open, onClose, settings, setSettings }) {
  const setTheme = (id) => setSettings({ ...settings, theme: id });
  const setGemini = (geminiKey) => setSettings({ ...settings, geminiKey });
  const [showKey, setShowKey] = React.useState(false);

  return (
    <Modal open={open} onClose={onClose} title="Settings" wide testid="settings-modal">
      <div className="p-5 space-y-6">
        <section>
          <h3 className="mb-3 text-[10px] uppercase tracking-[0.28em] text-muted">Theme</h3>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {THEMES.map((t) => (
              <motion.button
                key={t.id}
                data-testid={`theme-${t.id}`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setTheme(t.id)}
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
        </section>

        <section>
          <h3 className="mb-2 text-[10px] uppercase tracking-[0.28em] text-muted">
            <Sparkles size={11} className="mr-1 inline text-[rgb(var(--accent))]" />
            AI fallback · optional
          </h3>
          <p className="mb-3 text-xs text-muted leading-relaxed">
            NEO-LIB looks up game metadata for free from Steam, GOG, and the public web. If you want
            an AI fallback for the trickiest obscure games, paste a <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.api?.openExternal('https://aistudio.google.com/app/apikey');
              }}
              className="text-[rgb(var(--accent-2))] hover:underline"
            >free Gemini API key</a> below. Stays on this PC, never sent anywhere except Google.
          </p>
          <div className="relative">
            <input
              data-testid="settings-gemini-key"
              type={showKey ? 'text' : 'password'}
              value={settings.geminiKey || ''}
              onChange={(e) => setGemini(e.target.value.trim())}
              placeholder="AIza…"
              className="w-full rounded-md bg-surface/60 hairline px-3 h-9 pr-9 text-sm font-mono focus:outline-none focus:border-accent/60"
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              title={showKey ? 'Hide' : 'Show'}
            >
              {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-[10px] uppercase tracking-[0.28em] text-muted">About</h3>
          <p className="text-xs text-muted leading-relaxed">
            NEO-LIB v1.0. Local-first. Metadata sourced from Steam, GOG, and DuckDuckGo/Google web
            results. Library data lives in <span className="font-mono text-ink">%APPDATA%/NEO-LIB</span>.
          </p>
        </section>
      </div>
    </Modal>
  );
}
