import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  Plus, Wand2, RefreshCw, Trash2, Pencil, FolderOpen, MoreVertical, Sparkles,
  Lock, ChevronRight, ChevronDown, Tag, GripVertical, Terminal,
  Info, ArrowUp, ArrowDown, Palette, Eye, EyeOff, Sliders, Library as LibIcon,
  Boxes, Columns, Pin, PinOff, X as XIcon, Home, MessageCircle,
  Bug, Lightbulb, RotateCcw, Check, ArchiveRestore, Stethoscope, Settings, Wrench,
} from 'lucide-react';
import { cn, colorFromId, sizeById, formatPlaytime, playtimeSource } from '../lib/utils';
import SystemHealthBar from './SystemHealthBar';

/* v1.6.4 — Background texture styles applied INSIDE the sidebar so the
   texture never covers hero banners / preview images in the main pane. */
const BG_TEXTURE_PATTERNS = {
  grain: {
    backgroundImage:
      'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),' +
      'radial-gradient(rgba(0,0,0,0.35) 1px, transparent 1px)',
    backgroundSize: '3px 3px, 5px 5px',
    backgroundPosition: '0 0, 1px 1px',
  },
  grid: {
    backgroundImage:
      'linear-gradient(rgb(var(--accent) / 0.9) 1px, transparent 1px),' +
      'linear-gradient(90deg, rgb(var(--accent-2) / 0.75) 1px, transparent 1px)',
    backgroundSize: '32px 32px',
  },
  diagonal: {
    backgroundImage:
      'repeating-linear-gradient(135deg, rgb(var(--accent) / 0.7) 0 1px, transparent 1px 14px)',
  },
  hex: {
    backgroundImage:
      'radial-gradient(circle at 25% 25%, rgb(var(--accent) / 0.9) 1.5px, transparent 2px),' +
      'radial-gradient(circle at 75% 75%, rgb(var(--accent-2) / 0.8) 1.5px, transparent 2px)',
    backgroundSize: '28px 28px',
  },
  dots: {
    backgroundImage: 'radial-gradient(rgb(var(--accent) / 0.85) 1.2px, transparent 2px)',
    backgroundSize: '18px 18px',
  },
  scanlines: {
    backgroundImage:
      'repeating-linear-gradient(0deg, rgb(var(--accent) / 0.85) 0 1px, transparent 1px 6px)',
  },
  circuit: {
    backgroundImage:
      'linear-gradient(rgb(var(--accent) / 0.7) 1px, transparent 1px),' +
      'linear-gradient(90deg, rgb(var(--accent) / 0.7) 1px, transparent 1px),' +
      'radial-gradient(rgb(var(--accent-2) / 0.9) 1.5px, transparent 2.5px)',
    backgroundSize: '24px 24px, 24px 24px, 24px 24px',
    backgroundPosition: '0 0, 0 0, 12px 12px',
  },
  chevron: {
    backgroundImage:
      'repeating-linear-gradient(45deg, rgb(var(--accent) / 0.8) 0 2px, transparent 2px 12px),' +
      'repeating-linear-gradient(-45deg, rgb(var(--accent-2) / 0.7) 0 2px, transparent 2px 12px)',
  },
  weave: {
    backgroundImage: 'repeating-linear-gradient(0deg, rgb(var(--accent) / 0.42) 0 1px, transparent 1px 8px), repeating-linear-gradient(90deg, rgb(var(--accent-2) / 0.30) 0 1px, transparent 1px 8px)',
    backgroundSize: '16px 16px',
  },
  brushed: {
    // Fine diagonal grain, deliberately tile-safe rather than a repeated
    // circular motif. It reads as a quiet material finish at low opacity.
    backgroundImage: 'repeating-linear-gradient(105deg, rgb(var(--accent) / 0.30) 0 1px, transparent 1px 5px), repeating-linear-gradient(105deg, transparent 0 8px, rgb(var(--accent-2) / 0.18) 8px 9px, transparent 9px 17px)',
  },
  // Saved installs using the retired Topography key receive the seamless
  // finish rather than silently losing their selected texture.
  topography: {
    backgroundImage: 'repeating-linear-gradient(105deg, rgb(var(--accent) / 0.30) 0 1px, transparent 1px 5px), repeating-linear-gradient(105deg, transparent 0 8px, rgb(var(--accent-2) / 0.18) 8px 9px, transparent 9px 17px)',
  },
  stardust: {
    backgroundImage: 'radial-gradient(circle at 20% 30%, rgb(var(--accent-2) / 0.7) 0 1px, transparent 1.8px), radial-gradient(circle at 75% 70%, rgb(var(--accent) / 0.6) 0 1.2px, transparent 2px)',
    backgroundSize: '34px 34px, 53px 53px',
  },
};

/**
 * Sidebar (tree view)
 * - Top toolbar: Add · Wizard · Refresh-all · Library settings (size, etc.) · App settings
 * - Tree:
 *    ▸ [colored chip] CATEGORY NAME (count)
 *        indented game rows…
 *    ▸ Uncategorized
 * - Drag a category header to reorder categories
 * - Drag a game to another category to MOVE it; hold Ctrl to COPY
 * - Drag a game within the same category to reorder
 */
export default function Sidebar({
  games, categories, gameOrderByCategory, collapsed,
  unlockedCategories, search, selectedId, librarySize,
  mode, onSetMode,
  launcherFilter = 'all',
  onSetLauncherFilter,
  iconPosition = 'left', rowSize = 44, catTextSize = 11, catGlow = 40,
  rowGap = 2, catGap = 8, catTopGap = 4,
  showCategoryDot = true, categoryMarkerMode = 'dot',
  showSubcatStrip = true,
  nameTextSize = null,
  effectsLevel = 2, currentTheme = 'synthwave', onChangeEffectsLevel,
  unseenNewsCount = 0,
  pinnedIds = [],
  onChangeRowSize, onChangeCatTextSize, onChangeCatGlow, onChangeIconPosition,
  onChangeRowGap, onChangeCatGap, onChangeCatTopGap, onChangeCategoryMarkerMode,
  onToggleSubcatStrip, onChangeNameTextSize,
  bgTextureId, bgTextureOpacity,
  onChangeBgTextureId, onChangeBgTextureOpacity,
  onSelect,
  onAddManual, onOpenWizard, onOpenFeedback, onOpenPlaytimeImport, onUpdateAll, onTidyUp,
  onCreateCategory, onCategoryContext, onGameContext,
  onSetLibrarySize, onMoveGameToCategory,
  onReorderGameInCategory, onReorderCategory,
  onToggleCollapsed, onUnlockCategory,
  onAutoSort,
  twoRow = false, onToggleTwoRow,
  sidebarWidth = 320,
  onStartResize,
  updatingAll,
  gameResting = false,
  runningGameName = '',
  allGames = [],
  onOpenSettings,
}) {
  // size based on rowSize slider (in px).
  // v1.2.9 — text size can now be overridden explicitly via nameTextSize
  // slider (independent of icon size). If null, it derives from rowSize
  // like before so the sliders still play nicely together.
  const derivedFont = Math.max(11, Math.min(16, Math.round(rowSize * 0.28)));
  const size = {
    id: rowSize < 32 ? 'small' : rowSize > 60 ? 'big' : 'medium',
    rowH: rowSize,
    icon: Math.max(14, Math.round(rowSize * 0.72)),
    font: Number.isFinite(nameTextSize) ? Math.max(9, Math.min(22, nameTextSize)) : derivedFont,
  };
  const [libSettingsOpen, setLibSettingsOpen] = React.useState(false);
  const libSettingsBtnRef = React.useRef(null);
  const [addMenuOpen, setAddMenuOpen] = React.useState(false);
  const [refreshMenuOpen, setRefreshMenuOpen] = React.useState(false);
  const addMenuRef = React.useRef(null);
  const refreshMenuRef = React.useRef(null);
  const treeScrollRef = React.useRef(null);
  const isTools = mode === 'tools';
  // Keep toolbar labels legible while the sidebar is resized: they shrink over
  // the last 80px, then collapse cleanly to icons instead of being clipped.
  const labelProgress = Math.max(0, Math.min(1, (sidebarWidth - 240) / 80));
  const labelsVisible = labelProgress > 0;
  const toolbarLabelStyle = {
    fontSize: `${8 + (labelProgress * 2.5)}px`,
    maxWidth: `${Math.round(88 * labelProgress)}px`,
    opacity: labelProgress,
    transition: 'font-size 100ms ease, max-width 100ms ease, opacity 100ms ease',
  };
  const pinnedIdsSet = React.useMemo(() => new Set(pinnedIds || []), [pinnedIds]);

  // Every small Library popover follows the same simple escape hatch: click
  // anywhere outside it (or press Escape) and it goes away.
  React.useEffect(() => {
    if (!addMenuOpen && !refreshMenuOpen) return undefined;
    const close = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) setAddMenuOpen(false);
      if (refreshMenuRef.current && !refreshMenuRef.current.contains(event.target)) setRefreshMenuOpen(false);
    };
    const escape = (event) => { if (event.key === 'Escape') { setAddMenuOpen(false); setRefreshMenuOpen(false); } };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, [addMenuOpen, refreshMenuOpen]);

  // Library reference used by the PinnedStrip (it pulls full game objects by id).
  // We keep it as a plain object since we only need it inside the render.
  const library = { games };

  // Build per-category game lists honoring per-category ordering
  const orderedGamesIn = (catId) => {
    const order = gameOrderByCategory?.[catId] || [];
    const inCat = games.filter((g) =>
      catId === '__uncat__'
        ? !(g.categoryIds || []).length
        : (g.categoryIds || []).includes(catId)
    );
    const byId = new Map(inCat.map((g) => [g.id, g]));
    const ordered = [];
    for (const id of order) {
      if (byId.has(id)) {
        ordered.push(byId.get(id));
        byId.delete(id);
      }
    }
    return [...ordered, ...byId.values()];
  };

  const searchFilter = (list) => {
    if (!search.trim()) return list;
    return list.filter((g) => (g.name || '').toLowerCase().includes(search.toLowerCase().trim()));
  };

  // Pre-compute sections — pinnedBottom categories go to the end
  const sortedCats = [...categories].sort((a, b) => {
    const ap = a.pinnedBottom ? 1 : 0;
    const bp = b.pinnedBottom ? 1 : 0;
    return ap - bp;
  });
  const sections = [
    ...sortedCats.map((c) => {
      const isGhost = c.private && !unlockedCategories.includes(c.id);
      const list = isGhost ? [] : searchFilter(orderedGamesIn(c.id));
      return { id: c.id, category: c, isGhost, games: list, count: isGhost ? '🔒' : list.length };
    }),
    {
      id: '__uncat__',
      category: { id: '__uncat__', name: isTools ? 'Unsorted' : 'Uncategorized', colorId: 'slate' },
      isGhost: false,
      games: searchFilter(orderedGamesIn('__uncat__')),
      count: orderedGamesIn('__uncat__').length,
    },
  ];

  return (
    <aside
      className="relative flex h-full shrink-0 flex-col border-r hairline glass-soft"
      style={{ width: sidebarWidth }}
    >
      {/* v1.6.4 — Per-user background texture, rendered INSIDE the sidebar
          only (not full viewport) so it never bleeds over hero banners or
          preview screenshots in the main pane. Sits above the sidebar's
          panel color but below all interactive content. */}
      {bgTextureId && bgTextureId !== 'none' && BG_TEXTURE_PATTERNS[bgTextureId] && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            ...BG_TEXTURE_PATTERNS[bgTextureId],
            opacity: Math.max(0, Math.min(100, Number(bgTextureOpacity) || 40)) / 100,
          }}
          data-testid="sidebar-bg-texture"
        />
      )}
      {/* Per-theme tint wash — subtle accent-colored glow behind sidebar content.
          Uses --sidebar-tint CSS var which each theme sets to its own accent
          hue, so Colorful gets a pinkish wash while Pro gets a warm steel one. */}
      <span aria-hidden className="sidebar-tint" />
      {/* Resize handle on right edge */}
      <div
        data-testid="sidebar-resize-handle"
        onMouseDown={onStartResize}
        title="Drag to resize sidebar"
        className="absolute right-0 top-0 z-30 h-full w-1.5 cursor-col-resize hover:bg-[rgb(var(--accent)/0.4)] transition-colors"
        style={{ touchAction: 'none' }}
      />
      {/* Top toolbar — Home / Library / Tools. Frosted band that stretches
          across the sidebar, gradient underline separates it from category tree.
          v1.6.3 — Labels collapse to icon-only when the sidebar is dragged
          under ~340px so nothing gets truncated to a single letter. */}
      {(() => {
        return (
      <div
        className="relative flex items-stretch gap-1 px-2 pt-2.5 pb-2"
        style={{
          // v1.6.4 — Darker toolbar band so the tab pills read as chrome and
          // don't visually blend with the game rows below.
          background:
            'linear-gradient(180deg, rgb(0 0 0 / 0.38) 0%, rgb(0 0 0 / 0.20) 100%)',
          backdropFilter: 'blur(12px) saturate(140%)',
          WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        }}
        data-testid="top-toolbar"
      >
        <TabPill label="Home" icon={<Home size={15} />} showLabel={labelsVisible} labelStyle={toolbarLabelStyle} active={mode === 'home'} onClick={() => { onSelect?.(null); onSetMode('home'); }} testid="tab-home" />
        <TabPill label="Library" icon={<LibIcon size={15} />} showLabel={labelsVisible} labelStyle={toolbarLabelStyle} active={mode === 'library'} onClick={() => { onSetMode('library'); onSetLauncherFilter?.('all'); }} testid="tab-library" />
        <TabPill
          label="Tools"
          icon={<Boxes size={15} />}
          showLabel={labelsVisible}
          labelStyle={toolbarLabelStyle}
          active={mode === 'tools'}
          onClick={() => onSetMode('tools')}
          testid="tab-tools"
        />
        {/* Bottom accent line separating the toolbar from what's underneath */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgb(var(--accent)/0.5) 50%, transparent 100%)',
          }}
        />
      </div>
        );
      })()}

      {/* Secondary launcher filter row moved BELOW the Add/Wizard toolbar
          in v1.3.1 — see the combined row below. */}

      {/* Toolbar row 2 — Add menu / Wizard / (flex) / Refresh / Visuals / TwoRow.
          Labels collapse to icon-only when the sidebar is especially narrow so the
          row stays tidy without wrapping or truncating. */}
      {(() => {
        return (
      <div
        className="flex items-center gap-1.5 p-3 pt-2"
        style={{
          // v1.6.4 — Match the darker top-toolbar band so both rows read as
          // one continuous chrome zone (not two "just game rows in disguise").
          background: 'linear-gradient(180deg, rgb(0 0 0 / 0.20) 0%, rgb(0 0 0 / 0.08) 100%)',
        }}
      >
        <div ref={addMenuRef} className="relative">
          <SideBtn
            label={labelsVisible ? "Add" : null}
            labelStyle={toolbarLabelStyle}
            icon={<Plus size={16} />}
            onClick={() => setAddMenuOpen((v) => !v)}
            testid="sidebar-add-btn"
            title={isTools ? 'Add tool' : 'Add game or category'}
          />
          <AnimatePresence>
            {addMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 z-30 mt-1 w-56 rounded-lg hairline glass shadow-2xl p-1.5"
              >
                <button
                  data-testid="add-menu-game"
                  onClick={() => { setAddMenuOpen(false); onAddManual?.(); }}
                  className="flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left hover:bg-[rgb(var(--accent)/0.08)] transition-colors"
                >
                  <span className="flex items-center gap-2 text-[12px] font-semibold text-ink">
                    <Plus size={13} className="text-[rgb(var(--accent))]" />
                    {isTools ? 'Add tool' : 'Add game'}
                  </span>
                  <span className="text-[10.5px] text-muted">
                    {isTools ? 'Add an executable or shortcut to your tools.' : 'Open the existing add-game menu.'}
                  </span>
                </button>
                {!isTools && (
                  <button
                    data-testid="add-menu-category"
                    onClick={() => { setAddMenuOpen(false); onCreateCategory?.(); }}
                    className="flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left hover:bg-[rgb(var(--accent-2)/0.08)] transition-colors"
                  >
                    <span className="flex items-center gap-2 text-[12px] font-semibold text-ink">
                      <Tag size={13} className="text-[rgb(var(--accent-2))]" />
                      Add category
                    </span>
                    <span className="text-[10.5px] text-muted">Create a new shelf for your library.</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {!isTools && (
          <SideBtn label={labelsVisible ? "Wizard" : null} labelStyle={toolbarLabelStyle} icon={<Wand2 size={16} />} onClick={onOpenWizard} testid="sidebar-wizard-btn" title="Wizard" />
        )}
        <div className="flex-1" />
        <div className="relative">
          <button
            ref={libSettingsBtnRef}
            onClick={() => setLibSettingsOpen((v) => !v)}
            data-testid="sidebar-visuals-btn"
            title="Visuals — themes-adjacent library dials, textures & effects"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md hairline px-3 h-8 text-[12px] font-bold transition-all',
              libSettingsOpen
                ? 'text-ink border-[rgb(var(--accent)/0.8)] bg-[rgb(var(--accent)/0.14)]'
                : 'text-ink/90 hover:text-ink hover:border-[rgb(var(--accent)/0.55)] hover:bg-[rgb(var(--accent)/0.10)]'
            )}
            style={{
              background: libSettingsOpen
                ? 'linear-gradient(135deg, rgb(var(--accent)/0.18) 0%, rgb(var(--accent-2)/0.14) 100%)'
                : undefined,
              boxShadow: libSettingsOpen
                ? '0 0 10px -2px rgb(var(--accent)/0.5)'
                : undefined,
            }}
          >
            <Sliders size={15} className="text-[rgb(var(--accent))]" />
            {labelsVisible && <span className="overflow-hidden whitespace-nowrap" style={toolbarLabelStyle}>Visuals</span>}
          </button>
          <AnimatePresence>
            {libSettingsOpen && (
              <LibrarySettingsPopover
                anchorEl={libSettingsBtnRef.current}
                librarySize={librarySize}
                rowSize={rowSize}
                catTextSize={catTextSize}
                catGlow={catGlow}
                rowGap={rowGap}
                catGap={catGap}
                catTopGap={catTopGap}
                iconPosition={iconPosition}
                showCategoryDot={showCategoryDot}
                categoryMarkerMode={categoryMarkerMode}
                onSetLibrarySize={onSetLibrarySize}
                onChangeRowSize={onChangeRowSize}
                onChangeCatTextSize={onChangeCatTextSize}
                onChangeCatGlow={onChangeCatGlow}
                onChangeRowGap={onChangeRowGap}
                onChangeCatGap={onChangeCatGap}
                onChangeCatTopGap={onChangeCatTopGap}
                onChangeIconPosition={onChangeIconPosition}
                onChangeCategoryMarkerMode={onChangeCategoryMarkerMode}
                showSubcatStrip={showSubcatStrip}
                onToggleSubcatStrip={onToggleSubcatStrip}
                nameTextSize={nameTextSize}
                onChangeNameTextSize={onChangeNameTextSize}
                effectsLevel={effectsLevel}
                currentTheme={currentTheme}
                onChangeEffectsLevel={onChangeEffectsLevel}
                bgTextureId={bgTextureId}
                bgTextureOpacity={bgTextureOpacity}
                onChangeBgTextureId={onChangeBgTextureId}
                onChangeBgTextureOpacity={onChangeBgTextureOpacity}
                onClose={() => setLibSettingsOpen(false)}
                onCreateCategory={onCreateCategory}
                onOpenFeedback={onOpenFeedback}
                onOpenPlaytimeImport={onOpenPlaytimeImport}
                twoRow={twoRow}
                onToggleTwoRow={onToggleTwoRow}
              />
            )}
          </AnimatePresence>
        </div>
        {onOpenSettings && (
          <SideBtn
            label={labelsVisible ? 'Settings' : null}
            labelStyle={toolbarLabelStyle}
            icon={<Settings size={15} />}
            onClick={onOpenSettings}
            testid="sidebar-settings-btn"
            title="Settings"
          />
        )}
        <button
          data-testid="sidebar-tworow-btn-hidden"
          onClick={() => onToggleTwoRow?.(!twoRow)}
          className="hidden"
          aria-hidden
        />
        {/* v1.6.4 — Column-switcher button was moved into the Visuals popover
            (Layout section) to reduce toolbar clutter. Hidden stub kept only
            so external tests can still find the testid; no visual footprint. */}
      </div>
        );
      })()}

      {/* v1.3.1 — Combined filter + actions row (Library tab only).
          v1.6.4 — Launcher pills collapsed into a single dropdown to reduce
          horizontal clutter. "+ New" renamed to "+ Category" so its purpose
          is obvious next to "Add Game". */}
      {!isTools && (
        <div className="flex items-center gap-1 px-3 pb-2" data-testid="launcher-pane-row">
          <LauncherDropdown
            value={launcherFilter || 'all'}
            onChange={(v) => onSetLauncherFilter?.(v)}
          />
          <div className="flex-1 min-w-[6px]" />
          {onAutoSort && (
            <button
              data-testid="sidebar-autosort-btn"
              onClick={onAutoSort}
              title="Smart auto-sort into 6 default categories"
              className="inline-flex shrink-0 items-center gap-1 rounded-md hairline px-2 h-6 text-[10px] text-[rgb(var(--accent-2))] hover:text-ink hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)]"
            >
              <Wand2 size={10} /> Auto-sort
            </button>
          )}
          <div ref={refreshMenuRef} className="relative">
            <button
              data-testid="sidebar-refresh-menu-btn"
              onClick={() => setRefreshMenuOpen((v) => !v)}
              title="Refresh metadata or tidy up your library"
              className="inline-flex shrink-0 items-center gap-1 rounded-md hairline px-2 h-6 text-[10px] text-[rgb(var(--accent-2))] hover:text-ink hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)]"
            >
              <RefreshCw size={10} className={updatingAll ? 'animate-spin' : ''} /> Refresh
            </button>
            <AnimatePresence>
              {refreshMenuOpen && (
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} onClick={(e) => e.stopPropagation()} className="absolute right-0 z-30 mt-1 w-64 rounded-lg hairline glass shadow-2xl p-1.5">
                  <button data-testid="refresh-menu-refresh" onClick={() => { setRefreshMenuOpen(false); onUpdateAll?.(); }} className="flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left hover:bg-[rgb(var(--accent)/0.08)] transition-colors"><span className="flex items-center gap-2 text-[12px] font-semibold text-ink"><RefreshCw size={12} className="text-[rgb(var(--accent))]" />Refresh all metadata</span><span className="text-[10.5px] text-muted">Re-fetches covers, descriptions & screenshots for every game.</span></button>
                  <button data-testid="refresh-menu-tidy" onClick={() => { setRefreshMenuOpen(false); onTidyUp?.(); }} className="flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left hover:bg-[rgb(var(--accent-2)/0.08)] transition-colors"><span className="flex items-center gap-2 text-[12px] font-semibold text-ink"><Sparkles size={12} className="text-[rgb(var(--accent-2))]" />Tidy up library</span><span className="text-[10.5px] text-muted">Review duplicates and games needing attention.</span></button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Tools mode keeps the simple label + auto-sort/new-category row */}
      {isTools && (
        <div className="flex items-center justify-between px-4 pb-2">
          <span className="text-[10px] uppercase tracking-[0.28em] text-muted">Tools</span>
        </div>
      )}

      {/* Tree — single column or two-column (categories never split between columns).
          v1.2.2 — auto-scroll while dragging a game near the top/bottom edges so
          long libraries are actually reachable during a drag operation. */}
      <div
        ref={treeScrollRef}
        className="flex-1 overflow-y-auto px-2 pb-24"
        data-testid="sidebar-tree"
        onDragOver={(e) => {
          const el = treeScrollRef.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          const EDGE = 60; // px within which auto-scroll kicks in
          const MAX_SPEED = 20;
          const dyTop = e.clientY - r.top;
          const dyBottom = r.bottom - e.clientY;
          if (dyTop < EDGE && dyTop >= 0) {
            const speed = Math.round(MAX_SPEED * (1 - dyTop / EDGE));
            el.scrollTop -= speed;
          } else if (dyBottom < EDGE && dyBottom >= 0) {
            const speed = Math.round(MAX_SPEED * (1 - dyBottom / EDGE));
            el.scrollTop += speed;
          }
        }}
      >
        {/* Pinned strip — full-width, sits above all categories in both single & two-row modes */}
        <PinnedStrip
          games={(library.games || []).filter((g) => pinnedIdsSet.has(g.id))}
          selectedId={selectedId}
          onSelect={onSelect}
          onContext={onGameContext}
        />
        {twoRow ? (
          <TwoColumnSections sections={sections} commonProps={{
            collapsed, size, iconPosition, catTextSize, catGlow, rowGap, catGap, catTopGap, selectedId,
            showCategoryDot, categoryMarkerMode, showSubcatStrip, pinnedIdsSet,
            onSelect, onGameContext, onCategoryContext, onUnlockCategory, onToggleCollapsed,
            onMoveGameToCategory, onReorderGameInCategory, onReorderCategory,
            unlockedCategories, categories,
          }} />
        ) : (
          sections.map((s, sectionIdx) => (
            <Section
              key={s.id}
              section={s}
              sectionIdx={sectionIdx}
              collapsed={!!collapsed[s.id]}
              size={size}
              iconPosition={iconPosition}
              catTextSize={catTextSize}
              catGlow={catGlow}
              rowGap={rowGap}
              catGap={catGap}
              catTopGap={catTopGap}
              showCategoryDot={showCategoryDot}
              categoryMarkerMode={categoryMarkerMode}
              showSubcatStrip={showSubcatStrip}
              pinnedIdsSet={pinnedIdsSet}
              selectedId={selectedId}
              onSelect={onSelect}
              onContext={(action, payload) => onGameContext(action, payload.game, payload)}
              onCategoryContext={(category, anchor) => onCategoryContext(category, anchor)}
              onUnlockCategory={() => onUnlockCategory(s.category)}
              onToggleCollapsed={() => onToggleCollapsed(s.id)}
              onMoveGameToCategory={onMoveGameToCategory}
              onReorderGameInCategory={onReorderGameInCategory}
              onReorderCategory={onReorderCategory}
              unlockedCategories={unlockedCategories}
              categories={categories}
            />
          ))
        )}
        {games.length === 0 && (
          <div className="mt-8 px-4 text-center text-xs text-muted">
            No games yet. Add one or run the Wizard.
          </div>
        )}
      </div>
      {!isTools && <SystemHealthBar resting={gameResting} runningGameName={runningGameName} games={allGames} />}
    </aside>
  );
}

/**
 * TwoColumnSections — splits sections into two side-by-side columns such that:
 *   - No category is split across columns
 *   - Both columns are roughly balanced by estimated rendered height
 * Estimation uses: catHeader (≈ catTextSize + 18) + games*(rowSize+rowGap) + catGap.
 */
function TwoColumnSections({ sections, commonProps }) {
  const { size, catTextSize, rowGap, catGap } = commonProps;
  // Estimate each section's height
  const heights = sections.map((s) => {
    const header = (catTextSize || 11) + 22;
    const rows = (s.games?.length || 0) * (size.rowH + (rowGap || 0));
    return header + rows + (catGap || 8);
  });
  const total = heights.reduce((a, b) => a + b, 0);
  const target = total / 2;
  let acc = 0;
  let splitAt = sections.length;
  for (let i = 0; i < sections.length; i++) {
    // Decide BEFORE adding this section whether it should go in col 2.
    // If col1 already crossed target, push remaining to col 2.
    if (acc >= target && i > 0) {
      splitAt = i;
      break;
    }
    // If adding this section would overshoot target more than NOT adding, stop here.
    const afterAdd = acc + heights[i];
    if (afterAdd > target && acc > target * 0.5 && i > 0) {
      splitAt = i;
      break;
    }
    acc += heights[i];
  }
  const colA = sections.slice(0, splitAt);
  const colB = sections.slice(splitAt);
  // If everything fits in col1, fall back to single column
  if (colB.length === 0) {
    return sections.map((s, idx) => (
      <SectionWrap key={s.id} s={s} idx={idx} commonProps={commonProps} />
    ));
  }
  return (
    <div className="grid grid-cols-2 gap-2" data-testid="sidebar-twocol">
      <div>{colA.map((s, idx) => <SectionWrap key={s.id} s={s} idx={idx} commonProps={commonProps} />)}</div>
      <div>{colB.map((s, idx) => <SectionWrap key={s.id} s={s} idx={idx + colA.length} commonProps={commonProps} />)}</div>
    </div>
  );
}

function SectionWrap({ s, idx, commonProps }) {
  const { collapsed, size, iconPosition, catTextSize, catGlow, rowGap, catGap, catTopGap, selectedId,
    showCategoryDot, categoryMarkerMode, showSubcatStrip,
    pinnedIdsSet,
    onSelect, onGameContext, onCategoryContext, onUnlockCategory, onToggleCollapsed,
    onMoveGameToCategory, onReorderGameInCategory, onReorderCategory,
    unlockedCategories, categories } = commonProps;
  return (
    <Section
      section={s}
      sectionIdx={idx}
      collapsed={!!collapsed[s.id]}
      size={size}
      iconPosition={iconPosition}
      catTextSize={catTextSize}
      catGlow={catGlow}
      rowGap={rowGap}
      catGap={catGap}
      catTopGap={catTopGap}
      showCategoryDot={showCategoryDot}
      categoryMarkerMode={categoryMarkerMode}
      showSubcatStrip={showSubcatStrip}
      pinnedIdsSet={pinnedIdsSet}
      selectedId={selectedId}
      onSelect={onSelect}
      onContext={(action, payload) => onGameContext(action, payload.game, payload)}
      onCategoryContext={(category, anchor) => onCategoryContext(category, anchor)}
      onUnlockCategory={() => onUnlockCategory(s.category)}
      onToggleCollapsed={() => onToggleCollapsed(s.id)}
      onMoveGameToCategory={onMoveGameToCategory}
      onReorderGameInCategory={onReorderGameInCategory}
      onReorderCategory={onReorderCategory}
      unlockedCategories={unlockedCategories}
      categories={categories}
    />
  );
}

const SideBtn = React.forwardRef(function SideBtn({ icon, label, labelStyle, onClick, testid, title }, ref) {
  return (
    <button
      ref={ref}
      data-testid={testid}
      onClick={onClick}
      title={title || label}
      className="group inline-flex items-center gap-1.5 rounded-md hairline px-3 h-8 text-[12px] font-semibold text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)] transition-all"
    >
      <span className="text-[rgb(var(--accent))] transition-transform group-hover:scale-110">{icon}</span>
      {label && <span className="overflow-hidden whitespace-nowrap" style={labelStyle}>{label}</span>}
    </button>
  );
});

function TabPill({ label, icon, active, onClick, testid, big = false, badge = null, showLabel = true, labelStyle }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      title={label}
      className={cn(
        'group relative inline-flex flex-1 min-w-0 items-center justify-center gap-1.5 rounded-lg transition-all overflow-hidden',
        big ? 'px-3 h-11 text-[12px]' : 'px-2 h-9 text-[10.5px]',
        'font-bold uppercase tracking-[0.14em]',
        active
          ? 'text-ink'
          : 'text-ink/85 hover:text-ink'
      )}
      style={{
        background: active
          ? 'linear-gradient(180deg, rgb(var(--accent)/0.22) 0%, rgb(var(--accent)/0.08) 100%)'
          : 'rgb(var(--panel)/0.35)',
        border: `1px solid ${active ? 'rgb(var(--accent)/0.6)' : 'rgb(var(--border)/0.55)'}`,
        boxShadow: active
          ? '0 0 16px -4px rgb(var(--accent)/0.55), inset 0 1px 0 rgb(255,255,255,0.05)'
          : 'inset 0 1px 0 rgb(255,255,255,0.03)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgb(var(--panel)/0.75)';
          e.currentTarget.style.borderColor = 'rgb(var(--accent)/0.45)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgb(var(--panel)/0.35)';
          e.currentTarget.style.borderColor = 'rgb(var(--border)/0.55)';
        }
      }}
    >
      <span
        className="grid h-5 w-5 shrink-0 place-items-center rounded transition-colors"
        style={{
          backgroundColor: active ? 'rgb(var(--accent)/0.2)' : 'transparent',
          color: active ? 'rgb(var(--accent))' : 'currentColor',
        }}
      >
        {icon}
      </span>
      {showLabel && (
        <span className="relative overflow-hidden whitespace-nowrap" style={labelStyle}>
          {label}
        </span>
      )}
      {/* Live badge — pulses when there's unseen news; also visible when tab isn't active */}
      {badge != null && badge > 0 && (
        <motion.span
          animate={{ scale: [1, 1.15, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1.5 right-2 grid min-w-[16px] h-4 place-items-center rounded-full px-1 text-[9px] font-black text-white"
          style={{
            background: 'linear-gradient(135deg, #ff3b6b 0%, #ff6b95 100%)',
            boxShadow: '0 0 10px rgba(255,59,107,0.75)',
          }}
          data-testid="tab-news-badge"
        >
          {badge > 99 ? '99+' : badge}
        </motion.span>
      )}
      {active && (
        <motion.span
          layoutId="tab-underline"
          className="pointer-events-none absolute bottom-1 left-4 right-4 h-[2px] rounded-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgb(var(--accent)) 50%, transparent)',
            boxShadow: '0 0 10px rgb(var(--accent))',
          }}
        />
      )}
    </button>
  );
}

function LauncherPill({ label, active, onClick, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className={cn(
        'relative shrink-0 inline-flex items-center justify-center px-2.5 h-6 rounded-full text-[10px] font-semibold tracking-wide transition-all',
        active
          ? 'bg-[rgb(var(--accent-2)/0.18)] text-ink hairline border-[rgb(var(--accent-2)/0.7)] shadow-[0_0_8px_-2px_rgb(var(--accent-2)/0.55)]'
          : 'text-muted/80 hover:text-ink hover:bg-panel/50 hairline border-transparent'
      )}
    >
      {label}
    </button>
  );
}

/* v1.6.4 — Launcher filter dropdown. Compact replacement for the 6-pill row.
   Uses a click-outside listener + Escape to close. */
const LAUNCHER_OPTIONS = [
  { id: 'all',   label: 'All launchers' },
  { id: 'steam', label: 'Steam' },
  { id: 'epic',  label: 'Epic' },
  { id: 'ea',    label: 'EA' },
  { id: 'gog',   label: 'GOG' },
  { id: 'ubisoft', label: 'Ubisoft' },
  { id: 'battlenet', label: 'Battle.net' },
  { id: 'riot', label: 'Riot' },
  { id: 'xbox', label: 'Xbox / Game Pass' },
  { id: 'rockstar', label: 'Rockstar' },
  { id: 'itch', label: 'itch.io' },
  { id: 'other', label: 'Other' },
];
function LauncherDropdown({ value = 'all', onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const k = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('keydown', k);
    };
  }, [open]);
  const current = LAUNCHER_OPTIONS.find((o) => o.id === value) || LAUNCHER_OPTIONS[0];
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-testid="launcher-dropdown-toggle"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1 rounded-md hairline px-2.5 h-6 text-[10.5px] font-semibold tracking-wide transition-all',
          open || value !== 'all'
            ? 'text-ink border-[rgb(var(--accent-2)/0.7)] bg-[rgb(var(--accent-2)/0.14)]'
            : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)]'
        )}
      >
        <ChevronDown size={10} className={cn('transition-transform', open && 'rotate-180')} />
        {current.label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full z-40 mt-1 w-40 rounded-md hairline glass shadow-2xl p-1"
            data-testid="launcher-dropdown-menu"
          >
            {LAUNCHER_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                data-testid={`lp-${o.id}`}
                onClick={() => { onChange?.(o.id); setOpen(false); }}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] transition-colors',
                  o.id === value
                    ? 'bg-[rgb(var(--accent)/0.15)] text-ink'
                    : 'text-muted hover:text-ink hover:bg-[rgb(var(--accent)/0.08)]'
                )}
              >
                {o.id === value && <Check size={10} className="text-[rgb(var(--accent))]" />}
                <span className={o.id === value ? '' : 'ml-3.5'}>{o.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Library settings popover ---------------- */
function LibrarySettingsPopover({
  anchorEl,
  librarySize, rowSize = 44, catTextSize = 11, catGlow = 40, iconPosition = 'left',
  rowGap = 2, catGap = 8, catTopGap = 4, showCategoryDot = true, categoryMarkerMode = 'dot',
  showSubcatStrip = true, nameTextSize = null,
  effectsLevel = 2, currentTheme = 'synthwave',
  bgTextureId = 'none', bgTextureOpacity = 12,
  onSetLibrarySize, onChangeRowSize, onChangeCatTextSize, onChangeCatGlow, onChangeIconPosition,
  onChangeRowGap, onChangeCatGap, onChangeCatTopGap, onChangeCategoryMarkerMode,
  onToggleSubcatStrip, onChangeNameTextSize,
  onChangeEffectsLevel,
  onChangeBgTextureId, onChangeBgTextureOpacity,
  onOpenFeedback,
  onOpenPlaytimeImport,
  twoRow = false, onToggleTwoRow,
  onClose, onCreateCategory,
}) {
  const ref = React.useRef(null);
  const dragControls = useDragControls();
  // Anchor the popover to the trigger button's rect (portaled to body so no
  // parent stacking context can hide it under the game preview).
  const [pos, setPos] = React.useState(() => {
    if (!anchorEl) return { top: 80, left: 12 };
    const r = anchorEl.getBoundingClientRect();
    return { top: r.bottom + 6, left: r.left };
  });
  React.useEffect(() => {
    if (!anchorEl) return;
    const r = anchorEl.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left });
  }, [anchorEl]);
  React.useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)
        && (!anchorEl || !anchorEl.contains(e.target))) onClose();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose, anchorEl]);
  const body = (
    <motion.div
      ref={ref}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
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
      }}
      className="z-[9999] w-[420px] max-w-[calc(100vw-32px)] max-h-[80vh] overflow-y-auto rounded-lg hairline shadow-2xl p-3"
      data-testid="library-settings-popover"
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-move -mt-1 -mx-1 mb-2 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-[rgb(var(--accent))] flex items-center gap-1.5 select-none border-b border-[rgb(var(--border))]/60 font-bold"
        title="Drag to move"
      >
        <GripVertical size={10} /> Visuals
      </div>
      {/* v1.4.0 — Visuals popover uses CSS columns (settings-columns) so all
          dials fit in a compact two-column masonry without endless scroll. */}
      <div className="settings-columns">
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

      <VisualGroup title="FX">
      <PopSlider
        label="Category glow"
        value={catGlow}
        min={0}
        max={300}
        suffix="%"
        onChange={onChangeCatGlow}
        testid="pop-cat-glow"
      />
      <div className="rounded-md hairline bg-panel/40 p-2.5"><EffectsPopSlider theme={currentTheme} value={effectsLevel} onChange={onChangeEffectsLevel} /></div>
      <BgTexturePicker textureId={bgTextureId} opacity={bgTextureOpacity} onChange={onChangeBgTextureId} onChangeOpacity={onChangeBgTextureOpacity} />
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
      </div>
      {/* end .settings-columns */}

      <div className="mt-3 h-px bg-[rgb(var(--border))]" />
      <button
        onClick={() => { onCreateCategory(); onClose(); }}
        className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] hover:bg-[rgb(var(--accent)/0.10)]"
      >
        <Plus size={13} className="text-[rgb(var(--accent))]" /> New category…
      </button>

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
  return createPortal(body, document.body);
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
  return <section className="mb-3 break-inside-avoid rounded-lg border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--panel)/0.22)] p-2 space-y-2"><div className="border-b border-[rgb(var(--border)/0.6)] pb-1 text-[9.5px] font-black uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">{title}</div>{children}</section>;
}

function DiscretePopSlider({ label, labels, value, onChange, testid }) {
  const safeValue = Math.max(0, Math.min(labels.length - 1, Number.isFinite(value) ? value : 0));
  return <div className="rounded-md hairline bg-surface/40 px-2.5 py-2"><div className="mb-1 flex items-center justify-between"><div className="text-[11px] text-ink/90">{label}</div><div className="text-[10.5px] font-bold text-[rgb(var(--accent-2))]">{labels[safeValue]}</div></div><input type="range" data-testid={testid} min={0} max={labels.length - 1} step={1} value={safeValue} onChange={(event) => onChange?.(Number(event.target.value))} className="w-full accent-[rgb(var(--accent))]" /><div className="mt-1 flex justify-between text-[8px] uppercase tracking-wider text-muted/75">{labels.map((item) => <span key={item}>{item}</span>)}</div></div>;
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


/* ---------------- Section ---------------- */
function Section({
  section, sectionIdx, collapsed, size, iconPosition, selectedId, onSelect,
  onContext, onCategoryContext, onUnlockCategory, onToggleCollapsed,
  onMoveGameToCategory, onReorderGameInCategory, onReorderCategory,
  unlockedCategories, categories,
  catTextSize = 11, catGlow = 40, rowGap = 2, catGap = 8, catTopGap = 4,
  showCategoryDot = true, categoryMarkerMode = 'dot',
  showSubcatStrip = true,
  pinnedIdsSet = new Set(),
}) {
  const isUncat = section.id === '__uncat__';
  const c = section.category;
  const color = colorFromId(c.colorId);
  const backdropOpacity = Math.round((0.10 + (Math.max(0, Math.min(300, catGlow)) / 300) * 0.55) * 255).toString(16).padStart(2, '0');
  // v1.6.5 — glow/halo sizes used to be fixed px regardless of catTextSize,
  // so a small text size + tight category gap let the bloom bleed into the
  // section above/below. Scale every glow dimension off the same slider.
  const catScale = Math.max(0.55, Math.min(1.3, (catTextSize || 11) / 11));
  // Backdrop is a real companion to the category type, rather than a fixed
  // stripe that feels oversized at small text or cramped at large text.
  const backdropPadY = Math.max(3, Math.round(6 * catScale));
  const backdropPadX = Math.max(4, Math.round(6 * catScale));
  const backdropLeft = Math.max(6, Math.round(10 * catScale));
  const backdropBorder = Math.max(1, Math.round(2 * catScale));
  // Zero truly means close: keep only a tiny collision-safe breathing room
  // for the first game, scaled with the category label so tight settings do
  // not cause a glow/header overlap.
  const firstGameGap = Math.max(Number(catTopGap) || 0, 0);
  const [hover, setHover] = React.useState(false);
  const sectionRef = React.useRef(null);

  // Drag handlers — section header acts as both drop-target for games AND drag-source for category reorder
  const onSectionDragOver = (e) => {
    const types = e.dataTransfer.types;
    if (types.includes('text/game-id') || types.includes('text/cat-id')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move';
      sectionRef.current?.classList.add('drop-target');
    }
  };
  const onSectionDragLeave = () => sectionRef.current?.classList.remove('drop-target');
  const onSectionDrop = (e) => {
    e.preventDefault();
    sectionRef.current?.classList.remove('drop-target');
    const gameId = e.dataTransfer.getData('text/game-id');
    const rawFromCat = e.dataTransfer.getData('text/game-from-cat');
    // v1.4.0 — treat the '__uncat__' sentinel as null when calling move handler
    const fromCat = (!rawFromCat || rawFromCat === '__uncat__') ? null : rawFromCat;
    const catId = e.dataTransfer.getData('text/cat-id');
    if (gameId) {
      onMoveGameToCategory(gameId, fromCat, isUncat ? null : c.id, { copy: e.ctrlKey });
      return;
    }
    if (catId && catId !== c.id && !isUncat) {
      onReorderCategory(catId, c.id);
    }
  };

  return (
    <div
      ref={sectionRef}
      style={{ marginBottom: catGap }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragOver={onSectionDragOver}
      onDragLeave={onSectionDragLeave}
      onDrop={onSectionDrop}
    >
      <div
        draggable={!isUncat && !section.isGhost}
        onDragStart={(e) => {
          if (isUncat || section.isGhost) return;
          e.dataTransfer.setData('text/cat-id', c.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onContextMenu={(e) => {
          if (isUncat) return;
          e.preventDefault();
          e.stopPropagation();
          onCategoryContext(c, { x: e.clientX, y: e.clientY });
        }}
        onClick={() => {
          if (section.isGhost) onUnlockCategory();
          else onToggleCollapsed();
        }}
        data-testid={`section-${c.id}`}
        className={cn(
          'group flex cursor-pointer select-none items-center gap-1 rounded-md px-1.5 py-1.5 transition-colors',
          'hover:bg-[rgb(var(--accent)/0.06)]'
        )}
        style={
          // v1.4.0 — when the category dot is disabled AND this isn't a ghost/
          // locked or uncategorized row, use a subtle colored backdrop stripe
          // matching the category color instead. Keeps the identity signal.
          categoryMarkerMode === 'background' && !section.isGhost && !isUncat
            ? {
                background: `linear-gradient(90deg, ${color}${backdropOpacity} 0%, ${color}24 58%, transparent 100%)`,
                borderLeft: `${backdropBorder}px solid ${color}`,
                paddingLeft: `${backdropLeft}px`,
                paddingRight: `${backdropPadX}px`,
                paddingTop: `${backdropPadY}px`,
                paddingBottom: `${backdropPadY}px`,
              }
            : undefined
        }
      >
        {/* Drag handle */}
        <span
          className={cn(
            'mr-0.5 text-muted/60 transition-opacity',
            hover && !isUncat ? 'opacity-100' : 'opacity-0'
          )}
        >
          <GripVertical size={11} />
        </span>

        {/* Expand chevron */}
        <button className="text-muted">
          {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </button>

        {/* Color/lock indicator (or launcher logo text for pinned launcher cats) */}
        {section.isGhost ? (
          <Lock size={12} className="text-[rgb(var(--accent))] pulse-ghost" />
        ) : c.logoLabel ? (
          <span
            className="shrink-0 rounded px-1 py-0.5 text-[8.5px] font-extrabold tracking-wider"
            style={{
              background: color,
              color: '#0a0414',
              boxShadow: `0 0 8px ${color}AA`,
            }}
          >
            {c.logoLabel}
          </span>
        ) : categoryMarkerMode === 'background' ? (
          // v1.4.0 — dot hidden; the section header uses a colored backdrop
          // stripe instead (see parent style). Reserve a tiny spacer so the
          // chevron alignment stays consistent.
          <span aria-hidden className="shrink-0" style={{ width: 2, height: 2 }} />
        ) : categoryMarkerMode === 'dot' ? (
          <span
            className="shrink-0 rounded-full cat-icon"
            style={{
              width: Math.round(catTextSize * 0.95),
              height: Math.round(catTextSize * 0.95),
              background: color,
              boxShadow: `0 0 ${Math.round((4 + catGlow * 0.18) * catScale)}px ${color}, 0 0 ${Math.round(catGlow * 0.35 * catScale)}px ${color}80`,
              color, // for filter:drop-shadow on hover
            }}
          />
        ) : null}

        {/* Name — applies dynamic font size + glow (catTextSize / catGlow sliders) */}
        <span
          className={cn(
            'flex-1 truncate font-display font-bold uppercase tracking-[0.18em]',
            section.isGhost ? 'text-[rgb(var(--accent))]/80' : 'text-ink/95'
          )}
          style={(() => {
            const g = Math.max(0, Math.min(300, catGlow)) / 100; // 0..3, smooth
            const base = `${catTextSize}px`;
            if (section.isGhost || isUncat || g === 0) {
              return { fontSize: base };
            }
            // v1.2.2 — bigger dynamic range so the slider actually feels
            // smooth instead of "3 levels". Layered halos: inner (crisp core),
            // outer (soft bloom), punch (far diffuse), plus a super-bright
            // core kick that only engages above ~120% for extra pop.
            const inner   = ((3 + g * 8) * catScale).toFixed(1);     // scales down at small catTextSize
            const outer   = ((10 + g * 22) * catScale).toFixed(1);
            const punch   = ((12 + g * 26) * catScale).toFixed(1);
            const coreG   = Math.max(0, g - 1.2);       // 0..1.8 kick at high glow
            const shadows = [
              `0 0 ${inner}px ${color}`,
              `0 0 ${outer}px ${color}`,
              `0 0 ${punch}px ${color}80`,
            ];
            if (coreG > 0) {
              shadows.unshift(`0 0 ${((2 + coreG * 6) * catScale).toFixed(1)}px #ffffff`);
              shadows.push(`0 0 ${((20 + coreG * 30) * catScale).toFixed(1)}px ${color}`);
            }
            return {
              fontSize: base,
              textShadow: shadows.join(', '),
              filter: g > 1.5 ? `drop-shadow(0 0 ${(g * 6 * catScale).toFixed(1)}px ${color}) brightness(${(1 + coreG * 0.15).toFixed(2)})` : undefined,
              letterSpacing: '0.2em',
            };
          })()}
        >
          {section.isGhost ? 'Private' : c.name}
        </span>

        {/* Count */}
        <span className="rounded-full bg-panel/60 hairline px-1.5 py-0.5 text-[10px] text-muted">
          {section.count}
        </span>

        {/* Kebab menu — guaranteed access to Rename / Set Private / Delete (alongside right-click) */}
        {!isUncat && (
          <button
            data-testid={`section-menu-btn-${c.id}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const r = e.currentTarget.getBoundingClientRect();
              onCategoryContext(c, { x: r.right - 8, y: r.bottom + 4 });
            }}
            title="Category options"
            className={cn(
              'ml-1 grid h-5 w-5 place-items-center rounded transition-colors',
              'text-muted/70 hover:text-ink hover:bg-[rgb(var(--accent)/0.15)]',
              hover ? 'opacity-100' : 'opacity-60'
            )}
          >
            <MoreVertical size={12} />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && !section.isGhost && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
            onAnimationComplete={(d) => {
              // Allow dropdown menus to escape the bounds after expand animation
              if (d?.height === 'auto') {
                /* noop — content is fully expanded */
              }
            }}
          >
            <div className="pl-4" style={{ overflow: 'visible', paddingTop: firstGameGap }}>
              {section.games.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-muted/70 italic">
                  Empty — drop a game here.
                </div>
              ) : (
                section.games.map((g, idx) => (
                  <GameRow
                    key={g.id}
                    g={g}
                    size={size}
                    iconPosition={iconPosition}
                    rowGap={rowGap}
                    showCategoryDot={showCategoryDot}
                    showSubcatStrip={showSubcatStrip}
                    isPinned={pinnedIdsSet.has(g.id)}
                    selected={selectedId === g.id}
                    indexInCat={idx}
                    sectionGames={section.games}
                    fromCatId={isUncat ? null : c.id}
                    onClick={() => onSelect(g.id)}
                    onContext={(action) => onContext(action, { game: g })}
                    onReorderInCat={(fromId, beforeId) =>
                      onReorderGameInCategory(isUncat ? '__uncat__' : c.id, fromId, beforeId)
                    }
                    onMoveBetween={onMoveGameToCategory}
                    categories={categories}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Game row ---------------- */
function GameRow({
  g, size, selected, onClick, onContext, fromCatId, indexInCat,
  sectionGames, onReorderInCat, onMoveBetween, categories,
  iconPosition = 'left', rowGap = 2, showCategoryDot = true, showSubcatStrip = true, isPinned = false,
}) {
  const [menu, setMenu] = React.useState({ open: false, x: 0, y: 0 });
  const ref = React.useRef(null);

  React.useEffect(() => {
    const close = (e) => {
      // Close on any click anywhere — the menu items themselves stopPropagate before closing
      setMenu((m) => (m.open ? { ...m, open: false } : m));
    };
    if (menu.open) {
      document.addEventListener('mousedown', close);
      document.addEventListener('contextmenu', close);
    }
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('contextmenu', close);
    };
  }, [menu.open]);

  const openMenuAt = (x, y) => {
    // Clamp to viewport
    const W = window.innerWidth, H = window.innerHeight;
    const w = 240, h = 320;
    setMenu({
      open: true,
      x: Math.min(x, W - w - 8),
      y: Math.min(y, H - h - 8),
    });
  };

  const isSmall = size.id === 'small';
  const isBig = size.id === 'big';
  // v1.6.5 — the gold ring used to be a fixed inset:0 regardless of text
  // size, so at very small nameTextSize the ring (sized to the full row box)
  // visually overlapped the row above/below. Scale the ring inward as the
  // font shrinks below the ~14px baseline.
  const ringScale = Math.max(0.45, Math.min(1.15, (size?.font || 13) / 14));

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.14 }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/game-id', g.id);
        // v1.4.0 — always set the from-cat key. Use '__uncat__' as the
        // sentinel for uncategorized so the reorder-vs-move check below
        // doesn't fall through to the fragile null/empty-string edge case.
        e.dataTransfer.setData('text/game-from-cat', fromCatId || '__uncat__');
        e.dataTransfer.effectAllowed = 'copyMove';
        e.currentTarget.classList.add('is-dragging');
      }}
      onDragEnd={(e) => e.currentTarget.classList.remove('is-dragging')}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('text/game-id')) return;
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.style.boxShadow = 'inset 0 2px 0 rgb(var(--accent))';
      }}
      onDragLeave={(e) => (e.currentTarget.style.boxShadow = '')}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.style.boxShadow = '';
        const gameId = e.dataTransfer.getData('text/game-id');
        // v1.4.0 — normalize both sides to the '__uncat__' sentinel so drops
        // WITHIN Uncategorized correctly enter the reorder branch.
        const rawFromCat = e.dataTransfer.getData('text/game-from-cat') || '__uncat__';
        const rawTargetCat = fromCatId || '__uncat__';
        if (!gameId || gameId === g.id) return;
        if (rawFromCat === rawTargetCat) {
          // Same category → reorder
          onReorderInCat(gameId, g.id);
        } else {
          // Move/copy across categories — drop before this game in the target cat
          onMoveBetween(gameId, rawFromCat === '__uncat__' ? null : rawFromCat, fromCatId, { copy: e.ctrlKey, beforeGameId: g.id });
        }
      }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); openMenuAt(e.clientX, e.clientY); }}
      onClick={onClick}
      data-testid={`game-row-${g.id}`}
      className={cn(
        'group relative flex cursor-pointer items-center gap-2.5 rounded-md transition-colors',
        selected ? 'bg-[rgb(var(--accent)/0.10)] text-ink' : 'text-muted hover:bg-panel/70 hover:text-ink',
        g.managedTool && g.availability !== 'installed' && 'opacity-60 grayscale-[0.3]',
        isSmall ? 'px-1.5' : 'px-2',
        Number(g.rating) === 5 && 'row-5star-shimmer'
      )}
      style={{
        minHeight: size.rowH,
        marginBottom: rowGap,
        '--ring-scale': ringScale,
        // Compress vertical padding aggressively when gap is small or negative
        paddingTop: Math.max(0, 6 + Math.min(0, rowGap) + (isBig ? 2 : 0)),
        paddingBottom: Math.max(0, 6 + Math.min(0, rowGap) + (isBig ? 2 : 0)),
        // v1.4.0 — 5-star favorite games get a subtle warm-gold gradient wash
        // behind the row. Kept intentionally soft so it never overpowers the
        // selection highlight.
        ...(Number(g.rating) === 5
          ? {
              background: selected
                ? 'linear-gradient(90deg, rgba(255,204,74,0.16) 0%, rgba(255,204,74,0.06) 55%, rgb(var(--accent) / 0.10) 100%)'
                : 'linear-gradient(90deg, rgba(255,204,74,0.11) 0%, rgba(255,204,74,0.03) 60%, transparent 100%)',
            }
          : {}),
      }}
    >
      {/* Selection bar */}
      <span
        className={cn(
          'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full',
          selected ? 'bg-[rgb(var(--accent))] shadow-[0_0_8px_rgb(var(--accent))]' : 'bg-transparent'
        )}
      />

      {/* Icon — position controlled by iconPosition setting (left | right | none) */}
      {iconPosition !== 'none' && iconPosition !== 'right' && (
        <div
          className="relative shrink-0 overflow-hidden rounded hairline bg-surface/70"
          style={{ width: size.icon, height: size.icon }}
        >
          {g.icon ? (
            <img src={g.icon} alt="" className="h-full w-full object-cover" />
          ) : g.coverUrl ? (
            <img src={g.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-[9px] text-muted">
              {(g.name || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <div className={cn('truncate font-medium', `text-[${size.font}px]`)} style={{ fontSize: size.font }}>
          {g.name || 'Untitled'}
        </div>
        {/* Genre/meta strip — shown when the "Sub-category" toggle is on and
            row size is not the compact "small" preset (where there's no room).
            Category color dots hide when the "Category dot" toggle is off. */}
        {!isSmall && showSubcatStrip && (
          <div className="flex items-center gap-1.5 truncate text-[10.5px] text-muted">
            {showCategoryDot && (g.categoryIds || []).slice(0, 3).map((cid) => {
              const cc = categories.find((x) => x.id === cid);
              if (!cc) return null;
              return (
                <span
                  key={cid}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: colorFromId(cc.colorId), boxShadow: `0 0 4px ${colorFromId(cc.colorId)}` }}
                />
              );
            })}
            <span className="truncate flex items-center gap-1">
              {g.playtime ? (
                <>
                  {(() => {
                    const src = playtimeSource(g);
                    if (!src) return null;
                    return (
                      <span
                        className="rounded px-1 py-[1px] text-[8px] font-bold tracking-wider shrink-0"
                        style={{
                          background: `${src.color}25`,
                          color: src.color,
                          border: `1px solid ${src.color}55`,
                        }}
                        title={`Playtime imported from ${src.label}`}
                        data-testid={`playtime-src-${src.id}`}
                      >
                        {src.label}
                      </span>
                    );
                  })()}
                  <span className="truncate">{formatPlaytime(g.playtime)} played</span>
                </>
              ) : (
                <span>{g.managedTool && g.availability !== 'installed' ? 'Set up required' : (g.genres?.[0] || 'Local game')}</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Icon on right side */}
      {iconPosition === 'right' && (
        <div
          className="relative shrink-0 overflow-hidden rounded hairline bg-surface/70"
          style={{ width: size.icon, height: size.icon }}
        >
          {g.icon ? (
            <img src={g.icon} alt="" className="h-full w-full object-cover" />
          ) : g.coverUrl ? (
            <img src={g.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-[9px] text-muted">
              {(g.name || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {g.managedTool && g.availability !== 'installed' && <Wrench size={12} className="shrink-0 text-[rgb(var(--accent-2))]" title="Select this tool to locate or install it" />}

      {/* Hover menu trigger */}
      <button
        data-testid={`game-row-menu-${g.id}`}
        onClick={(e) => {
          e.stopPropagation();
          const r = e.currentTarget.getBoundingClientRect();
          openMenuAt(r.right - 8, r.bottom + 4);
        }}
        className="opacity-0 group-hover:opacity-100 text-muted hover:text-ink transition-opacity"
      >
        <MoreVertical size={13} />
      </button>

      {menu.open && createPortal(
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.stopPropagation()}
          style={{ position: 'fixed', top: menu.y, left: menu.x, zIndex: 200, width: 240 }}
          className="overflow-hidden rounded-lg hairline glass shadow-2xl py-1"
        >
          <Item icon={<RefreshCw size={13} />} label="Refresh info (this game)" onClick={() => { setMenu({ ...menu, open: false }); onContext('refetch'); }} testid={`game-ctx-refetch-${g.id}`} />
          <Item icon={<Wand2 size={13} />} label="Re-search by name…" onClick={() => { setMenu({ ...menu, open: false }); onContext('research'); }} testid={`game-ctx-research-${g.id}`} />
          <Divider />
          <Item
            icon={isPinned ? <PinOff size={13} /> : <Pin size={13} />}
            label={isPinned ? 'Unpin from top' : 'Pin to top (max 5)'}
            onClick={() => { setMenu({ ...menu, open: false }); onContext(isPinned ? 'unpin' : 'pin'); }}
            testid={`game-ctx-pin-${g.id}`}
          />
          <Divider />
          <Item icon={<Pencil size={13} />} label="Rename" onClick={() => { setMenu({ ...menu, open: false }); onContext('rename'); }} testid={`game-ctx-rename-${g.id}`} />
          <Item icon={<Terminal size={13} />} label="Edit launch args" onClick={() => { setMenu({ ...menu, open: false }); onContext('args'); }} testid={`game-ctx-args-${g.id}`} />
          <Item icon={<Info size={13} />} label="Details / edit cover" onClick={() => { setMenu({ ...menu, open: false }); onContext('details'); }} testid={`game-ctx-details-${g.id}`} />
          <Divider />
          <Item icon={<Tag size={13} />} label="Manage categories…" onClick={() => { setMenu({ ...menu, open: false }); onContext('manage-categories'); }} testid={`game-ctx-cats-${g.id}`} />
          <Item icon={<FolderOpen size={13} />} label="Reveal in folder" onClick={() => { setMenu({ ...menu, open: false }); onContext('reveal'); }} testid={`game-ctx-reveal-${g.id}`} />
          <Item icon={<ArchiveRestore size={13} />} label="Save game folder…" onClick={() => { setMenu({ ...menu, open: false }); onContext('save-games'); }} testid={`game-ctx-save-games-${g.id}`} />
          {g.launchDoctorSuggested && <Item icon={<Stethoscope size={13} />} label="Launch Doctor" onClick={() => { setMenu({ ...menu, open: false }); onContext('launch-doctor'); }} testid={`game-ctx-launch-doctor-${g.id}`} />}
          <Divider />
          <Item icon={<RotateCcw size={13} />} label="Reset playtime to 0" onClick={() => { setMenu({ ...menu, open: false }); onContext('reset-playtime'); }} testid={`game-ctx-reset-playtime-${g.id}`} />
          <Item icon={<RefreshCw size={13} />} label="Re-import from Steam" onClick={() => { setMenu({ ...menu, open: false }); onContext('reimport-steam'); }} testid={`game-ctx-reimport-steam-${g.id}`} />
          <Divider />
          <Item icon={<Trash2 size={13} />} label="Remove from library" danger onClick={() => { setMenu({ ...menu, open: false }); onContext('remove'); }} testid={`game-ctx-remove-${g.id}`} />
        </motion.div>,
        document.body
      )}
    </motion.div>
  );
}

function Item({ icon, label, onClick, testid, danger }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs transition-colors',
        danger ? 'text-red-400 hover:bg-red-500/10' : 'text-ink hover:bg-[rgb(var(--accent)/0.10)]'
      )}
    >
      <span className="text-muted">{icon}</span>
      {label}
    </button>
  );
}

function Divider() {
  return <div className="my-1 h-px bg-[rgb(var(--border))]" />;
}

/* ---------------- Category context menu ---------------- */
export function CategoryContextMenu({ open, anchor, category, onClose, onAction }) {
  const ref = React.useRef(null);
  const dragControls = useDragControls();
  React.useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && ref.current.contains(e.target)) return;
      onClose();
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('contextmenu', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('contextmenu', close);
    };
  }, [open, onClose]);

  if (!open || !category || !anchor) return null;

  const items = [
    { icon: <Pencil size={13} />, label: 'Rename / recolor', action: 'edit' },
    category.private
      ? { icon: <EyeOff size={13} />, label: 'Remove privacy', action: 'remove-private' }
      : { icon: <Lock size={13} />, label: 'Set as private (Ghost)…', action: 'set-private' },
    { icon: <ArrowUp size={13} />, label: 'Move up', action: 'up' },
    { icon: <ArrowDown size={13} />, label: 'Move down', action: 'down' },
    { divider: true },
    { icon: <Trash2 size={13} />, label: 'Delete category', action: 'delete', danger: true },
  ];

  return createPortal(
    <motion.div
      ref={ref}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ position: 'fixed', top: anchor.y, left: anchor.x, zIndex: 200 }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
      data-testid="category-context-menu"
      className="w-56 overflow-hidden rounded-lg hairline glass shadow-2xl py-1"
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-move px-3 pt-1 pb-2 text-[10px] uppercase tracking-wider text-muted select-none flex items-center gap-1.5"
        title="Drag to move"
      >
        <GripVertical size={10} /> {category.name}
      </div>
      {items.map((it, i) =>
        it.divider ? (
          <Divider key={i} />
        ) : (
          <Item
            key={it.action}
            icon={it.icon}
            label={it.label}
            danger={it.danger}
            testid={`cat-ctx-${it.action}-${category.id}`}
            onClick={() => onAction(it.action)}
          />
        )
      )}
    </motion.div>,
    document.body
  );
}


/* ---------------- Pinned strip ---------------- */
/**
 * PinnedStrip — horizontal row of pinned games shown above ALL categories.
 * Stays full-width above both columns in two-row mode (it's rendered outside
 * the column-split logic). Max 5 enforced by App.jsx on pin action.
 */
function PinnedStrip({ games, selectedId, onSelect, onContext }) {
  if (!games || games.length === 0) return null;
  return (
    <div
      className="mb-2 mt-1 rounded-md hairline bg-panel/40 px-2 py-1.5"
      data-testid="pinned-strip"
    >
      <div className="mb-1 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.22em] text-muted">
          <Pin size={9} className="text-[rgb(var(--accent))]" />
          Pinned
        </div>
        <div className="text-[9px] text-muted/60">{games.length}/5</div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {games.map((g) => (
          <button
            key={g.id}
            data-testid={`pinned-tile-${g.id}`}
            onClick={() => onSelect(g.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              onContext('open-menu', g, { x: e.clientX, y: e.clientY });
            }}
            className={cn(
              'group relative flex items-center gap-1.5 rounded-md px-2 h-7 text-[10.5px] font-medium transition-all',
              selectedId === g.id
                ? 'bg-[rgb(var(--accent)/0.18)] text-ink shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.55)]'
                : 'bg-surface/40 text-muted hover:text-ink hover:bg-[rgb(var(--accent)/0.10)]'
            )}
            style={{ maxWidth: 140 }}
            title={g.name}
          >
            <span className="h-4 w-4 shrink-0 overflow-hidden rounded-sm hairline bg-surface/60">
              {(g.icon || g.coverUrl) ? (
                <img src={g.icon || g.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-[7px] text-muted">
                  {(g.name || '?').slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
            <span className="truncate">{g.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
