# NEO-LIB v1.8.7 Windows acceptance record

Publication, package inspection and installed interaction checks are separate. Unchecked items are not certified by automated tests.

## Candidate identity

- [x] Package, renderer and newest changelog identify 1.8.7; published clean tag v1.8.7 points to recovery commit ba86415.
- [x] Complete prebuild:renderer passes for final source, 2026-10-17.
- [x] 145 native commands have one registration and request/response contracts.
- [x] Configured production renderer, NEO-LIB-Setup.exe and portable ZIP built; actual package inspection passed.
- [x] Installer/portable SHA-256 and Build ID recorded in dist/release-candidate-v1.8.7.json.
- [x] User authorized recovery/publication; GitHub run 39024849998 passed. Latest stable release has four nonempty assets and installer/portable fixed-name downloads return HTTP 200.

## Published GitHub build — 2026-10-17

Build ID **D7306E8CC439**, from [successful GitHub run 39024849998](https://github.com/fufugis/Neo-Lib-Launcher/actions/runs/39024849998).
The failed CRLF-sensitive source checks were repaired without changing runtime behavior.
Published candidate inspection reports 465 ASAR entries, 80 mascot assets, feedback
and Discord configured. Public report/checksums agree with GitHub asset digests:

- Installer: 250,471,366 bytes; SHA-256 5F56B5056E0A47C044A056F02C367548BE9F40D49FC2AE3125EC0AF1E1FE06B8.
- Portable ZIP: 283,355,403 bytes; SHA-256 0E89AD49CD2413C8A1A6A895DB9BED3D86DBB5388035F38E0B95298B539BB2BF.
- Versioned candidate report and SHA256SUMS file are also publicly attached.

This is the published identity; the earlier local-only candidate below is retained
as history. No installer was executed against a real player profile during recovery.

## Windows interaction

Earlier local-only candidate Build ID: DBC15379283B. Installer: 250,472,124 bytes; portable ZIP: 283,354,147 bytes. Inspector validated 463 archive entries and 80 mascot/voice assets, configured feedback, exact privacy documents and absence of packaged environment files. Installer SHA-256: E975F6ADB2E45FD2F6C4E836F9AD34533C0A50848B7D639201117077E9D4969F. Portable SHA-256: 43DDAED3BD8C5CAF9F422C096F8F880F77AA3B8E17A58FDEDE6275E62893ADDD.

The installer is unsigned (same project signing policy as before); Windows/SmartScreen may display a trust warning. The real NSIS compiler and installer build passed after correcting early-include helper/name resolution in the deferred-launch hook; no installer was executed against the real user profile.

- [ ] Control Center gear opens on the first click; Visuals/Settings flyouts and Addons remain reachable.
- [ ] Delayed hover text remains entirely inside every screen edge; icons-only sidebar labels appear immediately.
- [ ] Sidebar tweaks scales entire buttons, pins/highlights preview and restores the selected mode after closing.
- [ ] On a known fully updated installed Steam game, confirm no false update.
- [ ] With a genuine queued or active Steam download, verify status and Open downloads.
- [ ] Home and individual Library install-size scans agree after app restart.
- [ ] Welcome/tutorial/patch notes/Wizard follow the chosen first-run flow; usage reporting stays opt-in and 16+.
- [ ] Existing 1.8.6 user data survives upgrade, with saved artwork, ratings, playtime and preferences.
- [ ] Home and preview layout editors save and restore without shrinking or losing content.
- [ ] Detached Lounge preserves changes, privacy and launch restrictions; scenery/effects remain smooth.
- [ ] Home/Lounge calendar and pie filters display the expected playtime.
- [ ] Retro profiles launch the selected ROM and attribute playtime to it, not the emulator.
- [ ] Theme artwork is sharp in Lounge; brighter Moonlit Arcana remains readable.
- [ ] Addon/module/widget import, removal, restore and permission denial work.
- [ ] Real Skraper, ScreenScraper and RomM workflows preserve library data.
- [ ] Download popup opens the correct installer in the system browser; installer finishes before NEO-LIB starts.
- [ ] No startup intro or production development overlay; no accidental launches.

Isolated automated fixtures do not certify these physical/installed behaviors. No installation into the user's real library/profile is performed during preparation.
