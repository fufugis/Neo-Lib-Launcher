export const DEFAULT_HERO_FILTER = 'brightness(1.08) contrast(1.07) saturate(1.22)';

/** Image-aware recovery: reveal muted art without bleaching already-vivid banners. */
export function heroImageFilter({ luminance, saturation }) {
  const light = Number(luminance);
  const colour = Number(saturation);
  if (!Number.isFinite(light) || !Number.isFinite(colour)) return DEFAULT_HERO_FILTER;
  if (light < 42) return 'brightness(1.58) contrast(1.12) saturate(1.42)';
  if (light < 72 && colour < 0.24) return 'brightness(1.38) contrast(1.12) saturate(1.58)';
  if (light < 72) return 'brightness(1.30) contrast(1.09) saturate(1.25)';
  if (colour < 0.18) return 'brightness(1.16) contrast(1.10) saturate(1.62)';
  if (colour < 0.34) return 'brightness(1.10) contrast(1.08) saturate(1.34)';
  if (light > 205) return 'brightness(0.98) contrast(1.06) saturate(1.08)';
  return 'brightness(1.04) contrast(1.06) saturate(1.14)';
}
