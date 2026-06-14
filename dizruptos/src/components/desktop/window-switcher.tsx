"use client";

// Window Switcher — the DizruptOS take on Alt-Tab / ⌘-Tab. Hold ⌘ (Mac) or Ctrl
// (Windows) and tap the backtick key (`) to cycle through open windows in
// most-recently-used order; release the modifier to jump to the highlighted one.
// Add Shift to go backwards. We deliberately use ⌘/Ctrl+` — the real Alt-Tab and
// browser Ctrl-Tab are reserved by the OS/browser and can't be overridden, so
// this never fights them. A centered HUD shows the choices, macOS-style.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SwitchItem { id: string; title: string; icon: React.ElementType; accent: string }

export function WindowSwitcher({ windows, onSelect }: { windows: SwitchItem[]; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const snapshot = useRef<SwitchItem[]>([]);
  const live = useRef<SwitchItem[]>(windows);
  const selRef = useRef(0);
  live.current = windows;
  selRef.current = sel;

  useEffect(() => {
    const commit = () => {
      const item = snapshot.current[selRef.current];
      setOpen(false);
      if (item) onSelect(item.id);
    };
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "`" || e.code === "Backquote")) {
        e.preventDefault();
        if (!open) {
          const list = live.current;
          if (list.length < 2) return;
          snapshot.current = list;
          setOpen(true);
          setSel(e.shiftKey ? list.length - 1 : 1);
        } else {
          const n = snapshot.current.length;
          setSel((s) => (e.shiftKey ? (s - 1 + n) % n : (s + 1) % n));
        }
      } else if (open && e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (open && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        commit();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (open && (e.key === "Control" || e.key === "Meta")) commit();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onUp); };
  }, [open, onSelect]);

  const items = snapshot.current;

  return (
    <AnimatePresence>
      {open && items.length > 0 && (
        <motion.div
          className="fixed inset-0 z-[185] flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <motion.div
            initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
            className="relative flex max-w-[88vw] items-center gap-2 overflow-x-auto rounded-2xl border border-white/15 bg-[rgb(var(--ink-elevated)/0.85)] p-3 shadow-2xl backdrop-blur-2xl"
          >
            {items.map((it, i) => {
              const Icon = it.icon;
              const active = i === sel;
              return (
                <button
                  key={it.id}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => { setOpen(false); onSelect(it.id); }}
                  className={cn("flex w-[112px] shrink-0 flex-col items-center gap-2 rounded-xl p-3 transition-colors", active ? "" : "opacity-70 hover:opacity-100")}
                  style={active ? { background: "var(--os-accent-soft,rgba(0,237,130,0.14))" } : undefined}
                >
                  <span className="grid h-14 w-14 place-items-center rounded-2xl border" style={{ borderColor: `${it.accent}55`, background: `linear-gradient(160deg, ${it.accent}33, rgba(12,13,16,0.85))` }}>
                    <Icon size={26} style={{ color: it.accent }} />
                  </span>
                  <span className="line-clamp-1 max-w-[100px] text-center text-2xs font-medium text-fg">{it.title}</span>
                </button>
              );
            })}
            <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-2xs text-white/70">
              Hold ⌘/Ctrl, tap <kbd className="rounded border border-white/20 px-1">`</kbd> to cycle · release to open
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
