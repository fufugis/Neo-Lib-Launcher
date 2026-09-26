export const V181_CHANGELOG = {
  version: '1.8.1',
  title: 'First major test candidate',
  major: [
    {
      title: 'One Wizard for every library import',
      body: 'Add one game, import installed launcher games, scan folders, build a Retro Library, save external-drive or NAS pointers, and review missing metadata from one place. Metadata suggestions remain approval-first rather than silently replacing your edits.',
    },
    {
      title: 'Home widgets are yours to arrange',
      body: 'Unlock Home to reorder individual widgets on the grid or switch snapping off for free placement. Resize from edges and corners, use title-bar menus to hide or reset widgets, and manage imported community widgets through a restricted host.',
    },
    {
      title: 'Retro Library connects import to metadata review',
      body: 'Choose a ROM folder and your own emulator for each platform. Atari 2600, C64, Wii U and Switch join the supported profiles. Newly imported ROMs open a one-game-at-a-time review for descriptions and case art; web and optional AI suggestions are never saved without your approval. Switch 2 remains pending a verified format and launch route.',
    },
    {
      title: 'Make Wall and Library easier to shape',
      body: 'Wall covers can be portrait or square. Detailed Wall columns can be shown, reordered and resized, with Your Rating, Metacritic, achievements and library-added date available. A Big icons switch enlarges row artwork. The Library divider has a visible drag handle with keyboard and reset controls; choices return after restart.',
    },
    {
      title: 'More ways to understand and care for games',
      body: 'Journey Status tracks the games you have not started, are playing, paused, completed or abandoned. Steam-owned games can explicitly sync verified achievement counts. Wall and Library support game selection for confirmed bulk changes, and Game Workshop adds artwork comparison, protection and restore.',
    },
    {
      title: 'Artwork and metadata stay under your control',
      body: 'Covers favour original portrait art, while missing covers use a designed title card instead of washed-out artwork. Optional SteamGridDB suggestions and JAST Store, DLsite and Game Jolt metadata are reviewed before saving. External library roots remain pointers, not copied files.',
    },
    {
      title: 'Create your own visual atmosphere',
      body: 'Theme Creator supports credited custom themes, artwork layers, particles and bounded GIF or WebM atmosphere with still-image fallback. Built-in themes retain their validated layer folders.',
    },
    {
      title: 'Preview NEO Lounge',
      body: 'The opt-in fullscreen browser shows unlocked games, controller and keyboard focus, tracked game facts and a safe route back to Desktop Preview. Controller game launch remains disabled until real-pad safety testing is complete.',
    },
    {
      title: 'Graphics utilities in Tools',
      body: 'DLSS Swapper and ReShade can be linked to an existing executable; OptiScaler can be linked to its downloaded files. Each has an official download link. NEO-LIB does not modify game files or install these utilities automatically.',
    },
  ],
  fixes: [
    'Dragging a Home widget across another no longer loses its pointer session; a floating held card follows the mouse while grid widgets make room.',
    'Home widget title bars now have larger, coloured icons to identify each widget at a glance.',
    'Preview prefers dedicated banner/header art over a generic store-page background when no custom hero is selected.',
    'Preview playtime and install-size facts use larger plain text on a compact solid backing, without glow or mono-font blur.',
    'Home’s private-games-locked notice is now a slim status pill rather than a full-width banner.',
    'Removed the redundant appearance hint from the top of Settings.',
    'Add Games Wizard now has icon-led jump choices, clearer task cards and distinct launcher marks, with accessible labels on compact icon controls.',
    'Steam-imported games now launch through Steam by app ID, so Steam can provide its own launch options and app context; explicit custom routes remain available.',
    'Preview playtime now uses readable rounded minutes and hours instead of showing long fractional values.',
    'NEO Lounge now offers Wall and Game Browser layouts, a clearer selected cover, and the active theme’s ambient effects in fullscreen.',
    'Home waits for a fresh Steam update check before showing alerts, clears old update cards during Refresh, and no longer postpones its scheduled check on rerenders.',
    'Theme Creator can remix built-in themes, browse and copy NEO-LIB button/ambient art, open an editable copy in a desktop app, and reuse built-in FX. Canva and AI Images shortcuts require manual upload; stock files are never overwritten.',
    'Expanded game previews keep actions and information at a readable width; live news and Special-theme decorations no longer stretch across the whole window.',
    'Theme Creator now opens a wider two-column workspace, with a larger live preview beside the editing controls and a stacked layout on narrow screens.',
    'Controller Center now retains connection events that arrive before live device enumeration and explains when Windows or Steam can see a pad that NEO-LIB cannot read.',
    'Narrow or icon-only Library toolbars now use grouped, labelled icon buttons instead of squeezed or wrapped text.',
    'Sidebar navigation now sits in its own full-height strip at the far left, with smooth hover/focus expansion and no indentation of Library.',
    'Held Home widgets now glow, and unlocked widgets resize by dragging any edge or corner. Wall cover density reaches 14×14.',
    'Generic Gray, Generic Blue, Gaming, Modern and Home mid themes have brighter surfaces and matching backgrounds.',
    'Interrupting a Home widget move or resize no longer saves a partial layout change.',
    'The current build is a Windows test candidate. Installed launch, upgrade, visuals, controller and emulator behavior still require hands-on acceptance before publication.',
  ],
};
