import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  Plus, Wand2, Settings, RefreshCw, Trash2, Pencil, FolderOpen, MoreVertical,
  Lock, ChevronRight, ChevronDown, Tag, GripVertical, Sparkles, Terminal,
  Info, ArrowUp, ArrowDown, Palette, Eye, EyeOff, Sliders, Library as LibIcon,
  Wrench, Columns, Pin, PinOff, X as XIcon,
} from 'lucide-react';
import { cn, colorFromId, sizeById } from '../lib/utils';

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
  showCategoryDot = true,
  pinnedIds = [],
  onChangeRowSize, onChangeCatTextSize, onChangeCatGlow, onChangeIconPosition,
  onChangeRowGap, onChangeCatGap, onChangeCatTopGap, onToggleCategoryDot,
  onSelect,
  onAddManual, onOpenWizard, onOpenSettings, onUpdateAll,
  onCreateCategory, onCategoryContext, onGameContext,
  onSetLibrarySize, onMoveGameToCategory,
  onReorderGameInCategory, onReorderCategory,
  onToggleCollapsed, onUnlockCategory,
  onAutoSort,
  twoRow = false, onToggleTwoRow,
  sidebarWidth = 320,
  onStartResize,
  updatingAll,
}) {
  // size based on rowSize slider (in px)
  const size = {
    id: rowSize < 32 ? 'small' : rowSize > 60 ? 'big' : 'medium',
    rowH: rowSize,
    icon: Math.max(14, Math.round(rowSize * 0.72)),
    font: Math.max(11, Math.min(16, Math.round(rowSize * 0.28))),
  };
  const [libSettingsOpen, setLibSettingsOpen] = React.useState(false);
  const isTools = mode === 'tools';
  const pinnedIdsSet = React.useMemo(() => new Set(pinnedIds || []), [pinnedIds]);

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
      className="relative flex h-full shrink-0 flex-col border-r hairline bg-panel/40"
      style={{ width: sidebarWidth }}
    >
      {/* Resize handle on right edge */}
      <div
        data-testid="sidebar-resize-handle"
        onMouseDown={onStartResize}
        title="Drag to resize sidebar"
        className="absolute right-0 top-0 z-30 h-full w-1.5 cursor-col-resize hover:bg-[rgb(var(--accent)/0.4)] transition-colors"
        style={{ touchAction: 'none' }}
      />
      {/* Tab bar — Library / Tools (primary) */}
      <div className="flex items-center gap-1 p-2 pb-0">
        <TabPill
          label="Library"
          icon={<LibIcon size={12} />}
          active={mode !== 'tools'}
          onClick={() => { onSetMode('library'); onSetLauncherFilter?.('all'); }}
          testid="tab-library"
          big
        />
        <TabPill
          label="Tools"
          icon={<Wrench size={12} />}
          active={mode === 'tools'}
          onClick={() => onSetMode('tools')}
          testid="tab-tools"
          big
        />
      </div>

      {/* Secondary launcher filter row — only on Library tab */}
      {mode !== 'tools' && (
        <div className="flex items-center gap-1 px-2 pt-1.5 overflow-x-auto" data-testid="launcher-pane-row">
          <LauncherPill
            label="All"
            active={(launcherFilter || 'all') === 'all'}
            onClick={() => onSetLauncherFilter?.('all')}
            testid="lp-all"
          />
          <LauncherPill
            label="Steam"
            active={launcherFilter === 'steam'}
            onClick={() => onSetLauncherFilter?.('steam')}
            testid="lp-steam"
          />
          <LauncherPill
            label="Epic"
            active={launcherFilter === 'epic'}
            onClick={() => onSetLauncherFilter?.('epic')}
            testid="lp-epic"
          />
          <LauncherPill
            label="EA"
            active={launcherFilter === 'ea'}
            onClick={() => onSetLauncherFilter?.('ea')}
            testid="lp-ea"
          />
          <LauncherPill
            label="GOG"
            active={launcherFilter === 'gog'}
            onClick={() => onSetLauncherFilter?.('gog')}
            testid="lp-gog"
          />
          <LauncherPill
            label="Other"
            active={launcherFilter === 'other'}
            onClick={() => onSetLauncherFilter?.('other')}
            testid="lp-other"
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 p-3 pt-2">
        <SideBtn label="Add" icon={<Plus size={14} />} onClick={onAddManual} testid="sidebar-add-btn" />
        {!isTools && (
          <SideBtn label="Wizard" icon={<Wand2 size={14} />} onClick={onOpenWizard} testid="sidebar-wizard-btn" />
        )}
        <div className="flex-1" />
        {!isTools && (
          <SideBtn
            icon={<RefreshCw size={14} className={updatingAll ? 'animate-spin' : ''} />}
            onClick={onUpdateAll}
            testid="sidebar-update-all-btn"
            title="Refresh metadata for all games"
          />
        )}
        <div className="relative">
          <SideBtn
            icon={<Sliders size={14} />}
            onClick={() => setLibSettingsOpen((v) => !v)}
            testid="sidebar-lib-settings-btn"
            title="Library settings"
          />
          <AnimatePresence>
            {libSettingsOpen && (
              <LibrarySettingsPopover
                librarySize={librarySize}
                rowSize={rowSize}
                catTextSize={catTextSize}
                catGlow={catGlow}
                rowGap={rowGap}
                catGap={catGap}
                catTopGap={catTopGap}
                iconPosition={iconPosition}
                showCategoryDot={showCategoryDot}
                onSetLibrarySize={onSetLibrarySize}
                onChangeRowSize={onChangeRowSize}
                onChangeCatTextSize={onChangeCatTextSize}
                onChangeCatGlow={onChangeCatGlow}
                onChangeRowGap={onChangeRowGap}
                onChangeCatGap={onChangeCatGap}
                onChangeCatTopGap={onChangeCatTopGap}
                onChangeIconPosition={onChangeIconPosition}
                onToggleCategoryDot={onToggleCategoryDot}
                onClose={() => setLibSettingsOpen(false)}
                onCreateCategory={onCreateCategory}
              />
            )}
          </AnimatePresence>
        </div>
        <button
          data-testid="sidebar-tworow-btn"
          onClick={() => onToggleTwoRow?.(!twoRow)}
          title={twoRow ? 'Switch back to single column' : 'Two-column layout (categories never split)'}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md hairline px-2 h-7 text-xs transition-all',
            twoRow
              ? 'text-ink border-[rgb(var(--accent)/0.7)] bg-[rgb(var(--accent)/0.12)]'
              : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)]'
          )}
        >
          <Columns size={13} className={twoRow ? 'text-[rgb(var(--accent))]' : 'text-[rgb(var(--accent))]'} />
        </button>
        <SideBtn icon={<Settings size={14} />} onClick={onOpenSettings} testid="sidebar-settings-btn" />
      </div>

      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted">
          {isTools ? 'Tools' : 'Library'}
        </span>
        <div className="flex items-center gap-1.5">
          {!isTools && onAutoSort && (
            <button
              data-testid="sidebar-autosort-btn"
              onClick={onAutoSort}
              title="Smart auto-sort into 6 default categories"
              className="inline-flex items-center gap-1 rounded-md hairline px-2 h-6 text-[10px] text-[rgb(var(--accent-2))] hover:text-ink hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)]"
            >
              <Wand2 size={10} /> Auto-sort
            </button>
          )}
          <button
            data-testid="category-new-btn"
            onClick={onCreateCategory}
            className="inline-flex items-center gap-1 rounded-md hairline px-2 h-6 text-[10px] text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)]"
          >
          <Plus size={11} /> New category
        </button>
        </div>
      </div>

      {/* Tree — single column or two-column (categories never split between columns) */}
      <div className="flex-1 overflow-y-auto px-2 pb-4" data-testid="sidebar-tree">
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
            showCategoryDot, pinnedIdsSet,
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
    showCategoryDot,
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

function SideBtn({ icon, label, onClick, testid, title }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      title={title || label}
      className="group inline-flex items-center gap-1.5 rounded-md hairline px-2.5 h-7 text-xs text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)] transition-all"
    >
      <span className="text-[rgb(var(--accent))] transition-transform group-hover:scale-110">{icon}</span>
      {label && <span>{label}</span>}
    </button>
  );
}

function TabPill({ label, icon, active, onClick, testid, big = false }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className={cn(
        'group relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-md transition-all',
        big ? 'px-3 h-10 text-[12.5px]' : 'px-3 h-8 text-[11px]',
        'font-bold uppercase tracking-[0.22em]',
        active
          ? 'text-ink bg-[rgb(var(--accent)/0.18)] hairline border-[rgb(var(--accent)/0.85)] shadow-[0_0_18px_-4px_rgb(var(--accent)/0.7)]'
          : 'text-muted hover:text-ink hover:bg-panel/60'
      )}
    >
      <span className={active ? 'text-[rgb(var(--accent))]' : 'text-muted'}>{icon}</span>
      {label}
      {active && (
        <motion.span
          layoutId="tab-underline"
          className="pointer-events-none absolute -bottom-0.5 left-3 right-3 h-[2px] rounded-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgb(var(--accent)) 50%, transparent)',
            boxShadow: '0 0 8px rgb(var(--accent))',
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

/* ---------------- Library settings popover ---------------- */
function LibrarySettingsPopover({
  librarySize, rowSize = 44, catTextSize = 11, catGlow = 40, iconPosition = 'left',
  rowGap = 2, catGap = 8, catTopGap = 4, showCategoryDot = true,
  onSetLibrarySize, onChangeRowSize, onChangeCatTextSize, onChangeCatGlow, onChangeIconPosition,
  onChangeRowGap, onChangeCatGap, onChangeCatTopGap, onToggleCategoryDot,
  onClose, onCreateCategory,
}) {
  const ref = React.useRef(null);
  const dragControls = useDragControls();
  React.useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && onClose();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  return (
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
      style={{ left: 0, top: '100%' }}
      className="absolute z-30 mt-1 w-72 max-w-[calc(100vw-32px)] max-h-[80vh] overflow-y-auto rounded-lg hairline glass shadow-2xl p-3 space-y-3"
      data-testid="library-settings-popover"
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-move -mt-1 -mx-1 mb-1 px-2 py-1 text-[9px] uppercase tracking-[0.22em] text-muted/80 flex items-center gap-1.5 select-none border-b border-[rgb(var(--border))]/60"
        title="Drag to move"
      >
        <GripVertical size={10} /> Library settings
      </div>
      <div>
        <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted">Quick preset</div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { key: 'small', size: 26 },
            { key: 'medium', size: 44 },
            { key: 'big', size: 64 },
          ].map((s) => (
            <button
              key={s.key}
              data-testid={`lib-size-${s.key}`}
              onClick={() => { onSetLibrarySize(s.key); if (onChangeRowSize) onChangeRowSize(s.size); }}
              className={cn(
                'rounded-md hairline py-1.5 text-[11px] capitalize transition-colors',
                librarySize === s.key
                  ? 'border-[rgb(var(--accent)/0.7)] bg-[rgb(var(--accent)/0.12)] text-ink'
                  : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.4)]'
              )}
            >
              {s.key}
            </button>
          ))}
        </div>
      </div>

      <PopSlider
        label="Row size"
        value={rowSize}
        min={22}
        max={80}
        suffix="px"
        onChange={onChangeRowSize}
        testid="pop-row-size"
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
      <PopSlider
        label="Category glow"
        value={catGlow}
        min={0}
        max={200}
        suffix="%"
        onChange={onChangeCatGlow}
        testid="pop-cat-glow"
      />
      <PopSlider
        label="Spacing between games"
        value={rowGap}
        min={-8}
        max={16}
        suffix="px"
        onChange={onChangeRowGap}
        testid="pop-row-gap"
      />
      <PopSlider
        label="Spacing under category header"
        value={catGap}
        min={-6}
        max={32}
        suffix="px"
        onChange={onChangeCatGap}
        testid="pop-cat-gap"
      />
      <PopSlider
        label="Gap between header & first game"
        value={catTopGap}
        min={-4}
        max={24}
        suffix="px"
        onChange={onChangeCatTopGap}
        testid="pop-cat-top-gap"
      />

      <div>
        <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted">Icon position</div>
        <div className="grid grid-cols-3 gap-1">
          {['left', 'right', 'none'].map((p) => (
            <button
              key={p}
              data-testid={`pop-icon-pos-${p}`}
              onClick={() => onChangeIconPosition && onChangeIconPosition(p)}
              className={cn(
                'rounded-md hairline py-1.5 text-[11px] capitalize transition-colors',
                iconPosition === p
                  ? 'border-[rgb(var(--accent)/0.7)] bg-[rgb(var(--accent)/0.12)] text-ink'
                  : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.4)]'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Category dot toggle — hides the small colored category indicator next to genre/playtime */}
      <button
        data-testid="pop-toggle-cat-dot"
        onClick={() => onToggleCategoryDot && onToggleCategoryDot(!showCategoryDot)}
        className={cn(
          'flex w-full items-center justify-between rounded-md hairline px-2.5 py-2 text-[11px] transition-colors',
          showCategoryDot
            ? 'border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--accent)/0.08)] text-ink'
            : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.4)]'
        )}
        title="Toggle the small colored category dot shown beside each game's genre/playtime"
      >
        <span className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: showCategoryDot ? 'rgb(var(--accent))' : 'rgb(var(--muted))',
              boxShadow: showCategoryDot ? '0 0 4px rgb(var(--accent))' : 'none',
            }}
          />
          Category dot
        </span>
        <span className="text-[10px] uppercase tracking-wider">
          {showCategoryDot ? 'shown' : 'hidden'}
        </span>
      </button>

      <div className="h-px bg-[rgb(var(--border))]" />
      <button
        onClick={() => { onCreateCategory(); onClose(); }}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] hover:bg-[rgb(var(--accent)/0.10)]"
      >
        <Plus size={13} className="text-[rgb(var(--accent))]" /> New category…
      </button>
    </motion.div>
  );
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

/* ---------------- Section ---------------- */
function Section({
  section, sectionIdx, collapsed, size, iconPosition, selectedId, onSelect,
  onContext, onCategoryContext, onUnlockCategory, onToggleCollapsed,
  onMoveGameToCategory, onReorderGameInCategory, onReorderCategory,
  unlockedCategories, categories,
  catTextSize = 11, catGlow = 40, rowGap = 2, catGap = 8, catTopGap = 4,
  showCategoryDot = true,
  pinnedIdsSet = new Set(),
}) {
  const isUncat = section.id === '__uncat__';
  const c = section.category;
  const color = colorFromId(c.colorId);
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
    const fromCat = e.dataTransfer.getData('text/game-from-cat');
    const catId = e.dataTransfer.getData('text/cat-id');
    if (gameId) {
      onMoveGameToCategory(gameId, fromCat || null, isUncat ? null : c.id, { copy: e.ctrlKey });
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
        ) : (
          <span
            className="shrink-0 rounded-full cat-icon"
            style={{
              width: Math.round(catTextSize * 0.95),
              height: Math.round(catTextSize * 0.95),
              background: color,
              boxShadow: `0 0 ${Math.round(8 + catGlow * 0.1)}px ${color}`,
              color, // for filter:drop-shadow on hover
            }}
          />
        )}

        {/* Name — applies dynamic font size + glow (catTextSize / catGlow sliders) */}
        <span
          className={cn(
            'flex-1 truncate font-display font-bold uppercase tracking-[0.18em]',
            section.isGhost ? 'text-[rgb(var(--accent))]/80' : 'text-ink/95'
          )}
          style={(() => {
            const g = Math.max(0, Math.min(200, catGlow)) / 100; // 0..2
            const base = `${catTextSize}px`;
            if (section.isGhost || isUncat || g === 0) {
              return { fontSize: base };
            }
            // Layered outer-glow (cheap CSS post-processing): inner halo + outer halo + contrast bump.
            const inner = (4 + g * 4).toFixed(1);    // 4..12 px
            const outer = (10 + g * 14).toFixed(1);  // 10..38 px
            const punch = (12 + g * 12).toFixed(1);  // 12..36 px
            return {
              fontSize: base,
              textShadow: `0 0 ${inner}px ${color}, 0 0 ${outer}px ${color}${g > 1 ? '' : 'C0'}, 0 0 ${punch}px ${color}66`,
              filter: g > 1.2 ? `drop-shadow(0 0 ${(g * 4).toFixed(1)}px ${color})` : undefined,
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
            <div className="pl-4" style={{ overflow: 'visible', paddingTop: catTopGap }}>
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
  iconPosition = 'left', rowGap = 2, showCategoryDot = true, isPinned = false,
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
        if (fromCatId) e.dataTransfer.setData('text/game-from-cat', fromCatId);
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
        const fromCat = e.dataTransfer.getData('text/game-from-cat') || null;
        if (!gameId) return;
        if (fromCat === fromCatId || (!fromCat && !fromCatId)) {
          // Same category → reorder
          onReorderInCat(gameId, g.id);
        } else {
          // Move/copy across categories — drop before this game in the target cat
          onMoveBetween(gameId, fromCat, fromCatId, { copy: e.ctrlKey, beforeGameId: g.id });
        }
      }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); openMenuAt(e.clientX, e.clientY); }}
      onClick={onClick}
      data-testid={`game-row-${g.id}`}
      className={cn(
        'group relative flex cursor-pointer items-center gap-2.5 rounded-md transition-colors',
        selected ? 'bg-[rgb(var(--accent)/0.10)] text-ink' : 'text-muted hover:bg-panel/70 hover:text-ink',
        isSmall ? 'px-1.5' : 'px-2'
      )}
      style={{
        minHeight: size.rowH,
        marginBottom: rowGap,
        // Compress vertical padding aggressively when gap is small or negative
        paddingTop: Math.max(0, 6 + Math.min(0, rowGap) + (isBig ? 2 : 0)),
        paddingBottom: Math.max(0, 6 + Math.min(0, rowGap) + (isBig ? 2 : 0)),
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
        {/* Genre/meta strip + category dots — hidden as a unit when "Category dot" is off */}
        {!isSmall && showCategoryDot && (
          <div className="flex items-center gap-1.5 truncate text-[10.5px] text-muted">
            {(g.categoryIds || []).slice(0, 3).map((cid) => {
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
            <span className="truncate">
              {g.playtime ? `${Math.floor(g.playtime / 60)}m played` : (g.genres?.[0] || 'Local game')}
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
