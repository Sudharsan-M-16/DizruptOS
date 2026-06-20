"use client";

// DizruptOS "system" layer — the OS session that sits on top of the
// authenticated app. It owns the *power state* (boot → lock → desktop), the
// live appearance (accent color, wallpaper, brightness) and the small bits of
// OS chrome that the desktop, menubar, dock, lock screen and Settings app all
// read from. Theme (light/dark) still lives in `useSession` so every route
// shares one source of truth; this store delegates to it.
//
// Inspiration: MacScape's shell power-state, the macOS Clone's appearance
// system, react-mosaic's "one store drives every surface" discipline.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyTheme, useSession, type Theme } from "./session";

export type OSPhase = "boot" | "lock" | "desktop";

/* --------------------------------- accents -------------------------------- */
// Each accent is a hue the entire desktop re-tints to, live. `tint` is a low-
// alpha wash used for glass fills; `glow` drives focus rings + dock light.
export interface Accent {
  id: string;
  label: string;
  hex: string;
}
export const ACCENTS: Accent[] = [
  { id: "volt", label: "Volt", hex: "#00ED82" },
  { id: "azure", label: "Azure", hex: "#2BD9FF" },
  { id: "iris", label: "Iris", hex: "#7C6CFF" },
  { id: "amber", label: "Amber", hex: "#F59E0B" },
  { id: "rose", label: "Rose", hex: "#FF5C8A" },
  { id: "crimson", label: "Crimson", hex: "#EF4444" },
  { id: "mint", label: "Mint", hex: "#10E0C0" },
  { id: "graphite", label: "Graphite", hex: "#9AA3AD" },
];

/* ------------------------------- wallpapers ------------------------------- */
// Wallpapers are pure CSS so they're crisp at any size, theme-aware (each has a
// dark + light field), and recolor with the active accent via `${ACCENT}` token
// substitution at render time. `swatch` is the picker thumbnail.
export interface Wallpaper {
  id: string;
  label: string;
  /** background layers for dark mode (outermost last) */
  dark: string;
  /** background layers for light mode */
  light: string;
  /** thumbnail gradient for the picker */
  swatch: string;
  /** whether this paper leans on the live accent */
  dynamic?: boolean;
}

// `__A__` is replaced with the live accent hex at render time.
// Each wallpaper has a completely distinct color identity in both dark AND light mode.
export const WALLPAPERS: Wallpaper[] = [
  {
    // Identity: ELECTRIC LIME/CHARTREUSE — hot neon-green, yellower than sequoia's teal
    id: "volt-flux",
    label: "Volt Flux",
    dark:
      "radial-gradient(ellipse 65% 55% at 10% 5%, rgba(0,237,130,0.52), transparent 48%)," +
      "radial-gradient(ellipse 55% 45% at 94% 8%, rgba(0,255,140,0.36), transparent 44%)," +
      "radial-gradient(ellipse 50% 40% at 50% 96%, rgba(0,220,120,0.24), transparent 52%)," +
      "radial-gradient(ellipse 35% 28% at 72% 52%, rgba(43,217,255,0.18), transparent 48%)," +
      "linear-gradient(162deg, #010b04 0%, #020d06 38%, #010608 68%, #010204 100%)",
    light:
      "radial-gradient(ellipse 75% 58% at 8% 0%, rgba(0,237,80,0.60), transparent 50%)," +
      "radial-gradient(ellipse 55% 45% at 96% 10%, rgba(120,255,60,0.45), transparent 48%)," +
      "radial-gradient(ellipse 80% 52% at 50% 105%, rgba(0,220,60,0.38), transparent 55%)," +
      "radial-gradient(ellipse 40% 32% at 68% 52%, rgba(200,255,100,0.25), transparent 50%)," +
      "linear-gradient(162deg, #f2ffe0 0%, #e8ffc8 48%, #dcfab0 100%)",
    swatch: "linear-gradient(135deg, #00ED82 0%, #00FFAA 48%, #010b04 100%)",
  },
  {
    // Identity: AMBER ORANGE — brand-warm ink + dual orange aurora (matches login page)
    id: "dizrupt-brand",
    label: "Dizrupt",
    dark:
      "radial-gradient(ellipse 72% 58% at 18% 8%, rgba(249,115,22,0.40), transparent 52%)," +
      "radial-gradient(ellipse 58% 48% at 88% 92%, rgba(249,115,22,0.28), transparent 50%)," +
      "radial-gradient(ellipse 42% 36% at 60% 40%, rgba(255,160,50,0.14), transparent 55%)," +
      "radial-gradient(ellipse 80% 55% at 50% 52%, rgba(180,70,10,0.07), transparent 65%)," +
      "linear-gradient(175deg, #0b0502 0%, #0e0703 32%, #090402 66%, #050201 100%)",
    light:
      "radial-gradient(ellipse 72% 55% at 18% 5%, rgba(249,115,22,0.36), transparent 52%)," +
      "radial-gradient(ellipse 58% 48% at 88% 96%, rgba(251,146,60,0.30), transparent 52%)," +
      "radial-gradient(ellipse 60% 42% at 50% 50%, rgba(255,190,80,0.18), transparent 62%)," +
      "linear-gradient(175deg, #fffbf5 0%, #fff5e8 45%, #fef0dc 100%)",
    swatch: "linear-gradient(135deg, #F97316 0%, #FB923C 50%, #0b0502 100%)",
  },
  {
    // Identity: BRIGHT PERIWINKLE SKY BLUE — vivid cobalt-blue, clearly different from nocturne's purple
    id: "monterey",
    label: "Monterey",
    dark:
      "radial-gradient(ellipse 78% 65% at 88% 5%, rgba(124,108,255,0.60), transparent 50%)," +
      "radial-gradient(ellipse 72% 62% at 5% 96%, rgba(43,217,255,0.48), transparent 52%)," +
      "radial-gradient(ellipse 48% 38% at 48% 52%, rgba(100,80,220,0.16), transparent 56%)," +
      "radial-gradient(ellipse 35% 28% at 55% 10%, rgba(180,150,255,0.14), transparent 48%)," +
      "linear-gradient(145deg, #07051c 0%, #0a0820 40%, #040514 76%, #020310 100%)",
    light:
      "radial-gradient(ellipse 100% 68% at 92% 0%, rgba(80,160,255,0.80), transparent 50%)," +
      "radial-gradient(ellipse 80% 65% at 0% 100%, rgba(43,217,255,0.68), transparent 52%)," +
      "radial-gradient(ellipse 60% 45% at 50% 50%, rgba(120,190,255,0.35), transparent 62%)," +
      "radial-gradient(ellipse 40% 30% at 50% 0%, rgba(200,230,255,0.50), transparent 50%)," +
      "linear-gradient(145deg, #e0f0ff 0%, #c8e4ff 45%, #b0d6ff 100%)",
    swatch: "linear-gradient(135deg, #7C6CFF 0%, #2BD9FF 65%, #07051c 100%)",
  },
  {
    // Identity: HOT ORANGE + VIVID MAGENTA — fire/sunset energy, extremely warm
    id: "solar",
    label: "Solar",
    dark:
      "radial-gradient(ellipse 70% 62% at 75% 12%, rgba(249,115,22,0.60), transparent 52%)," +
      "radial-gradient(ellipse 82% 72% at 8% 94%, rgba(255,30,130,0.45), transparent 52%)," +
      "radial-gradient(ellipse 45% 36% at 50% 52%, rgba(255,100,40,0.16), transparent 55%)," +
      "radial-gradient(ellipse 32% 24% at 90% 80%, rgba(255,210,50,0.22), transparent 45%)," +
      "linear-gradient(150deg, #1e0804 0%, #1c060f 50%, #090304 100%)",
    light:
      "radial-gradient(ellipse 100% 68% at 82% 5%, rgba(255,130,40,0.85), transparent 50%)," +
      "radial-gradient(ellipse 82% 68% at 4% 96%, rgba(255,50,120,0.70), transparent 52%)," +
      "radial-gradient(ellipse 60% 45% at 50% 50%, rgba(255,180,80,0.40), transparent 60%)," +
      "linear-gradient(150deg, #fff2e0 0%, #ffd8c0 45%, #ffc8cc 100%)",
    swatch: "linear-gradient(135deg, #F97316 0%, #FF2882 65%, #1e0804 100%)",
  },
  {
    // Identity: ACHROMATIC COOL GRAY — zero hue, pure black-to-silver
    id: "graphite",
    label: "Graphite",
    dark:
      "radial-gradient(ellipse 100% 55% at 50% -12%, rgba(155,168,192,0.18), transparent 50%)," +
      "radial-gradient(ellipse 72% 52% at 92% 96%, rgba(120,132,155,0.12), transparent 55%)," +
      "radial-gradient(ellipse 52% 42% at 12% 52%, rgba(100,112,132,0.09), transparent 58%)," +
      "linear-gradient(168deg, #0d0f16 0%, #09010e 50%, #060709 100%)",
    light:
      "radial-gradient(ellipse 100% 55% at 50% -12%, rgba(155,170,200,0.55), transparent 52%)," +
      "radial-gradient(ellipse 72% 52% at 90% 96%, rgba(140,155,185,0.38), transparent 55%)," +
      "radial-gradient(ellipse 52% 42% at 10% 56%, rgba(175,188,212,0.28), transparent 58%)," +
      "linear-gradient(168deg, #f4f6fa 0%, #eceef4 55%, #e4e8f2 100%)",
    swatch: "linear-gradient(135deg, #6b717f 0%, #3c3f48 55%, #0d0f16 100%)",
  },
  {
    // Identity: COOL CARIBBEAN TEAL — blue-green aqua, clearly cooler/bluer than volt's lime-green
    id: "sequoia",
    label: "Sequoia",
    dark:
      "radial-gradient(ellipse 68% 58% at 55% -6%, rgba(0,200,180,0.48), transparent 52%)," +
      "radial-gradient(ellipse 80% 70% at 96% 100%, rgba(0,180,160,0.36), transparent 52%)," +
      "radial-gradient(ellipse 52% 42% at 8% 62%, rgba(0,220,200,0.20), transparent 55%)," +
      "radial-gradient(ellipse 35% 28% at 30% 25%, rgba(43,217,200,0.14), transparent 50%)," +
      "linear-gradient(160deg, #010e0d 0%, #010b09 50%, #010807 100%)",
    light:
      "radial-gradient(ellipse 88% 65% at 55% -6%, rgba(0,220,200,0.72), transparent 50%)," +
      "radial-gradient(ellipse 80% 68% at 96% 100%, rgba(0,200,180,0.58), transparent 52%)," +
      "radial-gradient(ellipse 52% 42% at 8% 68%, rgba(0,240,220,0.40), transparent 55%)," +
      "radial-gradient(ellipse 40% 32% at 50% 50%, rgba(100,255,240,0.22), transparent 60%)," +
      "linear-gradient(160deg, #d0fff8 0%, #b4faf4 45%, #98f5ef 100%)",
    swatch: "linear-gradient(135deg, #00C8B4 0%, #00B4A0 65%, #010e0d 100%)",
  },
  {
    // Identity: DEEP VIOLET/MAGENTA — rich warm-purple, clearly warmer/pinker than Monterey's blue
    id: "nocturne",
    label: "Nocturne",
    dark:
      "radial-gradient(ellipse 62% 52% at 22% 18%, rgba(168,85,247,0.48), transparent 52%)," +
      "radial-gradient(ellipse 72% 62% at 82% 82%, rgba(217,70,239,0.40), transparent 52%)," +
      "radial-gradient(ellipse 42% 36% at 60% 52%, rgba(147,51,234,0.14), transparent 58%)," +
      "radial-gradient(ellipse 32% 26% at 8% 86%, rgba(192,38,211,0.22), transparent 46%)," +
      "radial-gradient(ellipse 28% 22% at 92% 10%, rgba(139,92,246,0.20), transparent 46%)," +
      "linear-gradient(172deg, #0a0110 0%, #0d030e 50%, #060108 100%)",
    light:
      "radial-gradient(ellipse 78% 65% at 15% 10%, rgba(192,38,211,0.65), transparent 52%)," +
      "radial-gradient(ellipse 75% 62% at 88% 92%, rgba(217,70,239,0.58), transparent 52%)," +
      "radial-gradient(ellipse 56% 42% at 52% 50%, rgba(240,120,255,0.32), transparent 62%)," +
      "radial-gradient(ellipse 38% 30% at 96% 5%, rgba(168,85,247,0.42), transparent 48%)," +
      "linear-gradient(172deg, #fde8ff 0%, #f8d0ff 45%, #f0bcff 100%)",
    swatch: "linear-gradient(135deg, #A855F7 0%, #D946EF 65%, #0a0110 100%)",
  },
];

/* --------------------------------- helpers -------------------------------- */
export const wallpaperById = (id: string) =>
  WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];
export const accentById = (id: string) =>
  ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];

/** Resolve a wallpaper's background string for the current theme + accent. */
export function wallpaperBackground(w: Wallpaper, theme: "light" | "dark", accentHex: string) {
  return (theme === "light" ? w.light : w.dark).replaceAll("__A__", accentHex);
}

/** Performance / "reduce transparency" mode — flips a root attribute that
 * globals.css uses to kill backdrop-filter, pause wallpaper motion and trim
 * shadows. The single biggest GPU win on low-end machines (4GB / integrated). */
export function applyPerf(on: boolean) {
  if (typeof document === "undefined") return;
  if (on) document.documentElement.dataset.perf = "1";
  else delete document.documentElement.dataset.perf;
}

/** Push the live accent + derived tints onto :root so every surface re-tints. */
export function applyAccent(hex: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--os-accent", hex);
  root.style.setProperty("--os-accent-soft", hex + "22");
  root.style.setProperty("--os-accent-line", hex + "44");
  root.style.setProperty("--os-accent-glow", hex + "66");
}

/* ---------------------------------- store --------------------------------- */
interface OSState {
  phase: OSPhase;
  accentId: string;
  wallpaperId: string;
  brightness: number; // 0.55 – 1, dims the wallpaper
  volume: number;     // 0 – 1, system volume (UI-level)
  reduceTransparency: boolean;
  dockHidden: string[]; // app ids the user removed from the dock
  dockExtra: string[];  // app ids the user pinned in beyond the defaults
  dnd: boolean;         // Do Not Disturb — silences toasts
  stageManager: boolean; // macOS Ventura-style Stage Manager

  // power
  powerOn: () => void; // → boot
  finishBoot: () => void; // boot → lock
  unlock: () => void; // lock → desktop
  lock: () => void; // → lock
  setPhase: (p: OSPhase) => void;

  // appearance
  setAccent: (id: string) => void;
  setWallpaper: (id: string) => void;
  setBrightness: (v: number) => void;
  setVolume: (v: number) => void;
  toggleTransparency: () => void;
  setTransparency: (on: boolean) => void;
  setTheme: (t: Theme) => void; // delegates to useSession

  // dock customization
  removeFromDock: (id: string) => void;
  pinToDock: (id: string) => void;
  isHidden: (id: string) => boolean;
  toggleDnd: () => void;
  toggleStageManager: () => void;
  setStageManager: (on: boolean) => void;

  accent: () => Accent;
  wallpaper: () => Wallpaper;
}

export const useOS = create<OSState>()(
  persist(
    (set, get) => ({
      phase: "boot",
      accentId: "volt",
      wallpaperId: "dizrupt-brand",
      brightness: 1,
      volume: 0.7,
      reduceTransparency: false,
      dockHidden: [],
      dockExtra: [],
      dnd: false,
      stageManager: false,

      powerOn: () => set({ phase: "boot" }),
      finishBoot: () => set({ phase: "lock" }),
      unlock: () => set({ phase: "desktop" }),
      lock: () => set({ phase: "lock" }),
      setPhase: (phase) => set({ phase }),

      setAccent: (accentId) => {
        applyAccent(accentById(accentId).hex);
        set({ accentId });
      },
      setWallpaper: (wallpaperId) => set({ wallpaperId }),
      setBrightness: (brightness) => set({ brightness }),
      setVolume: (volume) => set({ volume }),
      toggleTransparency: () => set((s) => { applyPerf(!s.reduceTransparency); return { reduceTransparency: !s.reduceTransparency }; }),
      setTransparency: (on: boolean) => { applyPerf(on); set({ reduceTransparency: on }); },
      setTheme: (t) => {
        applyTheme(t);
        useSession.setState({ theme: t });
      },

      removeFromDock: (id) => set((s) => ({
        dockHidden: [...new Set([...s.dockHidden, id])],
        dockExtra: s.dockExtra.filter((x) => x !== id),
      })),
      pinToDock: (id) => set((s) => ({
        dockHidden: s.dockHidden.filter((x) => x !== id),
        dockExtra: [...new Set([...s.dockExtra, id])],
      })),
      isHidden: (id) => get().dockHidden.includes(id),
      toggleDnd: () => set((s) => ({ dnd: !s.dnd })),
      toggleStageManager: () => set((s) => ({ stageManager: !s.stageManager })),
      setStageManager: (on) => set({ stageManager: on }),

      accent: () => accentById(get().accentId),
      wallpaper: () => wallpaperById(get().wallpaperId),
    }),
    {
      name: "dizrupt-os",
      // phase is intentionally NOT persisted — every fresh load powers on.
      partialize: (s) => ({
        accentId: s.accentId,
        wallpaperId: s.wallpaperId,
        brightness: s.brightness,
        volume: s.volume,
        reduceTransparency: s.reduceTransparency,
        dockHidden: s.dockHidden,
        dockExtra: s.dockExtra,
        dnd: s.dnd,
        stageManager: s.stageManager,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) { applyAccent(accentById(state.accentId).hex); applyPerf(state.reduceTransparency); }
      },
    }
  )
);
