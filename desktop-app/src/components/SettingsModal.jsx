import React from 'react';
import { motion } from 'framer-motion';
import { THEMES } from '../lib/utils';
import { Check } from 'lucide-react';
import Modal from './Modal';

export default function SettingsModal({ open, onClose, settings, setSettings }) {
  const setTheme = (id) => setSettings({ ...settings, theme: id });
  return (
    <Modal open={open} onClose={onClose} title="Settings" testid="settings-modal">
      <div className="p-5 space-y-6">
        <section>
          <h3 className="mb-3 text-[10px] uppercase tracking-[0.22em] text-muted">Theme</h3>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((t) => (
              <motion.button
                key={t.id}
                data-testid={`theme-${t.id}`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setTheme(t.id)}
                className={
                  'group relative flex items-center gap-3 rounded-lg hairline p-3 text-left transition-all ' +
                  (settings.theme === t.id ? 'border-accent bg-accent/8' : 'hover:border-accent/40')
                }
              >
                <span
                  className="h-8 w-8 rounded-md border border-white/10"
                  style={{ background: t.swatch }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-[11px] text-muted capitalize">{t.id}</div>
                </div>
                {settings.theme === t.id && (
                  <motion.span
                    layoutId="theme-check"
                    className="grid h-5 w-5 place-items-center rounded-full bg-accent text-surface"
                  >
                    <Check size={11} strokeWidth={3} />
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-[10px] uppercase tracking-[0.22em] text-muted">About</h3>
          <p className="text-xs text-muted leading-relaxed">
            Game Library v1.0. Metadata is sourced from the public Steam Store catalog (no account or
            API key needed). Game data is stored locally on your machine.
          </p>
        </section>
      </div>
    </Modal>
  );
}
