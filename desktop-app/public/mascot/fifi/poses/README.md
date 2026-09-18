# FiFi pose kit

Status: **live supporting pose kit; the articulated rig is the primary in-app visual**.

The separate live animation rig is now implemented in `../fifi-rig.js`.
Open `../studio.html` to try its independently moving body parts and digital
eyes. These full-pose PNGs remain reference/key-pose assets; the live rig uses
the separately generated parts in `../rig/`.

These assets are the supporting visual kit for mascot **FiFi**. They are
not imported by the application yet, so they cannot replace or affect Fungist.
Every PNG is a real-alpha transparent sprite and may be used over any NEO-LIB
theme now that FiFi is deliberately available in the mascot selector.

## Pose and event map

| Asset | Intended use | Motion layer when implemented |
| --- | --- | --- |
| `fifi-idle-v1.png` | Normal resting companion state | Slow 2–4 px hover, gentle scale breathing, low glow pulse, occasional blink. |
| `fifi-wave-v1.png` | First greeting, welcome back, opening chat | 0.45 s lift-in, tiny side-to-side wave, two short sparkle pulses. |
| `fifi-thinking-v1.png` | Searching the library, analysing a game, composing a reply | 3–5° thoughtful tilt, floating geometry drifts slowly, no looping sound. |
| `fifi-alert-v1.png` | Important update, high usage, or a player-approved notice | Brief 1.5 s attention pulse, then return to idle; never repeat or interrupt Rest Mode. |
| `fifi-sleep-v1.png` | Rest Mode or a game is actively running | Slow, dim hover and very low opacity glow; no voice or ambient animation. |
| `fifi-fly-v1.png` | Flying to a Launch button or returning from an action | Use only during a short path animation, then return to the player's saved mascot position. |
| `fifi-celebrate-v1.png` | A finished task, successful import, or positive rating | One short pop/rotate with decaying sparkles; not for routine clicks. |
| `fifi-listening-v1.png` | The chat is open and FiFi is ready to help | Lift above the chat panel, relaxed float, no overlap with buttons or input. |
| `fifi-concern-v1.png` | A recoverable error or help suggestion | Gentle arrival with a quiet, readable notice and a useful next action. |

## Animation rules

- Keep FiFi out of the interaction layer: no sprite, glow, particles, or speech
  bubble may cover a button, field, menu, tooltip, or dialog.
- Preserve the player-dragged anchor position locally. Action motions depart
  from, and return to, that saved anchor.
- Respect mascot off, voice off, reduced motion, FX intensity, and Rest Mode.
- Use the sprites as expressive key poses; CSS transforms and small separate
  particle layers provide the in-between motion rather than rapidly swapping
  images.
