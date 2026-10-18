# NEO-LIB v1.8.10 — Wizard folder scan hotfix

- Fixed a Wizard Folder scan crash when reviewing detected game genres and tags.

## Windows installer rebuild

The installer remains **NEO-LIB-Setup.exe**. Existing clients can discover v1.8.10
through normal update checks or Settings → Updates. Nothing installs automatically.
Builds remain unsigned.

## Carried-forward features

Includes v1.8.9 and its missing-artwork crash fix. This isolated patch corrects
Wizard's genre display contract; it does not reset library data or include any
unpublished visual/editor features. Automated Windows release checks now exercise
the actual Wizard folder-scan, metadata-review and explicit-accept path.
[Previous release notes](RELEASE_NOTES_v1.8.9.md).

## Release status

Publication requires the clean v1.8.10 Windows build, candidate inspection and all
four verified assets. Physical installed acceptance is tracked separately in
[Windows acceptance](WINDOWS_ACCEPTANCE_V1.8.10.md).

Stable download: https://github.com/fufugis/Neo-Lib-Launcher/releases/latest/download/NEO-LIB-Setup.exe
