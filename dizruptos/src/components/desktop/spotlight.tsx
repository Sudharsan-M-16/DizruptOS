"use client";

// Spotlight — the ⌘Space command surface. A single centered glass field that
// searches everything on the OS: open/launch windows, jump to routes, find
// people or projects (opens the relevant app), and run system actions. Full
// keyboard control (↑/↓ to move, ↵ to run, esc to dismiss). Opens on ⌘Space,
// ⌘K, the menubar search, or a `dizrupt:spotlight` event. Results are ranked
// by simple substring relevance — swap for a backend search later.

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  AppWindow, ArrowRight, CornerDownLeft, KanbanSquare, Lock, Moon, Search,
  SlidersHorizontal, Sun, Users,
} from "lucide-react";
import { employees, projects } from "@/lib/data";
import { useOS } from "@/lib/os";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export interface SpotApp { id: string; label: string; icon: React.ElementType; accent?: string }
export interface SpotRoute { label: string; href: string; icon: React.ElementType; accent?: string }

interface Result {
  key: string;
  label: string;
  sub?: string;
  group: string;
  icon: React.ElementType;
  accent?: string;
  run: () => void;
}

export function Spotlight({
  apps,
  routes,
  onOpenWindow,
}: {
  apps: SpotApp[];
  routes: SpotRoute[];
  onOpenWindow: (id: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const theme = useSession((s) => s.theme);
  const setTheme = useOS((s) => s.setTheme);
  const lock = useOS((s) => s.lock);

  // open/close hotkeys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const spotlight = (e.metaKey || e.ctrlKey) && (e.code === "Space" || e.key === "k" || e.key === "K");
      if (spotlight) { e.preventDefault(); setOpen((o) => !o); }
    };
    const onEvt = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("dizrupt:spotlight", onEvt);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("dizrupt:spotlight", onEvt); };
  }, []);

  useEffect(() => {
    if (open) { setQ(""); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  const close = () => setOpen(false);

  const results = useMemo<Result[]>(() => {
    const all: Result[] = [];
    apps.forEach((a) => all.push({ key: `app-${a.id}`, label: a.label, group: "Applications", icon: a.icon, accent: a.accent, sub: "Open window", run: () => { onOpenWindow(a.id); close(); } }));
    routes.forEach((r) => all.push({ key: `route-${r.href}`, label: r.label, group: "Go to", icon: r.icon, accent: r.accent, sub: r.href, run: () => { router.push(r.href); close(); } }));
    employees.forEach((e) => all.push({ key: `ppl-${e.id}`, label: e.name, sub: e.title, group: "People", icon: Users, accent: e.accent, run: () => { onOpenWindow("directory"); close(); } }));
    projects.forEach((p) => all.push({ key: `prj-${p.id}`, label: p.name, sub: `${p.code} · ${p.health}`, group: "Projects", icon: KanbanSquare, accent: "#7C6CFF", run: () => { onOpenWindow("matrix"); close(); } }));
    // system actions
    all.push({ key: "act-settings", label: "System Settings", sub: "Appearance, wallpaper, accent", group: "Actions", icon: SlidersHorizontal, run: () => { window.dispatchEvent(new CustomEvent("dizrupt:open-settings")); close(); } });
    all.push({ key: "act-mission", label: "Mission Control", sub: "See all windows", group: "Actions", icon: AppWindow, run: () => { window.dispatchEvent(new CustomEvent("dizrupt:mission-control")); close(); } });
    all.push({ key: "act-theme", label: theme === "dark" ? "Switch to Light" : "Switch to Dark", sub: "Appearance", group: "Actions", icon: theme === "dark" ? Sun : Moon, run: () => { setTheme(theme === "dark" ? "light" : "dark"); close(); } });
    all.push({ key: "act-lock", label: "Lock Screen", sub: "Secure the desktop", group: "Actions", icon: Lock, run: () => { lock(); close(); } });

    if (!q.trim()) return all.filter((r) => r.group === "Applications" || r.group === "Actions");
    const needle = q.toLowerCase();
    return all
      .map((r) => {
        const hay = (r.label + " " + (r.sub ?? "")).toLowerCase();
        const idx = hay.indexOf(needle);
        return idx === -1 ? null : { r, score: (r.label.toLowerCase().startsWith(needle) ? 0 : 100) + idx };
      })
      .filter(Boolean)
      .sort((a, b) => a!.score - b!.score)
      .slice(0, 9)
      .map((x) => x!.r);
  }, [q, apps, routes, theme, onOpenWindow, router, setTheme, lock]);

  useEffect(() => { if (active >= results.length) setActive(0); }, [results, active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); results[active]?.run(); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  };

  // group rendering order
  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[170] flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}
          onPointerDown={close}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <motion.div
            role="dialog" aria-modal="true" aria-label="Spotlight search"
            initial={{ opacity: 0, scale: 0.97, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onPointerDown={(e) => e.stopPropagation()}
            className="relative w-[600px] max-w-[92vw] overflow-hidden rounded-2xl border border-white/15 bg-[rgb(var(--ink-elevated)/0.82)] shadow-2xl backdrop-blur-2xl"
          >
            {/* field */}
            <div className="flex items-center gap-3 border-b border-line/60 px-4">
              <Search size={20} className="text-fg-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search DizruptOS — apps, people, projects, actions…"
                className="h-14 flex-1 bg-transparent text-base text-fg placeholder:text-fg-faint focus:outline-none"
              />
              <kbd className="rounded-md border border-line bg-ink-surface px-1.5 py-0.5 text-2xs text-fg-muted">esc</kbd>
            </div>

            {/* results */}
            <div className="max-h-[46vh] overflow-y-auto p-2">
              {results.length === 0 && <div className="px-3 py-8 text-center text-xs text-fg-muted">No results for “{q}”.</div>}
              {results.map((r, i) => {
                const Icon = r.icon;
                const header = r.group !== lastGroup ? r.group : null;
                lastGroup = r.group;
                const isActive = i === active;
                return (
                  <div key={r.key}>
                    {header && <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-fg-faint">{header}</div>}
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={r.run}
                      className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors", isActive ? "text-white" : "hover:bg-ink-elevated")}
                      style={isActive ? { background: "var(--os-accent,#00ED82)" } : undefined}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border" style={{ borderColor: isActive ? "rgba(255,255,255,0.35)" : `${r.accent ?? "#888"}40`, background: isActive ? "rgba(255,255,255,0.15)" : `${r.accent ?? "#888"}1a`, color: isActive ? "#fff" : r.accent }}>
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className={cn("truncate text-sm font-medium", isActive ? "text-white" : "text-fg")}>{r.label}</div>
                        {r.sub && <div className={cn("truncate text-2xs", isActive ? "text-white/75" : "text-fg-muted")}>{r.sub}</div>}
                      </div>
                      {isActive && <CornerDownLeft size={14} className="text-white/80" />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* footer */}
            <div className="flex items-center gap-3 border-t border-line/60 px-4 py-2 text-2xs text-fg-muted">
              <span className="flex items-center gap-1"><ArrowRight size={11} className="rotate-90" /> navigate</span>
              <span className="flex items-center gap-1"><CornerDownLeft size={11} /> open</span>
              <span className="ml-auto font-medium">DizruptOS Spotlight</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
