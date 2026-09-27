// Deterministic transparent sprites for Theme Creator; rerun to update the catalogue.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const SIZE = 40;
const particles = [
  { id: 'soft-rain', label: 'Soft rain dots', description: 'Small cool droplets falling steadily.', color: [142, 207, 255], direction: 'fall', count: 20, sizePx: 14, durationSeconds: 9, speedVariation: 35, spinDegrees: 0, swayPx: 0 },
  { id: 'rain-drop', label: 'Rain drops', description: 'Longer blue drops for a rainy atmosphere.', color: [112, 187, 255], direction: 'fall', count: 18, sizePx: 22, durationSeconds: 8, speedVariation: 30, spinDegrees: 0, swayPx: 0 },
  { id: 'falling-heart', label: 'Falling hearts', description: 'Soft pink hearts drifting down like anime confetti.', color: [255, 128, 187], direction: 'fall', count: 12, sizePx: 26, durationSeconds: 17, speedVariation: 40, spinDegrees: 120, swayPx: 30 },
  { id: 'sakura-petal', label: 'Sakura petals', description: 'Blush petals floating gently down.', color: [255, 177, 209], direction: 'fall', count: 15, sizePx: 25, durationSeconds: 21, speedVariation: 45, spinDegrees: 360, swayPx: 55 },
  { id: 'warm-ember', label: 'Warm embers', description: 'Glowing orange sparks rising from below.', color: [255, 159, 78], direction: 'rise', count: 18, sizePx: 15, durationSeconds: 13, speedVariation: 45, spinDegrees: 0, swayPx: 12 },
  { id: 'starlight', label: 'Starlight', description: 'Tiny four-point stars drifting across the scene.', color: [239, 230, 255], direction: 'drift', count: 12, sizePx: 20, durationSeconds: 24, speedVariation: 30, spinDegrees: 180, swayPx: 22 },
  { id: 'bubble', label: 'Bubbles', description: 'Pale outlined bubbles rising slowly.', color: [160, 229, 252], direction: 'rise', count: 10, sizePx: 28, durationSeconds: 22, speedVariation: 35, spinDegrees: 0, swayPx: 16 },
];

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, bytes) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4); length.writeUInt32BE(bytes.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, bytes])));
  return Buffer.concat([length, name, bytes, checksum]);
}
function coverage(id, x, y) {
  const r = Math.hypot(x, y);
  if (id === 'soft-rain') return Math.max(0, 1 - Math.abs(r - 0.38) / 0.28) * 0.48 + (r < 0.3 ? 0.5 : 0);
  if (id === 'rain-drop') return y < -0.18 ? Math.max(0, 1 - Math.abs(x) / (0.12 + 0.25 * (y + 1))) : Math.max(0, 1 - Math.hypot(x / 0.4, (y - 0.15) / 0.72));
  if (id === 'falling-heart') {
    const xx = x * 1.3, yy = -y * 1.3 + 0.16;
    const curve = xx * xx + yy * yy - 1;
    return curve ** 3 - xx * xx * yy ** 3 <= 0 ? 1 : 0;
  }
  if (id === 'sakura-petal') return Math.hypot((x + y * 0.22) / 0.48, (y - x * 0.22) / 0.8) < 1 && !(x > 0.1 && y < -0.52) ? 0.9 : 0;
  if (id === 'warm-ember') return Math.max(0, 1 - r / 0.64) ** 1.35;
  if (id === 'starlight') return Math.max(0, 1 - Math.min(Math.abs(x) * 4 + Math.abs(y) * 0.65, Math.abs(y) * 4 + Math.abs(x) * 0.65) / 1.15);
  if (id === 'bubble') return Math.max(0, 1 - Math.abs(r - 0.62) / 0.12) * 0.78 + (Math.hypot(x + 0.26, y + 0.27) < 0.12 ? 0.35 : 0);
  return 0;
}
function render(particle) {
  const row = SIZE * 4 + 1;
  const raw = Buffer.alloc(row * SIZE);
  for (let py = 0; py < SIZE; py += 1) {
    for (let px = 0; px < SIZE; px += 1) {
      let alpha = 0;
      for (let sy = 0; sy < 4; sy += 1) for (let sx = 0; sx < 4; sx += 1) {
        const x = ((px + (sx + 0.5) / 4) / SIZE - 0.5) * 2;
        const y = ((py + (sy + 0.5) / 4) / SIZE - 0.5) * 2;
        alpha += coverage(particle.id, x, y) / 16;
      }
      const offset = py * row + 1 + px * 4;
      raw[offset] = particle.color[0]; raw[offset + 1] = particle.color[1]; raw[offset + 2] = particle.color[2];
      raw[offset + 3] = Math.round(Math.min(1, alpha) * 255);
    }
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(SIZE, 0); header.writeUInt32BE(SIZE, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const catalogue = particles.map(({ color, ...particle }) => ({ ...particle, asset: `assets/${particle.id}.png`, pngBase64: render({ ...particle, color }).toString('base64') }));
fs.writeFileSync(path.join(__dirname, '../electron/themes/builtin-particles.json'), `${JSON.stringify(catalogue, null, 2)}\n`);
