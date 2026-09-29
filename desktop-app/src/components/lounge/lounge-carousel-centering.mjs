/** Compute a card's center in scroll-viewport coordinates, even inside a nested track. */
export function centeredCarouselTarget(scrollPosition, cardStart, viewportStart, cardSize, viewportSize) {
  return Math.max(0, scrollPosition + cardStart - viewportStart + cardSize / 2 - viewportSize / 2);
}
