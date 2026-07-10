"use client";

// The Dock — a frosted, magnifying launcher pinned to the bottom of the desktop.
// Left cluster: "apps" that navigate to the platform's routes (the real nav,
// reimagined as a dock). Right cluster: the desktop's own windows, so a
// minimized/closed window can be summoned back. Magnification follows the
// cursor with a gaussian falloff, the way the real Dock does.

import React, { memo, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { useRouter } from "next/navigation";
import { useOS } from "@/lib/os";
import { cn } from "@/lib/utils";

export interface DockApp {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;            // navigate (route apps)
  accent?: string;
  running?: boolean;        // show the running dot
  onClick?: () => void;     // window apps restore instead of navigate
  onClose?: () => void;     // close/quit the app's window (right-click menu)
  dimmed?: boolean;         // closed window
  appId?: string;           // registry id — enables "Remove from Dock"
}

const BASE = 46;   // resting icon size
const AMP = 26;    // extra px at the cursor
const SIGMA = 80;  // spread of the magnification

export function Dock({ apps }: { apps: (DockApp | "sep")[] }) {
  const router = useRouter();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const removeFromDock = useOS((s) => s.removeFromDock);
  const [menu, setMenu] = useState<{ x: number; y: number; app: DockApp } | null>(null);
  // Cached resting centers — measured once per hover so magnification doesn't
  // call getBoundingClientRect for every item on every pointer move.
  const centers = useRef<number[]>([]);
  // rAF-throttle pointer tracking so magnification re-renders at most once per
  // frame instead of on every (high-frequency) pointermove event.
  const raf = useRef<number | null>(null);
  const pendingX = useRef(0);
  const trackX = (x: number) => {
    pendingX.current = x;
    if (raf.current != null) return;
    raf.current = requestAnimationFrame(() => { raf.current = null; setMouseX(pendingX.current); });
  };
  const measureCenters = () => {
    centers.current = refs.current.map((el) => {
      if (!el) return Number.POSITIVE_INFINITY;
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2;
    });
  };

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menu]);

  const sizeFor = (i: number) => {
    if (mouseX == null) return BASE;
    const center = centers.current[i];
    if (center == null || !isFinite(center)) return BASE;
    const d = mouseX - center;
    return BASE + AMP * Math.exp(-(d * d) / (2 * SIGMA * SIGMA));
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center pb-3">
      <div
        data-dock
        onPointerEnter={() => measureCenters()}
        onPointerMove={(e) => trackX(e.clientX)}
        onPointerLeave={() => { if (raf.current != null) cancelAnimationFrame(raf.current); raf.current = null; setMouseX(null); }}
        onContextMenu={(e) => e.preventDefault()}
        className="pointer-events-auto flex items-end gap-2 rounded-[22px] border border-white/10 bg-white/[0.06] px-3 pb-2 pt-2 backdrop-blur-2xl"
        style={{ boxShadow: "0 18px 50px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)" }}
      >
        {apps.map((a, i) =>
          a === "sep" ? (
            <div key={`sep-${i}`} className="mx-0.5 mb-1 h-9 w-px self-end bg-white/12" />
          ) : (
            <DockItem
              key={a.id}
              app={a}
              size={sizeFor(i)}
              setRef={(el) => (refs.current[i] = el)}
              onActivate={() => (a.onClick ? a.onClick() : a.href && router.push(a.href))}
              onContext={(e) => {
                // Always handle it here so the desktop's wallpaper menu never fires.
                e.preventDefault();
                e.stopPropagation();
                setMenu({ x: e.clientX, y: e.clientY, app: a });
              }}
            />
          )
        )}
      </div>

      {menu && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{ left: Math.max(8, menu.x - 90), bottom: 86 }}
          className="dz-solidify pointer-events-auto absolute z-[60] w-[190px] rounded-xl border border-white/12 bg-[rgb(var(--ink-elevated)/0.92)] p-1.5 shadow-2xl backdrop-blur-2xl"
        >
          {/* the thing's name */}
          <div className="flex items-center gap-2 px-2.5 py-1.5">
            <menu.app.icon size={14} style={{ color: menu.app.accent ?? "var(--os-accent,#00ED82)" }} />
            <span className="truncate text-xs font-semibold text-fg">{menu.app.label}</span>
            {menu.app.running && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: menu.app.accent ?? "var(--os-accent,#00ED82)" }} />}
          </div>
          <div className="my-1 h-px bg-white/10" />
          {/* close / quit the open window */}
          {menu.app.running && menu.app.onClose && (
            <DockMenuItem onClick={() => { menu.app.onClose!(); setMenu(null); }}>Close window</DockMenuItem>
          )}
          {/* remove a pinned app from the dock */}
          {menu.app.appId && (
            <DockMenuItem onClick={() => { removeFromDock(menu.app.appId!); setMenu(null); }}>Remove from Dock</DockMenuItem>
          )}
          <DockMenuItem onClick={() => { window.dispatchEvent(new CustomEvent("dizrupt:launchpad")); setMenu(null); }}>Open Launcher</DockMenuItem>
        </div>
      )}
    </div>
  );
}

function DockMenuItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-fg-secondary transition-colors hover:bg-[var(--os-accent,#00ED82)] hover:text-black"
    >
      {children}
    </button>
  );
}

const DockItem = memo(function DockItem({
  app, size, setRef, onActivate, onContext,
}: { app: DockApp; size: number; setRef: (el: HTMLButtonElement | null) => void; onActivate: () => void; onContext?: (e: React.MouseEvent) => void }) {
  const Icon = app.icon;
  const accent = app.accent ?? "#2BD9FF";
  const controls = useAnimationControls();
  const prevRunning = useRef(app.running);

  // macOS launch bounce — when an app transitions to running (a window opens),
  // the icon springs up and settles.
  const bounce = () => controls.start({ y: [0, -18, 0, -7, 0], transition: { duration: 0.62, times: [0, 0.3, 0.55, 0.78, 1], ease: "easeOut" } });
  useEffect(() => {
    if (app.running && !prevRunning.current) bounce();
    prevRunning.current = app.running;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.running]);

  return (
    <button
      ref={setRef}
      onClick={() => { bounce(); onActivate(); }}
      onContextMenu={onContext}
      title={app.label}
      aria-label={app.label}
      aria-pressed={app.running ? "true" : undefined}
      className="group relative flex flex-col items-center justify-end"
      style={{ width: size, height: size, transition: "width 90ms ease-out, height 90ms ease-out" }}
    >
      {/* tooltip — theme-aware so it stays readable in light mode */}
      <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md border border-line bg-[rgb(var(--ink-elevated)/0.96)] px-2 py-1 text-2xs font-medium text-fg opacity-0 shadow-lg backdrop-blur-md transition-opacity group-hover:opacity-100">
        {app.label}
      </span>
      <motion.span
        animate={controls}
        className={cn(
          "grid h-full w-full place-items-center rounded-[12px] border transition-colors",
          app.dimmed ? "opacity-50" : "opacity-100"
        )}
        style={{
          borderColor: `${accent}33`,
          background: `linear-gradient(160deg, ${accent}22, rgba(13,14,17,0.7))`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
        }}
      >
        <Icon style={{ width: size * 0.46, height: size * 0.46, color: accent }} />
      </motion.span>
      {/* running indicator */}
      <span
        className={cn("mt-0.5 h-1 w-1 rounded-full transition-opacity", app.running ? "opacity-100" : "opacity-0")}
        style={{ background: accent }}
      />
    </button>
  );
});
