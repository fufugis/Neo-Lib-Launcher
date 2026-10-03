/** Compute a card's center in scroll-viewport coordinates, even inside a nested track. */
export function centeredCarouselTarget(scrollPosition, cardStart, viewportStart, cardSize, viewportSize) {
  return Math.max(0, scrollPosition + cardStart - viewportStart + cardSize / 2 - viewportSize / 2);
}

/** Frame-rate-independent glide; a delayed frame cannot teleport the shelf. */
export function glideCarouselPosition(current, target, elapsedMs) {
  const frameMs = Math.max(0, Math.min(48, elapsedMs));
  return current + (target - current) * (1 - Math.exp(-frameMs / 78));
}

/** A bottom-anchored card grows entirely upward; side rails grow both ways. */
export function carouselCrossAxisClearance(cardSize, selectedScale, bottomAnchored, glowInset = 20) {
  const peakScale = Math.max(1.2, (Number(selectedScale) || 1) + 0.09);
  const growth = Math.max(0, (Number(cardSize) || 0) * (peakScale - 1));
  const inset = Math.max(20, Math.ceil(Number(glowInset) || 20));
  return bottomAnchored
    ? { before: Math.ceil(growth + inset), after: inset }
    : { before: Math.ceil(growth / 2 + inset), after: Math.ceil(growth / 2 + inset) };
}
