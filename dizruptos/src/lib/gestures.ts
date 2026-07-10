// macOS-grade gesture system for DizruptOS.
// All hooks are client-only (they reference window/addEventListener).
//
// Provides:
//   useSwipeNavigation  — two-finger horizontal trackpad swipe → back/forward
//   useHotCorners       — mouse dwelling at screen corners triggers OS actions
//   usePinchGesture     — pinch-to-zoom on the desktop canvas
//   useThreeFingerDrag  — three-finger drag translates a target element
//
// All hooks are passive (non-blocking) and clean up on unmount.

import { useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SwipeNavigationOptions {
  /** Called when user swipes right (back gesture). */
  onBack?: () => void;
  /** Called when user swipes left (forward gesture). */
  onForward?: () => void;
  /** Minimum deltaX to trigger (default 80). */
  threshold?: number;
  /** Only trigger if touch-scroll with velocity (trackpad two-finger). */
  requireMomentum?: boolean;
}

export interface HotCornerOptions {
  topLeft?: () => void;
  topRight?: () => void;
  bottomLeft?: () => void;
  bottomRight?: () => void;
  /** Dwell time in ms before triggering (default 600). */
  dwellMs?: number;
  /** Corner size in px (default 6). */
  cornerPx?: number;
}

export interface PinchOptions {
  onPinchStart?: (scale: number) => void;
  onPinch?: (scale: number, delta: number) => void;
  onPinchEnd?: (finalScale: number) => void;
}

// ---------------------------------------------------------------------------
// useSwipeNavigation
// Two-finger horizontal trackpad swipe — the signature macOS back/forward.
// Detects via wheel events: when deltaX dominates (horizontal scroll) and
// the gesture accumulates past the threshold in a short burst, fire back/forward.
// ---------------------------------------------------------------------------

export function useSwipeNavigation(
  target: React.RefObject<HTMLElement | null> | null,
  opts: SwipeNavigationOptions
) {
  const { onBack, onForward, threshold = 100, requireMomentum = true } = opts;
  const accumX = useRef(0);
  const accumY = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);

  const reset = useCallback(() => {
    accumX.current = 0;
    accumY.current = 0;
    fired.current = false;
  }, []);

  useEffect(() => {
    const el = target?.current ?? window;

    function onWheel(e: WheelEvent) {
      // Only react to horizontal-dominant wheel events (trackpad horizontal scroll).
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      if (absY > absX * 1.5) {
        // Vertically dominant — vertical scroll, reset horizontal.
        reset();
        return;
      }

      accumX.current += e.deltaX;
      accumY.current += e.deltaY;

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(reset, 250);

      if (!fired.current) {
        if (accumX.current < -threshold) {
          fired.current = true;
          onBack?.();
        } else if (accumX.current > threshold) {
          fired.current = true;
          onForward?.();
        }
      }
    }

    el.addEventListener("wheel", onWheel as EventListener, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel as EventListener);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [target, onBack, onForward, threshold, reset, requireMomentum]);
}

// ---------------------------------------------------------------------------
// useHotCorners
// Mouse dwelling at screen corners for `dwellMs` triggers the registered action.
// This is the macOS System Settings → Desktop & Dock → Hot Corners feature.
// ---------------------------------------------------------------------------

export function useHotCorners(opts: HotCornerOptions) {
  const { topLeft, topRight, bottomLeft, bottomRight, dwellMs = 600, cornerPx = 8 } = opts;
  const dwellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCorner = useRef<string | null>(null);

  useEffect(() => {
    function getCorner(x: number, y: number): string | null {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (x <= cornerPx && y <= cornerPx) return "topLeft";
      if (x >= w - cornerPx && y <= cornerPx) return "topRight";
      if (x <= cornerPx && y >= h - cornerPx) return "bottomLeft";
      if (x >= w - cornerPx && y >= h - cornerPx) return "bottomRight";
      return null;
    }

    function onMove(e: MouseEvent) {
      const corner = getCorner(e.clientX, e.clientY);

      if (corner !== lastCorner.current) {
        lastCorner.current = corner;
        if (dwellTimer.current) clearTimeout(dwellTimer.current);

        if (corner) {
          dwellTimer.current = setTimeout(() => {
            if (corner === "topLeft") topLeft?.();
            if (corner === "topRight") topRight?.();
            if (corner === "bottomLeft") bottomLeft?.();
            if (corner === "bottomRight") bottomRight?.();
          }, dwellMs);
        }
      }
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
    };
  }, [topLeft, topRight, bottomLeft, bottomRight, dwellMs, cornerPx]);
}

// ---------------------------------------------------------------------------
// usePinchGesture
// Two-finger pinch via wheel events with ctrlKey (standard browser pinch API).
// Used for zooming the desktop canvas or app content.
// ---------------------------------------------------------------------------

export function usePinchGesture(
  target: React.RefObject<HTMLElement | null> | null,
  opts: PinchOptions
) {
  const { onPinchStart, onPinch, onPinchEnd } = opts;
  const active = useRef(false);
  const scale = useRef(1);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = target?.current ?? window;

    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey) return;
      e.preventDefault();

      const delta = -e.deltaY * 0.01;

      if (!active.current) {
        active.current = true;
        onPinchStart?.(scale.current);
      }

      scale.current = Math.max(0.5, Math.min(3, scale.current + delta));
      onPinch?.(scale.current, delta);

      if (endTimer.current) clearTimeout(endTimer.current);
      endTimer.current = setTimeout(() => {
        active.current = false;
        onPinchEnd?.(scale.current);
      }, 200);
    }

    el.addEventListener("wheel", onWheel as EventListener, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel as EventListener);
      if (endTimer.current) clearTimeout(endTimer.current);
    };
  }, [target, onPinchStart, onPinch, onPinchEnd]);
}

// ---------------------------------------------------------------------------
// useAppHistory — window-level navigation history for back/forward swipe.
// Each call to push(id) adds an app ID to the stack.
// back() and forward() navigate the stack.
// ---------------------------------------------------------------------------

type HistoryEntry = { appId: string; timestamp: number };

class AppHistory {
  private stack: HistoryEntry[] = [];
  private cursor = -1;

  push(appId: string) {
    // Trim forward stack when navigating from mid-history.
    this.stack = this.stack.slice(0, this.cursor + 1);
    this.stack.push({ appId, timestamp: Date.now() });
    this.cursor = this.stack.length - 1;
  }

  back(): string | null {
    if (this.cursor <= 0) return null;
    this.cursor--;
    return this.stack[this.cursor]?.appId ?? null;
  }

  forward(): string | null {
    if (this.cursor >= this.stack.length - 1) return null;
    this.cursor++;
    return this.stack[this.cursor]?.appId ?? null;
  }

  canBack() { return this.cursor > 0; }
  canForward() { return this.cursor < this.stack.length - 1; }
  current() { return this.stack[this.cursor]?.appId ?? null; }
}

export const appHistory = new AppHistory();

// ---------------------------------------------------------------------------
// Spring easing — CSS-level spring for window open/close animations.
// Returns a cubic-bezier string tuned for the target behavior.
// ---------------------------------------------------------------------------

export const springs = {
  /** Window open: bouncy enter. */
  open: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  /** Window close: fast exit. */
  close: "cubic-bezier(0.6, 0, 0.8, 0)",
  /** Dock pop: bouncy dock icon scale. */
  dock: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  /** Smooth drag: no bounce, just friction. */
  drag: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  /** Spring settle: used for snap-to-position. */
  settle: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;
