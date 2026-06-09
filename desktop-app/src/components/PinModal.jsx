import React from 'react';
import Modal from './Modal';
import { motion } from 'framer-motion';
import { Lock, KeyRound, X } from 'lucide-react';

/**
 * PinModal — used in 3 modes:
 *   mode="set":    create a new PIN (asks twice)
 *   mode="unlock": prompt to enter PIN to unlock a ghost category
 *   mode="remove": prompt to enter PIN to confirm removing privacy
 */
export default function PinModal({ open, mode, onClose, onSubmit, categoryName, error }) {
  const [pin, setPin] = React.useState('');
  const [pin2, setPin2] = React.useState('');

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open) {
      setPin('');
      setPin2('');
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const title = mode === 'set' ? 'Set PIN' : mode === 'remove' ? 'Confirm PIN' : 'Unlock category';
  const valid =
    mode === 'set'
      ? /^\d{4}$/.test(pin) && pin === pin2
      : /^\d{4}$/.test(pin);

  return (
    <Modal open={open} onClose={onClose} title={title} testid="pin-modal">
      <div className="space-y-5 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full hairline neon">
            <Lock size={16} className="text-[rgb(var(--accent))]" />
          </div>
          <div className="text-sm">
            {mode === 'set' && (
              <>Set a 4-digit PIN to hide <span className="font-semibold">{categoryName}</span> behind a Ghost lock.</>
            )}
            {mode === 'unlock' && (
              <>Enter the PIN for <span className="font-semibold">{categoryName}</span> to reveal its games.</>
            )}
            {mode === 'remove' && (
              <>Enter the PIN for <span className="font-semibold">{categoryName}</span> to disable privacy.</>
            )}
          </div>
        </div>

        <PinInput value={pin} onChange={setPin} testid="pin-input" autoFocus />
        {mode === 'set' && (
          <PinInput value={pin2} onChange={setPin2} testid="pin-input-2" placeholder="Confirm" />
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <X size={12} /> {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink">
            Cancel
          </button>
          <button
            data-testid="pin-submit-btn"
            disabled={!valid}
            onClick={() => onSubmit(pin)}
            className="neon inline-flex items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-5 py-2 text-xs font-bold text-[rgb(var(--surface))] disabled:opacity-50"
          >
            <KeyRound size={13} /> {mode === 'set' ? 'Save PIN' : 'Confirm'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PinInput({ value, onChange, placeholder = '4-digit PIN', autoFocus, testid }) {
  return (
    <motion.input
      autoFocus={autoFocus}
      data-testid={testid}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
      placeholder={placeholder}
      inputMode="numeric"
      maxLength={4}
      className="w-full rounded-lg bg-surface/60 hairline px-4 h-12 text-center font-mono text-2xl tracking-[0.6em] focus:outline-none focus:border-accent/60"
      whileFocus={{ scale: 1.01 }}
    />
  );
}
