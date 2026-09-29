import { RETRO_PLATFORMS } from '../../lib/emulation-library-model.mjs';

const VIEWS = new Set(['all', 'continue', 'favorites', 'recent', 'week', 'progress', 'added', 'most']);

export const DEFAULT_LOUNGE_RESUME = Object.freeze({ zone: 'home', view: 'all', consoleId: '', gameId: '' });

export function normalizeLoungeResume(value) {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    zone: input.zone === 'emulator' ? 'emulator' : 'home',
    view: VIEWS.has(input.view) ? input.view : 'all',
    consoleId: Object.hasOwn(RETRO_PLATFORMS, input.consoleId) ? input.consoleId : '',
    gameId: typeof input.gameId === 'string' && input.gameId.length <= 160 ? input.gameId : '',
  };
}
