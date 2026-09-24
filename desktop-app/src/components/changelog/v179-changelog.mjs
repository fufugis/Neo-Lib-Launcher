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
      title: 'Run community widgets with clear permissions',
      body: 'Imported widgets start disabled. Enable each one in Widgets and decide separately whether it can use private widget storage, redacted Library summaries or HTTPS. Widgets run in restricted frames, show a Reload control after a failure, require update review and can be restored after uninstall.',
    },
    {
      title: 'See your verified Steam achievement progress',
      body: 'For a confirmed Steam-owned game, open its Preview and choose Connect Steam achievements. Enter your own Steam Web API key for this app session and press Verify and sync. NEO-LIB checks the signed-in Steam account and game ownership before showing earned and total counts; failed or private responses never become made-up progress.',
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
      body: 'Choose Select in Library or Select games in Wall to mark several titles without changing normal browsing. Favorite, status and category changes apply only to that selection. Metadata and artwork open a confirmed one-by-one review queue, while Protect in requires an already-unlocked private category and never bypasses its PIN.',
    },
    {
      title: 'Retro Library connects your ROMs to your emulators',
      body: 'Wizard now scans only a ROM folder you choose, detects supported platform formats, lets you review titles and platforms, prevents duplicates, and imports each game into its platform shelf. Wall groups retro covers by platform. Play opens the selected ROM through your saved emulator profile; NEO-LIB never supplies ROMs, BIOS files or emulators.',
    },
    {
      title: 'Artwork refreshes are easier to trust',
      body: 'Metadata review now places Current and Suggested artwork side by side before you apply it. Protected artwork slots remain clearly listed and are not changed by an accepted metadata refresh.',
    },
    {
      title: 'Choose online artwork without surrendering control',
      body: 'Add your own optional SteamGridDB API key in Settings, then open Online beside an Icon, Cover, Hero, Background or Logo in Game Workshop. Confirm the right game, compare source, author, resolution and content labels, and choose Use this. Nothing changes permanently until you save the game.',
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
