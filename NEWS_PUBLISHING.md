# Publishing NEO-LIB News

After users install an app version containing the News reader (v1.8.7 or newer), edit the root `announcements.json` on the **main branch** and push/commit it. No new installer or Cloudflare service is needed for each message. Older v1.8.6 clients do not have this reader.

Messages in the public feed broadcast to all clients with the News reader on their next eligible check. The feed may be empty between announcements. An example to publish intentionally:

The presentation below describes the next-version source changes, not the already
published v1.8.8. Older readers show a timed 7.5-second popup and pause during hard
Rest. A new installer is needed for centered, X-only announcements and ZZZ delivery.

```json
{
  "schemaVersion": 1,
  "messages": [
    {
      "id": "news-2026-10-08-01",
      "title": "Welcome to NEO-LIB News",
      "body": "Updates from the NEO-LIB team will appear here.\nThanks for being part of the journey!",
      "publishedAt": "2026-10-08T12:00:00Z",
      "expiresAt": "2026-11-08T12:00:00Z",
      "link": "https://github.com/fufugis/Neo-Lib-Launcher/releases"
    }
  ]
}
```

- Give every **new message a new ID**. Reusing an ID does not notify again or overwrite an already saved message.
- Title/body are plain text, not HTML or code. Links are optional HTTPS links opened only by the user's click. Dates are optional ISO timestamps; expiry/scheduling control new deliveries, not already saved mail.
- The app first checks one minute after startup and then at most hourly while online/visible, with timeouts and bounded responses. Cached pending popups and network/focus events also respect that initial minute. Game tracking, detached Lounge and first-run setup defer delivery; other dialogs defer the popup. Manual ZZZ does not block team announcements. Delivery is not instantaneous and GitHub caching can delay it.
- Each message opens a centered announcement that stays until its X is deliberately clicked. Outside clicks, Escape, elapsed time and backgrounding do not acknowledge it. Unacknowledged messages survive app restart, without replaying arrival feedback. Legacy already-notified messages migrate as acknowledged, so old news does not suddenly replay after upgrading.
- First presentation plays a brief chime if sounds are enabled and sound pack is not None. Outside ZZZ, an enabled mascot reacts and can play its existing "Got some news for you" clip, respecting voice settings, volume and cooldown. In manual ZZZ there is no mascot reaction/voice, but the message and permitted chime still work. Muting does not hide messages; polling, restoring and opening saved mail do not replay arrival sounds.
- The brighter labeled News button carries saved count and unread badge, with a short finite attention pulse for new unread mail and static highlight thereafter. Reduced-motion users get no pulse. It remains while any mail exists. The announcement X keeps the mailbox copy; Delete removes only that message locally. Remembered IDs prevent redelivery after deletion/restart/feed edits, and failed acknowledgement writes leave the announcement open.
- Inbox data stays on this installation using browser local storage. Clearing app/browser storage resets delivery history; this is not account-synced mail. Failed storage writes do not pretend to save/delete messages.
- Up to 100 messages per feed, 1000 retained messages and 10000 remembered IDs. At capacity new messages are not accepted; existing messages are never silently evicted.
- Do not put passwords, personal recipient data or secrets in this **public** file. There are no credentials in the reader, no read receipts or personal library uploads. GitHub/network service availability is not guaranteed.

## Test before publishing

Run `npm.cmd run test:news` from desktop-app. Preview with a locally mocked feed: multiple arrivals, popup collapse, unread/read, deletion/restart, small windows, keyboard/controller Back, dialogs/Rest Mode and reduced motion. Use mocked feeds for routine development. Publish a clearly labeled live test only when the operator explicitly requests it: it reaches all eligible clients, not a private test audience.

## First operator-requested live test

On 2026-10-17 the operator explicitly requested a test popup/mailbox message.
ID: `test-2026-10-17-mailbox-01`; title: NEO-LIB news test; body:
“Test message to see if the mailbox and popup works.”
New deliveries expire after 24 hours; received messages remain local until deleted.
No receipt or popup confirmation is sent back to the operator.

The operator manually confirmed receipt and working popup/mailbox on 2026-10-17.
That confirms the original live-feed path, not acceptance of the newer presentation.

## Operator welcome message — 2026-10-18

Published in main commit 161d708: `news-2026-10-18-kenneth-welcome-01`, title
**A message from Kenneth**, using the operator's exact welcome/feedback/suggestions
text. No expiry was specified; this remains available for new deliveries until
removed from the feed. Existing received copies remain in each local mailbox.
The shipped reader was independently used to fetch and verify the exact public
entry; once-only merge and deletion memory checks passed. This verifies the feed,
not a receipt from every client. No installer update or release was required.
