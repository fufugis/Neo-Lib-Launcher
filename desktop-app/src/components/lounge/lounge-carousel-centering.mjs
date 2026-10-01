/** Compute a card's center in scroll-viewport coordinates, even inside a nested track. */
export function centeredCarouselTarget(scrollPosition, cardStart, viewportStart, cardSize, viewportSize) {
  return Math.max(0, scrollPosition + cardStart - viewportStart + cardSize / 2 - viewportSize / 2);
}

/** Frame-rate-independent glide; a delayed frame cannot teleport the shelf. */
export function glideCarouselPosition(current, target, elapsedMs) {
  const frameMs = Math.max(0, Math.min(48, elapsedMs));
  return current + (target - current) * (1 - Math.exp(-frameMs / 78));
}
