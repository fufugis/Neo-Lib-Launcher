// Static native cursors: no pointer tracking, animated overlays or timers.
// Keep pixel as the stored ID for existing Retro/Pixel selections.
export const CURSOR_OPTIONS = Object.freeze([
  { id: 'windows', label: 'Windows', description: 'Your system pointer', preview: null },
  { id: 'neon', label: 'Neon', description: 'Cyan outline', preview: new URL('../assets/cursors/neon.svg', import.meta.url).href },
  { id: 'petal', label: 'Petal', description: 'Pointed flower petal', preview: new URL('../assets/cursors/petal.svg', import.meta.url).href },
  { id: 'pixel', label: 'Retro', description: 'Crisp pixel arrow', preview: new URL('../assets/cursors/retro.svg', import.meta.url).href },
  { id: 'industrial', label: 'Industrial', description: 'Steel drill and hazard grip', preview: new URL('../assets/cursors/industrial.svg', import.meta.url).href },
  { id: 'future', label: 'Future', description: 'Angular sci-fi craft', preview: new URL('../assets/cursors/future.svg', import.meta.url).href },
  { id: 'stoneage', label: 'Stoneage', description: 'Chipped flint and wood', preview: new URL('../assets/cursors/stoneage.svg', import.meta.url).href },
  { id: 'aurora', label: 'Aurora', description: 'Classic arrow with icy cyan and iridescent violet', preview: new URL('../assets/cursors/aurora.svg', import.meta.url).href },
  { id: 'ember', label: 'Ember', description: 'Classic arrow with luminous amber and coral', preview: new URL('../assets/cursors/ember.svg', import.meta.url).href },
]);

export function normalizeCursorTheme(value) {
  const id = value === 'retro' ? 'pixel' : value;
  return CURSOR_OPTIONS.some(option => option.id === id) ? id : 'windows';
}
