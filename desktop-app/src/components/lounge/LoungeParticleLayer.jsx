import React from 'react';
import builtinParticles from '../../../electron/themes/builtin-particles.json';
import { particleDuration, particleMotionStyle, particlePosition } from '../../themes/particle-placement.mjs';

export default function LoungeParticleLayer({ styleId, level, motion }) {
  const preset = builtinParticles.find(item => item.id === styleId);
  const safeLevel = Math.max(0, Math.min(4, Math.round(Number(level) || 0)));
  if (!preset || safeLevel === 0 || motion === 'off') return null;
  const count = Math.min(24, Math.max(2, Math.ceil(preset.count * [0, 0.35, 0.6, 0.8, 1][safeLevel] * (motion === 'subtle' ? 0.65 : 1))));
  const source = `data:image/png;base64,${preset.pngBase64}`;
  return <div data-testid="lounge-particle-layer" data-particle-style={styleId} aria-hidden="true" className="custom-theme-particles absolute inset-0 z-[2] pointer-events-none">
    {Array.from({ length: count }, (_, index) => {
      const duration = particleDuration(preset, index, motion === 'subtle' ? 'calm' : 'normal');
      return <img key={`${styleId}-${index}`} src={source} alt="" draggable={false} className={`custom-theme-particle custom-theme-particle--${preset.direction}`} style={{ width: preset.sizePx, height: preset.sizePx, ...particlePosition(preset, index), ...particleMotionStyle(preset), '--fx-opacity': motion === 'subtle' ? 0.34 : 0.5, animationDuration: `${duration}s`, animationDelay: `${-((index / count) * duration)}s` }} />;
    })}
  </div>;
}
