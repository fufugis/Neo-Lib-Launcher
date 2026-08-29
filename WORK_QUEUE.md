# NEO-LIB active work queue

This is the authoritative live queue. New user requests are appended here and remain open until verified, explicitly cancelled, or blocked with a concrete reason.

## In progress

- [ ] Run desktop interaction checks for the completed v1.7.2 source work in an unrestricted Windows session, including a real itch desktop install fixture.

## Verification and release gates

- [ ] Run desktop interaction tests for the metadata repair queue, genre approval, Home update pane, game-preview update alert, and launcher imports. Blocked here because Chromium cannot create its Windows platform channel under the managed process sandbox (`Access is denied`).
- [ ] Run the normal Vite/Windows package build in an environment that permits child processes. Direct renderer/Tailwind compilation passes; Vite and electron-builder are blocked here at `esbuild` / `app-builder.exe` with `spawn EPERM`.
- [x] Perform a requirement-by-requirement source completion audit against this queue and the v1.7.2 scope.
- [x] Confirm GitHub-facing notes and the in-app changelog match the current source-validated build. Recheck after the external desktop/package gates before recommending push/release.

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
- [x] Launcher filters, Home platform labels, and Settings version display audited for complete v1.7.2 identity/version coverage.
- [x] Single-click-outside dismissal audited across standard and custom modal surfaces.
- [x] GitHub documentation, v1.7.2 scope, `PROGRESS.md`, and in-app changelog updated for the completed source work.

## Explicitly not queued

- Discord friend mirroring and unsafe launcher friend-list scraping were dropped by user decision. Safe native social handoff remains the supported design.
