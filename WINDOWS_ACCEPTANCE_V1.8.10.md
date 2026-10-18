# NEO-LIB v1.8.10 Windows acceptance record

## Build and publication

- [x] Screenshot bundle filenames match the successful shipped v1.8.9 build.
- [x] Actual Wizard Folder scan → mock folder picker/scan → metadata review reproduces the exact undefined-map crash before the fix.
- [x] After the fix, populated/empty/absent metadata reach explicit Accept and Wizard complete; no pre-Accept import or real folder/library write.
- [x] Full source gate; native commands have one registration and request/response contracts. Includes both actual-component Electron regressions, 275 renderer binding checks and double-digit patch update compatibility.
- [x] Real GitHub Windows build runs both full Wizard review and previous missing-artwork renderer regressions, builds installer/portable and inspects candidate. Run 39161899530 completed every step successfully; both PASS lines independently checked in job 117776759305 logs.
- [x] Published stable version, report, manifest/GitHub digests and all four assets agree.
- [x] Fixed-name download links return HTTP 200; unchanged shipped checkForUpdates detects live v1.8.10 from v1.8.9 and returns the exact installer link.

Published 2026-10-18 from source/tag a4effe3af2739992720b6a23e8c3a7c3f5293569.
Build 9795A0B0D5C2, 465 ASAR entries, 80 mascot assets; feedback/Discord configured.
Installer 250474367 bytes, SHA256 32B1C695FFF8CD701B88D4A14ED7DABB16382C3C4BBD11B52135C414F8BE3C7B.
Portable 283355551 bytes, SHA256 A101AC95B1EFC4087074711B1D1D658B36B19BAAC6C012A63705CF83751002C1.
Downloaded report, checksum manifest and GitHub asset digests agree. No unpublished features included.

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
