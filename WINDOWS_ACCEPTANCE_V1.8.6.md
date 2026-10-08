# NEO-LIB v1.8.6 Windows acceptance record

Publication checks and live interaction checks are separate. Source verification does not certify an installed app.

## Candidate identity

- [x] Installer is exactly NEO-LIB-Setup.exe; published candidate inspection shows version 1.8.6.
- [x] Record installer/portable SHA-256 and Build ID; packaged renderer provenance verified by CI. Build ID CDA15C793402.
- [x] Complete prebuild:renderer passes for this source (2026-10-08).
- [x] 144 native commands have one registration and request/response contracts. Automated fixtures, 2026-10-08.
- [x] Build credential-configured production renderer, installer and portable ZIP; inspect actual packages. GitHub run 37705196585 succeeded at c39279b184c87037e1ebbb42d12cacec19c0a669.
- [x] Publish all four release assets and verify the stable installer download. Latest v1.8.6 link returns HTTP 200, 245718884 bytes; GitHub binary digests match the candidate record and checksum manifest.

Installer SHA-256: 912CB01FCC53575013E1DE4B169A52B0F0477DE1D74514B7DFE198AC35057427.
Portable SHA-256: 7BD195BB259ABD8025A6A59DE1ABF64128637E7081ABD8D5452D4E2039271AD6.
Evidence: https://github.com/fufugis/Neo-Lib-Launcher/actions/runs/37705196585 and https://github.com/fufugis/Neo-Lib-Launcher/releases/tag/v1.8.6.

## Windows interaction

- [ ] Control Center gear opens on the first click; Visuals/Settings flyouts and Addons remain reachable.
- [ ] Delayed hover text remains entirely inside every screen edge.
- [ ] On a known fully updated installed Steam game, confirm no false update.
- [ ] With a genuine queued or active Steam download, verify status and Open downloads.
- [ ] Detached Lounge preserves changes and privacy/launch restrictions.
- [ ] Hold carousel movement eight seconds with all FX; inspect flashing, jitter and frame times.
- [ ] Check artwork position, pulse source colour and visibility at normal/enlarged zoom.
- [ ] Home/Lounge pie filters, Other totals, privacy and independent persistence work.
- [ ] Emulator visibility, grey/configured colour, mouse wheel and controller navigation work.
- [ ] Themes remain sharp in Lounge and quieter in desktop mode.
- [ ] Addon/module import, removal, restore and permission denial work.
- [ ] Real Skraper, ScreenScraper and RomM review/import workflows preserve library data.
- [ ] Artwork/Journey changes save and FiFi responses are complete/privacy bounded.
- [ ] No startup intro or production development overlay; no accidental launches.

Record version, Build ID and exact evidence for live failures. No live acceptance is claimed by publishing the installer.
