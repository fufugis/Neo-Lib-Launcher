export function artworkRenderGeometry(width, height, imageWidth, imageHeight, dpr = 1, zoom = 1, fit = 'cover', limit = 16384) {
  const density = Math.max(1, dpr) * Math.max(1, zoom);
  const renderWidth = Math.max(1, Math.min(limit, Math.round(width * density)));
  const renderHeight = Math.max(1, Math.min(limit, Math.round(height * density)));
  const scale = (fit === 'contain' ? Math.min : Math.max)(renderWidth / imageWidth, renderHeight / imageHeight);
  return { width: renderWidth, height: renderHeight, extentX: renderWidth / (imageWidth * scale), extentY: renderHeight / (imageHeight * scale) };
}
