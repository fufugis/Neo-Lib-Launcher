import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * StartupIntro — 3-second synthwave logo reveal that plays on app boot.
 * Shows a stylized NEO-LIB logo with animated grid, horizon glow, sun rise,
 * and a scanline sweep. Fires a short WebAudio "hook" chord on mount so it
 * feels like an intro jingle.
 *
 * Renders as a full-screen overlay. Auto-dismisses after 3.0s.
 * Skippable by clicking anywhere on the overlay.
 *
 * v1.4.0.
 */
export default function StartupIntro({ onDone, muted = false }) {
  const [visible, setVisible] = React.useState(true);
  const audioRef = React.useRef(null);

  React.useEffect(() => {
    if (!muted) playJingle().then((ctx) => { audioRef.current = ctx; }).catch(() => {});
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone && onDone(), 480);
    }, 3000);
    return () => {
      clearTimeout(t);
      try { audioRef.current && audioRef.current.close && audioRef.current.close(); } catch { /* noop */ }
    };
  }, [muted, onDone]);

  const skip = () => {
    setVisible(false);
    setTimeout(() => onDone && onDone(), 200);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={skip}
          data-testid="startup-intro"
          className="fixed inset-0 z-[9998] flex items-center justify-center overflow-hidden cursor-pointer"
          style={{ background: 'radial-gradient(ellipse at 50% 55%, #180a2e 0%, #05020d 65%, #000 100%)' }}
        >
          {/* Grid floor */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute -bottom-[10%] left-[-10%] right-[-10%] h-[55%]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,42,138,0.85) 1px, transparent 1px),' +
                'linear-gradient(90deg, rgba(0,229,255,0.7) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
              transform: 'perspective(600px) rotateX(62deg)',
              transformOrigin: 'center top',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 65%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 65%, transparent 100%)',
              animation: 'introFloorPan 3s linear infinite',
            }}
          />
          {/* Sun */}
          <motion.div
            aria-hidden
            initial={{ y: 160, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-[36%] h-[280px] w-[280px] -translate-x-1/2 rounded-full"
            style={{
              background: 'linear-gradient(180deg, #ffd86b 0%, #ff7ab8 45%, #ff2a8a 75%, #7a1a56 100%)',
              boxShadow: '0 0 100px rgba(255,80,180,0.6), 0 0 220px rgba(255,42,138,0.4)',
              maskImage:
                'linear-gradient(to bottom, black 0 40%, transparent 42% 45%, black 47% 55%, transparent 57% 60%, black 62% 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, black 0 40%, transparent 42% 45%, black 47% 55%, transparent 57% 60%, black 62% 100%)',
            }}
          />
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 select-none text-center"
          >
            <div
              className="font-display text-[86px] font-black tracking-[0.08em] leading-none"
              style={{
                background: 'linear-gradient(180deg, #fff 0%, #ffd6ec 40%, #ff2a8a 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 0 30px rgba(255,42,138,0.55), 0 0 60px rgba(0,229,255,0.35)',
                filter: 'drop-shadow(0 4px 20px rgba(255,42,138,0.6))',
              }}
            >
              NEO-LIB
            </div>
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '100%' }}
              transition={{ delay: 0.7, duration: 0.7 }}
              className="mx-auto mt-2 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,42,138,0.9), rgba(0,229,255,0.9), transparent)',
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-3 text-[11px] uppercase tracking-[0.42em] text-white/70"
              style={{ textShadow: '0 0 8px rgba(0,229,255,0.6)' }}
            >
              your game library — reloaded
            </motion.div>
          </motion.div>
          {/* Scanline sweep */}
          <motion.div
            aria-hidden
            initial={{ y: '-100%' }}
            animate={{ y: '150%' }}
            transition={{ delay: 1.2, duration: 1.6, ease: 'linear' }}
            className="pointer-events-none absolute inset-x-0 h-24"
            style={{
              background:
                'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.14) 45%, rgba(0,229,255,0.35) 50%, rgba(255,255,255,0.14) 55%, transparent 100%)',
              filter: 'blur(2px)',
            }}
          />
          {/* Skip hint */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.28em] text-white/40">
            click anywhere to skip
          </div>
          <style>{`
            @keyframes introFloorPan {
              0%   { background-position: 0 0, 0 0; }
              100% { background-position: 0 80px, 80px 0; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* WebAudio-synthesized "synthwave hook":
   - Wall of pad chord (Am9 voicing): A2 + E3 + A3 + C4 + E4 + G4
   - Kick thump at t=0 and t=1.2s
   - A single lead pluck at t=0.6s (A5)
   Returns the AudioContext for cleanup. */
async function playJingle() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const now = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);

  // ---- Pad chord ----
  const chord = [110, 164.81, 220, 261.63, 329.63, 392]; // A2 E3 A3 C4 E4 G4
  chord.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = i < 2 ? 'sawtooth' : 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.08, now + 0.4);
    g.gain.linearRampToValueAtTime(0.05, now + 2.4);
    g.gain.linearRampToValueAtTime(0.0001, now + 2.9);
    // Slow attack, gentle stereo detune
    osc.detune.value = (i - 2.5) * 4;
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + 3);
  });

  // ---- Kick x2 ----
  [0, 1.2].forEach((t) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now + t);
    osc.frequency.exponentialRampToValueAtTime(40, now + t + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.6, now + t);
    g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.25);
    osc.connect(g);
    g.connect(master);
    osc.start(now + t);
    osc.stop(now + t + 0.3);
  });

  // ---- Lead pluck (A5) ----
  const lead = ctx.createOscillator();
  lead.type = 'square';
  lead.frequency.value = 880;
  const lg = ctx.createGain();
  lg.gain.setValueAtTime(0.0001, now + 0.6);
  lg.gain.linearRampToValueAtTime(0.14, now + 0.62);
  lg.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
  // A little swept lowpass so the pluck softens
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(4000, now + 0.6);
  lp.frequency.exponentialRampToValueAtTime(600, now + 1.2);
  lead.connect(lp);
  lp.connect(lg);
  lg.connect(master);
  lead.start(now + 0.6);
  lead.stop(now + 1.25);

  return ctx;
}
