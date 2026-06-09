import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wand2, Settings, RefreshCw, Trash2, Pencil, FolderOpen, MoreVertical } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar({
  games,
  search,
  selectedId,
  onSelect,
  onAddManual,
  onOpenWizard,
  onOpenSettings,
  onUpdateAll,
  onContextAction,
  updatingAll,
}) {
  const filtered = games.filter((g) =>
    (g.name || '').toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <aside className="relative flex h-full w-[300px] flex-col border-r hairline bg-panel/40">
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

      <div className="px-4 pb-2 text-[10px] uppercase tracking-[0.22em] text-muted">
        Library · {filtered.length}/{games.length}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <AnimatePresence initial={false}>
          {filtered.map((g, idx) => (
            <GameRow
              key={g.id}
              g={g}
              selected={selectedId === g.id}
              onClick={() => onSelect(g.id)}
              onContext={(action) => onContextAction(action, g)}
              index={idx}
            />
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="mt-8 px-4 text-center text-xs text-muted">
            {games.length === 0
              ? 'No games yet. Add one or run the Wizard.'
              : 'No matches for your search.'}
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
      className="group inline-flex items-center gap-1.5 rounded-md hairline px-2.5 h-7 text-xs text-muted hover:text-ink hover:border-accent/40 hover:bg-accent/10 transition-all"
    >
      <span className="text-accent transition-transform group-hover:scale-110">{icon}</span>
      {label && <span>{label}</span>}
    </button>
  );
}

function GameRow({ g, selected, onClick, onContext, index }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const rowRef = React.useRef(null);

  React.useEffect(() => {
    const close = (e) => {
      if (rowRef.current && !rowRef.current.contains(e.target)) setMenuOpen(false);
    };
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
      transition={{ delay: Math.min(index * 0.015, 0.2), duration: 0.18 }}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuOpen(true);
      }}
      data-testid={`game-row-${g.id}`}
      className={cn(
        'group relative mb-1 flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-all',
        selected ? 'bg-accent/12 text-ink' : 'hover:bg-panel/80 text-muted hover:text-ink'
      )}
      onClick={onClick}
    >
      {/* Selection bar */}
      <motion.span
        layoutId="selectionBar"
        className={cn(
          'absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-r-full',
          selected ? 'bg-accent' : 'bg-transparent'
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
        <div className="truncate text-[11px] text-muted">
          {g.genres?.[0] || (g.exePath ? 'Local game' : '—')}
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
            className="absolute right-2 top-full z-30 mt-1 w-56 overflow-hidden rounded-lg hairline glass shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CtxItem
              icon={<RefreshCw size={13} />}
              label="Re-obtain info online"
              onClick={() => {
                setMenuOpen(false);
                onContext('refetch');
              }}
              testid={`game-ctx-refetch-${g.id}`}
            />
            <CtxItem
              icon={<Pencil size={13} />}
              label="Edit details"
              onClick={() => {
                setMenuOpen(false);
                onContext('edit');
              }}
              testid={`game-ctx-edit-${g.id}`}
            />
            <CtxItem
              icon={<FolderOpen size={13} />}
              label="Reveal in folder"
              onClick={() => {
                setMenuOpen(false);
                onContext('reveal');
              }}
              testid={`game-ctx-reveal-${g.id}`}
            />
            <CtxItem
              icon={<Trash2 size={13} />}
              label="Remove from library"
              onClick={() => {
                setMenuOpen(false);
                onContext('remove');
              }}
              testid={`game-ctx-remove-${g.id}`}
              danger
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CtxItem({ icon, label, onClick, testid, danger }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors',
        danger ? 'text-red-400 hover:bg-red-500/10' : 'text-ink hover:bg-accent/10'
      )}
    >
      <span className="text-muted">{icon}</span>
      {label}
    </button>
  );
}
