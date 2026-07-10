"use client";

// System Settings.app — a real draggable macOS-style window that opens from the
//  menu, the dock, or the desktop context menu (it listens for the
// `dizrupt:open-settings` event). Sidebar + detail layout; every control writes
// straight to the OS store, so the desktop retints live behind it. Self-contained
// (own open state + pointer drag) so it doesn't entangle the window manager.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Check, Image as ImageIcon, Info, Palette, SunMoon } from "lucide-react";
import { GuideContent } from "./guide";
import { ACCENTS, WALLPAPERS, useOS } from "@/lib/os";
import { useSession, type Theme } from "@/lib/session";
import { DizruptMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

type Pane = "appearance" | "wallpaper" | "accent" | "guide" | "about";
const NAV: { id: Pane; label: string; icon: React.ElementType }[] = [
  { id: "appearance", label: "Appearance", icon: SunMoon },
  { id: "wallpaper", label: "Wallpaper", icon: ImageIcon },
  { id: "accent", label: "Accent Color", icon: Palette },
  { id: "guide", label: "User Guide", icon: BookOpen },
  { id: "about", label: "About", icon: Info },
];

// Rendered INSIDE a managed desktop window (so it gets the standard title bar,
// traffic lights, drag, resize, minimize, maximize and z-ordering for free). It
// only owns which pane is showing, and listens for `dizrupt:open-settings` to
// jump to a requested pane (e.g.  → About opens the Guide).
export function SettingsBody() {
  const [pane, setPane] = useState<Pane>("appearance");
  useEffect(() => {
    const onOpen = (e: Event) => {
      const p = (e as CustomEvent).detail?.pane as Pane | undefined;
      if (p) setPane(p);
    };
    window.addEventListener("dizrupt:open-settings", onOpen);
    return () => window.removeEventListener("dizrupt:open-settings", onOpen);
  }, []);
  const accentHex = useOS((s) => s.accent().hex);

  return (
    <div className="flex h-full min-h-0">
      {/* sidebar */}
      <aside className="flex w-[200px] shrink-0 flex-col border-r border-line/60 bg-[rgb(var(--ink-surface)/0.5)] p-2">
        <div className="flex items-center gap-2 px-2 pb-3 pt-1">
          <DizruptMark size={20} glow />
          <span className="font-display text-sm font-bold tracking-tight">System Settings</span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = pane === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setPane(n.id)}
                className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors", active ? "text-white" : "text-fg-secondary hover:bg-white/[0.06]")}
                style={active ? { background: accentHex } : undefined}
              >
                <Icon size={15} /> {n.label}
              </button>
            );
          })}
        </nav>
      </aside>
      {/* detail */}
      <div className="min-w-0 flex-1 overflow-y-auto p-6">
        {pane === "appearance" && <AppearancePane />}
        {pane === "wallpaper" && <WallpaperPane />}
        {pane === "accent" && <AccentPane />}
        {pane === "guide" && <GuideContent />}
        {pane === "about" && <AboutPane />}
      </div>
    </div>
  );
}

function PaneTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 font-display text-xl font-bold tracking-tight">{children}</h2>;
}

function AppearancePane() {
  const theme = useSession((s) => s.theme);
  const setTheme = useOS((s) => s.setTheme);
  const brightness = useOS((s) => s.brightness);
  const setBrightness = useOS((s) => s.setBrightness);
  const accentHex = useOS((s) => s.accent().hex);
  const opts: { id: Theme; label: string; bg: string }[] = [
    { id: "light", label: "Light", bg: "linear-gradient(160deg,#eef3f2,#dfe8e6)" },
    { id: "dark", label: "Dark", bg: "linear-gradient(160deg,#15171b,#08090b)" },
    { id: "system", label: "Auto", bg: "linear-gradient(160deg,#eef3f2 50%,#15171b 50%)" },
  ];
  return (
    <>
      <PaneTitle>Appearance</PaneTitle>
      <div className="grid grid-cols-3 gap-3">
        {opts.map((o) => (
          <button key={o.id} onClick={() => setTheme(o.id)} className="text-left">
            <span className="block aspect-[4/3] rounded-xl border-2" style={{ background: o.bg, borderColor: theme === o.id ? accentHex : "transparent" }} />
            <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium">
              {theme === o.id && <Check size={13} style={{ color: accentHex }} />} {o.label}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-7">
        <div className="mb-2 text-xs font-semibold text-fg-secondary">Brightness</div>
        <input
          type="range" min={0.45} max={1} step={0.01} value={brightness}
          onChange={(e) => setBrightness(parseFloat(e.target.value))}
          className="dz-range2 h-1.5 w-full cursor-pointer appearance-none rounded-full"
          style={{ background: `linear-gradient(90deg, ${accentHex} ${((brightness - 0.45) / 0.55) * 100}%, rgb(var(--line)) ${((brightness - 0.45) / 0.55) * 100}%)` }}
        />
      </div>
      <style jsx>{`.dz-range2::-webkit-slider-thumb{appearance:none;width:16px;height:16px;border-radius:9999px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:pointer}`}</style>
    </>
  );
}

function WallpaperPane() {
  const wallpaperId = useOS((s) => s.wallpaperId);
  const setWallpaper = useOS((s) => s.setWallpaper);
  const accentHex = useOS((s) => s.accent().hex);
  return (
    <>
      <PaneTitle>Wallpaper</PaneTitle>
      <div className="grid grid-cols-3 gap-3">
        {WALLPAPERS.map((w) => {
          const active = wallpaperId === w.id;
          return (
            <button key={w.id} onClick={() => setWallpaper(w.id)} className="text-left transition-transform hover:scale-[1.02]">
              <span className="relative block aspect-[16/10] overflow-hidden rounded-xl border-2" style={{ background: w.swatch, borderColor: active ? accentHex : "rgba(255,255,255,0.08)" }}>
                {active && <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/40 backdrop-blur"><Check size={12} className="text-white" /></span>}
              </span>
              <span className="mt-1.5 block text-xs font-medium">{w.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function AccentPane() {
  const accentId = useOS((s) => s.accentId);
  const setAccent = useOS((s) => s.setAccent);
  return (
    <>
      <PaneTitle>Accent Color</PaneTitle>
      <p className="mb-5 text-xs text-fg-muted">Retints the entire desktop — menubar, dock, windows and focus rings.</p>
      <div className="flex flex-wrap gap-4">
        {ACCENTS.map((a) => {
          const active = accentId === a.id;
          return (
            <button key={a.id} onClick={() => setAccent(a.id)} className="flex flex-col items-center gap-1.5">
              <span className="grid h-11 w-11 place-items-center rounded-full transition-transform hover:scale-110" style={{ background: a.hex, boxShadow: active ? `0 0 0 3px rgb(var(--ink-elevated)), 0 0 0 5px ${a.hex}` : undefined }}>
                {active && <Check size={18} className="text-black/70" />}
              </span>
              <span className="text-2xs font-medium text-fg-secondary">{a.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function AboutPane() {
  const accentHex = useOS((s) => s.accent().hex);
  const rows = [
    ["System", "DizruptOS 1.0 (Aurora)"],
    ["Build", "enterprise-2026.06"],
    ["Window Manager", "Mosaic"],
    ["Engine", "Next.js 14 · React 18"],
    ["Theme", "Adaptive light / dark"],
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="relative">
        <span className="absolute inset-0 -z-10 rounded-full blur-2xl" style={{ background: `radial-gradient(circle, ${accentHex}55, transparent 70%)` }} />
        <DizruptMark size={72} glow />
      </div>
      <div className="mt-4 font-display text-2xl font-bold tracking-tight">DIZRUPT<span style={{ color: accentHex }}>OS</span></div>
      <div className="text-xs text-fg-muted">The operating system for organizational intelligence.</div>
      <div className="mt-6 w-full max-w-[320px] divide-y divide-line/50 rounded-xl border border-line/60 bg-[rgb(var(--ink-surface)/0.5)] text-left text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between px-3.5 py-2">
            <span className="text-fg-muted">{k}</span>
            <span className="font-medium">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
