# FiFi animation rig

Open `studio.html` directly in a browser to try the live rig. All files and art
are local; the studio does not access the library, launch games, or play audio.

The studio now includes a selector for all 27 voice performances, a silent
rehearsal button and duration control. `voice-scripts.js` contains the executable
per-line mapping; `VOICE_SCRIPT.md` explains each line, trigger, gesture and
particle choice. Timings are normalized drafts, not measured speech alignment.
Nine personal FX styles are available, with at most six particles per rig.

Implemented: independent digital pixel eyes and blinking at randomized 3.2–7.4
second intervals, bounded pointer gaze, gentle breathing/hover, four separately
hinged fins, two swaying data tendrils, slow inner light movement, and twelve
expression/gesture states. Greeting, celebration and alert return to idle in
the studio. The fly-and-return preview returns to the saved, clamped drag anchor.
Whole-body opacity is never animated.

Rest Mode, pause, reduced motion, an offscreen rig, and a hidden document stop
animation and blink timers. Disconnecting the component removes its observers,
listeners and timers. Reduced motion still shows the selected expression.

## Reuse in the launcher

`src/components/FifiAvatar.jsx` is the React adapter. Props: `mood`, `size`,
`motion` (`balanced`, `full`, `reduced`), `rest`, `paused`, `fx` (0–1), and
`energy` (0–1 visual speech intensity).

Additional props: `particles` overrides the mood's particle style, `speaking`
animates the face while preserving its expression, and `gesture` accepts `nod`,
`double-nod`, `bow` or `present`. Omit them for the usual mood behaviour.

Assets resolve relative to Vite's base
for packaged Electron. The rig uses a shadow root to isolate its CSS and
`pointer-events:none` to avoid intercepting controls. Host layout must reserve
enough room around the rig; pointer transparency alone does not prevent visual
overlap. The host owns drag anchoring, flight paths and voice lifecycle.

FiFi is not yet connected to the mascot picker or live launcher events. The
FiFi's separate 27-line voice pack is active only when FiFi is selected. Talking
uses the shared mascot host to feed `energy` while
audio plays. No microphone or audio analyser is created here.

## Assets and verification

`rig/body-v1.png`, `rig/fin-v1.png` and `rig/tendril-v1.png` were generated with
the built-in image tool from FiFi's idle reference. Their corner alpha was
checked. The existing nine pose PNGs remain available under `poses/`.
Prompt text is stored in `rig/PROMPTS.md`.

Run `node scripts/verify-fifi-rig.cjs` from desktop-app for controller lifecycle,
asset, CSS and React adapter checks. These are not browser rendering tests.
Run `node scripts/verify-fifi-voice-scripts.cjs` for exact coverage of all 27
filenames, valid phases and rehearsal replacement/cancellation/completion.
The local-file preview was blocked by the browser tool's URL security policy;
rendering, real animation feel and resize/drag acceptance remain unverified.
