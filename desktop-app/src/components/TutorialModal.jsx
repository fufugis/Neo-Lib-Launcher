/* eslint-disable react-hooks/set-state-in-effect */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronLeft, Sparkles, X } from 'lucide-react';

/**
 * TutorialModal — first-time onboarding overlay.
 * Sequential steps; each step can optionally point at a UI element via
 * the [data-testid] attribute. Renders a centred card with arrow.
 */
const STEPS = [
  {
    title: 'Welcome to NEO-LIB',
    body: 'Your personal Steam-style game library — fully offline, fully yours. Let me show you around in 30 seconds.',
    target: null,
    icon: '✨',
  },
  {
    title: 'Add games',
    body: 'Click "Add" to point at a single .exe, or "Wizard" to auto-scan a folder/drive. Steam & Epic launcher imports are in the wizard too.',
    target: 'sidebar-add-btn',
    icon: '➕',
  },
  {
    title: 'Library settings',
    body: 'Click the sliders icon for quick controls: row size, spacing, icon position, category text + glow. Drag the popover by its header to move it.',
    target: 'sidebar-lib-settings-btn',
    icon: '🎚',
  },
  {
    title: 'Categories — your way',
    body: 'Create custom categories and drag games into them. Right-click a category (or use the 3-dot menu) to rename, recolor, or mark Private (PIN-protected "Ghost" categories).',
    target: 'category-new-btn',
    icon: '🏷',
  },
  {
    title: 'Themes & sound',
    body: 'Hit the sprocket for theme selection (Synthwave, Vaporwave Day, Crimson, etc.), sound packs, and visual effects. Each theme has its own ambient backdrop.',
    target: 'sidebar-settings-btn',
    icon: '🎨',
  },
  {
    title: 'Smart re-fetch',
    body: 'Pick a game and use "Re-fetch info" to open the Troubleshoot panel — fix only the icon, description, or screenshots, or re-search by name if you matched the wrong game.',
    target: 'detail-refetch-btn',
    icon: '🔧',
  },
  {
    title: "You're set",
    body: 'Open Settings any time to turn this tutorial back on. Happy curating!',
    target: null,
    icon: '🎮',
  },
];

export default function TutorialModal({ open, onClose, onDontShowAgain }) {
  const [idx, setIdx] = React.useState(0);
  const [anchor, setAnchor] = React.useState(null);
  const [dontShow, setDontShow] = React.useState(false);

  React.useEffect(() => { if (open) { setIdx(0); setDontShow(false); } }, [open]);

  // Update anchor rect when step changes
  React.useEffect(() => {
    if (!open) return undefined;
    const step = STEPS[idx];
    if (!step?.target) { setAnchor(null); return undefined; }
    const update = () => {
      const el = document.querySelector(`[data-testid="${step.target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        setAnchor({ x: r.left, y: r.top, w: r.width, h: r.height });
      } else {
        setAnchor(null);
      }
    };
    update();
    window.addEventListener('resize', update);
    const t = setInterval(update, 600); // in case sidebar resizes
    return () => { window.removeEventListener('resize', update); clearInterval(t); };
  }, [open, idx]);

  if (!open) return null;
  const step = STEPS[idx];
  const isLast = idx === STEPS.length - 1;

  const close = () => {
    if (dontShow) onDontShowAgain?.();
    onClose?.();
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="tutorial-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] bg-black/55 backdrop-blur-[2px]"
        data-testid="tutorial-modal"
      >
        {/* Spotlight on target */}
        {anchor && (
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="absolute rounded-xl"
            style={{
              left: anchor.x - 8,
              top: anchor.y - 8,
              width: anchor.w + 16,
              height: anchor.h + 16,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.65), 0 0 28px 4px rgb(var(--accent)/0.7)',
              border: '2px solid rgb(var(--accent))',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Arrow pointer pointing at target from card */}
        {anchor && (
          <motion.svg
            className="pointer-events-none absolute"
            style={{ left: anchor.x + anchor.w / 2 - 12, top: anchor.y + anchor.h + 6, width: 24, height: 24 }}
            viewBox="0 0 24 24"
          >
            <path d="M12 4 L4 18 L20 18 Z" fill="rgb(var(--accent))" />
          </motion.svg>
        )}

        {/* Centred step card */}
        <motion.div
          key={idx}
          initial={{ y: 20, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(440px,calc(100vw-32px))] rounded-2xl hairline glass shadow-2xl p-6"
        >
          <button
            data-testid="tutorial-close"
            onClick={close}
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink"
            title="Close (Esc)"
          >
            <X size={14} />
          </button>

          <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[rgb(var(--accent-2))]">
            <Sparkles size={11} /> Step {idx + 1} of {STEPS.length}
          </div>
          <div className="mb-3 text-3xl">{step.icon}</div>
          <h2 className="font-display text-xl font-bold mb-2 neon-text">{step.title}</h2>
          <p className="text-sm text-muted leading-relaxed">{step.body}</p>

          {/* Progress dots */}
          <div className="mt-5 mb-4 flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === idx ? 24 : 8,
                  background: i === idx ? 'rgb(var(--accent))' : 'rgb(var(--border))',
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[11px] text-muted cursor-pointer">
              <input
                type="checkbox"
                data-testid="tutorial-dont-show"
                checked={dontShow}
                onChange={(e) => setDontShow(e.target.checked)}
                className="accent-[rgb(var(--accent))]"
              />
              Don&apos;t show again
            </label>
            <div className="flex items-center gap-2">
              <button
                data-testid="tutorial-prev"
                disabled={idx === 0}
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                className="grid h-8 w-8 place-items-center rounded-md hairline text-muted hover:text-ink disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              {isLast ? (
                <button
                  data-testid="tutorial-finish"
                  onClick={close}
                  className="rounded-md bg-[rgb(var(--accent))] px-4 py-1.5 text-xs font-semibold text-[rgb(var(--surface))]"
                >
                  Got it
                </button>
              ) : (
                <button
                  data-testid="tutorial-next"
                  onClick={() => setIdx((i) => Math.min(STEPS.length - 1, i + 1))}
                  className="flex items-center gap-1 rounded-md bg-[rgb(var(--accent))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--surface))]"
                >
                  Next <ChevronRight size={12} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
