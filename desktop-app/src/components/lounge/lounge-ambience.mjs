import ambience1 from '../../assets/lounge/ambience-1.mp3';
import ambience2 from '../../assets/lounge/ambience-2.mp3';
import ambience3 from '../../assets/lounge/ambience-3.mp3';
import ambience4 from '../../assets/lounge/ambience-4.mp3';

export const LOUNGE_AMBIENCE_TRACKS = Object.freeze([
  { id: 'none', label: 'Off', url: '' },
  { id: 'ambience-1', label: 'Ambience 1', url: ambience1 },
  { id: 'ambience-2', label: 'Ambience 2', url: ambience2 },
  { id: 'ambience-3', label: 'Ambience 3', url: ambience3 },
  { id: 'ambience-4', label: 'Ambience 4', url: ambience4 },
]);

export function loungeAmbienceUrl(preferences) {
  if (preferences?.ambienceTrack === 'custom') return preferences.ambienceCustomUrl || '';
  return LOUNGE_AMBIENCE_TRACKS.find(track => track.id === preferences?.ambienceTrack)?.url || '';
}
