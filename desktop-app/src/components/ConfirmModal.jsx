import React from 'react';
import Modal from './Modal';

/**
 * ConfirmModal — drop-in replacement for window.confirm() (disabled in Electron).
 * Simple Yes / No. The negative button is highlighted on destructive flows.
 */
export default function ConfirmModal({
  open, onClose, onConfirm,
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
  destructive = false,
  testid = 'confirm-modal',
}) {
  if (!open) return null;
  return (
    <Modal open onClose={onClose} title={title} testid={testid}>
      <div className="space-y-4 p-5">
        <p className="text-sm text-ink/90 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2 pt-1">
          <button
            data-testid={`${testid}-cancel`}
            onClick={onClose}
            className="rounded-md hairline px-3 py-1.5 text-xs text-muted hover:text-ink"
          >
            {cancelLabel}
          </button>
          <button
            data-testid={`${testid}-confirm`}
            onClick={() => { onConfirm?.(); onClose?.(); }}
            className={
              'rounded-md px-3 py-1.5 text-xs font-semibold ' +
              (destructive
                ? 'bg-red-500/90 text-white hover:bg-red-500'
                : 'bg-[rgb(var(--accent))] text-[rgb(var(--surface))]')
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
