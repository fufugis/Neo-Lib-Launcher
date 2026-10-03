import React from 'react';

// A handful of cached gradient plumes, not a viewport-sized filtered fog.
// Only transform/opacity animate; artwork sampling remains in the backdrop.
export default React.memo(function LoungeAtmosphereLayer({ preferences, animated, project, sun }) {
  const smoke = preferences.smokeStrength > 0;
  const cold = preferences.coldRayStrength > 0;
  if (!smoke && !cold) return null;
  return <div className="lounge-local-atmosphere absolute inset-0 pointer-events-none" aria-hidden="true" data-moving={animated}>
    {smoke && [[14, 76], [44, 83], [77, 72], [91, 54], [31, 56]].map(([x, y], index) => {
      const point = project({ x, y, strength: 1 });
      return <i key={index} className="lounge-smoke-plume" style={{ left: `${point.x}%`, top: `${point.y}%`, '--smoke-opacity': preferences.smokeStrength / 100 * 0.48, '--smoke-size': `${preferences.smokeSize * 2.1}px`, animationDuration: `${36 * 100 / preferences.smokeSpeed}s`, animationDelay: `${-index * 6}s` }} />;
    })}
    {cold && <div className="lounge-cold-rays" style={{ left: `${sun.x}%`, top: `${sun.y}%`, width: `${preferences.coldRaySpread * 8}px`, height: `${preferences.coldRaySpread * 10}px`, opacity: Math.min(0.85, preferences.coldRayStrength / 300), '--cold-softness': `${preferences.coldRaySoftness * 0.08}px` }} />}
  </div>;
});
