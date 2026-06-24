"use client";

// On a low-end machine, turn on Performance mode automatically the first time —
// it drops the GPU-heavy blurred auroras and grain so the desktop stays smooth.
// Runs once (flag in localStorage); the user can still toggle it in Control
// Center afterwards and that choice sticks.

import { useEffect } from "react";
import { useOS } from "@/lib/os";

export function PerfAutoDetect() {
  const setTransparency = useOS((s) => s.setTransparency);
  useEffect(() => {
    try {
      if (localStorage.getItem("dz-perf-auto") === "1") return;
      const cores = navigator.hardwareConcurrency ?? 8;
      const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
      if (cores <= 4 || mem <= 4) setTransparency(true);
      localStorage.setItem("dz-perf-auto", "1");
    } catch { /* ignore */ }
  }, [setTransparency]);
  return null;
}
