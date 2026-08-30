# NEO-LIB active work queue

This is the authoritative live queue. New user requests are appended here and remain open until verified, explicitly cancelled, or blocked with a concrete reason.

## In progress

- [x] vNext ratings migration: reset all stored personal ratings for the new decimal rating system, then render dynamically filled fractional stars.
- [x] v1.7.3 test-fix: detect Store-installed NVIDIA Control Panel/NVIDIA App through Windows Start-app registration and replace an earlier managed Windows Graphics Settings fallback on the next launch.
- [x] v1.7.3 test-fix: darken the Mid Home theme into a more comfortable gray workspace and make Category Backdrop padding track the category text closely.
- [x] v1.7.3 test-fix: correct Update Intelligence so missing version evidence is never recorded as current; add bounded Battle.net `.build.info` detection and automatic official/web source discovery before any manual page setup is suggested.
- [x] v1.7.3 test-fix: stop Safe Junk Review from retriggering its scan after rendering results, and reduce low-value background monitoring cadence (system health 15s; external executable-path check 30s).
- [x] v1.7.3 test-fix: enlarge Home’s visual hierarchy and reserve a control gutter so Home drag/hide buttons cannot overlap pane headings.
- [x] v1.7.3 test-fix: audit and consolidate Gemini metadata fallback onto one current model and output contract; show real failure feedback and add an explicit Settings connection test.
- [x] v1.7.3 icon refresh: rebuild the supplied neon power artwork as a multi-size Windows icon for the app, EXE, taskbar, installer, desktop and Start shortcuts; assign the matching stable Windows app identity; safely notify Explorer after upgrade without clearing a cache/pins/data; and package a dedicated transparent tray mark for installed or development assets.
- [x] v1.7.3 Fungist core: add an optional, static-by-default event-driven companion with a local transparent asset; small attention bubble for favourite news, verified favourite updates, ordinary NEO-LIB updates, and yellow PC status; centre-flight only for red PC status; a tutorial introduction; Rest Mode silence; no duplicate system polling; and explicit-send Gemini chat with no automatic PC/library/account data attachment.
- [x] v1.7.3 Fungist life pass: add compact stand, blink, fly-with-neon-trails, and completion poses; low-impact docked motion and sparse true pose swaps; six controlled synthesized sound cues (Good Ding, Hey, Welcome, Warning, Attention, Completed Ding); and sound-pack/UI-sound/Rest Mode safeguards.
- [x] v1.7.3 Fungist FX + expression pass: add smile, shocked, and sleep poses; subtle medium-activity sparkles; green/yellow/red status glows; and an outward heavy-alert firework treatment around the centre-flight event.
- [x] v1.7.3 Fungist reactive behaviour + controls: make health/news/update/completion/idle reactions independently switchable, reset PC alerts after real recovery, and add a visible current-AI-model selector backed by a safe model allow-list for Fungist chat and AI metadata work.
- [x] v1.7.3 Fungist attention hygiene: add per-type cooldowns, a persistent bounded Inbox and Quick Settings on right-click, a “Why am I seeing this?” explanation for live alerts, and action-labelled completion feedback.

## Queued — next update

- [x] Onboarding refresh: replace the first-run tutorial with a short, current walkthrough of importing games, privacy/Hidden, Home, game Preview/Customize, and Rest Mode; keep it skippable and practical.
- [x] Unified hover tips: add a shared delayed (one-second) tooltip treatment and apply clear descriptions across the primary launcher controls, actions, Home panes, and important status indicators.
- [x] Preview news imagery: enrich the in-library game news bar with each article’s own image when safely available; otherwise use the selected game’s existing hero, cover, or screenshot as a local visual fallback. Preserve a clean text-only layout only when no suitable artwork exists.
- [x] New Mid theme — Home: a calm light-gray workspace with crisp black/white structure, light-blue edges and FX, and a warm-yellow/gray comfort blend pattern.
- [x] Storage Control bugfix: ignore non-file launcher targets, deduplicate shared install folders so identical disk sizes are not repeated, keep completed results when returning to Home, and speed up folder-only scans with a small bounded parallel pass.
- [x] Automatic Rest Mode for externally launched library games: safely monitor ordinary Windows process paths and enter Rest Mode when a running executable matches a NEO-LIB library game, even when started from its original launcher; never rest just because a launcher is open.
- [x] Library compact spacing: make the gap between the Library header and first game reduce cleanly at the minimum spacing slider value, while preserving collision-safe spacing with all text/row-size slider combinations.
- [x] Category backdrop scaling: make the category Backdrop option scale proportionally with category text size, including its padding/radius/glow relationship.
- [x] First-launch window geometry: default the width to 75% of the usable display and height to 90%, while retaining a user-resized/restored window on later launches.
- [x] Update status ledger: persist a read-only per-game latest-version check result so known-current games are actively filtered out of Preview and Home update surfaces; retain only verified available/pending updates and explicit insufficient-evidence guidance.
- [x] Background update intelligence: on library startup and after a game launch, inspect every eligible game through layered, bounded local version evidence (launcher manifest, saved version, executable/folder naming, version/changelog/readme/config files), then compare only against its official/public update source. Show a clear blinking update bar above Preview news when a verified newer version exists.
- [x] Post-play rating prompt: after a meaningful completed play session, gently invite the player to give the game a decimal personal rating; respect dismissal/snooze choices and never repeatedly nag for the same game.
- [x] Optimize Center: add an **Optimize** entry beside the CPU/RAM footer that opens a theme-aware power-up dashboard with two action rows and persistent last-run summaries.
- [x] Speed Up Gaming: provide an on-demand view of the top five CPU and memory consumers, safe confirmed closing of non-protected programs, GPU activity/process attribution when Windows exposes it, and clearly explained Windows gaming settings (Game Mode, GPU scheduling, power plan, capture/background recording, and other worthwhile checks) with honest pros/cons and safe actions.
- [x] Safe Junk Review: scan bounded cache/log/crash-report locations plus likely leftover installers and archives near configured game folders; show every result with an open-folder action, require physical inspection guidance and two confirmations before deletion, protect live game/save/application folders, and summarize reclaimed space without claiming unverified savings.
- [x] GPU setup assistant: on first desktop launch, identify the installed GPU(s), add a native vendor control-center shortcut when available (with Windows Graphics Settings as an honest fallback), and add managed GPU-Z / CPU-Z utilities to Tools.
- [x] Managed GPU-Z / CPU-Z tools: render missing utilities as clearly unavailable, offer a compact Locate-or-Install menu, validate a manually located executable, and download only from the official TechPowerUp/CPUID sources after explicit user action. GPU-Z will be installed as its official portable executable; CPU-Z will open its official interactive installer rather than use a hidden or silent install.
- [x] Battle.net metadata enrichment: use reliable local Battle.net identity clues before the normal public metadata sources so installed Blizzard games receive correct artwork and descriptions.
- [x] Friends Hub polish: make the panel slightly larger, increase text size slightly, and reduce transparency slightly.
- [x] Theme taxonomy and balance: move Generic Gray and Generic Blue from Special to Mid; make Generic Blue visibly lighter.
- [x] Genre intelligence: retain specific provider tags such as Third-Person Shooter, Action Roguelike, Co-op, and Multiplayer alongside the core genre instead of reducing games such as Risk of Rain 2 to only Action.
- [x] What should I play?: increase the pane/card scale and add clearer, richer personal reasons to play each recommendation.
- [x] Independent/repack update intelligence: investigate why older non-launcher games do not surface after Refresh; fix the scan timing/evidence path so explicit installed-vs-latest information is checked safely without claiming unsupported launcher data.
- [x] Home Top 5 Played redesign: promote it into its own centered top pane; keep hide/restore, but lock it against Home reordering.
- [x] Home reordering redesign: replace the current drag interaction with a modern live-reorder experience—active glow, dimmed peers, animated movement before drop, and a visible insertion indicator.
- [x] Library Health redesign: remove it from This Week, restore it as its own Home pane, and add useful health detail beyond the headline score.
- [x] After source work: run full source audit, update GitHub/in-app patch notes and progress, then perform desktop and package validation gates.

## Deferred verification for v1.7.3

- [ ] Run desktop interaction checks for the completed v1.7.3 source work in an unrestricted Windows session, including a real itch desktop install fixture.

## Verification and release gates

- [ ] Run desktop interaction tests for the metadata repair queue, genre approval, Home update pane, game-preview update alert, and launcher imports. Blocked here because Chromium cannot create its Windows platform channel under the managed process sandbox (`Access is denied`).
- [ ] Run the normal Vite/Windows package build in an environment that permits child processes. Direct renderer/Tailwind compilation passes; Vite and electron-builder are blocked here at `esbuild` / `app-builder.exe` with `spawn EPERM`.
- [x] Perform a requirement-by-requirement source completion audit against this queue and the carried-forward v1.7.2 scope.
- [x] Confirm GitHub-facing notes and the in-app changelog match the v1.7.3 source-validated build. Recheck after the external desktop/package gates before recommending push/release.

## Blocked — required evidence/dependency

- [ ] No code blocker. A real local itch desktop install is still needed to validate the new receipt-marker importer end-to-end. Catalog-level itch account/library access remains intentionally out of scope rather than opening the client’s live database.

## Completed and source-validated in the current batch

- [x] Approval-first metadata/genre repair queue with repaired/skipped progress and Stop Review.
- [x] Local title clues from executable, nearby folders, and bounded README/title fields.
- [x] Steam pending-download detection from local launcher manifests, shown in Home and Game Preview.
- [x] Independent-game installed-version/update-page watching with explicit version-label checks.
- [x] Multi-entry independent-game patch-history extraction and an in-app read-only history view.
- [x] Native GOG installed-game import and launcher category.
- [x] Native EA App/legacy Origin installed-game import and launcher category.
- [x] Native Ubisoft Connect installed-game import, launcher identity, native launch URI, and category.
- [x] Native Battle.net installed-game import from verified Blizzard Windows installation records.
- [x] Native Riot installed-game import from bounded local product metadata.
- [x] Native Xbox/Game Pass import from bounded XboxGames roots and per-game MicrosoftGame.config files.
- [x] Native Rockstar installed-game import from verified Windows installation records, excluding launcher/support components.
- [x] Safe native itch.io installed-game import from the desktop app's explicitly configured install locations and completed-install receipt markers, without database/account access or broad folder scanning.
- [x] First-time launcher detection and Wizard routes audited so all supported adapters preserve their executable and launcher-specific identity.
- [x] Launcher filters, Home platform labels, and Settings version display audited for complete v1.7.3 identity/version coverage.
- [x] Single-click-outside dismissal audited across standard and custom modal surfaces.
- [x] GitHub documentation, carried-forward v1.7.2 scope, `PROGRESS.md`, and in-app changelog updated for the v1.7.3 source work.

## Explicitly not queued

- Discord friend mirroring and unsafe launcher friend-list scraping were dropped by user decision. Safe native social handoff remains the supported design.
