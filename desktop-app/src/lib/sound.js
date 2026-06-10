// Tiny WebAudio-based UI sounds — no asset files needed.
let ctx = null;
function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

function envelope(g, ac, attack, release, peak = 0.18) {
  const t = ac.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
}

// Short, modern hover "tick" — subtle high blip.
export function playHover() {
  const ac = getCtx();
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.value = 720;
  o.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.06);
  o.connect(g).connect(ac.destination);
  envelope(g, ac, 0.005, 0.09, 0.07);
  o.start();
  o.stop(ac.currentTime + 0.12);
}

// Punchier click for LAUNCH.
export function playLaunch() {
  const ac = getCtx();
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(220, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(660, ac.currentTime + 0.18);
  o.connect(g).connect(ac.destination);
  envelope(g, ac, 0.005, 0.25, 0.14);
  o.start();
  o.stop(ac.currentTime + 0.3);
}

let lastHoverTs = 0;
export function hoverThrottled() {
  const now = Date.now();
  if (now - lastHoverTs < 110) return;
  lastHoverTs = now;
  playHover();
}
