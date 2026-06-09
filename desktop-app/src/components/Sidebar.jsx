import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Wand2, Settings, RefreshCw, Trash2, Pencil, FolderOpen, MoreVertical,
  Lock, Eye, EyeOff, Palette, ArrowUp, ArrowDown, Tag, Library as LibIcon,
  Sparkles, Terminal, Info,
} from 'lucide-react';
import { cn, colorFromId } from '../lib/utils';

/**
 * Sidebar
 *  - Top: category bar (chips). Click to filter. + New, right-click to manage.
 *  - Action row: Add / Wizard / Refresh-all / Settings
 *  - Game list filtered by active category. Drag a game onto a category chip to add it.
 */
export default function Sidebar({
  games,
  categories,
  activeCategoryId,
  unlockedCategories,
  search,
  selectedId,
  onSelect,
  onSelectCategory,
  onAddManual,
  onOpenWizard,
  onOpenSettings,
  onUpdateAll,
  onCreateCategory,
  onCategoryContext,
  onGameContext,
  onMoveGame,
  onAssignGameToCategory,
  onUnlockCategory,
  updatingAll,
}) {
  // ----- Filtering -----
  let visible = games;
  if (activeCategoryId && activeCategoryId !== '__all__') {
    visible = games.filter((g) => (g.categoryIds || []).includes(activeCategoryId));
  }
  if (search.trim()) {
    visible = visible.filter((g) => (g.name || '').toLowerCase().includes(search.toLowerCase().trim()));
  }

  return (
    <aside className="relative flex h-full w-[310px] shrink-0 flex-col border-r hairline bg-panel/40">
      {/* Action bar */}
      <div className="flex items-center gap-1.5 p-3">
        <SideBtn label="Add" icon={<Plus size={14} />} onClick={onAddManual} testid="sidebar-add-btn" />
        <SideBtn label="Wizard" icon={<Wand2 size={14} />} onClick={onOpenWizard} testid="sidebar-wizard-btn" />
        <div className="flex-1" />
        <SideBtn
          icon={<RefreshCw size={14} className={updatingAll ? 'animate-spin' : ''} />}
          onClick={onUpdateAll}
          testid="sidebar-update-all-btn"
          title="Refresh metadata for all games"
        />
        <SideBtn icon={<Settings size={14} />} onClick={onOpenSettings} testid="sidebar-settings-btn" />
      </div>

      {/* Category chips */}
      <CategoryBar
        categories={categories}
        activeCategoryId={activeCategoryId}
        unlockedCategories={unlockedCategories}
        onSelect={onSelectCategory}
        onCreate={onCreateCategory}
        onContext={onCategoryContext}
        onUnlock={onUnlockCategory}
        onDropGame={onAssignGameToCategory}
      />

      <div className="px-4 pb-2 text-[10px] uppercase tracking-[0.22em] text-muted">
        {activeLabel(categories, activeCategoryId, unlockedCategories)} · {visible.length}
      </div>

      {/* Game list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4" data-testid="sidebar-games-list">
        <AnimatePresence initial={false}>
          {visible.map((g, idx) => (
            <GameRow
              key={g.id}
              g={g}
              index={idx}
              selected={selectedId === g.id}
              onClick={() => onSelect(g.id)}
              onContext={(action, payload) => onGameContext(action, g, payload)}
              onMove={(dir) => onMoveGame(g.id, dir)}
              categories={categories}
            />
          ))}
        </AnimatePresence>
        {visible.length === 0 && (
          <div className="mt-8 px-4 text-center text-xs text-muted">
            {games.length === 0
              ? 'No games yet. Add one or run the Wizard.'
              : 'Nothing here. Try a different category or search.'}
          </div>
        )}
      </div>
    </aside>
  );
}

function activeLabel(categories, id, unlocked) {
  if (!id || id === '__all__') return 'All games';
  const c = categories.find((x) => x.id === id);
  if (!c) return 'Library';
  if (c.private && !unlocked.includes(c.id)) return 'Private';
  return c.name;
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

/* ---------------- Category bar ---------------- */

function CategoryBar({ categories, activeCategoryId, unlockedCategories, onSelect, onCreate, onContext, onUnlock, onDropGame }) {
  return (
    <div className="px-3 pb-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted">Categories</span>
        <button
          data-testid="category-new-btn"
          onClick={onCreate}
          className="inline-flex items-center gap-1 rounded-md hairline px-2 h-6 text-[10px] text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)]"
        >
          <Plus size={11} /> New
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip
          label="All"
          icon={<LibIcon size={11} />}
          active={!activeCategoryId || activeCategoryId === '__all__'}
          onClick={() => onSelect('__all__')}
          testid="cat-chip-all"
        />
        {categories.map((c) => {
          const isGhost = c.private && !unlockedCategories.includes(c.id);
          return (
            <Chip
              key={c.id}
              label={isGhost ? 'Private' : c.name}
              color={colorFromId(c.colorId)}
              active={activeCategoryId === c.id}
              ghost={isGhost}
              testid={`cat-chip-${c.id}`}
              onClick={() => {
                if (isGhost) onUnlock(c);
                else onSelect(c.id);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                onContext(c, { x: e.clientX, y: e.clientY });
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('drop-target');
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove('drop-target')}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('drop-target');
                const gameId = e.dataTransfer.getData('text/game-id');
                if (gameId) onDropGame(gameId, c.id);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function Chip({ label, color, icon, active, ghost, onClick, onContextMenu, testid, onDragOver, onDragLeave, onDrop }) {
  return (
    <motion.button
      data-testid={testid}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'group relative inline-flex items-center gap-1.5 rounded-full hairline px-2.5 h-7 text-[11px] transition-all',
        active
          ? 'text-ink border-[rgb(var(--accent)/0.7)] bg-[rgb(var(--accent)/0.12)]'
          : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.4)]'
      )}
      style={color && !ghost ? { boxShadow: active ? `0 0 0 1px ${color}AA, 0 0 12px -3px ${color}80` : undefined } : undefined}
    >
      {ghost ? (
        <Lock size={10} className="text-[rgb(var(--accent))] pulse-ghost" />
      ) : color ? (
        <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      ) : (
        icon
      )}
      <span className="max-w-[100px] truncate">{label}</span>
    </motion.button>
  );
}

/* ---------------- Game row ---------------- */

function GameRow({ g, selected, onClick, onContext, onMove, index, categories }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const rowRef = React.useRef(null);

  React.useEffect(() => {
    const close = (e) => rowRef.current && !rowRef.current.contains(e.target) && setMenuOpen(false);
    if (menuOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <motion.div
      ref={rowRef}
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ delay: Math.min(index * 0.012, 0.18), duration: 0.18 }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/game-id', g.id);
        e.dataTransfer.effectAllowed = 'copyMove';
        e.currentTarget.classList.add('is-dragging');
      }}
      onDragEnd={(e) => e.currentTarget.classList.remove('is-dragging')}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuOpen(true);
      }}
      data-testid={`game-row-${g.id}`}
      className={cn(
        'group relative mb-1 flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-all',
        selected ? 'bg-[rgb(var(--accent)/0.10)] text-ink' : 'hover:bg-panel/80 text-muted hover:text-ink'
      )}
      onClick={onClick}
    >
      <motion.span
        layoutId="selectionBar"
        className={cn(
          'absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-r-full',
          selected ? 'bg-[rgb(var(--accent))] shadow-[0_0_8px_rgb(var(--accent))]' : 'bg-transparent'
        )}
      />
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md hairline bg-surface/70">
        {g.icon ? (
          <img src={g.icon} alt="" className="h-full w-full object-cover" />
        ) : g.coverUrl ? (
          <img src={g.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-[10px] text-muted">
            {(g.name || '?').slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{g.name || 'Untitled'}</div>
        <div className="flex items-center gap-1.5 truncate text-[11px] text-muted">
          {(g.categoryIds || []).slice(0, 2).map((cid) => {
            const c = categories.find((x) => x.id === cid);
            if (!c) return null;
            return (
              <span
                key={cid}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: colorFromId(c.colorId), boxShadow: `0 0 4px ${colorFromId(c.colorId)}` }}
              />
            );
          })}
          <span className="truncate">{g.genres?.[0] || (g.exePath ? 'Local game' : '—')}</span>
        </div>
      </div>

      <button
        data-testid={`game-row-menu-${g.id}`}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        className="opacity-0 group-hover:opacity-100 text-muted hover:text-ink transition-opacity"
      >
        <MoreVertical size={14} />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-2 top-full z-30 mt-1 w-60 overflow-hidden rounded-lg hairline glass shadow-2xl py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Item icon={<RefreshCw size={13} />} label="Re-obtain info online" onClick={() => { setMenuOpen(false); onContext('refetch'); }} testid={`game-ctx-refetch-${g.id}`} />
            <Item icon={<Pencil size={13} />} label="Rename" onClick={() => { setMenuOpen(false); onContext('rename'); }} testid={`game-ctx-rename-${g.id}`} />
            <Item icon={<Terminal size={13} />} label="Edit launch args" onClick={() => { setMenuOpen(false); onContext('args'); }} testid={`game-ctx-args-${g.id}`} />
            <Item icon={<Info size={13} />} label="Details / edit cover" onClick={() => { setMenuOpen(false); onContext('details'); }} testid={`game-ctx-details-${g.id}`} />
            <Divider />
            <Item icon={<Tag size={13} />} label="Manage categories…" onClick={() => { setMenuOpen(false); onContext('manage-categories'); }} testid={`game-ctx-cats-${g.id}`} />
            <Item icon={<ArrowUp size={13} />} label="Move up" onClick={() => { setMenuOpen(false); onMove(-1); }} testid={`game-ctx-up-${g.id}`} />
            <Item icon={<ArrowDown size={13} />} label="Move down" onClick={() => { setMenuOpen(false); onMove(1); }} testid={`game-ctx-down-${g.id}`} />
            <Item icon={<FolderOpen size={13} />} label="Reveal in folder" onClick={() => { setMenuOpen(false); onContext('reveal'); }} testid={`game-ctx-reveal-${g.id}`} />
            <Divider />
            <Item icon={<Trash2 size={13} />} label="Remove from library" danger onClick={() => { setMenuOpen(false); onContext('remove'); }} testid={`game-ctx-remove-${g.id}`} />
          </motion.div>
        )}
      </AnimatePresence>
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

/* ---------------- Floating category context menu ---------------- */

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ position: 'fixed', top: anchor.y, left: anchor.x, zIndex: 70 }}
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
    </motion.div>
  );
}
