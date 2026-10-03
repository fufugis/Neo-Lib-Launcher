# NEO-LIB v1.8.4 Windows acceptance record

This candidate is a versioned rebuild of the current source. Automated source
checks do not replace installed-app verification. All Windows interaction checks
remain pending until performed against the v1.8.4 installer.

## Candidate identity

- [ ] Build the installer from the current source and verify Settings shows version `1.8.4`.
- [ ] Record the installer SHA-256 and Build ID.
- [ ] Confirm the release candidate inspector reports version `1.8.4` and the expected renderer provenance.

## Automated gate

- [ ] The complete `prebuild:renderer` suite passes for v1.8.4.
- [ ] 108 native commands have one registration and request/response contracts.

## Windows interaction

- [ ] Fresh launch opens without the logo intro or CRT flash and restores the saved sidebar/theme/layout without rearrangement.
- [ ] Record a fresh production launch; identify LCP load/decode/render delays and remaining CLS source elements. Earlier 12.19s LCP/0.27 CLS results are not accepted as fixed by source checks.
- [ ] Hold rapid carousel scrolling for at least eight seconds; check flashing scenery strips, card jitter, missed input and freezes with all FX enabled.
- [ ] Open/close Home and menus repeatedly while scrolling; record frame times and input delays separately from GPU-overlay FPS.
- [ ] Import a JPG from Themes after a full app restart; verify display, lighting preparation and reuse after restart.
- [ ] Check widget zoom/height/vertical travel, hero travel, carousel titles/glow edges, emulator wheel scrolling and controller focus with real hardware.
- [ ] Verify production has no development timing overlay or F8/F9 test shortcuts.

- [ ] Control Center gear opens on the first click.
- [ ] Delayed hover text remains entirely inside every screen edge.
- [ ] On a known fully updated installed Steam game, confirm update discovery does not claim an update is available.
- [ ] With a genuine queued or active Steam download, confirm the game update status is reported accurately.
- [ ] Open downloads and verify the action opens the expected Steam downloads view.

For every failure, record version, Build ID, exact steps, expected and actual
results, and a screenshot. Crashes, private-game exposure and accidental game
launches are release blockers.
