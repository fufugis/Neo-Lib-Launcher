import React from 'react';
import { createPortal } from 'react-dom';

export const UI_LAYERS = Object.freeze({
  content: 1,
  mascot: 85,
  popup: 220,
  modal: 230,
});

/** Keeps menus outside clipped library/preview panes while preserving their DOM. */
export function renderForegroundPortal(children) {
  if (typeof document === 'undefined' || !document.body) return children;
  return createPortal(children, document.body);
}

/** Decorative art is always hidden from assistive tech and can never intercept input. */
export function DecorationLayer({ as: Element = 'span', className = '', children, ...props }) {
  return <Element aria-hidden="true" className={`pointer-events-none ${className}`.trim()} {...props}>{children}</Element>;
}

/** Shared bounds for floating UI so narrow windows cannot push controls off-screen. */
export const POPUP_VIEWPORT_BOUNDS = 'max-w-[calc(100vw-24px)] max-h-[calc(100vh-24px)]';
