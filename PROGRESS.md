# NEO-LIB progress

This is the short, human-readable view of the active work. It is updated as features move from idea to verified work.

## Release status

- **v1.7.0** — source commit pushed to `main` (`fc65001`). A GitHub Release tag and compiled installer have not been published yet.
- **v1.7.1** — local development batch; not release-ready yet.
- **v1.7.2** — active development batch: Released This Week.

## Completed locally for v1.7.1

- Home **Library Health** card with a colour-coded total score, issue chips, and a direct Tidy Up action.
- Larger Home news cards with Steam artwork when available.
- Home pane arrangement: drag panes into order, hide individual panes, and restore them from the Home header. News opens in-app before offering a Full story link; **My Best Games** shows top ten personal ratings alongside Metacritic where available.
- Missed shell fixes now implemented locally: Friends moves into the bottom of the selected game preview; Coffee sits beside Discord; labelled Settings follows Visuals in Library controls; Refresh/Tidy is grouped with Auto-sort; the sponsored rail is centred, permanent, and no longer contains Coffee or a dismiss action; five-star library frames use theme accents; preview rating reads **My rating** with larger stars.
- Cover art in Home Top 5.
- Game Ready thresholds tuned to yellow at 65% and red at 85%.
- **Rest Mode while gaming** is now on by default for games launched through NEO-LIB: it disables ambient effects, animations, UI sounds, health polling, launcher scans, background news/deal checks, and social refreshes until the tracked game exits. The Game Ready footer clearly shows **NEO-LIB RESTING** and the active game; the feature can be disabled in Settings.
- Library scroll space reserved above the Game Ready footer.
- **Save Game Folder** entry point in both the preview action bar and game right-click menu, with per-game folder selection and open-folder access.
- Safe, local-only **Save Backups**: backup records are stored inside NEO-LIB app data; recovery refuses to overwrite a non-empty live save folder and can create a separately named restored folder instead.
- User-triggered **older save finder** that searches a chosen drive/folder by game-name matches and requires the user to review every candidate.
- Home **What should I play?** card using local play history, ratings, added dates, and already-fetched patch news.
- Home **Storage Control Centre** with an explicit, read-only game/mod folder scan.
- Home **Gaming Chronicle** for local add / play / rating / update events.
- Conservative **Launch Doctor**: only after two immediate failures or very short launches within ten minutes; it checks the configured target and offers nearby executable candidates without changing files automatically.
- Distinct per-theme particle language rather than a shared sparkle look, plus three new Settings chimes (Aurora, Ember, Harbor) and three Visuals textures (Weave, Brushed, Stardust). Brushed replaced the non-seamless Topography tile.
- Visuals control reorganisation: Object sizes, Text & category, FX, and Layout groups; direct icon-position and category-marker sliders; category Backdrop intensity is tied to Category glow and remains translucent at max.
- Follow-up Visuals polish: Category marker `None` now removes both dot and backdrop; Brushed replaced the non-seamless Topography tile; Anime is pink-forward with original manga line art; Pro is renamed Industrial with animated safety-light geometry and metal sparks, without CRT scanlines.
- Library Health now counts all supported description fields and its Review action lists the actual affected games. Save Game Folder now automatically checks bounded, common Windows, game-folder, and Steam Cloud mirror locations; it never changes a save path until the user selects a result.

## Completed locally for v1.7.2

- **Released This Week** Home pane: a selective, rearrangeable release feed that verifies official Steam store dates and only shows full games with meaningful early player, review, or launch-reach signals. It displays artwork, source, date, and an inclusion reason; caches for six hours; supports manual refresh; and opens official store pages without account access.

## Next up (not currently being worked on)

- The active v1.7.2 scope is intentionally limited to Released This Week. It is tracked in [`V1.7.2_SCOPE.md`](V1.7.2_SCOPE.md).

**Current state:** v1.7.2 Released This Week is implemented locally and source-validated, awaiting desktop bug testing. Discord presence/mirroring has been explicitly dropped. No other new feature work is active until the user reviews this build.

## Planned research / platform-dependent work

- Official opt-in friend presence options per launcher.
- Launcher Adapter coverage for detection, import, launcher tags, updates, news, and safe native handoff.
- Curated “Released this week” major-title feed with transparent quality criteria.

## Known release checks

- Electron syntax, direct renderer bundle, Tailwind compilation, and whitespace checks pass.
- The normal Vite build cannot run in this workspace because its restricted process environment blocks esbuild spawning (`spawn EPERM`). This needs a normal Windows/GitHub Actions build before publishing an installer.
