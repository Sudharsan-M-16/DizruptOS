"use client";

// Power-on. A near-black field, the DizruptOS mark drawing itself with a soft
// volt halo, and an Apple-style progress bar that fills once and hands off to
// the lock screen. Deliberately quiet — this is the half-second that tells the
// viewer "this is an operating system, not a web page."

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { DizruptMark } from "@/components/ui/logo";
import { useOS } from "@/lib/os";

const DURATION = 2200; // ms

export function BootScreen() {
  const finishBoot = useOS((s) => s.finishBoot);
  const accent = useOS((s) => s.accent().hex);
  const [progress, setProgress] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / DURATION);
      // ease-out so the bar slows as it fills, like a real boot
      setProgress(1 - Math.pow(1 - p, 2.2));
      if (p < 1) raf = requestAnimationFrame(tick);
      else if (!done.current) {
        done.current = true;
        setTimeout(finishBoot, 340);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [finishBoot]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#040506]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div
          className="absolute inset-0 -z-10 rounded-full blur-2xl"
          style={{ background: `radial-gradient(circle, ${accent}55, transparent 70%)` }}
        />
        <DizruptMark size={92} glow />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-9 font-display text-sm font-semibold tracking-[0.32em] text-white/70"
      >
        DIZRUPT<span style={{ color: accent }}>OS</span>
      </motion.div>

      {/* progress bar */}
      <div className="mt-7 h-[5px] w-[200px] overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${accent}, #ffffff)`,
            boxShadow: `0 0 12px ${accent}aa`,
          }}
        />
      </div>
    </motion.div>
  );
}
