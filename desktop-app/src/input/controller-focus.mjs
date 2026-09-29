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

export function nextControllerGridFocus(current, direction) {
  const grid = current?.closest?.('[data-controller-grid]');
  if (!grid) return null;
  const targets = [...grid.querySelectorAll(TARGETS)].filter(element => isControllerNavigationTarget(element) && visibleControllerElement(element));
  if (!targets.includes(current)) return null;
  const rect = current.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const horizontal = direction === 'left' || direction === 'right';
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;
  const ranked = targets.filter(target => target !== current).map(target => {
    const next = target.getBoundingClientRect();
    const dx = next.left + next.width / 2 - x;
    const dy = next.top + next.height / 2 - y;
    const primary = (horizontal ? dx : dy) * sign;
    const lateral = Math.abs(horizontal ? dy : dx);
    const sameLine = horizontal ? lateral <= Math.max(18, rect.height * 0.3) : lateral <= Math.max(24, rect.width * 0.25);
    return { target, primary, lateral, sameLine };
  }).filter(item => item.primary > 2);
  const aligned = ranked.filter(item => item.sameLine).sort((a, b) => a.primary - b.primary);
  if (aligned.length) return aligned[0].target;
  if (horizontal) return null;
  return ranked.sort((a, b) => a.lateral * 4 + a.primary - (b.lateral * 4 + b.primary))[0]?.target || null;
}

export function canControllerActivate(element) {
  if (!isControllerActivationTarget(element) || element.closest?.('[data-neolib-launch]')) return false;
  if (!element.matches?.('button, [role="button"], [role="tab"]')) return false;
  const label = (element.getAttribute?.('aria-label') || element.textContent || '').trim();
  return !/^(play|launch|resume|delete|remove|clear|reset|erase|format|forget|wipe|uninstall|quit|shutdown)\b/i.test(label);
}
