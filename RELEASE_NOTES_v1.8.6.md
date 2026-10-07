# NEO-LIB v1.8.6 — Windows release recovery

## Windows installer rebuild

The Windows installer is **NEO-LIB-Setup.exe**, without a version in its filename. Internal version, provenance and checksum records identify v1.8.6. This patch preserves the published v1.8.5 tag and includes its features with corrected Windows release verification.

Windows short TEMP aliases and canonical paths now compare by file identity. Release-order checks accept both LF and CRLF. Runtime path confinement, permissions and installer naming are unchanged.

Stable website download: https://github.com/fufugis/Neo-Lib-Launcher/releases/latest/download/NEO-LIB-Setup.exe

## Carried-forward features

- Playtime pie widget in Home and Lounge, with title, hours, launcher, Journey, favourites and recent-activity filters. Lifetime minutes are explicit and Other preserves totals.
- Official detached Lounge module and opt-in coded addons/custom modules, with reviewed permissions, isolated pages and recoverable removal.
- Optional Skraper exports, ScreenScraper identification and your own RomM server; review before imports/downloads. No bundled ROMs, BIOS or emulators.
- Original 5504×3072 Moonlit Arcana and Cosmic Citadel artwork, sharp in Lounge and gently softened in desktop mode.
- Emulator carousel size/width controls, visibility checkmarks and grey unconfigured consoles.
- Simplified Visuals/Settings navigation, themed addon buttons and accessible Modules navigation.
- Artwork zoom anchors, matching light-source projection and highlight pulse fixes.
- Broader reviewed artwork choices, visible Journey progress controls and corrected privacy-bounded FiFi responses.

## Release status

The v1.8.5 builds failed in verification before packaging. This corrective candidate runs the complete source gate, credential-configured renderer build, Windows packaging and actual-package provenance/checksum inspection before assets are published. Publication and installed-app acceptance are separate: source or package checks do not certify smooth animation, real provider accounts or physical-controller behaviour.

See [WINDOWS_ACCEPTANCE_V1.8.6.md](WINDOWS_ACCEPTANCE_V1.8.6.md) for the acceptance record.
