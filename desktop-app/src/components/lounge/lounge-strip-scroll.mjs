/** Keep a selected Lounge tab visible without scrolling the window or its ancestors. */
export function scrollLoungeStripToControl(control, align = 'nearest') {
  const strip = control?.closest?.('[data-testid="lounge-console-strip"], .lounge-filter-strip');
  if (!strip || typeof strip.scrollTo !== 'function') return false;
  const stripRect = strip.getBoundingClientRect();
  const controlRect = control.getBoundingClientRect();
  const relativeLeft = controlRect.left - stripRect.left;
  const current = strip.scrollLeft;
  let target = current;
  if (align === 'center') target += relativeLeft - (strip.clientWidth - controlRect.width) / 2;
  else if (relativeLeft < 8) target += relativeLeft - 8;
  else if (relativeLeft + controlRect.width > strip.clientWidth - 8) target += relativeLeft + controlRect.width - strip.clientWidth + 8;
  target = Math.max(0, Math.min(Math.max(0, strip.scrollWidth - strip.clientWidth), target));
  if (Math.abs(target - current) > 1) strip.scrollTo({ left: target, behavior: 'smooth' });
  return true;
}
