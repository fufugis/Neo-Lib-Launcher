# NEO-LIB v1.7.9 Windows acceptance record

This record separates automated source evidence from checks that require a
rebuilt Windows app. Do not publish v1.7.9 until release-blocking checks pass or
have a written accepted deferral.

## Candidate identity

- [ ] `npm run build:release` completed from current source.
- [ ] Installer and portable folder came from the same renderer generation.
- [ ] `npm run inspect:release` passed and produced `dist/release-candidate-v1.7.9.json`.
- [ ] `dist/SHA256SUMS-v1.7.9.txt` lists installer and portable ZIP.
- [ ] Settings → About shows version `1.7.9`.

## Automated gate

- [x] Focused visual-boundary checks pass.
- [x] Renderer-binding checks pass.
- [x] Metadata workflow checks pass.
- [x] Clean update contract expects exact tag `v1.7.9`.
- [x] 96 native commands have one registration and request/response contracts. This includes the bounded player-triggered ROM scan, opt-in SteamGridDB artwork and achievement sync, external-root check, and community-widget controls.
- [x] Candidate inspector passes against the newly built package (GitHub Actions run `35636774870`, commit `a3f3d6d`).

## Windows interaction

- [ ] With a personal Steam Web API key, sync a confirmed owned game with achievements; check earned/total, account ID and sync time, then try a private account or invalid key without changing the prior record. Restart NEO-LIB and verify the key was forgotten. No live-key test has run here.
- [ ] In the rebuilt app, search one known JAST Store and one known Game Jolt title in the manual metadata picker. Confirm only official game-page candidates appear, mature-source previews start hidden, candidate title/page are readable, and accepting a candidate still opens the normal review before changing a game. Check a matching existing-library entry in the five-at-a-time refresh flow. No live-page test has run here.
- [ ] In Wizard, save an external-drive root and a NAS root. Check that paths start hidden and are only checked when requested. Import or use an existing game executable inside one root, then unplug that drive (or disconnect the NAS) and confirm Play gives an unavailable-root error without starting anything. Reconnect it and verify Play works. Cloud entries must remain bookmarks with no scan or account access. No real-drive/NAS test has run here.

- [ ] Wizard opens and offers manual add, folder scan, launcher import and
  existing-library refresh actions.
- [ ] Refresh missing metadata and full metadata preserve the existing review
  and confirmation flows.
- [ ] Wall hides the Library pane and fills the workspace.
- [ ] Wall switches between cover and detailed-list views.
- [ ] Cover titles and rating badges remain readable at dense sizes.
- [ ] Home and Library return actions restore the normal sidebar.
- [ ] Locked games remain hidden in Wall until their category is unlocked.
- [ ] Control Center gear opens on the first click.
- [ ] Delayed hover text remains entirely inside every screen edge.
- [ ] Retro Library scans only the chosen folder and shows the editable review list.
- [ ] Re-scanning refuses already imported ROM paths and preserves existing entries.
- [ ] NES/SNES/GBA/3DS or other available fixtures enter their correct platform shelves and appear in platform sections at the end of Wall.
- [ ] A ROM path containing spaces launches as one argument through the selected emulator and uses its optional working folder.
- [ ] Retro metadata review uses title plus platform, preserves the fallback until accepted, and saves the chosen case art.
- [ ] Collection Mode metadata review confirms its scope, skips manual entries and advances through selected games one at a time.
- [ ] Collection Mode artwork review preserves locked slots, keeps a restore point and changes nothing until Apply is pressed.
- [ ] Protect in lists only unlocked private categories, confirms the selected count and hides protected identity again after Lock private.
- [ ] A harmless API v1 community widget imports disabled, enables from Widgets, renders on Home, moves/resizes and stays isolated when Home refreshes.
- [ ] Storage, redacted Library and HTTPS each require their own grant; private games, executable paths and API keys never appear in a widget message.
- [ ] Broken widget code shows a local failure/Reload control while Home and the rest of NEO-LIB remain usable.
- [ ] Updating a widget reviews its new version and capabilities, disables it and clears grants; uninstall removes it from Home and Recovery restores a disabled copy.
- [ ] With a valid player-owned SteamGridDB key, Game Workshop Online search shows title choices before artwork candidates.
- [ ] Icon, Cover, Hero, Background and Logo galleries show source/author/resolution and stage Use this without changing saved artwork until Save game.
- [ ] Canceling Game Workshop after choosing online artwork leaves the original artwork unchanged; saving creates a usable restore point.

## Steam update truth

- [ ] With a known fully updated installed Steam game, no stale update card is shown.
- [ ] With a genuine queued or active Steam download, the update card is accurate
  and **Open downloads** opens Steam’s Downloads page.

## Publication

- [ ] All release blockers pass or have an accepted deferral.
- [ ] Commit and push accepted source.
- [ ] Create/push exact clean tag `v1.7.9`—never `v.1.7.9`.
- [ ] GitHub Release is non-draft and contains installer, portable ZIP, evidence
  JSON and checksum file.

Acceptance owner/date: `____________________________`
