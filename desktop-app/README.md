# NEO-LIB desktop application

This directory contains the active NEO-LIB Windows application: an Electron host,
a React/Vite renderer, local services, build resources, release scripts, and focused
verification checks.

For the player-facing product overview, downloads, supported sources, privacy model,
and roadmap, see the [main README](../README.md).

## Local development

Requirements:

- Windows 10 or 11, x64
- a supported Node.js release
- npm

```powershell
npm ci
npm run dev
```

Development mode starts Vite and opens the Electron application. Browser-only Vite
preview is useful for some visual work, but it cannot prove Electron IPC, native file
pickers, launcher imports, process watching, or packaged-app behavior.

## Verification

Run the complete renderer source gate before packaging:

```powershell
npm run prebuild:renderer
```

Focused checks are also available through the `test:*` scripts in
[`package.json`](package.json). They avoid launching games, changing launcher data,
or scanning unspecified drives.

## Build a Windows candidate

```powershell
npm run build:win
```

Electron Builder writes the installer to `dist`. The GitHub Actions workflow also
produces the installer, portable ZIP, release-candidate report, and checksums when run
manually or from an exact version tag.

See [INSTALL.md](INSTALL.md) for the complete build and artifact guide. A passing
source gate is not a replacement for the installed-app checklist in
[`../WINDOWS_ACCEPTANCE_V1.7.9.md`](../WINDOWS_ACCEPTANCE_V1.7.9.md).

## Important directories

- `electron/` — native host, IPC registry, local services, and launcher adapters
- `src/` — React interface and renderer-owned state
- `scripts/` — verification, packaging, and release-candidate tools
- `public/` — renderer assets that are intentionally shipped
- `build/` — installer icons and NSIS customization
- `dist-renderer/` — generated renderer build; do not edit by hand
- `dist/` — generated Windows artifacts; do not commit

## Release identity

Keep these aligned for a release candidate:

- `package.json` version
- in-app About and changelog version
- update discovery version
- workflow tag and release-note path
- root release notes and Windows acceptance checklist

The release-hardening checks fail when those identities drift or a stale renderer is
about to be packaged.

## License

See [LICENSE](LICENSE). The repository being readable does not automatically grant
permission to redistribute NEO-LIB or modified builds.
