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
      title: 'Home widgets become a real editable workspace',
      body: 'Unlock Home to move and resize widgets on a responsive grid, then press Done to lock the layout. Every widget title bar also has a right-click/options menu for reordering, size changes, reset and hide actions.',
    },
  ],
  fixes: [
    'Wall cover ratings now stay readable at dense sizes with a fixed high-contrast yellow badge.',
    'Wall game titles now keep a fixed readable size and truncate long names instead of shrinking into tiny text.',
    'Selecting a Wall game still opens its normal Preview and protected categories remain private until unlocked.',
    'The official NEO-LIB Reddit shortcut remains beside Discord in the title bar.',
    'The Widgets manager now uses compact three-column cards, inline author names, concise size information and eye-only visibility controls.',
  ],
};
