# NEO-LIB v1.8.0 — First major test candidate

v1.8.0 brings the unreleased v1.7.9 candidate work forward with the latest
Retro Library, Wall, theme and NEO Lounge source changes. It is a Windows test
candidate, not an installed-app acceptance claim. The original
[v1.7.9 notes](RELEASE_NOTES_v1.7.9.md) remain available for comparison.

## What changed

- **NEO Lounge fullscreen browser (source candidate)** — choose NEO Lounge in Control Center for a large-cover view of your unlocked games, with All/Favorites/Recently played filters, last-game focus and cautious update flags. Browse with mouse, keyboard or an opted-in controller; Exit or Esc returns to Desktop, and Open Preview leaves fullscreen first. It never starts automatically, and controller game launch is still disabled pending its separate safety work. Installed Windows acceptance is pending.

- **Lounge details and quiet guidance (source candidate)** — the selected game shows tracked playtime, last session and Journey Status. Possible updates are explicitly marked for review, not installed automatically. Fungist or FiFi can offer a short, silent tip when enabled. A failed fullscreen exit now explains that the player should retry, and Preview does not open until fullscreen has actually closed.

- **Clearer Lounge controls (source candidate)** — keyboard and standard-layout gamepad hints stay visible without assuming a controller brand. Shoulder buttons switch All/Favorites/Recently played once per press, moving focus to a cover or keeping it on the selected filter if the view is empty. The next pad action follows that focus instead of jumping back to the old filter. If a focused game disappears, focus moves to a remaining cover or the active filter. Hover cannot silently change another focused game's facts; cover sizes now scale for couch viewing. Focus a cover to inspect its facts; confirm it to open Preview, never to launch the game. Screen readers get a clearer cover label, narrow windows keep facts reachable, and a failed fullscreen exit returns focus to Exit. Covers below the viewport load lazily; broken artwork falls back to a readable title card. Installed-controller and visual acceptance remain open.

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

Focused Home-widget, package, emulation, launch, provider, IPC, visual-boundary,
renderer-binding and metadata-workflow checks pass. The managed workspace cannot start Vite's
build helper (`spawn EPERM`), so a rebuilt Windows scan/import/launch pass remains
required.
Rebuilt Windows visual and interaction acceptance remains required before this
candidate is published as a public release.

## Release status

This is a testing candidate. Publish only from the exact clean Git tag
`v1.8.0` after the Windows acceptance record is complete.
