/* eslint-disable react-hooks/set-state-in-effect */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronLeft, Sparkles, X } from 'lucide-react';
import { playFungistCue } from '../lib/sound';
import { playFungistVoice } from '../lib/mascotVoice';

const FUNGIST_ASSET = `${import.meta.env.BASE_URL}mascot/fungist-stand.png`;

/**
 * TutorialModal — first-time onboarding overlay.
 * This is a live tour rather than a list of tooltips: every step asks App to
 * show the relevant area, then spotlights the real control or surface.
 */
const STEPS = [
  {
    title: 'Welcome to your NEO-LIB',
    body: 'One private, portable place for every game on this PC. Let’s take a quick look around before you start building your library.',
    target: null,
    view: 'home',
    icon: '✨',
    mascot: true,
  },
  {
    title: 'This is your Library',
    body: 'Imported games live here, grouped into shelves you control. Use + Add for one title or Wizard to scan folders and installed launchers. Your library remains on this PC.',
    target: ['sidebar-tree', 'sidebar-add-btn'],
    view: 'library',
    icon: '📚',
    mascot: true,
  },
  {
    title: 'Every game gets its own Preview',
    body: 'Select a game and this side becomes its control room: Launch, artwork, description, genres and tags, news, updates, ratings, saves, and Customize all live together here.',
    target: ['detail-title', 'detail-launch-btn', 'sidebar-tree'],
    view: 'preview',
    icon: '🎮',
  },
  {
    title: 'Tools are part of the launcher',
    body: 'NEO-LIB switches into the real Tools view here. Keep GPU-Z, CPU-Z, hardware panels, mod editors, and other useful programs beside your games instead of hunting for shortcuts.',
    target: 'tab-tools',
    view: 'tools',
    icon: '🧰',
  },
  {
    title: 'Make the launcher yours',
    body: 'Visuals is open for you now. Pick a theme, then refine text, rows, category markers, glow, effects, textures, spacing, and layout until the library feels right.',
    target: ['library-settings-popover', 'sidebar-visuals-btn'],
    view: 'visuals',
    icon: '🎨',
  },
  {
    title: 'Home is your game-life dashboard',
    body: 'Three places to start: Top 5 Played remembers your favourites, News and Game Updates surface what changed, and Library Health / Storage point out games that need a little attention. Drag, hide, and restore most panels your way.',
    target: 'tab-home',
    view: 'home',
    icon: '🏠',
  },
  {
    title: 'Game Ready watches the basics',
    body: 'This bottom bar reads local CPU and RAM use. Green means ready, amber suggests a quick check, and red means your PC is under pressure. Click it for the details and useful next steps.',
    target: 'system-health-footer',
    view: 'home',
    icon: '⚡',
  },
  {
    title: 'Meet Fungist',
    body: 'Fungist rests here when things are calm. He can flag PC pressure, favourite-game news, confirmed updates, and a new NEO-LIB version. Click him to chat with your configured AI; right-click for Inbox and quick settings. He stays quiet while a game is running.',
    target: 'fungist-mascot',
    view: 'home',
    icon: '👾',
    mascot: true,
  },
];

export default function TutorialModal({ open, onClose, onDontShowAgain, onNavigate, soundsEnabled = true, voiceEnabled = true, voiceVolume = 72 }) {
  const [idx, setIdx] = React.useState(0);
  const [anchor, setAnchor] = React.useState(null);
  const [dontShow, setDontShow] = React.useState(false);
  const [spokenLine, setSpokenLine] = React.useState(null);
  const wasOpen = React.useRef(false);
  const speechTimer = React.useRef(null);

  // The tutorial sits above the docked companion. Mirror the shared Fungist
  // speaking event inside it so the welcome/introduction recordings always
  // have an on-screen quote and never sound detached from the tour.
  React.useEffect(() => {
    const showSpeech = (event) => {
      const line = event.detail;
      if (!open || !line?.speech) return;
      window.clearTimeout(speechTimer.current);
      setSpokenLine(line);
      speechTimer.current = window.setTimeout(() => setSpokenLine(null), Number(line.durationMs) || 3_800);
    };
    window.addEventListener('neolib-fungist-speaking', showSpeech);
    return () => {
      window.removeEventListener('neolib-fungist-speaking', showSpeech);
      window.clearTimeout(speechTimer.current);
    };
  }, [open]);

  React.useEffect(() => {
    if (open && !wasOpen.current) {
      setIdx(0);
      setDontShow(false);
      if (soundsEnabled && voiceEnabled) playFungistVoice('welcome', { volume: voiceVolume, cooldownMs: 12_000, priority: true });
      else if (soundsEnabled) playFungistCue('welcome');
    }
    wasOpen.current = open;
  }, [open, soundsEnabled, voiceEnabled, voiceVolume]);

  React.useEffect(() => {
    if (open && idx === STEPS.length - 1 && soundsEnabled && voiceEnabled) {
      playFungistVoice('introduce', { volume: voiceVolume, cooldownMs: 18_000 });
    }
  }, [idx, open, soundsEnabled, voiceEnabled, voiceVolume]);

  // Reveal each real destination before measuring its target. The short delay
  // gives React time to paint Home/Tools or the Visuals popover first.
  React.useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => onNavigate?.(STEPS[idx].view), 24);
    return () => window.clearTimeout(timer);
  }, [idx, onNavigate, open]);

  // Update anchor rect when step changes
  React.useEffect(() => {
    if (!open) return undefined;
    const step = STEPS[idx];
    const targets = Array.isArray(step?.target) ? step.target : [step?.target];
    if (!targets.filter(Boolean).length) { setAnchor(null); return undefined; }
    const update = () => {
      const el = targets.map((target) => document.querySelector(`[data-testid="${target}"]`)).find(Boolean);
      if (el) {
        const r = el.getBoundingClientRect();
        setAnchor({ x: r.left, y: r.top, w: r.width, h: r.height });
      } else {
        setAnchor(null);
      }
    };
    update();
    window.addEventListener('resize', update);
    const firstPaint = window.setTimeout(update, 120);
    const t = setInterval(update, 600); // in case sidebar resizes
    return () => { window.removeEventListener('resize', update); window.clearTimeout(firstPaint); clearInterval(t); };
  }, [open, idx]);

  if (!open) return null;
  const step = STEPS[idx];
  const isLast = idx === STEPS.length - 1;

  // Compute card position: next to the spotlight if there's one, else centred
  const cardStyle = (() => {
    if (!anchor) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    const vw = window.innerWidth, vh = window.innerHeight;
    const cardW = 380, cardH = Math.min(460, vh - 24), gap = 18;
    // Prefer placing the card on the right of the spotlight; if it spills, switch sides
    let left = anchor.x + anchor.w + gap;
    let top  = anchor.y + anchor.h / 2 - cardH / 2;
    if (left + cardW > vw - 16) left = anchor.x - cardW - gap;
    if (left < 16) {
      // Fall back to below the spotlight
      left = Math.min(Math.max(16, anchor.x + anchor.w / 2 - cardW / 2), vw - cardW - 16);
      top  = anchor.y + anchor.h + gap;
    }
    if (top + cardH > vh - 16) top = Math.max(16, vh - cardH - 16);
    if (top < 16) top = 16;
    return { left, top };
  })();

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
        className="fixed inset-0 z-[150] bg-black/20"
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

        {/* Centred step card → relocated next to spotlight */}
        <motion.div
          key={idx}
          initial={{ y: 12, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'absolute', width: 'min(380px, calc(100vw - 32px))', maxHeight: 'calc(100vh - 24px)', ...cardStyle }}
          className="overflow-y-auto rounded-2xl hairline bg-panel/95 shadow-2xl p-5"
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
          {step.mascot && <img src={FUNGIST_ASSET} alt="Fungist, the NEO-LIB companion" className="pointer-events-none absolute right-4 top-11 h-16 w-16 object-contain opacity-95" />}
          <div className={`mb-3 text-3xl ${step.mascot ? 'pr-16' : ''}`}>{step.icon}</div>
          <h2 className={`font-display text-xl font-bold mb-2 neon-text ${step.mascot ? 'pr-16' : ''}`}>{step.title}</h2>
          <p className={`text-sm text-muted leading-relaxed ${step.mascot ? 'pr-16' : ''}`}>{step.body}</p>
          <AnimatePresence>
            {spokenLine && (
              <motion.div initial={{ opacity: 0, y: 5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }} className="mt-3 rounded-xl border border-[rgb(var(--accent)/0.48)] bg-[rgb(var(--accent)/0.10)] px-3 py-2" data-testid="tutorial-fungist-speech">
                <p className="text-[8.5px] font-black uppercase tracking-[0.16em] text-[rgb(var(--accent-2))]">Fungist says</p>
                <p className="mt-0.5 text-[11px] font-bold leading-relaxed text-ink">“{spokenLine.speech}”</p>
              </motion.div>
            )}
          </AnimatePresence>

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
