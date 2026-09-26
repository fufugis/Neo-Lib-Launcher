# NEO-LIB theme package format (v1)

This is the first, non-executable theme format. All 16 built-in themes now use
the same `theme.json` and `assets/` layout under `src/themes/stock/<theme-id>/`.
For a complete example, inspect `src/themes/stock/anime/theme.json`.

Theme Studio now accepts a player-selected `theme.json`, shows its name,
attribution, tone, colour swatches and image count for review, and installs a
copy under NEO-LIB's own user-data `themes/<id>/` folder. Installed themes
appear in Theme Studio on later launches. Do not put a custom folder into the
app's installed `resources` directory; updates may replace it. A rebuilt
Windows app interaction test is still required before release.

## Folder and identity

```text
my-theme/
  theme.json
  assets/
    atmosphere.png
    foreground.webp
    optional-motion.gif
    optional-motion-still.png
    firefly.png
```

`schemaVersion` is `1`. `id` is a 2–64 character lowercase slug and becomes
the installed folder name. `name` is the visible title (1–80 characters). `tone` is `bright`,
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
| `canvas` | Main gradient behind the UI (`from: "grad1", to: "grad2"`), or a still image blended with that gradient. |
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

Animated layers require a local still `reducedMotionAsset` (PNG/JPG/WebP). The global `motion`
object declares `cadence: "calm" | "normal" | "energetic"` and
`reducedMotion: "still"`. The installer now accepts a bounded GIF89a only for
`layers.atmosphere` or `layers.canvas`, with `loop: "once"`, `"always"` or `"while-visible"` and a required
still fallback. A GIF must declare an infinite loop inside the file; NEO-LIB
cannot reliably rewrite a GIF's own loop count. `always` keeps it mounted while
NEO-LIB is awake; `while-visible` swaps to the still when the window is hidden
and restarts it on return. Calm motion and Windows reduced motion also use the
still, and Rest Mode unmounts animated media. At most one of Canvas and
Atmosphere may animate in a theme; every other artwork layer remains still-only.

`once` uses the GIF's checked frame delays to show one cycle, then switches to
the still. The total cycle must be at most 20 seconds. If the window hides or
reduced motion is requested before it ends, NEO-LIB switches to the still
without replaying that cycle. A newly selected GIF shows its one-shot preview
after saving, when native timing validation has run.

Canvas or Atmosphere video uses `{ "type": "video", "asset": "assets/motion.webm",
"reducedMotionAsset": "assets/still.png", "loop": "while-visible" }`. WebM is
the only video format accepted in this first pass. `loop` can be `once`
(return to the still when finished), `always` (loop while awake, pause when
hidden), or `while-visible` (show the still when hidden and restart on return).
Playback is muted. The local file is capped at 8 MB and the package at 12 MB.
The browser must report a finite 0.5–20 second duration and dimensions no
larger than 1920×1080 before video appears; unsupported media stays on the
still. Calm, Windows reduced motion, Effects None and Rest Mode suppress it.
For Canvas, the still image remains the shell background while GIF/WebM plays
behind every interactive surface. This keeps a readable fallback during decode,
when hidden, after a one-shot ends, and whenever animation is off.

GIF packages are limited to 2 MB per asset and 12 MB total, 1920×1080 logical
dimensions, 2–60 frames, 24 million aggregate frame pixels and at least 50 ms
per frame. The still fallback is separately validated. The [GIF89a block
format](https://www.w3.org/Graphics/GIF/spec-gif89a.txt) informs structural
checks; NEO-LIB does not run theme-authored code. Built-in particle/illustration effects remain controlled by
NEO-LIB's existing FX slider, reduced-motion settings and Rest Mode.

## Creator-controlled particles (first FX module)

Add an optional `effects.particles` array to `theme.json`. Each entry uses a
local transparent PNG or WebP (JPG is accepted but cannot have transparency).
Crop the image fairly close to the visible shape: `sizePx` controls the whole
image box, including transparent margins. NEO-LIB owns the animation; the
theme supplies settings, not CSS or code.

```json
"effects": {
  "particles": [
    {
      "id": "fireflies",
      "asset": "assets/firefly.png",
      "count": 16,
      "sizePx": 24,
      "opacity": 0.55,
      "durationSeconds": 18,
      "direction": "rise"
    }
  ]
}
```

Choose `rise`, `fall`, or `drift`. Up to three emitters can use different
images and settings. Each emitter permits 1–24 particles, 4–80 px artwork,
opacity 0.05–1, and 5–60 seconds per path. Their total density scales down
with Low/Medium/Balanced/Calm Effects settings and reaches zero at None.
Particles stay behind the UI, stop in Rest Mode and disappear when Windows
requests reduced motion. Themes without `effects` keep the generic accent
particles. This is deliberately a first FX vocabulary, not the full creator:
Each emitter may also specify `placement` (`full`, `start`, `middle`, `end`),
`depth` (`near`, `far`), integer `rotation` (-180–180 degrees), and integer
`glow` (0–20 px). These fields are optional; older theme packages keep their
previous full-screen, near-depth, unrotated, unlit appearance. Placement is
left-to-right for rising/falling art and top-to-bottom for drifting art. Far
art is smaller and dimmer, never in front of UI.

An emitter can optionally set `reaction` to `ambient` (the default), `launch`
or `celebrate`. A launch or celebration emitter plays a bounded, one-shot burst
instead of continuously animating. `celebrate` uses NEO-LIB's existing
completion/celebration signal; `launch` uses a successful game launch. Rest Mode,
Effects None and reduced motion still suppress all theme particles. Since
automatic Rest Mode normally starts immediately on launch, launch bursts are
visible only when the app remains awake; they are never replayed after waking.
The Theme Creator Lab has a **Preview burst** button for either event.

## Particle FX Lab in Theme Studio

Open **Theme Creator Lab** in Theme Studio. Start from the built-in blank
starter, or select an installed custom theme to remix. Enter your name, a new theme name and a
new lowercase ID and tone. You can edit all palette/panel colours, choose PNG/JPG/WebP
artwork for the atmosphere, sidebar, decoration, navigation frame/flourish and control frame,
remove these layers or adjust their opacity. Canvas and Atmosphere also have **GIF + still**
and **WebM + still** pickers, each with once, visible-only and while-awake choices.
Only one full-screen layer may animate in a saved theme. You can add a particle
image, or adjust each emitter's reaction, direction, placement, depth, rotation, glow, count, size, opacity and
duration while watching a small live preview. **Save as new theme** validates
and copies the result into a new
user-data folder; it never edits or replaces the source. A saved remix keeps
the original artwork attribution and adds your creator credit. A source image
from another artist still requires their permission to redistribute.

Canvas starts as a two-colour gradient controlled by the gradient colour pickers.
Creators can replace it with a PNG/JPG/WebP image, adjust image opacity over
the same gradient, or restore the gradient. The native remix copies and checks
the image; it never changes the source theme. Creators can also choose a bounded
Canvas GIF/WebM and required still. Effects None, Calm, reduced motion and Rest
remove Canvas animation but retain the still background.

## Validation and next stage

`npm run test:themes` checks built-in folders and the custom-theme install
service before a renderer build. A custom manifest is limited to 32 KB; each
still image or GIF to 2 MB, video to 8 MB, and the package to 12 MB. Media must match its file
type, cannot be symlinks, and only declared `assets/<filename>` files are
copied. Existing IDs are not overwritten. An invalid or modified installed
theme is skipped at load. The remaining custom-theme stage is live Windows
visual, animation-timing, video-decoder and performance acceptance, followed
later by additional declarative FX.
No executable plugin code is part of theme v1.
