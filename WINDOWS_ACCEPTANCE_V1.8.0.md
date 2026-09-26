# NEO-LIB v1.8.0 Windows acceptance record

This record separates automated source evidence from checks that require a
rebuilt Windows app. Do not publish v1.8.0 until release-blocking checks pass or
have a written accepted deferral.

## Candidate identity

- [ ] `npm run build:release` completed from current source.
- [ ] Installer and portable folder came from the same renderer generation.
- [ ] `npm run inspect:release` passed and produced `dist/release-candidate-v1.8.0.json`.
- [ ] `dist/SHA256SUMS-v1.8.0.txt` lists installer and portable ZIP.
- [ ] Settings → About shows version `1.8.0`.

## Automated gate

- [x] Focused visual-boundary checks pass.
- [x] Renderer-binding checks pass.
- [x] Metadata workflow checks pass.
- [x] Clean update contract expects exact tag `v1.8.0`.
- [x] 104 native commands have one registration and request/response contracts. This includes the session-only fullscreen entry/exit, bounded player-triggered ROM scan, opt-in SteamGridDB artwork and achievement sync, external-root check, community-widget controls, custom-theme import/remix and video picker.
- [x] Candidate inspector passed for the earlier package at GitHub Actions run `35636774870`, commit `a3f3d6d`. This does **not** validate the current Wall, divider, theme or Lounge source changes.
- [ ] Rebuild and inspect a fresh package from the current source before testing or publishing it. The managed environment still stops Vite at `esbuild spawn EPERM` after pre-build checks; use the normal Windows build or GitHub Actions and record its new Build ID.

## Windows interaction

### First test pass — Wall and Library resizing

- [ ] In Library, hover the divider beside Preview. Confirm the grip and horizontal-resize cursor are obvious in dark and bright themes. Drag both ways, including outside the original grip; the width should follow smoothly and save on release. Press Escape during a drag to cancel. Focus the grip and use Left/Right, Shift+Left/Right, then double-click to reset to 320px. Restart and check the saved width. Repeat in a narrow window without hiding the entire Preview.
- [ ] In Wall Covers, switch Portrait/Square and move the size slider through its range. Check cover art, readable fixed-size titles, rating badges, filters, retro platform sections, and empty states at normal and narrow widths. Restart and confirm size/shape persist.
- [ ] In Wall Details, open Columns. Hide/show a field, move it earlier/later, adjust its slider, drag a header grip, use arrow keys on that grip, and Reset columns. Check headers remain labeled, rows align under them, Game stays first, and width changes apply to both PC and retro sections. Restart and confirm the chosen layout persists. Do not confuse a source check with this installed visual result.
- [ ] Open and close Wall's quick preview, then return Home and Library. Confirm no game launches merely from resizing or arranging the Wall, and private/locked games never appear.
- [ ] Unlock Home widgets and interrupt a free-position move and a resize (for example, by canceling pointer capture or switching away mid-gesture). The unfinished size/position must not be saved. A normal release must still persist the change after restart.

For each failure, record version and Build ID from Settings → About, theme,
window size, exact clicks/keys, expected versus actual result, and a screenshot.
Treat crashes, private-game exposure and accidental game launches as release
blockers; fix those before cosmetic adjustments. Keep visual preferences as
player choices rather than changing everyone's saved layout during a hotfix.

- [ ] From both top and sidebar Control Center, enter NEO Lounge on a rebuilt Windows app. Confirm it fills the display only after the click, shows unlocked games only, and never appears after restart. Test All/Favorites/Recently played, last-game focus, update-flag wording, keyboard arrows/Tab/Escape, visible Exit, a real preferred controller, and Open Preview returning to Desktop before navigation. Lock a private category, enter Lounge again and confirm its game is absent; test Rest, tray wake and native fullscreen exit. Controller A must not launch a game. No installed Lounge acceptance has run here.
- [ ] In Lounge, compare selected-game playtime, last session and Journey Status with Library. Confirm an update flag says to verify rather than claiming a download. Toggle the mascot off/on and switch Fungist/FiFi: guidance must follow the setting, stay silent and not reveal a locked title. Hide to tray while Lounge is open and verify Desktop returns on wake; if fullscreen exit fails, a retry message must remain visible and Preview must not open. No installed L1–L3 acceptance has run here.
- [ ] With keyboard and a real standard-mapping pad, confirm Lounge hints match the actions: arrows/stick/D-pad move, focus on a cover shows its facts, Enter/south opens Preview without launching the game, Esc/east returns, and each shoulder press changes one view without repeated cycling while held. Switching to a populated filter must focus its selected cover; switching to an empty filter must retain focus on that filter. After either change, the next pad direction/confirm must act from the visible focus rather than the previous filter. While a cover is focused, hover over another cover and confirm its facts do not replace the focused game's facts; then remove the focused game from view and confirm focus returns to another cover or the selected filter. Check that covers stay couch-readable on a full-size display without overflowing a narrow window. Use screen-reader focus or accessibility inspection to confirm covers announce title and possible update flags. Shrink the window and verify header, filters, scrollable facts, Exit and Preview remain reachable. Test a broken portrait and backdrop: the title must remain visible on a color fallback. Simulate or observe a failed native exit and confirm focus returns to Exit. Compare memory/CPU with a large library while scrolling lazily loaded covers. No installed accessibility/performance check has run here.

- [ ] Switch Default/Minimalistic from both top-menu and Sidebar setups. Compare Home, Library, Wall and Tools at normal and narrow widths in at least two dark and two bright themes. Confirm Panic Lock remains obvious, Home Customize exposes every widget action (and stays exposed while unlocked), Library Filters exposes launcher/sort/category/auto-sort with an active hint, Wall More options reveals density/columns/selection while its quick filters and view choice remain visible, and Tools More actions/Show details expose all support controls and metadata while missing-tool recovery remains visible. Returning to Default must restore the original layout without changing games, widget positions or saved filters. No installed visual test has run here.

- [ ] In Controller Center, enable controller navigation with a standard pad. Check visible focus, stick/D-pad repeat, A on a harmless menu control, B on a modal/Wall Peek and while typing in Search, Start on Control Center and HOME from both Library and full-wall views. B in Search must leave the field without typing or activating a result. Hold A while reconnecting/refocusing: nothing may activate until A is released and pressed again. Disconnect the preferred pad while a second pad stays attached: the second pad must not take over. Confirm Launch, alternate routes, Delete and other sensitive buttons do not activate, while blocked Launch explains the limitation. Lock a private category and use Panic Lock while a private control is focused; focus must leave the hidden control. Test opt-out, Rest and tray wake. No physical-pad acceptance has run here.

- [ ] With a personal Steam Web API key, sync a confirmed owned game with achievements; check earned/total, account ID and sync time, then try a private account or invalid key without changing the prior record. Restart NEO-LIB and verify the key was forgotten. No live-key test has run here.
- [ ] Open a non-Steam game with source-declared achievements. Confirm Preview reports availability separately from earned progress, says NEO-LIB cannot verify earned progress yet, and shows no fabricated earned count or Steam sync action. No installed-app check has run here.
- [ ] In the rebuilt app, search one known JAST Store and one known Game Jolt title in the manual metadata picker. Confirm only official game-page candidates appear, mature-source previews start hidden, candidate title/page are readable, and accepting a candidate still opens the normal review before changing a game. Check a matching existing-library entry in the five-at-a-time refresh flow. No live-page test has run here.
- [ ] In Wizard, save an external-drive root and a NAS root. Check that paths start hidden and are only checked when requested. Import or use an existing game executable inside one root, then unplug that drive (or disconnect the NAS) and confirm Play gives an unavailable-root error without starting anything. Reconnect it and verify Play works. Cloud entries must remain bookmarks with no scan or account access. No real-drive/NAS test has run here.
- [ ] In the rebuilt app, switch through all 16 built-in themes and compare palette, Library sidebar artwork, atmosphere, special control decoration, FX intensity and Rest Mode against the previous build. Import a local still-image theme, inspect its review, activate it, restart and confirm it persists; reject an invalid theme and an existing ID without replacing files. No installed-app visual comparison has run here.
- [ ] Import a custom theme with transparent particle artwork. Check rise/fall/drift across None–Max Effects, Balanced/Calm, Rest Mode, Windows reduced motion and a modest PC/GPU load. Confirm particles stay behind all controls and never intercept clicks. No installed-app particle acceptance has run here.
- [ ] Open Theme Creator Lab, start blank, change colours, add a transparent PNG, move the sliders, check the live preview, save and restart. Then remix an installed theme and confirm both the remix and unchanged original remain selectable. Try a duplicate ID and invalid image; neither may replace existing artwork. No installed-app Creator Lab acceptance has run here.
- [ ] In Theme Creator Lab, choose images for all six artwork layers, adjust opacity, remove one, save as a new theme and restart. Confirm each saved layer appears in the app, the removed layer is gone, and the source theme is unchanged. Check the picker rejects a renamed non-image file. No installed-app artwork-layer acceptance has run here.
- [ ] Try each particle placement and near/far depth in Theme Creator Lab and a saved theme. Check rotation and glow at their limits, Effects None–Max, Calm/Balanced, Rest Mode and Windows reduced motion; confirm readability and resource use on the installed app. No installed-app P2a particle acceptance has run here.
- [ ] Configure separate launch and celebration particle emitters. Preview both bursts in Theme Creator Lab, save/restart, trigger a NEO-LIB celebration, and launch a game with automatic Rest both on and off. Confirm no burst while resting, at Effects None or with Windows reduced motion, and no stale launch burst after waking. No installed-app P2b event acceptance has run here.
- [ ] Import and create an atmosphere GIF with a PNG/JPG/WebP fallback. Confirm visible-only and while-awake modes, window hide/show, Calm, Windows reduced motion, Effects None and Rest Mode. Reject a GIF without embedded infinite loop, a too-fast/oversized GIF, a missing still, and a duplicate theme ID. Measure installed-app CPU/GPU use; no Windows P2c acceptance has run here.
- [ ] Set an atmosphere GIF to Once, then still. Confirm one complete cycle then fallback, no replay after hide/show or reduced-motion change, and rejection above 20 seconds. A freshly picked GIF previews Once only after saving, when native timing is known. No installed-app P2f timing acceptance has run here.
- [ ] Create and import a Canvas GIF, then a Canvas WebM, each with a still fallback. Confirm Home, Library, Wall and dialogs remain readable; test opacity, once/visible/awake modes, window hide/show, Effects None, Calm, Windows reduced motion, Rest and failed decoding. Confirm the theme refuses simultaneous Canvas and Atmosphere animation. Measure installed-app CPU/GPU use; no Windows P2g acceptance has run here.
- [ ] In Theme Creator Lab, choose a Canvas still image and adjust opacity from 0–100%. Save/restart, verify it fills different window sizes and remains readable behind Home, Library, Wall and dialogs; restore the gradient and save a second theme without altering the first. No installed-app P2d canvas acceptance has run here.
- [ ] Import and create an atmosphere WebM with PNG/JPG/WebP still. Verify once ends on the still, visible-only restarts after hide/show, while-awake pauses/resumes, and all modes stay muted. Confirm Calm, Windows reduced motion, Effects None and Rest Mode suppress playback; unsupported codec, missing still, over-20-second, over-1080p and over-8-MB files never animate. Measure CPU/GPU and check UI readability. No installed-app P2e video acceptance has run here.

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
- [ ] Test Atari 2600, C64, Wii U and Switch folder profiles with player-owned sample files. Confirm import closes Wizard and starts the one-by-one review; Skip/Stop leaves imported ROMs and routes intact, and a wide-only result does not replace the portrait fallback.
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
- [ ] Point exact clean tag `v1.8.0` at the accepted v1.8.0 commit; the already-pushed tag on `74732bc` is invalid because that commit still declares package version `1.7.9`.
- [ ] GitHub Release is non-draft and contains installer, portable ZIP, evidence
  JSON and checksum file.

Acceptance owner/date: `____________________________`
