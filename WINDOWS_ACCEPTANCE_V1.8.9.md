# NEO-LIB v1.8.9 Windows acceptance record

## Build and publication

- [x] Exact v1.8.8 bundle/stack location identifies the null artwork-dimensions check.
- [x] Actual GameDetail browser fixture reproduces the null-width crash before the fix.
- [x] Full source gate; native commands have one registration and request/response contracts.
- [x] Actual GameDetail browser test passes missing/empty/null, failed and valid artwork, then missing artwork again. Native update/news reads are mocked; no launch/data-write action ran.
- [x] Final production renderer (2414 modules, 15.91s locally) and real GitHub Windows installer/portable build; run 39157577613 completed every step successfully.
- [x] Candidate inspection, published version and all four asset checksums agree.
- [x] Fixed-name public installer/portable downloads return HTTP 200; actual shipped checkForUpdates('1.8.8', { force: true }) detects live v1.8.9 and its exact installer URL.

Published 2026-10-18. Source/tag 65d252d79ebda032eac818ade8d2d1003ee19cdc,
build 75443842C11A, 465 archive entries, 80 mascot assets; feedback and Discord configured.
Installer: 250474336 bytes, SHA256 DF12255F43EA0ED73682FB8B753D72D57EA5033746124C4026516F6A08C21A11.
Portable: 283355745 bytes, SHA256 3C322EB651047684B8A0ACE66E8466B75AD0ED8970F4B59811962EE814019A75.
GitHub asset digests, downloaded report and checksum manifest match. No unpublished
visual/editor changes are in the release. Installed Windows checks below remain pending.

## Installed Windows interaction — pending

- [ ] Import a game with Wizard without any artwork; open/select it without a startup error.
- [ ] Open entries with missing/failed artwork and switch between them and artwork-bearing games.
- [ ] Control Center gear opens on the first click; Visuals/Settings remain reachable.
- [ ] Delayed hover text remains entirely inside every screen edge.
- [ ] A known fully updated installed Steam game does not show a false update.
- [ ] A genuine queued or active Steam download retains status and Open downloads handoff.
- [ ] Upgrade preserves library, playtime and saved artwork; shows only the new hotfix notes.

Automated browser fixtures use synthetic games and mock native reads. They do not
establish real-profile Wizard imports, installer execution or physical acceptance.
