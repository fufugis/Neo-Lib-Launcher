import React from 'react';
import builtinParticles from '../../../electron/themes/builtin-particles.json';
import { particleDuration, particleMotionStyle, particlePosition } from '../../themes/particle-placement.mjs';
import { LOUNGE_EXTRA_PARTICLES, LOUNGE_PARTICLE_COLORS } from './lounge-particle-presets.mjs';

const jitter = (index, salt) => (((index * 47 + salt * 31) % 101) / 50) - 1;

export default function LoungeParticleLayer({ styleId, level, motion, amount = 100, randomness = 50, color = 'original', opacity = 70, size = 100, trail = 45, glow = 65, speed = 100 }) {
  const preset = builtinParticles.find(item => item.id === styleId) || LOUNGE_EXTRA_PARTICLES.find(item => item.id === styleId);
  const safeLevel = Math.max(0, Math.min(4, Math.round(Number(level) || 0)));
  const safeAmount = Math.max(0, Math.min(100, Number(amount) || 0));
  const safeRandomness = Math.max(0, Math.min(100, Number(randomness) || 0)) / 100;
  if (!preset || safeLevel === 0 || safeAmount === 0 || motion === 'off') return null;
  const count = Math.min(48, Math.ceil(preset.count * [0, 0.35, 0.6, 0.8, 1][safeLevel] * (motion === 'subtle' ? 0.65 : 1) * safeAmount / 100));
  const source = preset.pngBase64 ? `data:image/png;base64,${preset.pngBase64}` : '';
  const tint = LOUNGE_PARTICLE_COLORS.find(item => item.id === color)?.css || '';
  return <div data-testid="lounge-particle-layer" data-particle-style={styleId} data-particle-color={color} aria-hidden="true" className="custom-theme-particles absolute inset-0 z-[2] pointer-events-none">
    {Array.from({ length: count }, (_, index) => {
      const axis = preset.direction === 'drift' ? 'top' : 'left';
      const placement = particlePosition(preset, index);
      placement[axis] = `${Math.max(2, Math.min(98, parseFloat(placement[axis]) + jitter(index, 3) * safeRandomness * 16))}%`;
      const duration = particleDuration(preset, index, motion === 'subtle' ? 'calm' : 'normal') * (1 + jitter(index, 7) * safeRandomness * 0.23);
      const particleSize = Math.max(3, preset.sizePx * (Number(size) / 100) * (1 + jitter(index, 11) * safeRandomness * 0.28));
      const trailScale = Math.max(0, Math.min(1, Number(trail) / 100));
      const glowScale = Math.max(0, Math.min(1, Number(glow) / 100));
      const style = { width: particleSize, height: preset.shape === 'comet' ? Math.max(2, 2 + trailScale * 8) : particleSize, ...placement, ...particleMotionStyle(preset), color: tint || preset.color, '--fx-opacity': (Math.max(0, Math.min(100, Number(opacity) || 0)) / 100) * (motion === 'subtle' ? 0.6 : 1), '--particle-glow': glowScale, '--particle-glow-blur': `${3 + glowScale * 15}px`, '--particle-glow-spread': `${8 + glowScale * 20}px`, '--particle-trail': trailScale, '--particle-trail-length': `${24 + trailScale * 86}px`, animationDuration: `${duration * (100 / Math.max(25, Number(speed) || 100))}s`, animationDelay: `${-((index / count) * duration)}s` };
      const className = `custom-theme-particle custom-theme-particle--${preset.direction}`;
      if (source && !tint) return <img key={`${styleId}-${index}`} src={source} alt="" draggable={false} className={className} style={style} />;
      return <span key={`${styleId}-${index}`} className={`${className} lounge-procedural-particle lounge-procedural-particle--${preset.shape || 'sprite'}`} style={{ ...style, color: tint || preset.color, backgroundColor: tint || preset.color, ...(source ? { maskImage: `url(${JSON.stringify(source)})`, WebkitMaskImage: `url(${JSON.stringify(source)})`, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat' } : {}) }} />;
    })}
  </div>;
}
