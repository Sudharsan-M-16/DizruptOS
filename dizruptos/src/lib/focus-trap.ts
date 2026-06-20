// Focus trap — keeps keyboard focus contained within a modal/overlay element.
// Implements WCAG 2.1 SC 2.1.2 (No Keyboard Trap) correctly: Tab/Shift+Tab
// cycle within the trap; Escape closes it.

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), details > summary';

export function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest('[hidden]') && getComputedStyle(el).display !== 'none'
  );
}

export interface FocusTrapOptions {
  /** Called when the user presses Escape inside the trap. */
  onEscape?: () => void;
  /** Element that should receive focus first (defaults to the first focusable). */
  initialFocus?: HTMLElement | null;
}

/**
 * Activates a focus trap on `container`.
 * Returns a cleanup function — call it when the overlay closes.
 */
export function activateFocusTrap(
  container: HTMLElement,
  { onEscape, initialFocus }: FocusTrapOptions = {}
): () => void {
  const prev = document.activeElement as HTMLElement | null;

  const first = () => getFocusable(container)[0];
  const last  = () => { const els = getFocusable(container); return els[els.length - 1]; };

  const target = initialFocus ?? first();
  const tid = setTimeout(() => target?.focus(), 0);

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onEscape?.();
      return;
    }
    if (e.key !== 'Tab') return;

    const focusable = getFocusable(container);
    if (focusable.length === 0) { e.preventDefault(); return; }

    const firstEl = focusable[0];
    const lastEl  = focusable[focusable.length - 1];
    const active  = document.activeElement;

    if (e.shiftKey) {
      if (active === firstEl || !container.contains(active)) {
        e.preventDefault();
        lastEl.focus();
      }
    } else {
      if (active === lastEl || !container.contains(active)) {
        e.preventDefault();
        firstEl.focus();
      }
    }
  };

  document.addEventListener('keydown', handleKey);

  return () => {
    clearTimeout(tid);
    document.removeEventListener('keydown', handleKey);
    prev?.focus?.();
  };
}

/** React hook version — call inside a component with a ref to the trap container. */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  options: FocusTrapOptions = {}
) {
  // Stable ref for options to avoid re-running the effect on every render
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!active || !ref.current) return;
    return activateFocusTrap(ref.current, optionsRef.current);
  }, [active, ref]);
}
