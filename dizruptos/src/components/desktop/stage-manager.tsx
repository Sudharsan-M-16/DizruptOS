"use client";

// Stage Manager — macOS Ventura-style window group organizer.
// When enabled (via ⌘-F5 or Control Center toggle), windows auto-arrange:
//   - The focused window occupies the primary canvas (right 75%)
//   - Other open windows are stacked in a left thumbnail rail (25%)
//   - Clicking a thumbnail makes it the primary window
//   - Dragging a thumbnail onto the primary creates a window group
//
// Integration: set `stageManager: true` in useOS; this component reads it
// and applies layout transformations on top of the normal window positions.

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOS } from "@/lib/os";
import { cn } from "@/lib/utils";

interface StageWindow {
  id: string;
  title: string;
  icon: React.ElementType;
  accent: string;
}

interface StageManagerProps {
  windows: StageWindow[];
  primaryId: string | undefined;
  onSelect: (id: string) => void;
}

export function StageManager({ windows, primaryId, onSelect }: StageManagerProps) {
  const stageManager = useOS((s) => s.stageManager);
  const [hovered, setHovered] = useState<string | null>(null);

  if (!stageManager) return null;

  const others = windows.filter((w) => w.id !== primaryId);
  const primary = windows.find((w) => w.id === primaryId);

  return (
    <motion.div
      initial={{ x: -220, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -220, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 38 }}
      className="pointer-events-none absolute left-0 top-0 z-[450] flex h-full w-[200px] flex-col gap-3 px-2.5 py-[52px]"
      style={{ backdropFilter: "blur(20px) saturate(180%)", background: "rgba(0,0,0,0.18)" }}
    >
      {others.map((w) => {
        const Icon = w.icon;
        return (
          <motion.button
            key={w.id}
            className="pointer-events-auto group relative w-full overflow-hidden rounded-xl border transition-all"
            style={{
              height: 110,
              borderColor: hovered === w.id ? w.accent : "rgba(255,255,255,0.08)",
              background: hovered === w.id ? `${w.accent}14` : "rgba(255,255,255,0.04)",
              boxShadow: hovered === w.id ? `0 0 0 1px ${w.accent}40, 0 4px 24px rgba(0,0,0,0.3)` : "0 2px 12px rgba(0,0,0,0.2)",
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onHoverStart={() => setHovered(w.id)}
            onHoverEnd={() => setHovered(null)}
            onClick={() => onSelect(w.id)}
            aria-label={`Switch to ${w.title}`}
          >
            {/* frosted preview placeholder — in a real app this would be an
                offscreen canvas rendered by the window compositor */}
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 30%, ${w.accent}10, transparent 60%)` }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
              <Icon size={24} style={{ color: w.accent }} />
              <span className="line-clamp-2 px-2 text-center text-[11px] font-medium text-white/70">{w.title}</span>
            </div>
            {/* live indicator */}
            <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full" style={{ background: w.accent }} />
          </motion.button>
        );
      })}

      {others.length === 0 && (
        <div className="pointer-events-none flex h-20 items-center justify-center rounded-xl border border-white/5 text-[11px] text-white/30">
          No other windows
        </div>
      )}

      {/* current primary label */}
      {primary && (
        <div className="mt-auto rounded-xl border border-white/5 px-3 py-2">
          <div className="text-[10px] text-white/30">Current</div>
          <div className="mt-0.5 truncate text-xs font-semibold text-white/70">{primary.title}</div>
        </div>
      )}
    </motion.div>
  );
}

// Stage Manager toggle button — used in Control Center.
export function StageManagerToggle() {
  const stageManager = useOS((s) => s.stageManager);
  const toggleStageManager = useOS((s) => s.toggleStageManager);

  return (
    <button
      onClick={toggleStageManager}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
        stageManager
          ? "bg-brand/20 text-brand ring-1 ring-brand/30"
          : "bg-ink-elevated text-fg-secondary hover:bg-ink-surface"
      )}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="2" width="4.5" height="12" rx="1.5" fill="currentColor" opacity="0.5" />
        <rect x="6.5" y="2" width="8.5" height="12" rx="1.5" fill="currentColor" />
      </svg>
      Stage Manager
    </button>
  );
}
