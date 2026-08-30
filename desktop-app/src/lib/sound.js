// Tiny WebAudio-based UI sounds — no asset files needed.
// Multiple "sound packs" with the same surface API.
let ctx = null;
let master = null;
function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  return ctx;
}
// Master chain — compressor + gain. All sounds route through this so volumes
// are normalized across packs (no more chimes that are too loud / too quiet).
function getMaster() {
  const ac = getCtx();
  if (!ac) return null;
  if (!master) {
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -22;
    comp.knee.value = 30;
    comp.ratio.value = 6;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    const g = ac.createGain();
    g.gain.value = 0.85; // global pad so chimes don't bite
    comp.connect(g).connect(ac.destination);
    master = comp;
  }
  return master;
}
function envelope(g, ac, attack, release, peak = 0.18) {
  // Normalize peaks into a tighter band so quiet packs match loud ones.
  // Anything below 0.10 is lifted to 0.10; anything above 0.20 is capped at 0.20.
  const normPeak = Math.max(0.10, Math.min(0.20, peak));
  const t = ac.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(normPeak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
}
// Helper that routes any oscillator+gain chain through the normalized master.
function connectMaster(g, ac) {
  const m = getMaster();
  if (m) g.connect(m);
  else g.connect(ac.destination);
}

// Fungist's soundscape is synthesized only at the moment it is needed. There
// are no decoded audio files, loops, timers, or resident audio buffers.
function fungistTone(ac, frequency, offset = 0, duration = 0.2, peak = 0.06, type = 'sine') {
  const oscillator = ac.createOscillator();
  const gain = ac.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  connectMaster(gain, ac);
  const start = ac.currentTime + offset;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.01, peak), start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export const FUNGIST_SOUND_CUES = [
  { id: 'good-ding', label: 'Good Ding' },
  { id: 'hey', label: 'Hey' },
  { id: 'welcome', label: 'Welcome' },
  { id: 'warning', label: 'Warning' },
  { id: 'attention', label: 'Attention' },
  { id: 'completed-ding', label: 'Completed ding' },
];

export function playFungistCue(cue) {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  switch (cue) {
    case 'good-ding':
      fungistTone(ac, 880, 0, 0.18, 0.055, 'sine');
      fungistTone(ac, 1320, 0.1, 0.28, 0.065, 'sine');
      break;
    case 'hey':
      fungistTone(ac, 680, 0, 0.12, 0.05, 'triangle');
      fungistTone(ac, 960, 0.095, 0.19, 0.055, 'sine');
      break;
    case 'welcome':
      [523.25, 659.25, 783.99].forEach((frequency, index) => fungistTone(ac, frequency, index * 0.12, 0.33, 0.055, 'sine'));
      break;
    case 'warning':
      fungistTone(ac, 220, 0, 0.26, 0.075, 'sawtooth');
      fungistTone(ac, 196, 0.22, 0.3, 0.07, 'sawtooth');
      break;
    case 'attention':
      fungistTone(ac, 523.25, 0, 0.16, 0.05, 'triangle');
      fungistTone(ac, 523.25, 0.19, 0.16, 0.055, 'triangle');
      break;
    case 'completed-ding':
      [659.25, 880, 1318.51].forEach((frequency, index) => fungistTone(ac, frequency, index * 0.09, 0.32, 0.06, 'sine'));
      break;
    default: break;
  }
}

/* ---------- Sound pack: synthwave ---------- */
const PACK_SYNTHWAVE = {
  hover() {
    const ac = getCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = 720;
    o.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.06);
    o.connect(g);
    connectMaster(g, ac);
    envelope(g, ac, 0.005, 0.09, 0.07);
    o.start(); o.stop(ac.currentTime + 0.12);
  },
  launch() {
    const ac = getCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(220, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(660, ac.currentTime + 0.18);
    o.connect(g);
    connectMaster(g, ac);
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
    o.connect(g);
    connectMaster(g, ac);
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
      o.connect(g);
    connectMaster(g, ac);
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
    o.connect(lp).connect(g);
    connectMaster(g, ac);
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
    o.connect(lp).connect(g);
    connectMaster(g, ac);
    envelope(g, ac, 0.004, 0.14, 0.08);
    o.start(); o.stop(ac.currentTime + 0.18);
  },
};

/* ---------- Pack: sci-fi (warp punch) ---------- */
/* v1.6.4 — Replaced the barely-audible bandpass filter sweep with a punchier
   "warp gate" sound: quick FM chirp + noise burst + short reverb tail.
   Hover: a sharp descending zap. Launch: an ascending warp-drive engage. */
const PACK_SCIFI = {
  hover() {
    const ac = getCtx(); if (!ac) return;
    // FM-ish descending zap using a modulator oscillator
    const carrier = ac.createOscillator();
    const mod = ac.createOscillator();
    const modGain = ac.createGain();
    const g = ac.createGain();
    carrier.type = 'triangle';
    carrier.frequency.setValueAtTime(1200, ac.currentTime);
    carrier.frequency.exponentialRampToValueAtTime(320, ac.currentTime + 0.09);
    mod.type = 'square';
    mod.frequency.value = 90;
    modGain.gain.value = 180;
    mod.connect(modGain).connect(carrier.frequency);
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 240;
    carrier.connect(hp).connect(g);
    connectMaster(g, ac);
    envelope(g, ac, 0.001, 0.10, 0.12);
    carrier.start(); mod.start();
    carrier.stop(ac.currentTime + 0.12); mod.stop(ac.currentTime + 0.12);
  },
  launch() {
    const ac = getCtx(); if (!ac) return;
    // Ascending warp engage — pitched square + noise burst + slap-back tap
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(90, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.28);
    const bp = ac.createBiquadFilter(); bp.type = 'lowpass';
    bp.frequency.setValueAtTime(600, ac.currentTime);
    bp.frequency.exponentialRampToValueAtTime(4200, ac.currentTime + 0.28);
    bp.Q.value = 6;
    o.connect(bp).connect(g);
    connectMaster(g, ac);
    envelope(g, ac, 0.005, 0.36, 0.18);
    o.start(); o.stop(ac.currentTime + 0.4);
    // Punchy noise burst at t=0
    const bufSize = ac.sampleRate * 0.12;
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const noise = ac.createBufferSource(); noise.buffer = buf;
    const nfilt = ac.createBiquadFilter(); nfilt.type = 'bandpass';
    nfilt.frequency.value = 1400; nfilt.Q.value = 2.5;
    const ng = ac.createGain(); ng.gain.value = 0.14;
    noise.connect(nfilt).connect(ng);
    connectMaster(ng, ac);
    noise.start();
  },
};

/* ---------- Pack: crystal (bell-ish glass ping) ---------- */
const PACK_CRYSTAL = {
  hover() {
    const ac = getCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = 2400;
    o.connect(g);
    connectMaster(g, ac);
    envelope(g, ac, 0.001, 0.11, 0.05);
    o.start(); o.stop(ac.currentTime + 0.14);
  },
  launch() {
    const ac = getCtx(); if (!ac) return;
    // Two overlapping sines an octave apart → glass chime
    [1760, 3520].forEach((freq, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g);
      connectMaster(g, ac);
      envelope(g, ac, 0.002, 0.55 - i * 0.15, 0.09 - i * 0.02);
      o.start(); o.stop(ac.currentTime + 0.7);
    });
  },
};

/* ---------- Pack: cyberpunk (glitchy digital pop) ---------- */
const PACK_CYBERPUNK = {
  hover() {
    const ac = getCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    o.type = 'square';
    o.frequency.setValueAtTime(1500, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(2400, ac.currentTime + 0.025);
    o.connect(hp).connect(g);
    connectMaster(g, ac);
    envelope(g, ac, 0.001, 0.04, 0.05);
    o.start(); o.stop(ac.currentTime + 0.06);
  },
  launch() {
    const ac = getCtx(); if (!ac) return;
    // Descending square + a noise burst → cyberpunk "authenticated" chirp
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(1200, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 0.18);
    o.connect(g);
    connectMaster(g, ac);
    envelope(g, ac, 0.002, 0.22, 0.12);
    o.start(); o.stop(ac.currentTime + 0.26);
    // Short noise burst
    const bufSize = ac.sampleRate * 0.08;
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const noise = ac.createBufferSource(); noise.buffer = buf;
    const ng = ac.createGain(); ng.gain.value = 0.06;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2000; bp.Q.value = 3;
    noise.connect(bp).connect(ng);
    connectMaster(ng, ac);
    noise.start();
  },
};

/* ---------- Pack: bubble (soft plop, playful) ---------- */
const PACK_BUBBLE = {
  hover() {
    const ac = getCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(300, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(500, ac.currentTime + 0.05);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    o.connect(lp).connect(g);
    connectMaster(g, ac);
    envelope(g, ac, 0.003, 0.08, 0.05);
    o.start(); o.stop(ac.currentTime + 0.1);
  },
  launch() {
    const ac = getCtx(); if (!ac) return;
    // A "plop" — pitch sweep down inside a lowpass → water bubble
    const o = ac.createOscillator(), g = ac.createGain();
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    o.type = 'sine';
    o.frequency.setValueAtTime(900, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.15);
    o.connect(lp).connect(g);
    connectMaster(g, ac);
    envelope(g, ac, 0.004, 0.2, 0.10);
    o.start(); o.stop(ac.currentTime + 0.22);
  },
};

/* ---------- Pack: aurora (soft northern-light chime) ---------- */
const PACK_AURORA = {
  hover() {
    const ac = getCtx(); if (!ac) return;
    [660, 990].forEach((frequency, index) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = frequency; o.connect(g); connectMaster(g, ac);
      const start = ac.currentTime + index * 0.025;
      g.gain.setValueAtTime(0.0001, start); g.gain.exponentialRampToValueAtTime(0.045, start + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      o.start(start); o.stop(start + 0.26);
    });
  },
  launch() {
    const ac = getCtx(); if (!ac) return;
    [392, 587.33, 880].forEach((frequency, index) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = frequency; o.connect(g); connectMaster(g, ac);
      const start = ac.currentTime + index * 0.11;
      g.gain.setValueAtTime(0.0001, start); g.gain.exponentialRampToValueAtTime(0.085, start + 0.018); g.gain.exponentialRampToValueAtTime(0.0001, start + 0.52);
      o.start(start); o.stop(start + 0.58);
    });
  },
};

/* ---------- Pack: ember (warm wooden notification chime) ---------- */
const PACK_EMBER = {
  hover() {
    const ac = getCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
    o.type = 'triangle'; o.frequency.setValueAtTime(320, ac.currentTime); o.frequency.exponentialRampToValueAtTime(230, ac.currentTime + 0.09); lp.type = 'lowpass'; lp.frequency.value = 1100;
    o.connect(lp).connect(g); connectMaster(g, ac); envelope(g, ac, 0.004, 0.12, 0.065); o.start(); o.stop(ac.currentTime + 0.15);
  },
  launch() {
    const ac = getCtx(); if (!ac) return;
    [261.63, 329.63, 392].forEach((frequency, index) => {
      const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
      o.type = 'triangle'; o.frequency.value = frequency; lp.type = 'lowpass'; lp.frequency.value = 1250; o.connect(lp).connect(g); connectMaster(g, ac);
      const start = ac.currentTime + index * 0.075;
      g.gain.setValueAtTime(0.0001, start); g.gain.exponentialRampToValueAtTime(0.085, start + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      o.start(start); o.stop(start + 0.33);
    });
  },
};

/* ---------- Pack: harbor (gentle sonar bell) ---------- */
const PACK_HARBOR = {
  hover() {
    const ac = getCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(520, ac.currentTime); o.frequency.exponentialRampToValueAtTime(470, ac.currentTime + 0.16); o.connect(g); connectMaster(g, ac); envelope(g, ac, 0.012, 0.22, 0.055); o.start(); o.stop(ac.currentTime + 0.25);
  },
  launch() {
    const ac = getCtx(); if (!ac) return;
    [440, 660].forEach((frequency, index) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = frequency; o.connect(g); connectMaster(g, ac);
      const start = ac.currentTime + index * 0.18;
      g.gain.setValueAtTime(0.0001, start); g.gain.exponentialRampToValueAtTime(0.09, start + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, start + 0.62);
      o.start(start); o.stop(start + 0.68);
    });
  },
};

const PACKS = {
  synthwave: PACK_SYNTHWAVE,
  arcade:    PACK_ARCADE,
  minimal:   PACK_MINIMAL,
  scifi:     PACK_SCIFI,
  crystal:   PACK_CRYSTAL,
  cyberpunk: PACK_CYBERPUNK,
  bubble:    PACK_BUBBLE,
  aurora:    PACK_AURORA,
  ember:     PACK_EMBER,
  harbor:    PACK_HARBOR,
  none:      { hover() {}, launch() {} },
};

export const SOUND_PACKS = [
  { id: 'synthwave', label: 'Synthwave (neon sine)' },
  { id: 'arcade',    label: 'Arcade (coin chirp)' },
  { id: 'minimal',   label: 'Minimal (soft tick)' },
  { id: 'scifi',     label: 'Sci-fi (warp punch)' },
  { id: 'crystal',   label: 'Crystal (glass ping)' },
  { id: 'cyberpunk', label: 'Cyberpunk (glitch pop)' },
  { id: 'bubble',    label: 'Bubble (soft plop)' },
  { id: 'aurora',    label: 'Aurora (soft chime)' },
  { id: 'ember',     label: 'Ember (warm bell)' },
  { id: 'harbor',    label: 'Harbor (sonar chime)' },
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
