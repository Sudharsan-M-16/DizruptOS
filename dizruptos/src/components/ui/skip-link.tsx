"use client";

// Skip navigation link — WCAG 2.4.1 (Bypass Blocks).
// Visually hidden until focused via keyboard; jumps to `#main-content`.
// Must be the first focusable element in the DOM.

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-[#F97316] focus:px-4 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-white"
    >
      Skip to main content
    </a>
  );
}
