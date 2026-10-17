# NEO-LIB desktop application

This is the active Windows application: an Electron host, React/Vite interface,
local services, build resources and verification checks.

- [Product overview, downloads and current version](../README.md)
- [Local startup, dependencies and Windows build instructions](INSTALL.md)
- [Documentation index](../docs/README.md)
- [Modules](MODULES.md), [addons](ADDONS.md) and [community widgets](../docs/HOME_WIDGETS.md)
- [Retro metadata sources](RETRO_SOURCES.md) and [custom themes](docs/THEME_FORMAT.md)
- [Current Windows acceptance record](../WINDOWS_ACCEPTANCE_V1.8.7.md)

## Directory guide

- `electron/` — native host, IPC, local services and launcher adapters
- `src/` — interface, renderer state and stock themes
- `scripts/` — verification and packaging tools
- `public/` — intentionally shipped renderer assets and privacy notices
- `build/` — installer resources
- `dist-renderer/` and `dist/` — generated output; do not edit by hand or commit

Focused checks are listed as `test:*` scripts in [package.json](package.json).
Browser-only previews cannot validate native Electron or installed Windows behavior.

See [LICENSE](LICENSE) for use and redistribution restrictions.
