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
    {
      title: 'Choose top or Sidebar navigation',
      body: 'Keep the familiar top Home, Library, Wall and Tools buttons, or switch to a slim left icon rail that reveals labels on hover. Visual Tweaks and Control Center → Personalise share the same saved Sidebar setting.',
    },
    {
      title: 'Filter the Wall in one click',
      body: 'All, Favorites, Most played and Recently played are always available in the compact Wall toolbar. The active choice is highlighted, updates the visible count and works in both cover and detailed views.',
    },
    {
      title: 'Game Workshop brings editing into one place',
      body: 'The former Customize panel is now a clear six-section Game Workshop for metadata, artwork, launch routes, Library status, sourced game signals and advanced update details. Journey Status and personal notes stay local, while only explicitly chosen content flags are shown.',
    },
    {
      title: 'Wall Peek keeps you in your collection',
      body: 'Selecting a Wall game now opens a compact right-side overlay with its Journey Status, playtime, source, screenshots and confirmed game signals. Close it with X, Escape or the backdrop, launch safely, or choose Full Preview when you want the complete page.',
    },
    {
      title: 'Detailed Wall can be tailored to you',
      body: 'Click a Detailed Wall heading to sort it, then open Columns to hide optional facts or adjust their width. Your chosen layout stays local, while Game identity always remains visible.',
    },
    {
      title: 'Artwork Workshop protects your choices',
      body: 'Each icon, cover, hero, background and logo can now be protected from future repair suggestions. NEO-LIB keeps up to eight local restore points whenever you change artwork, shows recorded source and image dimensions when available, and stages every restore until you save.',
    },
    {
      title: 'Collection Mode starts in Wall',
      body: 'Choose Select in Library or Select games in Wall to mark several titles without changing normal browsing. Batch favorite/unfavorite actions, Journey Status updates and adding to an existing normal category apply only to the selected games, in Library, covers and detailed Wall.',
    },
    {
      title: 'Retro Profiles are ready for your own setup',
      body: 'Wizard now saves player-chosen emulator paths, ROM folders, platform extensions, argument prefixes, working folders and tracking preferences. NEO-LIB does not supply, search, scan, import or launch ROMs from this setup screen; reviewed ROM importing follows separately.',
    },
    {
      title: 'Artwork refreshes are easier to trust',
      body: 'Metadata review now places Current and Suggested artwork side by side before you apply it. Protected artwork slots remain clearly listed and are not changed by an accepted metadata refresh.',
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
