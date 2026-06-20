"use client";

// Mission Control — the exposé. Press F3 (or run it from Spotlight / the
// menubar) and every open window lifts off the desktop into a tidy, staggered
// grid; click one to dive back into it focused. Closed windows are offered
// along the bottom as a "launch" tray. Stylised cards (not live thumbnails) so
// it stays buttery at any window count. Opens on `dizrupt:mission-control`.

import { useEffect, useRef, useState } from "react";
import { useFocusTrap } from "@/lib/focus-trap";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

export interface MCItem {
  id: string;
  title: string;
  icon: React.ElementType;
  accent: string;
  minimized: boolean;
  closed: boolean;
}

export function MissionControl({
  items,
  onSelect,
  onLaunch,
}: {
  items: MCItem[];
  onSelect: (id: string) => void;
  onLaunch: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const trapRef = useRef<HTMLDivElement>(null);
  useFocusTrap(trapRef, open, { onEscape: () => setOpen(false) });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F3") { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === "Escape" && open) setOpen(false);
    };
    const onEvt = () => setOpen((o) => !o);
    window.addEventListener("keydown", onKey);
    window.addEventListener("dizrupt:mission-control", onEvt);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("dizrupt:mission-control", onEvt); };
  }, [open]);

  const live = items.filter((w) => !w.closed);
  const closed = items.filter((w) => w.closed);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={trapRef}
          role="dialog" aria-modal="true" aria-label="Mission Control — all windows"
          className="fixed inset-0 z-[160] flex flex-col bg-black/45 backdrop-blur-xl"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          onClick={() => setOpen(false)}
        >
          <div className="px-6 pt-5 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Mission Control</div>
          </div>

          {/* live windows grid */}
          <div className="flex flex-1 items-center justify-center p-8">
            <div role="grid" aria-label="Open windows" className="grid max-w-[1100px] grid-cols-2 gap-6 sm:grid-cols-3">
              {live.map((w, i) => {
                const Icon = w.icon;
                return (
                  <motion.button
                    key={w.id}
                    role="gridcell"
                    aria-label={`Switch to ${w.title}`}
                    initial={{ opacity: 0, scale: 0.8, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 320, damping: 26 }}
                    onClick={(e) => { e.stopPropagation(); onSelect(w.id); setOpen(false); }}
                    className="group relative h-[180px] w-[300px] overflow-hidden rounded-xl border border-white/15 text-left shadow-2xl"
                    style={{ background: `linear-gradient(150deg, ${w.accent}1f, rgba(12,13,16,0.92))` }}
                  >
                    {/* faux title bar */}
                    <div className="flex h-8 items-center gap-1.5 border-b border-white/10 bg-black/30 px-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                      <span className="ml-2 truncate text-2xs font-semibold text-white/80">{w.title}</span>
                      {w.minimized && <span className="ml-auto rounded bg-white/10 px-1.5 text-[10px] text-white/60">min</span>}
                    </div>
                    {/* faux body */}
                    <div className="flex items-center gap-3 p-4">
                      <span className="grid h-12 w-12 place-items-center rounded-xl border" style={{ borderColor: `${w.accent}55`, background: `${w.accent}22`, color: w.accent }}>
                        <Icon size={24} />
                      </span>
                      <div className="flex-1 space-y-1.5">
                        <span className="block h-2 w-3/4 rounded-full bg-white/15" />
                        <span className="block h-2 w-1/2 rounded-full bg-white/10" />
                        <span className="block h-2 w-2/3 rounded-full bg-white/10" />
                      </div>
                    </div>
                    <span className="absolute inset-0 ring-2 ring-transparent transition-all group-hover:ring-white/40" style={{ borderRadius: 12 }} />
                  </motion.button>
                );
              })}
              {live.length === 0 && <div className="col-span-full text-center text-sm text-white/60">No open windows — launch one below.</div>}
            </div>
          </div>

          {/* closed apps tray */}
          {closed.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 px-6 pb-8" onClick={(e) => e.stopPropagation()}>
              <span className="mr-1 text-2xs font-medium uppercase tracking-wider text-white/40">Launch</span>
              {closed.map((w) => {
                const Icon = w.icon;
                return (
                  <button
                    key={w.id}
                    onClick={() => { onLaunch(w.id); setOpen(false); }}
                    className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-2xs font-medium text-white/85 transition-colors hover:bg-white/[0.14]"
                  >
                    <Icon size={14} style={{ color: w.accent }} /> {w.title}
                    <Plus size={11} className="text-white/50" />
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
