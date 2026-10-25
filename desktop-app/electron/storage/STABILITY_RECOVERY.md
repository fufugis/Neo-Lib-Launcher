# Stability and recovery boundaries

## Missing or unreadable files

Both asynchronous document loading and synchronous settings snapshots check the
`.bak` file when a primary is missing or unreadable. A fresh-install fallback is
writable only when both copies are missing. A missing primary with an invalid,
inaccessible or newer backup is protected against overwriting, not silently
treated as an empty new library. Saving before loading cannot overwrite the only
surviving backup. Existing newer-primary-schema protection remains unchanged.

Recovery loads a valid backup in memory. A subsequent successful save repairs the
primary without replacing that known-good backup with missing/corrupt evidence.
Unrecoverable reads or deferred migrations expose a bounded state flag through
the existing load response so the main UI explains that recovery is required.
No new IPC route or background service is introduced.

## Legacy records and metadata

`src/state/record-safety.mjs` normalizes known list/text fields and rejects unsafe
row identities while preserving unrelated fields. Common legacy forms such as
a single developer string, labelled genre objects or a date object with a text
`date` are repaired explicitly. Invalid categories, duplicate rows and uncertain
privacy memberships are isolated rather than breaking healthy entries or
publishing a formerly private game as public. Duplicate private-category IDs
remain private. Valid canonical genre profiles and their grouped traits survive.

Original data remains local in the normal Library document:

- `recordRecovery`: original repaired fields beside the usable record;
- `libraryRecovery`: original isolated rows, collection name and index;
- `libraryFieldRecovery`: original malformed ordering fields.

Normal save/reopen and explicit Library backup preserve these originals. The UI
explains repairs and offers backup export. There is intentionally no automatic
deletion of recovery data or unreviewed reactivation of quarantined rows. Backup
files can contain private names, paths and protected-category information: do
not post them publicly or attach them automatically to feedback.

The native metadata boundary also normalizes provider lists and dates before
response validation. Game preview and artwork refresh defensively normalize old
records as well. This is not fuzzy identity matching and does not invent missing
game facts, artwork or playtime.

## Visible save acknowledgement

Renderer persistence checks for an explicit `true` response. Rejection and
resolved `false` retain the in-memory snapshot and show a persistent warning,
with Retry saving and optional Library backup export. Retry uses the newest
snapshot; stale asynchronous responses cannot clear a newer error. Settings use
the same acknowledgement path. Initial hydration is gated, including React
StrictMode replay, so loading placeholders are not written to storage.

Keep the app open while resolving an unsaved warning. This does not claim that
in-memory edits survive force-killing the process or inaccessible storage.

## Failure containment and tests

An unexpected game-preview render error is caught inside that preview. Home,
Library navigation and Settings remain available; Retry preview or Edit game is
offered instead of replacing the app with a startup-failure screen.

`npm run test:storage` includes deterministic missing/corrupt/newer backup and
write-failure tests, malformed metadata/library cases and an isolated actual React
fixture. `npm run test:stability:production` runs the compiled app with its real
isolated preload and synthetic native services: malformed-data startup, Library
selection, game preview, checkpoint persistence, visible failed-save warning and
retry. Network is blocked and no user app data or game executable is accessed.
The latter requires a completed renderer build and does not claim installed
Windows filesystem/gameplay acceptance.

The pure hardening suite additionally exercises actual atomic JSON writes,
backup-only recovery, retained private/category data and restart from a newly
created temporary profile on disk; it never opens the real installed profile.
