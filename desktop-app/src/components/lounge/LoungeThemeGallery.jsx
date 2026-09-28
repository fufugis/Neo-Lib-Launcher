import React from 'react';
import { ArrowRight, ChevronDown, Images, Palette, Sparkles, X } from 'lucide-react';
import { THEMES } from '../../lib/utils.js';
import { customThemeList, stockThemeAssetUrl } from '../../themes/stock-theme-registry.mjs';
import { applyLoungeDesktopTheme, applyLoungeScene, LOUNGE_SCENES } from './lounge-layout-model.mjs';
import { loungeSceneArt } from './lounge-scene-art.mjs';

function customGradient(manifest) {
  const start = manifest.palette?.grad1?.join(' ') || '20 25 50';
  const end = manifest.palette?.grad2?.join(' ') || '80 65 120';
  return `linear-gradient(135deg, rgb(${start}), rgb(${end}))`;
}

export default function LoungeThemeGallery({ preferences, onChange, onTuneVisuals, onClose }) {
  const closeRef = React.useRef(null);
  const [showDesktopThemes, setShowDesktopThemes] = React.useState(Boolean(preferences.desktopThemeOverride));
  const installedCustomThemes = customThemeList().map(manifest => ({ id: `custom:${manifest.id}`, label: manifest.name || manifest.label || manifest.id, gradient: customGradient(manifest), tone: 'Your themes' }));
  const desktopThemes = [...THEMES, ...installedCustomThemes];
  const activeOverride = preferences.specialTheme === 'theme' ? preferences.desktopThemeOverride : '';
  const missingOverride = activeOverride && !desktopThemes.some(item => item.id === activeOverride);
  const followingDesktop = preferences.specialTheme === 'theme' && !activeOverride;
  React.useEffect(() => { closeRef.current?.focus(); }, []);

  return <div role="dialog" aria-modal="true" aria-label="Lounge themes" data-testid="lounge-theme-gallery" className="fixed inset-0 z-[9100] flex items-center justify-center bg-black/80 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`flex max-h-[96vh] w-full flex-col overflow-hidden rounded-3xl border border-[rgb(var(--accent)/0.55)] bg-[rgb(var(--surface))] shadow-[0_28px_100px_rgb(0_0_0/0.55)] transition-[max-width] duration-300 ${showDesktopThemes ? 'max-w-[min(96vw,1500px)]' : 'max-w-5xl'}`}>
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[rgb(var(--border))] px-5 py-4 sm:px-7">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[rgb(var(--accent)/0.18)] text-[rgb(var(--accent-2))]"><Images size={24} /></span><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">Lounge only</p><h2 className="text-xl font-black sm:text-2xl">Themes</h2></div></div>
        <button ref={closeRef} type="button" data-controller-close onClick={onClose} aria-label="Close Lounge themes" className="lounge-visual-step rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.7)] p-3"><X size={20} /></button>
      </header>
      <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
        <p className="max-w-2xl text-sm text-muted">Pick the atmosphere for Lounge without changing your desktop theme. Choose a desktop theme below or a special Lounge scene. Fine-tune artwork and effects separately in Visuals.</p>
        {showDesktopThemes && <section id="lounge-desktop-theme-picker" data-testid="lounge-desktop-theme-picker" aria-label="Desktop themes for Lounge" className="mt-6 rounded-2xl border border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--panel)/0.48)] p-4 shadow-[0_0_35px_rgb(var(--accent)/0.1)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Palette size={23} className="text-[rgb(var(--accent-2))]" /><div><h3 className="text-lg font-black">Desktop themes in Lounge</h3><p className="text-xs text-muted">Choose any installed theme here. Your desktop appearance stays untouched.</p></div></div><span className="rounded-full border border-[rgb(var(--accent)/0.4)] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[rgb(var(--accent-2))]">{desktopThemes.length} available</span></div>
          {missingOverride && <p role="status" className="mb-4 rounded-xl border border-amber-400/50 bg-amber-400/10 p-3 text-xs">That custom theme is no longer installed. Lounge is temporarily using your current desktop theme; choose another theme or Follow desktop theme.</p>}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{desktopThemes.map(item => {
            const active = activeOverride === item.id;
            const art = stockThemeAssetUrl(item.id, 'atmosphere');
            return <button key={item.id} type="button" aria-pressed={active} aria-label={`Use ${item.label} in Lounge`} onClick={() => onChange(applyLoungeDesktopTheme(preferences, item.id))} className={`lounge-visual-choice group overflow-hidden rounded-xl border text-left focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))] ${active ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.2)] shadow-[0_0_20px_rgb(var(--accent)/0.2)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.55)] hover:border-[rgb(var(--accent)/0.65)]'}`}>
              <span className="relative block h-24 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]" style={{ backgroundImage: art ? `linear-gradient(0deg, rgb(0 0 0 / 0.28), transparent), url(${JSON.stringify(art)})` : item.gradient }}><span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">{active ? 'Active' : item.tone === 'Your themes' ? 'Custom' : item.tone}</span></span><span className="block px-3 py-2 text-sm font-black">{item.label}</span>
            </button>;
          })}</div>
        </section>}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">{Object.entries(LOUNGE_SCENES).map(([id, scene]) => {
          const active = id === 'theme' ? followingDesktop : preferences.specialTheme === id;
          return <div key={id} className={`relative overflow-hidden rounded-2xl border ${active ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)]'}`}>
            <button type="button" aria-pressed={active} onClick={() => onChange(applyLoungeScene(preferences, id))} className="lounge-visual-choice block w-full text-left focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[rgb(var(--accent))]"><span className="relative block h-36 bg-[rgb(var(--panel))] bg-cover bg-center" style={loungeSceneArt(id) ? { backgroundImage: `url(${JSON.stringify(loungeSceneArt(id))})` } : { backgroundImage: 'linear-gradient(130deg, rgb(var(--grad-1)), rgb(var(--accent) / 0.32), rgb(var(--grad-2)))' }}>{active && <span className={`absolute top-3 rounded-full border border-white/60 bg-black/70 px-3 py-1 text-xs font-black text-white ${id === 'theme' ? 'left-3' : 'right-3'}`}>Active</span>}</span><span className="block p-4"><strong className="block text-base">{scene.label}</strong><small className="mt-1 block text-xs text-muted">{scene.note}</small></span></button>
            {id === 'theme' && <button type="button" aria-expanded={showDesktopThemes} aria-controls="lounge-desktop-theme-picker" onClick={() => setShowDesktopThemes(value => !value)} className="lounge-visual-choice absolute right-3 top-3 inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/55 bg-black/75 px-3 text-xs font-black text-white shadow-lg focus-visible:outline focus-visible:outline-3 focus-visible:outline-white"><Palette size={15} /> {showDesktopThemes ? 'Hide Desktop Themes' : 'Show Desktop Themes'} <ChevronDown size={14} className={showDesktopThemes ? 'rotate-180' : ''} /></button>}
          </div>;
        })}</div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[rgb(var(--accent)/0.35)] bg-[rgb(var(--panel)/0.55)] p-4"><p className="max-w-lg text-xs leading-relaxed text-muted">Your Lounge theme choice is saved separately. Custom artwork, glow, waves and particles remain under Visuals; layout and sound remain under Settings.</p><button type="button" onClick={onTuneVisuals} className="lounge-visual-choice inline-flex min-h-11 items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--accent)/0.17)] px-4 text-sm font-black"><Sparkles size={18} /> Fine-tune Visuals <ArrowRight size={17} /></button></div>
      </div>
    </section>
  </div>;
}
