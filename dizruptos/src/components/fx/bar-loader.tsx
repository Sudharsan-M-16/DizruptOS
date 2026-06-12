"use client";

// Route-transition pulse — five volt bars breathing in a mirror loop.
// Mounted by (shell)/loading.tsx so navigation always answers instantly,
// even while the next screen's data and chunks are still arriving.

import { motion, type Variants } from "framer-motion";

const bar: Variants = {
  initial: { scaleY: 0.4, opacity: 0.25 },
  animate: {
    scaleY: 1,
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: "mirror",
      duration: 0.55,
      ease: "circIn",
    },
  },
};

export function BarLoader({ label = "Loading view" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-label={label}>
      <motion.div
        transition={{ staggerChildren: 0.12 }}
        initial="initial"
        animate="animate"
        className="flex items-end gap-1"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.span
            key={i}
            variants={bar}
            className="h-7 w-1.5 origin-bottom rounded-full bg-brand"
            style={{ boxShadow: "0 0 8px rgba(0,237,130,0.4)" }}
          />
        ))}
      </motion.div>
      <span className="font-mono text-2xs uppercase tracking-[0.2em] text-fg-muted">
        {label}
      </span>
    </div>
  );
}
