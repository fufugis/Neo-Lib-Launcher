import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MoonStar, X } from 'lucide-react';

const portraitFor = (mascotId) => mascotId === 'fifi'
  ? `${import.meta.env.BASE_URL}mascot/fifi/poses/fifi-idle-v1.png`
  : `${import.meta.env.BASE_URL}mascot/fungist-3d-sleep.png`;

export default function MajorMascotNotice({ notice, mascotId = 'fungist', onClose }) {
  const mascotName = mascotId === 'fifi' ? 'FiFi' : 'Fungist';
  const resting = notice?.kind === 'external-rest';
  return <AnimatePresence>
    {notice && (
      <motion.div
        key={notice.key}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none fixed inset-0 z-[9990] grid place-items-center bg-black/20 px-5 backdrop-blur-[2px]"
        data-testid="major-mascot-notice"
        role="status"
        aria-live="assertive"
      >
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 230, damping: 24 }}
          className="pointer-events-auto relative flex w-[min(620px,92vw)] items-center gap-5 rounded-3xl border border-[rgb(var(--accent)/0.72)] bg-[rgb(var(--panel)/0.97)] p-5 pr-14 shadow-[0_30px_100px_-22px_rgba(0,0,0,.96),0_0_48px_-14px_rgb(var(--accent)/.78)]"
        >
          <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-[rgb(var(--accent)/0.34)] bg-[rgb(var(--accent)/0.08)]">
            <img src={portraitFor(mascotId)} alt="" className="h-20 w-20 object-contain" />
            <span className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-full border border-[rgb(var(--accent)/0.55)] bg-[rgb(var(--surface))] text-[rgb(var(--accent-2))] shadow-lg"><MoonStar size={18} /></span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">{mascotName} handled it</p>
            <h2 className="mt-1.5 text-[clamp(19px,2.1vw,25px)] font-black leading-tight text-ink">{notice.title}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">{notice.body}</p>
            <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold ${resting ? 'border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-200' : 'border-amber-300/30 bg-amber-300/[0.08] text-amber-200'}`}><span className={`h-2 w-2 rounded-full ${resting ? 'bg-emerald-300 shadow-[0_0_10px_#6ee7b7]' : 'bg-amber-300 shadow-[0_0_10px_#fcd34d]'}`} />{notice.status || (resting ? 'Rest Mode active' : 'Important notice')}</div>
          </div>
          <button type="button" onClick={onClose} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border)/0.7)] text-muted hover:bg-white/10 hover:text-ink" aria-label="Dismiss major mascot message"><X size={17} /></button>
        </motion.section>
      </motion.div>
    )}
  </AnimatePresence>;
}
