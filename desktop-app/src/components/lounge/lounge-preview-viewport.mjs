export function loungePreviewViewport(width, height, frameWidth, frameHeight) {
  const scale = Math.min(Math.max(0, frameWidth) / Math.max(1, width), Math.max(0, frameHeight) / Math.max(1, height));
  return { scale, left: Math.max(0, (frameWidth - width * scale) / 2), top: Math.max(0, (frameHeight - height * scale) / 2) };
}
