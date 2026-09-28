export function isExternalFileDrag(dataTransfer) {
  const types = Array.from(dataTransfer?.types || []);
  return types.includes('Files') && !types.includes('text/game-id');
}
