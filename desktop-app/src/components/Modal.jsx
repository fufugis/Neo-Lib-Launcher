import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, GripHorizontal } from 'lucide-react';

/**
 * Movable modal.
 * - Backdrop click closes
 * - ESC closes
 * - Title bar acts as a drag handle (only the header pointer-downs start a drag)
 */
export default function Modal({ open, onClose, title, children, wide, testid }) {
  const constraintsRef = React.useRef(null);
  const dragControls = useDragControls();

  React.useEffect(() => {
    if (!open) return undefined;
    const h = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={constraintsRef}
          data-testid={testid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, pointerEvents: 'auto' }}
          exit={{ opacity: 0, pointerEvents: 'none', transition: { duration: 0.1 } }}
          transition={{ duration: 0.14 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/55 backdrop-blur-sm"
          onDoubleClick={onClose}
          style={{ pointerEvents: 'auto' }}
        >
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={constraintsRef}
            initial={{ scale: 0.96, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: 6, opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className={
              'relative w-full max-h-[90vh] overflow-hidden rounded-2xl hairline bg-panel shadow-2xl ' +
              (wide ? 'max-w-3xl' : 'max-w-md')
            }
          >
            {/* Drag handle / title bar — only this starts a drag */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex items-center justify-between border-b hairline px-5 py-3.5 cursor-move select-none"
              title="Drag to move"
            >
              <div className="flex items-center gap-2">
                <GripHorizontal size={13} className="text-muted/60" />
                <h2 className="font-display text-sm font-semibold tracking-wide uppercase">{title}</h2>
              </div>
              <button
                data-testid="modal-close-btn"
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                title="Close (Esc)"
                className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="max-h-[calc(90vh-3.5rem)] overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
