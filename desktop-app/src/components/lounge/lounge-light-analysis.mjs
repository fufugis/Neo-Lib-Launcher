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

export function projectArtworkPoint(point, artworkRatio, viewportRatio, fit = 'cover', positionX = 50, positionY = 50) {
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
  const projectedX = project(x / 100, widthFraction, posX) * 100;
  const projectedY = project(y / 100, heightFraction, posY) * 100;
  const visible = projectedX >= 0 && projectedX <= 100 && projectedY >= 0 && projectedY <= 100;
  return {
    x: Math.max(0, Math.min(100, projectedX)),
    y: Math.max(0, Math.min(100, projectedY)),
    strength: visible ? point?.strength ?? 0.35 : 0,
  };
}
