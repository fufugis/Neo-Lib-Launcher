# NEO-LIB — Product Requirements

## Original problem statement
Standalone Windows Game Library app (NEO-LIB). Massive UX/UI refinements,
advanced customization, integrated metadata fetching, auto-sorting categories,
and a non-intrusive monetization system (Deals banners via Affiliate links).

## Architecture
- Electron + React + Vite. Fully portable.
- Library data: `%APPDATA%\NEO-LIB\library.json` (flat JSON).
- CI: GitHub Actions builds NSIS `.exe` + portable `.zip` on tag push.
- System tray (Electron Tray API) for close-to-tray behavior.

## Version 1.1.4 — Feb 16, 2026
**Tray mode + Featured banner:**
- Close-to-tray (Electron `Tray` + window `close` interception, persisted via `settings.minimizeToTray`).
  Tray menu: Show / Quit. Left-click toggles window visibility.
- `FeaturedDealBanner.jsx` — slim 56px sponsored card above DealsBar, rotates IG hot deals (paying affiliate).

## Version 1.1.3 — Feb 16, 2026
**More deals (revenue), still subtle:**
- Instant Gaming scraper in `main.js` (regex-based, defensive try/catch).
- Steam supply 8 → 15, threshold 25% → 20%.
- "All N" popover in DealsBar.

## Version 1.1.2 — Feb 16, 2026
**What's-new toast:**
- `ChangelogModal.jsx` auto-opens 2.2s after boot when `lastSeenVersion !== APP_VERSION`.

## Version 1.1.1 — Feb 16, 2026
**Polish & QoL:** per-game ambient backdrop, Deep Scan toggle, drop-folder auto-scan, selective metadata accept.

## Affiliate network status (as of v1.1.4)
| Network | ID | Status |
|---|---|---|
| Instant Gaming | `gamer-1485e8f` | LIVE — 3% / sale |
| Humble Bundle | `8518905` | Submitted, pending |
| Awin (Superbox MID 81755) | `2935955` | LIVE (Superbox only) |
| Skimlinks | `304685X1792871` | Submitted, pending |

## Roadmap / Backlog

### P1 (active)
- [ ] **Steam manifest reading** — show "Updated X days ago" + build IDs in Steam GameDetail.

### Deferred per user
- Refactor `App.jsx` / `main.js` (only when regression-risk shrinks).

### Dropped per user
- PC Tuner Wizard, keyboard shortcuts overlay, cloud sync via GitHub Gist.

## Versioning rule
Every git push bumps `+0.0.1` across:
- `desktop-app/package.json`
- `desktop-app/src/App.jsx` (`APP_VERSION` constant)
- `desktop-app/src/components/SettingsModal.jsx` (About line)
- `desktop-app/src/components/ChangelogModal.jsx` (top of `CHANGELOG`)
- `desktop-app/README.md` (badge + Latest section + previous Latest demoted)

## Test notes
- Tray feature MUST be tested on a real Windows install — Electron `Tray` doesn't render in CI/headless.
- IG scraper regex is fragile by nature; try/catch yields empty array on failure.
- Pre-existing lint warnings unrelated to this session.
