# FiFi voice performance script

Status: **mapped, executable in the studio, and connected to FiFi's live selectable mascot voice pool**.

All 27 filenames are mapped exactly once. Wording and tone here are inferred
from filenames, not verified by listening. In particular, truncated names may
omit spoken words. The `[angry]` tags guide a cheeky emphasis, not hostility.

## How a performance runs

The shared `voice-scripts.js` is the authoritative executable script. Each line
has arrival (0%), emphasis (22%), settling (65%), and return to idle (100%).
These are draft proportions, not measured word timestamps. The future audio
host should sample `sample(id, audio.currentTime / audio.duration)` and finish
on `ended` or cancel on mute, disable, error, interruption or Rest Mode.
The studio's `createPreview` uses an explicitly chosen rehearsal duration and
never opens an MP3. Previewing another line replaces the current rehearsal.

Nine restrained particle styles: welcome motes, orbiting scan diamonds, a news
ripple, realization glints, an invitation arc, celebration stars, soft concern
motes, pink gratitude lights, and a short flight trail. Routine acknowledgements
stay particle-free. At most six particles exist, confined to the character rig.
Rest, pause, offscreen/hidden, reduced motion and FX zero suppress particles.

## Future playback rules

Only the selected, enabled FiFi may speak, after the intro and while the app is
visible. Respect mute and Rest Mode, allow one line at a time with a 20-second
minimum gap, and deduplicate welcome/news/update notices by session or source.
These are declared integration rules, not enabled launcher subscriptions.
No automatic idle chatter. Donation lines belong only to an explicit support
panel interaction. The don't-mute line is manual preview only, never a response
to the player muting or disabling the companion.

## Per-line direction

### Welcome to Neo-Lib

- File: `teto-2026-09-06-00-21-[sad]-Welcome-to-Neo-Lib.mp3`
- When: First visible greeting after the intro, once per app session.
- Performance: A gentle arrival, soft eyes, then one welcoming fin wave. No greeting during background resume.
- Sequence: listening → greeting → happy → idle.
- Emphasis particles: hello.

### Look here!

- File: `teto-2026-09-06-00-22-[sad]-Look-here!.mp3`
- When: A useful contextual hint requested by the player.
- Performance: Tilt softly, open the listening fin and send one small beacon from it.
- Sequence: concern → listening → idle → idle.
- Emphasis particles: beacon.

### What is this?

- File: `teto-2026-09-06-00-23-[emphasis]-What-is-this-[short-pause].mp3`
- When: An unfamiliar item in an explicit help or inspection flow.
- Performance: Widen one eye, tilt and orbit three tiny data diamonds. Curious rather than frightened.
- Sequence: curious → thinking → curious → idle.
- Emphasis particles: scan.

### Hmm…

- File: `teto-2026-09-06-00-23-[soft]-[emphasis]-hmm.-[short-pause].mp3`
- When: A substantial player-requested search or reasoning step.
- Performance: Lean to one side; narrow one eye. Slow data orbit, then return attention to the player.
- Sequence: listening → thinking → listening → idle.
- Emphasis particles: scan.

### I am FiFi

- File: `teto-2026-09-06-00-24-[emphasis]-I-am-Fifi-[short-pause].mp3`
- When: FiFi introduction or explicit introduction replay.
- Performance: Lift both upper fins slightly, wave with one, and brighten the cyan eyes on her name.
- Sequence: curious → greeting → happy → idle.
- Emphasis particles: hello.

### Got news for you

- File: `teto-2026-09-06-00-25-[emphasis]-Got-news-for-you-[short-pause].mp3`
- When: Fresh verified news for an eligible visible game.
- Performance: Look attentive, raise a fin and make one cyan signal ripple. No repeated alert for the same story.
- Sequence: listening → alert → listening → idle.
- Emphasis particles: beacon.

### Take a look at this

- File: `teto-2026-09-06-00-25-[emphasis]-Take-a-look-at-this-[short-pause].mp3`
- When: Presenting a result the player asked for.
- Performance: Open a lower fin toward the result; three tiny white-cyan glints punctuate the reveal.
- Sequence: curious → listening (present) → happy → idle.
- Emphasis particles: glint.

### Wanna play a game?

- File: `teto-2026-09-06-00-25-[emphasis]-Wanna-play-a-game-ye-[short-pause].mp3`
- When: Player opens a game recommendation or prepares a launch.
- Performance: An eager lean and open fins, with a small inviting arc. Host may fly toward Launch only within an explicit action.
- Sequence: curious → happy → listening → idle.
- Emphasis particles: invite.

### Can I help you with something?

- File: `teto-2026-09-06-00-26-[emphasis]-Can-i-help-you-with-something-[short.mp3`
- When: Opening FiFi chat.
- Performance: Small greeting wave; settle into attentive eyes above the chat. Leave input and buttons unobstructed.
- Sequence: greeting → listening → listening → idle.
- Emphasis particles: invite.

### Let's do it!

- File: `teto-2026-09-06-00-26-[emphasis]-Lets-do-it!-[short-pause].mp3`
- When: Player confirms a task or launch.
- Performance: A quick lift and fin flare, six bright data stars, then settle. Choreography never launches anything.
- Sequence: listening → celebrate → happy → idle.
- Emphasis particles: burst.

### Ouff

- File: `teto-2026-09-06-00-27-[emphasis]-ouff[short-pause].mp3`
- When: A recoverable task failure.
- Performance: A small recoil, folded fins, two soft fading motes, then a helpful attentive pose.
- Sequence: alert → concern → listening → idle.
- Emphasis particles: soft.

### Aha

- File: `teto-2026-09-06-00-28-[emphasis]-aha[angry].mp3`
- When: An answer or match was found.
- Performance: Open the narrowed eye and give a small realization tilt with three glints.
- Sequence: thinking → curious → happy → idle.
- Emphasis particles: glint.

### More trouble

- File: `teto-2026-09-06-00-28-[emphasis]-More-trouble[short-pause][angry]-[sad.mp3`
- When: An actionable error that needs attention.
- Performance: A restrained skeptical tilt, then soften and face the player. Pair with a useful repair or feedback action.
- Sequence: curious → concern → listening → idle.
- Emphasis particles: soft.

### Oh my God, Neo-Lib has a new update!

- File: `teto-2026-09-06-00-28-[emphasis]-Oh-my-GOD,-Neo-Lib-has-a-new-update!!.mp3`
- When: A newly verified Neo-Lib version, once per version.
- Performance: Wide eyes become happy crescents; flare fins and make one magenta-cyan star burst.
- Sequence: curious → celebrate → happy → idle.
- Emphasis particles: burst.

### I'll help here

- File: `teto-2026-09-06-00-29-[emphasis]-I'll-help-here[angry].mp3`
- When: Accepting a help request.
- Performance: Turn concern into an attentive forward lean; open one fin reassuringly.
- Sequence: concern → listening → listening → idle.
- Emphasis particles: invite.

### Mhm

- File: `teto-2026-09-06-00-29-[emphasis]-mhm[angry].mp3`
- When: A short conversational acknowledgement.
- Performance: A tiny nod only. No particles for every little acknowledgement.
- Sequence: listening → listening (nod) → idle → idle.
- Emphasis particles: none.

### Okiedokie

- File: `teto-2026-09-06-00-29-[emphasis]-Okiedokie[angry].mp3`
- When: Accepting an explicit player choice.
- Performance: A playful head tilt and one quick fin lift; a few small glints.
- Sequence: curious → happy → idle → idle.
- Emphasis particles: glint.

### Sure, fine

- File: `teto-2026-09-06-00-30-[emphasis]-Sure,-fine[angry].mp3`
- When: A casual chat agreement.
- Performance: A cheeky sideways tilt softens into a cooperative nod.
- Sequence: curious → listening (nod) → idle → idle.
- Emphasis particles: none.

### Why not

- File: `teto-2026-09-06-00-30-[emphasis]-why-not[angry].mp3`
- When: Accepting a playful suggestion.
- Performance: A questioning eye and tilted fins open into a small inviting arc.
- Sequence: thinking → curious → happy → idle.
- Emphasis particles: invite.

### Yes yes

- File: `teto-2026-09-06-00-30-[emphasis]-yes-yes[angry].mp3`
- When: An enthusiastic acknowledgement.
- Performance: Two small conversational nods; keep this clean and quick.
- Sequence: listening → happy (double-nod) → listening → idle.
- Emphasis particles: none.

### Easy task

- File: `teto-2026-09-06-00-31-[emphasis]-Easy-task[angry].mp3`
- When: A simple requested task completed successfully.
- Performance: Relax the thinking eye and show a confident happy expression with three glints.
- Sequence: thinking → happy → idle → idle.
- Emphasis particles: glint.

### Okay, it's finished!

- File: `teto-2026-09-06-00-31-[emphasis]-Okay,-its-finished![angry].mp3`
- When: Completion of an explicit import, scan or other task.
- Performance: One compact success bounce and brief stars; do not announce background maintenance.
- Sequence: listening → celebrate → happy → idle.
- Emphasis particles: burst.

### Well done!

- File: `teto-2026-09-06-00-31-[emphasis]-Well-done![angry].mp3`
- When: A meaningful player milestone.
- Performance: Happy crescent eyes and open fins; a short encouraging star burst.
- Sequence: listening → celebrate → happy → idle.
- Emphasis particles: burst.

### Sorry, but don't mute me

- File: `teto-2026-09-06-00-32-[emphasis]-Sorry,-but-dont-mute-me[angry].mp3`
- When: Explicit voice-line preview only.
- Performance: A playful pleading tilt with soft motes. Never play when the user mutes or disables FiFi.
- Sequence: curious → concern → listening → idle.
- Emphasis particles: soft.

### You should check this out

- File: `teto-2026-09-06-00-32-[emphasis]-You-should-check-this-out[angry].mp3`
- When: A relevant discovery after the player requests suggestions.
- Performance: Straighten from thought, raise a fin, and send a single attention ripple.
- Sequence: thinking → alert → listening → idle.
- Emphasis particles: beacon.

### Please, hit the donate button…

- File: `teto-2026-09-06-00-33-[emphasis]-Please,-hit-the-donate-button,-pretty.mp3`
- When: Player opens the support panel or explicitly previews this line.
- Performance: A small respectful bow, then an open fin and soft pink light. Never interrupt chat or game launch with donation requests.
- Sequence: listening → greeting (bow) → happy → idle.
- Emphasis particles: gratitude.

### Be my guest

- File: `teto-2026-09-06-00-34-[emphasis]-Be-my-guest[emphasis]-[excited].mp3`
- When: Inviting the player to try a suggested action.
- Performance: Sweep a fin outward, follow with friendly eyes, and settle with a small invitation arc.
- Sequence: happy → greeting (present) → listening → idle.
- Emphasis particles: invite.
