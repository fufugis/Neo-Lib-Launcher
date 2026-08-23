import React from 'react';
import Modal from './Modal';

/**
 * ConfirmModal — drop-in replacement for window.confirm() (disabled in Electron).
 * Simple Yes / No. The negative button is highlighted on destructive flows.
 *
 * v1.6.0 — Optional `typedConfirm` prop. When set to a string like "RESET",
 * the confirm button stays disabled until the user types that exact string
 * in a small input. Used to guard high-value destructive actions (large
 * playtime resets, etc.).
 */
export default function ConfirmModal({
  open, onClose, onConfirm,
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
  destructive = false,
  typedConfirm = undefined,
  testid = 'confirm-modal',
}) {
  const [typed, setTyped] = React.useState('');
  React.useEffect(() => { if (open) setTyped(''); }, [open]);
  if (!open) return null;
  const typedOk = !typedConfirm || typed.trim() === typedConfirm;
  return (
    <Modal open onClose={onClose} title={title} testid={testid}>
      <div className="space-y-4 p-5">
        <p className="whitespace-pre-line text-sm text-ink/90 leading-relaxed">{message}</p>
        {typedConfirm && (
          <input
            data-testid={`${testid}-typed-input`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={`Type ${typedConfirm}`}
            autoFocus
            className="w-full rounded-md hairline bg-panel/40 px-3 py-2 text-sm outline-none focus:border-[rgb(var(--accent)/0.6)]"
          />
        )}
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
            disabled={!typedOk}
            onClick={() => { if (!typedOk) return; onConfirm?.(); onClose?.(); }}
            className={
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-opacity ' +
              (!typedOk ? 'opacity-40 cursor-not-allowed ' : '') +
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
