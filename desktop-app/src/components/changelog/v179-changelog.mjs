export const V179_CHANGELOG = {
  version: '1.7.9',
  title: 'Library workflow and Wall polish hotfix',
  major: [
    {
      title: 'Wizard is now the single Library entry point',
      body: 'Add game and Refresh are no longer separate Library controls. Wizard now keeps manual executable add, folder scans, launcher imports, metadata refresh and library tidy-up together in one clear place.',
    },
    {
      title: 'Wall becomes a full-workspace Lite mode',
      body: 'Wall hides the Library pane and uses the whole workspace. Large buttons switch between the visual cover wall and a detailed list showing genre, release date, last played, install size, playtime, source and rating. Home and Library return you to the normal workspace.',
    },
    {
      title: 'Home becomes a category-free widget canvas',
      body: 'Every widget now stands alone. Unlock Home and choose Snap on for automatic grid reordering or Free move for exact placement, resizing, overlap and stacking. Every title bar also has a right-click/options menu for placement mode, stacking, size, reset and hide actions.',
    },
  ],
  fixes: [
    'Wall controls now fit in one slim wrapping toolbar instead of a tall introduction and two oversized view cards.',
    'Older Steam imports recover official portrait art from their saved app ID; remaining artwork stays vivid, with a colorful title cover as the final fallback.',
    'Wall cover ratings now use a clean star icon and fixed 11px score with no muddy text or badge shadow.',
    'Wall game titles now keep a fixed readable size and truncate long names instead of shrinking into tiny text.',
    'Fixed Library Preview failing to start when a game had capability badges but no achievement record.',
    'Selecting a Wall game still opens its normal Preview and protected categories remain private until unlocked.',
    'The official NEO-LIB Reddit shortcut remains beside Discord in the title bar.',
    'The Widgets manager now uses compact three-column cards, inline author names, concise size information and eye-only visibility controls.',
  ],
};
