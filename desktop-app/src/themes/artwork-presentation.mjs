// Presentation only: retain the original image and never soften Lounge scenery.
export function softenDesktopArtwork(theme, loungeMode = false) {
  return !loungeMode && ['moonlit-arcana', 'cosmic-citadel'].includes(theme);
}
