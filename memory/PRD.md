# NEO-LIB — Product Requirements

## Original problem statement
Standalone Windows Game Library app (NEO-LIB). Massive UX/UI refinements,
advanced customization, integrated metadata fetching, auto-sorting categories,
and a non-intrusive monetization system (Deals banners via Affiliate links).

## Architecture
- Electron + React + Vite. Fully portable.
- Library data: `%APPDATA%\NEO-LIB\library.json` (flat JSON).
- CI: GitHub Actions builds NSIS `.exe` + portable `.zip` on tag push.
- Main process scrapers: Steam, GOG, itch, DLsite, VNDB, Ryuugames, DuckDuckGo, Gemini fallback.

## Version 1.1.3 — Feb 16, 2026
**More deals (revenue), still subtle:**
- New Instant Gaming hot-deals scraper in `electron/main.js` → up to 12 entries
  joined to the rotation, auto-wrapped with `igr=gamer-1485e8f` (the only currently-paying source).
- Steam specials supply expanded 8 → 15, threshold lowered 25% → 20%.
- New "All N" pill in DealsBar opens a popover (max-h 60vh) showing every current deal in a scrollable list.
- Affiliate scrape regex is defensive — if IG markup changes, that source silently returns 0 items, others keep working.

## Version 1.1.2 — Feb 16, 2026
**What's-new toast:**
- New `ChangelogModal.jsx` with version-pinned entries.
- App.jsx tracks `settings.lastSeenVersion`. First-ever run writes APP_VERSION silently;
  subsequent updates auto-open the modal 2.2s after boot.
- Settings → About → "What's new" button to replay it on demand.

## Version 1.1.1 — Feb 16, 2026
**Polish & QoL batch:**
- Per-game ambient backdrop toggle (Settings → Visual effects).
- Wizard Deep Scan toggle (Fast 5-deep/1500 files vs Deep 10-deep/5000 files).
- Drop-folder auto-scan — Wizard opens AND auto-runs scan on folder drop.
- Selective metadata accept — per-field checkboxes with All / Only changed / None presets.

## What was already implemented (prior sessions)
- Drag-drop `.exe`/`.lnk` (single files added directly).
- AcceptMetadataModal (preview-before-write) + EditMetadataModal.
- Dual-pane GameDetail (text + screenshots gallery).
- 6 themes grouped Dark/Bright (Synthwave / Midnight / Ocean / Crimson / Anime / Mint Garden).
- DynamicsCompressorNode-normalized UI sounds, sound packs.
- Pinned Games strip + Library tabs (Steam/Epic/EA/GOG/Other).
- Smart Auto-Sort categories.
- Live deals strip with Affiliate routing (Instant Gaming, Awin, Skimlinks, Humble).
- GitHub Releases update checker pill in TitleBar.
- Modal double-click-to-close.
- CRT boot animation, particles, sparkles, scanlines.

## Affiliate network status (as of v1.1.3)
| Network | ID | Status |
|---|---|---|
| Instant Gaming | `gamer-1485e8f` | LIVE — 3% / sale |
| Humble Bundle | `8518905` | Submitted, pending |
| Awin (Superbox MID 81755) | `2935955` | LIVE (Superbox only — swap MID for Fanatical/GMG when approved) |
| Skimlinks | `304685X1792871` | Submitted, pending |

## Roadmap / Backlog

### P1 (active)
- [ ] **Steam manifest reading** — show "Updated X days ago" + build IDs in Steam game detail. (User-confirmed for future.)

### Deferred per user
- Refactor `App.jsx` / `main.js` (only when regression-risk shrinks).

### Dropped per user
- PC Tuner Wizard (too expensive in credits).
- Keyboard shortcuts overlay (`?` key) — not needed.
- Cloud sync via GitHub Gist — not wanted.

## Versioning rule
Every git push bumps `+0.0.1` across:
- `desktop-app/package.json`
- `desktop-app/src/App.jsx` (`APP_VERSION` constant)
- `desktop-app/src/components/SettingsModal.jsx` (About line)
- `desktop-app/src/components/ChangelogModal.jsx` (top of `CHANGELOG`)
- `desktop-app/README.md` (badge + Latest section)

## Test notes
- No `.exe` testing locally — instruct user to push + tag (e.g., `v1.1.3`) so CI builds.
- Vite `yarn dev` for UI checks. Some features (Electron IPC) won't fire in the browser.
- IG scraper depends on HTML markup — if Instant Gaming redesigns their hot-deals page, the regex needs a refresh. Currently defensive: try/catch, empty array on failure.
- Pre-existing lint warnings: 5 in `App.jsx` (react-hooks/immutability) and 1 in `GameDetail.jsx` (set-state-in-effect) — not introduced this session.
