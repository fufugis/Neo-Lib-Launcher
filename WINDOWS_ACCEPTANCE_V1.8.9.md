# NEO-LIB v1.8.9 Windows acceptance record

## Build and publication

- [x] Exact v1.8.8 bundle/stack location identifies the null artwork-dimensions check.
- [x] Actual GameDetail browser fixture reproduces the null-width crash before the fix.
- [x] Full source gate; native commands have one registration and request/response contracts.
- [x] Actual GameDetail browser test passes missing/empty/null, failed and valid artwork, then missing artwork again. Native update/news reads are mocked; no launch/data-write action ran.
- [ ] Final production renderer and real GitHub Windows installer/portable build.
- [ ] Candidate inspection, published version and all four asset checksums agree.
- [ ] Fixed-name public installer/portable downloads work; v1.8.8 detects v1.8.9.

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
