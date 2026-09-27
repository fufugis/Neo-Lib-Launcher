import React from 'react';
import { X } from 'lucide-react';
import { loungeSessionContext } from './lounge-context.mjs';

export default function LoungeMascotNotice({ game, updateLedger, mascotId = 'fungist', onDismiss }) {
  const context = loungeSessionContext(game, updateLedger);
  if (!context?.updateFlagged) return null;
  const name = mascotId === 'fifi' ? 'FiFi' : 'Fungist';
  const portrait = mascotId === 'fifi' ? 'mascot/fifi/poses/fifi-idle-v1.png' : 'mascot/fungist-3d-sleep.png';
  return <aside data-testid="lounge-mascot-notice" role="status" className="absolute bottom-5 right-5 z-20 flex max-w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl border border-amber-300/50 bg-[rgb(var(--panel)/0.97)] p-3 text-sm text-ink shadow-[0_16px_48px_rgb(0_0_0/0.4)] backdrop-blur-xl">
    <img src={`${import.meta.env.BASE_URL}${portrait}`} alt="" className="h-12 w-12 shrink-0 object-contain" />
    <div className="min-w-0 flex-1"><strong className="text-amber-200">{name} noticed something</strong><p className="mt-1">{context.updateNote}</p></div>
    <button type="button" onClick={onDismiss} aria-label="Dismiss Lounge notice" className="rounded-lg p-1 text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]"><X size={16} /></button>
  </aside>;
}
