// Lounge is a workspace, not an open settings dialog. Real dialogs inside it
// still defer a new announcement so players do not lose a half-finished action.
export function notificationSurfaceBlocked(document) {
  return [...document.querySelectorAll('[role="dialog"], [aria-modal="true"], [data-controller-surface="modal"], [data-controller-surface="layout-editor"], [data-testid="modal-close-btn"], [data-testid="changelog-overlay"], [data-testid="tutorial-overlay"]')]
    .some(element => element.dataset.controllerSurface !== 'lounge');
}
