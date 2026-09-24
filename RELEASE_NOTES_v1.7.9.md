# NEO-LIB v1.7.9 — Library workflow and Wall polish hotfix

v1.7.9 is a focused follow-up to the v1.7.8 architecture candidate. It keeps
the existing launcher, metadata, privacy and mascot work intact while making
Library and Wall easier to use.

## What changed

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
- **More reviewed indie metadata sources** — JAST Store and Game Jolt join
  DLsite in the manual source picker. Results link to official game pages and
  require your review before applying. Mature-source covers and snippets start
  hidden until you reveal them; existing-library refresh keeps its small review
  batches. Live store-page and Windows-app checks are still pending.
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
`v1.7.9` after the Windows acceptance record is complete.
