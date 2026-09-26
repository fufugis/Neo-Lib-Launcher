import React from 'react';
import { createControllerNavigator } from '../../services/controller-navigation-service.mjs';
import { canControllerActivate, controllerFocusSurface, controllerFocusTargets, nextControllerFocus } from '../../input/controller-focus.mjs';

// One opt-in focus owner. It never synthesizes pointer input for game launches.
export default function ControllerNavigationBridge({ enabled, preferredFingerprint, resting, privacyEpoch, onBlockedLaunch }) {
  const blockedLaunchRef = React.useRef(onBlockedLaunch);
  blockedLaunchRef.current = onBlockedLaunch;
  React.useEffect(() => {
    if (!enabled || resting) return undefined;
    let focused = null;
    let lastLaunchHintAt = 0;
    const clear = () => {
      focused?.removeAttribute('data-controller-focused');
      focused = null;
    };
    const focus = (element) => {
      if (!element) return;
      clear();
      focused = element;
      element.setAttribute('data-controller-focused', 'true');
      element.focus({ preventScroll: true });
      element.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    };
    const navigate = (command) => {
      if (document.visibilityState === 'hidden' || !document.hasFocus()) return;
      const surface = controllerFocusSurface(document);
      const targets = controllerFocusTargets(surface);
      if (focused && (!focused.isConnected || !targets.includes(focused))) clear();
      if (targets.includes(document.activeElement) && document.activeElement !== focused) {
        clear();
        focused = document.activeElement;
        focused.setAttribute('data-controller-focused', 'true');
      }
      const current = focused;
      if (surface?.getAttribute?.('data-controller-surface') === 'lounge' && ['previous-section', 'next-section'].includes(command)) {
        const filters = [...surface.querySelectorAll('[data-lounge-filter]')].filter((button) => targets.includes(button));
        if (!filters.length) return;
        const activeIndex = Math.max(0, filters.findIndex((button) => button.getAttribute('aria-pressed') === 'true'));
        const offset = command === 'previous-section' ? -1 : 1;
        const target = filters[(activeIndex + offset + filters.length) % filters.length];
        focus(target);
        if (canControllerActivate(target)) target.click();
        return;
      }
      if (['up', 'down', 'left', 'right', 'previous-section', 'next-section'].includes(command)) {
        const direction = command === 'previous-section' ? 'left' : command === 'next-section' ? 'right' : command;
        focus(nextControllerFocus(targets, current, direction));
      } else if (command === 'confirm') {
        if (!current) focus(targets[0]);
        else if (canControllerActivate(current)) current.click();
        else if (current.closest?.('[data-neolib-launch]') && Date.now() - lastLaunchHintAt > 5000) {
          lastLaunchHintAt = Date.now();
          blockedLaunchRef.current?.();
        }
      } else if (command === 'back') {
        if (document.activeElement?.matches?.('input, textarea, select, [contenteditable="true"]')) {
          document.activeElement.blur();
          clear();
          return;
        }
        const close = surface !== document.body
          ? surface.querySelector('[data-controller-close], [data-testid="modal-close-btn"], [aria-label^="Close"], [title^="Close"]') : null;
        if (close && canControllerActivate(close)) close.click();
        else if (surface?.matches?.('[data-testid="app-control-menu"]')) document.querySelector('[data-testid="app-control-menu-toggle"]')?.click();
        else clear();
      } else if (command === 'menu' && surface === document.body) {
        const menu = document.querySelector('[data-testid="app-control-menu-toggle"]');
        if (menu && canControllerActivate(menu)) { focus(menu); menu.click(); }
      } else if (command === 'home' && surface === document.body) {
        const home = document.querySelector('[data-testid="tab-home"], [data-testid="wall-open-home"]');
        if (home && canControllerActivate(home)) { focus(home); home.click(); }
      }
    };
    const navigator = createControllerNavigator({
      getPreferredFingerprint: () => preferredFingerprint,
      strictPreferred: true,
      getContext: () => ({
        textEntry: Boolean(document.activeElement?.matches?.('input:not([type="checkbox"]), textarea, select, [contenteditable="true"]')),
        modalOpen: controllerFocusSurface(document) !== document.body,
      }),
      onCommand: navigate,
    });
    const pointer = () => clear();
    const syncRunning = () => {
      if (document.visibilityState === 'hidden' || !document.hasFocus()) { navigator.stop(); clear(); }
      else navigator.start();
    };
    document.addEventListener('pointerdown', pointer, true);
    document.addEventListener('visibilitychange', syncRunning);
    window.addEventListener('focus', syncRunning);
    window.addEventListener('blur', syncRunning);
    syncRunning();
    return () => {
      navigator.stop();
      document.removeEventListener('pointerdown', pointer, true);
      document.removeEventListener('visibilitychange', syncRunning);
      window.removeEventListener('focus', syncRunning);
      window.removeEventListener('blur', syncRunning);
      clear();
    };
  }, [enabled, preferredFingerprint, resting, privacyEpoch]);
  return null;
}
