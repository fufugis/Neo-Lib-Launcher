// Tiny WebAudio-based UI sounds — no asset files needed.
// Multiple "sound packs" with the same surface API.
let ctx = null;
function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
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

/* ---------- Sound pack: synthwave ---------- */
const PACK_SYNTHWAVE = {
  hover() {
    const ac = getCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = 720;
    o.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.06);
    o.connect(g).connect(ac.destination);
    envelope(g, ac, 0.005, 0.09, 0.07);
    o.start(); o.stop(ac.currentTime + 0.12);
  },
  launch() {
    const ac = getCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(220, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(660, ac.currentTime + 0.18);
    o.connect(g).connect(ac.destination);
    envelope(g, ac, 0.005, 0.25, 0.14);
    o.start(); o.stop(ac.currentTime + 0.3);
  },
};

/* ---------- Sound pack: arcade ---------- */
const PACK_ARCADE = {
  hover() {
    const ac = getCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'square';
    o.frequency.value = 1200;
    o.connect(g).connect(ac.destination);
    envelope(g, ac, 0.001, 0.04, 0.04);
    o.start(); o.stop(ac.currentTime + 0.06);
  },
  launch() {
    const ac = getCtx(); if (!ac) return;
    // Two-tone retro coin sound
    [880, 1320].forEach((freq, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      o.connect(g).connect(ac.destination);
      const start = ac.currentTime + i * 0.06;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.12, start + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      o.start(start); o.stop(start + 0.2);
    });
  },
};

/* ---------- Sound pack: minimal (modern UI clicks) ---------- */
const PACK_MINIMAL = {
  hover() {
    const ac = getCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    o.type = 'sine';
    o.frequency.value = 1800;
    o.connect(lp).connect(g).connect(ac.destination);
    envelope(g, ac, 0.001, 0.03, 0.025);
    o.start(); o.stop(ac.currentTime + 0.05);
  },
  launch() {
    const ac = getCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    o.type = 'sine';
    o.frequency.setValueAtTime(540, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(720, ac.currentTime + 0.08);
    o.connect(lp).connect(g).connect(ac.destination);
    envelope(g, ac, 0.004, 0.14, 0.08);
    o.start(); o.stop(ac.currentTime + 0.18);
  },
};

/* ---------- Pack: sci-fi (filter sweeps) ---------- */
const PACK_SCIFI = {
  hover() {
    const ac = getCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(440, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(1760, ac.currentTime + 0.07);
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 6;
    o.connect(bp).connect(g).connect(ac.destination);
    envelope(g, ac, 0.002, 0.08, 0.06);
    o.start(); o.stop(ac.currentTime + 0.1);
  },
  launch() {
    const ac = getCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 4;
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(110, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.22);
    o.connect(bp).connect(g).connect(ac.destination);
    envelope(g, ac, 0.003, 0.3, 0.12);
    o.start(); o.stop(ac.currentTime + 0.35);
  },
};

const PACKS = {
  synthwave: PACK_SYNTHWAVE,
  arcade:    PACK_ARCADE,
  minimal:   PACK_MINIMAL,
  scifi:     PACK_SCIFI,
  none:      { hover() {}, launch() {} },
};

export const SOUND_PACKS = [
  { id: 'synthwave', label: 'Synthwave (neon sine)' },
  { id: 'arcade',    label: 'Arcade (coin chirp)' },
  { id: 'minimal',   label: 'Minimal (soft tick)' },
  { id: 'scifi',     label: 'Sci-fi (filter sweep)' },
  { id: 'none',      label: 'No sound' },
];

let CURRENT_PACK = 'synthwave';
export function setSoundPack(id) {
  if (PACKS[id]) CURRENT_PACK = id;
}
function pack() { return PACKS[CURRENT_PACK] || PACK_SYNTHWAVE; }

export function playHover() { pack().hover(); }
export function playLaunch() { pack().launch(); }

let lastHoverTs = 0;
export function hoverThrottled() {
  const now = Date.now();
  if (now - lastHoverTs < 110) return;
  lastHoverTs = now;
  playHover();
}
