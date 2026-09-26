import React from 'react';
import { customThemeAssetUrl, customThemeManifest } from '../themes/stock-theme-registry.mjs';
import { particlePosition } from '../themes/particle-placement.mjs';

// A custom theme supplies artwork and bounded motion settings, never CSS or JS.
// The host owns animation, layering, performance caps and accessibility.
export default function CustomThemeParticles({ theme, level, cadence, eventPulse = null }) {
  const emitters = customThemeManifest(theme)?.effects?.particles || [];
  const density = [0, 0.35, 0.6, 0.8, 1][level] * (cadence === 'calm' ? 0.5 : cadence === 'balanced' ? 0.75 : 1);
  const [activePulse, setActivePulse] = React.useState(null);
  const lastPulse = React.useRef(0);
  React.useEffect(() => {
    if (!eventPulse?.key || eventPulse.key === lastPulse.current || !['launch', 'celebrate'].includes(eventPulse.kind)) return undefined;
    lastPulse.current = eventPulse.key;
    if (Date.now() - eventPulse.key > 2000) return undefined; // Never replay an old event after Rest or a theme switch.
    setActivePulse(eventPulse);
    const timer = window.setTimeout(() => setActivePulse(null), 1500);
    return () => window.clearTimeout(timer);
  }, [eventPulse?.key, eventPulse?.kind]);
  if (density <= 0 || emitters.length === 0) return null;
  return <div aria-hidden="true" className="custom-theme-particles">
    {emitters.map(emitter => {
      const source = customThemeAssetUrl(theme, emitter.asset);
      const count = Math.min(24, Math.ceil(emitter.count * density));
      if (!source) return null;
      if (emitter.reaction && emitter.reaction !== 'ambient') {
        if (activePulse?.kind !== emitter.reaction) return null;
        return Array.from({ length: Math.min(12, count) }, (_, index) => {
          const position = particlePosition(emitter, index);
          return <img key={`${activePulse.key}-${emitter.id}-${index}`} src={source} alt="" draggable={false}
            className="custom-theme-reaction" style={{
              width: emitter.sizePx * (emitter.depth === 'far' ? 0.65 : 1),
              height: emitter.sizePx * (emitter.depth === 'far' ? 0.65 : 1),
              left: emitter.direction === 'drift' ? '50%' : position.left,
              top: emitter.direction === 'drift' ? position.top : '45%',
              '--fx-opacity': emitter.opacity * (emitter.depth === 'far' ? 0.6 : 1),
              '--fx-rotation': `${emitter.rotation ?? 0}deg`,
              filter: emitter.glow ? `drop-shadow(0 0 ${emitter.glow}px currentColor)` : undefined,
              color: 'rgb(var(--accent))',
              animationDelay: `${index * 45}ms`,
            }} />;
        });
      }
      return Array.from({ length: count }, (_, index) => {
        const duration = emitter.durationSeconds * (0.85 + ((index * 7) % 5) * 0.075) * (cadence === 'calm' ? 1.5 : 1);
        return <img key={`${emitter.id}-${index}`} src={source} alt="" draggable={false}
          className={`custom-theme-particle custom-theme-particle--${emitter.direction}`}
          style={{
            width: emitter.sizePx * (emitter.depth === 'far' ? 0.65 : 1),
            height: emitter.sizePx * (emitter.depth === 'far' ? 0.65 : 1),
            ...particlePosition(emitter, index),
            '--fx-opacity': emitter.opacity * (emitter.depth === 'far' ? 0.6 : 1),
            '--fx-rotation': `${emitter.rotation ?? 0}deg`,
            filter: emitter.glow ? `drop-shadow(0 0 ${emitter.glow}px currentColor)` : undefined,
            color: 'rgb(var(--accent))',
            animationDuration: `${duration}s`,
            animationDelay: `${-((index / count) * duration)}s`,
          }} />;
      });
    })}
  </div>;
}
