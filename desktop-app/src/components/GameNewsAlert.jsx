import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ExternalLink, X } from 'lucide-react';

/**
 * GameNewsAlert — center-of-screen popup that fires when a watched game
 * (favorited OR rated 5 stars) receives new news. Plays a soft chime,
 * clicking outside dismisses, "Read news" opens the link and closes.
 *
 * v1.4.0.
 */
export default function GameNewsAlert({ alert, onDismiss, onOpen, muted = false }) {
  React.useEffect(() => {
    if (!alert || muted) return undefined;
    playChime();
    return undefined;
  }, [alert?.id, muted]);

  if (!alert) return null;
  const body = (
    <AnimatePresence>
      <motion.div
        key={`alert-${alert.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onDismiss?.();
        }}
        data-testid="game-news-alert-backdrop"
        className="fixed inset-0 z-[9997] grid place-items-center"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onMouseDown={(e) => e.stopPropagation()}
          data-testid="game-news-alert-card"
          className="relative w-full max-w-md overflow-hidden rounded-2xl hairline shadow-2xl"
          style={{
            backgroundColor: 'rgb(var(--panel))',
            border: '1px solid rgb(var(--accent) / 0.55)',
            boxShadow: '0 30px 80px -20px rgba(0,0,0,0.9), 0 0 60px -10px rgb(var(--accent)/0.5)',
          }}
        >
          {/* Header strip */}
          <div
            className="flex items-center gap-3 px-5 py-3"
            style={{
              background:
                'linear-gradient(90deg, rgb(var(--accent) / 0.18) 0%, rgb(var(--accent-2) / 0.12) 100%)',
              borderBottom: '1px solid rgb(var(--border))',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="grid h-9 w-9 place-items-center rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)',
                color: 'rgb(var(--surface))',
                boxShadow: '0 0 14px rgb(var(--accent) / 0.55)',
              }}
            >
              <Bell size={16} />
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.28em] text-[rgb(var(--accent))] font-bold">
                Watched game — new news
              </div>
              <div className="truncate text-[15px] font-bold text-ink">
                {alert.gameName || 'Your favourite'}
              </div>
            </div>
            <button
              onClick={onDismiss}
              data-testid="alert-close-btn"
              className="grid h-8 w-8 place-items-center rounded-md text-muted hover:text-ink hover:bg-surface/40"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
          {/* Body */}
          <div className="px-5 py-4">
            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted">
              {alert.source || 'update'} · {alert.timeLabel || 'just now'}
            </div>
            <div className="mb-3 text-[14px] font-semibold text-ink leading-snug">
              {alert.title}
            </div>
            {alert.snippet && (
              <p className="text-[12.5px] text-muted leading-relaxed line-clamp-4">
                {alert.snippet}
              </p>
            )}
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[rgb(var(--border))] px-5 py-3">
            <span className="text-[10.5px] text-muted">
              Click outside to dismiss
            </span>
            <button
              onClick={() => { onOpen?.(alert); }}
              data-testid="alert-read-btn"
              className="inline-flex items-center gap-1.5 rounded-md px-3 h-8 text-[11.5px] font-bold text-white transition-transform hover:scale-[1.03]"
              style={{
                background: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)',
                boxShadow: '0 0 12px -3px rgb(var(--accent)/0.7)',
              }}
            >
              Read news <ExternalLink size={12} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
  if (typeof document === 'undefined') return body;
  return createPortal(body, document.body);
}

/* Soft two-tone bell chime, ~700ms total. */
async function playChime() {
  if (typeof window === 'undefined') return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.16;
  master.connect(ctx.destination);
  const notes = [{ f: 987.77, t: 0 }, { f: 1318.51, t: 0.14 }]; // B5, E6
  notes.forEach(({ f, t }) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now + t);
    g.gain.linearRampToValueAtTime(0.5, now + t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.55);
    osc.connect(g);
    g.connect(master);
    osc.start(now + t);
    osc.stop(now + t + 0.6);
  });
  setTimeout(() => { try { ctx.close(); } catch { /* noop */ } }, 900);
}
