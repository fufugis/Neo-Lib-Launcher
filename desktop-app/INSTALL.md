# Develop and build NEO-LIB for Windows

Players should normally use an attached installer or portable package from
[Releases](https://github.com/fufugis/Neo-Lib-Launcher/releases).
This is the canonical source-build guide; the main READMEs link here.

## Requirements

- Windows 10 or 11, x64, and PowerShell
- Node.js 22 with npm (the version used by Windows CI)
- Yarn Classic 1.x, matching the committed `yarn.lock`
- Free space for Electron dependencies and Windows artifacts

## Install dependencies and run locally

From the repository root:

```powershell
cd desktop-app
yarn install --frozen-lockfile
yarn dev
```

Development starts Vite and Electron together. Browser-only Vite preview cannot
prove native file pickers, IPC, imports, process watching or packaged behavior.
Use the existing Yarn lockfile; `npm ci` requires a package-lock that this repository
does not provide.

## Verify source changes

```powershell
yarn prebuild:renderer
```

This runs source, native-service, renderer, storage, launcher, visual, widget
and release-preflight checks. It does not replace installed-app acceptance.
Focused `test:*` commands are listed in [package.json](package.json).

## Configure and build a release candidate

Official packaging requires these operator-provided environment settings:

- `NEOLIB_FEEDBACK_RELAY_URL`: an HTTPS feedback relay URL ending in `/feedback`.
- `NEOLIB_FEEDBACK_RELAY_KEY`: its authorized client signing key
  (32–256 URL-safe characters).
- `NEOLIB_DISCORD_APP_ID`: optional numeric Discord application ID.
- `VITE_USAGE_ENDPOINT`: the public optional-reporting collector endpoint when
  building with reporting configured; official CI supplies this separately.

Use your authorized deployment configuration, not placeholder credentials.
Never commit environment files or put private Cloudflare/admin credentials or a
Discord webhook into renderer settings. Relay setup is documented in the
[feedback relay guide](cloudflare-relay/README.md).

The release driver generates a temporary `desktop-app/.env` and removes it after
the renderer attempt, even on failure. It overwrites that file: preserve any
existing local `.env` before starting. Keep personal development overrides separate
and review them so they do not override intended release configuration.

Once configured, run:

```powershell
yarn build:release
```

This runs renderer verification/build, Windows installer and unpacked builds,
portable packaging and candidate inspection. It does not publish a GitHub release.
The complete artifact set in `desktop-app/dist/` is:

- `NEO-LIB-Setup.exe` — fixed installer name for every version
- `NEO-LIB-windows-portable.zip`
- `release-candidate-v1.8.7.json` — versioned inspection evidence
- `SHA256SUMS-v1.8.7.txt` — versioned checksums

Future versions keep the first two names and update the versioned evidence names.
`yarn inspect:release` regenerates inspection evidence using the current environment;
retain the same release configuration when repeating it.

The stable website link works only when GitHub's latest completed release has the asset:
[Download latest installer](https://github.com/fufugis/Neo-Lib-Launcher/releases/latest/download/NEO-LIB-Setup.exe).
An empty release page or a tag alone is not a successful build.

## GitHub Actions and acceptance

The [Windows workflow](../.github/workflows/build-windows.yml) runs manually or on
version-tag pushes, not ordinary main-branch pushes. A release tag must exactly
match `package.json` (currently `v1.8.7`). A manual run builds downloadable workflow
artifacts; the tag flow stages a draft release, verifies its four assets and then
publishes it as the latest stable release.

Before treating a candidate as accepted:

1. Inspect the installer, portable ZIP, candidate report and matching checksums.
2. Confirm About, Build ID, package version, tag and notes agree.
3. Test a clean install and an upgrade with backed-up player data.
4. Record actual results in the
   [1.8.7 Windows acceptance checklist](../WINDOWS_ACCEPTANCE_V1.8.7.md).

Do not infer installed-app success from source checks or publish incomplete assets.
See [release hardening](../RELEASE_HARDENING.md) for the release policy.

## Player data and troubleshooting

The current NSIS configuration preserves application data on uninstall.
Back up important local data before testing upgrades or migrations.

If packaging reports a stale renderer, rebuild the complete candidate from the
intended source and configuration; do not bypass the provenance check.
Unsigned executables may trigger Windows reputation warnings. Code signing is
not claimed unless verified on the produced executable.
