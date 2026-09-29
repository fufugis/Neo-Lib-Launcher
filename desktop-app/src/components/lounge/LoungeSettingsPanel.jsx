import React from 'react';
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { DEFAULT_LOUNGE_PREFERENCES, LOUNGE_BROWSE_BAR_FILTERS, LOUNGE_QUICK_LINKS, normalizeLoungePreferences } from './lounge-layout-model.mjs';

const POSITIONS = [['bottom', 'Bottom'], ['top', 'Top'], ['left', 'Left'], ['right', 'Right']];
const BROWSE_SORTS = [['library', 'Library order'], ['name', 'Name A–Z'], ['last-played', 'Last played'], ['recently-added', 'Recently added']];

function ChoiceRow({ label, value, choices, onChange }) {
  return <fieldset className="mt-5"><legend className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-muted">{label}</legend><div className="flex flex-wrap gap-2">{choices.map(([id, text]) => <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)} className={`lounge-setting-choice rounded-xl border px-3 py-2 text-sm font-bold ${value === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.2)] text-ink' : 'border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.48)] text-muted'}`}>{text}</button>)}</div></fieldset>;
}

function Range({ label, value, min, max, step = 1, onChange }) {
  const id = `lounge-range-${label.replaceAll(' ', '-')}`;
  return <div className="mt-4 text-sm"><div className="mb-2 flex justify-between gap-3"><label htmlFor={id} className="font-semibold">{label}</label><b className="text-[rgb(var(--accent-2))]">{value}px</b></div><div className="flex items-center gap-3"><button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} className="lounge-setting-choice rounded-lg border border-[rgb(var(--border))] px-2.5 py-1 font-bold disabled:opacity-40">−</button><input id={id} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className="min-w-0 flex-1 accent-[rgb(var(--accent))]" /><button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} className="lounge-setting-choice rounded-lg border border-[rgb(var(--border))] px-2.5 py-1 font-bold disabled:opacity-40">+</button></div></div>;
}

function QuickLinkPicker({ value, onChange }) {
  return <section id="lounge-settings-shortcuts" aria-label="Lounge top shortcuts" className="mt-7 scroll-mt-16 border-t border-[rgb(var(--border)/0.7)] pt-5"><h3 className="text-lg font-black">Top shortcuts</h3><p className="mt-1 text-xs text-muted">Choose up to five Lounge Home destinations for the top bar of special scenes. These are navigation shortcuts, not copies of desktop Home widget settings.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(LOUNGE_QUICK_LINKS).map(([id, label]) => <button key={id} type="button" aria-pressed={value.includes(id)} onClick={() => onChange(value.includes(id) ? value.filter(item => item !== id) : [...value, id].slice(0, 5))} className={`lounge-setting-choice rounded-xl border px-3 py-2.5 text-left text-sm font-bold ${value.includes(id) ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div></section>;
}

function BrowseBarPicker({ hidden, onChange }) {
  return <section aria-label="Lounge browsing bar buttons" className="mt-6 rounded-2xl border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--panel)/0.38)] p-4">
    <h4 className="text-sm font-black">Top browsing bar</h4>
    <p className="mt-1 text-xs text-muted">Choose which collection shortcuts appear beside All games. Wall, Game browser and All games stay visible so you can always get back. Hidden views still work from Lounge Home and other shortcuts; an active hidden view stays visible until you leave it.</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(LOUNGE_BROWSE_BAR_FILTERS).map(([id, label]) => {
      const visible = !hidden.includes(id);
      return <button key={id} type="button" role="switch" aria-checked={visible} onClick={() => onChange(visible ? [...hidden, id] : hidden.filter(item => item !== id))} className={`lounge-setting-choice flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold ${visible ? 'border-[rgb(var(--accent)/0.7)] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.48)] text-muted'}`}><span>{label}</span><span className="shrink-0 text-[10px] font-black uppercase tracking-wide">{visible ? 'Shown' : 'Hidden'}</span></button>;
    })}</div>
    {hidden.length > 0 && <button type="button" onClick={() => onChange([])} className="lounge-setting-choice mt-3 rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs font-bold">Show all shortcuts</button>}
  </section>;
}

function LoungeLayoutPreview({ layout, preferences, game }) {
  const sideShelf = ['left', 'right'].includes(preferences.shelfPosition);
  const backdrop = game?.headerImage
    ? `linear-gradient(90deg, rgb(4 9 22 / 0.9), rgb(4 9 22 / 0.15)), url(${JSON.stringify(game.headerImage)})`
    : 'linear-gradient(140deg, rgb(var(--grad-1)), rgb(var(--grad-2)))';
  const card = (index, size) => <i key={index} className="block shrink-0 rounded-sm border border-white/30 bg-[rgb(var(--accent)/0.7)]" style={{ width: size, height: sideShelf && layout === 'browser' ? 25 : Math.round(size * (preferences.coverAspect === 'tall' && layout === 'browser' ? 1.65 : 1.5)), opacity: index === 2 ? 1 : 0.6, transform: index === 2 ? 'scale(1.1)' : undefined }} />;
  return <div data-testid="lounge-settings-preview" className="shrink-0 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-6 py-4">
    <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--accent-2))]">Live layout preview</span><span className="text-[10px] font-bold text-muted">{layout === 'wall' ? `Wall covers · ${preferences.wallCoverSize}px` : sideShelf ? `Side rail · ${preferences.shelfWidth}px` : 'Stays visible while you adjust'}</span></div>
    <div className="lounge-settings-live-preview relative h-40 overflow-hidden rounded-xl border border-[rgb(var(--accent)/0.6)]" style={{ backgroundImage: backdrop, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-x-2 top-2 rounded-lg bg-black/40 px-2 py-1 text-[9px] font-bold text-white">Lounge · {layout === 'wall' ? 'Wall' : 'Game browser'}</div>
      {layout === 'wall' ? <div className="absolute inset-x-2 bottom-2 flex flex-wrap items-end justify-center gap-1.5 rounded-lg border border-white/20 bg-black/45 p-2">{[0, 1, 2, 3, 4].map(index => card(index, Math.round(preferences.wallCoverSize / 5)))}</div>
        : <div className="absolute inset-x-2 bottom-2 flex items-end gap-1.5" style={{ flexDirection: preferences.shelfPosition === 'right' ? 'row-reverse' : sideShelf ? 'row' : preferences.shelfPosition === 'top' ? 'column-reverse' : 'column' }}>
          <div className="rounded-lg border border-white/30 bg-black/65 px-2 py-1.5 text-[10px] font-bold text-white" style={{ width: sideShelf ? 'auto' : `${Math.min(90, preferences.previewWidth)}%`, flex: sideShelf ? 1 : undefined, minHeight: Math.min(52, preferences.previewBoxHeight / 5) }}>{game?.name || 'Selected game'}</div>
          <div className="flex rounded-md border border-[rgb(var(--accent)/0.7)] p-1" style={{ width: sideShelf ? Math.round(preferences.shelfWidth / 4) : undefined, flexDirection: sideShelf ? 'column' : 'row', alignItems: 'center', gap: Math.max(2, preferences.gap / 5), backgroundColor: `rgb(var(--panel) / ${preferences.shelfOpacity / 100})` }}>{[0, 1, 2, 3, 4].map(index => card(index, Math.max(9, Math.round(preferences.coverSize / (sideShelf ? 5 : 10)))))}</div>
        </div>}
    </div>
  </div>;
}

export default function LoungeSettingsPanel({ preferences, layout, game, privateGameCount = 0, privateGamesUnlocked = false, onRequestPrivateGames, onLayoutChange, onChange, onClose }) {
  const closeRef = React.useRef(null);
  React.useEffect(() => { closeRef.current?.focus(); }, []);
  const set = patch => onChange(normalizeLoungePreferences({ ...preferences, ...patch, preset: 'custom' }));
  const resetLayout = () => onChange(normalizeLoungePreferences({ ...preferences, ...Object.fromEntries(['preset', 'shelfPosition', 'coverSize', 'coverAspect', 'gap', 'stageHeight', 'shelfWidth', 'wallCoverSize', 'controlSize', 'browseSort'].map(key => [key, DEFAULT_LOUNGE_PREFERENCES[key]])) }));
  return <div role="dialog" aria-modal="true" aria-label="Lounge settings" data-testid="lounge-settings-panel" className="lounge-settings-scrim fixed inset-0 z-[9100] flex justify-end bg-black/75" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="lounge-settings-drawer relative flex h-full w-full max-w-[490px] flex-col overflow-hidden border-l border-[rgb(var(--accent)/0.58)] bg-[rgb(var(--surface))] shadow-[-30px_0_90px_rgb(var(--accent)/0.18)]">
      <header className="lounge-settings-heading relative overflow-hidden border-b border-[rgb(var(--border))] px-6 pb-5 pt-6"><div className="lounge-settings-aura pointer-events-none absolute inset-0" aria-hidden="true" /><div className="relative flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-[rgb(var(--accent-2))]"><SlidersHorizontal size={15} /> Lounge settings</p><h2 className="mt-2 text-3xl font-black">Make it yours</h2><p className="mt-2 max-w-sm text-sm text-muted">Layout, browsing and top shortcuts live here. Sound &amp; Music has its own icon above.</p></div><button ref={closeRef} type="button" data-controller-close onClick={onClose} aria-label="Close Lounge settings" className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.8)] p-2 text-ink"><X size={20} /></button></div></header>
      <LoungeLayoutPreview layout={layout} preferences={preferences} game={game} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
        <nav aria-label="Lounge settings sections" className="sticky top-0 z-20 -mx-6 flex gap-2 overflow-x-auto border-b border-[rgb(var(--border)/0.6)] bg-[rgb(var(--surface)/0.96)] px-6 py-3">{[['layout', 'Layout'], ['browse', 'Browse'], ['shortcuts', 'Shortcuts']].map(([id, label]) => <button key={id} type="button" onClick={() => document.getElementById(`lounge-settings-${id}`)?.scrollIntoView({ block: 'start', behavior: 'auto' })} className="lounge-setting-choice shrink-0 rounded-lg border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-bold">{label}</button>)}</nav>
        <section id="lounge-settings-layout" aria-label="Lounge layouts" className="mt-6 scroll-mt-16">
          <h3 className="text-lg font-black">Layout and navigation</h3>
          <ChoiceRow label="When I enter Lounge" value={preferences.entryScreen} choices={[["games", "Resume last view"], ["home", "Show Lounge Home"]]} onChange={entryScreen => onChange(normalizeLoungePreferences({ ...preferences, entryScreen }))} />
          <p className="mt-2 text-xs text-muted">Lounge stays closed at app startup. Resume remembers your last Zone, filter, console and game; Home opens its guide first.</p>
          <ChoiceRow label="Lounge view" value={layout} choices={[["browser", "Game Browser"], ["wall", "Cover Wall"]]} onChange={onLayoutChange} />
          <ChoiceRow label="Navigation size" value={preferences.controlSize} choices={[["compact", "Compact"], ["comfortable", "Comfortable"], ["large", "Couch-size"]]} onChange={controlSize => set({ controlSize })} />
          {layout === 'browser' && <>
            <ChoiceRow label="Game shelf position" value={preferences.shelfPosition} choices={POSITIONS} onChange={shelfPosition => set({ shelfPosition })} />
            <p className="mt-2 text-xs text-muted">Top and bottom scroll horizontally; left and right vertically. Narrow windows adapt. Ready-made layouts are under Themes → Lounge presets.</p>
            <Range label="Game cover size" value={preferences.coverSize} min={84} max={184} onChange={coverSize => set({ coverSize })} />
            <ChoiceRow label="Carousel card shape" value={preferences.coverAspect} choices={[["portrait", "Portrait cover"], ["tall", "Extra tall"]]} onChange={coverAspect => set({ coverAspect })} />
            <Range label="Hero preview height" value={preferences.stageHeight} min={320} max={760} step={20} onChange={stageHeight => set({ stageHeight })} />
            {['left', 'right'].includes(preferences.shelfPosition) && <><Range label="Side-shelf width" value={preferences.shelfWidth} min={156} max={320} step={4} onChange={shelfWidth => set({ shelfWidth })} /><p className="mt-1 text-xs text-muted">Width of the vertical game rail. Covers fit inside it; top and bottom shelves do not use this setting.</p></>}
          </>}
          {layout === 'wall' && <><Range label="Wall cover width" value={preferences.wallCoverSize} min={170} max={320} step={10} onChange={wallCoverSize => set({ wallCoverSize })} /><p className="mt-1 text-xs text-muted">Actual width of each Wall cover. The number of columns adapts to the available screen width.</p></>}
          <Range label="Space between games" value={preferences.gap} min={8} max={28} onChange={gap => set({ gap })} />
        </section>
        <section id="lounge-settings-browse" aria-label="Lounge browsing" className="mt-7 scroll-mt-16 border-t border-[rgb(var(--border)/0.7)] pt-5"><h3 className="text-lg font-black">Browsing</h3><ChoiceRow label="Sort All games and Favorites" value={preferences.browseSort} choices={BROWSE_SORTS} onChange={browseSort => onChange(normalizeLoungePreferences({ ...preferences, browseSort }))} /><p className="mt-2 text-xs text-muted">Filtered views keep their own order. Games without a played or added date stay last.</p><BrowseBarPicker hidden={preferences.hiddenBrowseFilters} onChange={hiddenBrowseFilters => onChange(normalizeLoungePreferences({ ...preferences, hiddenBrowseFilters }))} />
          <div className="mt-5 rounded-2xl border border-[rgb(var(--accent)/0.4)] bg-[rgb(var(--panel)/0.42)] p-4"><h4 className="text-sm font-black">Private games in Lounge</h4><p className="mt-1 text-xs text-muted">Keep games from private categories hidden, or reveal them here after their category PINs are unlocked for this session.</p>{privateGameCount ? <button type="button" role="switch" aria-checked={preferences.showPrivateGamesInLounge && privateGamesUnlocked} onClick={() => { if (preferences.showPrivateGamesInLounge && privateGamesUnlocked) onChange(normalizeLoungePreferences({ ...preferences, showPrivateGamesInLounge: false })); else if (privateGamesUnlocked) onChange(normalizeLoungePreferences({ ...preferences, showPrivateGamesInLounge: true })); else onRequestPrivateGames?.(); }} className={`lounge-setting-choice mt-3 flex min-h-11 w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-bold ${preferences.showPrivateGamesInLounge && privateGamesUnlocked ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.48)]'}`}><span>{preferences.showPrivateGamesInLounge && privateGamesUnlocked ? 'Shown in Lounge' : privateGamesUnlocked ? 'Hidden in Lounge' : 'Unlock private categories'}</span><span className="text-[10px] uppercase tracking-wide">{privateGamesUnlocked ? (preferences.showPrivateGamesInLounge ? 'Shown' : 'Hidden') : 'PIN required'}</span></button> : <p className="mt-3 text-xs text-muted">No private categories are configured.</p>}</div>
        </section>
        <QuickLinkPicker value={preferences.quickLinks} onChange={quickLinks => onChange(normalizeLoungePreferences({ ...preferences, quickLinks }))} />
        <button type="button" onClick={resetLayout} className="mt-7 inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.6)] px-4 py-2.5 text-sm font-bold text-ink"><RotateCcw size={16} /> Reset Lounge layout</button>
      </div>
    </aside>
  </div>;
}
