# NEO-LIB Library Experience programme

This programme turns several familiar launcher ideas into one coherent NEO-LIB
system. We use common interaction patterns, but the language, appearance,
privacy rules, review flow and implementation remain NEO-LIB's own.

## Product language

| NEO-LIB name | Purpose |
| --- | --- |
| **Journey Status** | The player's personal relationship with a game: Not started, Backlog, In progress, On hold, Finished, Mastered or Dropped. |
| **Launch Routes** | A bounded list of explicit Play and utility destinations for one game. |
| **Wall Peek** | A temporary right-side overlay opened from Wall without leaving or squeezing the collection. |
| **Game Signals** | Compact evidence-led icons for capabilities, content and local-library facts. |
| **Artwork Workshop** | Compare, protect, replace and restore each artwork slot. |
| **Collection Mode** | Deliberate multi-select with a review step before bulk changes. |
| **Retro Profiles** | Player-owned emulator, platform, ROM folder and launch-profile configuration. |

## Existing foundation audit

NEO-LIB already has substantial pieces that must be reused rather than rebuilt:

- **Edit Metadata** already owns name, icon, cover, hero, background,
  descriptions, genres, developer/publisher, release date, website, installed
  version, update-watch page, score, screenshots, executable and launch args.
- **Preview actions** already include guarded Play, YouTube, patch notes, mods
  discovery, Customize, reviewed metadata refresh, folder reveal, save-game
  management and category assignment.
- **Game Signals groundwork** already supports source-declared single-player,
  multiplayer, co-op, PvP, full/partial controller, achievements, cloud saves,
  Workshop and Remote Play. NSFW/content signals do not yet have an explicit
  player/provider field and must never be guessed from description text.
- **Artwork review** already protects manual choices during reviewed metadata
  refreshes, but it has no side-by-side slot comparison, resolution/source
  panel, lock matrix or bounded restore history.
- **Bulk groundwork** exists in Tidy, Auto-sort and category maintenance, but
  Library/Wall do not yet have a general player-controlled selection mode.
- **Emulation groundwork** already normalizes ROM names/extensions, creates a
  dedicated category and safely quotes a player-selected ROM path. There is no
  profile manager, bounded native scanner or import-review UI yet.

## Shared data contracts — prepared

These source-only contracts are deliberately inert until their interfaces are
built:

1. `game-journey-model.mjs` owns valid Journey Status values and the safe
   first-launch transition. It never overwrites Finished, Mastered, On hold or
   Dropped.
2. `game-launch-routes-model.mjs` owns up to twelve named Play/utility routes,
   one enabled primary route and separate target/argument fields. It does not
   execute commands or scripts.
3. `wall-columns-model.mjs` owns known Detailed Wall columns, order, visibility
   and bounded widths. Game identity is always retained.
4. `artwork-revision-model.mjs` owns the five artwork slots, explicit locks and
   a bounded eight-change restore history. It stores references and provenance,
   not duplicate image payloads.
5. `game-signals-model.mjs` provides one extensible signal registry across
   Preview and Wall Peek. Feature signals reuse direct capability evidence;
   sensitive content signals require an exact stored flag and are never mined
   from prose, paths, art or AI output.

## Delivery order

### Stage 1 — Game Workshop

Replace the long Edit Metadata form with clear tabs:

- **Overview:** title, description, identity and public facts.
- **Artwork:** current icon, cover, hero, background, logo and entry to Artwork
  Workshop.
- **Play & routes:** primary executable plus alternate Launch Routes such as
  DX11/DX12, configuration, benchmark, mods, saves and emulator profiles.
- **Library:** Journey Status, categories, favorite, privacy/content flags and
  player notes.
- **Signals:** explicit capability/content facts with their evidence source.
- **Advanced:** installed version, update page and carefully labelled launch
  arguments.

The existing right-click **Details / edit cover** action becomes **Edit game**.
Rename and launch-argument shortcuts may remain for speed, but both open the
same source of truth.

### Stage 2 — Wall Peek and Game Signals

- Clicking a Wall game selects it and opens a floating right-edge overlay; it
  does not navigate to full Preview and does not resize the cover grid.
- Close with X, Escape, a second click on the selected game, or a click on the
  uncovered Wall backdrop. Clicking another game replaces the overlay content.
- Wall Peek shows compact metadata, two or three screenshots, playtime/status,
  source and Game Signals. It exposes **Open full Preview** and guarded **Play**.
- Game Signals use one consistent icon vocabulary across Wall Peek and full
  Preview. Content signals such as Adult/NSFW appear only from an explicit
  player choice or labelled provider evidence and remain covered by private
  category rules.

### Stage 3 — Detailed Wall layouts

- Column headers sort on click and clearly show direction.
- A header menu hides/shows columns; drag reorders and a bounded handle resizes.
- Layouts are saved by name and can be restored to NEO-LIB defaults.
- The mandatory Game column can move only within the leading identity area and
  cannot be hidden, preventing an unusable table.

### Stage 4 — Artwork Workshop

- Compare Current and Suggested assets per slot: Icon, Cover, Hero, Background
  and Logo.
- Show source, dimensions and aspect ratio when direct evidence is available.
- Each slot has **Protect mine**, **Use this**, **Clear** and **Restore**.
- Restore uses the bounded local revision history. Online suggestions still
  pass through explicit review; no automatic search silently replaces art.
- External catalogues remain opt-in and use player-owned credentials where
  required.

### Stage 5 — Collection Mode

- A deliberate **Select games** action enables checkboxes without changing
  ordinary click behavior.
- Actions: categories, favorite, Journey Status, reviewed metadata refresh,
  Artwork Workshop queue, hide/private and future external-root assignment.
- Every destructive or identity-changing operation shows count, scope and a
  confirmation summary. Partial failures remain visible and retryable.

### Stage 6 — Retro Profiles

- Profile fields: emulator executable, supported platforms/extensions, ROM
  folder, argument template, working directory and tracking method.
- A bounded player-triggered scan returns a review list before creating games.
- Presets are versioned and reviewed; Custom remains available for documented
  command lines.
- NEO-LIB never bundles, downloads or searches for ROMs, BIOS files or emulator
  executables. Existing launch authorization remains mandatory.

## Non-goals and safety boundaries

- No unrestricted before/during/after scripts. Useful common actions receive
  typed Launch Routes first; scripting requires a later sandbox design.
- No capability or Adult/NSFW inference from prose or AI summaries.
- No silent bulk metadata/artwork replacement.
- No command strings combining executable and arguments.
- No ROM, BIOS or emulator distribution.
- No plugin receives filesystem/process access merely because it can add a
  button to Game Workshop or Wall Peek.

## Acceptance order

Each stage requires pure model checks, renderer binding/boundary checks and the
complete source gate. Wall Peek, column drag/resize, artwork comparison,
multi-select and emulator launching additionally require rebuilt Windows
mouse/keyboard/privacy acceptance before they can be called complete.
