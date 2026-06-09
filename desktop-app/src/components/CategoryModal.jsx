import React from 'react';
import Modal from './Modal';
import { CATEGORY_COLORS } from '../lib/utils';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function CategoryModal({ open, onClose, onSubmit, initial }) {
  const editing = !!initial;
  const [name, setName] = React.useState('');
  const [colorId, setColorId] = React.useState('magenta');

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setColorId(initial?.colorId || 'magenta');
    }
  }, [open, initial]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({ name: trimmed, colorId });
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit category' : 'New category'} testid="category-modal">
      <div className="space-y-5 p-5">
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted">Name</label>
          <input
            data-testid="category-name-input"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="e.g. Favourites, Indie, RPG, To Play"
            className="w-full rounded-md bg-surface/60 hairline px-3 h-9 text-sm focus:outline-none focus:border-accent/60"
          />
        </div>

        <div>
          <div className="mb-2 text-[10px] uppercase tracking-wider text-muted">Color</div>
          <div className="grid grid-cols-9 gap-2">
            {CATEGORY_COLORS.map((c) => (
              <motion.button
                key={c.id}
                data-testid={`category-color-${c.id}`}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setColorId(c.id)}
                title={c.label}
                className="relative grid h-8 w-8 place-items-center rounded-full hairline"
                style={{ background: c.hex }}
              >
                {colorId === c.id && (
                  <motion.span
                    layoutId="catcheck"
                    className="grid h-5 w-5 place-items-center rounded-full bg-black/40"
                  >
                    <Check size={11} strokeWidth={3} className="text-white" />
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            data-testid="category-save-btn"
            onClick={submit}
            disabled={!name.trim()}
            className="neon rounded-full bg-[rgb(var(--accent))] px-5 py-2 text-xs font-bold text-[rgb(var(--surface))] disabled:opacity-50"
          >
            {editing ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
