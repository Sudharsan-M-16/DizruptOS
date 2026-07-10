"use client";

// Window manager for the DizruptOS desktop (react-mosaic-inspired mechanics,
// rebuilt for free-floating frosted windows). It now does the full job an OS
// window server does:
//   • drag / 8-way resize with boundary constraints
//   • focus / minimize / maximize, z-order
//   • DYNAMIC apps — openApp() spawns a window at runtime (e.g. a route shown
//     in an iframe), cascading new windows so they don't stack exactly
//   • EDGE SNAPPING — drag to the top to zoom, to a side to half-tile
//   • PERSISTENCE — the whole layout (rects, open/min/max, spawned apps) is
//     saved per-persona to localStorage and restored on return
// State stays simple + synchronous so animations never fight a transform.

import { useCallback, useEffect, useRef, useState } from "react";
import { appById } from "@/lib/desktop-apps";

export type WinKind = "panel" | "iframe";

export interface WinDef {
  id: string;
  title: string;
  x: number; y: number; w: number; h: number;
  closed?: boolean;
  kind?: WinKind;
  /** iframe source for `kind: "iframe"` apps (routes shown as windows) */
  url?: string;
  /** string key the renderer resolves to an icon component (serialisable) */
  iconKey?: string;
  accent?: string;
}

export interface WinState {
  id: string; title: string;
  x: number; y: number; w: number; h: number;
  z: number; minimized: boolean; closed: boolean; maximized: boolean;
  restore?: { x: number; y: number; w: number; h: number };
  kind: WinKind;
  url?: string;
  iconKey?: string;
  accent?: string;
}

export type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
export type SnapZone = "left" | "right" | "max" | null;

interface DragRef {
  id: string; startX: number; startY: number; originX: number; originY: number;
  surface: { left: number; top: number; w: number; h: number };
}
interface ResizeRef {
  id: string; dir: ResizeDir; startX: number; startY: number;
  origin: { x: number; y: number; w: number; h: number }; bounds: { w: number; h: number };
}

const MIN_W = 280;
const MIN_H = 150;
const SNAP_EDGE = 14; // px from edge to trigger a snap

function toState(d: WinDef, z: number): WinState {
  return {
    id: d.id, title: d.title, x: d.x, y: d.y, w: d.w, h: d.h,
    z, minimized: false, closed: !!d.closed, maximized: false,
    kind: d.kind ?? "panel", url: d.url, iconKey: d.iconKey, accent: d.accent,
  };
}

/* ------------------------------ persistence ------------------------------- */
interface Persisted {
  rects: Record<string, Pick<WinState, "x" | "y" | "w" | "h" | "z" | "minimized" | "maximized" | "closed"> & { restore?: WinState["restore"] }>;
  dynamic: WinDef[]; // spawned (non-default) windows, so they can be recreated
}
const keyFor = (k?: string) => (k ? `dz-os-layout:${k}` : null);

function load(k?: string): Persisted | null {
  const key = keyFor(k);
  if (!key || typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as Persisted) : null; } catch { return null; }
}
function save(k: string | undefined, wins: WinState[], defIds: Set<string>) {
  const key = keyFor(k);
  if (!key || typeof window === "undefined") return;
  const rects: Persisted["rects"] = {};
  const dynamic: WinDef[] = [];
  wins.forEach((w) => {
    rects[w.id] = { x: w.x, y: w.y, w: w.w, h: w.h, z: w.z, minimized: w.minimized, maximized: w.maximized, closed: w.closed, restore: w.restore };
    if (!defIds.has(w.id)) dynamic.push({ id: w.id, title: w.title, x: w.x, y: w.y, w: w.w, h: w.h, kind: w.kind, url: w.url, iconKey: w.iconKey, accent: w.accent });
  });
  try { localStorage.setItem(key, JSON.stringify({ rects, dynamic })); } catch { /* quota */ }
}

export function useDesktop(defs: WinDef[], surfaceRef: React.RefObject<HTMLElement>, persistKey?: string) {
  const defIds = useRef(new Set(defs.map((d) => d.id)));

  const [wins, setWins] = useState<WinState[]>(() => {
    const saved = load(persistKey);
    const base = defs.map((d, i) => toState(d, i + 1));
    if (!saved) return base;
    // recreate spawned apps — but drop any whose app no longer exists (e.g. a
    // feature we pruned), so stale windows never reappear in Mission Control.
    const dyn = (saved.dynamic ?? [])
      .filter((d) => defs.some((x) => x.id === d.id) || !!appById(d.id))
      .map((d, i) => toState({ ...d, closed: false }, base.length + i + 1));
    const all = [...base, ...dyn];
    // apply saved rects/state
    return all.map((w) => {
      const r = saved.rects[w.id];
      if (!r) return w;
      // If saved as maximized but no restore position (old localStorage data),
      // synthesize a sensible centered restore position so "Exit Fullscreen" works.
      const restore = r.restore ?? (r.maximized ? { x: 80, y: 60, w: 960, h: 580 } : undefined);
      return { ...w, ...r, restore };
    });
  });

  const topZ = useRef(Math.max(1, ...wins.map((w) => w.z)));
  const drag = useRef<DragRef | null>(null);
  const resize = useRef<ResizeRef | null>(null);
  const [snapZone, setSnapZone] = useState<SnapZone>(null);
  const snapZoneRef = useRef<SnapZone>(null);
  useEffect(() => { snapZoneRef.current = snapZone; }, [snapZone]);

  // Persist layout — debounced so a drag (which mutates `wins` every frame)
  // coalesces into a single write ~400ms after motion stops, instead of
  // hammering localStorage on every pointer move.
  useEffect(() => {
    const id = setTimeout(() => save(persistKey, wins, defIds.current), 400);
    return () => clearTimeout(id);
  }, [wins, persistKey]);

  const focus = useCallback((id: string) => {
    setWins((prev) => {
      const max = Math.max(0, ...prev.map((w) => w.z));
      const cur = prev.find((w) => w.id === id);
      if (cur && cur.z === max) return prev;
      topZ.current = max + 1;
      return prev.map((w) => (w.id === id ? { ...w, z: topZ.current } : w));
    });
  }, []);

  const patch = useCallback((id: string, p: Partial<WinState>) => {
    setWins((prev) => prev.map((w) => (w.id === id ? { ...w, ...p } : w)));
  }, []);

  const toggleMin = useCallback((id: string) => {
    setWins((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w)));
  }, []);

  const close = useCallback((id: string) => patch(id, { closed: true, minimized: false }), [patch]);

  const open = useCallback((id: string) => {
    setWins((prev) => {
      topZ.current += 1;
      return prev.map((w) => (w.id === id ? { ...w, closed: false, minimized: false, z: topZ.current } : w));
    });
  }, []);

  // Spawn (or focus) a window at runtime — used for route apps shown as iframes.
  const openApp = useCallback((def: WinDef) => {
    setWins((prev) => {
      const existing = prev.find((w) => w.id === def.id);
      topZ.current = Math.max(topZ.current, ...prev.map((w) => w.z)) + 1;
      if (existing) {
        return prev.map((w) => (w.id === def.id ? { ...w, closed: false, minimized: false, z: topZ.current } : w));
      }
      const count = prev.length;
      const cascade = (count % 6) * 28;
      const surface = surfaceRef.current;
      const W = surface?.clientWidth ?? 1400;
      const H = surface?.clientHeight ?? 800;
      const w = Math.min(def.w, W - 40);
      const h = Math.min(def.h, H - 80);
      const x = Math.min(def.x + cascade, W - w - 12);
      const y = Math.min(def.y + cascade, H - h - 12);
      return [...prev, toState({ ...def, x, y, w, h, closed: false }, topZ.current)];
    });
  }, [surfaceRef]);

  const toggleMax = useCallback((id: string) => {
    const surface = surfaceRef.current;
    setWins((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized) {
          const r = w.restore ?? { x: w.x, y: w.y, w: w.w, h: w.h };
          return { ...w, maximized: false, ...r, restore: undefined };
        }
        const W = surface?.clientWidth ?? 1400;
        const H = surface?.clientHeight ?? 800;
        return { ...w, maximized: true, restore: { x: w.x, y: w.y, w: w.w, h: w.h }, x: 12, y: 12, w: W - 24, h: H - 24 };
      })
    );
  }, [surfaceRef]);

  // half-tile or zoom a window to a snap zone
  const applySnap = useCallback((id: string, zone: SnapZone) => {
    if (!zone) return;
    const surface = surfaceRef.current;
    const W = surface?.clientWidth ?? 1400;
    const H = surface?.clientHeight ?? 800;
    setWins((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const restore = w.restore ?? { x: w.x, y: w.y, w: w.w, h: w.h };
        if (zone === "max") return { ...w, maximized: true, restore, x: 12, y: 12, w: W - 24, h: H - 24 };
        const half = (W - 30) / 2;
        const x = zone === "left" ? 12 : 18 + half;
        return { ...w, maximized: false, restore, x, y: 12, w: half, h: H - 24 };
      })
    );
  }, [surfaceRef]);

  const startDrag = useCallback((id: string, e: React.PointerEvent) => {
    const win = wins.find((w) => w.id === id);
    if (!win) return;
    focus(id);
    const rect = surfaceRef.current?.getBoundingClientRect();
    // un-maximize on drag-out so the window follows the cursor
    if (win.maximized) {
      const r = win.restore ?? { x: 80, y: 60, w: 720, h: 480 };
      patch(id, { maximized: false, ...r, restore: undefined });
    }
    drag.current = {
      id, startX: e.clientX, startY: e.clientY,
      originX: win.maximized ? (win.restore?.x ?? win.x) : win.x,
      originY: win.maximized ? (win.restore?.y ?? win.y) : win.y,
      surface: { left: rect?.left ?? 0, top: rect?.top ?? 0, w: rect?.width ?? 1400, h: rect?.height ?? 800 },
    };
  }, [wins, focus, surfaceRef, patch]);

  const startResize = useCallback((id: string, dir: ResizeDir, e: React.PointerEvent) => {
    e.stopPropagation();
    const win = wins.find((w) => w.id === id);
    if (!win || win.maximized) return;
    focus(id);
    const surface = surfaceRef.current;
    resize.current = {
      id, dir, startX: e.clientX, startY: e.clientY,
      origin: { x: win.x, y: win.y, w: win.w, h: win.h },
      bounds: { w: surface?.clientWidth ?? 1400, h: surface?.clientHeight ?? 800 },
    };
  }, [wins, focus, surfaceRef]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (d) {
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        // snap detection (pointer relative to surface)
        const px = e.clientX - d.surface.left;
        const py = e.clientY - d.surface.top;
        let zone: SnapZone = null;
        if (py <= SNAP_EDGE) zone = "max";
        else if (px <= SNAP_EDGE) zone = "left";
        else if (px >= d.surface.w - SNAP_EDGE) zone = "right";
        setSnapZone(zone);
        setWins((prev) =>
          prev.map((w) => {
            if (w.id !== d.id) return w;
            const nx = Math.max(0, Math.min(d.originX + dx, d.surface.w - 80));
            const ny = Math.max(0, Math.min(d.originY + dy, d.surface.h - 40));
            return { ...w, x: nx, y: ny };
          })
        );
        return;
      }
      const r = resize.current;
      if (r) {
        const dx = e.clientX - r.startX;
        const dy = e.clientY - r.startY;
        const o = r.origin;
        setWins((prev) =>
          prev.map((w) => {
            if (w.id !== r.id) return w;
            let { x, y, w: ww, h } = o;
            if (r.dir.includes("e")) ww = Math.max(MIN_W, Math.min(o.w + dx, r.bounds.w - o.x));
            if (r.dir.includes("s")) h = Math.max(MIN_H, Math.min(o.h + dy, r.bounds.h - o.y));
            if (r.dir.includes("w")) { const nw = Math.max(MIN_W, o.w - dx); x = o.x + (o.w - nw); ww = nw; }
            if (r.dir.includes("n")) { const nh = Math.max(MIN_H, o.h - dy); y = o.y + (o.h - nh); h = nh; }
            return { ...w, x: Math.max(0, x), y: Math.max(0, y), w: ww, h };
          })
        );
      }
    };
    const onUp = () => {
      const d = drag.current;
      if (d && snapZoneRef.current) applySnap(d.id, snapZoneRef.current);
      drag.current = null; resize.current = null;
      setSnapZone(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [applySnap]);

  const resetLayout = useCallback(() => {
    if (persistKey && typeof window !== "undefined") localStorage.removeItem(keyFor(persistKey)!);
    setWins(defs.map((d, i) => toState(d, i + 1)));
  }, [defs, persistKey]);

  return { wins, focus, toggleMin, toggleMax, close, open, openApp, startDrag, startResize, snapZone, resetLayout };
}
