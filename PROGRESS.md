# NEO-LIB progress

This is the short, human-readable view of the active work. It is updated as features move from idea to verified work.

## Release status

- **v1.7.0** — source commit pushed to `main` (`fc65001`). A GitHub Release tag and compiled installer have not been published yet.
- **v1.7.1** — active development batch. Not release-ready yet.

## Completed locally for v1.7.1

- Home **Library Health** card with a colour-coded total score, issue chips, and a direct Tidy Up action.
- Larger Home news cards with Steam artwork when available.
- Cover art in Home Top 5.
- Game Ready thresholds tuned to yellow at 65% and red at 85%.
- Library scroll space reserved above the Game Ready footer.
- **Save Game Folder** entry point in both the preview action bar and game right-click menu, with per-game folder selection and open-folder access.
- Safe, local-only **Save Backups**: backup records are stored inside NEO-LIB app data; recovery refuses to overwrite a non-empty live save folder and can create a separately named restored folder instead.
- User-triggered **older save finder** that searches a chosen drive/folder by game-name matches and requires the user to review every candidate.
- Home **What should I play?** card using local play history, ratings, added dates, and already-fetched patch news.
- Home **Storage Control Centre** with an explicit, read-only game/mod folder scan.
- Home **Gaming Chronicle** for local add / play / rating / update events.
- Conservative **Launch Doctor**: only after two immediate failures or very short launches within ten minutes; it checks the configured target and offers nearby executable candidates without changing files automatically.
- Distinct per-theme particle language rather than a shared sparkle look, plus three new Settings chimes (Aurora, Ember, Harbor) and three Visuals textures (Weave, Topography, Stardust).
- Visuals control reorganisation: Object sizes, Text & category, FX, and Layout groups; direct icon-position and category-marker sliders; category Backdrop intensity is tied to Category glow and remains translucent at max.

## Next up (not currently being worked on)

- Home improvements: in-app news detail, richer game panels, pane ordering and hide/show controls, My Best Games.
- Library controls: Settings placement, Refresh/Tidy placement, consistent click-outside dismissal.
- Bottom experience: Friends button relocation, Coffee placement, sponsored footer redesign.
- Update Intelligence architecture for launcher-owned and independent games.

**Current state:** no task is actively running. The completed items above are local v1.7.1 changes awaiting your testing and direction.

## Planned research / platform-dependent work

- Official opt-in friend presence options per launcher.
- Launcher Adapter coverage for detection, import, launcher tags, updates, news, and safe native handoff.
- Curated “Released this week” major-title feed with transparent quality criteria.

## Known release checks

- Electron syntax, direct renderer bundle, Tailwind compilation, and whitespace checks pass.
- The normal Vite build cannot run in this workspace because its restricted process environment blocks esbuild spawning (`spawn EPERM`). This needs a normal Windows/GitHub Actions build before publishing an installer.
