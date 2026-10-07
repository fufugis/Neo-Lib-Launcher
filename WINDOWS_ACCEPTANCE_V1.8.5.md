# NEO-LIB v1.8.5 Windows acceptance record

All live checks remain pending. Source verification does not certify an installed app.

## Candidate identity

- [ ] Installer is exactly NEO-LIB-Setup.exe; Settings and candidate inspection show version 1.8.5.
- [ ] Record installer/portable SHA-256 and Build ID; verify packaged renderer provenance.
- [x] Complete prebuild:renderer passes for this source (2026-10-08).
- [x] 144 native commands have one registration and request/response contracts. Verified with automated fixtures, 2026-10-08.
- [x] Compile production renderer (2358 modules; 16.42s; approved outside-sandbox retry, 2026-10-08).
- [ ] Build credential-configured installer and portable ZIP, then run inspect:release on the actual packages.

## Windows interaction

- [ ] Control Center gear opens on the first click; Visuals/Settings flyouts and Addons buttons remain reachable with sidebar on/off and narrow panes.
- [ ] Delayed hover text remains entirely inside every screen edge.
- [ ] On a known fully updated installed Steam game, confirm update discovery does not claim a false update.
- [ ] With a genuine queued or active Steam download, verify status and Open downloads.
- [ ] Lounge opens/closes its separate window, preserves changes, and retains privacy/launch restrictions.
- [ ] Hold carousel movement eight seconds with all FX; inspect flashing strips, jitter, missed inputs and frame times. NVIDIA FPS N/A is not measurement.
- [ ] Check pulse strength, source colour/visibility and horizontal/vertical artwork positioning at 100% and enlarged zoom.
- [ ] Home and Lounge Playtime pie: enable/hide, all filters, favourites, Other totals, game opening, privacy lock and independent saved filters after restart.
- [ ] Emulator carousel: configured colours/unconfigured grey, size/width, hidden selection, all-hidden recovery, mouse wheel and controller focus/Back.
- [ ] Full-resolution themes remain sharp in Lounge and quieter in normal mode.
- [ ] Review/install/remove/restore a small addon and module; denied permissions stay denied.
- [ ] Optional real Skraper export, ScreenScraper account and RomM server workflows preserve library data and user-reviewed import/download boundaries.
- [ ] Reviewed artwork changes and Journey progress save correctly; FiFi responses are complete and privacy bounded.
- [ ] Fresh launch has no intro, production has no F8/F9 development overlay, and no accidental game launches occur.

Record version, Build ID, exact steps and evidence for every failure. Crashes, private-game exposure and unauthorized launches block publication.
