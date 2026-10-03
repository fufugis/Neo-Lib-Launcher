import React from 'react';
import { ArrowRight, ChevronDown, Images, Palette, Sparkles, X } from 'lucide-react';
import { THEMES } from '../../lib/utils.js';
import { customThemeList, stockThemeAssetUrl } from '../../themes/stock-theme-registry.mjs';
import { applyLoungeDesktopTheme, applyLoungePreset, applyLoungeScene, applyLoungeVisualPreset, LOUNGE_PRESETS, LOUNGE_SCENES, LOUNGE_VISUAL_PRESETS } from './lounge-layout-model.mjs';
import { normalizeLoungeSavedPresets } from './lounge-saved-presets.mjs';
import { loungeSceneArt } from './lounge-scene-art.mjs';
import useDraggablePanel from './use-draggable-panel';
import LoungeBackgroundImport from './LoungeBackgroundImport';

function customGradient(manifest) {
  const start = manifest.palette?.grad1?.join(' ') || '20 25 50';
  const end = manifest.palette?.grad2?.join(' ') || '80 65 120';
  return `linear-gradient(135deg, rgb(${start}), rgb(${end}))`;
}

export default function LoungeThemeGallery({ preferences, layout, savedPresets = [], onSavedPresetsChange, onLayoutChange, onChange, onTuneVisuals, onClose }) {
  const closeRef = React.useRef(null);
  const draggable = useDraggablePanel();
  const fileRef = React.useRef(null);
  const [category, setCategory] = React.useState('scenes');
  const [presetName, setPresetName] = React.useState('');
  const [presetError, setPresetError] = React.useState('');
  const [showDesktopThemes, setShowDesktopThemes] = React.useState(Boolean(preferences.desktopThemeOverride));
  const installedCustomThemes = customThemeList().map(manifest => ({ id: `custom:${manifest.id}`, label: manifest.name || manifest.label || manifest.id, gradient: customGradient(manifest), tone: 'Your themes' }));
  const desktopThemes = [...THEMES, ...installedCustomThemes];
  const activeOverride = preferences.specialTheme === 'theme' ? preferences.desktopThemeOverride : '';
  const missingOverride = activeOverride && !desktopThemes.some(item => item.id === activeOverride);
  const followingDesktop = preferences.specialTheme === 'theme' && !activeOverride;
  React.useEffect(() => { closeRef.current?.focus(); }, []);
  const savePreset = () => {
    const name = presetName.trim();
    if (!name) { setPresetError('Give your setup a name first.'); return; }
    if (savedPresets.length >= 24) { setPresetError('You can save up to 24 Lounge presets. Remove one first.'); return; }
    const preset = { id: `lounge-${Date.now()}`, name, layout, preferences: { ...preferences, showPrivateGamesInLounge: false } };
    onSavedPresetsChange(normalizeLoungeSavedPresets([...savedPresets, preset]));
    setPresetName(''); setPresetError('Saved. Private-game access is never included.');
  };
  const usePreset = preset => { onChange(preset.preferences); onLayoutChange(preset.layout); };
  const exportPreset = preset => {
    const portable = { ...preset, preferences: { ...preset.preferences, backgroundUrl: '', ambienceCustomUrl: '', showPrivateGamesInLounge: false } };
    if (portable.preferences.backdropMode === 'image') portable.preferences.backdropMode = 'theme';
    if (portable.preferences.ambienceTrack === 'custom') portable.preferences.ambienceTrack = 'none';
    const url = URL.createObjectURL(new Blob([JSON.stringify({ format: 'neo-lib-lounge-preset', version: 1, preset: portable }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `neo-lib-lounge-${preset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'preset'}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importPreset = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (file.size > 128000) { setPresetError('Preset file is too large.'); return; }
    try {
      const data = JSON.parse(await file.text());
      if (data?.format !== 'neo-lib-lounge-preset' || data?.version !== 1 || !data.preset) throw new Error('Invalid preset');
      const importedPreferences = { ...data.preset.preferences, backgroundUrl: '', ambienceCustomUrl: '', showPrivateGamesInLounge: false };
      if (importedPreferences.backdropMode === 'image') importedPreferences.backdropMode = 'theme';
      if (importedPreferences.ambienceTrack === 'custom') importedPreferences.ambienceTrack = 'none';
      const parsed = normalizeLoungeSavedPresets([{ ...data.preset, preferences: importedPreferences, id: `import-${Date.now()}` }]);
      if (!parsed.length) throw new Error('Invalid preset');
      if (savedPresets.length >= 24) throw new Error('Preset limit reached');
      onSavedPresetsChange(normalizeLoungeSavedPresets([...savedPresets, parsed[0]]));
      setPresetError(`Imported ${parsed[0].name}. Select it below to apply.`);
    } catch { setPresetError('This is not a valid NEO-LIB Lounge preset.'); }
  };

  return <div role="dialog" aria-modal="true" aria-label="Lounge themes" data-testid="lounge-theme-gallery" className="fixed inset-0 z-[9100] flex items-center justify-center bg-black/80 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={draggable.panelRef} style={draggable.panelStyle} className={`flex max-h-[96vh] w-full flex-col overflow-hidden rounded-3xl border border-[rgb(var(--accent)/0.55)] bg-[rgb(var(--surface))] shadow-[0_28px_100px_rgb(0_0_0/0.55)] transition-[max-width] duration-300 ${showDesktopThemes ? 'max-w-[min(96vw,1500px)]' : 'max-w-5xl'}`}>
      <header {...draggable.dragHandleProps} className="flex shrink-0 items-center justify-between gap-4 border-b border-[rgb(var(--border))] px-5 py-4 sm:px-7">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[rgb(var(--accent)/0.18)] text-[rgb(var(--accent-2))]"><Images size={24} /></span><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">Lounge only</p><h2 className="text-xl font-black sm:text-2xl">Themes</h2></div></div>
        <button ref={closeRef} type="button" data-controller-close onClick={onClose} aria-label="Close Lounge themes" className="lounge-visual-step rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.7)] p-3"><X size={20} /></button>
      </header>
      <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
        <div className="mb-5 flex gap-2" role="tablist" aria-label="Lounge theme categories"><button type="button" role="tab" aria-selected={category === 'scenes'} onClick={() => setCategory('scenes')} className="lounge-visual-choice rounded-xl border border-[rgb(var(--accent)/0.5)] px-4 py-2 font-bold">Scenes</button><button type="button" role="tab" aria-selected={category === 'presets'} onClick={() => setCategory('presets')} className="lounge-visual-choice rounded-xl border border-[rgb(var(--accent)/0.5)] px-4 py-2 font-bold">Lounge-only presets</button></div>
        {category === 'scenes' ? <>
        <LoungeBackgroundImport preferences={preferences} onChange={onChange} />
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
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[rgb(var(--accent)/0.35)] bg-[rgb(var(--panel)/0.55)] p-4"><p className="max-w-lg text-xs leading-relaxed text-muted">Your Lounge theme choice is saved separately. Import custom backgrounds here; adjust framing, glow, waves and particles in Visuals. Layout remains under Settings; Sound &amp; Music has its own icon.</p><button type="button" onClick={onTuneVisuals} className="lounge-visual-choice inline-flex min-h-11 items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--accent)/0.17)] px-4 text-sm font-black"><Sparkles size={18} /> Fine-tune Visuals <ArrowRight size={17} /></button></div>
        </> : <section aria-label="Lounge-only presets"><p className="text-sm text-muted">Start with a layout or look, or save your complete Lounge setup—including visuals, controls, and sound. Applying a preset never unlocks private games.</p><h3 className="mt-6 text-lg font-black">Layout starters</h3><div data-controller-grid className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(LOUNGE_PRESETS).map(([id, preset]) => <button key={id} type="button" onClick={() => { onChange(applyLoungePreset(preferences, id)); onLayoutChange('browser'); }} className="lounge-visual-choice rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.48)] p-4 text-left"><strong>{preset.label}</strong><small className="mt-1 block text-muted">{preset.shelfPosition} carousel · {preset.infoDensity} details</small></button>)}</div><h3 className="mt-6 text-lg font-black">Visual starters</h3><div data-controller-grid className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(LOUNGE_VISUAL_PRESETS).map(([id, preset]) => <button key={id} type="button" onClick={() => onChange(applyLoungeVisualPreset(preferences, id))} className="lounge-visual-choice rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.48)] p-4 text-left"><strong>{preset.label}</strong><small className="mt-1 block text-muted">{preset.note}</small></button>)}</div><h3 className="mt-7 text-lg font-black">My Lounge presets</h3><div className="mt-3 flex flex-wrap gap-2"><input aria-label="New Lounge preset name" maxLength={48} value={presetName} onChange={event => setPresetName(event.target.value)} placeholder="Name this setup" className="min-h-11 min-w-48 flex-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 text-sm" /><button type="button" onClick={savePreset} className="lounge-visual-choice rounded-xl border border-[rgb(var(--accent))] px-4 text-sm font-bold">Save current setup</button><button type="button" onClick={() => fileRef.current?.click()} className="lounge-visual-choice rounded-xl border border-[rgb(var(--border))] px-4 text-sm font-bold">Import preset</button><input ref={fileRef} type="file" accept=".json,application/json" onChange={importPreset} className="hidden" /></div>{presetError && <p role="status" className="mt-2 text-xs text-[rgb(var(--accent-2))]">{presetError}</p>}<div data-controller-grid className="mt-4 grid gap-3 sm:grid-cols-2">{savedPresets.map(preset => <div key={preset.id} className="rounded-xl border border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--panel)/0.5)] p-3"><strong className="block truncate">{preset.name}</strong><small className="text-muted">{preset.layout === 'wall' ? 'Cover Wall' : 'Game Browser'} · complete setup</small><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => usePreset(preset)} className="lounge-visual-choice rounded-lg border border-[rgb(var(--accent))] px-3 py-2 text-xs font-bold">Use</button><button type="button" onClick={() => exportPreset(preset)} className="lounge-visual-choice rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs font-bold">Export</button><button type="button" onClick={() => onSavedPresetsChange(savedPresets.filter(item => item.id !== preset.id))} className="lounge-visual-choice rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs font-bold">Remove</button></div></div>)}</div>{!savedPresets.length && <p className="mt-3 text-sm text-muted">No saved presets yet.</p>}<p className="mt-4 text-xs text-muted">Export omits local artwork/audio file paths. Rechoose those files after importing on another computer.</p></section>}
      </div>
    </section>
  </div>;
}
