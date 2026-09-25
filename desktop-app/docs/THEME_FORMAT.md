# NEO-LIB theme package format (v1)

This is the first, non-executable theme format. All 16 built-in themes now use
the same `theme.json` and `assets/` layout under `src/themes/stock/<theme-id>/`.
For a complete example, inspect `src/themes/stock/anime/theme.json`.

Community-theme installation is **not enabled yet**. The Theme Studio button
remains disabled until user-folder discovery, preview, import review, and
Windows acceptance are complete. Do not put a custom folder into the app's
installed `resources` directory; updates may replace it.

## Folder and identity

```text
my-theme/
  theme.json
  assets/
    atmosphere.png
    foreground.webp
    optional-motion.webm
    optional-motion-still.png
```

`schemaVersion` is `1`. `id` is a 2–64 character lowercase slug and must match
its folder. `name` is the visible title (1–80 characters). `tone` is `bright`,
`middle`, `dark`, or `special`. Every package declares `license.name` and
`license.attribution`; creators are responsible for the rights to all assets.

## Colour tokens

Each token is an integer RGB triplet (`[red, green, blue]`, channels 0–255).
`palette` declares `ink`, `muted`, `accent`, `accent2`, `accentSoft`,
`hairlineGlow`, `grad1`, `grad2`, `accentText`, and `accent2Text`.
`panels` separately declares `surface`, `panel`, and `border`. These are named
UI layers, not arbitrary CSS strings. Text accents can differ from decorative
accents so bright themes remain readable.

## Named visual layers

Every theme declares these names under `layers`:

| Layer | Purpose |
| --- | --- |
| `canvas` | Main gradient behind the UI (`from: "grad1", to: "grad2"`). |
| `atmosphere` | Decorative backdrop image. |
| `sidebar` | Quieter artwork in the Library sidebar. |
| `decoration` | Special-theme ambient ornament. |
| `navigationFrame` | Artwork around navigation buttons. |
| `navigationFlourish` | Small navigation illustration detail. |
| `controlFrame` | Artwork around selected game controls. |

Unused layers must be `{ "type": "none" }`. Image, GIF and video layers
reference a local `assets/<filename>` only; absolute paths, URLs, `..`, CSS,
and scripts are not accepted. Supported still-image formats are PNG, JPG and
WebP; GIF and video are separate types (`gif`, `video`). Opacity is 0–1.

GIF and video layers require `loop: "once"`, `"always"`, or `"while-visible"`
and a local still `reducedMotionAsset` (PNG/JPG/WebP). The global `motion`
object declares `cadence: "calm" | "normal" | "energetic"` and
`reducedMotion: "still"`. Playback controls and package import are reserved
for the later custom-theme player; declaring media does not make current stock
themes play video. Built-in particle/illustration effects remain controlled by
NEO-LIB's existing FX slider, reduced-motion settings and Rest Mode.

## Validation and next stage

`npm run test:themes` checks every built-in folder, declared asset, version,
layer, palette, motion rule and attribution before a renderer build. The next
stage must add a user-owned theme directory, bounded local discovery, an
import/preview screen, clear invalid-package errors, and an explicit choice to
activate a validated theme. No executable plugin code is part of theme v1.
