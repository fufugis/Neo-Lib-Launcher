export const UPCOMING_CHANGELOG = {
  version: 'upcoming', unreleased: true,
  title: 'Included in this development build, not the published v1.8.6 installer',
  major: [
    { title: 'Announcement-friendly idle power saver', body: 'After 15 quiet minutes without a tracked game, pauses expensive background visuals, Home work, health polling and deal rotation while keeping mascot, news and controller wake-up available. Mouse, keyboard and controller use wakes it; Settings can disable it. Official detached Lounge gains the same visual idle policy. Release checks now continue hourly while open, including soft idle.' },
    { title: 'Classic Home widget editor', body: 'Rearrange widgets opens a zoomed-out bordered canvas with named boxes. Drag freely or snap to a grid, resize with the corner and use Save to apply the arrangement. Cancel preserves the previous layout; existing and community widgets carry over.' },
    { title: 'Playtime pie hover details', body: 'Hover a coloured slice in Home or Lounge for its game, percentage of filtered recorded playtime and hours/minutes beside the mouse. Tooltip placement respects screen edges and enlarged Lounge widgets.' },
    { title: 'A quieter startup, then mascot news', body: 'News waits a full minute so patch notes can be read first. New popups use the selected mascot’s news cue while respecting mute and voice-volume preferences.' },
    { title: 'News popup and mail inbox', body: 'New team announcements show a single News popup, then fade toward a mail icon. Keep multiple messages until you delete them, with unread counts and remembered delivery/deletion history.' },
    { title: 'News without another installer', body: 'After clients receive this reader, the team can publish plain-text announcements through a public GitHub file. Hourly checks pause during Rest Mode/gameplay, defer popups around dialogs, retain mail offline and respect reduced motion.' },
  ],
};
