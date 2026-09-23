# Build NEO-LIB for Windows

Players should normally use the installer or portable package on the
[NEO-LIB Releases page](https://github.com/fufugis/Neo-Lib-Launcher/releases/latest).
These instructions are for contributors and people who deliberately want to build
the source themselves.

## Requirements

- Windows 10 or 11, x64
- a supported Node.js release with npm
- enough free disk space for Electron dependencies and Windows artifacts
- PowerShell

## Install dependencies

From the repository root:

```powershell
cd desktop-app
npm ci
```

`npm ci` uses the committed lockfile and is preferred over changing dependency
versions during a release build.

## Verify the source

```powershell
npm run prebuild:renderer
```

This runs the release configuration, security boundary, renderer, storage, launcher,
metadata, visual, widget, and packaging-preflight checks. It does not replace a real
installed-app test.

## Create the installer

```powershell
npm run build:win
```

The NSIS installer is written to `desktop-app/dist` with a name such as:

```text
NEO-LIB-Setup-1.7.9.exe
```

## Create the complete release artifact set

```powershell
npm run build:release
```

That release path prepares the renderer and creates the artifacts expected by the
GitHub workflow, including the Windows installer, portable ZIP, candidate report,
and checksum file.

## GitHub Actions

The `build-windows` workflow intentionally does **not** run on every normal push.
Start it manually from the Actions page while testing, or push an exact version tag
when producing a candidate. This avoids noisy and expensive packaging runs during
ordinary development.

After the workflow succeeds:

1. Download and inspect the produced `NEO-LIB-Windows` artifact.
2. Install over an existing copy and also test a clean install.
3. Complete [`../WINDOWS_ACCEPTANCE_V1.7.9.md`](../WINDOWS_ACCEPTANCE_V1.7.9.md).
4. Publish only when the artifact, tag, release notes, checksums, and observed app
   version all agree.

## Player data

Uninstalling or upgrading must not silently delete the player's library. The current
NSIS configuration keeps application data during uninstall. Back up important local
data before testing migration or cleanup behavior.

## Troubleshooting

- A browser preview cannot validate native Electron features.
- If packaging reports a stale or missing renderer, run `npm run build:renderer` and
  repeat the candidate build from clean source.
- If native build tools cannot start in a managed sandbox, use a normal Windows shell
  or the checked-in GitHub Actions workflow.
- Unsigned builds may trigger Windows reputation or antivirus warnings. Do not claim
  that a build is signed unless the produced executable has been verified.
