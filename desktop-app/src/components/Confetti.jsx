import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Confetti — theme-aware sparkle burst.
 *
 * Renders a fixed-position portal-like layer that fires N particles outward
 * from the screen center (or a `origin` { x, y } point), then unmounts itself.
 *
 * Trigger by bumping the `triggerKey` prop (any unique value — Date.now() works).
 * The component auto-cleans 1100ms later so you can fire-and-forget.
 *
 * Themes pull from the live CSS variables --accent and --accent-2, so the
 * confetti always matches the user's active vibe.
 */
export default function Confetti({ triggerKey, origin = null, count = 32, label = '' }) {
  const [bursts, setBursts] = React.useState([]);

  React.useEffect(() => {
    if (!triggerKey) return;
    const id = triggerKey + '-' + Math.random().toString(36).slice(2, 6);
    const ox = origin?.x ?? window.innerWidth / 2;
    const oy = origin?.y ?? window.innerHeight / 2;

    // Pull theme colors from live CSS vars so confetti matches active theme
    const styles = getComputedStyle(document.documentElement);
    const a1 = `rgb(${styles.getPropertyValue('--accent').trim()})`;
    const a2 = `rgb(${styles.getPropertyValue('--accent-2').trim()})`;
    const ink = `rgb(${styles.getPropertyValue('--ink').trim()})`;
    const palette = [a1, a2, ink, a1, a2]; // accent bias

    const particles = Array.from({ length: count }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 90 + Math.random() * 180;
      return {
        i,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed * 0.85 - 30, // slight upward bias
        size: 4 + Math.random() * 5,
        color: palette[i % palette.length],
        rotate: (Math.random() - 0.5) * 540,
        shape: i % 3, // 0 = square, 1 = circle, 2 = star spark
      };
    });

    setBursts((prev) => [...prev, { id, ox, oy, particles, label }]);
    const t = setTimeout(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[300] overflow-hidden"
      aria-hidden="true"
      data-testid="confetti-layer"
    >
      <AnimatePresence>
        {bursts.map((b) => (
          <div key={b.id} style={{ position: 'absolute', left: b.ox, top: b.oy }}>
            {b.particles.map((p) => (
              <motion.span
                key={p.i}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                animate={{
                  x: p.dx,
                  y: p.dy + 220, // gravity pulls particles down at the end
                  opacity: 0,
                  rotate: p.rotate,
                  scale: 0.4,
                }}
                transition={{ duration: 0.95 + Math.random() * 0.15, ease: [0.2, 0.7, 0.3, 1] }}
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  borderRadius: p.shape === 1 ? '50%' : p.shape === 2 ? '2px' : '1px',
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}, 0 0 ${p.size * 4}px ${p.color}55`,
                  transformOrigin: 'center',
                  willChange: 'transform, opacity',
                }}
              />
            ))}
            {/* Optional center label flash */}
            {b.label && (
              <motion.div
                initial={{ y: -8, opacity: 0, scale: 0.85 }}
                animate={{ y: -28, opacity: [0, 1, 1, 0], scale: 1 }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transform: 'translate(-50%, -50%)',
                  fontFamily: '"Orbitron", "Inter", system-ui, sans-serif',
                  fontWeight: 800,
                  fontSize: 14,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgb(var(--ink))',
                  textShadow: '0 0 12px rgb(var(--accent)), 0 0 24px rgb(var(--accent) / 0.6)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {b.label}
              </motion.div>
            )}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
