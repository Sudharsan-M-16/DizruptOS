"use client";

// Toaster — transient macOS-style notification toasts that slide in at the top-
// right (under the menubar) and auto-dismiss. Fire one from anywhere with
//   window.dispatchEvent(new CustomEvent("dizrupt:toast",
//     { detail: { title, body?, tone? } }))   // tone: "info" | "warn" | "danger"
// Used for access-denied feedback today; ready for live notifications later.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Ban, Bell, Info } from "lucide-react";
import { useOS } from "@/lib/os";

interface Toast { id: number; title: string; body?: string; tone: "info" | "warn" | "danger" }
const TONE: Record<Toast["tone"], { color: string; icon: React.ElementType }> = {
  info: { color: "var(--os-accent,#00ED82)", icon: Info },
  warn: { color: "#F59E0B", icon: AlertTriangle },
  danger: { color: "#EF4444", icon: Ban },
};
let seq = 0;

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      // Do Not Disturb silences everything except access-denied (a security signal).
      if (useOS.getState().dnd) {
        const tone = (e as CustomEvent).detail?.tone;
        if (tone !== "danger") return;
      }
      const d = (e as CustomEvent).detail as { title?: string; body?: string; tone?: Toast["tone"] } | undefined;
      if (!d?.title) return;
      const id = ++seq;
      setToasts((t) => [...t, { id, title: d.title!, body: d.body, tone: d.tone ?? "info" }].slice(-4));
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
    };
    window.addEventListener("dizrupt:toast", onToast);
    return () => window.removeEventListener("dizrupt:toast", onToast);
  }, []);

  return (
    <div role="status" aria-live="polite" aria-label="Notifications" className="pointer-events-none fixed right-3 top-9 z-[195] flex w-[320px] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const tone = TONE[t.tone];
          const Icon = tone.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="dz-solidify pointer-events-auto flex items-start gap-2.5 rounded-xl border border-white/12 bg-[rgb(var(--ink-elevated)/0.9)] p-3 shadow-2xl backdrop-blur-2xl"
            >
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg" style={{ background: `${tone.color}22`, color: tone.color }}>
                <Icon size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-fg"><Bell size={11} className="text-fg-muted" /> {t.title}</div>
                {t.body && <div className="mt-0.5 text-2xs leading-relaxed text-fg-muted">{t.body}</div>}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/** Helper to fire a toast from anywhere. */
export function toast(title: string, body?: string, tone: Toast["tone"] = "info") {
  window.dispatchEvent(new CustomEvent("dizrupt:toast", { detail: { title, body, tone } }));
}
