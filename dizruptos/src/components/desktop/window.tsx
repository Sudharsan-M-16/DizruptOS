"use client";

// A single macOS-style window. Theme-aware frosted vibrancy (light *or* dark,
// driven by the OS theme — not hardcoded), traffic-light controls that reveal
// glyphs on hover, a centered title, a live accent focus ring when frontmost,
// and eight resize handles around the frame. Mount springs in; close/minimize
// scale away like the genie. Content scrolls inside.
//
// FULLSCREEN MODE: when win.maximized, the window covers the entire desktop
// surface edge-to-edge with square corners, no border, no shadow — a proper
// full-window experience. ESC exits. A subtle "Exit Fullscreen" badge appears
// on titlebar hover so users always know how to escape.

import { motion } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { ResizeDir, WinState } from "./use-desktop";
import { WindowErrorBoundary } from "./window-error-boundary";

const HANDLES: { dir: ResizeDir; cls: string }[] = [
  { dir: "n", cls: "left-2 right-2 top-0 h-1.5 cursor-ns-resize" },
  { dir: "s", cls: "left-2 right-2 bottom-0 h-1.5 cursor-ns-resize" },
  { dir: "e", cls: "top-2 bottom-2 right-0 w-1.5 cursor-ew-resize" },
  { dir: "w", cls: "top-2 bottom-2 left-0 w-1.5 cursor-ew-resize" },
  { dir: "ne", cls: "top-0 right-0 h-3 w-3 cursor-nesw-resize" },
  { dir: "nw", cls: "top-0 left-0 h-3 w-3 cursor-nwse-resize" },
  { dir: "se", cls: "bottom-0 right-0 h-3 w-3 cursor-nwse-resize" },
  { dir: "sw", cls: "bottom-0 left-0 h-3 w-3 cursor-nesw-resize" },
];

export function DesktopWindow({
  win,
  frontmost,
  icon: Icon,
  accent = "#00ED82",
  onFocus,
  onStartDrag,
  onStartResize,
  onClose,
  onMinimize,
  onMaximize,
  bare,
  children,
}: {
  win: WinState;
  frontmost: boolean;
  icon: React.ElementType;
  accent?: string;
  onFocus: () => void;
  onStartDrag: (e: React.PointerEvent) => void;
  onStartResize: (dir: ResizeDir, e: React.PointerEvent) => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  /** remove content padding (for iframe apps that fill the window) */
  bare?: boolean;
  children: React.ReactNode;
}) {
  // ESC exits fullscreen for this window when it is frontmost + maximized
  useEffect(() => {
    if (!win.maximized || !frontmost) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onMaximize(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [win.maximized, frontmost, onMaximize]);

  // Genie target = the dock, at the bottom-center of the viewport.
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;
  const genie = {
    opacity: 0,
    scale: 0.04,
    x: vw / 2 - (win.x + win.w / 2),
    y: vh - (win.y + win.h / 2),
    transition: { duration: 0.34, ease: [0.4, 0, 1, 1] as const },
  };

  const isMax = win.maximized;

  return (
    <motion.section
      role="dialog"
      aria-label={win.title}
      initial={{ opacity: 0, scale: 0.94, y: 10 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={genie}
      transition={isMax
        ? { type: "spring", stiffness: 300, damping: 36 }
        : { type: "spring", stiffness: 380, damping: 30 }
      }
      onPointerDown={onFocus}
      style={{
        left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z,
        transformOrigin: "bottom center",
        boxShadow: isMax
          ? "none"
          : frontmost
            ? `0 28px 70px -14px rgba(0,0,0,0.62), 0 0 0 1px ${accent}3a, 0 0 44px -10px ${accent}26`
            : "0 18px 50px -16px rgba(0,0,0,0.5)",
      }}
      className={cn(
        "dz-solidify absolute flex flex-col overflow-hidden backdrop-blur-2xl",
        isMax
          ? "rounded-none border-0 bg-[rgb(var(--ink-elevated)/0.97)]"
          : cn(
              "rounded-[14px] border",
              "bg-[rgb(var(--ink-elevated)/0.80)]",
              frontmost ? "border-white/15 dark:border-white/15" : "border-line/60"
            )
      )}
    >
      {/* top sheen — hidden in fullscreen */}
      {!isMax && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}

      {/* Fullscreen accent bar — 2px colored hairline at the very top */}
      {isMax && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${accent}80 30%, ${accent}80 70%, transparent 100%)` }}
        />
      )}

      {/* title bar — drag disabled in fullscreen */}
      <header
        onPointerDown={isMax ? undefined : onStartDrag}
        onDoubleClick={onMaximize}
        className={cn(
          "group/titlebar relative flex shrink-0 items-center gap-2 px-3",
          isMax
            ? "h-10 cursor-default border-b border-white/[0.06] bg-[rgb(var(--ink-base)/0.55)]"
            : cn(
                "h-9 cursor-grab border-b border-line/60 active:cursor-grabbing",
                frontmost ? "bg-[rgb(var(--ink-raised)/0.5)]" : "bg-transparent"
              )
        )}
      >
        {/* traffic lights */}
        <div
          className="group/lights z-10 flex items-center gap-[7px]"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <TrafficLight color="#FF5F57" title="Close" onClick={onClose} glyph="×" />
          <TrafficLight color="#FEBC2E" title="Minimize" onClick={onMinimize} glyph="–" />
          <TrafficLight
            color="#28C840"
            title={isMax ? "Exit Fullscreen" : "Fullscreen"}
            onClick={onMaximize}
            glyph={isMax ? "↙" : "↗"}
          />
        </div>

        {/* centered title */}
        <div className="pointer-events-none absolute inset-x-0 flex items-center justify-center gap-1.5">
          <Icon
            size={12}
            style={{ color: frontmost ? accent : undefined }}
            className={cn(!frontmost && "text-fg-faint")}
          />
          <span className={cn(
            "max-w-[60%] truncate text-xs font-semibold tracking-tight",
            frontmost ? "text-fg-secondary" : "text-fg-muted"
          )}>
            {win.title}
          </span>
        </div>

        {/* ESC hint — visible only in fullscreen, fades in on titlebar hover */}
        {isMax && (
          <div className="pointer-events-none absolute right-3 flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover/titlebar:opacity-100">
            <kbd className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-fg-muted ring-1 ring-white/10">
              ESC
            </kbd>
            <span className="text-[10px] text-fg-faint">exit fullscreen</span>
          </div>
        )}
      </header>

      {/* content */}
      <div className={cn(
        "min-h-0 flex-1 overflow-hidden",
        bare ? "" : "overflow-y-auto overflow-x-hidden p-4"
      )}>
        <WindowErrorBoundary windowId={win.id} windowTitle={win.title} accent={accent}>
          {children}
        </WindowErrorBoundary>
      </div>

      {/* resize handles (hidden while maximized) */}
      {!isMax &&
        HANDLES.map((h) => (
          <div
            key={h.dir}
            onPointerDown={(e) => onStartResize(h.dir, e)}
            className={cn("absolute z-20", h.cls)}
          />
        ))}
    </motion.section>
  );
}

function TrafficLight({
  color, title, onClick, glyph,
}: {
  color: string; title: string; onClick: () => void; glyph: string;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="grid h-[13px] w-[13px] place-items-center rounded-full text-[10px] font-bold leading-none text-black/60 transition-transform hover:scale-110"
      style={{ background: color, boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.3)" }}
    >
      <span className="opacity-0 transition-opacity group-hover/lights:opacity-100">{glyph}</span>
    </button>
  );
}
