import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Wand2, Settings, RefreshCw, Trash2, Pencil, FolderOpen, MoreVertical,
  Lock, ChevronRight, ChevronDown, Tag, GripVertical, Sparkles, Terminal,
  Info, ArrowUp, ArrowDown, Palette, Eye, EyeOff, Sliders, Library as LibIcon,
  Wrench,
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
  onSelect,
  onAddManual, onOpenWizard, onOpenSettings, onUpdateAll,
  onCreateCategory, onCategoryContext, onGameContext,
  onSetLibrarySize, onMoveGameToCategory,
  onReorderGameInCategory, onReorderCategory,
  onToggleCollapsed, onUnlockCategory,
  updatingAll,
}) {
  const size = sizeById(librarySize);
  const [libSettingsOpen, setLibSettingsOpen] = React.useState(false);
  const isTools = mode === 'tools';

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

  // Pre-compute sections
  const sections = [
    ...categories.map((c) => {
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
    <aside className="relative flex h-full w-[320px] shrink-0 flex-col border-r hairline bg-panel/40">
      {/* Tab bar — Library / Tools */}
      <div className="flex items-center gap-1 p-2 pb-0">
        <TabPill
          label="Library"
          icon={<LibIcon size={12} />}
          active={mode !== 'tools'}
          onClick={() => onSetMode('library')}
          testid="tab-library"
        />
        <TabPill
          label="Tools"
          icon={<Wrench size={12} />}
          active={mode === 'tools'}
          onClick={() => onSetMode('tools')}
          testid="tab-tools"
        />
      </div>

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
                onSetLibrarySize={onSetLibrarySize}
                onClose={() => setLibSettingsOpen(false)}
                onCreateCategory={onCreateCategory}
              />
            )}
          </AnimatePresence>
        </div>
        <SideBtn icon={<Settings size={14} />} onClick={onOpenSettings} testid="sidebar-settings-btn" />
      </div>

      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted">
          {isTools ? 'Tools' : 'Library'}
        </span>
        <button
          data-testid="category-new-btn"
          onClick={onCreateCategory}
          className="inline-flex items-center gap-1 rounded-md hairline px-2 h-6 text-[10px] text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)]"
        >
          <Plus size={11} /> New category
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-2 pb-4" data-testid="sidebar-tree">
        {sections.map((s, sectionIdx) => (
          <Section
            key={s.id}
            section={s}
            sectionIdx={sectionIdx}
            collapsed={!!collapsed[s.id]}
            size={size}
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
        ))}
        {games.length === 0 && (
          <div className="mt-8 px-4 text-center text-xs text-muted">
            No games yet. Add one or run the Wizard.
          </div>
        )}
      </div>
    </aside>
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

function TabPill({ label, icon, active, onClick, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className={cn(
        'group relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 h-8 text-[11px] font-bold uppercase tracking-[0.22em] transition-all',
        active
          ? 'text-ink bg-[rgb(var(--accent)/0.12)] hairline border-[rgb(var(--accent)/0.6)] shadow-[0_0_12px_-3px_rgb(var(--accent)/0.55)]'
          : 'text-muted hover:text-ink hover:bg-panel/60'
      )}
    >
      <span className={active ? 'text-[rgb(var(--accent))]' : 'text-muted'}>{icon}</span>
      {label}
      {active && (
        <motion.span
          layoutId="tab-underline"
          className="absolute -bottom-0.5 left-3 right-3 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgb(var(--accent)) 50%, transparent)',
          }}
        />
      )}
    </button>
  );
}

/* ---------------- Library settings popover ---------------- */
function LibrarySettingsPopover({ librarySize, onSetLibrarySize, onClose, onCreateCategory }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && onClose();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ duration: 0.14 }}
      className="absolute right-0 top-full z-30 mt-1 w-60 overflow-hidden rounded-lg hairline glass shadow-2xl p-3 space-y-3"
      data-testid="library-settings-popover"
    >
      <div>
        <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted">Game row size</div>
        <div className="grid grid-cols-3 gap-1">
          {['small', 'medium', 'big'].map((s) => (
            <button
              key={s}
              data-testid={`lib-size-${s}`}
              onClick={() => { onSetLibrarySize(s); }}
              className={cn(
                'rounded-md hairline py-1.5 text-[11px] capitalize transition-colors',
                librarySize === s
                  ? 'border-[rgb(var(--accent)/0.7)] bg-[rgb(var(--accent)/0.12)] text-ink'
                  : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.4)]'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
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

/* ---------------- Section ---------------- */
function Section({
  section, sectionIdx, collapsed, size, selectedId, onSelect,
  onContext, onCategoryContext, onUnlockCategory, onToggleCollapsed,
  onMoveGameToCategory, onReorderGameInCategory, onReorderCategory,
  unlockedCategories, categories,
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
      className="mb-1"
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

        {/* Color/lock indicator */}
        {section.isGhost ? (
          <Lock size={12} className="text-[rgb(var(--accent))] pulse-ghost" />
        ) : (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          />
        )}

        {/* Name */}
        <span
          className={cn(
            'flex-1 truncate font-display text-[11px] font-bold uppercase tracking-[0.18em]',
            section.isGhost ? 'text-[rgb(var(--accent))]/80' : 'text-ink/95'
          )}
          style={!section.isGhost && !isUncat ? { textShadow: `0 0 8px ${color}40` } : undefined}
        >
          {section.isGhost ? 'Private' : c.name}
        </span>

        {/* Count */}
        <span className="rounded-full bg-panel/60 hairline px-1.5 py-0.5 text-[10px] text-muted">
          {section.count}
        </span>
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
            <div className="pl-4" style={{ overflow: 'visible' }}>
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
        'group relative mb-0.5 flex cursor-pointer items-center gap-2.5 rounded-md transition-colors',
        selected ? 'bg-[rgb(var(--accent)/0.10)] text-ink' : 'text-muted hover:bg-panel/70 hover:text-ink',
        isSmall ? 'px-1.5 py-1' : isBig ? 'px-2 py-2' : 'px-2 py-1.5'
      )}
      style={{ minHeight: size.rowH }}
    >
      {/* Selection bar */}
      <span
        className={cn(
          'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full',
          selected ? 'bg-[rgb(var(--accent))] shadow-[0_0_8px_rgb(var(--accent))]' : 'bg-transparent'
        )}
      />

      {/* Icon */}
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

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <div className={cn('truncate font-medium', `text-[${size.font}px]`)} style={{ fontSize: size.font }}>
          {g.name || 'Untitled'}
        </div>
        {!isSmall && (
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
          onContextMenu={(e) => e.stopPropagation()}
          style={{ position: 'fixed', top: menu.y, left: menu.x, zIndex: 200, width: 240 }}
          className="overflow-hidden rounded-lg hairline glass shadow-2xl py-1"
        >
          <Item icon={<RefreshCw size={13} />} label="Re-obtain info online" onClick={() => { setMenu({ ...menu, open: false }); onContext('refetch'); }} testid={`game-ctx-refetch-${g.id}`} />
          <Item icon={<Pencil size={13} />} label="Rename" onClick={() => { setMenu({ ...menu, open: false }); onContext('rename'); }} testid={`game-ctx-rename-${g.id}`} />
          <Item icon={<Terminal size={13} />} label="Edit launch args" onClick={() => { setMenu({ ...menu, open: false }); onContext('args'); }} testid={`game-ctx-args-${g.id}`} />
          <Item icon={<Info size={13} />} label="Details / edit cover" onClick={() => { setMenu({ ...menu, open: false }); onContext('details'); }} testid={`game-ctx-details-${g.id}`} />
          <Divider />
          <Item icon={<Tag size={13} />} label="Manage categories…" onClick={() => { setMenu({ ...menu, open: false }); onContext('manage-categories'); }} testid={`game-ctx-cats-${g.id}`} />
          <Item icon={<FolderOpen size={13} />} label="Reveal in folder" onClick={() => { setMenu({ ...menu, open: false }); onContext('reveal'); }} testid={`game-ctx-reveal-${g.id}`} />
          <Item icon={<FolderOpen size={13} />} label="Open containing directory" onClick={() => { setMenu({ ...menu, open: false }); onContext('open-dir'); }} testid={`game-ctx-open-dir-${g.id}`} />
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
  React.useEffect(() => {
    const close = () => onClose();
    if (open) {
      document.addEventListener('mousedown', close);
      document.addEventListener('contextmenu', close);
    }
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('contextmenu', close);
    };
  }, [open, onClose]);

  if (!open || !category || !anchor) return null;

  const items = [
    { icon: <Pencil size={13} />, label: 'Rename / recolor', action: 'edit' },
    { icon: <Palette size={13} />, label: 'Change color', action: 'recolor' },
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
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ position: 'fixed', top: anchor.y, left: anchor.x, zIndex: 200 }}
      onClick={(e) => e.stopPropagation()}
      data-testid="category-context-menu"
      className="w-56 overflow-hidden rounded-lg hairline glass shadow-2xl py-1"
    >
      <div className="px-3 pt-1 pb-2 text-[10px] uppercase tracking-wider text-muted">
        {category.name}
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
