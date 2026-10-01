# NEO-LIB v1.8.3 Windows acceptance record

This candidate is a versioned rebuild of the current source. Automated source
checks do not replace installed-app verification. All Windows interaction checks
remain pending until performed against the v1.8.3 installer.

## Candidate identity

- [ ] Build the installer from the current source and verify Settings shows version `1.8.3`.
- [ ] Record the installer SHA-256 and Build ID.
- [ ] Confirm the release candidate inspector reports version `1.8.3` and the expected renderer provenance.

## Automated gate

- [ ] The complete `prebuild:renderer` suite passes for v1.8.3.
- [ ] 108 native commands have one registration and request/response contracts.

## Windows interaction

- [ ] Control Center gear opens on the first click.
- [ ] Delayed hover text remains entirely inside every screen edge.
- [ ] On a known fully updated installed Steam game, confirm update discovery does not claim an update is available.
- [ ] With a genuine queued or active Steam download, confirm the game update status is reported accurately.
- [ ] Open downloads and verify the action opens the expected Steam downloads view.

For every failure, record version, Build ID, exact steps, expected and actual
results, and a screenshot. Crashes, private-game exposure and accidental game
launches are release blockers.