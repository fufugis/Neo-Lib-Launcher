# NEO-LIB v1.7.8 Windows acceptance record

This record separates automated evidence from checks that require a real installed
Windows app. Do not publish `v1.7.8` until every release-blocking item is checked or
has a written, deliberate deferral.

## Candidate identity

- [ ] `npm run build:release` completed from current source.
- [ ] Installer and zipped portable folder came from the same renderer generation.
- [ ] `npm run inspect:release` passed and produced `dist/release-candidate-v1.7.8.json`.
- [ ] `dist/SHA256SUMS-v1.7.8.txt` lists the installer and portable ZIP.
- [ ] Build ID: `____________`
- [ ] Installer SHA-256: `_______________________________________________________________`
- [ ] Portable ZIP SHA-256: `______________________________________________________________`
- [ ] `app.asar` SHA-256: `_______________________________________________________________`
- [ ] Git revision/source archive: `____________________________`

The inspector verifies version `1.7.8`, exact clean tag `v1.7.8`, current renderer
fingerprint, exact native `main.js`, package entry points/icons, every local
mascot/voice asset, configured feedback/Discord integration presence, absence of
packaged `.env` files and absence of known credential signatures. Its JSON records
only integration enabled/disabled facts, never relay keys or App IDs.

## Automated gate

- [x] Complete source suite passes after architecture freeze.
- [x] 85 native commands have one registration and request/response contracts.
- [x] Renderer has no unbound names or dead root `App` bindings.
- [x] Launcher import, metadata, privacy, Auto-sort, diagnostics, FiFi and update-tag fixtures pass.
- [x] Old v1.7.3 comparison recognizes clean release tag `v1.7.8`.
- [x] Missing/malformed feedback settings fail the GitHub build before publication.
- [x] Optional Discord configuration is numeric-only, generated before provenance and package-verified.
- [ ] Candidate inspector passes against the newly built real package.

## Clean-profile startup

- [ ] Preserve the normal profile; use a disposable clean Windows profile copy.
- [ ] Intro completes and Home appears without a blank window or application error.
- [ ] Tutorial opens after the intro and can be completed/closed.
- [ ] Settings → About shows version 1.7.8 and the same Build ID as the evidence JSON.
- [ ] Close-to-tray and tray restore work; full Quit ends NEO-LIB.
- [ ] Restart retains one harmless fixture, settings and selected mascot.
- [ ] Diagnostic report contains no game names, paths, URLs, searches, messages, PINs or keys.

## Copied-upgrade profile

- [ ] Test only with a copied older AppData profile; never the sole live copy.
- [ ] Library, categories/order, tools, playtime, ratings and settings remain intact.
- [ ] Private categories remain locked and their PIN behavior still works.
- [ ] Migration creates the expected recovery copy before saving changed documents.
- [ ] Unknown/custom fields survive the upgrade.

## Operations and launch safety

- [ ] Launcher Wizard imports one review-approved fixture and creates its launcher category.
- [ ] Cancel one launcher scan; the overlay closes and no endless spinner remains.
- [ ] Metadata Refresh shows candidates and applies only the chosen candidate.
- [ ] Cancel/close a metadata operation; late results do not overwrite current state.
- [ ] A harmless executable launches only after a deliberate Launch action.
- [ ] No game/app starts during 45 seconds of untouched startup.
- [ ] Game exit records a session and returns NEO-LIB from low-use mode.
- [ ] External-game detection offers low usage and resumes after the exact process exits.

## Privacy and interface

- [ ] Locked games reveal no title, art, source, path or link on Home, Wall or Preview.
- [ ] Unlocking a category immediately restores its games; Lock private hides them again.
- [ ] Sort/category/launcher menus and all modals stay above Library text and FX.
- [ ] The left Control Center gear opens on the first click, including with Special-theme artwork enabled.
- [ ] Delayed hover text remains entirely inside every screen edge and does not cover the control it explains.
- [ ] Standard and reduced widths keep controls, category headers and Preview readable.
- [ ] Anime, Industrial and Magical button frames remain clickable and scale with buttons.
- [ ] Preview glass shows background FX without reducing text readability.
- [ ] Visuals three-column/two-column/one-column layouts remain inside the window.

## Steam update truth

- [ ] With a known fully updated installed Steam game, Home → Game Updates → Refresh removes any old update card instead of treating retained manifest byte counters as a pending download.
- [ ] With one genuine queued or active Steam download, Home accurately shows its pending/downloading state and **Open downloads** opens Steam’s Downloads page.
- [ ] If Steam is closed or refuses the handoff, NEO-LIB shows a readable error and never launches a game instead.

## Mascot, sound and controller

- [ ] Fungist and FiFi can each be selected, dragged and returned to the saved dock.
- [ ] FiFi blink/breathing/gaze/reaction motion renders without blocking controls.
- [ ] Voice preview, welcome, alert and launch lines obey volume, mute and Rest Mode.
- [ ] Speech bubbles remain onscreen and do not overpower their text.
- [ ] Controller Center shows no pad/one pad accurately and stops polling when closed.
- [ ] Windows Bluetooth hand-off opens the correct page.

## Performance record

Record Task Manager and NEO-LIB on the same machine/build.

- Cold start to usable Home: `________ s`
- Five-minute idle CPU: `________ %`
- Five-minute idle working-set RAM: `________ MB`
- Representative Library size: `________ games`
- Large-category first display/scroll observation: `_______________________________`
- Before game CPU/RAM: `________ % / ________ MB`
- Low-use CPU/RAM: `________ % / ________ MB`
- Two minutes after exit CPU/RAM: `________ % / ________ MB`
- Three NEO-LIB vs Task Manager CPU samples: `__________________________________`

## Publication gate

- [ ] All blockers above pass or have a written accepted deferral.
- [ ] Git diff and source archive are reviewed and backed up.
- [ ] Commit and push the accepted source.
- [ ] Create/push exact tag `v1.7.8`—never `v.1.7.8`.
- [ ] GitHub Release is non-draft, latest, and contains installer, portable ZIP, evidence JSON and checksum file.
- [ ] A v1.7.3 installation displays the update notice and opens the v1.7.8 release.

Acceptance owner/date: `____________________________`

Notes or deliberate deferrals:

`______________________________________________________________________________`
