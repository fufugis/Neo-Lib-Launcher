import { CALENDAR_REMINDERS_KEY, CALENDAR_REMINDERS_EVENT, normalizeCalendarReminders } from './calendar-reminder-model.mjs';
export function readCalendarReminders() {
  return normalizeCalendarReminders(JSON.parse(localStorage.getItem(CALENDAR_REMINDERS_KEY) || 'null'));
}
export function changeCalendarReminders(change) {
  const next = normalizeCalendarReminders({version:1,items:change(readCalendarReminders())});
  localStorage.setItem(CALENDAR_REMINDERS_KEY,JSON.stringify({version:1,items:next}));
  window.dispatchEvent(new Event(CALENDAR_REMINDERS_EVENT));
  return next;
}
