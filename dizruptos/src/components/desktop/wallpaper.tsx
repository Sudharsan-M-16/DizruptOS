"use client";

// Desktop wallpaper — now driven by the OS store: the chosen paper, the live
// accent, the active theme (light/dark) and a brightness dial. Layers: the
// selected field (CSS gradients), two slow accent auroras, a faint topographic
// grid, grain for depth, a brightness scrim and a vignette. Pure CSS/SVG, GPU-
// cheap (only opacity/transform animate), non-interactive. A short cross-fade
// plays whenever the paper or theme changes so switching feels like macOS.

import { useEffect, useState } from "react";
import { useOS, wallpaperBackground } from "@/lib/os";
import { useSession } from "@/lib/session";

function useResolvedTheme(): "light" | "dark" {
  const theme = useSession((s) => s.theme);
  const [sys, setSys] = useState<"light" | "dark">("dark");
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const set = () => setSys(mq.matches ? "light" : "dark");
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, [theme]);
  return theme === "system" ? sys : theme;
}

export function Wallpaper() {
  const wp = useOS((s) => s.wallpaper());
  const accentHex = useOS((s) => s.accent().hex);
  const brightness = useOS((s) => s.brightness);
  const perf = useOS((s) => s.reduceTransparency);
  const theme = useResolvedTheme();

  const field = wallpaperBackground(wp, theme, accentHex);
  const isLight = theme === "light";

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* selected field — keyed so a change triggers the cross-fade */}
      <div key={`${wp.id}-${theme}`} className="dz-wp absolute inset-0" style={{ background: field }} />

      {/* accent auroras + grain are the GPU-heavy layers — Performance mode drops
          the blurred auroras (cheap accent washes painted into the field already)
          and the feTurbulence grain entirely. */}
      {!perf && (
        <>
          <div
            className="dz-aurora absolute -left-40 top-[-10%] h-[60vh] w-[60vh] rounded-full"
            style={{ background: `radial-gradient(circle, ${accentHex}28, transparent 60%)`, filter: "blur(46px)" }}
          />
          <div
            className="dz-aurora-2 absolute right-[-10%] top-[18%] h-[55vh] w-[55vh] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(43,217,255,0.16), transparent 60%)", filter: "blur(54px)" }}
          />
        </>
      )}

      {/* topographic grid */}
      <svg className={`absolute inset-0 h-full w-full ${isLight ? "opacity-[0.04]" : "opacity-[0.05]"}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dz-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke={isLight ? "black" : "white"} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dz-grid)" />
      </svg>

      {/* grain (feTurbulence is expensive — skipped in Performance mode) */}
      {!perf && (
        <svg className="absolute inset-0 h-full w-full opacity-[0.04] mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
          <filter id="dz-grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /></filter>
          <rect width="100%" height="100%" filter="url(#dz-grain)" />
        </svg>
      )}

      {/* brightness scrim */}
      <div className="absolute inset-0 bg-black transition-opacity duration-300" style={{ opacity: Math.max(0, 1 - brightness) }} />

      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(120% 100% at 50% 40%, transparent 55%, ${isLight ? "rgba(0,0,0,0.10)" : "rgba(0,0,0,0.55)"} 100%)` }}
      />

      <style jsx>{`
        .dz-wp { animation: dzWpFade 520ms cubic-bezier(0.4, 0, 0.2, 1); }
        .dz-aurora { animation: dzFloat 26s ease-in-out infinite alternate; }
        .dz-aurora-2 { animation: dzFloat2 32s ease-in-out infinite alternate; }
        @keyframes dzWpFade { from { opacity: 0; transform: scale(1.04); } to { opacity: 1; transform: scale(1); } }
        @keyframes dzFloat { from { transform: translate3d(0,0,0) scale(1); } to { transform: translate3d(40px,30px,0) scale(1.15); } }
        @keyframes dzFloat2 { from { transform: translate3d(0,0,0) scale(1.05); } to { transform: translate3d(-50px,20px,0) scale(0.95); } }
        @media (prefers-reduced-motion: reduce) { .dz-wp, .dz-aurora, .dz-aurora-2 { animation: none; } }
      `}</style>
    </div>
  );
}
