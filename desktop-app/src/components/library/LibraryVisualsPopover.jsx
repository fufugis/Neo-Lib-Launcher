import React from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Bug, GripVertical, Lightbulb, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { renderForegroundPortal } from '../ui/VisualBoundary';
import { LIBRARY_FONT_OPTIONS } from './library-visual-model.mjs';

/* Library visuals popover owns only presentation controls; Sidebar supplies all state. */
export default function LibraryVisualsPopover({
  anchorEl,
  sidebarWidth = 320,
  rowSize = 44, catTextSize = 11, catGlow = 40, iconPosition = 'left',
  rowGap = 2, catGap = 8, catTopGap = 4, categoryMarkerMode = 'dot',
  showSubcatStrip = true, nameTextSize = null,
  libraryFont = 'system', libraryFontWeight = 'regular', libraryFontCursive = false,
  effectsLevel = 2, currentTheme = 'synthwave', motionCadence = 'full',
  bgTextureId = 'none', bgTextureOpacity = 12,
  cursorTheme = 'windows',
  onChangeRowSize, onChangeCatTextSize, onChangeCatGlow, onChangeIconPosition,
  onChangeRowGap, onChangeCatGap, onChangeCatTopGap, onChangeCategoryMarkerMode,
  onToggleSubcatStrip, onChangeNameTextSize,
  onChangeLibraryFont, onChangeLibraryFontWeight, onChangeLibraryFontCursive,
  onChangeEffectsLevel, onChangeMotionCadence,
  onChangeBgTextureId, onChangeBgTextureOpacity,
  onChangeCursorTheme,
  onOpenFeedback,
  twoRow = false, onToggleTwoRow,
  libraryIconMode = false, libraryIconSize = 48, libraryIconSpacing = 8, libraryIconRows = 3,
  onToggleLibraryIconMode, onChangeLibraryIconSize, onChangeLibraryIconSpacing, onChangeLibraryIconRows,
  onClose,
}) {
  const ref = React.useRef(null);
  const dragControls = useDragControls();
  // Visuals now has three deliberate control lanes on a desktop-sized window.
  // Keep its dimensions in one place so anchoring and drag bounds agree.
  const availableRight = Math.max(0, window.innerWidth - sidebarWidth - 24);
  const opensBesideLibrary = availableRight >= 300;
  const popoverWidth = Math.min(960, Math.max(280, opensBesideLibrary ? availableRight : window.innerWidth - 32));
  const clampPopoverPosition = (top, left) => ({
    top: Math.max(12, Math.min(top, window.innerHeight - 116)),
    left: Math.max(12, Math.min(left, window.innerWidth - popoverWidth - 12)),
  });
  // Anchor the popover to the trigger button's rect (portaled to body so no
  // parent stacking context can hide it under the game preview).
  const [pos, setPos] = React.useState(() => {
    const anchorTop = anchorEl ? anchorEl.getBoundingClientRect().bottom + 6 : 80;
    return clampPopoverPosition(anchorTop, opensBesideLibrary ? sidebarWidth + 12 : 12);
  });
  React.useEffect(() => {
    const anchorTop = anchorEl ? anchorEl.getBoundingClientRect().bottom + 6 : 80;
    setPos(clampPopoverPosition(anchorTop, opensBesideLibrary ? sidebarWidth + 12 : 12));
  }, [anchorEl, sidebarWidth, opensBesideLibrary, popoverWidth]);
  React.useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)
        && (!anchorEl || !anchorEl.contains(e.target))) onClose();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose, anchorEl]);
  const dragBounds = {
    left: Math.min(0, 12 - pos.left),
    right: Math.max(0, window.innerWidth - pos.left - popoverWidth - 12),
    top: Math.min(0, 12 - pos.top),
    bottom: Math.max(0, window.innerHeight - pos.top - 96),
  };
  const body = (
    <motion.div
      ref={ref}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={dragBounds}
      initial={{ opacity: 0, y: -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ duration: 0.14 }}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        // Opaque backdrop so the popover reads clearly whether it's over the
        // sidebar (which has its own glass) or over the game preview area
        // (which doesn't). No transparency at all here — this is a tool panel.
        backgroundColor: 'rgb(var(--surface))',
        width: popoverWidth,
      }}
      className="z-[9999] max-w-[calc(100vw-32px)] max-h-[80vh] overflow-y-auto rounded-lg hairline shadow-2xl p-3"
      data-testid="library-settings-popover"
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-move -mt-1 -mx-1 mb-2 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-[rgb(var(--accent))] flex items-center gap-1.5 select-none border-b border-[rgb(var(--border))]/60 font-bold"
        title="Drag to move"
      >
        <GripVertical size={10} /> Visuals
      </div>
      {/* Three clear lanes replace the tall masonry list. The solid heading on
          each group makes the current control family obvious at a glance. */}
      <div className="visuals-grid">
      <div className="space-y-3">
        <VisualGroup title="Library view">
          <div className="grid grid-cols-2 gap-1" data-testid="pop-library-view-mode">
            {[
              { active: !libraryIconMode, label: 'Standard' },
              { active: libraryIconMode, label: 'Icons only' },
            ].map((option) => (
              <button
                type="button"
                key={option.label}
                onClick={() => onToggleLibraryIconMode?.(option.label === 'Icons only')}
                className={cn('rounded-md hairline py-1.5 text-[11px] font-bold transition-colors', option.active ? 'border-[rgb(var(--accent)/0.7)] bg-[rgb(var(--accent)/0.12)] text-ink' : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.4)]')}
              >
                {option.label}
              </button>
            ))}
          </div>
          <fieldset disabled={!libraryIconMode} className={cn('space-y-2 transition-opacity', !libraryIconMode && 'opacity-35 grayscale')} data-testid="pop-icon-mode-controls">
            <PopSlider label="Icon size" value={libraryIconSize} min={24} max={96} suffix="px" onChange={onChangeLibraryIconSize} testid="pop-library-icon-size" />
            <PopSlider label="Icon spacing" value={libraryIconSpacing} min={0} max={24} suffix="px" onChange={onChangeLibraryIconSpacing} testid="pop-library-icon-spacing" />
            <DiscretePopSlider label="Icon rows" labels={['1', '2', '3']} value={Math.max(0, Math.min(2, Number(libraryIconRows || 1) - 1))} onChange={(value) => onChangeLibraryIconRows?.(value + 1)} testid="pop-library-icon-rows" />
          </fieldset>
        </VisualGroup>
        <fieldset disabled={libraryIconMode} className={cn('space-y-3 transition-opacity', libraryIconMode && 'opacity-35 grayscale')} data-testid="pop-standard-library-controls">
        <VisualGroup title="Object sizes">
        <PopSlider
          label="Row size"
          value={rowSize}
          min={22}
          max={80}
          suffix="px"
          onChange={onChangeRowSize}
          testid="pop-row-size"
        />
        <PopSlider label="Spacing between games" value={rowGap} min={-8} max={16} suffix="px" onChange={onChangeRowGap} testid="pop-row-gap" />
        <PopSlider label="Spacing under category header" value={catGap} min={-6} max={32} suffix="px" onChange={onChangeCatGap} testid="pop-cat-gap" />
        <PopSlider label="Gap between header & first game" value={catTopGap} min={0} max={24} suffix="px" onChange={onChangeCatTopGap} testid="pop-cat-top-gap" />
        <DiscretePopSlider label="Icon position" labels={['Left', 'Right', 'None']} value={['left', 'right', 'none'].indexOf(iconPosition)} onChange={(value) => onChangeIconPosition?.(['left', 'right', 'none'][value])} testid="pop-icon-position" />
        </VisualGroup>
        <VisualGroup title="Layout">
          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted">Column layout</div>
            <div className="grid grid-cols-2 gap-1">
              {[
                { key: false, label: 'Single' },
                { key: true, label: 'Two columns' },
              ].map((opt) => (
                <button
                  key={String(opt.key)}
                  data-testid={`pop-two-row-${opt.key ? 'two' : 'one'}`}
                  onClick={() => onToggleTwoRow && onToggleTwoRow(opt.key)}
                  className={cn(
                    'rounded-md hairline py-1.5 text-[11px] transition-colors',
                    !!twoRow === opt.key
                      ? 'border-[rgb(var(--accent)/0.7)] bg-[rgb(var(--accent)/0.12)] text-ink'
                      : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.4)]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </VisualGroup>
        </fieldset>
      </div>

      <div className="space-y-3">
      <fieldset disabled={libraryIconMode} className={cn('transition-opacity', libraryIconMode && 'opacity-35 grayscale')} data-testid="pop-text-category-controls">
      <VisualGroup title="Text & category">
      <PopSlider
        label="Game name text size"
        value={Number.isFinite(nameTextSize) ? nameTextSize : Math.max(11, Math.min(16, Math.round(rowSize * 0.28)))}
        min={9}
        max={22}
        suffix="px"
        onChange={onChangeNameTextSize}
        testid="pop-name-text-size"
      />
      <div className="rounded-md hairline bg-panel/40 p-2.5" data-testid="library-font-controls">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">Library font only</div>
        <p className="mb-2 text-[9.5px] leading-relaxed text-muted">Changes only Library game and category names. Home, Preview, Tools, and Settings keep their current type.</p>
        <DiscretePopSlider label="Font" labels={LIBRARY_FONT_OPTIONS.map((font) => font.label)} value={Math.max(0, LIBRARY_FONT_OPTIONS.findIndex((font) => font.id === libraryFont))} onChange={(value) => onChangeLibraryFont?.(LIBRARY_FONT_OPTIONS[value]?.id || 'system')} testid="pop-library-font" />
        <div className="mt-2 grid grid-cols-2 gap-1">
          <button type="button" onClick={() => onChangeLibraryFontWeight?.(libraryFontWeight === 'fat' ? 'regular' : 'fat')} className={cn('rounded-md hairline px-2 py-1.5 text-[10px] font-bold transition-colors', libraryFontWeight === 'fat' ? 'border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--accent)/0.12)] text-ink' : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.4)]')} data-testid="pop-library-font-fat">Fat</button>
          <button type="button" onClick={() => onChangeLibraryFontCursive?.(!libraryFontCursive)} className={cn('rounded-md hairline px-2 py-1.5 text-[10px] font-bold transition-colors', libraryFontCursive ? 'border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--accent)/0.12)] text-ink' : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.4)]')} style={{ fontStyle: 'italic' }} data-testid="pop-library-font-cursive">Cursive</button>
        </div>
      </div>
      <PopSlider
        label="Category text size"
        value={catTextSize}
        min={6}
        max={18}
        suffix="px"
        onChange={onChangeCatTextSize}
        testid="pop-cat-text-size"
      />
      <DiscretePopSlider label="Category marker" labels={['Dot', 'Backdrop', 'None']} value={['dot', 'background', 'none'].indexOf(categoryMarkerMode)} onChange={(value) => onChangeCategoryMarkerMode?.(['dot', 'background', 'none'][value])} testid="pop-category-marker" />
      <button data-testid="pop-toggle-subcat-strip" onClick={() => onToggleSubcatStrip && onToggleSubcatStrip(!showSubcatStrip)} className={cn('flex w-full items-center justify-between rounded-md hairline px-2.5 py-2 text-[11px] transition-colors', showSubcatStrip ? 'border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--accent)/0.08)] text-ink' : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.4)]')} title="Toggle the genre/playtime strip shown under each game name"><span>Sub-category strip</span><span className="text-[10px] uppercase tracking-wider">{showSubcatStrip ? 'shown' : 'hidden'}</span></button>
      </VisualGroup>
      </fieldset>
      </div>

      <div className="space-y-3">
      <VisualGroup title="FX">
      <fieldset disabled={libraryIconMode} className={cn('transition-opacity', libraryIconMode && 'opacity-35 grayscale')}>
      <PopSlider
        label="Category glow"
        value={catGlow}
        min={0}
        max={300}
        suffix="%"
        onChange={onChangeCatGlow}
        testid="pop-cat-glow"
      />
      </fieldset>
      <div className="rounded-md hairline bg-panel/40 p-2.5" data-testid="visual-performance-controls"><EffectsPopSlider theme={currentTheme} value={effectsLevel} onChange={onChangeEffectsLevel} /><div className="my-2 border-t border-[rgb(var(--border))]/70" /><MotionCadenceSlider value={motionCadence} onChange={onChangeMotionCadence} /><p className="mt-2 rounded-md border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.06)] px-2 py-1.5 text-[10px] leading-relaxed text-muted"><b className="text-ink">Performance tip:</b> lowering Effects intensity reduces visual layers; lowering Visual motion rate makes the same FX update less often. Lower both if NEO-LIB feels heavy.</p></div>
      <BgTexturePicker textureId={bgTextureId} opacity={bgTextureOpacity} onChange={onChangeBgTextureId} onChangeOpacity={onChangeBgTextureOpacity} />
      <CursorPicker value={cursorTheme} onChange={onChangeCursorTheme} />
      </VisualGroup>
      </div>
      </div>
      {/* end .visuals-grid */}

      {/* v1.6.3 — Playtime toolkit REMOVED from Visuals menu. It now lives
          exclusively in the Stats panel via the "Import hours" button so
          playtime management stays with playtime UI (not visual dials). */}

      {/* v1.5.0 — Feedback / Bug / Suggestion text buttons inside Visuals menu.
          Same three actions the top Feedback pill triggers, but always visible here too. */}
      {onOpenFeedback && (
        <>
          <div className="mt-3 mb-1 text-[9.5px] uppercase tracking-[0.24em] text-muted/80">
            Share with the developer
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => { onOpenFeedback('bug'); onClose(); }}
              data-testid="visuals-feedback-bug"
              className="flex items-center gap-1.5 rounded-md hairline px-2 py-1.5 text-[11px] text-ink hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)]"
              title="Report a bug"
            >
              <Bug size={12} style={{ color: '#ff5a6e' }} /> Bug
            </button>
            <button
              onClick={() => { onOpenFeedback('suggestion'); onClose(); }}
              data-testid="visuals-feedback-suggestion"
              className="flex items-center gap-1.5 rounded-md hairline px-2 py-1.5 text-[11px] text-ink hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)]"
              title="Suggest a feature"
            >
              <Lightbulb size={12} style={{ color: '#ffcc4a' }} /> Idea
            </button>
            <button
              onClick={() => { onOpenFeedback('feedback'); onClose(); }}
              data-testid="visuals-feedback-general"
              className="flex items-center gap-1.5 rounded-md hairline px-2 py-1.5 text-[11px] text-ink hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)]"
              title="Send feedback"
            >
              <MessageCircle size={12} className="text-[rgb(var(--accent))]" /> Say hi
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
  if (typeof document === 'undefined') return body;
  return renderForegroundPortal(body);
}

function PopSlider({ label, value, min, max, suffix = '', onChange, testid }) {
  return (
    <div className="rounded-md hairline bg-surface/40 px-2.5 py-2">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-[11px] text-ink/90">{label}</div>
        <div className="text-[10.5px] text-[rgb(var(--accent-2))]">{value}{suffix}</div>
      </div>
      <input
        type="range"
        data-testid={testid}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange && onChange(Number(e.target.value))}
        className="w-full accent-[rgb(var(--accent))]"
      />
    </div>
  );
}

function VisualGroup({ title, children }) {
  return <section className="overflow-hidden rounded-lg border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--panel)/0.22)]"><div className="border-b border-[rgb(var(--accent)/0.36)] bg-[linear-gradient(90deg,rgb(var(--accent)/0.22),rgb(var(--accent-2)/0.10))] px-2.5 py-2 text-[9.5px] font-black uppercase tracking-[0.2em] text-ink shadow-[inset_0_1px_0_rgb(255,255,255,0.08)]">{title}</div><div className="space-y-2 p-2">{children}</div></section>;
}

function DiscretePopSlider({ label, labels, value, onChange, testid }) {
  const safeValue = Math.max(0, Math.min(labels.length - 1, Number.isFinite(value) ? value : 0));
  return <div className="rounded-md hairline bg-surface/40 px-2.5 py-2"><div className="mb-1 flex items-center justify-between"><div className="text-[11px] text-ink/90">{label}</div><div className="text-[10.5px] font-bold text-[rgb(var(--accent-2))]">{labels[safeValue]}</div></div><input type="range" data-testid={testid} min={0} max={labels.length - 1} step={1} value={safeValue} onChange={(event) => onChange?.(Number(event.target.value))} className="w-full accent-[rgb(var(--accent))]" /><div className="mt-1 flex justify-between text-[8px] uppercase tracking-wider text-muted/75">{labels.map((item) => <span key={item}>{item}</span>)}</div></div>;
}

const CURSOR_OPTIONS = [
  { id: 'windows', label: 'Windows' },
  { id: 'neon', label: 'Neon' },
  { id: 'petal', label: 'Petal' },
  { id: 'pixel', label: 'Pixel' },
];
function CursorPicker({ value = 'windows', onChange }) {
  return <div className="rounded-md hairline bg-panel/40 p-2.5" data-testid="visual-cursor-picker">
    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">App cursor</div>
    <p className="mb-2 text-[9.5px] leading-relaxed text-muted">Choose a cursor for NEO-LIB only. Windows keeps the familiar system pointer.</p>
    <div className="grid grid-cols-2 gap-1">
      {CURSOR_OPTIONS.map((option) => <button key={option.id} type="button" data-testid={`visual-cursor-${option.id}`} onClick={() => onChange?.(option.id)} className={cn('rounded-md hairline px-2 py-1.5 text-[10px] font-bold transition-colors', value === option.id ? 'border-[rgb(var(--accent)/0.7)] bg-[rgb(var(--accent)/0.12)] text-ink' : 'text-muted hover:border-[rgb(var(--accent)/0.42)] hover:text-ink')}>{option.label}</button>)}
    </div>
  </div>;
}

/* v1.4.0 — Background texture picker (5 built-ins + None) with transparency dial. */
export const BG_TEXTURES = [
  { id: 'none',     label: 'None' },
  { id: 'grain',    label: 'Grain' },
  { id: 'grid',     label: 'Grid' },
  { id: 'diagonal', label: 'Diagonal' },
  { id: 'hex',      label: 'Hex' },
  { id: 'dots',     label: 'Dots' },
  { id: 'scanlines', label: 'Scanlines' },
  { id: 'circuit',   label: 'Circuit' },
  { id: 'chevron',   label: 'Chevron' },
  { id: 'weave',     label: 'Weave' },
  { id: 'brushed',    label: 'Brushed' },
  { id: 'stardust',  label: 'Stardust' },
];
function BgTexturePicker({ textureId = 'none', opacity = 12, onChange, onChangeOpacity }) {
  return (
    <div className="rounded-md hairline bg-panel/40 p-2.5 space-y-2" data-testid="pop-bg-texture">
      <div className="text-[10px] uppercase tracking-wider text-muted">Background texture</div>
      <div className="grid grid-cols-3 gap-1.5">
        {BG_TEXTURES.map((t) => {
          const active = textureId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange && onChange(t.id)}
              data-testid={`bg-tex-${t.id}`}
              className={cn(
                'group relative overflow-hidden rounded-md hairline transition-all',
                active ? 'border-[rgb(var(--accent)/0.85)]' : 'hover:border-[rgb(var(--accent)/0.5)]'
              )}
              style={{ aspectRatio: '3/2' }}
              title={t.label}
            >
              <span
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: 'rgb(var(--panel))',
                  ...bgTexturePreview(t.id),
                }}
              />
              <span
                className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[9px] font-medium"
                style={{
                  color: active ? 'rgb(var(--accent))' : 'rgb(var(--muted))',
                  background: 'linear-gradient(0deg, rgb(var(--panel) / 0.92), transparent)',
                  textAlign: 'center',
                }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
      {textureId !== 'none' && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[11px] text-ink/90">Texture opacity</div>
            <div className="text-[10.5px] text-[rgb(var(--accent-2))]">{opacity}%</div>
          </div>
          <input
            type="range"
            data-testid="pop-bg-tex-opacity"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => onChangeOpacity && onChangeOpacity(Number(e.target.value))}
            className="w-full accent-[rgb(var(--accent))]"
          />
        </div>
      )}
    </div>
  );
}
/* Small preview CSS snippets for each texture — keep in sync with BgTexture layer */
function bgTexturePreview(id) {
  switch (id) {
    case 'grain':
      return {
        backgroundImage:
          'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)',
        backgroundSize: '6px 6px',
      };
    case 'grid':
      return {
        backgroundImage:
          'linear-gradient(rgb(var(--accent)/0.35) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgb(var(--accent-2)/0.25) 1px, transparent 1px)',
        backgroundSize: '10px 10px',
      };
    case 'diagonal':
      return {
        backgroundImage:
          'repeating-linear-gradient(135deg, rgb(var(--accent)/0.3) 0 1px, transparent 1px 6px)',
      };
    case 'hex':
      return {
        backgroundImage:
          'radial-gradient(circle at 25% 25%, rgb(var(--accent)/0.35) 1.5px, transparent 2px),' +
          'radial-gradient(circle at 75% 75%, rgb(var(--accent-2)/0.35) 1.5px, transparent 2px)',
        backgroundSize: '10px 10px',
      };
    case 'dots':
      return {
        backgroundImage:
          'radial-gradient(rgb(var(--accent)/0.4) 1px, transparent 2px)',
        backgroundSize: '8px 8px',
      };
    case 'scanlines':
      return {
        backgroundImage:
          'repeating-linear-gradient(0deg, rgb(var(--accent)/0.5) 0 1px, transparent 1px 4px)',
      };
    case 'circuit':
      return {
        backgroundImage:
          'linear-gradient(rgb(var(--accent)/0.4) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgb(var(--accent)/0.4) 1px, transparent 1px),' +
          'radial-gradient(rgb(var(--accent-2)/0.55) 1.2px, transparent 2px)',
        backgroundSize: '10px 10px, 10px 10px, 10px 10px',
        backgroundPosition: '0 0, 0 0, 5px 5px',
      };
    case 'chevron':
      return {
        backgroundImage:
          'repeating-linear-gradient(45deg, rgb(var(--accent)/0.4) 0 1px, transparent 1px 6px),' +
          'repeating-linear-gradient(-45deg, rgb(var(--accent-2)/0.35) 0 1px, transparent 1px 6px)',
      };
    case 'weave':
      return { backgroundImage: 'repeating-linear-gradient(0deg, rgb(var(--accent)/0.38) 0 1px, transparent 1px 5px), repeating-linear-gradient(90deg, rgb(var(--accent-2)/0.3) 0 1px, transparent 1px 5px)', backgroundSize: '10px 10px' };
    case 'brushed':
      return { backgroundImage: 'repeating-linear-gradient(105deg, rgb(var(--accent)/0.38) 0 1px, transparent 1px 5px), repeating-linear-gradient(105deg, transparent 0 8px, rgb(var(--accent-2)/0.24) 8px 9px, transparent 9px 17px)' };
    case 'stardust':
      return { backgroundImage: 'radial-gradient(circle at 20% 30%, rgb(var(--accent-2)/0.7) 0 1px, transparent 1.6px), radial-gradient(circle at 75% 70%, rgb(var(--accent)/0.6) 0 1px, transparent 1.7px)', backgroundSize: '14px 14px, 22px 22px' };
    default:
      return {};
  }
}


const EFFECTS_STAGES = ['None', 'Low', 'Medium', 'High', 'Max'];
const EFFECTS_HINT = {
  0: 'Off — flat & focused.',
  1: 'A subtle dusting.',
  2: 'Balanced default.',
  3: 'Lots of drift & glow.',
  4: 'Full arcade blast.',
};
function EffectsPopSlider({ theme, value, onChange }) {
  const v = Math.max(0, Math.min(4, value | 0));
  const themeLabel = String(theme || '').replace(/-/g, ' ');
  return (
    <div data-testid="pop-effects-level">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-[11px] text-ink/90">
          Effects intensity
          <span className="ml-1.5 rounded bg-panel/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted">
            {themeLabel} theme
          </span>
        </div>
        <div className="text-[10.5px] font-bold" style={{ color: 'rgb(var(--accent-2))' }}>
          {EFFECTS_STAGES[v]}
        </div>
      </div>
      <input
        type="range"
        data-testid="opt-effects-level"
        min={0} max={4} step={1}
        value={v}
        onChange={(e) => onChange && onChange(Number(e.target.value))}
        className="w-full accent-[rgb(var(--accent))]"
      />
      <div className="mt-0.5 flex justify-between px-0.5 text-[8.5px] uppercase tracking-widest text-muted/70">
        {EFFECTS_STAGES.map((s) => <span key={s}>{s}</span>)}
      </div>
      <div className="mt-0.5 text-[10px] text-muted">{EFFECTS_HINT[v]}</div>
    </div>
  );
}

const MOTION_CADENCE = [
  { id: 'full', label: 'Full', hint: 'Native smooth motion — default.' },
  { id: 'balanced', label: 'Balanced', hint: 'Smooth motion with fewer glow, blur, and particle actors.' },
  { id: 'calm', label: 'Calm', hint: 'Lower-impact ambient motion and the lightest decorative FX.' },
];
function MotionCadenceSlider({ value = 'full', onChange }) {
  const index = Math.max(0, MOTION_CADENCE.findIndex((item) => item.id === value));
  const current = MOTION_CADENCE[index];
  return <div data-testid="visual-motion-cadence"><div className="mb-1 flex items-center justify-between"><div className="text-[11px] text-ink/90">Visual motion rate</div><div className="text-[10.5px] font-bold" style={{ color: 'rgb(var(--accent-2))' }}>{current.label}</div></div><input type="range" min={0} max={2} step={1} value={index} onChange={(event) => onChange?.(MOTION_CADENCE[Number(event.target.value)]?.id || 'full')} className="w-full accent-[rgb(var(--accent))]" /><div className="mt-0.5 flex justify-between px-0.5 text-[8.5px] uppercase tracking-widest text-muted/70">{MOTION_CADENCE.map((item) => <span key={item.id}>{item.label}</span>)}</div><p className="mt-0.5 text-[10px] text-muted">{current.hint}</p></div>;
}
