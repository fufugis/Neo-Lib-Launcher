# Launcher detection boundary — architecture step 1

This is a behaviour-preserving extraction, not a replacement detection engine.
`scanners.cjs` owns installed-game scanning for Steam, Epic, GOG, EA, Ubisoft,
Battle.net, Riot, Xbox, Rockstar and itch.io. It returns the existing
`launcher:scan-*` handler map; `main.js` retains Electron IPC registration.

## Explicit dependencies

The factory receives filesystem/path access, process environment, registry-process
spawning, executable filtering, Steam manifest helpers and Blizzard identity
matching. Creating the factory only creates handlers; it does not scan or start
processes. There is no Electron import or library persistence in the module.

Steam helpers remain in `main.js` because update detection, save discovery and
playtime also use them. Blizzard product matching and executable filtering likewise
remain shared. Passing the original functions preserves their closures and avoids
copying independent versions that might drift.

The UI, preload API, channel names, result fields, error messages, scan order,
executable heuristics and limits remain unchanged. No saved-data migration,
automatic launch, metadata refresh, new account access or new permissions are added.

## Verification

Run `npm run test:launchers` from `desktop-app`. These tests also run through
`prebuild:renderer`, including the existing Windows build workflow.

- The baseline in `scripts/fixtures/launcher-scanners-baseline.json` was captured
  before extraction from the unmodified `main.js` at commit
  `45c3893c63558de71185096935d5ac3d1060662a` using
  `verify-launcher-scanners.cjs --capture-before-move`.
- Forty scanner runs cover installed games, absent launchers, malformed input and
  read/registry failures. Results and ordered I/O traces match the original code.
- Handler and shared-helper fingerprints guard the mechanical extraction.
- Ten further scans execute handlers registered by the entire `main.js` inside
  an isolated VM, exercising real module loading and shared closures. All 81
  original IPC endpoints register without duplicates. Electron readiness is
  withheld: this does not test window creation or the renderer.
- Existing renderer import tests check category creation, deduplication, timeout
  handling and preservation of existing games. Launch safety and metadata-refresh
  tests were also run separately and passed.
- All files/processes in scanner tests are fixtures. No real launcher, registry,
  game executable or library is accessed. Tests confirm the existing packaging
  glob includes the new module; they do not replace an actual package build.

The capture option deliberately refuses to run after extraction. Future deliberate
behaviour changes must review fixtures and expected results rather than blindly
regenerating a baseline. Fingerprints are parity guards for this extraction, not
a prohibition on subsequent, separately tested improvements.

## Acceptance still required

The renderer build was attempted here but failed before bundling when its helper
could not start (`spawn EPERM`). A normal Windows development/build environment
must complete the build and smoke-test startup, the launcher wizard, confirmation,
import into a disposable library, refresh, and ordinary game launching before a
release is called verified. This change does not overwrite an installed EXE.

## Deliberately deferred

Existing synchronous filesystem scanning and the registry subprocess's missing
native deadline are preserved. This extraction alone does not resolve reported
wizard hangs or expand launcher discovery. Those changes can now be tested at this
boundary separately. Metadata services, persistence and app lifecycle remain in
`main.js`; migrating them is later work, not part of this step.

To undo this step, reverse only the scanner extraction, its tests/build hook and
associated documentation. Do not reset unrelated work or touch user libraries.
