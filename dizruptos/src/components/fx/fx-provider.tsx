"use client";

// FX layer — drives the cursor spotlight: every `.panel` gets a soft radial
// light that follows the pointer. One delegated listener for the whole app;
// panels opt out with `data-no-spotlight`.
//
// The WebGL layer no longer mounts globally: the product shell stays clean
// and professional (data on solid surfaces); cinematic fields live only on
// the public faces (/welcome, /login) via DotMatrixField.

import * as React from "react";

export function FxProvider() {
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let current: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.(
        ".panel:not([data-no-spotlight])"
      ) as HTMLElement | null;

      if (current && current !== el) {
        current.classList.remove("spotlit");
        current = null;
      }
      if (!el) return;

      const rect = el.getBoundingClientRect();
      el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
      if (current !== el) {
        el.classList.add("spotlit");
        current = el;
      }
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      current?.classList.remove("spotlit");
    };
  }, []);

  return null;
}
