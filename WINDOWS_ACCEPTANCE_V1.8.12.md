# NEO-LIB v1.8.12 Windows acceptance record

## Build and publication

- [x] Full source gate: native commands have one registration and request/response contracts.
- [x] Production renderer and isolated interaction regressions pass for the final candidate.
- [ ] Windows packaging and candidate inspection pass on GitHub.
- [ ] All four nonempty assets are published and latest downloads resolve.
- [ ] The shipped update checker recognizes v1.8.12 from v1.8.11.

Publication and package evidence will be recorded after the tagged build completes.

The first unpublished Windows run exposed a check-order dependency: manual-add pointer verification needs built CSS but was also included before Vite. It remains mandatory after compilation, with the prebuild Wizard suite kept independent of generated output. The replacement tag/build will record the corrected source SHA.

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
