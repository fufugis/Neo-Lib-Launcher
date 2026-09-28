import React from 'react';
import builtinParticles from '../../../electron/themes/builtin-particles.json';
import { particleDuration, particleMotionStyle, particlePosition } from '../../themes/particle-placement.mjs';
import { LOUNGE_EXTRA_PARTICLES, LOUNGE_PARTICLE_COLORS } from './lounge-particle-presets.mjs';

const jitter = (index, salt) => (((index * 47 + salt * 31) % 101) / 50) - 1;

export default function LoungeParticleLayer({ styleId, level, motion, amount = 100, randomness = 50, color = 'original' }) {
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
      const size = Math.max(3, preset.sizePx * (1 + jitter(index, 11) * safeRandomness * 0.28));
      const style = { width: size, height: preset.shape === 'comet' ? 3 : size, ...placement, ...particleMotionStyle(preset), '--fx-opacity': motion === 'subtle' ? 0.42 : 0.7, animationDuration: `${duration}s`, animationDelay: `${-((index / count) * duration)}s` };
      const className = `custom-theme-particle custom-theme-particle--${preset.direction}`;
      if (source && !tint) return <img key={`${styleId}-${index}`} src={source} alt="" draggable={false} className={className} style={style} />;
      return <span key={`${styleId}-${index}`} className={`${className} lounge-procedural-particle lounge-procedural-particle--${preset.shape || 'sprite'}`} style={{ ...style, color: tint || preset.color, backgroundColor: tint || preset.color, ...(source ? { maskImage: `url(${JSON.stringify(source)})`, WebkitMaskImage: `url(${JSON.stringify(source)})`, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat' } : {}) }} />;
    })}
  </div>;
}
