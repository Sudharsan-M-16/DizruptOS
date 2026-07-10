// Unit tests for WindowErrorBoundary state machine — pure TS, no JSX, no DOM.
// Imports from window-error-boundary-state.ts (no React/JSX dependency).

import { describe, it, expect } from "vitest";
import { getDerivedStateFromError, resetState } from "../../components/desktop/window-error-boundary-state";

describe("getDerivedStateFromError", () => {
  it("transitions to error state when an error is thrown", () => {
    const err = new Error("Simulated render crash");
    const state = getDerivedStateFromError(err);
    expect(state.hasError).toBe(true);
    expect(state.error).toBe(err);
  });

  it("captures the error message correctly", () => {
    const msg = "Something went wrong in MyWidget";
    const state = getDerivedStateFromError(new Error(msg));
    expect(state.error?.message).toBe(msg);
  });

  it("works with subclasses of Error", () => {
    class NetworkError extends Error {}
    const state = getDerivedStateFromError(new NetworkError("timeout"));
    expect(state.hasError).toBe(true);
  });
});

describe("resetState", () => {
  it("resets hasError to false and clears error", () => {
    const cleared = resetState();
    expect(cleared.hasError).toBe(false);
    expect(cleared.error).toBeNull();
  });
});

describe("boundary isolation guarantee", () => {
  it("two getDerivedStateFromError calls produce independent objects", () => {
    const stateA = getDerivedStateFromError(new Error("Window A crash"));
    const stateB = getDerivedStateFromError(new Error("Window B crash"));

    expect(stateA.error?.message).toBe("Window A crash");
    expect(stateB.error?.message).toBe("Window B crash");
    expect(stateA).not.toBe(stateB);
  });
});
