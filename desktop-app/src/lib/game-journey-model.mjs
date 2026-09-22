export const JOURNEY_STATUSES = Object.freeze([
  Object.freeze({ id: 'not-started', label: 'Not started', tone: 'quiet' }),
  Object.freeze({ id: 'backlog', label: 'Backlog', tone: 'planned' }),
  Object.freeze({ id: 'in-progress', label: 'In progress', tone: 'active' }),
  Object.freeze({ id: 'on-hold', label: 'On hold', tone: 'paused' }),
  Object.freeze({ id: 'finished', label: 'Finished', tone: 'complete' }),
  Object.freeze({ id: 'mastered', label: 'Mastered', tone: 'mastered' }),
  Object.freeze({ id: 'dropped', label: 'Dropped', tone: 'stopped' }),
]);

const IDS = new Set(JOURNEY_STATUSES.map(({ id }) => id));

export function normalizeJourneyStatus(value) {
  const id = String(value || '').trim().toLowerCase();
  return IDS.has(id) ? id : 'not-started';
}

// A first tracked launch may begin a new or backlog game. Deliberate player
// decisions such as On hold, Finished, Mastered and Dropped are never changed.
export function journeyStatusAfterFirstLaunch(value, previousPlaytimeMinutes = 0) {
  const current = normalizeJourneyStatus(value);
  if (Number(previousPlaytimeMinutes) > 0) return current;
  return current === 'not-started' || current === 'backlog' ? 'in-progress' : current;
}

export function journeyStatusDefinition(value) {
  const id = normalizeJourneyStatus(value);
  return JOURNEY_STATUSES.find((status) => status.id === id);
}
