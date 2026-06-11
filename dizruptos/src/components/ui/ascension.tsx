"use client";

// Signature components — the "expensive" layer. Used sparingly, exactly where
// attention belongs: live numbers, the critical callout, cinematic auth.

import * as React from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------ NumberTicker ------------------------------- */
// Counts up on first view; re-animates when `value` changes. Tabular nums keep
// layout stable. Suffix stays static so "%"/"h" never jitters.

export function NumberTicker({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);

  React.useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [inView, value, mv]);

  return <motion.span ref={ref} className={cn("tabular-nums", className)}>{text}</motion.span>;
}

/* ----------------------------- AuroraBackdrop ------------------------------ */
// Cinematic but cheap: two drifting radial fields + a conic sweep, pure CSS
// keyframes (globals.css), GPU-composited, collapses under reduced motion.

export function AuroraBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="aurora-field aurora-a" />
      <div className="aurora-field aurora-b" />
      <div className="aurora-sweep" />
    </div>
  );
}

/* ----------------------------- CriticalFrame ------------------------------- */
// Animated gradient border reserved for the single most important thing on a
// screen. If two things wear it, neither is critical — use once per view.

export function CriticalFrame({
  children,
  tone = "danger",
  className,
}: {
  children: React.ReactNode;
  tone?: "danger" | "brand";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "gradient-frame relative rounded-card",
        tone === "danger" ? "gradient-frame-danger" : "gradient-frame-brand",
        className
      )}
    >
      <div className="relative rounded-[11px] bg-ink-surface">{children}</div>
    </div>
  );
}
