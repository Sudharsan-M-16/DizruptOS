"use client";

// The Launcher — one surface for everything (replaces the old separate Launchpad,
// Spotlight and Mission Control). Open with F3, F4, ⌘/Ctrl+Space, the menubar
// search, or the dock launcher button. It shows:
//   • a search box that filters your apps as you type,
//   • your open windows (click to jump back in),
//   • every app you have access to (click to launch).
// RBAC + "hidden" filtering happen upstream, so this only ever shows allowed apps.

import { useEffect, useMemo, useRef, useState } from "react";
import { useFocusTrap } from "@/lib/focus-trap";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";

export interface MCItem {
  id: string;
  title: string;
  icon: React.ElementType;
  accent: string;
  minimized: boolean;
  closed: boolean;
}
export interface MCApp {
  id: string;
  label: string;
  icon: React.ElementType;
  accent: string;
}

export function MissionControl({
  items,
  apps,
  onSelect,
  onLaunch,
}: {
  items: MCItem[];
  apps: MCApp[];
  onSelect: (id: string) => void;
  onLaunch: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const trapRef = useRef<HTMLDivElement>(null);
  useFocusTrap(trapRef, open, { onEscape: () => setOpen(false) });

  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F3" || e.key === "F4") { e.preventDefault(); toggle(); }
      else if (e.key === " " && (e.metaKey || e.ctrlKey)) { e.preventDefault(); toggle(); }
      else if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("dizrupt:mission-control", toggle);
    window.addEventListener("dizrupt:launchpad", toggle);
    window.addEventListener("dizrupt:spotlight", toggle);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("dizrupt:mission-control", toggle);
      window.removeEventListener("dizrupt:launchpad", toggle);
      window.removeEventListener("dizrupt:spotlight", toggle);
    };
  }, [open]);

  // clear the query each time it opens so search always starts fresh
  useEffect(() => { if (open) setQ(""); }, [open]);

  const live = items.filter((w) => !w.closed);
  const query = q.trim().toLowerCase();
  const shownApps = useMemo(
    () => (query ? apps.filter((a) => a.label.toLowerCase().includes(query)) : apps),
    [apps, query]
  );
  const shownWindows = query ? live.filter((w) => w.title.toLowerCase().includes(query)) : live;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={trapRef}
          role="dialog" aria-modal="true" aria-label="Launcher — apps, windows and search"
          className="fixed inset-0 z-[160] flex flex-col bg-black/55 backdrop-blur-2xl"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}
          onClick={() => setOpen(false)}
        >
          {/* search */}
          <div className="flex justify-center pt-[6vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex w-[380px] max-w-[88vw] items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4">
              <Search size={16} className="text-white/60" />
              <input
                autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search apps and windows"
                aria-label="Search apps and windows"
                className="h-10 flex-1 bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-8" onClick={(e) => e.stopPropagation()}>
            {/* open windows */}
            {shownWindows.length > 0 && (
              <div className="mx-auto mb-9 max-w-[1100px]">
                <div className="mb-3 text-2xs font-medium uppercase tracking-[0.2em] text-white/45">Open windows</div>
                <div role="grid" aria-label="Open windows" className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                  {shownWindows.map((w, i) => {
                    const Icon = w.icon;
                    return (
                      <motion.button
                        key={w.id}
                        role="gridcell"
                        aria-label={`Switch to ${w.title}`}
                        initial={{ opacity: 0, scale: 0.85, y: 18 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: i * 0.03, type: "spring", stiffness: 320, damping: 26 }}
                        onClick={() => { onSelect(w.id); setOpen(false); }}
                        className="group relative h-[150px] overflow-hidden rounded-xl border border-white/15 text-left shadow-2xl"
                        style={{ background: `linear-gradient(150deg, ${w.accent}1f, rgba(12,13,16,0.92))` }}
                      >
                        <div className="flex h-8 items-center gap-1.5 border-b border-white/10 bg-black/30 px-3">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                          <span className="ml-2 truncate text-2xs font-semibold text-white/80">{w.title}</span>
                          {w.minimized && <span className="ml-auto rounded bg-white/10 px-1.5 text-[10px] text-white/60">min</span>}
                        </div>
                        <div className="flex items-center gap-3 p-4">
                          <span className="grid h-12 w-12 place-items-center rounded-xl border" style={{ borderColor: `${w.accent}55`, background: `${w.accent}22`, color: w.accent }}>
                            <Icon size={24} />
                          </span>
                          <div className="flex-1 space-y-1.5">
                            <span className="block h-2 w-3/4 rounded-full bg-white/15" />
                            <span className="block h-2 w-1/2 rounded-full bg-white/10" />
                          </div>
                        </div>
                        <span className="absolute inset-0 rounded-xl ring-2 ring-transparent transition-all group-hover:ring-white/40" />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* all apps */}
            <div className="mx-auto max-w-[820px]">
              <div className="mb-3 text-2xs font-medium uppercase tracking-[0.2em] text-white/45">{query ? "Apps" : "All apps"}</div>
              {shownApps.length === 0 && shownWindows.length === 0 ? (
                <div className="py-12 text-center text-sm text-white/50">No matches for “{q}”.</div>
              ) : (
                <div role="grid" aria-label="All applications" className="grid grid-cols-4 gap-x-7 gap-y-6 sm:grid-cols-5">
                  {shownApps.map((a, i) => {
                    const Icon = a.icon;
                    return (
                      <motion.button
                        key={a.id}
                        role="gridcell"
                        aria-label={`Open ${a.label}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(i * 0.015, 0.3), type: "spring", stiffness: 360, damping: 24 }}
                        onClick={() => { onLaunch(a.id); setOpen(false); }}
                        className="group flex flex-col items-center gap-2"
                      >
                        <span className="grid h-[64px] w-[64px] place-items-center rounded-[18px] border transition-transform group-hover:scale-105 group-active:scale-95"
                          style={{ borderColor: `${a.accent}50`, background: `linear-gradient(160deg, ${a.accent}33, rgba(12,13,16,0.85))`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 24px -10px ${a.accent}66` }}>
                          <Icon size={28} style={{ color: a.accent }} />
                        </span>
                        <span className="max-w-[84px] truncate text-2xs font-medium text-white/85">{a.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="pb-6 text-center text-2xs text-white/40">Click an app to open · click a window to switch · esc to close</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
