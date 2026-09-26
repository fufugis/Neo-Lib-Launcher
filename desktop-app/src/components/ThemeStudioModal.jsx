import React from 'react';
import { motion } from 'framer-motion';
import { Check, Palette, Sparkles } from 'lucide-react';
import { THEMES } from '../lib/utils';
import Modal from './Modal';
import ThemeCreatorPanel from './ThemeCreatorPanel';

const THEME_GROUPS = [
  { tone: 'bright', label: 'Bright' },
  { tone: 'middle', label: 'Mid' },
  { tone: 'dark', label: 'Dark' },
  { tone: 'special', label: 'Special' },
];

export default function ThemeStudioModal({ open, onClose, settings, setSettings, installedCustomThemes = [], refreshCustomThemes }) {
  const setKey = (patch) => setSettings({ ...settings, ...patch });
  const [pending, setPending] = React.useState(null);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  async function selectTheme() {
    setError('');
    const path = await window.api?.pickThemeManifest?.();
    if (!path) return;
    const review = await window.api.inspectTheme(path);
    if (!review?.ok) { setError(review?.error || 'Could not read this theme.'); return; }
    setPending({ path, ...review });
  }
  async function installTheme() {
    if (!pending || busy) return;
    setBusy(true);
    const result = await window.api.installTheme(pending.path);
    setBusy(false);
    if (!result?.ok) { setError(result?.error || 'Could not install this theme.'); return; }
    await refreshCustomThemes?.();
    setKey({ theme: `custom:${result.id}` });
    setPending(null);
    setError('');
  }
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
      <button type="button" onClick={selectTheme} disabled={!window.api?.pickThemeManifest || busy} data-testid="custom-theme-import" className="mt-4 flex w-full items-center justify-between rounded-xl border border-dashed border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.28)] px-3 py-2.5 text-left"><span><span className="block text-[11px] font-black text-ink">Import custom theme</span><span className="mt-0.5 block text-[9.5px] text-muted">Choose a theme.json and review its colours and local artwork first.</span></span><span className="rounded-full border border-[rgb(var(--border)/0.7)] px-2 py-1 text-[8px] font-black uppercase tracking-wide text-muted">Import</span></button>
      {pending && <div className="mt-2 rounded-xl border border-[rgb(var(--accent)/0.4)] bg-[rgb(var(--panel)/0.8)] p-3" data-testid="custom-theme-review">
        <p className="text-xs font-bold text-ink">{pending.manifest.name}</p>
        {pending.previewUrl && <img src={pending.previewUrl} alt={`${pending.manifest.name} artwork preview`} className="mt-2 h-20 w-full rounded-lg object-cover" />}
        <p className="mt-1 text-[10px] text-muted">By {pending.manifest.license.attribution} · {pending.manifest.tone} · {pending.assetCount} image{pending.assetCount === 1 ? '' : 's'} · {Math.ceil(pending.bytes / 1024)} KB</p>
        <div className="mt-2 flex gap-1.5">{['surface', 'panel', 'accent', 'accent2'].map(key => <span key={key} title={key} className="h-5 w-8 rounded border border-white/20" style={{ backgroundColor: `rgb(${(pending.manifest.panels[key] || pending.manifest.palette[key]).join(',')})` }} />)}</div>
        <p className="mt-2 text-[10px] text-muted">Only colours and still-image artwork are installed. Existing themes are never replaced.</p>
        <div className="mt-2 flex gap-2"><button type="button" onClick={installTheme} disabled={busy} className="rounded-lg bg-[rgb(var(--accent))] px-3 py-1.5 text-[10px] font-bold text-[rgb(var(--surface))]">{busy ? 'Installing…' : 'Install and use'}</button><button type="button" onClick={() => setPending(null)} className="rounded-lg border border-[rgb(var(--border))] px-3 py-1.5 text-[10px]">Cancel</button></div>
      </div>}
      {error && <p role="alert" className="mt-2 text-[10px] text-red-300">{error}</p>}
      {installedCustomThemes.length > 0 && <div className="mt-3"><p className="mb-1.5 text-[9px] uppercase tracking-widest text-muted">Installed custom themes</p><div className="flex flex-wrap gap-2">{installedCustomThemes.map(theme => <button type="button" key={theme.id} onClick={() => setKey({ theme: `custom:${theme.id}` })} className={`rounded-lg border px-2.5 py-1.5 text-[11px] ${settings.theme === `custom:${theme.id}` ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.12)]' : 'border-[rgb(var(--border))]'}`} title={`By ${theme.license.attribution}`}>{theme.name}</button>)}</div></div>}
      <ThemeCreatorPanel themes={installedCustomThemes} onSaved={async id => { await refreshCustomThemes?.(); setKey({ theme: `custom:${id}` }); }} />
      <div className="mt-5 rounded-xl border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface)/0.42)] p-3" data-testid="special-decoration-control">
        <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-2"><Sparkles size={14} className="mt-0.5 shrink-0 text-[rgb(var(--accent))]" /><div><p className="text-[12px] font-medium text-ink">Special theme decoration</p><p className="mt-0.5 text-[10px] leading-relaxed text-muted">Controls Anime blossoms, Industrial chains/cogs and Magical corner effects. Set it to 0% for colour-only themes.</p></div></div><span className="shrink-0 text-[11px] font-black text-[rgb(var(--accent-2))]">{Math.round(Number(settings.specialDecorationOpacity ?? 46))}%</span></div>
        <input aria-label="Special theme decoration" type="range" min="0" max="100" step="1" value={Number(settings.specialDecorationOpacity ?? 46)} onChange={(event) => setKey({ specialDecorationOpacity: Number(event.target.value) })} className="mt-3 w-full accent-[rgb(var(--accent))]" />
      </div>
    </div>
  </Modal>;
}
