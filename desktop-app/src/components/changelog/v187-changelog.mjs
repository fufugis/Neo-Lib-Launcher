export const V187_CHANGELOG = {
  version: '1.8.7',
  title: 'Home, Lounge and personalization',
  major: [
    {
      "title": "Home layout editor",
      "body": "Move, resize and park Home widgets; extend page height and scale content. Lounge adds grouped Visuals, compact FX, custom themes, pinned previews and cover/info heroes."
    },
    {
      "title": "Game-preview layout editor",
      "body": "Rearrange and resize section boxes; content reflows at normal text size instead of shrinking the whole preview."
    },
    {
      "title": "Playtime calendar",
      "body": "Month/year heatmaps for Home and Lounge, with game filters and recorded daily playtime."
    },
    {
      "title": "News and mail inbox",
      "body": "Team announcements appear once as a popup and remain in your inbox until deleted."
    },
    {
      "title": "Automatic idle power saver",
      "body": "After 15 quiet minutes, pauses expensive visuals while keeping mascot announcements available."
    },
    {
      "title": "New welcome and tutorial",
      "body": "Guided setup or exploration, a refreshed tutorial, optional 16+ usage reporting and privacy notice. Permanent sidebar navigation and a simpler tabbed Wizard."
    },
    {
      "title": "Community widget coding guide",
      "body": "Import widget includes starter files and clear format, API, permission and capability guidance."
    },
    {
      "title": "Update popup and download",
      "body": "New GitHub releases show a download prompt even when the mascot is disabled."
    },
    { "title": "Retro emulator setup", "body": "Add emulators and ROM folders row by row, track time per ROM and optionally exclude ROMs from statistics." },
    { "title": "Library background graphics", "body": "Three 3D graphics, full-height textures, Ember/Camo artwork and object-shaped Industrial, Future and Stoneage cursors. Custom Lounge stills keep originals and scene effects." }
  ],
  fixes: [
    { title: 'Moonlit Arcana', body: 'Brighter blue-violet panels, clearer text and cyan/lilac accents, with gentler desktop artwork darkening.' },
    { title: 'Saved sizes', body: 'Home and Library scans share local measurements across restarts; failed scans keep previous sizes.' },
    { title: 'Rendering efficiency', body: 'Retained Lounge previews, cached Library shelves and rows, and compositor-driven grids preserve visual settings while avoiding repeated work.' },
    { title: 'Sidebar controls', body: 'Sidebar tweaks adds button/icon sizing, spacing, saturation and reorder. It stays expanded and highlighted while editing; icons-only has instant labels.' },
    { title: 'Viewing distance', body: 'A highlighted five-step Lounge slider adds two intermediate sizes, with clear distance labels and explanations.' },
  ],
};
