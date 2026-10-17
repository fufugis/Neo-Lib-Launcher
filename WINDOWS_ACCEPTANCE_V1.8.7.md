# NEO-LIB v1.8.7 Windows acceptance record

Publication, package inspection and installed interaction checks are separate. Unchecked items are not certified by automated tests.

## Candidate identity

- [x] Package, renderer and newest changelog identify 1.8.7; exact clean tag is v1.8.7 (not created/pushed).
- [x] Complete prebuild:renderer passes for final source, 2026-10-17.
- [x] 145 native commands have one registration and request/response contracts.
- [x] Configured production renderer, NEO-LIB-Setup.exe and portable ZIP built; actual package inspection passed.
- [x] Installer/portable SHA-256 and Build ID recorded in dist/release-candidate-v1.8.7.json.
- [ ] Publish assets and verify stable download only after explicit release authorization.

## Windows interaction

Candidate Build ID: DBC15379283B. Installer: 250,472,124 bytes; portable ZIP: 283,354,147 bytes. Inspector validated 463 archive entries and 80 mascot/voice assets, configured feedback, exact privacy documents and absence of packaged environment files. Installer SHA-256: E975F6ADB2E45FD2F6C4E836F9AD34533C0A50848B7D639201117077E9D4969F. Portable SHA-256: 43DDAED3BD8C5CAF9F422C096F8F880F77AA3B8E17A58FDEDE6275E62893ADDD.

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
