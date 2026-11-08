# NEO-LIB v1.8.12 Windows acceptance record

## Build and publication

- [x] Full source gate: native commands have one registration and request/response contracts.
- [x] Production renderer and isolated interaction regressions pass for the final candidate.
- [x] Windows packaging and candidate inspection pass on GitHub.
- [x] All four nonempty assets are published and latest downloads resolve.
- [x] The shipped update checker recognizes v1.8.12 from v1.8.11.

Published 2026-11-08 19:10 UTC / 20:10 Europe/Oslo. [Successful Windows run](https://github.com/fufugis/Neo-Lib-Launcher/actions/runs/42513275365) builds tag v1.8.12 at a985bdd8a3f10cbd34c6c6a7b68eca59bf424d37; candidate ID 2D7BEF3D4FA0. All four assets are nonempty. Downloaded report and checksum manifest agree with GitHub's server-side installer/portable digests and byte counts. Both fixed-name latest download HEAD requests return HTTP 200. The unchanged shipped update checker, called against live GitHub from v1.8.11, reports v1.8.12 available and selects the exact installer.

- Installer: 251789008 bytes; SHA-256 97A1BB15735056DD7C4A48C60CC09630FDEAAC8749C56A762BB974ECFD9A0122.
- Portable ZIP: 284704628 bytes; SHA-256 E7EBF745A34F02A0CCCBDFFF0798F16000146EAC831EDA7240AAB633CC5F8226.
- Package report: 482 archive entries, 80 mascot/voice assets; feedback and Discord configuration verified present.

The complete binaries were not downloaded or executed locally. Server digests and automated package inspection do not replace the installed checks below.

The first unpublished Windows run exposed a check-order dependency: manual-add pointer verification needs built CSS but was also included before Vite. It remains mandatory after compilation, with the prebuild Wizard suite kept independent of generated output. The replacement tag/build will record the corrected source SHA.

The next run passed compilation, app smoke, patch history, live editors, Library maintenance and manual-add checks. Its mascot fixture used an off-display native click on the runner's smaller virtual desktop. The fixture now sizes its window against the available display, derives the right-edge case from the actual viewport and verifies the click target before input; placement, bounds and click-through assertions remain mandatory.

Local full prebuild, production compile (11.13s), compiled-app smoke, patch-history current v1.8.12 selection, in-box editor content, missing-game/reset, manual-add selection, launch mascot and Steam artwork interaction checks pass. Secret boundary and whitespace checks pass. All native interactions use synthetic/temporary profiles; actual installed interaction remains below.

## Installed Windows interaction — pending

- [ ] Control Center gear opens on the first click.
- [ ] Delayed hover text remains entirely inside every screen edge.
- [ ] Upgrade preserves existing Library/settings and opens v1.8.12 notes first.
- [ ] Currently playing name/icon tracks actual game starts and stops, including external launchers.
- [ ] Manual-add row/Use opens metadata review; accept adds the intended game.
- [ ] Missing-game review distinguishes offline drives and locates/removes only chosen entries.
- [ ] On an isolated disposable profile, full reset persists and leaves installed files intact.
- [ ] Home and Library editors reflow real content during physical drag/resize.
- [ ] Steam games prefer square icons/portrait covers while custom choices remain respected.
- [ ] Camo/Ember colours, launch mascot clearance, Tools markers and Carbon scale look right.
- [ ] On a known fully updated installed Steam game, confirm no false update.
- [ ] With a genuine queued or active Steam download, verify status and Open downloads.
- [ ] Installer Finish behavior, real sound, Lounge and controller remain intact.

Automated checks use synthetic/temporary profiles. No real player Library is reset and no installed-game files are deleted during release preparation. Physical installed acceptance remains separate.
