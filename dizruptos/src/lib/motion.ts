"use client";

// Motion architecture — one vocabulary for the whole product.
//
// Hierarchy (every animation belongs to exactly one tier):
//   T1 ambient    — page entrances, background drift. Never blocks reading.
//   T2 structural — drawers, modals, palette, column moves. Springs, 300–500 stiffness.
//   T3 signal     — state changes the operator must notice: guardrail trips,
//                   critical pulses, live-sync flashes. Color + motion together.
// Rules: motion communicates relationship/causality/focus — never decoration.
// All tiers collapse under prefers-reduced-motion (globals.css).

import type { Transition, Variants } from "framer-motion";

/* Springs — the only three the product uses. Pick by tier, not by taste. */
export const springStructural: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 36,
};
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 34,
};
export const easeAmbient: Transition = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1],
};

/* Page entrance — staggered children rise. Used by template.tsx so every
   route gets choreography for free; sections opt into finer stagger with
   the `rise` child variant. */
// Tuned for perceived speed: navigation must feel instant, so the entrance
// is a short rise with a tight stagger — choreography without latency.
export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { ...easeAmbient, staggerChildren: 0.03 },
  },
};

export const rise: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: easeAmbient },
};

/* Stagger helper for index-driven lists (cards, rows). */
export const riseAt = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { ...easeAmbient, delay: 0.04 * i },
  },
});
