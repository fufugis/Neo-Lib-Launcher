import React from 'react';
import Modal from './Modal';
import { Heart, ExternalLink, Copy, Check } from 'lucide-react';
import qrUrl from '../assets/donate-qr.png';

export const DONATE_PAYPAL_URL = 'https://www.paypal.com/ncp/payment/6B8RZY6Q6CFFU';

/**
 * DonateModal — shows PayPal button + QR code so users can support NEO-LIB.
 */
export default function DonateModal({ open, onClose }) {
  const [copied, setCopied] = React.useState(false);
  if (!open) return null;
  const copyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(DONATE_PAYPAL_URL).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      });
    }
  };
  const openPaypal = () => {
    if (typeof window !== 'undefined' && window.api?.openExternal) window.api.openExternal(DONATE_PAYPAL_URL);
    else window.open(DONATE_PAYPAL_URL, '_blank');
  };
  return (
    <Modal open onClose={onClose} title="Buy KenLun a coffee" testid="donate-modal">
      <div className="p-5 space-y-5">
        <div className="flex items-start gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
            style={{ background: 'rgb(var(--accent) / 0.2)' }}
          >
            <Heart size={18} className="text-[rgb(var(--accent))]" />
          </div>
          <div className="text-sm text-muted leading-relaxed">
            NEO-LIB is built by <span className="text-ink font-semibold">KenLun</span> and is completely free.
            If it brings you joy, a coffee fuels the next update. Cheers.
          </div>
        </div>

        {/* PayPal button — exact style from your snippet */}
        <button
          data-testid="donate-paypal-btn"
          onClick={openPaypal}
          className="w-full font-bold text-black hover:opacity-90 transition-opacity"
          style={{
            background: '#FFD140',
            borderRadius: '0.25rem',
            minWidth: '11.625rem',
            padding: '0 2rem',
            height: '2.625rem',
            fontFamily: '"Helvetica Neue",Arial,sans-serif',
            fontSize: '1rem',
            lineHeight: '1.25rem',
            cursor: 'pointer',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          Buy Now <ExternalLink size={14} />
        </button>
        <div className="-mt-2 text-center text-[10px] text-muted">Powered by PayPal · cards accepted</div>

        {/* QR */}
        <div className="rounded-lg hairline bg-white p-4 flex flex-col items-center gap-3">
          <img src={qrUrl} alt="Donate QR" className="h-56 w-56" />
          <div className="text-center text-[12px] leading-relaxed text-black/85">
            <div className="font-bold mb-0.5">Or scan with your phone</div>
            <div className="text-black/60 text-[10.5px]">Opens PayPal checkout directly.</div>
          </div>
        </div>

        {/* Copyable URL */}
        <div className="rounded-md hairline bg-surface/60 px-3 py-2 flex items-center gap-2">
          <code className="flex-1 truncate text-[11px] text-muted font-mono">{DONATE_PAYPAL_URL}</code>
          <button
            data-testid="donate-copy"
            onClick={copyUrl}
            className="grid h-7 w-7 place-items-center rounded text-muted hover:text-ink hover:bg-surface"
            title="Copy link"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        </div>
      </div>
    </Modal>
  );
}
