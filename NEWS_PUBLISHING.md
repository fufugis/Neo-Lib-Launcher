# Publishing NEO-LIB News

After users install an app version containing the News reader, edit the root `announcements.json` on the **main branch** and push/commit it. No new installer or Cloudflare service is needed for each message. The current published v1.8.6 installer predates this feature.

The feed starts empty, so this implementation broadcasts nothing. An example to publish intentionally:

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
- The app first checks one minute after startup and then at most hourly while online/visible, with timeouts and bounded responses. Cached pending popups and network/focus events also respect that initial minute. Rest Mode, game tracking and detached Lounge pause checks/popups. Other dialogs defer the popup. Delivery is not instantaneous and GitHub caching can delay it.
- Each message gets one 7.5-second News popup, then fades/shrinks toward the titlebar mail icon. The selected mascot uses its existing "Got some news for you" clip, respecting mascot/sound/voice enable switches, sound-pack mute, voice volume and shared cooldown. Reduced-motion users get a simple fade. Clicking the popup opens the inbox.
- The icon carries the saved message count and an unread indicator; it remains while any mail exists. Opening/closing mail never deletes it. Delete removes only that message locally; remembered IDs prevent redelivery, even after restart or feed edits.
- Inbox data stays on this installation using browser local storage. Clearing app/browser storage resets delivery history; this is not account-synced mail. Failed storage writes do not pretend to save/delete messages.
- Up to 100 messages per feed, 1000 retained messages and 10000 remembered IDs. At capacity new messages are not accepted; existing messages are never silently evicted.
- Do not put passwords, personal recipient data or secrets in this **public** file. There are no credentials in the reader, no read receipts or personal library uploads. GitHub/network service availability is not guaranteed.

## Test before publishing

Run `npm.cmd run test:news` from desktop-app. Preview with a locally mocked feed: multiple arrivals, popup collapse, unread/read, deletion/restart, sidebar on/off, small windows, keyboard/controller Back, dialogs/Rest Mode and reduced motion. Do not publish test messages to all users.
