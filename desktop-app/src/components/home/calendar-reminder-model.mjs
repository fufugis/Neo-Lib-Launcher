export const CALENDAR_REMINDERS_KEY = 'neolib:calendar-reminders:v1';
export const CALENDAR_REMINDERS_EVENT = 'neolib:calendar-reminders-changed';
export const MAX_CALENDAR_REMINDERS = 500;
export function reminderTimestamp(day, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(time)) return NaN;
  const [year, month, date] = day.split('-').map(Number), [hour, minute] = time.split(':').map(Number);
  const value = new Date(year, month - 1, date, hour, minute);
  return year >= 2000 && year <= 2200 && value.getFullYear() === year && value.getMonth() === month - 1 && value.getDate() === date && value.getHours() === hour && value.getMinutes() === minute ? value.getTime() : NaN;
}
export function normalizeCalendarReminders(value) {
  if (value == null) return [];
  if (value.version !== 1 || !Array.isArray(value.items)) throw new Error('Reminder data could not be read. Existing data was not changed.');
  const ids = new Set();
  return value.items.slice(0, MAX_CALENDAR_REMINDERS).filter(item => {
    if (!item || typeof item.id !== 'string' || !item.id.length || item.id.length>100 || ids.has(item.id) || !Number.isFinite(item.at) || !Number.isFinite(reminderTimestamp(item.day, '12:00')) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time) || typeof item.text !== 'string' || !item.text.trim()) return false;
    ids.add(item.id); return true;
  }).map(item => ({ id:item.id.slice(0,100), text:item.text.trim().slice(0,1000), day:item.day, time:item.time, at:item.at, announced:item.announced === true, acknowledged:item.acknowledged === true }));
}
export function calendarReminderId() {
  return globalThis.crypto.randomUUID?.() || [...globalThis.crypto.getRandomValues(new Uint8Array(16))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}
export function makeCalendarReminder({ day, time, text }, now = Date.now(), id = calendarReminderId()) {
  const at = reminderTimestamp(day, time);
  if (!Number.isFinite(at) || at <= now) throw new Error('Choose a valid future date and time (local time).');
  if (!String(text || '').trim()) throw new Error('Write a reminder first.');
  return {id,day,time,at,text:String(text).trim().slice(0,1000),announced:false,acknowledged:false};
}
export function nextCalendarReminder(items, now = Date.now()) {
  return [...items].filter(item => !item.acknowledged && item.at <= now).sort((a,b) => a.at-b.at || a.id.localeCompare(b.id))[0] || null;
}
