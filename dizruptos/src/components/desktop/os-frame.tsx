"use client";

// The OS power-state shell. The desktop (children) is always mounted so its
// windows have settled by the time you unlock; the boot and lock screens ride
// above it as full-screen overlays and tear away with AnimatePresence. Also
// owns two global shortcuts: ⌃⌘Q locks, and (after unlock) nothing blocks the
// desktop. Phase lives in the OS store so the menubar/dock can drive it too.

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useOS } from "@/lib/os";
import { BootScreen } from "./boot-screen";
import { LockScreen } from "./lock-screen";

export function OSFrame({ children }: { children: React.ReactNode }) {
  const phase = useOS((s) => s.phase);
  const lock = useOS((s) => s.lock);

  // re-apply accent on mount (covers first paint before rehydrate effect)
  const accentHex = useOS((s) => s.accent().hex);
  useEffect(() => {
    document.documentElement.style.setProperty("--os-accent", accentHex);
  }, [accentHex]);

  // Auto-enable Performance mode the first time DizruptOS runs on a low-end
  // machine (≤4GB RAM or ≤2 cores). Done once and remembered, so the user can
  // still turn transparency back on later without us overriding them.
  const setTransparency = useOS((s) => s.setTransparency);
  useEffect(() => {
    try {
      if (localStorage.getItem("dz-perf-auto")) return;
      const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
      const cores = navigator.hardwareConcurrency;
      const lowEnd = (typeof mem === "number" && mem <= 4) || (typeof cores === "number" && cores <= 2);
      localStorage.setItem("dz-perf-auto", "1");
      if (lowEnd) setTransparency(true);
    } catch { /* storage blocked — skip */ }
  }, [setTransparency]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.ctrlKey && (e.key === "q" || e.key === "Q")) {
        e.preventDefault();
        lock();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lock]);

  // Security: auto-lock the desktop after 10 minutes of inactivity (the same
  // reflex a real OS / enterprise device policy has). Resets on any input.
  useEffect(() => {
    if (phase !== "desktop") return;
    let timer: ReturnType<typeof setTimeout>;
    const IDLE_MS = 10 * 60 * 1000;
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => lock(), IDLE_MS); };
    const evs: (keyof WindowEventMap)[] = ["pointermove", "pointerdown", "keydown", "wheel"];
    evs.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { clearTimeout(timer); evs.forEach((e) => window.removeEventListener(e, reset)); };
  }, [phase, lock]);

  return (
    <>
      {children}
      <AnimatePresence>
        {phase === "boot" && <BootScreen key="boot" />}
        {phase === "lock" && <LockScreen key="lock" />}
      </AnimatePresence>
    </>
  );
}
