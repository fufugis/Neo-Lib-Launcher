export const LIBRARY_FONT_OPTIONS = Object.freeze([
  Object.freeze({ id: 'system', label: 'System', family: 'system-ui, -apple-system, "Segoe UI", sans-serif' }),
  Object.freeze({ id: 'segoe', label: 'Segoe UI', family: '"Segoe UI", Tahoma, sans-serif' }),
  Object.freeze({ id: 'arial', label: 'Arial', family: 'Arial, Helvetica, sans-serif' }),
  Object.freeze({ id: 'trebuchet', label: 'Trebuchet', family: '"Trebuchet MS", Arial, sans-serif' }),
  Object.freeze({ id: 'georgia', label: 'Georgia', family: 'Georgia, "Times New Roman", serif' }),
]);

export function libraryFontFamily(fontId = 'system') {
  return LIBRARY_FONT_OPTIONS.find((font) => font.id === fontId)?.family || LIBRARY_FONT_OPTIONS[0].family;
}
