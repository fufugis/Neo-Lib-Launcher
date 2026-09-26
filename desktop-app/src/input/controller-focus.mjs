import { isControllerActivationTarget, isControllerNavigationTarget } from './controller-navigation.mjs';

const TARGETS = 'button, a[href], [role="button"], [role="tab"], [data-controller-target]';
const SURFACES = '[data-controller-surface], [role="dialog"][aria-modal="true"], .fixed.inset-0';

export function visibleControllerElement(element) {
  if (!element?.isConnected || element.closest?.('[hidden], [inert], [aria-hidden="true"]')) return false;
  const style = element.ownerDocument?.defaultView?.getComputedStyle?.(element);
  if (style?.display === 'none' || style?.visibility === 'hidden' || style?.pointerEvents === 'none') return false;
  return Boolean(element.getClientRects?.().length);
}

export function controllerFocusSurface(documentRef) {
  const layers = [...(documentRef?.querySelectorAll?.(SURFACES) || [])].filter(visibleControllerElement);
  if (!layers.length) return documentRef?.body || null;
  return layers.reduce((top, layer) => {
    const z = Number.parseInt(documentRef.defaultView?.getComputedStyle?.(layer)?.zIndex, 10) || 0;
    return !top || z >= top.z ? { layer, z } : top;
  }, null).layer;
}

export function controllerFocusTargets(surface) {
  return [...(surface?.querySelectorAll?.(TARGETS) || [])].filter((element) => isControllerNavigationTarget(element) && visibleControllerElement(element));
}

export function nextControllerFocus(targets, current, direction) {
  if (!targets.length) return null;
  if (!targets.includes(current)) return targets[0];
  const origin = current.getBoundingClientRect();
  const x = origin.left + origin.width / 2;
  const y = origin.top + origin.height / 2;
  const horizontal = direction === 'left' || direction === 'right';
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;
  const ranked = targets.filter((target) => target !== current).map((target) => {
    const rect = target.getBoundingClientRect();
    const dx = rect.left + rect.width / 2 - x;
    const dy = rect.top + rect.height / 2 - y;
    const primary = (horizontal ? dx : dy) * sign;
    const secondary = Math.abs(horizontal ? dy : dx);
    return { target, primary, score: primary + secondary * 2 };
  }).filter((entry) => entry.primary > 2).sort((a, b) => a.score - b.score);
  return ranked[0]?.target || current;
}

export function canControllerActivate(element) {
  if (!isControllerActivationTarget(element) || element.closest?.('[data-neolib-launch]')) return false;
  if (!element.matches?.('button, [role="button"], [role="tab"]')) return false;
  const label = (element.getAttribute?.('aria-label') || element.textContent || '').trim();
  return !/^(play|launch|resume|delete|remove|clear|reset|erase|format|forget|wipe|uninstall|quit|shutdown)\b/i.test(label);
}
