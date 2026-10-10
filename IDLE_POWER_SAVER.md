# Automatic idle power saver

Enabled by default in **Settings → App behaviour → Automatic idle power saver**.

The safe default is 15 quiet minutes without a tracked game, not 15 minutes of actively browsing. Either 15 minutes of Windows idle time or 15 minutes without NEO-LIB input can qualify. Recent mouse, keyboard, wheel, touch or controller use keeps NEO-LIB awake, even when Windows does not recognize a controller as activity. Returning to the app or providing input wakes it immediately; native idle status is sampled every 30 seconds, so automatic entry can be up to 30 seconds after the threshold.

The idle state pauses expensive ambient effects, decorative CSS motion, Home background polling, health polling, launcher discovery and deal rotation. Existing UI content and preferences are not deleted. Mascot reactions/voice, watched-game news checks and the GitHub News inbox keep their normal schedules. App-release checks repeat hourly with a one-hour cache, so new releases can be announced without restarting the app. These are scheduled checks, not instant push delivery.

Manual Rest, close-to-tray Rest and game Rest remain separate, deliberate hard-stop modes. Their existing notification and sound deferrals still apply. A tracked game prevents the new idle state, including when the player has disabled game Rest. There is no automatic game launch, system sleep, GPU setting change or process termination.

Official detached Lounge uses the same idle timer and settings choice to pause FX, background video/music and widget background work while retaining controller wake-up and existing selected-game mascot notices. It does not introduce global announcement forwarding to Lounge: the existing main-window News deferral while detached Lounge is open is preserved. Imported animated GIF/APNG artwork follows the existing Rest behavior and may still decode; this feature does not claim zero GPU/CPU work for every media format.

Only one transient input timestamp and a bounded aggregate idle-seconds result are used. No key names, cursor positions or input history are captured or saved. If native idle data is unavailable, the local inactivity timer still works. There is no high-frequency CPU/GPU monitor; mascot and controller activity intentionally remain available. Electricity savings and actual idle rendering load need live measurement and are not certified by source tests.

## Acceptance checks

- Keep actively using Home/settings beyond 15 minutes: no automatic sleep.
- Stop interacting without a tracked game: idle indicator appears after the threshold; decoration and routine background work pause.
- Move mouse, scroll, press a key or use the selected controller: wakes immediately.
- While idle, verify real watched-game news/release notices and a locally mocked News message can reach mascot/inbox. Never publish test announcements to users.
- Manual Rest, tray hiding and tracked gameplay continue to defer notices; ending a hard Rest starts a fresh local quiet timer.
- Open official Lounge and repeat the idle/wake check, including custom video, widgets and controller. Check animated-image decoder load separately.
