export function themeVideoMetadataAllowed(video) {
  const duration = Number(video?.duration);
  const width = Number(video?.videoWidth);
  const height = Number(video?.videoHeight);
  return Number.isFinite(duration) && duration >= 0.5 && duration <= 20
    && Number.isInteger(width) && Number.isInteger(height)
    && width > 0 && height > 0 && width <= 1920 && height <= 1080
    && width * height <= 2_073_600;
}
