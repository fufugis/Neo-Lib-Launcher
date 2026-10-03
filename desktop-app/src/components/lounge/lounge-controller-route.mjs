// Explicit carousel lanes take priority over spatial navigation. Null delegates
// to the normal menu navigator; a handled route never leaks at a row boundary.
export function loungeControllerRoute(surface, current, command, targets) {
  if (surface?.getAttribute?.('data-controller-surface') !== 'lounge') return null;
  const game = current?.matches?.('[data-lounge-game]');
  const console = current?.matches?.('[data-lounge-console]');
  const collapse = surface.querySelector('[data-lounge-collapse-games]');
  if (collapse && (command === 'back' || (command === 'down' && game))) return { click: collapse };
  if ((game || console) && (command === 'left' || command === 'right')) {
    if (console) return { click: surface.querySelector(`[data-lounge-console-step="${command}"]`) };
    const cards = targets.filter(target => target.matches?.('[data-lounge-game]'));
    const index = cards.indexOf(current);
    return { focus: cards[Math.max(0, Math.min(cards.length - 1, index + (command === 'left' ? -1 : 1)))] || current };
  }
  if ((game || console) && command === 'up') {
    const controls = targets.filter(target => target.closest?.('.lounge-browse-dock, .lounge-top-nav') && !target.closest?.('.lounge-console-dock'));
    return { focus: controls.find(target => target.matches?.('[data-lounge-filter][aria-pressed="true"]')) || controls[0] || current };
  }
  if (console && command === 'down') return { focus: current };
  if (command === 'down' && current?.closest?.('.lounge-browse-dock')) {
    return { focus: surface.querySelector('[data-lounge-game][data-lounge-selected="true"]') || surface.querySelector('[data-lounge-console][aria-pressed="true"]') || current };
  }
  if (surface.getAttribute('data-lounge-zone') === 'emulator' && ['previous-section', 'next-section'].includes(command)) {
    return { click: surface.querySelector(`[data-lounge-console-step="${command === 'previous-section' ? 'left' : 'right'}"]`) };
  }
  return null;
}
