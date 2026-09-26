# Release hardening checklist

Stage 9 separates facts proven by source checks from behavior that still needs a
rebuilt Windows app. Passing the source gate does not mean a release is packaged
or visually accepted.

## Previous package evidence

- The v1.7.5 installer was rebuilt September 17, 2026 at 01:00 local time.
- Runtime fingerprint: `3EED3299FF39` (`Stage 9A source-hardened`).
- Installer SHA-256: `F1C4433294D93073BAE28632ECB40D4C71F688484812B58EE8A3AEA9AE486E46`.
- Internal inspection passed for current renderer markers, exact native-source
  match, Settings build information, FiFi development assets and inactive voice
  pack. This is package-content evidence only; the Windows acceptance below is
  still required.

That package predates the current v1.8.0 source and must not be presented as the
architecture-finished candidate. The next accepted artifacts require a fresh build,
new fingerprint/checksum and the exact clean GitHub release tag `v1.8.0`. This clean
tag is part of backward compatibility: installed v1.7.3 recognizes `v1.8.0`, while
its historical parser does not recognize the dotted `v.1.7.5` form.

## Automated source gate

The current v1.8.0 build identity is generated from source at build time and carries
architecture label `Stage 9B source-frozen`. The complete source gate passes. The
managed Codex environment cannot start Vite's esbuild child process (`spawn
EPERM`), and the package freshness hook correctly rejects the older renderer as
stale. Build the renderer and packages from an unrestricted Windows terminal before
performing any installed acceptance below.

After an unrestricted build, run `npm run inspect:release`. It refuses a missing or
wrong-version installer, stale renderer, changed native main process, missing package
entry/icon, missing mascot/voice asset, packaged `.env`, known credential signature,
incorrect feedback configuration or incorrect generated Discord App ID, then records
installer, portable ZIP and archive SHA-256 evidence in `dist/release-candidate-v1.8.0.json`.
The evidence records only whether integrations are configured, never their values.
It also hashes the portable ZIP and uses repository-relative artifact paths so an
uploaded report cannot reveal the local Windows account or checkout location.
GitHub Actions refuses missing/invalid feedback settings before building, generates
optional numeric-only Discord configuration before provenance, runs the same inspector
and retains that JSON beside the installer and portable ZIP.
Record the human checks in `WINDOWS_ACCEPTANCE_V1.8.0.md`.

- Run `npm run prebuild:renderer` from `desktop-app`.
- Confirm the release-hardening check reports aligned versions, valid package
  entry points/assets, resolvable local modules, one top-level declaration per
  runtime file, no retired helpers and a present ownership map.
- Confirm Settings → About shows the expected short build ID, architecture label,
  revision and build time. Electron Builder must report the same renderer ID; its
  `beforePack` hook must refuse a missing or stale `dist-renderer`.
- Run `git diff --check` and review every changed file.
- Create a source archive and record its SHA-256 checksum.

## Required Windows acceptance

- Run `npm run build:release` in an unrestricted Windows session. It builds one
  renderer generation, creates the installer and zipped portable folder through
  the same path used by GitHub, then runs candidate inspection. Its guarded
  driver removes the temporary renderer `.env` even if compilation fails.
- Start once with a clean disposable AppData directory, finish onboarding, add a
  harmless fixture, restart and confirm it persists.
- Upgrade a copied older profile and confirm its exact pre-migration `.bak`,
  library, settings, playtime, private categories and custom fields.
- Exercise launcher import cancellation, metadata refresh cancellation, News,
  Home storage and update scans; no operation may remain an endless spinner.
- Verify launch authorization, duplicate-instance protection, game exit detection
  and automatic low-use recovery with a harmless executable fixture.
- Inspect ordinary/private Home, Library, Wall and Preview states at normal and
  reduced widths, keyboard focus, reduced motion and every theme family.

## Performance record

Use the same release build, Windows account and representative library for each
comparison. Record machine/Windows version and library size alongside:

- cold start: click to usable Library/Home;
- idle: NEO-LIB CPU and working-set RAM after five untouched minutes;
- Library: time to show and scroll a representative large category;
- low-use mode: CPU and working-set RAM before a game, while resting and two
  minutes after the game exits.

No target is invented before a trustworthy baseline exists. Record raw results
and compare with the previous known-good build on the same machine.

## Rollback

1. Stop the candidate before changing user data further.
2. Keep the failed AppData folder as evidence; do not overwrite it with a clean run.
3. Restore the previous source/build archive identified by its recorded checksum.
4. For a migration failure, restore the exact document `.bak` created before
   migration, then reopen only with the previous known-good build.
5. Record which acceptance step failed and do not label the candidate release-ready.
