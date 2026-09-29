# NEO-LIB v1.8.2 — First major test candidate

Release status: the full source gate passes, but this local session has no feedback-relay release credentials. No v1.8.2 installer or portable build has been produced or visually accepted yet.

The optional desktop sidebar now gives each destination its own colour profile rather than one shared muted accent. Coloured icon tiles and softly tinted buttons remain visible when the rail is compact; the active page, hover and keyboard focus receive stronger matching highlights. Rebuilt-app theme and visual acceptance remain open.

Library game previews now favor larger background art or screenshots over small store headers, and keep low-resolution fallback art at a bounded size instead of stretching it across an ultrawide hero. Explicitly selected hero art still takes priority. Rebuilt-app visual acceptance remains open.

Lounge Visual Builder now detects the window shape for Selected game backgrounds and can smart-fit artwork on ultrawide displays. Full-image/fill, horizontal and vertical framing, and zoom controls are available. Game art now gets tunable light rays and pulsing highlight glow; these are simulated SDR effects, not physical HDR. Settings keeps its live layout preview visible above scrolling controls and no longer duplicates preset cards. Themes groups Lounge-only layout and visual starters with named, saved complete setups; presets can be imported or exported, and cannot unlock private games. Local artwork/audio paths are omitted from exported presets. The selected-game preview can separately show playtime, journey, source, release, Your Rating and Metacritic where available. Further preview arrangement and typography controls, ultrawide visual tuning, controller testing and packaged-app acceptance remain open.

v1.8.2 supersedes the unshipped v1.8.1 source candidate and brings the unreleased v1.7.9 candidate work forward with the latest
Retro Library, Wall, theme and NEO Lounge source changes. It is a Windows test
candidate, not an installed-app acceptance claim. The original
[v1.7.9 notes](RELEASE_NOTES_v1.7.9.md) remain available for comparison.

Lounge Settings → Browsing now includes a Top browsing bar section. Players can show or hide Continue playing, Favorites, Recently played, Played this week, In progress, Recently added, Most played and A–Z without removing those views elsewhere. Wall, Game browser and All games stay visible; a currently active hidden view remains temporarily visible for orientation. Choices persist and default to the existing full bar. Installed controller and narrow-screen visual acceptance remains open.

Lounge's My samples sound assignments now open an audition picker instead of saving on a dropdown change. Click a clip to hear the full sample without closing or changing the role; press Use beside that clip to save it. Cancel, outside click, Escape and controller Back leave the old assignment intact. Rapid auditions stop the previous clip, and picker navigation stays inside the dialog. Installed audio/controller acceptance remains open.

Starlit Road is a fifth Lounge-only scene: an original panoramic anime night road, a small traveler, layered moonlit sky and cool lavender-blue palette inspired by the supplied reference. Its 3840×2160 display file was upscaled from 1672×940 generated artwork, not native 4K detail or physical HDR. Neon Gallery is a fourth Lounge-only scene based on the supplied NEO-LIB power artwork. It fills a widescreen gallery with a restrained centered emblem, crisp violet/cyan lighting and a dedicated palette; its 3840×2160 display file was upscaled from 1672×941 generated artwork, so it is not native 4K detail or physical HDR. Lounge-only scenes now show their artwork without a second desktop-theme FX wash. Blue Orbit gains more directional, sun-anchored simulated light, deeper contrast and slow scene movement; Rest, Motion Off and reduced-motion settings stop the motion. Visual Builder uses the live backdrop/light component in a miniature layout rather than a bright placeholder. This is not physical HDR or a rotating 3D planet.

Visual Builder now adjusts the main glass surfaces, bottom game bar and scenic preview box separately. The selected-game box can move left, center or right, change width, bounded height and opacity, and choose whether to show cover, description, facts and progress. Its progress line stays inside the box, not across the entire scene. Carousel titles have fixed-height two-line captions that reduce font size for longer names. Soft and animated neon cover outlines are brighter. Fireflies, snowfall and comet trails join Lounge particles, with amount, randomness and color choices. Source checks pass; installed theme-by-theme appearance, controller use and performance acceptance remain open.

Lounge’s current browse filter and controller/keyboard target now stand out in the active theme’s primary accent, with a stronger fill, border and glow. Filter targets also keep an inset edge visible inside the scrolling toolbar. Installed theme-by-theme visual acceptance remains open.

Lounge gamepad browsing now glides to center on one retargetable easing path. Native scroll snapping is suspended during the glide so repeated D-pad moves do not flip instantly between cards. The selected cover grows from its neighbor size, briefly pops and settles 45% larger than normal; its closest neighbors are 20% larger, second neighbors 10% larger, and the rest keep normal size. Motion Off and reduced-motion modes preserve the size hierarchy without the animation. Installed gamepad and visual acceptance remains open.

The expanded left sidebar now adds a short explanation under Menu, Home, Library, Wall, Tools, Lounge, Wizard and Rest/Wake. Its compact buttons and icon-only collapsed view remain unchanged. Installed visual acceptance remains open.

Holding or dragging a Library game no longer leaves the full-window “Drop to add” overlay stuck on screen. Only external Windows file drags show it, and canceled or interrupted drags now clear it. Internal game reordering and real `.exe`, shortcut or folder drops retain their separate behavior. Installed drag/drop acceptance remains open.

Lounge Soundscape now has a My samples style using all 37 supplied Button, Click and reaction MP3s. Assign and preview a clip or Off separately for moving between games, OK, Back and opening game details. The existing synthesized styles are unchanged, and these files do not affect Desktop or FiFi sounds. Clips load only when played; unusually loud ones are attenuated individually rather than boosting quieter clips. Frequent Move clips fade quickly, and app mute, Rest and hidden-window rules still apply. Installed listening and controller acceptance remains open.

Lounge can now open while NEO-LIB is resting, and a running game no longer forces an open Lounge to exit. Game-triggered Rest still pauses background work, Lounge motion and audio; a compact Rest status makes this clear. Controller navigation is available only while Lounge itself has focus, so a game running in front does not receive Lounge navigation. Installed game, tray and controller acceptance remains open.

In Lounge Game Browser, the mouse wheel or trackpad scrolls through the centered game carousel, including side-shelf layouts. Merely moving the mouse over covers no longer changes the featured game; clicking a cover still opens its details. Installed mouse and trackpad acceptance remains open.

Lounge Themes adds Follow desktop theme and an expandable catalogue of installed desktop themes; choosing one affects Lounge only. Lounge Settings can reveal private-category games after the existing category PINs are unlocked for the current session. Hidden remains the default, and the global Library privacy gate is unchanged. Installed PIN and controller acceptance remains open.

The Lounge Visual Builder keeps its live preview fixed above the scrolling controls. Atmosphere opacity, light bloom, wave scale and vignette now tune the rendered FX; the scene preview line stays inside its box, and panel and bottom-shelf transparency use separate controls. Comets have a longer, brighter tail, with more Lounge-specific particle customization. Installed visual and performance acceptance remains open.

The centered Lounge cover now has a 45% resting size increase and a short overshoot pop from its adjacent-card size, with 20% and 10% emphasis for its nearest neighbours. True portrait candidates are checked by image dimensions; wide art is shown fully contained rather than being cropped into a false cover. Optional tall cards, flowing two-accent neon edges and faster mouse-wheel input remain available. Controller grids retain their column as they move between rows. Real mouse, pad and TV-distance acceptance remains open.

The optional left navigation rail now includes a direct Lounge shortcut alongside Home, Library, Wall and Tools. Its icon, focus and expanded label follow the same rail behavior; entering Lounge still uses the guarded fullscreen route. Installed controller and visual acceptance remains open.

Lounge now separates its growing customization menus: Themes selects its scenery, Visuals handles artwork, transparency and effects, Settings groups layout, browsing and shortcuts, and Sound & Music has its own top-level icon. Existing audio choices remain compatible. Installed controller, visual and listening acceptance remains open.

Themes now offers five special Lounge-only scenes: Alpine Horizon, Blue Orbit, Sunlit Coast, Neon Gallery and Starlit Road. Each has original panoramic art and its own colour palette. Game Browser presents the selected cover on the left, game facts and Explore on the right, scenery above, and the carousel below. Players can choose up to five Lounge Home destinations for a top shortcut bar in Settings. The desktop theme is untouched, and personal background choices still work. The first three scene assets are 1672×941; the two new scenes use 3840×2160 upscaled display assets, not native 4K detail or physical HDR. Rebuilt Windows, ultrawide and controller acceptance remains open.

The bottom Game Browser wheel now sits against the usable screen bottom with safe padding, while its centered game grows more clearly and nearby covers recede. Layout's Hero preview height control resizes the stage above it. Visual Builder offers Off, a soft theme-colour cover outline, or an animated neon outline; motion and reduced-motion settings can stop the animation. The default theme-accent backdrop adds fluid waves and varied light/dark colour, using transform motion without a large blurred layer. Panels are a little more solid for readability; game imagery keeps its own opacity. Previously untouched Cinema settings move to these defaults, while custom looks remain. Rebuilt Windows visual and performance acceptance remains open.

Lounge Game Browser now defaults to a bottom wheel. Left/right shelves fill more of the available screen; the large preview favors gameplay screenshots, shows them without zooming, and never enlarges a portrait cover as a banner. To address idle flicker, its hero lighting stays steady and Lounge skips duplicate desktop-wide pulsing glow and blurred layers while retaining theme art and particles. Selection changes no longer restart the large-art fade. Rebuilt Windows flicker and visual acceptance remain open.

Lounge's header, toolbar, game shelf and Wall footer now have a softer glass opacity, and the space around contained hero art lets the living backdrop show through. The Visual Builder still controls panel opacity; text and cover art remain solid. Installed contrast and theme-by-theme visual acceptance remain open.

Game Browser now treats its horizontal or vertical shelf as a carousel: the selected cover grows while adjacent covers ease back, and navigation smoothly centers the selected game. Edge spacing lets the first and last games reach the center. Motion Off and system reduced motion use immediate scrolling. Installed controller and visual acceptance remain open.

Lounge Layout and Visual Builder now pause the full-screen effects behind their menus and no longer apply a full-screen blur while scrolling or dragging controls. The small Visual Builder preview stays live. Slider updates reuse the current game ordering and unchanged cover images; carousel measurements wait until a menu closes. Installed performance acceptance remains open.

Lounge Visual Builder and Layout now offer four bundled ambience tracks, Off and a player-imported MP3 with independent volume. Personal audio is copied into NEO-LIB; playback loops only while Lounge is active and focused and respects app mute and Rest. Installed listening and controller acceptance remains open.

Settings now explains how to get a SteamGridDB API key, what optional artwork search it unlocks in Game Workshop, and where to use it. A clear key-entered message avoids implying the connection has been verified before the first search. Installed visual acceptance remains open.

In Sidebar mode, Wizard and Rest move below a divider in the left rail, while Select joins the Library filter row. Switching back to top navigation restores their original Library positions. Installed visual acceptance remains open.

The left navigation rail now uses consistent larger icons, with a Menu control that stays visible while the rail is collapsed. Installed visual acceptance remains open.

Wall Peek now labels Game Signals without requiring hover and displays screenshots as one large image with up to three clickable alternatives below. Failed images leave the gallery. Installed visual/controller acceptance remains open.

Selecting a game from Home or the Library list now opens that game's Preview even when Wall was the previously saved Library view. Installed click-path acceptance remains open.

Visual Tweaks now stays open across Home, Library, Wall and Tools instead of disappearing on Wall and reappearing when the sidebar returns. Use its Close button or click outside to dismiss it. Installed navigation/drag acceptance remains open.

Lounge Home adds a Recently added cover shelf from recorded library dates. It avoids repeating games already featured above, opens in-Lounge details and can be hidden in Customize Home. Installed visual/controller acceptance remains open.

A Recently added Home shortcut and Lounge browse filter now open the full newest-first set, beyond the compact Home shelf. Games without reliable add dates are not invented. Installed controller acceptance remains open.

Lounge Home activity cards now open matching Played this week and In progress browse views. The seven-day view uses recorded last-played dates, and In progress uses your Journey Status. Installed controller acceptance remains open.

Lounge Layout now lets All games and Favorites retain Library order or sort by natural name, last played or library-added date. Other filters keep their own order, and Reset Lounge layout restores the default. Installed large-library/controller acceptance remains open.

Empty Lounge filters now have a themed recovery panel: clear an A–Z letter, return to All games, or exit Lounge when the unlocked library has no games. Installed controller acceptance remains open.

The featured game's artwork now adds a soft ambient backdrop to Lounge Home, shaded for readability. A chosen Lounge image or plain canvas takes priority, and failed artwork falls back to the theme surface. Installed bright/dark-theme acceptance remains open.

Lounge Soundscape now has a separate Move-cue level. Browsing can be softened or silenced while OK and Back retain the main Lounge volume. Installed listening and controller acceptance remains open.

Lounge Visual Builder adds Slow, Steady and Lively pace for background drift and waves, separate from overall motion and browsing speed. It persists, resets and is included in starting looks. Installed visual/performance acceptance remains open.

Lounge Layout adds Compact, Comfortable and Couch-size navigation targets for its header and browse strip without changing the game covers. The choice persists and resets with the layout. Installed TV/narrow-window acceptance remains open.

The Lounge Visual Builder preview now uses the same living backdrop as Lounge, showing theme or selected-game art and the current motion/FX choices instead of a generic colour swatch. Installed visual and performance acceptance remains open.

Lounge's living-background waves now soften at lower FX levels and with Gentle motion, while the Wave strength control keeps its full range. Installed theme-by-theme visual and performance acceptance remains open.

Lounge's view filters now form one icon-led scrolling strip, keeping the selected choice visible while making room for game artwork. Layout adds an entry-screen choice: games or Lounge Home after manually entering fullscreen. This does not auto-open Lounge at app startup. Installed pad and narrow-window acceptance remains open.

Lounge's selected cover now holds its emphasis when hovered, with a steady accent marker and clearer Game Browser title band. Motion Off and reduced-motion choices keep focus visible without moving covers. Installed visual acceptance remains open.

Lounge now has a Continue playing view in both layouts and a customizable Home shortcut. It uses the same saved activity and Journey Status rules as the Home preview, while showing every matching game; installed controller acceptance remains open.

Lounge adds a Most played view to its toolbar and customizable Home shortcuts. It ranks games with tracked playtime and works in both Wall and Game Browser; installed controller acceptance remains open.

Lounge and Wall's Recently played view now recognises valid saved date strings as well as numeric timestamps, so recorded sessions are not silently omitted. Installed real-library verification remains open.

Lounge's compact controls now show controller guidance first when controller navigation is enabled. In-game Previous and Next are larger labeled buttons for couch browsing; installed pad and TV-distance acceptance remains open.

Game Details' developer, publisher, release, score and website icons are larger and have subtle individual colors. Text sizing stays unchanged. Installed theme-by-theme visual testing remains open.

Wall's Home and Library return buttons now sit at the left edge of its toolbar. With vertical sidebar navigation enabled, that duplicate pair is hidden in favor of the existing pop-out rail. Installed layout testing remains open.

Lounge Visual Builder now offers Follow theme, No particles and seven bundled particle looks independently of Desktop's theme. FX strength and motion safeguards still apply. This is a source candidate pending installed visual and performance testing.

Lounge now has optional Glass, Pulse and Orbit sound sets for moving, OK and Back, with saved style, on/off, volume and preview controls in Layout and its own Visual Builder. App-wide mute, Rest and a hidden window silence them. When a selected game has a possible-update flag, a small dismissible mascot notice can appear in the corner without claiming an update is confirmed. Audible, visual and controller testing in a rebuilt Windows app remains open.

Home no longer shows saved Steam update warnings as current before rechecking the launcher; old cards clear during Refresh, and the delayed check is no longer postponed by Home rerenders.

Home widget dragging now keeps one pointer session across neighbouring widgets. A held card follows the mouse while the grid opens space, and larger coloured title-bar icons make widgets easier to identify. Dedicated preview header art now takes priority over generic backgrounds when no custom hero is chosen; playtime and install-size facts have clearer plain text on a compact solid backing. Detailed Wall gains Your Rating, Metacritic, achievements and Added columns plus a saved Big icons option. Tools includes optional DLSS Swapper and ReShade executable pointers, an OptiScaler folder pointer, and official download links; NEO-LIB does not install or inject them into games. These changes still need installed Windows visual and interaction acceptance.

Home's eight resize grips now use explicit positions inside their own widget edges, fixing scattered dots in the unlocked layout.

## What changed

- **A more welcoming Lounge Home (source candidate)** — if no game is ready to resume, the large feature card shows a real Backlog/unplayed pick or another visible game, without calling it recently played. Broken or missing wide art gets a themed cover fallback. Installed visual and controller acceptance remains open.

- **Lounge visual starting looks (source candidate)** — Game cinema, Theme glow, Soft focus and Quiet screen apply editable combinations of backdrop, visibility, motion, panel opacity and FX without removing imported artwork or changing the layout. Installed visual and controller acceptance remains open.

- **Lounge artwork framing (source candidate)** — Visual Builder can shift background art vertically to keep the important part in view. The choice persists and Reset returns it to center; installed visual acceptance remains open.

- **Game-following Lounge background (source candidate)** — Visual Builder can show the selected game's artwork behind Lounge browsing, with the active theme as fallback. Motion Off and reduced-motion choices remove the art transition. Installed visual and performance acceptance remains open.

- **Faster Lounge browsing (source candidate)** — an A–Z jump panel in Wall and Game Browser narrows the active collection by first letter with controller-sized targets and game counts. Show all restores the complete view. Installed controller/focus acceptance remains open.

- **Durable personal Lounge backgrounds (source candidate)** — choosing a PNG/JPG/WebP background now stores a checked private copy in NEO-LIB, so moving the original no longer breaks it. Previously linked backgrounds remain compatible. Installed picker and restart acceptance remain open.

- **Next up on Lounge Home (source candidate)** — a cover shelf draws from visible Backlog and unplayed games, favoring starred titles within each group. The source of each pick is stated; there is no fabricated recommendation score. Selecting one opens Lounge details, and Customize Home can hide the shelf. Installed controller and visual acceptance remains open.

- **A fuller Lounge Home (source candidate)** — the Home button now opens a fullscreen Guide with large All games, Favorites, Recently played and Visual Builder destinations. Customize Home lets players reorder or hide these cards using buttons; the arrangement is saved. Each collection route uses the existing Wall filters; Back returns to Lounge browsing. Continue Playing and activity remain based on unlocked recorded games, and game selection still opens details rather than launching. Installed visual and controller acceptance remains open.

- **Lounge visual builder and navigation (source candidate)** — Lounge now has its own large visual builder, separate from layout settings. Import a private copy of a PNG/JPG/WebP background from the PC, choose theme, light, dark or clear canvas, adjust artwork and panel opacity, select drift, light waves or stillness, and tune the selected theme's particle/FX strength. Larger Home and Back targets support couch navigation; Guide gains Browse all games and Customize Lounge destinations. Installed image-picker, visual, controller and restart acceptance remains open.

- **Lounge Guide (source candidate)** — a Guide overlay in both Wall and Game Browser offers Continue Playing and a compact activity snapshot from recorded library facts. It uses unlocked games only, excludes completed/dropped titles from Continue Playing, and opens in-Lounge details rather than launching on selection. Tracked lifetime playtime is separate from the count of games last played in seven days; no weekly-hours estimate is invented. Installed visual and controller acceptance remains open.

- **Make Lounge your own (source candidate)** — Game Browser gains an artwork-led stage and four layouts: Cinema (top shelf), Console (bottom), Gallery (left) and Spotlight (right). Customize inside Lounge to move its shelf, adjust cover/spacing/preview sizes, choose how much game information appears, and tune motion or Lounge-only FX without changing Desktop. Cover Wall size is adjustable too. The selected cover has stronger depth and theme-coloured focus. Choices save and include Reset; side shelves adapt on narrow windows. Ambient actors stop when the window is hidden, and Lounge motion pauses while hidden or resting. Installed visual, controller and performance acceptance remains open.

- **Game Browser stage polish (source candidate)** — a restrained scene-light sweep, lit shelf and theme-coloured position rail add life and orientation without covering game artwork. Titles and portraits settle in briefly as the selection changes. The extra portrait card appears only when the stage has room, so left and right shelf layouts keep their title and actions readable. Motion Off and reduced-motion settings remove those transitions; FX None removes the sweep. Installed visual acceptance remains open.

- **Lounge Wall visual polish (source candidate)** — the cover wall gets a quieter gallery surface and stronger selected-tile contrast. Its selected-game footer now has a compact cover anchor and theme-tinted lighting while keeping the existing game facts and action. Installed visual acceptance remains open.

- **Living Lounge background (source candidate)** — both Lounge views now place the active theme's atmosphere art behind the UI as a slowly drifting backdrop with restrained accent light. Existing Lounge flow strength and speed tune that movement; FX None, Motion Off, Rest, hidden windows and reduced-motion preferences stop it. Animated theme media uses its validated still image in this backdrop, leaving existing particle and media effects to their own layers. Installed theme-by-theme visual and performance acceptance remains open.

- **Cleaner Lounge controls (source candidate)** — a slimmer header and icon-led Wall/Game Browser switch leave more room for games. The full keyboard and controller guide now opens from a compact Controls button, while a short control hint stays visible. Shelf covers keep most of their original colour instead of looking greyed out, and the active cover uses a quiet glass focus label alongside its clear border. No browsing or launch behavior changed. Installed visual and focus acceptance remains open.

- **Lounge game-details refresh (source candidate)** — opening a cover now presents an artwork-led detail panel with a clearer story area, grouped facts and screenshots. A separate banner no longer causes the first screenshot to disappear from the gallery. The protected Launch action stays visible while details scroll, without changing its one-use mouse/keyboard authorization. Short windows reduce the hero height. Installed visual, input and game-launch acceptance remains open.

- **Browse without leaving details (source candidate)** — Previous and Next cycle through the games in the current Lounge filter, updating the artwork and facts in place. Each game starts at the top of its details; closing after browsing returns focus to the game now shown. The protected Launch path is unchanged. Installed focus/controller acceptance remains open.

- **Lounge stays Lounge (source candidate)** — selecting a game opens an artwork-and-facts panel in fullscreen Lounge, with screenshots and a separately protected Launch button. Launching leaves Lounge open behind the game. Selected covers have stronger theme-coloured glow and motion; Theme Creator now includes Lounge-only focus, flow, artwork, panel and FX controls. Controller browsing still cannot directly launch a game. Installed Windows and per-theme acceptance remain pending.

- Home's private-games-locked notice is now a compact status pill instead of a full-width banner.

- Removed the redundant appearance-location banner from Settings, leaving more room for actual controls.

- **A more visual Add Games Wizard (source candidate)** — jump directly to one-game add, launcher import, folder scan, Retro, external libraries or library care. Distinct route icons and launcher marks make choices easier to spot; simple skip-path controls become accessible icon buttons. Installed visual acceptance remains pending.

- **Steam game launch fix (source candidate)** — normal Launch for Steam imports now asks Steam to start the app by ID, preserving Steam's own launch-choice prompt and Steamworks context instead of directly opening a discovered game EXE. Explicit custom routes and non-owned copies are unchanged. Verify Icarus's DX choice, sign-in and saves in the rebuilt Windows app.

- Preview playtime now displays rounded minutes or hours instead of raw fractional values imported from launchers.

- **NEO Lounge begins its two-mode design (source candidate)** — switch between cover Wall and a focused Game Browser shelf with a larger game-art stage. The active game now stands out with an outline, glow, lift and label; Lounge reuses the chosen theme's ambient FX and remembers the layout. Activating a cover opens in-Lounge details; Launch is a separate protected action. Installed fullscreen and controller acceptance remain pending.

- **Theme Creator artwork workbench (source candidate)** — start a remix from any built-in theme, browse its button frames and other artwork, reuse a working copy as a layer or particle, and open that copy in a desktop editor. Canva and ChatGPT Images shortcuts support a manual upload/download round trip; NEO-LIB never uploads artwork to those sites. Existing theme artwork stays untouched, while a saved theme gets validated copies and can reuse a built-in FX style. Installed visual/editor acceptance remains pending.
- **Real particle art in Theme Creator (source candidate)** — the particle picker now shows seven named transparent sprites, such as rain dots, falling hearts, sakura petals, embers and bubbles, instead of background images. Each sprite brings a matching initial motion setting, can be edited as a workbench copy, and still supports player-supplied particle images. Installed motion and visual acceptance remains pending.
- **More natural particle motion (source candidate)** — set how much each particle's speed differs, spin sprites while they move, and add a gentle side-to-side sway for hearts and falling leaves. The live preview follows the saved theme's motion model; imported values are bounded. Installed motion acceptance remains pending.

- **Wide game previews stay readable (source candidate)** — the hero facts, action controls and game information now use a centered reading width when the window is expanded. Live news stays a compact card with a two-line teaser, and Special-theme action artwork no longer stretches indefinitely across ultra-wide previews. Installed visual acceptance remains pending.

- **Wider Theme Creator (source candidate)** — opening Creator Lab widens the Themes window and places the larger live preview in its own right-hand pane beside the editors. On narrow screens, the preview stacks below the editors. Installed visual acceptance remains pending.

- **Clearer controller discovery (source candidate)** — Controller Center retains a controller connection event even when Chromium's device list lags, distinguishes blocked/unavailable browser access, and no longer claims a Windows/Steam-visible pad is disconnected merely because NEO-LIB cannot read it. The empty state gives 8BitDo Ultimate 2 Wireless Windows connection guidance. This does not make Steam-only Bluetooth input a NEO-LIB navigation device; physical-pad acceptance remains pending.
- **Windows controller visibility and pressed-button feedback (source candidate)** — Controller Center checks connected Windows devices on open and Refresh, listing Bluetooth or USB/HID controller presence separately from live buttons and axes. A device Windows sees may still need a compatible input route before it can navigate NEO-LIB. Buttons now visibly respond throughout a click-and-hold. Installed Windows/8BitDo acceptance remains pending.

- **Clean narrow Library controls (source candidate)** — icon-only Library mode and narrow panel widths use dedicated icons for launcher filter, sorting, categories and auto-sort. Wizard, Rest and Select keep stable icon buttons, while navigation labels disappear cleanly rather than shrinking into unreadable fragments. The filter icons stay grouped during live resizing; titles and accessible names preserve their meaning. Installed visual acceptance is pending.

- **Sidebar navigation placement corrected (source candidate)** — the optional icon rail now occupies its own full-height strip at the far left instead of taking space inside or above Library. It expands smoothly on hover or keyboard focus and stays available in Wall. Visual Tweaks opens beside the combined rail and Library. Installed visual acceptance is pending.

- **More direct Home editing (source candidate)** — the widget being moved or resized now has a clear theme-coloured outline. With Home unlocked, drag any edge or corner to resize; Free move adjusts the dragged edge, while Snap changes grid-cell dimensions. Wall cover density now reaches 14×14. Installed mouse and high-density visual acceptance remain pending.
- **Lighter Mid themes (source candidate)** — Generic Gray is substantially brighter; Generic Blue, Gaming, Modern and Home receive smaller lifts to surfaces and theme backgrounds.

- **NEO Lounge fullscreen browser (source candidate)** — choose NEO Lounge in Control Center for a large-cover view of your unlocked games, with All/Favorites/Recently played filters, last-game focus and cautious update flags. Browse with mouse, keyboard or an opted-in controller; Exit or Esc returns to Desktop. Selecting a game opens details inside Lounge. It never starts automatically, and controller game launch is still disabled pending its separate safety work. Installed Windows acceptance is pending.

- **Lounge details and quiet guidance (source candidate)** — the selected game shows tracked playtime, last session and Journey Status. Possible updates are explicitly marked for review, not installed automatically. Fungist or FiFi can offer a short, silent tip when enabled. A failed fullscreen exit explains that the player should retry; game details no longer depend on leaving fullscreen.

- **Clearer Lounge controls (source candidate)** — keyboard and standard-layout gamepad hints stay visible without assuming a controller brand. Shoulder buttons switch All/Favorites/Recently played once per press, moving focus to a cover or keeping it on the selected filter if the view is empty. The next pad action follows that focus instead of jumping back to the old filter. If a focused game disappears, focus moves to a remaining cover or the active filter. Hover cannot silently change another focused game's facts; cover sizes now scale for couch viewing. Focus a cover to inspect its facts; confirm it to open in-Lounge details, never to launch the game directly. Screen readers get a clearer cover label, narrow windows keep facts reachable, and a failed fullscreen exit returns focus to Exit. Covers below the viewport load lazily; broken artwork falls back to a readable title card. Installed-controller and visual acceptance remain open.

- **Minimalistic interface (source candidate)** — switch Default/Minimalistic from Control Center → Personalise. Home editing, Library filters, Wall secondary controls and Tool supporting actions/facts move behind clear one-click disclosures, while primary navigation, privacy, quick filters and launch/recovery remain visible. Themes, games and saved arrangements stay shared. Installed visual acceptance is still pending.

- **Opt-in desktop controller navigation (source candidate)** — Controller Center can enable a visible controller focus ring for ordinary interface controls. Dialogs, Wall Peek and the Control Center menu keep focus inside; HOME and Start use existing navigation. The feature starts off, pauses on blur/Rest and cannot launch games. Physical-controller acceptance is still pending.

- **One Library Wizard** — manual game add, folder scans, launcher imports,
  missing-metadata refresh, full metadata refresh and library tidy-up now start
  from Wizard. The duplicate Add and Refresh toolbar menus are gone.
- **Full-workspace Wall** — Wall hides the Library pane and becomes a lighter
  browsing mode. Home and Library actions return to the normal workspace.
- **Two Wall views** — choose large side-by-side cover browsing or a detailed
  list with main genre, release date, last played, install size, tracked hours,
  source and personal rating.
- **Slim Wall controls** — the former tall Wall introduction and two large view
  cards are now one compact toolbar with Covers/Details, density and return
  controls, leaving much more room for the collection.
- **Wall layout choices (source candidate)** — Cover Wall can switch between
  portrait and square tiles while retaining its size control. Detailed Wall's
  Columns panel can now move fields earlier/later, adjust width, and reset the
  layout. A visible grip on each Details header also previews width while
  dragging and saves once on release. The column model now retains its labels
  and minimum widths after loading saved preferences. Choices are saved with
  the existing Wall preferences. Installed visual and persistence checks are
  still pending.
- **Library resize handle (source candidate)** — the divider beside Preview now
  has a visible grip and resize cursor. Drag, use Left/Right (Shift for larger
  steps), or double-click to restore the default width. Pointer drags preview
  live but save once on release; Escape cancels an in-progress drag. Windows
  interaction acceptance is still pending.
- **Safer Home widget editing (source candidate)** — canceling a free-position
  move or widget resize now discards the unfinished gesture rather than saving
  a partial layout. Installed pointer-interruption testing is still pending.
- **Better cover recovery** — older Steam imports reuse their saved app ID to
  load official portrait art. Titles without a portrait show vivid existing
  artwork instead of a washed-out gray card, with a colorful NEO-LIB title
  cover as the final fallback.
- **Readable Wall polish** — ratings use a flat, shadow-free 11px badge with a
  clean star icon, and cover titles keep a readable size at every density,
  truncating long names instead of shrinking them into unreadable text.
- **Library crash fix** — capability-only games can no longer make Preview read
  an achievement source from a missing achievement record.
- **Community shortcut** — Reddit remains immediately beside Discord in the
  title bar for the official NEO-LIB community.
- **Category-free Home widget canvas** — Home now has a clear Unlock/Done mode
  and no movable category containers. Every widget stands alone. Snap mode
  provides live grid reordering; Free move stores exact position, size, overlap
  and stacking. Title-bar menus expose placement mode, stacking, resizing,
  reset and hide actions.
- **Compact widget manager** — built-in and imported widgets use tidy
  three-column cards with the author inline, short descriptions, concise size
  facts and an accessible eye-only visibility control.
- **Community widget host** — imported widgets can now be enabled individually
  on Home. Each runs inside its own restricted frame. Storage, redacted Library
  summaries and HTTPS access each require a separate choice in Widgets.
  Broken widgets can be reloaded, updates require review, and uninstall keeps
  a recoverable copy. See the Home Widgets guide before using community code.
- **Opt-in Steam achievement progress** — confirmed Steam-owned games can now
  fetch earned and total counts from Steam on demand. A personal Steam Web API
  key stays only in app memory for this session. Account, app ID and ownership
  must agree; NEO-LIB never guesses progress or changes it after a failed sync.
  Other launcher games state clearly when only achievement availability—not
  verified earned progress—is known.
- **More reviewed indie metadata sources** — JAST Store and Game Jolt join
  DLsite in the manual source picker. Results link to official game pages and
  require your review before applying. Mature-source covers and snippets start
  hidden until you reveal them; existing-library refresh keeps its small review
  batches. Live store-page and Windows-app checks are still pending.
- **External library pointers** — save a named external-drive, NAS or local
  game folder in Wizard without copying or scanning it. Check availability on
  demand; games inside an offline root refuse to launch with a clear message.
  Stored paths start hidden in the manager. Cloud entries are bookmarks only,
  with no account connection or cloud-game launching.
- **Custom theme import** — all built-in themes now use versioned folders with
  validated palettes and local artwork. Theme Studio can review and install a
  player-selected still-image theme into NEO-LIB's user-data folder, then select
  it again after restart. Scripts/CSS, unsafe paths, oversized assets and
  overwriting existing themes are blocked. Atmosphere GIF/WebM playback now uses bounded local media and a required still fallback;
  rebuilt Windows interaction and visual acceptance are still pending.
- **First creator FX layer** — custom themes can supply up to three transparent
  particle images with bounded density, size, opacity, speed and rise/fall/drift
  motion. NEO-LIB animates them behind the UI; Effects intensity, Calm/Balanced,
  reduced motion and Rest Mode stay in control. More FX modules and a full
  visual editor are future work.
- **Theme Creator Lab** — start blank or remix an installed custom theme in a
  compact live-preview editor for all colours, seven named artwork layers,
  particle images and motion
  settings, including placement, near/far depth, fixed rotation, bounded
  glow and optional one-shot launch/celebration bursts. Saving makes a new credited theme copy; a remix preserves its
  source. Layer images can be replaced, removed and faded without editing
  the source. Canvas can blend a still image over its gradient; Canvas or Atmosphere
  can use one bounded GIF or WebM with a required still fallback. Video offers once,
  visible-only and while-awake playback, stays silent, and falls back to the still
  if decoding or runtime limits fail. Atmosphere GIFs can also play one checked
  cycle (up to 20 seconds) and return to their still image.
- **Optional navigation sidebar** — keep the familiar top navigation or move
  Home, Library, Wall and Tools into a slim left icon rail. The rail reveals
  its labels on hover, and the same saved choice is available in Visual Tweaks
  and Control Center → Personalise.
- **Wall quick filters** — switch between All, Favorites, Most played and
  Recently played directly from the Wall toolbar. The active filter is clearly
  highlighted and works in both Covers and Details.
- **Reviewed Retro Library import** — connect a player-installed emulator to a
  chosen ROM folder, scan only its supported file types, edit the title/platform
  review list, and import without duplicate ROM paths. Library shelves and Wall
  sections are created per platform. Launching passes the selected ROM directly
  to that profile through NEO-LIB's normal guarded Play route.
- **Lounge Emulator Zone** — switch from Lounge Home to a console-by-console
  carousel for the 20 supported Retro Library platforms. Shoulder buttons move
  between consoles; each shelf shows only that platform's imported games. An
  unconfigured platform points back to Wizard → Retro Library → Manage profiles.
  Nineteen console identification marks are bundled locally; Arcade uses a
  text badge. Logo rights and installed controller/UI
  acceptance remain open before distribution.
- **Icon-led Lounge navigation** — larger, individually tinted header actions,
  Home filters and shortcuts, and Emulator Zone marks reveal their labels below
  the icon on hover, focus or selection. Accessible names remain available
  without the animation.
- **Remember my Lounge** — local settings retain Lounge theme, Sound & Music,
  FX and layout adjustments. Reopening Lounge also restores the last Zone,
  collection filter, console and focused game when available. The existing
  optional Lounge Home entry still opens its guide first; Lounge never opens
  automatically with the desktop app.
- **Retro metadata handoff** — Atari 2600, C64, Wii U and Switch join the
  supported folder profiles. Import opens a one-game-at-a-time metadata and
  case-art review using title plus console, public-web fallback and optional
  configured AI. Nothing is applied without approval; Switch 2 remains pending
  a verified format and launch route.
- **Safer Collection Mode work** — selected games can enter confirmed metadata
  or artwork review queues one at a time. Manual metadata and protected artwork
  remain safe, previous artwork is restorable, and private-category assignment
  requires an unlocked destination plus a clear scope summary.
- **Reviewed online artwork gallery** — players can optionally save their own
  SteamGridDB API key, confirm the matching game, compare Icon, Cover, Hero,
  Background and Logo candidates with source, author and resolution details,
  then stage one deliberate choice. Nothing replaces current artwork until the
  normal Save game action.
- **Clearer GitHub project page** — the oversized internal development diary has
  been replaced by a concise player-facing overview with honest download status,
  supported sources, privacy, installation, feedback and roadmap information.
  Retired prototype and generated testing files have also been removed from the
  repository without changing the live desktop application.

## Verification

The renderer-state/Lounge suite and the full pre-renderer verification sequence pass,
including category privacy, controller focus, artwork and release-boundary checks.
The managed workspace cannot start Vite's build helper (`spawn EPERM`), so no fresh
renderer bundle or installer was produced. Rebuilt Windows scan/import/launch and
hands-on Lounge visual/controller acceptance remain required.
Rebuilt Windows visual and interaction acceptance remains required before this
candidate is published as a public release.

## Release status

This is a testing candidate. Publish only from the exact clean Git tag
`v1.8.2` after the Windows acceptance record is complete.
