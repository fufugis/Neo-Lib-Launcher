import React from 'react';
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { DEFAULT_LOUNGE_PREFERENCES, LOUNGE_BROWSE_BAR_FILTERS, LOUNGE_QUICK_LINKS, loungeBackgroundMediaKind, normalizeLoungePreferences } from './lounge-layout-model.mjs';
import useDraggablePanel from './use-draggable-panel';
import { BUILTIN_HOME_WIDGETS } from '../home/home-widget-registry.mjs';
import { loungePanelPositions, loungePanelRects, loungeWidgetHeightBounds, loungePanelClearance } from './lounge-widget-layout.mjs';
import LoungePanelPreview from './LoungePanelPreview';

const POSITIONS = [['bottom', 'Bottom'], ['top', 'Top'], ['left', 'Left'], ['right', 'Right']];
const BROWSE_SORTS = [['library', 'Library order'], ['name', 'Name A–Z'], ['last-played', 'Last played'], ['recently-added', 'Recently added']];

function ChoiceRow({ label, value, choices, onChange }) {
  return <fieldset className="mt-5"><legend className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-muted">{label}</legend><div className="flex flex-wrap gap-2">{choices.map(([id, text]) => <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)} className={`lounge-setting-choice rounded-xl border px-3 py-2 text-sm font-bold ${value === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.2)] text-ink' : 'border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.48)] text-muted'}`}>{text}</button>)}</div></fieldset>;
}

const VIEWING_DISTANCES = [
  ['compact', 'Near · desk', '48px top buttons · 36px filter strip', 'Top actions are icons first; filter names stay visible.'],
  ['comfortable', 'Medium · sofa', '66 × 72px top buttons · 42px filter strip', 'Names remain visible for quick reading.'],
  ['large', 'Far · across room', '96 × 96px top buttons · 48px filter strip', 'Larger icons and targets, plus roomier popups with slightly bigger text.'],
];

function ViewingDistancePicker({ value, onChange }) {
  return <fieldset className="mt-5"><legend className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-muted">Viewing distance</legend><p className="mb-3 text-xs text-muted">Concrete sizes for Lounge navigation, filters and console tabs. Preview text and game covers have their own size controls.</p><div className="grid gap-2">{VIEWING_DISTANCES.map(([id, label, dimensions, note]) => <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)} className={`lounge-setting-choice flex min-h-16 items-center gap-3 rounded-xl border px-4 py-3 text-left ${value === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.2)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.48)]'}`}><span aria-hidden="true" className={`shrink-0 rounded-md border-2 border-[rgb(var(--accent))] ${id === 'compact' ? 'h-5 w-5' : id === 'comfortable' ? 'h-7 w-7' : 'h-9 w-9'}`} /><span><strong className="block text-sm">{label}</strong><span className="block text-xs text-[rgb(var(--accent-2))]">{dimensions}</span><small className="block text-xs text-muted">{note}</small></span></button>)}</div></fieldset>;
}

function Range({ label, value, min, max, step = 1, unit = 'px', onChange, disabled = false }) {
  const id = `lounge-range-${label.replaceAll(' ', '-')}`;
  return <div className="mt-4 text-sm"><div className="mb-2 flex justify-between gap-3"><label htmlFor={id} className="font-semibold">{label}</label><b className="text-[rgb(var(--accent-2))]">{value}{unit}</b></div><div className="flex items-center gap-3"><button type="button" aria-label={`Decrease ${label}`} disabled={disabled || value <= min} onClick={() => onChange(Math.max(min, value - step))} className="lounge-setting-choice rounded-lg border border-[rgb(var(--border))] px-2.5 py-1 font-bold disabled:opacity-40">−</button><input id={id} type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={event => onChange(Number(event.target.value))} className="min-w-0 flex-1 accent-[rgb(var(--accent))]" /><button type="button" aria-label={`Increase ${label}`} disabled={disabled || value >= max} onClick={() => onChange(Math.min(max, value + step))} className="lounge-setting-choice rounded-lg border border-[rgb(var(--border))] px-2.5 py-1 font-bold disabled:opacity-40">+</button></div></div>;
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
  const videoBackground = preferences.backdropMode === 'image' && loungeBackgroundMediaKind(preferences.backgroundUrl) === 'video';
  const chosenBackground = preferences.backdropMode === 'image' ? preferences.backgroundUrl : '';
  const backdrop = chosenBackground && !videoBackground
    ? `linear-gradient(90deg, rgb(4 9 22 / 0.88), rgb(4 9 22 / 0.16)), url(${JSON.stringify(chosenBackground)})`
    : game?.headerImage
    ? `linear-gradient(90deg, rgb(4 9 22 / 0.9), rgb(4 9 22 / 0.15)), url(${JSON.stringify(game.headerImage)})`
    : 'linear-gradient(140deg, rgb(var(--grad-1)), rgb(var(--grad-2)))';
  const card = (index, size) => <i key={index} className="block shrink-0 rounded-sm border border-white/30 bg-[rgb(var(--accent)/0.7)]" style={{ width: size, height: sideShelf && layout === 'browser' ? 25 : Math.round(size * (preferences.coverAspect === 'tall' && layout === 'browser' ? 1.65 : 1.5)), opacity: index === 2 ? 1 : 0.6, transform: index === 2 ? `scale(${preferences.selectedGameScale / 100})` : undefined }} />;
  return <div data-testid="lounge-settings-preview" className="shrink-0 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-6 py-4">
    <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--accent-2))]">Live layout preview</span><span className="text-[10px] font-bold text-muted">{layout === 'wall' ? `Wall covers · ${preferences.wallCoverSize}px` : sideShelf ? `Side rail · ${preferences.shelfWidth}px` : 'Stays visible while you adjust'}</span></div>
    <div className="lounge-settings-live-preview relative h-52 overflow-hidden rounded-xl border border-[rgb(var(--accent)/0.6)] sm:h-56" data-lounge-preview-layout={preferences.shelfPosition} style={{ backgroundImage: backdrop, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {videoBackground && <video src={chosenBackground} muted loop playsInline autoPlay={preferences.motion !== 'off' && preferences.ambientMotion !== 'still' && preferences.backgroundMotion > 0 && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches} preload="metadata" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-x-2 top-2 rounded-lg bg-black/40 px-2 py-1 text-[9px] font-bold text-white">Lounge · {layout === 'wall' ? 'Wall' : 'Game browser'}</div>
      {layout === 'wall' ? <div className="absolute inset-x-2 bottom-2 flex flex-wrap items-end justify-center gap-1.5 rounded-lg border border-white/20 bg-black/45 p-2">{[0, 1, 2, 3, 4].map(index => card(index, Math.round(preferences.wallCoverSize / 5)))}</div>
        : <div className="absolute inset-x-2 bottom-2 top-10 flex min-h-0 gap-1.5" style={{ flexDirection: sideShelf ? (preferences.shelfPosition === 'left' ? 'row-reverse' : 'row') : preferences.shelfPosition === 'top' ? 'column-reverse' : 'column' }}>
          <LoungePanelPreview preferences={preferences}><div className="min-w-0 max-w-full rounded-lg border border-white/30 px-2 py-1.5 text-[10px] font-bold text-white" style={{ width: `${Math.min(100, preferences.previewWidth)}%`, height: Math.min(78, Math.max(44, preferences.previewBoxHeight / 5)), borderRadius: preferences.previewCornerRadius / 2, backgroundColor: `rgb(var(--panel) / ${preferences.previewPanelOpacity / 100})` }}>{game?.name || 'Selected game'}{preferences.previewShowDescription && <span className="mt-1 block truncate text-[8px] font-normal text-white/75">Preview description and game details</span>}</div></LoungePanelPreview>
          <div className="flex shrink-0 items-center justify-center rounded-md border border-[rgb(var(--accent)/0.7)] p-1" style={{ width: sideShelf ? `${Math.max(18, Math.min(30, preferences.shelfWidth / 12))}%` : '100%', height: sideShelf ? '100%' : '27%', flexDirection: sideShelf ? 'column' : 'row', alignItems: 'center', gap: Math.max(2, preferences.gap / 5), backgroundColor: `rgb(var(--panel) / ${preferences.shelfOpacity / 100})` }}>{[0, 1, 2, 3, 4].map(index => card(index, Math.max(9, Math.round(preferences.coverSize / (sideShelf ? 5 : 10)))))}</div>
        </div>}
    </div>
  </div>;
}

export default function LoungeSettingsPanel({ preferences, panelShelfPosition = preferences.shelfPosition, layout, game, privateGameCount = 0, privateGamesUnlocked = false, onRequestPrivateGames, onLayoutChange, onChange, onClose }) {
  const [sceneSize, setSceneSize] = React.useState({ width: window.innerWidth, height: window.innerHeight });
  React.useLayoutEffect(() => {
    const host = document.querySelector('[data-testid="lounge-widget-composition"]');
    if (!host) return;
    const sync = () => setSceneSize({ width: host.clientWidth, height: host.clientHeight, obstacles: JSON.parse(host.dataset.cardClearance || '[]'), widgetTop: Number(host.dataset.widgetTop ?? 16) });
    sync();
    const observer = new ResizeObserver(sync); observer.observe(host);
    const attributes = new MutationObserver(sync); attributes.observe(host, { attributes: true, attributeFilter: ['data-card-clearance', 'data-widget-top'] });
    return () => { observer.disconnect(); attributes.disconnect(); };
  }, [preferences.widgetAreaEnabled, panelShelfPosition]);
  const widgetLayout = { ...preferences, shelfPosition: panelShelfPosition };
  const panelRects = loungePanelRects(sceneSize.width, sceneSize.height, widgetLayout, sceneSize.obstacles, sceneSize.widgetTop);
  const widgetCeiling = loungePanelClearance(sceneSize.height, panelRects.widgets || panelRects.hero, sceneSize.obstacles);
  const widgetHeightMax = Math.max(1, loungeWidgetHeightBounds(widgetCeiling, widgetLayout, panelRects.hero, sceneSize.widgetTop).height);
  const widgetHeightPercent = Math.min(100, Math.round(preferences.widgetHeight / widgetHeightMax * 100));
  const closeRef = React.useRef(null);
  const draggable = useDraggablePanel();
  React.useEffect(() => { closeRef.current?.focus(); }, []);
  const set = patch => onChange(normalizeLoungePreferences({ ...preferences, ...patch, preset: 'custom' }));
  const resetLayout = () => onChange(normalizeLoungePreferences({ ...preferences, ...Object.fromEntries(['preset', 'shelfPosition', 'coverSize', 'selectedGameScale', 'carouselShowTitles', 'coverAspect', 'gap', 'stageHeight', 'shelfWidth', 'wallCoverSize', 'emulatorSize', 'emulatorCarouselWidth', 'controlSize', 'browseSort'].map(key => [key, DEFAULT_LOUNGE_PREFERENCES[key]])) }));
  return <div role="dialog" aria-modal="true" aria-label="Lounge settings" data-testid="lounge-settings-panel" className="lounge-settings-scrim fixed inset-0 z-[9100] flex items-center justify-center bg-black/75 p-3" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
<aside ref={draggable.panelRef} style={draggable.panelStyle} className="lounge-settings-drawer relative flex h-[min(94vh,1040px)] w-full max-w-[700px] flex-col overflow-hidden rounded-2xl border border-[rgb(var(--accent)/0.58)] bg-[rgb(var(--surface))] shadow-[0_28px_90px_rgb(var(--accent)/0.18)]">
      <header {...draggable.dragHandleProps} className="lounge-settings-heading relative overflow-hidden border-b border-[rgb(var(--border))] px-6 pb-5 pt-6"><div className="lounge-settings-aura pointer-events-none absolute inset-0" aria-hidden="true" /><div className="relative flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-[rgb(var(--accent-2))]"><SlidersHorizontal size={15} /> Lounge settings</p><h2 className="mt-2 text-3xl font-black">Make it yours</h2><p className="mt-2 max-w-lg text-sm text-muted">Layout, browsing and top shortcuts live here. Sound &amp; Music has its own icon above.</p></div><button ref={closeRef} type="button" data-controller-close onClick={onClose} aria-label="Close Lounge settings" className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.8)] p-2 text-ink"><X size={20} /></button></div></header>
      <LoungeLayoutPreview layout={layout} preferences={preferences} game={game} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
        <nav aria-label="Lounge settings sections" className="sticky top-0 z-20 -mx-6 flex gap-2 overflow-x-auto border-b border-[rgb(var(--border)/0.6)] bg-[rgb(var(--surface)/0.96)] px-6 py-3">{[['layout', 'Layout'], ['browse', 'Browse'], ['widgets', 'Widgets'], ['shortcuts', 'Shortcuts']].map(([id, label]) => <button key={id} type="button" onClick={() => document.getElementById(`lounge-settings-${id}`)?.scrollIntoView({ block: 'start', behavior: 'auto' })} className="lounge-setting-choice shrink-0 rounded-lg border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-bold">{label}</button>)}</nav>
        <section id="lounge-settings-layout" aria-label="Lounge layouts" className="mt-6 scroll-mt-16">
          <h3 className="text-lg font-black">Layout and navigation</h3>
          <ChoiceRow label="When I enter Lounge" value={preferences.entryScreen} choices={[["games", "Resume last view"], ["home", "Show Lounge Home"]]} onChange={entryScreen => onChange(normalizeLoungePreferences({ ...preferences, entryScreen }))} />
          <p className="mt-2 text-xs text-muted">Lounge stays closed at app startup. Resume remembers your last Zone, filter, console and game; Home opens its guide first.</p>
          <ChoiceRow label="Lounge view" value={layout} choices={[["browser", "Game Browser"], ["wall", "Cover Wall"]]} onChange={onLayoutChange} />
          <ViewingDistancePicker value={preferences.controlSize} onChange={controlSize => set({ controlSize })} />
          {layout === 'browser' && <>
            <ChoiceRow label="Game shelf position" value={preferences.shelfPosition} choices={POSITIONS} onChange={shelfPosition => set({ shelfPosition })} />
            <p className="mt-2 text-xs text-muted">Top and bottom scroll horizontally; left and right vertically. Narrow windows adapt. Ready-made layouts are under Themes → Lounge presets.</p>
            <Range label="Game cover size" value={preferences.coverSize} min={84} max={184} onChange={coverSize => set({ coverSize })} />
            <ChoiceRow label="Carousel game titles" value={preferences.carouselShowTitles} choices={[[true, 'Show titles'], [false, 'Artwork only']]} onChange={carouselShowTitles => set({ carouselShowTitles })} />
            <p className="mt-1 text-xs text-muted">The bottom edge stays anchored. Showing titles lifts the artwork to make room below it.</p>
            <Range label="Emulators Size" value={preferences.emulatorSize} min={70} max={150} step={5} unit="%" onChange={emulatorSize => set({ emulatorSize })} />
            <Range label="Emulator carousel width" value={preferences.emulatorCarouselWidth} min={800} max={2400} step={50} onChange={emulatorCarouselWidth => set({ emulatorCarouselWidth })} />
            <p className="mt-1 text-xs text-muted">Only changes the console row in Emulator Zone. Wider rows fit more consoles; larger consoles fit fewer. The selected console stays centered.</p>
            <Range label="Selected game size" value={preferences.selectedGameScale} min={100} max={200} step={5} unit="%" onChange={selectedGameScale => set({ selectedGameScale })} />
            <p className="mt-1 text-xs text-muted">Scales the selected carousel cover relative to the others.</p>
            <ChoiceRow label="Carousel card shape" value={preferences.coverAspect} choices={[["portrait", "Portrait cover"], ["tall", "Extra tall"]]} onChange={coverAspect => set({ coverAspect })} />
            {['left', 'right'].includes(preferences.shelfPosition) && <><Range label="Side-shelf width" value={preferences.shelfWidth} min={156} max={320} step={4} onChange={shelfWidth => set({ shelfWidth })} /><p className="mt-1 text-xs text-muted">Width of the vertical game rail. Covers fit inside it; top and bottom shelves do not use this setting.</p></>}
          </>}
          {layout === 'wall' && <><Range label="Wall cover width" value={preferences.wallCoverSize} min={170} max={320} step={10} onChange={wallCoverSize => set({ wallCoverSize })} /><p className="mt-1 text-xs text-muted">Actual width of each Wall cover. The number of columns adapts to the available screen width.</p></>}
          <Range label="Space between games" value={preferences.gap} min={8} max={28} onChange={gap => set({ gap })} />
        </section>
        <section id="lounge-settings-browse" aria-label="Lounge browsing" className="mt-7 scroll-mt-16 border-t border-[rgb(var(--border)/0.7)] pt-5"><h3 className="text-lg font-black">Browsing</h3><ChoiceRow label="Sort All games and Favorites" value={preferences.browseSort} choices={BROWSE_SORTS} onChange={browseSort => onChange(normalizeLoungePreferences({ ...preferences, browseSort }))} /><p className="mt-2 text-xs text-muted">Filtered views keep their own order. Games without a played or added date stay last.</p><BrowseBarPicker hidden={preferences.hiddenBrowseFilters} onChange={hiddenBrowseFilters => onChange(normalizeLoungePreferences({ ...preferences, hiddenBrowseFilters }))} />
          <div className="mt-5 rounded-2xl border border-[rgb(var(--accent)/0.4)] bg-[rgb(var(--panel)/0.42)] p-4"><h4 className="text-sm font-black">Private games in Lounge</h4><p className="mt-1 text-xs text-muted">Keep games from private categories hidden, or reveal them here after their category PINs are unlocked for this session.</p>{privateGameCount ? <button type="button" role="switch" aria-checked={preferences.showPrivateGamesInLounge && privateGamesUnlocked} onClick={() => { if (preferences.showPrivateGamesInLounge && privateGamesUnlocked) onChange(normalizeLoungePreferences({ ...preferences, showPrivateGamesInLounge: false })); else if (privateGamesUnlocked) onChange(normalizeLoungePreferences({ ...preferences, showPrivateGamesInLounge: true })); else onRequestPrivateGames?.(); }} className={`lounge-setting-choice mt-3 flex min-h-11 w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-bold ${preferences.showPrivateGamesInLounge && privateGamesUnlocked ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.48)]'}`}><span>{preferences.showPrivateGamesInLounge && privateGamesUnlocked ? 'Shown in Lounge' : privateGamesUnlocked ? 'Hidden in Lounge' : 'Unlock private categories'}</span><span className="text-[10px] uppercase tracking-wide">{privateGamesUnlocked ? (preferences.showPrivateGamesInLounge ? 'Shown' : 'Hidden') : 'PIN required'}</span></button> : <p className="mt-3 text-xs text-muted">No private categories are configured.</p>}</div>
        </section>
        <section id="lounge-settings-widgets" aria-label="Lounge widget area settings" className="mt-7 scroll-mt-16 border-t border-[rgb(var(--border)/0.7)] pt-5">
          <h3 className="text-lg font-black">Home widgets in Lounge</h3>
          <p className="mt-2 text-xs text-muted">Import up to four of the built-in Home widgets into Game Browser. They use your library, not copies of its data. Each fits its own tile; overflowing content remains scrollable. Desktop Home is unchanged.</p>
          <ChoiceRow label="Widget area" value={preferences.widgetAreaEnabled ? 'on' : 'off'} choices={[["off", "Off"], ["on", "On"]]} onChange={value => set({ widgetAreaEnabled: value === 'on' })} />
          <ChoiceRow label="Description placement" value={preferences.previewPosition} choices={loungePanelPositions(panelShelfPosition).map(id => [id, id.replace('center', 'middle').replace('-', ' ')])} onChange={previewPosition => set({ previewPosition })} />
          <ChoiceRow label="Widget placement" value={preferences.widgetPosition} choices={loungePanelPositions(panelShelfPosition).filter(id => id !== preferences.previewPosition).map(id => [id, id.replace('center', 'middle').replace('-', ' ')])} onChange={widgetPosition => set({ widgetPosition })} />
          <p className="mt-2 text-xs text-muted">The description's slot is unavailable for widgets. Side-mounted game shelves unlock bottom slots; Emulator Zone uses a bottom shelf. Sizes stop at the available space to keep controls and games clear.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">{BUILTIN_HOME_WIDGETS.map(widget => { const chosen = preferences.widgetIds.includes(widget.id); return <button key={widget.id} type="button" aria-pressed={chosen} disabled={!chosen && preferences.widgetIds.length >= 4} onClick={() => set({ widgetIds: chosen ? preferences.widgetIds.filter(id => id !== widget.id) : [...preferences.widgetIds, widget.id] })} className={`lounge-setting-choice rounded-xl border px-3 py-2 text-left text-xs font-bold disabled:opacity-40 ${chosen ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}><span className="block">{chosen ? '✓ ' : '+ '}{widget.label}</span><small className="mt-1 block font-normal text-muted">{widget.description}</small></button>; })}</div>
          <Range label="Widget box width" value={preferences.widgetWidth} min={20} max={100} unit="%" onChange={widgetWidth => set({ widgetWidth })} />
          <Range label="Global widget zoom" value={preferences.widgetZoom} min={75} max={200} step={5} unit="%" onChange={widgetZoom => set({ widgetZoom })} />
          <p className="mt-1 text-xs text-muted">Scales text, artwork and controls together in every imported widget. 100% is normal size; the outer box stays in place and content remains scrollable.</p>
          <Range label="Widget box height" value={widgetHeightPercent} min={Math.min(100, Math.ceil(160 / widgetHeightMax * 100))} max={100} unit="%" onChange={percent => set({ widgetHeight: Math.max(160, Math.round(widgetHeightMax * percent / 100)) })} />
          <p className="mt-1 text-xs text-muted">At maximum, widgets fill the free area beside the description and above the visible cards. Only screen edges, the description and carousel limit growth.</p>
          <Range label="Widget vertical position" value={Math.round((300 - preferences.widgetVerticalOffset) / 6)} min={0} max={100} unit="%" disabled={preferences.widgetHeight >= widgetHeightMax} onChange={percent => set({ widgetVerticalOffset: 300 - percent * 6 })} />
          <p className="mt-1 text-xs text-muted">0% reaches the highest clear space below the top controls; 100% is the bottom. {preferences.widgetHeight >= widgetHeightMax ? 'The box fills the available height. Reduce its height to move it vertically.' : 'Position spans all remaining free space, including empty space beside browsing controls.'}</p>
          <ChoiceRow label="Holding box" value={preferences.widgetShowBox ? 'on' : 'off'} choices={[["on", "Show box"], ["off", "Integrated / no box"]]} onChange={value => set({ widgetShowBox: value === 'on' })} />
          <Range label="Hero and widget opacity" value={preferences.previewPanelOpacity} min={20} max={100} unit="%" onChange={previewPanelOpacity => set({ previewPanelOpacity })} />
        </section>
        <QuickLinkPicker value={preferences.quickLinks} onChange={quickLinks => onChange(normalizeLoungePreferences({ ...preferences, quickLinks }))} />
        <button type="button" onClick={resetLayout} className="mt-7 inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.6)] px-4 py-2.5 text-sm font-bold text-ink"><RotateCcw size={16} /> Reset Lounge layout</button>
      </div>
    </aside>
  </div>;
}
