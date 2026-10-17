export function captureDisclosureAnchor(element) {
  const scroller = element?.closest('.lounge-visual-controls');
  return scroller ? { element, scroller, top: element.getBoundingClientRect().top } : null;
}

// Preserve the clicked header, not a slider below it chosen by browser scroll
// anchoring. Temporary bottom room prevents scroll-range clamping on collapse.
// Recalculate that room each time so expanding does not accumulate empty space.
export function restoreDisclosureAnchor(anchor) {
  if (!anchor?.element?.isConnected || !anchor.scroller.isConnected) return;
  const { element, scroller, top } = anchor;
  scroller.style.removeProperty('--lounge-disclosure-room');
  const desired = Math.max(0, scroller.scrollTop + element.getBoundingClientRect().top - top);
  const maximum = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  const room = Math.max(0, Math.ceil(desired - maximum));
  if (room) scroller.style.setProperty('--lounge-disclosure-room', `${room}px`);
  scroller.scrollTop = desired;
}
