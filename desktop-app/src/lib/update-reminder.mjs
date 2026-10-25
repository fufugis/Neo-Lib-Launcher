export const UPDATE_REMINDER_KEY = 'neolib:app-update-reminder:v1';
export const UPDATE_REMINDER_MS = 60 * 60 * 1000;

export function normalizeUpdateReminder(value, version, now = Date.now()) {
  if (value?.version !== version) return { version, nextAt: now + UPDATE_REMINDER_MS, pending: false };
  const nextAt = Number(value.nextAt);
  return { version, nextAt: Number.isFinite(nextAt) && nextAt > 0 && nextAt <= now + UPDATE_REMINDER_MS ? nextAt : now + UPDATE_REMINDER_MS, pending: value.pending === true };
}

export function updateReminderDue(state, now = Date.now()) {
  return !state.pending && now >= state.nextAt;
}

export function dismissUpdateReminder(state, now = Date.now()) {
  return { ...state, pending: false, nextAt: now + UPDATE_REMINDER_MS };
}
