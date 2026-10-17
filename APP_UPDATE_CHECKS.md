# App release detection

## v1.8.7 preparation update, 2026-10-17

The version-number blocker described in the earlier audit below is now resolved locally: package, renderer, versioned notes and built artifacts identify 1.8.7. Older 1.8.6 comparison and first-run upgrade-note tests pass. The release workflow uploads into a draft, verifies all four nonempty assets and only then publishes the stable release. Candidate DBC15379283B is built/inspected but not tagged, pushed or published; the published latest release remains 1.8.6. Existing-client startup/cache limits still apply.

## Release audit, 2026-10-17

**Do not publish these changes as v1.8.6 again.** Both the local package and GitHub's latest stable release are currently 1.8.6, so existing 1.8.6 installs correctly report no newer version. Prepare a higher package/build/tag version (normally 1.8.7) before release, and publish the stable release only after its installer assets are attached. This audit did not change application code, bump versions, tag, upload or publish anything.

The already-published v1.8.6 source checks at startup only, with a six-hour cache, plus a force-bypassing manual Updates action. It cannot gain hourly checks or the new independent popup until upgraded. Existing continuously open clients therefore cannot be promised immediate notification; manual checking bypasses the old cache. The exact shipped checker source successfully recognized a simulated clean v1.8.7 tag.

Current verification:

- Actual checker in Node and an isolated Electron renderer reached live GitHub: 1.8.5 discovers published 1.8.6; installed 1.8.6 correctly reports no newer release. The exact installer HEAD returned HTTP 200 and 245,718,884 bytes; no executable was downloaded or run.
- Existing update-discovery/checker/news tests pass, including malformed/draft/prerelease responses, cache/version handling, rate-limit and abort recovery, and trusted installer URLs.
- Executed the actual App scheduling effect with a controlled clock boundary: startup check, hourly interval, preservation of a known update on failure, hard-rest suppression, cleanup and rejection of late results pass.
- New isolated diagnostic `node scripts/verify-update-prompt-browser.cjs` renders the real popup with temporary local storage and mocked external opening. Dialog/startup pause deferral, focus, failed-open retry, duplicate-click protection, trusted download callback, saved per-version dismissal, remount, manual reopening, next-release notification and pause/wake all pass. Animations are disabled only in this hidden fixture because hidden-window frame timing is not physical UI acceptance.
- Add `--live` to that diagnostic to repeat the actual renderer GitHub read checks. Its temporary localhost test page/profile never attaches to the running app or user profile.

The notification is not an unattended updater: users choose the external download and installer. Live packaged download/install acceptance, physical animation/controller behavior and discovery in already-installed copies remain separate; GitHub/network availability is required. No claim of a bulletproof or instant universal push system is made.

NEO-LIB checks `https://api.github.com/repos/fufugis/Neo-Lib-Launcher/releases/latest` at startup and hourly while open. Hard Rest/gameplay pauses automatic checks; wake starts a check again. Soft idle still checks. A one-hour per-installed-version cache avoids unnecessary GitHub requests; manual Updates checks bypass it. Requests time out after ten seconds, with no client token, cookies or library upload.

Detection compares the installed package version with a stable published release tag, including historical dotted tags. Drafts, prereleases and malformed results are rejected. Pushing commits alone does not announce an app update: publish a higher-version stable GitHub release with its build assets and a clean `vX.Y.Z` tag.

The standalone **New update available** popup works without mascot notices. It waits until first-run Welcome/tutorial/patch-notes/Wizard, hard Rest/gameplay, detached Lounge and other modal editors/dialogs have cleared. It offers **Download update**, **Release notes** and **Later**. Dismissal is remembered per version; a newer version prompts again. A successful manual check can request the same update again after dismissal. The existing update badge/release link remains.

Download points to that release's exact `NEO-LIB-Setup.exe` asset only when the API asset name, positive size and repository URL match. Without a valid installer, the button opens the release downloads page. Cached URLs are reconstructed/validated, not trusted blindly. Network/rate-limit failures show a manual retry message and do not erase a prior detected update. Downloads open externally only after clicking; no silent download, executable launch or automatic install is performed.

## Verification, 2026-10-12

- Actual checker calling live GitHub: v1.8.5 detects latest v1.8.6; installed v1.8.6 reports no newer update.
- Published installer URL HEAD returns HTTP 200, Content-Length 245,718,884; no installer downloaded or executed.
- Fixtures cover stable versions, cache expiry/current-version/force/future timestamps, URL reconstruction, missing installer, drafts/prereleases/malformed responses, rate limits and request abort/cleanup. Source wiring covers independent popup, modal/startup/game/Lounge deferral, dismissal/manual request and download.
- These checks do not certify a rendered Electron popup, physical keyboard/controller acceptance or packaged update/install behaviour; those remain live acceptance tasks.
