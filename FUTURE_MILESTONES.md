# NEO-LIB future milestones

This is the compact product sequence after the architecture source restructure.
Detailed item status remains in [`WORK_QUEUE.md`](WORK_QUEUE.md); the Windows
acceptance procedure remains in [`RELEASE_HARDENING.md`](RELEASE_HARDENING.md).

## M0 — accept and close the current architecture

Rebuild the current source, then finish the already-recorded installed checks:
startup/restart/tray, build identity, CPU comparison, launcher Wizard, FiFi,
controller-free mouse/keyboard behavior, private redaction, visual/popup behavior,
operation cancellation/diagnostics, clean/upgrade migration and performance. Fix
only evidence-backed failures. When these pass, close Stages 0–9 and make the
reviewed architecture commit.

## M1 — Controller Center

Implement the C1 device panel from
[`CONTROLLER_EXPERIENCE_MILESTONES.md`](CONTROLLER_EXPERIENCE_MILESTONES.md):
connected-pad discovery, preferred selection, input test, honest capability labels
and a hand-off to Windows for pairing/removal. Keep detection idle while closed.

## M2 — shared controller navigation

Add semantic focus movement and actions across the existing launcher without
changing page business logic. Prove modal, text input, held-button, reconnect,
private-lock and launch safety before adding fullscreen.

## M3 — Minimalistic interface

Add the second main interface mode as a reversible presentation policy over the
same library/actions. Retain every theme and advanced feature; reveal secondary
controls when asked instead of deleting them.

## M4 — NEO Lounge fullscreen

Build the opt-in distance/controller experience on the proven semantic navigation
layer. It receives a distinct NEO-LIB identity rather than copying another launcher:
session memory, update awareness, mascot guidance, private shielding and low-use
launch/resume are first-class parts of the flow.

## M5 — optional connected intelligence

Revisit only with explicit product approval:

- Mascot web research with opt-in, player-owned credentials, visible sources,
  rate limits and a local-only fallback.
- Optional IGDB / TheGamesDB / SteamGridDB provider cards with attribution,
  local credential storage and confidence-ranked review before applying data.
- Official launcher presence/account integrations only where their supported API
  and privacy model are clear. Local-manifest support remains the default.

## M6 — release polish and distribution

Measure lounge/desktop idle cost, finish controller glyph and accessibility work,
run clean/upgrade tests, package installer plus portable output, review diagnostics,
commit, push and publish only the build whose visible Build ID matches source.

## Items found during the missing-feature audit

- FiFi live selection and her separate 27-line voice pool are now source-complete;
  installed visual/listening acceptance remains in M0.
- The post-play decimal rating prompt was already implemented; an old “queued”
  progress note was stale and has been corrected.
- The local-midnight playtime range bug is repaired and regression-tested.
- Remaining historical visual/launcher requests are implemented in source but need
  M0 acceptance; they are not silently being counted as finished.
