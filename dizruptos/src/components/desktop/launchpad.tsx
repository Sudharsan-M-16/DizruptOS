"use client";

// Launchpad — the full-screen app grid (F4 / dock). Every DizruptOS app, with
// search, one-click launch, and a pin toggle so the user curates their own dock
// (state lives in the OS store, persisted). Opens on `dizrupt:launchpad`.

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Search } from "lucide-react";
import { APPS, iconFor } from "@/lib/desktop-apps";
import { useOS } from "@/lib/os";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export function Launchpad() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const dockHidden = useOS((s) => s.dockHidden);
  const removeFromDock = useOS((s) => s.removeFromDock);
  const pinToDock = useOS((s) => s.pinToDock);

  useEffect(() => {
    const onEvt = () => setOpen((o) => !o);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F4") { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("dizrupt:launchpad", onEvt);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("dizrupt:launchpad", onEvt); window.removeEventListener("keydown", onKey); };
  }, [open]);

  const can = useSession((s) => s.can);
  const apps = useMemo(
    () => APPS.filter((a) => (!a.perm || can(a.perm)) && (!q || a.label.toLowerCase().includes(q.toLowerCase()))),
    [q, can]
  );
  const launch = (id: string) => { window.dispatchEvent(new CustomEvent("dizrupt:launch", { detail: { id } })); setOpen(false); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog" aria-modal="true" aria-label="Launchpad — all apps"
          className="fixed inset-0 z-[165] flex flex-col items-center bg-black/40 backdrop-blur-2xl"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          onClick={() => setOpen(false)}
        >
          {/* search */}
          <div className="mt-[7vh] flex w-[340px] items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4" onClick={(e) => e.stopPropagation()}>
            <Search size={16} className="text-white/60" />
            <input
              autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search apps"
              className="h-10 flex-1 bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none"
            />
          </div>

          {/* grid */}
          <div className="mt-10 grid max-w-[900px] grid-cols-5 gap-x-8 gap-y-7 px-8" onClick={(e) => e.stopPropagation()}>
            {apps.map((a, i) => {
              const Icon = iconFor(a.iconKey);
              const hidden = dockHidden.includes(a.id);
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.018, type: "spring", stiffness: 360, damping: 24 }}
                  className="group relative flex flex-col items-center gap-2"
                >
                  <button onClick={() => launch(a.id)} className="grid h-[68px] w-[68px] place-items-center rounded-[18px] border transition-transform hover:scale-105 active:scale-95"
                    style={{ borderColor: `${a.accent}50`, background: `linear-gradient(160deg, ${a.accent}33, rgba(12,13,16,0.85))`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 24px -10px ${a.accent}66` }}>
                    <Icon size={30} style={{ color: a.accent }} />
                  </button>
                  <span className="max-w-[84px] truncate text-2xs font-medium text-white/85">{a.label}</span>
                  {/* pin toggle */}
                  <button
                    onClick={() => (hidden ? pinToDock(a.id) : removeFromDock(a.id))}
                    title={hidden ? "Add to Dock" : "Remove from Dock"}
                    className={cn("absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-white/20 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100", hidden ? "bg-black/50" : "bg-black/50")}
                  >
                    {hidden ? <Plus size={11} /> : <Check size={11} />}
                  </button>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-auto pb-8 text-2xs text-white/40">Click an app to open · hover to pin / unpin from the Dock · esc to close</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
