import React from 'react';
import { motion } from 'framer-motion';
import { Check, Palette, Sparkles } from 'lucide-react';
import { THEMES } from '../lib/utils';
import Modal from './Modal';

const THEME_GROUPS = [
  { tone: 'bright', label: 'Bright' },
  { tone: 'middle', label: 'Mid' },
  { tone: 'dark', label: 'Dark' },
  { tone: 'special', label: 'Special' },
];

export default function ThemeStudioModal({ open, onClose, settings, setSettings }) {
  const setKey = (patch) => setSettings({ ...settings, ...patch });
  return <Modal open={open} onClose={onClose} title="Themes" wide testid="theme-studio-modal">
    <div className="p-5">
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-[rgb(var(--accent)/0.24)] bg-[rgb(var(--accent)/0.055)] p-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgb(var(--accent)/0.13)] text-[rgb(var(--accent))]"><Palette size={18} /></span>
        <div><p className="text-[12px] font-black text-ink">Choose NEO-LIB's atmosphere</p><p className="mt-0.5 text-[10px] leading-relaxed text-muted">Themes change the overall colour, ambience and Special artwork. Use Visual Tweaks from the NEO-LIB menu for typography, layout, texture, motion and effect strength.</p></div>
      </div>
      <div className="grid max-w-full gap-3 overflow-x-auto pb-1" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 148px))' }} data-testid="theme-picker-columns">
        {THEME_GROUPS.map((group) => <div key={group.tone} className="flex flex-col gap-1.5">
          <div className="mb-0.5 text-center text-[9.5px] uppercase tracking-[0.24em] text-muted/80">{group.label}</div>
          {THEMES.filter((theme) => theme.tone === group.tone).map((theme) => {
            const active = settings.theme === theme.id;
            return <motion.button key={theme.id} data-testid={`theme-${theme.id}`} whileHover={{ y: -1, scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={() => setKey({ theme: theme.id })} title={theme.label} className={`group relative flex w-full flex-col items-center gap-1 rounded-md hairline px-1.5 py-1.5 text-center transition-all ${active ? 'border-[rgb(var(--accent)/0.85)] bg-[rgb(var(--accent)/0.12)]' : 'hover:border-[rgb(var(--accent)/0.4)]'}`}>
              <span className="theme-swatch-drift h-[22px] w-full rounded-sm border border-white/10" style={{ background: theme.gradient || theme.swatch, backgroundSize: '170% 100%', animationDuration: '48s', boxShadow: active ? `0 0 8px ${theme.swatch}88, inset 0 0 4px rgba(255,255,255,0.15)` : `0 0 2px ${theme.swatch}33` }} />
              <span className="w-full text-[11.5px] font-semibold leading-tight opacity-95">{theme.label}</span>
              {active && <motion.span layoutId="theme-check" className="absolute -right-0.5 -top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-[rgb(var(--accent))] text-[rgb(var(--surface))]"><Check size={8} strokeWidth={4} /></motion.span>}
            </motion.button>;
          })}
        </div>)}
      </div>
      <button type="button" disabled data-testid="custom-theme-coming-soon" className="mt-4 flex w-full items-center justify-between rounded-xl border border-dashed border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.28)] px-3 py-2.5 text-left opacity-65"><span><span className="block text-[11px] font-black text-ink">Custom theme</span><span className="mt-0.5 block text-[9.5px] text-muted">Save your own colours, artwork and effects.</span></span><span className="rounded-full border border-[rgb(var(--border)/0.7)] px-2 py-1 text-[8px] font-black uppercase tracking-wide text-muted">Coming soon</span></button>
      <div className="mt-5 rounded-xl border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface)/0.42)] p-3" data-testid="special-decoration-control">
        <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-2"><Sparkles size={14} className="mt-0.5 shrink-0 text-[rgb(var(--accent))]" /><div><p className="text-[12px] font-medium text-ink">Special theme decoration</p><p className="mt-0.5 text-[10px] leading-relaxed text-muted">Controls Anime blossoms, Industrial chains/cogs and Magical corner effects. Set it to 0% for colour-only themes.</p></div></div><span className="shrink-0 text-[11px] font-black text-[rgb(var(--accent-2))]">{Math.round(Number(settings.specialDecorationOpacity ?? 46))}%</span></div>
        <input aria-label="Special theme decoration" type="range" min="0" max="100" step="1" value={Number(settings.specialDecorationOpacity ?? 46)} onChange={(event) => setKey({ specialDecorationOpacity: Number(event.target.value) })} className="mt-3 w-full accent-[rgb(var(--accent))]" />
      </div>
    </div>
  </Modal>;
}
