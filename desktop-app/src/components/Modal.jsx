import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, wide, testid }) {
  React.useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (open) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid={testid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className={
              'relative w-full max-h-[90vh] overflow-hidden rounded-2xl hairline bg-panel shadow-2xl ' +
              (wide ? 'max-w-3xl' : 'max-w-md')
            }
          >
            <div className="flex items-center justify-between border-b hairline px-5 py-3.5">
              <h2 className="font-display text-sm font-semibold tracking-wide uppercase">{title}</h2>
              <button
                data-testid="modal-close-btn"
                onClick={onClose}
                className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="max-h-[calc(90vh-3.5rem)] overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
