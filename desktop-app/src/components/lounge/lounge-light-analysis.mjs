import { loungeBackgroundDisplayUrl } from './lounge-background-url.mjs';

export function artworkLightingProfile(data, width, height, originalWidth = width, originalHeight = height) {
  const brightness = Array(144).fill(0), counts = Array(144).fill(0), color = [0, 0, 0];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4;
    const cell = Math.min(8, Math.floor(y / height * 9)) * 16 + Math.min(15, Math.floor(x / width * 16));
    const alpha = data[offset + 3] / 255;
    brightness[cell] += (data[offset] * .2126 + data[offset + 1] * .7152 + data[offset + 2] * .0722) * alpha;
    counts[cell]++;
    for (let channel = 0; channel < 3; channel++) color[channel] += data[offset + channel] * alpha;
  }
  const area = findBrightestArea(data, width, height);
  area.color = artworkLightColor(data, width, height, area);
  return { version: 1, width: originalWidth, height: originalHeight, area, brightness: brightness.map((n, i) => Math.round(n / Math.max(1, counts[i]))), color: color.map(n => Math.round(n / Math.max(1, width * height))) };
}

// Sample the emitting patch, not the entire image palette. Alpha/luminance
// weighting excludes transparent pixels and limits dark-edge contamination.
export function artworkLightColor(data, width, height, point) {
  const x = Math.round(point.x / 100 * (width - 1)), y = Math.round(point.y / 100 * (height - 1));
  const radius = Math.max(1, Math.ceil(Math.min(width, height) * .035));
  const color = [0, 0, 0]; let total = 0;
  for (let row = Math.max(0, y - radius); row <= Math.min(height - 1, y + radius); row++) {
    for (let column = Math.max(0, x - radius); column <= Math.min(width - 1, x + radius); column++) {
      const offset = (row * width + column) * 4;
      const weight = data[offset + 3] / 255 * (8 + data[offset] * .2126 + data[offset + 1] * .7152 + data[offset + 2] * .0722);
      total += weight;
      for (let channel = 0; channel < 3; channel++) color[channel] += data[offset + channel] * weight;
    }
  }
  return total ? color.map(n => Math.round(n / total)) : [255, 255, 255];
}

export function sampleArtworkLighting(source) {
  const width = source.naturalWidth || source.videoWidth, height = source.naturalHeight || source.videoHeight;
  if (!width || !height) throw new Error('Artwork has no drawable dimensions.');
  const canvas = document.createElement('canvas');
  canvas.width = 96; canvas.height = 54;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Artwork analysis is unavailable.');
  context.drawImage(source, 0, 0, 96, 54);
  return artworkLightingProfile(context.getImageData(0, 0, 96, 54).data, 96, 54, width, height);
}

// Deduplicate concurrent main/mini preview loads and reuse prepared lighting.
const profiles = new Map();
export function preparedArtworkLighting(url, source, api = window.api) {
  if (profiles.has(url)) return profiles.get(url);
  const task = (async () => {
    const saved = await Promise.resolve(api?.loungeBackgroundProfile?.(url)).catch(() => null);
    if (saved?.version === 1 && Array.isArray(saved.area?.color)) return { ...saved, persisted: true };
    const profile = sampleArtworkLighting(source);
    const persisted = await Promise.resolve(api?.loungeBackgroundProfile?.(url, profile)).catch(() => null);
    return { ...profile, persisted: !!persisted };
  })();
  profiles.set(url, task);
  task.catch(() => { if (profiles.get(url) === task) profiles.delete(url); });
  if (profiles.size > 64) profiles.delete(profiles.keys().next().value);
  return task;
}

export async function prepareImportedArtwork(url) {
  const source = document.createElement(/\.(mp4|m4v|webm|mov|ogv)(?:$|[?#])/i.test(url) ? 'video' : 'img');
  if (source.tagName === 'VIDEO') { source.muted = true; source.preload = 'auto'; }
  try {
    await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Artwork preparation timed out.')), 15000);
    const loaded = () => { clearTimeout(timeout); resolve(); };
    source.onload = loaded; source.onloadeddata = loaded;
    source.onerror = () => { clearTimeout(timeout); reject(new Error('Could not read artwork pixels.')); };
    source.crossOrigin = 'anonymous';
    source.src = loungeBackgroundDisplayUrl(url);
    });
    return await preparedArtworkLighting(url, source);
  } finally {
    source.onload = null; source.onloadeddata = null; source.onerror = null;
    if (source.tagName === 'VIDEO') { source.pause(); source.removeAttribute('src'); source.load(); }
  }
}

export function findBrightestArea(data, width, height) {
  if (!data || !Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || data.length < width * height * 4) {
    return { x: 72, y: 18, strength: 0.35 };
  }

  const luminance = new Float32Array(width * height);
  for (let pixel = 0; pixel < luminance.length; pixel += 1) {
    const offset = pixel * 4;
    luminance[pixel] = (data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722) * data[offset + 3] / 255;
  }

  const sorted = Array.from(luminance).sort((a, b) => a - b);
  const threshold = Math.max(105, sorted[Math.floor((sorted.length - 1) * 0.985)] || 0);
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;
  let peak = 0;
  let peakIndex = 0;

  for (let pixel = 0; pixel < luminance.length; pixel += 1) {
    const value = luminance[pixel];
    if (value > peak) { peak = value; peakIndex = pixel; }
    if (value < threshold) continue;
    const weight = (value - threshold + 8) ** 2;
    totalWeight += weight;
    weightedX += (pixel % width) * weight;
    weightedY += Math.floor(pixel / width) * weight;
  }

  const x = totalWeight ? weightedX / totalWeight : peakIndex % width;
  const y = totalWeight ? weightedY / totalWeight : Math.floor(peakIndex / width);
  return {
    x: Math.round((x / Math.max(1, width - 1)) * 1000) / 10,
    y: Math.round((y / Math.max(1, height - 1)) * 1000) / 10,
    strength: Math.max(0.12, Math.min(1, (peak - 65) / 190)),
  };
}

export function projectArtworkPoint(point, artworkRatio, viewportRatio, fit = 'cover', positionX = 50, positionY = 50, zoom = 100) {
  const sourceRatio = Number.isFinite(artworkRatio) && artworkRatio > 0 ? artworkRatio : 16 / 9;
  const targetRatio = Number.isFinite(viewportRatio) && viewportRatio > 0 ? viewportRatio : 16 / 9;
  const x = Math.max(0, Math.min(100, Number(point?.x) || 0));
  const y = Math.max(0, Math.min(100, Number(point?.y) || 0));
  const posX = Math.max(0, Math.min(100, Number(positionX) || 0)) / 100;
  const posY = Math.max(0, Math.min(100, Number(positionY) || 0)) / 100;
  const contain = fit === 'contain';
  const widthFraction = contain
    ? sourceRatio < targetRatio ? sourceRatio / targetRatio : 1
    : sourceRatio > targetRatio ? targetRatio / sourceRatio : 1;
  const heightFraction = contain
    ? sourceRatio > targetRatio ? targetRatio / sourceRatio : 1
    : sourceRatio < targetRatio ? sourceRatio / targetRatio : 1;
  const project = (value, visibleFraction, position) => contain
    ? value * visibleFraction + (1 - visibleFraction) * position
    : (value - (1 - visibleFraction) * position) / visibleFraction;
  const scale = Math.max(0.5, Math.min(2, (Number(zoom) || 100) / 100));
  const projectedX = 50 + (project(x / 100, widthFraction, posX) * 100 - 50) * scale;
  const projectedY = 50 + (project(y / 100, heightFraction, posY) * 100 - 50) * scale;
  const visible = projectedX >= 0 && projectedX <= 100 && projectedY >= 0 && projectedY <= 100;
  return {
    x: Math.max(0, Math.min(100, projectedX)),
    y: Math.max(0, Math.min(100, projectedY)),
    strength: visible ? point?.strength ?? 0.35 : 0,
    ...(point?.color ? { color: point.color } : {}),
  };
}
