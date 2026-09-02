import React from 'react';
import { FolderPlus, Lock, Pencil, Trash2, AlertTriangle, Tags } from 'lucide-react';
import Modal from './Modal';
import { colorFromId } from '../lib/utils';

/**
 * A safe library-category manager. Categories are only grouping metadata:
 * removing one clears its assignment from games, it never removes a game.
 */
export default function CategoryManagerModal({
  open, onClose, categories = [], games = [], onCreate, onEdit, onDelete, onClearRegular,
}) {
  const unassigned = games.filter((game) => !(game.categoryIds || []).length).length;
  const regular = categories.filter((category) => !category.private);

  return (
    <Modal open={open} onClose={onClose} title="Manage categories" wide testid="category-manager-modal">
      <div className="space-y-4 p-5">
        <div className="rounded-xl border border-[rgb(var(--accent)/0.26)] bg-[rgb(var(--accent)/0.07)] px-3.5 py-3">
          <div className="flex items-start gap-2.5">
            <Tags size={16} className="mt-0.5 shrink-0 text-[rgb(var(--accent))]" />
            <div>
              <p className="text-sm font-semibold text-ink">Your library stays intact</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">Removing a category only moves its games back to <b>Uncategorized</b>. It never removes a game, its artwork, or its play history from NEO-LIB.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted"><b className="text-ink">{unassigned}</b> game{unassigned === 1 ? '' : 's'} currently uncategorized</p>
          <button
            data-testid="category-manager-create"
            onClick={onCreate}
            className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--accent))] px-3 py-2 text-xs font-bold text-[rgb(var(--surface))] transition-transform hover:scale-[1.02]"
          >
            <FolderPlus size={14} /> Add category
          </button>
        </div>

        <div className="overflow-hidden rounded-xl hairline">
          {categories.length ? categories.map((category) => {
            const count = games.filter((game) => (game.categoryIds || []).includes(category.id)).length;
            return (
              <div key={category.id} className="flex items-center gap-3 border-b hairline px-3 py-3 last:border-b-0">
                <span className="h-3 w-3 shrink-0 rounded-full shadow-[0_0_10px_currentColor]" style={{ color: colorFromId(category.colorId), background: colorFromId(category.colorId) }} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">{category.name}{category.private && <Lock size={12} className="shrink-0 text-[rgb(var(--accent-2))]" />}</p>
                  <p className="text-[11px] text-muted">{count} game{count === 1 ? '' : 's'} · {category.private ? 'Private category' : 'Games return to Uncategorized if removed'}</p>
                </div>
                <button data-testid={`category-manager-edit-${category.id}`} onClick={() => onEdit(category)} title={`Edit ${category.name}`} className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink"><Pencil size={14} /></button>
                <button data-testid={`category-manager-delete-${category.id}`} onClick={() => onDelete(category)} title={`Remove ${category.name}; games stay in NEO-LIB`} className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-red-500/15 hover:text-red-300"><Trash2 size={14} /></button>
              </div>
            );
          }) : (
            <div className="px-4 py-8 text-center text-sm text-muted">No categories yet. Your games are safely in Uncategorized.</div>
          )}
        </div>

        {regular.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t hairline pt-4">
            <p className="flex max-w-md items-start gap-2 text-[11px] leading-relaxed text-muted"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />Remove all regular categories at once. Private categories stay protected, so hidden games cannot accidentally become visible.</p>
            <button data-testid="category-manager-clear-regular" onClick={onClearRegular} className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20">Remove regular categories</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
