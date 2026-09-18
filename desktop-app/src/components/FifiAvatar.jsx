import React from 'react';

let rigLoader = null;
function ensureFifiRig() {
  if (typeof document === 'undefined' || window.customElements?.get('neo-fifi')) return Promise.resolve();
  if (rigLoader) return rigLoader;
  rigLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-neolib-fifi-rig]');
    if (existing) { existing.addEventListener('load', resolve, { once: true }); existing.addEventListener('error', reject, { once: true }); return; }
    const script = document.createElement('script');
    script.src = `${import.meta.env.BASE_URL}mascot/fifi/fifi-rig.js`;
    script.dataset.neolibFifiRig = 'true';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return rigLoader;
}

/** Reusable living FiFi visual. The public rig is loaded once and then upgrades every neo-fifi element. */
export default function FifiAvatar({ mood = 'idle', size = 240, motion = 'balanced', rest = false, paused = false, fx = .5, energy = 0, particles, speaking = false, gesture, className }) {
  React.useEffect(() => { ensureFifiRig().catch(() => {}); }, []);
  return <neo-fifi
    asset-root={`${import.meta.env.BASE_URL}mascot/fifi/`}
    mood={mood} motion={motion} fx={fx} energy={energy}
    particles={particles} gesture={gesture} speaking={speaking ? '' : undefined}
    rest={rest ? '' : undefined} paused={paused ? '' : undefined}
    className={className} style={{ width: size, maxWidth: '100%' }}
  />;
}
