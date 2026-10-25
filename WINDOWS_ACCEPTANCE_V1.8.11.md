# NEO-LIB v1.8.11 Windows acceptance record

## Build and publication

- [x] Full source gate: native commands have one registration and request/response contracts.
- [x] Production renderer and isolated interaction regressions pass (7.97s build; compiled-app smoke, Wizard, history, editors, reminders, Tools, news, external sessions and sidebar).
- [x] GitHub Windows installer/portable packaging and candidate inspection pass.
- [x] Four public assets, checksum manifest and latest stable downloads agree.

## Published build identity — 2026-10-25

[GitHub run 40184835362](https://github.com/fufugis/Neo-Lib-Launcher/actions/runs/40184835362)
completed successfully from tag/source 8c69bfb80d9aeda510554d42c488b0672c8be277.
Public latest is v1.8.11, non-draft/non-prerelease, with all four nonempty assets.
Build C6366D6ED60B; 480 ASAR entries; 80 mascot assets; feedback/Discord configured.
Report, checksum manifest and GitHub digests/byte counts agree. Fixed-name latest
installer and portable HEAD requests return HTTP 200. The unchanged shipped
update checker detects live 1.8.11 for 1.8.10 and selects the exact installer.

- Installer: 251782818 bytes; SHA-256 4139497150A3AC5116C9DA345008B8DEB9F1E637352F91F51E38024353C4FC09.
- Portable ZIP: 284695791 bytes; SHA-256 A77F031FCE78D14265199ECC2BD8553C444D481C9FE3B498B60D4E6ABD50DB27.

An earlier unpublished run failed a CRLF-sensitive source assertion. That test
now normalizes Windows newlines, passes LF/CRLF, and the replacement run passed.
Neither complete binary was downloaded or executed locally; server digests and
package-inspector evidence do not replace the hands-on checks below.

## Installed Windows interaction — pending

- [ ] Control Center gear opens on the first click.
- [ ] Delayed hover text remains entirely inside every screen edge.
- [ ] Import games through Wizard Folder scan; missing artwork never crashes preview.
- [ ] Upgrade preserves existing Library/settings and displays the newest notes first.
- [ ] Patch history lists the latest five releases; older hotfixes stay readable.
- [ ] Home editor, calendar reminders, preview editor and sidebar controls work with physical input.
- [ ] External launcher gameplay records correct minutes and safely resumes after sleep.
- [ ] On a known fully updated installed Steam game, confirm no false update.
- [ ] With a genuine queued or active Steam download, verify status and Open downloads.
- [ ] Installer Finish behavior, real sound, Lounge and controller remain intact.

No real player profile has been modified or installer executed during preparation. Automated fixtures do not certify these hands-on items.
