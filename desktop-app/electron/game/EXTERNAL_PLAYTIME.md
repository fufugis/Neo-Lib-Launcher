# External game playtime

While NEO-LIB is open (including the tray or Rest Mode), the existing Windows
process-path monitor also records time for known Library games started from
Steam, Battle.net, Epic and other launchers. It does not install a background
service. Time played while NEO-LIB is completely closed cannot be reconstructed.

## Identification and timing

- Match a saved executable exactly; alternatively match a playable executable
  under the game's explicit install folder. More-specific folders win. Drive
  roots and generic shared install folders are not fallback game identities.
- Reject launchers, helpers, updaters and crash reporters. One process belongs
  to one Library game. Native-tracked games and their duplicate paths are
  excluded. Steam URI launches are observed through the real game process.
- The existing cadence remains 30 seconds idle / 8 seconds active. Initial
  credit is bounded to the monitor's current lifetime and at most 30 seconds of
  process age. Process-query failures are unknown state, not proof of exit.
- Only short confirmed observations accrue time. Sleep, failed-query gaps and
  long stalled-clock intervals do not. PC suspend and app quit flush known time.
- Manual tracking remains excluded from automatic hours. Emulator apps, ROMs
  sharing an emulator process, and Tools are not inferred as external sessions.
  ROM launches through NEO-LIB keep their existing per-ROM tracking.

## Storage and recovery

Every minute, and on exit/suspend/quit, native code emits a cumulative snapshot.
`external-session-journal.cjs` saves up to 64 recent snapshots to the app's own
`external-playtime.json` before notifying the renderer. It uses a temporary
write/rename and a `.bak` fallback. No process inventory, game title or executable
path is stored in this journal or uploaded to a server. Disk errors remain local;
unwritten snapshots are retried, but inaccessible storage cannot guarantee recovery.

The renderer saves total minutes, last-played time, dated minutes and bounded
session receipts in the ordinary Library document. Duplicate checkpoints and
replayed final snapshots are idempotent. Per-page delivery revisions prevent
library saves from triggering a replay loop. Absolute Steam imports reconcile
against anchored totals instead of adding the same minutes again; stale imports
cannot lower externally observed totals. Explicit reset/manual replacement sets
a reset epoch so old journal entries cannot resurrect cleared hours.

## Verification boundary

`npm run test:game-watch` exercises deterministic process, clock and disk fixtures.
`node scripts/verify-external-playtime-browser.cjs` tests the actual React
subscription/store path, Library and statistics output, dated minutes, saving,
reload receipts, native-event compatibility and listener cleanup in isolated
Electron. Neither fixture launches a game or reads the user's process inventory.
Actual installed Overwatch/other-game process identity, permissions and elapsed
time still need a real Windows gameplay check. Detection cannot see an executable
that Windows withholds, and cannot identify an unknown or moved game path.
