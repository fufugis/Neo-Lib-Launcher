# NEO-LIB progress

This is the short, human-readable view of the active work. It is updated as features move from idea to verified work.

The authoritative item-by-item status is maintained in [`WORK_QUEUE.md`](WORK_QUEUE.md). Open queue items must not be described as finished or release-ready.

## Release status

- **v1.7.0** — source commit pushed to `main` (`fc65001`). A GitHub Release tag and compiled installer have not been published yet.
- **v1.7.1** — local development batch; not release-ready yet.
- **v1.7.2** — active development batch: Released This Week, safer Steam metadata identity, Home cleanup, and theme cleanup.
- **vNext** — active development batch: Rating System v2, richer launcher metadata, and Home interaction cleanup. The authoritative item-level queue is in [`WORK_QUEUE.md`](WORK_QUEUE.md).

## Completed locally for the next update

- **Optimize Center** — a new bottom-right action beside CPU/RAM opens two animated, theme-aware power-up rows and remembers each tool’s latest result. Speed Up Gaming samples real per-process CPU and memory, shows GPU engine activity and its responsible processes when Windows exposes them, protects critical Windows/NEO-LIB processes, and explains Game Mode, GPU scheduling, recording, power-plan, and restart status with honest pros and trade-offs. Windows settings open in their native page; no hidden tuning is applied.
- **Safe Junk Review** — an on-demand bounded scan checks known Windows temporary/crash locations plus large old archives/installers beside configured games. Every exact file links to its folder and must be individually marked inspected before selection. Two confirmations, including typed authorization, are required; approved files go to the Windows Recycle Bin, never through recursive permanent deletion.
- **Post-play rating prompt** — a session lasting at least fifteen minutes can gently ask for the game’s one-decimal private rating. The player can rate, snooze for another session, or permanently suppress the prompt for that game.
- **Richer Preview news** — preview news now uses an article image when its public feed supplies one, then falls back to the game’s existing hero, background, screenshot, or cover art.
- **GPU setup assistant** — the first desktop launch reads Windows’ ordinary adapter list and adds a Hardware & graphics group in Tools: GPU-Z, CPU-Z, and the detected NVIDIA/AMD/Intel control centre when its local executable is found. If a vendor centre is not installed, the shortcut honestly opens Windows Graphics Settings instead. It never changes drivers, GPU settings, or the registry.
- **Managed GPU-Z / CPU-Z** — missing utilities are muted and say Set up required. Their compact setup menu can validate a manually located executable or, only after the player clicks Install, download from TechPowerUp/CPUID’s official site. GPU-Z is placed as its official portable executable in NEO-LIB’s managed tools area; CPU-Z opens CPUID’s visible installer without silent flags or elevation.

- **Rating System v2 reset** — existing personal ratings are deliberately cleared once on first run of the new system, so old whole-star choices are not silently treated as equivalent to precise decimal ratings. New ratings remain one-decimal values.
- **Fractional star fill** — the preview rating control now fills each star by its actual decimal share: for example, `3.5` displays three full gold stars and one half-filled star, rather than only three whole stars.
- **Battle.net metadata enrichment** — known Battle.net products now use a bounded map to their official public Blizzard/Battle.net product pages before generic sources. This supplies the official title, description, artwork, website, and direct tags without login, account access, or launcher writes; unmapped products still use the normal picker/search path.
- **Provider tag visibility** — Game identity now keeps a compact direct-source tag group in addition to core genres and subgenres, so a game can read as `Action` plus `Third-Person Shooter`, `Action Roguelike`, `Co-op`, and `Multiplayer` rather than collapsing to the broadest label.
- **Home interaction overhaul** — Top 5 Played is a fixed centred Home feature that can still be hidden/restored; Library Health is a dedicated detailed panel; and pane ordering now previews the placement in real time with a glowing active handle, dimmed neighbours, animated layout movement, and an insertion line.
- **Stronger suggestions and Friends** — What should I play? now uses larger cards and states why a game is timely, unplayed, or worth rediscovering. Friends has a larger, more readable, less-transparent theme-aware surface.
- **Independent update discovery** — refreshes now inspect only nearby, bounded Version/Changelog/Readme files for an explicit installed version and compare it to a saved update page or public game website. A game without enough evidence is reported as needing setup rather than incorrectly being called current.
- **Background update intelligence** — version evidence is warmed shortly after library startup and whenever a game is launched. It safely considers launcher manifests, saved metadata, executable/version naming, and bounded nearby Version/Changelog/Readme/Config files, then checks official/public sources in a small parallel queue with a short cache. A verified update blinks in a dedicated Preview bar directly above the news alert.
- **Update checklist** — every conclusive check is saved locally per game as current, pending, available, or needs-evidence. Home and Preview show only real available/pending alerts; a game drops away automatically once its launcher/local version evidence reports it current again.
- **Library precision pass** — the first-game gap now reaches a true compact zero safely, Backdrop headers scale their padding/border with category text size, and a new NEO-LIB window begins at 75% usable width by 90% usable height before later restoring the player’s own bounds.
- **External-launch Rest Mode** — while Rest Mode is enabled, NEO-LIB checks ordinary Windows process paths every ten seconds and rests when one exactly matches a game already in the local library, including games launched from Steam, Battle.net, Epic, and other clients. It never rests merely because a launcher is open, and it performs no injection, overlay, memory inspection, or credential access.
- **Storage Control fix** — scans now ignore non-file launcher targets, measure a shared game-install folder only once, and keep the completed result while moving between Library and Home. The scanner never walks a whole drive: it checks only configured local game folders, with up to three folder walks at once for a quicker result.
- **New Mid theme: Home** — a comfortable light-gray workspace built around sharp black/white structure, light-blue window edges and effects, plus a warm yellow/gray architectural blend pattern.
- **Onboarding refresh** — first run now uses a short, current seven-step guide for importing, Hidden privacy, Home, game controls, customization, hover help, and Rest Mode. A new theme-aware hover-tip layer explains titled controls after one second throughout the launcher.
- **Mid-theme balance** — Generic Gray and Generic Blue now belong to Mid; Generic Blue has a brighter navy/blue palette.

## Completed locally for v1.7.1

- Home **Library Health** card with a colour-coded total score, issue chips, and a direct Tidy Up action.
- Larger Home news cards with Steam artwork when available.
- Home pane arrangement: drag panes into order, hide individual panes, and restore them from the Home header. News opens in-app before offering a Full story link; **My Best Games** shows top ten personal ratings alongside Metacritic where available.
- Missed shell fixes now implemented locally: Friends moves into the bottom of the selected game preview; Coffee sits beside Discord; labelled Settings follows Visuals in Library controls; Refresh/Tidy is grouped with Auto-sort; the sponsored rail is centred, permanent, and no longer contains Coffee or a dismiss action; five-star library frames use theme accents; preview rating reads **My rating** with larger stars.
- Cover art in Home Top 5.
- Game Ready thresholds tuned to yellow at 65% and red at 85%.
- **Rest Mode while gaming** is now on by default for games launched through NEO-LIB: it disables ambient effects, animations, UI sounds, health polling, launcher scans, background news/deal checks, and social refreshes until the tracked game exits. The Game Ready footer clearly shows **NEO-LIB RESTING** and the active game; the feature can be disabled in Settings.
- Library scroll space reserved above the Game Ready footer.
- **Save Game Folder** entry point in both the preview action bar and game right-click menu, with per-game folder selection and open-folder access.
- Safe, local-only **Save Backups**: backup records are stored inside NEO-LIB app data; recovery refuses to overwrite a non-empty live save folder and can create a separately named restored folder instead.
- User-triggered **older save finder** that searches a chosen drive/folder by game-name matches and requires the user to review every candidate.
- Home **What should I play?** card using local play history, ratings, added dates, and already-fetched patch news.
- Home **Storage Control Centre** with an explicit, read-only game/mod folder scan.
- Home **Gaming Chronicle** for local add / play / rating / update events.
- Conservative **Launch Doctor**: only after two immediate failures or very short launches within ten minutes; it checks the configured target and offers nearby executable candidates without changing files automatically.
- Distinct per-theme particle language rather than a shared sparkle look, plus three new Settings chimes (Aurora, Ember, Harbor) and three Visuals textures (Weave, Brushed, Stardust). Brushed replaced the non-seamless Topography tile.
- Visuals control reorganisation: Object sizes, Text & category, FX, and Layout groups; direct icon-position and category-marker sliders; category Backdrop intensity is tied to Category glow and remains translucent at max.
- Follow-up Visuals polish: Category marker `None` now removes both dot and backdrop; Brushed replaced the non-seamless Topography tile; Anime is pink-forward with original manga line art; Pro is renamed Industrial with animated safety-light geometry and metal sparks, without CRT scanlines.
- Library Health now counts all supported description fields and its Review action lists the actual affected games. Save Game Folder now automatically checks bounded, common Windows, game-folder, and Steam Cloud mirror locations; it never changes a save path until the user selects a result.

## Completed locally for v1.7.2

- **Released This Week** Home pane: a selective, rearrangeable release feed that verifies official Steam store dates and only shows full games with meaningful early player, review, or launch-reach signals. It displays artwork, source, date, and an inclusion reason; caches for six hours; supports manual refresh; and opens official store pages without account access.
- **Steam delisted-title safety**: launcher imports now lock metadata to the exact Steam app ID found locally. A missing public Store entry keeps the confirmed manifest title and identity instead of falling through to fuzzy matching.
- Friends correctly lives on the far right of the permanent sponsored rail; Coffee has a high-contrast style for light themes; Tools now uses a utilities icon.
- Theme cleanup: added Special **Generic Gray** and **Generic Blue**; Midnight is moonlit navy/starlight yellow; Industrial uses danger-yellow/neon-orange; Modern is slate-blue with restrained dark red; Daybreak is warm sunrise and Mint remains organic green.
- Home cleanup: compact Library Health blob, distinct **Top 5 played** and chronological Recent Sessions, top-five personal-rating-only My Best Games, decimal rating picker, green New Update motivation, and an expanded scrollable Chronicle.

## Completed locally — Genre Intelligence, Update Intelligence, and launcher adapters

- Canonical 20-genre taxonomy now normalizes core genre, subgenre, playstyle, perspective, and theme profiles separately from personal Library categories.
- Folder-scan Wizard review now previews that detected identity in a green **NEW** panel and persists the direct source tags when a game is accepted; it never creates or changes a Library category.
- Preview pane refinement: genre identity is now a dedicated theme-responsive vertical card; actions have been consolidated beside Launch and game facts are shown as a readable details list.
- Released This Week now uses a clearly-labelled semi-major fallback only if no strict major release qualifies, avoiding a blank Home pane without turning the feed into a release dump.
- The first normalizer is wired to metadata refreshes and local library hydration. It uses exact source-tag aliases (for example, Rogue-like → Roguelike) rather than loose description keyword matching.
- Preview presentation, conservative Auto-sort recommendations, and an approval-first batch review/enrichment flow for existing games are now in place.
- Metadata approval is now shared by refreshes and add-from-match: changed/fresh fields are green and marked **NEW** before the user accepts them.
- Tidy Up now runs a complete approval-first identity repair queue with repaired/skipped progress, a Stop Review control, and local title clues derived from the EXE, nearby folders, and strictly bounded README/title fields.
- Update Intelligence foundation now reads concrete pending Steam download bytes from local manifests and presents them in Home and Game Preview with a safe native Steam Downloads handoff. It performs no launcher writes and does not treat ambiguous state flags as updates.
- Independent-game update watch now accepts an installed version plus a user-chosen public source page in Customize. Explicit higher Version/Build/vX.Y labels surface in Home and Game Preview with a source link; NEO-LIB does not download or install files.
- Independent-game update alerts now open a read-only in-app patch-history timeline with detected dates, multiple explicit version entries, and “After yours” markers before offering the full source link.
- Native GOG import reads installed games from bounded Windows registry records, deduplicates by GOG ID/path, assigns a likely executable, and groups them under a real GOG category.
- EA App/legacy Origin is now a native local import adapter too, using bounded Windows installation records with product/version preservation, executable selection, deduplication, and EA category creation.
- Ubisoft Connect is now a native local import adapter using its installed-game registry, product identity and launch URI preservation, bounded executable discovery, deduplication, and Ubisoft category creation.
- Battle.net is now a native local import adapter based on verified Blizzard Windows installation records, excluding the launcher itself while preserving product/version identity and category grouping.
- Riot is now a native local import adapter based on bounded local product metadata, excluding the client while retaining product/version identity and configured game executables.
- Xbox/Game Pass is now a native local import adapter using bounded XboxGames roots and per-title MicrosoftGame.config data rather than broad Microsoft Store enumeration.
- Rockstar is now a native local import adapter using verified Windows installation records while excluding the launcher, Social Club, and support components.
- Launcher integration audit fixed the first-time detection path and Wizard so every supported adapter keeps its own executable, source, product/version identity, and category instead of falling back to the former Steam/Epic-only route.
- Launcher identity audit expanded the Library filter to all supported clients, corrected the Settings version display, and made Home prefer actual launcher ownership so metadata-only Steam app IDs cannot relabel local/repack games.
- Interaction audit replaced leftover double-click-only backdrops with consistent single-click-outside dismissal across the standard dialogs and custom metadata, Tidy, and changelog surfaces.

## Next up

- **Queued next feature: post-play rating prompt** — after a meaningful completed session, NEO-LIB will gently invite the player to set a decimal personal rating. It will support dismissal/snooze choices and will not repeatedly nag for the same game.
- Run the desktop bug-test pass, then build the Windows installer in a normal Windows/GitHub Actions environment.
- Native itch.io import now reads only the desktop app’s configured install locations and completed-install receipt markers. It deliberately leaves itch’s live `butler.db` catalog alone and sends folder-derived titles through the normal approval-first metadata flow. A real local itch fixture still needs desktop verification.

**Current state:** v1.7.2 is implemented locally and source-validated, including Genre Intelligence, the repair queue, Steam/independent update intelligence, patch history, and the native launcher adapters listed above. It still needs desktop interaction testing and a normal Windows build before release. Discord presence/mirroring remains explicitly dropped.

## Planned research / platform-dependent work

- Official opt-in friend presence options per launcher.
- Launcher Adapter coverage for detection, import, launcher tags, updates, news, and safe native handoff.
- Non-Steam launcher update-state research where clients expose a reliable read-only local signal.
- itch.io catalog/database-level import remains intentionally out of scope: the implemented native importer is bounded to user-configured install locations and completed-install markers, never the live `butler.db` catalog.

## Known release checks

- Electron syntax, direct renderer bundle, Tailwind compilation, and whitespace checks pass.
- The normal Vite build cannot run in this workspace because its restricted process environment blocks esbuild spawning (`spawn EPERM`). This needs a normal Windows/GitHub Actions build before publishing an installer.
- A fresh Electron window also cannot be opened under this managed process sandbox: Chromium stops before app startup with a Windows platform-channel `Access is denied` error. Interaction tests therefore remain a real external validation gate rather than being marked as passed from static inspection.
- Packaging reaches electron-builder but its native `app-builder.exe` child process is blocked by the same environment (`spawn EPERM`). The checked-in Windows GitHub Actions workflow remains the normal packaging path after the changes are pushed.
