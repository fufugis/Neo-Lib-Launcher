# Local storage ownership

This folder is the only owner of NEO-LIB's app-data locations and persisted JSON
rules. It does not know about React, Electron IPC, launcher detection or metadata.

## Layers

- `app-storage.cjs` owns `%APPDATA%`/Electron `userData` paths, required folders,
  raw JSON/text operations and atomic `.tmp` then rename writes.
- `document-store.cjs` owns document shape checks, schema versions, migrations,
  last-known-good backups, recovery and per-document write queues.

The modules use explicit injected dependencies so tests can use a virtual Windows
drive. Importing or constructing either module performs no filesystem operation.

## Documents

All documents are ordinary JSON objects. Unknown fields are retained by the
storage layer so newer metadata and user customization are not silently removed.

### `library.json`

Owns games, categories, category ordering, Tools and Tool categories. Arrays and
order maps are checked when present. Game/category contents remain extensible;
private-category, PIN, manual metadata and future fields are preserved rather than
allowlisted away.

### `settings.json`

Owns renderer preferences, window bounds, Home layout, theme/visual settings,
update state, AI configuration and mascot preferences. It must be an object, not
an array or primitive. Unknown settings remain intact.

This file and its `.bak` may contain a Gemini or SteamGridDB API key if the player saved one in
NEO-LIB. Backups remain local beside the original file and must never be attached
to feedback or diagnostics automatically.

### `playtime-history.json`

Owns daily Steam lifetime-minute snapshots under `byAppid` and
`lastSnapshotAt`. Arbitrary app IDs and ISO day keys remain intact.

### Other owned paths

`covers/`, `save-backups/`, `managed-tools/`, `diagnostics/`, `launch-safety.json` and
the retained launch-safety state receive their locations and low-level operations from
`app-storage.cjs`. Save-game backups are not document-store JSON and retain their
existing dedicated safety checks in `main.js` for now.

## Schema and migration

Current document schema: **1**, recorded as `_neoLibSchemaVersion`.

Files without this field are legacy schema 0. On first document load, NEO-LIB:

1. parses and structurally validates the complete document;
2. copies the original to `<filename>.bak`;
3. adds schema 1 while preserving all fields;
4. atomically writes the migrated primary file.

The library migration additionally supplies an empty `games` array only when the
legacy object omitted it. It does not alter existing games or categories.

If backup creation or the atomic migration fails, NEO-LIB continues using the
successfully read data in memory and blocks writes to that document for the
session. This prevents an automatic save from destroying the only readable copy.

## Save and recovery policy

- Saves are validated before touching disk.
- Saves for the same document are serialized in requested order.
- Before replacing a valid primary file, its complete prior contents become the
  single last-known-good `<filename>.bak`.
- Missing files use conservative first-run defaults and may be created normally.
- A corrupt primary may load its valid `.bak`; the corrupt primary is left in
  place as evidence until a later valid save repairs it.
- If neither primary nor backup is valid, conservative defaults are returned and
  writes are blocked for that session. The unreadable file is not erased.
- A schema newer than this app understands is never downgraded or overwritten,
  even if an older `.bak` exists.
- Window-bound patches share the normal settings queue, so moving the window
  cannot race and overwrite a renderer settings save.

## Tests and limits

Run `npm run test:storage`. The suite uses only a virtual app-data filesystem and
covers legacy migration, exact backup ordering, unknown/private-field retention,
malformed recovery, unsupported future versions, invalid-save rejection,
concurrent saves, settings patches, playtime, and simulated copy/write/rename
failures. The low-level test also compares paths, fallbacks, formatting and atomic
I/O order with the pre-extraction baseline.

These tests do not replace a packaged Windows restart test. Before release, use a
disposable copy of real app data and verify migration, restart, normal edits,
private categories, window position, playtime history and rollback. Never test
migration first against the user's only live library.
