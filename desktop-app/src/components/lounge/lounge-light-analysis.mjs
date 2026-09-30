export function findBrightestArea(data, width, height) {
  if (!data || !Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || data.length < width * height * 4) {
    return { x: 72, y: 18, strength: 0.35 };
  }

  const luminance = new Float32Array(width * height);
  for (let pixel = 0; pixel < luminance.length; pixel += 1) {
    const offset = pixel * 4;
    luminance[pixel] = data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
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
