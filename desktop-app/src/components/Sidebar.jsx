import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, ChevronDown, Tag, ArrowDownUp, Moon, Sun,
  Library as LibIcon, Boxes, CheckSquare, Columns, Home, Check, ListTree, X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import SystemHealthBar from './SystemHealthBar';
import LibraryVisualsPopover from './library/LibraryVisualsPopover';
import LibraryIconGrid from './library/LibraryIconGrid';
import AppControlMenu from './library/AppControlMenu';
import { libraryFontFamily } from './library/library-visual-model.mjs';
import { LibraryGameRow, LibrarySection, PinnedStrip, TwoColumnSections } from './library/LibraryTree';
import { LauncherDropdown, SideBtn, TabPill } from './library/LibraryToolbarControls';
import { JOURNEY_STATUSES } from '../lib/game-journey-model.mjs';

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

// A quiet copy of the active theme art gives the Library its own atmosphere
// without turning the sidebar into a second Home canvas. It is intentionally
// much dimmer than the main backdrop and disappears with visual effects.
const SIDEBAR_THEME_ART = {
  synthwave: 'synthwave-atmosphere.png',
  'synthwave-day': 'synthwave-day-atmosphere.png',
  midnight: 'midnight-atmosphere.png', daybreak: 'daybreak-atmosphere.png',
  mint: 'mint-atmosphere.png', ocean: 'ocean-atmosphere.png', crimson: 'crimson-atmosphere.png',
  anime: 'anime-atmosphere.png', gaming: 'gaming-atmosphere.png', modern: 'modern-atmosphere.png',
  colorful: 'colorful-atmosphere.png', pro: 'industrial-atmosphere.png', home: 'home-atmosphere.png',
  'generic-gray': 'generic-gray-atmosphere.png', 'generic-blue': 'generic-blue-atmosphere.png',
  monochrome: 'generic-gray-atmosphere.png',
};

/**
 * Sidebar (tree view)
 * - Top toolbar: Wizard · Library settings (size, etc.) · App settings
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
  unlockedCategories, search, selectedId,
  mode, onSetMode,
  launcherFilter = 'all',
  onSetLauncherFilter,
  iconPosition = 'left', rowSize = 44, catTextSize = 11, catGlow = 40,
  rowGap = 2, catGap = 8, catTopGap = 4,
  showCategoryDot = true, categoryMarkerMode = 'dot',
  showSubcatStrip = true,
  nameTextSize = null,
  libraryFont = 'system', libraryFontWeight = 'regular', libraryFontCursive = false,
  effectsLevel = 2, currentTheme = 'synthwave', motionCadence = 'full', onChangeEffectsLevel, onChangeMotionCadence,
  unseenNewsCount = 0,
  pinnedIds = [],
  collectionCategories = [], onBulkFavorite, onBulkJourneyStatus, onBulkAddCategory,
  onChangeRowSize, onChangeCatTextSize, onChangeCatGlow, onChangeIconPosition,
  onChangeRowGap, onChangeCatGap, onChangeCatTopGap, onChangeCategoryMarkerMode,
  onToggleSubcatStrip, onChangeNameTextSize,
  onChangeLibraryFont, onChangeLibraryFontWeight, onChangeLibraryFontCursive,
  bgTextureId, bgTextureOpacity,
  onChangeBgTextureId, onChangeBgTextureOpacity,
  cursorTheme = 'windows', onChangeCursorTheme,
  navigationLayout = 'top', onChangeNavigationLayout,
  onSelect, onGameViewed,
  onAddManual, onOpenWizard, manualResting = false, onToggleManualRest, onOpenFeedback,
  onCreateCategory, onCategoryContext, onGameContext,
  onMoveGameToCategory,
  onReorderGameInCategory, onReorderCategory,
  onToggleCollapsed, onUnlockCategory,
  onAutoSort,
  twoRow = false, onToggleTwoRow,
  libraryIconMode = false, libraryIconSize = 48, libraryIconSpacing = 8, libraryIconRows = 3,
  onToggleLibraryIconMode, onChangeLibraryIconSize, onChangeLibraryIconSpacing, onChangeLibraryIconRows,
  showCategories = true, onToggleCategories, onManageCategories,
  librarySortMode = 'manual', onChangeLibrarySort,
  libraryViewMode = 'preview', onChangeLibraryViewMode,
  tutorialVisualsOpen = false,
  sidebarWidth = 320,
  onStartResize,
  gameResting = false,
  restReason = '',
  navDecorationOpacity = 0.46,
  runningGameName = '',
  allGames = [],
  onOpenSettings,
  onOpenThemes,
  onOpenMascot,
  onOpenControllerCenter,
  onOpenChangelog,
  onCheckForUpdates,
  onQuit,
  onSystemHealthChange,
  systemHealthOpenRequest = 0,
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
  const [categoriesMenuOpen, setCategoriesMenuOpen] = React.useState(false);
  const [sortMenuOpen, setSortMenuOpen] = React.useState(false);
  const categoriesMenuRef = React.useRef(null);
  const sortMenuRef = React.useRef(null);
  const treeScrollRef = React.useRef(null);
  const isTools = mode === 'tools';
  const sideNavigation = navigationLayout === 'sidebar';
  const [sideNavigationExpanded, setSideNavigationExpanded] = React.useState(false); const [selectionMode, setSelectionMode] = React.useState(false); const [selectedIds, setSelectedIds] = React.useState([]);
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
  const selectGame = React.useCallback((id) => {
    onGameViewed?.(id);
    onSelect?.(id);
  }, [onGameViewed, onSelect]);
  const selectedIdSet = React.useMemo(() => new Set(selectedIds), [selectedIds]); const handleGameClick = React.useCallback((id) => !selectionMode ? selectGame(id) : setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]), [selectGame, selectionMode]); const startSelection = () => { setSelectedIds([]); setSelectionMode(true); }; const finishSelection = () => { setSelectedIds([]); setSelectionMode(false); };
  // Every small Library popover follows the same simple escape hatch: click
  // anywhere outside it (or press Escape) and it goes away.
  React.useEffect(() => {
    if (!categoriesMenuOpen && !sortMenuOpen) return undefined;
    const close = (event) => {
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(event.target)) setCategoriesMenuOpen(false);
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) setSortMenuOpen(false);
    };
    const escape = (event) => { if (event.key === 'Escape') { setCategoriesMenuOpen(false); setSortMenuOpen(false); } };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, [categoriesMenuOpen, sortMenuOpen]);

  // Tutorial controls Visuals directly, rather than synthetically clicking
  // the toggle. That avoids a timer race which used to leave it flickering or
  // open after the tutorial moved on. Normal player clicks remain unchanged.
  React.useEffect(() => {
    setLibSettingsOpen(Boolean(tutorialVisualsOpen));
  }, [tutorialVisualsOpen]);

  // Library reference used by the PinnedStrip (it pulls full game objects by id).
  // We keep it as a plain object since we only need it inside the render.
  const library = { games };
  const sortGames = (list) => {
    const stable = [...list].map((game, index) => ({ game, index }));
    const numeric = (value) => Number(value || 0);
    const compareName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' });
    stable.sort((a, b) => {
      let result = 0;
      if (librarySortMode === 'alphabetical') result = compareName(a.game, b.game);
      else if (librarySortMode === 'added') result = numeric(b.game.addedAt) - numeric(a.game.addedAt);
      else if (librarySortMode === 'rating') result = numeric(b.game.rating) - numeric(a.game.rating);
      else if (librarySortMode === 'played') result = numeric(b.game.playtime) - numeric(a.game.playtime);
      else if (librarySortMode === 'recent') result = numeric(b.game.lastPlayedAt) - numeric(a.game.lastPlayedAt);
      if (librarySortMode === 'manual') return a.index - b.index;
      return result || compareName(a.game, b.game) || a.index - b.index;
    });
    return stable.map((entry) => entry.game);
  };

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
    return sortGames([...ordered, ...byId.values()]);
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
      // A locked shelf needs one unmistakable lock, not a chain of lock
      // emojis/badges competing with its actual Unlock action. Keep the
      // protected game count private until the player unlocks it.
      return { id: c.id, category: c, isGhost, games: list, count: isGhost ? '' : list.length };
    }),
    {
      id: '__uncat__',
      category: { id: '__uncat__', name: isTools ? 'Unsorted' : 'Uncategorized', colorId: 'slate' },
      isGhost: false,
      games: searchFilter(orderedGamesIn('__uncat__')),
      count: orderedGamesIn('__uncat__').length,
    },
  ];
  const lockedPrivateIds = new Set(categories.filter((category) => category.private && !unlockedCategories.includes(category.id)).map((category) => category.id));
  const flatGames = sortGames(searchFilter(games).filter((game) => !(game.categoryIds || []).some((categoryId) => lockedPrivateIds.has(categoryId)) && !pinnedIdsSet.has(game.id)));
  const visibleIconGames = sortGames(searchFilter(games).filter((game) => !(game.categoryIds || []).some((categoryId) => lockedPrivateIds.has(categoryId))));
  const lockedPrivateSections = sections.filter((section) => section.category.private && section.isGhost);
  const visiblePinnedGames = games.filter((game) => pinnedIdsSet.has(game.id) && !(game.categoryIds || []).some((categoryId) => lockedPrivateIds.has(categoryId)));

  return (
    <aside
      className="library-font-scope relative flex h-full shrink-0 flex-col overflow-hidden border-r hairline glass-soft"
      style={{
        width: sidebarWidth,
        paddingLeft: sideNavigation ? 48 : 0,
        transition: 'padding-left 180ms ease',
        '--library-font-family': libraryFontFamily(libraryFont),
        // Regular must feel genuinely lighter than the old semi-bold Library
        // treatment. Fat is the intentional opt-in weight, not the baseline.
        '--library-font-weight': libraryFontWeight === 'fat' ? 800 : 400,
        '--library-font-style': libraryFontCursive ? 'italic' : 'normal',
      }}
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
      {Number(effectsLevel) > 0 && SIDEBAR_THEME_ART[currentTheme] && (
        <span
          aria-hidden
          className={`sidebar-theme-art ${motionCadence === 'calm' ? '' : 'sidebar-theme-art-drift'}`}
          style={{
            opacity: Math.min(0.12, 0.035 + (Number(effectsLevel) * 0.022)),
            backgroundImage: `url(${import.meta.env.BASE_URL}theme-art/${SIDEBAR_THEME_ART[currentTheme]})`,
          }}
          data-testid="sidebar-theme-art"
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
      {sideNavigation && <SideNavigationRail
        expanded={sideNavigationExpanded}
        onExpandedChange={setSideNavigationExpanded}
        mode={mode}
        libraryViewMode={libraryViewMode}
        onOpenHome={() => { onSelect?.(null); onSetMode('home'); }}
        onOpenLibrary={() => { onChangeLibraryViewMode?.('preview'); onSetMode('library'); onSetLauncherFilter?.('all'); }}
        onOpenWall={() => { onChangeLibraryViewMode?.('wall'); onSelect?.(null); }}
        onOpenTools={() => onSetMode('tools')}
        onOpenThemes={onOpenThemes}
        onOpenMascot={onOpenMascot}
        onOpenVisuals={() => setLibSettingsOpen(true)}
        onOpenControllers={onOpenControllerCenter}
        onOpenSettings={onOpenSettings}
        onOpenChangelog={onOpenChangelog}
        onCheckForUpdates={onCheckForUpdates}
        onOpenFeedback={() => onOpenFeedback?.('feedback')}
        onQuit={onQuit}
        onDisableSidebar={() => onChangeNavigationLayout?.('top')}
      />}
      {/* Top toolbar — Home / Library / Tools. Frosted band that stretches
          across the sidebar, gradient underline separates it from category tree.
          v1.6.3 — Labels collapse to icon-only when the sidebar is dragged
          under ~340px so nothing gets truncated to a single letter. */}
      {!sideNavigation && (() => {
        return (
      <div
        className="special-control-surface neolib-special-nav-art relative z-40 flex items-stretch gap-1 px-2 pt-2.5 pb-2"
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
        <AppControlMenu
          onOpenThemes={onOpenThemes}
          onOpenMascot={onOpenMascot}
          onOpenVisuals={() => setLibSettingsOpen(true)}
          onOpenControllers={onOpenControllerCenter}
          onOpenSettings={onOpenSettings}
          onOpenChangelog={onOpenChangelog}
          onCheckForUpdates={onCheckForUpdates}
          onOpenFeedback={() => onOpenFeedback?.('feedback')}
          onQuit={onQuit}
          sidebarEnabled={sideNavigation}
          onToggleSidebar={(enabled) => onChangeNavigationLayout?.(enabled ? 'sidebar' : 'top')}
        />
        <TabPill decorationTheme={currentTheme} decorationOpacity={gameResting ? 0 : navDecorationOpacity} label="Home" icon={<Home size={15} />} showLabel={labelsVisible} labelStyle={toolbarLabelStyle} active={mode === 'home'} onClick={() => { onSelect?.(null); onSetMode('home'); }} testid="tab-home" />
        <TabPill decorationTheme={currentTheme} decorationOpacity={gameResting ? 0 : navDecorationOpacity} label="Library" icon={<LibIcon size={15} />} showLabel={labelsVisible} labelStyle={toolbarLabelStyle} active={mode === 'library' && libraryViewMode !== 'wall'} onClick={() => { onChangeLibraryViewMode?.('preview'); onSetMode('library'); onSetLauncherFilter?.('all'); }} testid="tab-library" />
        <TabPill decorationTheme={currentTheme} decorationOpacity={gameResting ? 0 : navDecorationOpacity} label="Wall" icon={<Columns size={15} />} showLabel={labelsVisible} labelStyle={toolbarLabelStyle} active={mode === 'library' && libraryViewMode === 'wall'} onClick={() => { onChangeLibraryViewMode?.('wall'); onSelect?.(null); }} testid="tab-cover-wall" />
        <TabPill
          decorationTheme={currentTheme}
          decorationOpacity={gameResting ? 0 : navDecorationOpacity}
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

      {/* Toolbar row 2 — Wizard / (flex) / Visuals / TwoRow.
          Labels collapse to icon-only when the sidebar is especially narrow so the
          row stays tidy without wrapping or truncating. */}
      {(() => {
        return (
      <div
        className="relative z-40 flex items-center gap-1.5 p-3 pt-2"
        style={{
          // v1.6.4 — Match the darker top-toolbar band so both rows read as
          // one continuous chrome zone (not two "just game rows in disguise").
          background: 'linear-gradient(180deg, rgb(0 0 0 / 0.20) 0%, rgb(0 0 0 / 0.08) 100%)',
        }}
      >
        {isTools ? (
          <SideBtn label={labelsVisible ? "Add tool" : null} labelStyle={toolbarLabelStyle} icon={<Wand2 size={16} />} onClick={onAddManual} testid="sidebar-add-tool-btn" title="Add tool" />
        ) : (
          <SideBtn label={labelsVisible ? "Wizard" : null} labelStyle={toolbarLabelStyle} icon={<Wand2 size={16} />} onClick={onOpenWizard} testid="sidebar-wizard-btn" title="Add games, scan folders, or import launchers" />
        )}
        <button
          type="button"
          data-testid="sidebar-rest-toggle"
          onClick={onToggleManualRest}
          title={manualResting ? 'Wake NEO-LIB and resume background activity' : 'Rest NEO-LIB and pause non-essential background activity'}
          aria-pressed={manualResting}
          className="library-toolbar-control group inline-flex h-8 items-center gap-1.5 rounded-md hairline px-3 text-[12px] font-semibold text-ink/90 transition-all hover:text-ink"
          style={manualResting ? {
            borderColor: 'rgb(var(--accent) / 0.92)',
            boxShadow: '0 0 14px rgb(var(--accent) / 0.48), inset 0 0 0 1px rgb(var(--accent) / 0.22)',
            background: 'rgb(var(--accent) / 0.12)',
          } : undefined}
        >
          <span className="text-[rgb(var(--accent))] transition-transform group-hover:scale-110">
            {manualResting ? <Sun size={16} /> : <Moon size={16} />}
          </span>
          {labelsVisible && <span className="overflow-hidden whitespace-nowrap" style={toolbarLabelStyle}>{manualResting ? 'Wake up' : 'Rest Zzz'}</span>}
        </button>
        {!isTools && <button type="button" data-testid="sidebar-select-games" onClick={selectionMode ? finishSelection : startSelection} className={cn('library-toolbar-control inline-flex h-8 items-center gap-1.5 rounded-md hairline px-2 text-[10px] font-semibold transition-colors', selectionMode ? 'border-[rgb(var(--accent)/0.72)] bg-[rgb(var(--accent)/0.12)] text-ink' : 'text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink')} title={selectionMode ? 'Leave selection mode' : 'Select several games'}><CheckSquare size={14} />{labelsVisible && <span style={toolbarLabelStyle}>{selectionMode ? 'Done' : 'Select'}</span>}</button>}
        <div className="flex-1" />
        <AnimatePresence>
          {libSettingsOpen && (
            <LibraryVisualsPopover
                anchorEl={libSettingsBtnRef.current}
                sidebarWidth={sidebarWidth}
                rowSize={rowSize}
                catTextSize={catTextSize}
                catGlow={catGlow}
                rowGap={rowGap}
                catGap={catGap}
                catTopGap={catTopGap}
                iconPosition={iconPosition}
                categoryMarkerMode={categoryMarkerMode}
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
                libraryFont={libraryFont}
                libraryFontWeight={libraryFontWeight}
                libraryFontCursive={libraryFontCursive}
                onChangeLibraryFont={onChangeLibraryFont}
                onChangeLibraryFontWeight={onChangeLibraryFontWeight}
                onChangeLibraryFontCursive={onChangeLibraryFontCursive}
                effectsLevel={effectsLevel}
                currentTheme={currentTheme}
                onChangeEffectsLevel={onChangeEffectsLevel}
                motionCadence={motionCadence}
                onChangeMotionCadence={onChangeMotionCadence}
                bgTextureId={bgTextureId}
                bgTextureOpacity={bgTextureOpacity}
                onChangeBgTextureId={onChangeBgTextureId}
                onChangeBgTextureOpacity={onChangeBgTextureOpacity}
                cursorTheme={cursorTheme}
                onChangeCursorTheme={onChangeCursorTheme}
                navigationLayout={navigationLayout}
                onChangeNavigationLayout={onChangeNavigationLayout}
                onClose={() => setLibSettingsOpen(false)}
                onOpenFeedback={onOpenFeedback}
                twoRow={twoRow}
                onToggleTwoRow={onToggleTwoRow}
                libraryIconMode={libraryIconMode}
                libraryIconSize={libraryIconSize}
                libraryIconSpacing={libraryIconSpacing}
                libraryIconRows={libraryIconRows}
                onToggleLibraryIconMode={onToggleLibraryIconMode}
                onChangeLibraryIconSize={onChangeLibraryIconSize}
                onChangeLibraryIconSpacing={onChangeLibraryIconSpacing}
                onChangeLibraryIconRows={onChangeLibraryIconRows}
              />
          )}
        </AnimatePresence>
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
          horizontal clutter. Category creation stays in the Categories menu,
          while every game-add route starts in Wizard. */}
      {!isTools && (
        <div className="relative z-40 flex items-center gap-1 px-3 pb-2" data-testid="launcher-pane-row">
          <LauncherDropdown
            value={launcherFilter || 'all'}
            onChange={(v) => onSetLauncherFilter?.(v)}
          />
          <div className="flex-1 min-w-[6px]" />
          <div ref={sortMenuRef} className="relative shrink-0">
            <button
              type="button"
              data-testid="sidebar-sort-menu"
              onClick={() => setSortMenuOpen((open) => !open)}
              title={showCategories ? 'Sort games inside every visible category' : 'Sort all visible games'}
              className={`library-toolbar-control inline-flex items-center gap-1 rounded-md hairline px-2 h-6 text-[10px] transition-colors ${sortMenuOpen || librarySortMode !== 'manual' ? 'border-[rgb(var(--accent)/0.72)] text-ink' : 'text-ink/85 hover:text-ink hover:border-[rgb(var(--accent)/0.62)]'}`}
            >
              <ArrowDownUp size={10} /> Sort <ChevronDown size={10} className={sortMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
            <AnimatePresence>
              {sortMenuOpen && (
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="library-toolbar-popover absolute right-0 z-30 mt-1 w-52 rounded-lg hairline p-1.5 shadow-2xl">
                  <div className="px-2.5 py-1.5"><p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted">{showCategories ? 'Sort each category' : 'Sort all visible games'}</p></div>
                  {[
                    ['manual', 'Custom order', 'Keep your own drag order'],
                    ['alphabetical', 'Alphabetical', 'A to Z'],
                    ['added', 'Date added', 'Newest first'],
                    ['rating', 'My rating', 'Highest first'],
                    ['played', 'Most played', 'Most hours first'],
                    ['recent', 'Last played', 'Most recent first'],
                  ].map(([value, label, hint]) => <button key={value} type="button" onClick={() => { onChangeLibrarySort?.(value); setSortMenuOpen(false); }} className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left hover:bg-[rgb(var(--accent)/0.09)] ${librarySortMode === value ? 'bg-[rgb(var(--accent)/0.12)] text-ink' : 'text-muted'}`}><span><span className="block text-[11px] font-semibold">{label}</span><span className="block text-[9.5px] text-muted">{hint}</span></span>{librarySortMode === value && <Check size={13} className="shrink-0 text-[rgb(var(--accent-2))]" />}</button>)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div ref={categoriesMenuRef} className="relative shrink-0">
            <button
              data-testid="sidebar-category-quick-switch"
              onClick={() => setCategoriesMenuOpen((open) => !open)}
              title="Categories — show shelves or manage your categories"
              className={`library-toolbar-control inline-flex items-center gap-1 rounded-md hairline px-2 h-6 text-[10px] transition-colors ${categoriesMenuOpen ? 'border-[rgb(var(--accent)/0.72)] text-ink' : 'text-ink/85 hover:text-ink hover:border-[rgb(var(--accent)/0.62)]'}`}
            >
              {showCategories ? <ListTree size={10} /> : <Boxes size={10} />}
              Categories <ChevronDown size={10} className={categoriesMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
            <AnimatePresence>
              {categoriesMenuOpen && (
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="library-toolbar-popover absolute right-0 z-30 mt-1 w-64 rounded-lg hairline p-1.5 shadow-2xl">
                  <div className="px-2.5 py-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Library categories</p>
                  </div>
                  <button
                    data-testid="categories-menu-visibility-switch"
                    onClick={() => onToggleCategories?.(!showCategories)}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left hover:bg-[rgb(var(--accent)/0.08)]"
                  >
                    <span><span className="block text-xs font-semibold text-ink">Show category shelves</span><span className="block pt-0.5 text-[10.5px] leading-snug text-muted">Off shows one flat list; Private stays hidden.</span></span>
                    <span className={`inline-flex h-6 min-w-12 items-center rounded-full p-0.5 transition-colors ${showCategories ? 'justify-end bg-[rgb(var(--accent))]' : 'justify-start bg-black/35 hairline'}`} aria-label={showCategories ? 'Categories on' : 'Categories off'}>
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[8px] font-black text-black shadow">{showCategories ? 'ON' : 'OFF'}</span>
                    </span>
                  </button>
                  <button
                    data-testid="categories-menu-manage"
                    onClick={() => { setCategoriesMenuOpen(false); onManageCategories?.(); }}
                    className="flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left hover:bg-[rgb(var(--accent-2)/0.08)]"
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold text-ink"><Tag size={12} className="text-[rgb(var(--accent-2))]" />Manage categories</span>
                    <span className="text-[10.5px] leading-snug text-muted">Add, edit, or remove groups. Games are kept safely.</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {onAutoSort && (
            <button
              data-testid="sidebar-autosort-btn"
              onClick={onAutoSort}
              title="Smart auto-sort into 6 default categories"
              className="library-toolbar-control inline-flex shrink-0 items-center gap-1 rounded-md hairline px-2 h-6 text-[10px] text-ink/85 hover:text-ink hover:border-[rgb(var(--accent)/0.62)]"
            >
              <Wand2 size={10} /> Auto-sort
            </button>
          )}
        </div>
      )}

      {/* Tools mode keeps the simple label + auto-sort/new-category row */}
      {isTools && (
        <div className="flex items-center justify-between px-4 pb-2">
          <span className="text-[10px] uppercase tracking-[0.28em] text-muted">Tools</span>
        </div>
      )}

      {!isTools && selectionMode && <LibrarySelectionBar count={selectedIds.length} categories={collectionCategories} onDone={finishSelection} onFavorite={(favorite) => onBulkFavorite?.(selectedIds, favorite)} onJourneyStatus={(journeyStatus) => onBulkJourneyStatus?.(selectedIds, journeyStatus)} onAddCategory={(categoryId) => onBulkAddCategory?.(selectedIds, categoryId)} />}
      {/* Tree — single column or two-column (categories never split between columns).
          v1.2.2 — auto-scroll while dragging a game near the top/bottom edges so
          long libraries are actually reachable during a drag operation. */}
      <div
        ref={treeScrollRef}
        className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-2 pb-24"
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
        {libraryIconMode ? (
          <LibraryIconGrid
            games={visibleIconGames}
            selectedId={selectedId}
            iconSize={libraryIconSize}
            spacing={libraryIconSpacing}
            rows={libraryIconRows}
            categories={categories}
            onSelect={handleGameClick}
            onGameContext={onGameContext}
            selectionMode={selectionMode}
            selectedIds={selectedIdSet}
          />
        ) : <>
        {/* Pinned strip — full-width, sits above all categories in both single & two-row modes */}
        <PinnedStrip
          games={visiblePinnedGames}
          selectedId={selectedId}
          onSelect={handleGameClick}
          onContext={onGameContext}
          selectionMode={selectionMode}
          selectedIds={selectedIdSet}
        />
        {!showCategories ? (
          <>
            <div className="pb-2" data-testid="sidebar-flat-game-list">
              <p className="px-2.5 pb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted">All visible games · private stays protected</p>
              {flatGames.map((g, idx) => (
                <LibraryGameRow
                  key={g.id}
                  g={g}
                  size={size}
                  iconPosition={iconPosition}
                  rowGap={rowGap}
                  showCategoryDot={false}
                  showSubcatStrip={showSubcatStrip}
                  isPinned={false}
                  selected={selectedIdSet.has(g.id) || (!selectionMode && selectedId === g.id)}
                  selectionMode={selectionMode}
                  indexInCat={idx}
                  sectionGames={flatGames}
                  fromCatId={null}
                  flatList
                  onClick={() => handleGameClick(g.id)}
                  onContext={(action) => onGameContext(action, g)}
                  onReorderInCat={() => {}}
                  onMoveBetween={() => {}}
                  categories={categories}
                />
              ))}
              {!flatGames.length && <div className="px-3 py-3 text-[11px] italic text-muted/75">No visible games match this view.</div>}
            </div>
            {lockedPrivateSections.map((s, sectionIdx) => (
              <LibrarySection
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
                onSelect={handleGameClick}
                selectionMode={selectionMode}
                selectedIds={selectedIdSet}
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
            ))}
          </>
        ) : twoRow ? (
          <TwoColumnSections sections={sections} commonProps={{
            collapsed, size, iconPosition, catTextSize, catGlow, rowGap, catGap, catTopGap, selectedId,
            showCategoryDot, categoryMarkerMode, showSubcatStrip, pinnedIdsSet,
            onSelect: handleGameClick, onGameContext, onCategoryContext, onUnlockCategory, onToggleCollapsed,
            onMoveGameToCategory, onReorderGameInCategory, onReorderCategory,
            unlockedCategories, categories, selectionMode, selectedIds: selectedIdSet,
          }} />
        ) : (
          sections.map((s, sectionIdx) => (
            <LibrarySection
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
              onSelect={handleGameClick}
              selectionMode={selectionMode}
              selectedIds={selectedIdSet}
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
        </>}
        {games.length === 0 && (
          <div className="mt-8 px-4 text-center text-xs text-muted">
            No games yet. Add one or run the Wizard.
          </div>
        )}
      </div>
      {!isTools && <SystemHealthBar resting={gameResting} runningGameName={runningGameName} restReason={restReason} games={allGames} onStatusChange={onSystemHealthChange} openRequest={systemHealthOpenRequest} />}
    </aside>
  );
}

function LibrarySelectionBar({ count, categories, onDone, onFavorite, onJourneyStatus, onAddCategory }) {
  return <div data-testid="sidebar-collection-actions" className="mx-3 mb-2 flex flex-wrap items-center gap-1 rounded-lg border border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--accent)/0.09)] p-1.5"><span className="px-1 text-[9px] font-bold text-ink">{count} selected</span><button type="button" disabled={!count} onClick={() => onFavorite(true)} className="rounded-md px-2 py-1 text-[9px] font-bold text-muted hover:bg-[rgb(var(--accent)/0.16)] hover:text-ink disabled:opacity-35">Favorite</button><button type="button" disabled={!count} onClick={() => onFavorite(false)} className="rounded-md px-2 py-1 text-[9px] font-bold text-muted hover:bg-[rgb(var(--accent)/0.16)] hover:text-ink disabled:opacity-35">Unfavorite</button><select aria-label="Add selected Library games to a category" disabled={!count || !categories.length} defaultValue="" onChange={(event) => { if (event.target.value) onAddCategory(event.target.value); event.target.value = ''; }} className="h-7 min-w-0 max-w-28 rounded-md bg-transparent px-1 text-[9px] font-bold text-muted outline-none disabled:opacity-35"><option value="">Add to…</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><select aria-label="Set Journey Status for selected Library games" disabled={!count} defaultValue="" onChange={(event) => { if (event.target.value) onJourneyStatus(event.target.value); event.target.value = ''; }} className="h-7 min-w-0 flex-1 rounded-md bg-transparent px-1 text-[9px] font-bold text-muted outline-none disabled:opacity-35"><option value="">Set status…</option>{JOURNEY_STATUSES.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select><button type="button" onClick={onDone} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-[rgb(var(--accent)/0.16)] hover:text-ink" title="Leave selection mode"><X size={12} /></button></div>;
}

function SideNavigationRail({ expanded, onExpandedChange, mode, libraryViewMode, onOpenHome, onOpenLibrary, onOpenWall, onOpenTools, onOpenThemes, onOpenMascot, onOpenVisuals, onOpenControllers, onOpenSettings, onOpenChangelog, onCheckForUpdates, onOpenFeedback, onQuit, onDisableSidebar }) {
  return <nav
    data-testid="side-navigation-rail"
    aria-label="Primary navigation"
    onMouseEnter={() => onExpandedChange?.(true)}
    onMouseLeave={() => onExpandedChange?.(false)}
    className="absolute inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-[rgb(var(--border)/0.8)] bg-[rgb(var(--surface)/0.97)] px-1.5 py-2 shadow-[8px_0_24px_-20px_rgba(0,0,0,.95)] backdrop-blur-xl transition-[width] duration-200 ease-out"
    style={{ width: expanded ? 148 : 48 }}
  >
    <AppControlMenu
      sidebarMode
      sidebarExpanded={expanded}
      sidebarEnabled
      onToggleSidebar={(enabled) => { if (!enabled) onDisableSidebar?.(); }}
      onOpenThemes={onOpenThemes}
      onOpenMascot={onOpenMascot}
      onOpenVisuals={onOpenVisuals}
      onOpenControllers={onOpenControllers}
      onOpenSettings={onOpenSettings}
      onOpenChangelog={onOpenChangelog}
      onCheckForUpdates={onCheckForUpdates}
      onOpenFeedback={onOpenFeedback}
      onQuit={onQuit}
    />
    <span className="mx-1 my-2 h-px shrink-0 bg-[rgb(var(--border)/0.65)]" />
    <RailNavigationButton icon={<Home size={17} />} label="Home" expanded={expanded} active={mode === 'home'} onClick={onOpenHome} testid="tab-home" />
    <RailNavigationButton icon={<LibIcon size={17} />} label="Library" expanded={expanded} active={mode === 'library' && libraryViewMode !== 'wall'} onClick={onOpenLibrary} testid="tab-library" />
    <RailNavigationButton icon={<Columns size={17} />} label="Wall" expanded={expanded} active={mode === 'library' && libraryViewMode === 'wall'} onClick={onOpenWall} testid="tab-cover-wall" />
    <RailNavigationButton icon={<Boxes size={17} />} label="Tools" expanded={expanded} active={mode === 'tools'} onClick={onOpenTools} testid="tab-tools" />
    <span className={`mt-auto overflow-hidden whitespace-nowrap px-2 pb-1 text-[8px] font-bold uppercase tracking-[0.16em] text-muted transition-opacity ${expanded ? 'opacity-75' : 'opacity-0'}`}>Navigation</span>
  </nav>;
}

function RailNavigationButton({ icon, label, expanded, active, onClick, testid }) {
  return <button
    type="button"
    data-testid={testid}
    title={expanded ? undefined : label}
    aria-label={label}
    aria-pressed={active}
    onClick={onClick}
    className={`mb-1 flex h-10 w-full shrink-0 items-center gap-3 overflow-hidden rounded-lg border px-2.5 text-left transition ${active ? 'border-[rgb(var(--accent)/0.68)] bg-[rgb(var(--accent)/0.16)] text-ink shadow-[0_0_14px_-8px_rgb(var(--accent))]' : 'border-transparent text-ink/78 hover:border-[rgb(var(--accent)/0.38)] hover:bg-[rgb(var(--accent)/0.08)] hover:text-ink'}`}
  >
    <span className={`grid h-5 w-5 shrink-0 place-items-center ${active ? 'text-[rgb(var(--accent))]' : 'text-[rgb(var(--accent-2))]'}`}>{icon}</span>
    <span className={`overflow-hidden whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.14em] transition-all ${expanded ? 'max-w-20 translate-x-0 opacity-100' : 'max-w-0 -translate-x-1 opacity-0'}`}>{label}</span>
  </button>;
}
