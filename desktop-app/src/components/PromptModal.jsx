import React from 'react';
import Modal from './Modal';

/**
 * PromptModal — input modal replacing window.prompt (disabled in Electron).
 * Remount-based: parent should change a key (or unmount/remount) for each new prompt
 * so the initial value is set fresh.
 */
function PromptModalInner({
  onClose, onSubmit,
  title = 'Edit',
  label = 'Value',
  defaultValue = '',
  placeholder = '',
  multiline = false,
  confirmLabel = 'Save',
  testid = 'prompt-modal',
}) {
  const [value, setValue] = React.useState(defaultValue || '');
  const submit = () => {
    onSubmit?.(value);
    onClose?.();
  };
  return (
    <Modal open onClose={onClose} title={title} testid={testid}>
      <div className="space-y-4 p-5">
        <label className="block">
          <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted">{label}</span>
          {multiline ? (
            <textarea
              data-testid={`${testid}-input`}
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="w-full rounded-md hairline bg-surface/60 px-3 py-2 text-sm text-ink outline-none focus:border-[rgb(var(--accent))]"
            />
          ) : (
            <input
              data-testid={`${testid}-input`}
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder={placeholder}
              className="w-full rounded-md hairline bg-surface/60 px-3 py-2 text-sm text-ink outline-none focus:border-[rgb(var(--accent))]"
            />
          )}
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button
            data-testid={`${testid}-cancel`}
            onClick={onClose}
            className="rounded-md hairline px-3 py-1.5 text-xs text-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            data-testid={`${testid}-submit`}
            onClick={submit}
            className="rounded-md bg-[rgb(var(--accent))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--surface))]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function PromptModal({ open, ...props }) {
  // Force a fresh mount whenever opening so defaultValue is honored
  if (!open) return null;
  return <PromptModalInner {...props} />;
}
