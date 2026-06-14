"use client";

// Desktop context menu — right-click the wallpaper to get the macOS quick
// actions: change wallpaper (inline grid), flip appearance, retint with an
// accent, open System Settings. Renders at the cursor, closes on any outside
// click or Escape. Wraps the desktop surface as a transparent capture layer so
// right-clicks on windows still bubble to their own handlers.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Image as ImageIcon, Moon, SlidersHorizontal, Sun, SunMoon } from "lucide-react";
import { ACCENTS, WALLPAPERS, useOS } from "@/lib/os";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export function DesktopContextMenu({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const theme = useSession((s) => s.theme);
  const setTheme = useOS((s) => s.setTheme);
  const setWallpaper = useOS((s) => s.setWallpaper);
  const wallpaperId = useOS((s) => s.wallpaperId);
  const setAccent = useOS((s) => s.setAccent);
  const accentId = useOS((s) => s.accentId);
  const accentHex = useOS((s) => s.accent().hex);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("pointerdown", close); window.removeEventListener("keydown", onKey); };
  }, [menu]);

  return (
    <div
      onContextMenu={(e) => {
        // only when the bare desktop is right-clicked (not a window)
        if ((e.target as HTMLElement).closest('[role="dialog"]')) return;
        e.preventDefault();
        const x = Math.min(e.clientX, window.innerWidth - 250);
        const y = Math.min(e.clientY, window.innerHeight - 360);
        setMenu({ x, y });
      }}
      className="contents"
    >
      {children}

      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ left: menu.x, top: menu.y }}
            className="absolute z-[150] w-[230px] rounded-xl border border-white/12 bg-[rgb(var(--ink-elevated)/0.85)] p-2 shadow-2xl backdrop-blur-2xl"
          >
            <Label>Wallpaper</Label>
            <div className="grid grid-cols-3 gap-1.5 px-1 pb-1.5">
              {WALLPAPERS.map((w) => (
                <button
                  key={w.id}
                  onClick={() => { setWallpaper(w.id); setMenu(null); }}
                  title={w.label}
                  className="aspect-[16/10] rounded-md border transition-transform hover:scale-105"
                  style={{ background: w.swatch, borderColor: wallpaperId === w.id ? accentHex : "rgba(255,255,255,0.1)", borderWidth: wallpaperId === w.id ? 2 : 1 }}
                />
              ))}
            </div>

            <Sep />
            <Label>Appearance</Label>
            <div className="flex gap-1 px-1 pb-1">
              {[
                { id: "light" as const, icon: Sun },
                { id: "dark" as const, icon: Moon },
                { id: "system" as const, icon: SunMoon },
              ].map((t) => {
                const Icon = t.icon;
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn("flex flex-1 items-center justify-center rounded-md py-1.5 transition-colors", active ? "text-black" : "text-fg-secondary hover:bg-white/10")}
                    style={active ? { background: accentHex } : undefined}
                  >
                    <Icon size={15} />
                  </button>
                );
              })}
            </div>

            <Sep />
            <Label>Accent</Label>
            <div className="flex flex-wrap gap-1.5 px-1 pb-1.5">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccent(a.id)}
                  title={a.label}
                  className="h-5 w-5 rounded-full transition-transform hover:scale-110"
                  style={{ background: a.hex, boxShadow: accentId === a.id ? `0 0 0 2px rgb(var(--ink-elevated)), 0 0 0 3.5px ${a.hex}` : undefined }}
                />
              ))}
            </div>

            <Sep />
            <Item icon={SlidersHorizontal} label="System Settings…" onClick={() => { window.dispatchEvent(new CustomEvent("dizrupt:open-settings")); setMenu(null); }} />
            <Item icon={ImageIcon} label="Next wallpaper" onClick={() => {
              const i = WALLPAPERS.findIndex((w) => w.id === wallpaperId);
              setWallpaper(WALLPAPERS[(i + 1) % WALLPAPERS.length].id);
              setMenu(null);
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="px-2 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">{children}</div>;
}
function Sep() { return <div className="my-1 h-px bg-white/10" />; }
function Item({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs text-fg-secondary transition-colors hover:bg-[var(--os-accent,#00ED82)] hover:text-black">
      <Icon size={14} /> {label}
    </button>
  );
}
