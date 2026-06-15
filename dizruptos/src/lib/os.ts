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
export const WALLPAPERS: Wallpaper[] = [
  {
    id: "volt-flux",
    label: "Volt Flux",
    dynamic: true,
    dark:
      "radial-gradient(90% 70% at 8% 0%, __A__38, transparent 42%)," +
      "radial-gradient(70% 60% at 95% 5%, rgba(0,237,130,0.18), transparent 44%)," +
      "radial-gradient(120% 90% at 100% 8%, rgba(43,217,255,0.10), transparent 52%)," +
      "radial-gradient(80% 60% at 50% 100%, __A__1a, transparent 50%)," +
      "radial-gradient(60% 40% at 30% 60%, rgba(0,237,130,0.08), transparent 50%)," +
      "linear-gradient(160deg, #030a06 0%, #04090a 40%, #030408 70%, #020306 100%)",
    light:
      "radial-gradient(90% 70% at 8% 0%, __A__44, transparent 46%)," +
      "radial-gradient(70% 60% at 95% 5%, rgba(0,237,130,0.28), transparent 48%)," +
      "radial-gradient(120% 90% at 100% 6%, rgba(43,217,255,0.18), transparent 54%)," +
      "linear-gradient(160deg, #e2f5ec 0%, #dff2ee 50%, #daeae6 100%)",
    swatch: "linear-gradient(135deg, #00ED82, #2BD9FF 55%, #030a06)",
  },
  {
    id: "dizrupt-brand",
    label: "Dizrupt",
    dynamic: true,
    dark:
      "radial-gradient(ellipse 80% 60% at 15% 5%, __A__30, transparent 48%)," +
      "radial-gradient(ellipse 60% 50% at 85% 95%, rgba(0,237,130,0.22), transparent 50%)," +
      "radial-gradient(ellipse 100% 70% at 50% 50%, rgba(0,237,130,0.04), transparent 60%)," +
      "radial-gradient(ellipse 40% 30% at 70% 20%, rgba(43,217,255,0.10), transparent 50%)," +
      "linear-gradient(175deg, #020706 0%, #030a07 30%, #020407 65%, #010203 100%)",
    light:
      "radial-gradient(ellipse 80% 60% at 15% 5%, __A__3a, transparent 52%)," +
      "radial-gradient(ellipse 60% 50% at 85% 95%, rgba(0,237,130,0.32), transparent 54%)," +
      "radial-gradient(ellipse 40% 30% at 70% 20%, rgba(43,217,255,0.20), transparent 50%)," +
      "linear-gradient(175deg, #e0f5e8 0%, #d8f0e8 40%, #d0eae2 100%)",
    swatch: "linear-gradient(135deg, #00ED82 0%, #04281A 50%, #00ED82 100%)",
  },
  {
    id: "monterey",
    label: "Monterey",
    dark:
      "radial-gradient(90% 80% at 80% 10%, rgba(124,108,255,0.30), transparent 55%)," +
      "radial-gradient(80% 70% at 10% 100%, rgba(43,217,255,0.22), transparent 55%)," +
      "linear-gradient(160deg, #1a1338 0%, #0c1230 45%, #060a1e 100%)",
    light:
      "radial-gradient(90% 80% at 80% 10%, rgba(124,108,255,0.45), transparent 60%)," +
      "radial-gradient(80% 70% at 10% 100%, rgba(43,217,255,0.40), transparent 60%)," +
      "linear-gradient(160deg, #e9ecff 0%, #dfeaff 50%, #d6e6ff 100%)",
    swatch: "linear-gradient(135deg, #7C6CFF, #2BD9FF 70%, #1a1338)",
  },
  {
    id: "solar",
    label: "Solar",
    dark:
      "radial-gradient(80% 70% at 75% 18%, rgba(245,158,11,0.30), transparent 55%)," +
      "radial-gradient(90% 80% at 15% 95%, rgba(255,92,138,0.20), transparent 55%)," +
      "linear-gradient(165deg, #2a160a 0%, #1a0e10 50%, #0a0608 100%)",
    light:
      "radial-gradient(80% 70% at 75% 18%, rgba(245,158,11,0.50), transparent 60%)," +
      "radial-gradient(90% 80% at 15% 95%, rgba(255,92,138,0.35), transparent 60%)," +
      "linear-gradient(165deg, #fff1e0 0%, #ffe7ea 55%, #ffe0e6 100%)",
    swatch: "linear-gradient(135deg, #F59E0B, #FF5C8A 70%, #2a160a)",
  },
  {
    id: "graphite",
    label: "Graphite",
    dark:
      "radial-gradient(120% 100% at 50% -10%, rgba(255,255,255,0.06), transparent 45%)," +
      "linear-gradient(180deg, #15171b 0%, #0d0f12 60%, #08090b 100%)",
    light:
      "radial-gradient(120% 100% at 50% -10%, rgba(0,0,0,0.05), transparent 45%)," +
      "linear-gradient(180deg, #f4f6f7 0%, #e9edee 60%, #e2e7e8 100%)",
    swatch: "linear-gradient(135deg, #3a3d44, #15171b)",
  },
  {
    id: "sequoia",
    label: "Sequoia",
    dark:
      "radial-gradient(70% 60% at 50% 0%, rgba(16,224,192,0.22), transparent 55%)," +
      "radial-gradient(90% 80% at 90% 100%, rgba(0,237,130,0.16), transparent 55%)," +
      "linear-gradient(170deg, #042018 0%, #04140f 55%, #020a08 100%)",
    light:
      "radial-gradient(70% 60% at 50% 0%, rgba(16,224,192,0.40), transparent 60%)," +
      "radial-gradient(90% 80% at 90% 100%, rgba(0,237,130,0.30), transparent 60%)," +
      "linear-gradient(170deg, #e4f6ef 0%, #dcf2e9 55%, #d4efe3 100%)",
    swatch: "linear-gradient(135deg, #10E0C0, #00ED82 70%, #042018)",
  },
  {
    id: "nocturne",
    label: "Nocturne",
    dynamic: true,
    dark:
      "radial-gradient(60% 50% at 20% 20%, __A__1f, transparent 55%)," +
      "radial-gradient(80% 70% at 85% 85%, rgba(124,108,255,0.14), transparent 55%)," +
      "linear-gradient(180deg, #030305 0%, #050507 60%, #020203 100%)",
    light:
      "radial-gradient(60% 50% at 20% 20%, __A__2a, transparent 58%)," +
      "radial-gradient(80% 70% at 85% 85%, rgba(124,108,255,0.22), transparent 58%)," +
      "linear-gradient(180deg, #eceef2 0%, #e6e8ee 60%, #e0e3ea 100%)",
    swatch: "linear-gradient(135deg, #00ED82, #7C6CFF 70%, #030305)",
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
