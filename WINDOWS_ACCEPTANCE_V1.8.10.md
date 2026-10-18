# NEO-LIB v1.8.10 Windows acceptance record

## Build and publication

- [x] Screenshot bundle filenames match the successful shipped v1.8.9 build.
- [x] Actual Wizard Folder scan → mock folder picker/scan → metadata review reproduces the exact undefined-map crash before the fix.
- [x] After the fix, populated/empty/absent metadata reach explicit Accept and Wizard complete; no pre-Accept import or real folder/library write.
- [x] Full source gate; native commands have one registration and request/response contracts. Includes both actual-component Electron regressions, 275 renderer binding checks and double-digit patch update compatibility.
- [ ] Real GitHub Windows build runs both full Wizard review and previous missing-artwork renderer regressions, builds installer/portable and inspects candidate.
- [ ] Published stable version, report, manifest/GitHub digests and all four assets agree.
- [ ] Fixed-name download links return HTTP 200; v1.8.9 discovers v1.8.10.

## Installed Windows interaction — pending

- [ ] Open Wizard → Folder scan, pick an actual game directory, review genre-bearing matches, Accept and finish; reopen imported games.
- [ ] Empty/unmatched scans and skipped/already-known games remain safe.
- [ ] Games without artwork retain the v1.8.9 fix; existing library/playtime/settings survive upgrade.
- [ ] Control Center gear opens on the first click.
- [ ] Delayed hover text remains entirely inside every screen edge.
- [ ] A known fully updated installed Steam game shows no false update.
- [ ] A genuine queued or active Steam download retains status and Open downloads handoff.

Browser regression uses actual Wizard/GameDetail components with synthetic data and
mock native reads, never the player's folders or saved library. Build verification
does not certify hands-on installer or physical-controller acceptance.
