# NEO-LIB v1.7.9 Windows acceptance record

This record separates automated source evidence from checks that require a
rebuilt Windows app. Do not publish v1.7.9 until release-blocking checks pass or
have a written accepted deferral.

## Candidate identity

- [ ] `npm run build:release` completed from current source.
- [ ] Installer and portable folder came from the same renderer generation.
- [ ] `npm run inspect:release` passed and produced `dist/release-candidate-v1.7.9.json`.
- [ ] `dist/SHA256SUMS-v1.7.9.txt` lists installer and portable ZIP.
- [ ] Settings → About shows version `1.7.9`.

## Automated gate

- [x] Focused visual-boundary checks pass.
- [x] Renderer-binding checks pass.
- [x] Metadata workflow checks pass.
- [x] Clean update contract expects exact tag `v1.7.9`.
- [x] 85 native commands have one registration and request/response contracts.
- [ ] Candidate inspector passes against the newly built package.

## Windows interaction

- [ ] Wizard opens and offers manual add, folder scan, launcher import and
  existing-library refresh actions.
- [ ] Refresh missing metadata and full metadata preserve the existing review
  and confirmation flows.
- [ ] Wall hides the Library pane and fills the workspace.
- [ ] Wall switches between cover and detailed-list views.
- [ ] Cover titles and rating badges remain readable at dense sizes.
- [ ] Home and Library return actions restore the normal sidebar.
- [ ] Locked games remain hidden in Wall until their category is unlocked.
- [ ] Control Center gear opens on the first click.
- [ ] Delayed hover text remains entirely inside every screen edge.

## Steam update truth

- [ ] With a known fully updated installed Steam game, no stale update card is shown.
- [ ] With a genuine queued or active Steam download, the update card is accurate
  and **Open downloads** opens Steam’s Downloads page.

## Publication

- [ ] All release blockers pass or have an accepted deferral.
- [ ] Commit and push accepted source.
- [ ] Create/push exact clean tag `v1.7.9`—never `v.1.7.9`.
- [ ] GitHub Release is non-draft and contains installer, portable ZIP, evidence
  JSON and checksum file.

Acceptance owner/date: `____________________________`
