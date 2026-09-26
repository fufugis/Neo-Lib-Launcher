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
      body: 'For a confirmed Steam-owned game, open its Preview and choose Connect Steam achievements. Enter your own Steam Web API key for this app session and press Verify and sync. NEO-LIB checks the signed-in Steam account and game ownership before showing earned and total counts; failed or private responses never become made-up progress. Other launchers clearly show when only achievement support, not earned progress, is known.',
    },
    {
      title: 'Review metadata from more indie stores',
      body: 'JAST Store and Game Jolt join DLsite in the manual source picker. Compare the candidate title and official game-page address before applying metadata. Mature-source artwork and snippets start hidden until you reveal them.',
    },
    {
      title: 'Keep external library pointers without copying games',
      body: 'Wizard can remember a named external drive, NAS or local game folder. Check its availability when you want; NEO-LIB will not scan it automatically. A game inside an offline root will not launch until the drive returns. Cloud links remain catalogue bookmarks only.',
    },
    {
      title: 'Import a custom still-image theme',
      body: 'Every built-in theme has a versioned manifest and its own artwork folder. Theme Studio can now review and install a player-selected theme.json with local PNG, JPG or WebP artwork. Installed themes persist across launches; scripts, CSS and overwrites are not accepted.',
    },
    {
      title: 'Give custom themes their own particles',
      body: 'Theme creators can include transparent particle images and set safe count, size, opacity, speed and rise/fall/drift motion. NEO-LIB handles the animation, Effects dial, Rest Mode and reduced-motion behavior without running theme code.',
    },
    {
      title: 'Try the Theme Creator Lab',
      body: 'Start blank or remix an installed custom theme. Edit colours, seven artwork layers and particle images with a live preview. Canvas or Atmosphere can use one bounded GIF or WebM with a still fallback and once, visible-only or while-awake playback; video stays muted. Place particle art and event bursts, then save under a new ID; the source remains intact.',
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
      body: 'Wizard now scans only a ROM folder you choose, detects supported platform formats, lets you review titles and platforms, prevents duplicates, and imports each game into its platform shelf. Atari 2600, C64, Wii U and Switch are included. After import, a one-by-one metadata and case-art review searches by title and console, with public-web and optional AI fallback; nothing is saved without your approval. Wall groups retro covers by platform. Play opens the selected ROM through your saved emulator profile; NEO-LIB never supplies ROMs, BIOS files or emulators. Switch 2 awaits a verified format and launch route.',
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
    'NEO Lounge now offers opt-in, session-only fullscreen browsing for unlocked games, with large covers, All/Favorites/Recently played views, cautious update flags, keyboard/controller focus and a visible Exit/Escape path. Open Preview returns to Desktop first; controller game launch remains disabled pending safety testing.',
    'Lounge now shows tracked playtime, last session and Journey Status for the selected game, plus a quiet optional Fungist/FiFi tip. Update flags ask you to verify evidence in Preview. Failed fullscreen exits show a retry message; Preview waits until fullscreen is closed.',
    'Lounge adds clear keyboard and standard-controller hints. Shoulder buttons change its view once per press, moving focus to a cover or the active filter if empty; the next pad action follows that focus. A focused game removed from view hands focus to a remaining cover or the active filter. Mouse hover cannot replace another focused game\'s facts, and cover sizes scale for couch viewing. Confirming a cover opens Preview, not a game launch. Cover labels announce possible update flags, narrow layouts keep facts reachable, and offscreen covers load lazily. Broken artwork falls back to a readable title card, and failed exits restore retry focus. Real-pad testing remains pending.',
    'Default and Minimalistic now switch from Control Center. Minimalistic calms Home/navigation and folds Home editing, Library filters, Wall secondary controls and Tool details into one-click disclosures; no games or saved layouts change.',
    'Controller Center offers optional desktop controller focus for ordinary controls. It starts off, stays inside dialogs, the Control Center menu and Wall Peek, pauses on blur/Rest and cannot launch games; physical-pad testing remains pending.',
    'Wall controls now fit in one slim wrapping toolbar instead of a tall introduction and two oversized view cards.',
    'Wall covers can now be portrait or square. The Details column panel lets you change width, move fields earlier or later, and reset the layout. Each Details header also has a visible drag-to-resize grip; the saved column labels and minimum sizes remain intact.',
    'The Library/Preview divider now has a visible grab handle. Drag it to resize, use Left/Right keys, or double-click to reset. A drag saves its width when released.',
    'Canceling a Home widget move or resize no longer saves the unfinished position or size.',
    'Older Steam imports recover official portrait art from their saved app ID; remaining artwork stays vivid, with a colorful title cover as the final fallback.',
    'Wall cover ratings now use a clean star icon and fixed 11px score with no muddy text or badge shadow.',
    'Wall game titles now keep a fixed readable size and truncate long names instead of shrinking into tiny text.',
    'Fixed Library Preview failing to start when a game had capability badges but no achievement record.',
    'Selecting a Wall game still opens its normal Preview and protected categories remain private until unlocked.',
    'The official NEO-LIB Reddit shortcut remains beside Discord in the title bar.',
    'The Widgets manager now uses compact three-column cards, inline author names, concise size information and eye-only visibility controls.',
  ],
};
