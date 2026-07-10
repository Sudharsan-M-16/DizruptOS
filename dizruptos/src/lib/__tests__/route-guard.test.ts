import { describe, expect, it } from "vitest";
import { requiredPerm } from "../route-perms";

// Permission boundary at the route level (defense-in-depth: the OS hides launch
// buttons, but a direct URL must still be gated). Pins the route→perm mapping so
// a refactor can't silently ungate a sensitive page.

describe("route permission boundary", () => {
  it("gates sensitive routes by the right permission", () => {
    expect(requiredPerm("/executive")).toBe("view_executive");
    expect(requiredPerm("/briefing")).toBe("view_executive");
    expect(requiredPerm("/capacity")).toBe("view_capacity");
    expect(requiredPerm("/memory")).toBe("view_capacity");
    expect(requiredPerm("/audit")).toBe("view_audit");
    expect(requiredPerm("/recommendations")).toBe("review_proposals");
    expect(requiredPerm("/risks")).toBe("review_proposals");
    expect(requiredPerm("/import")).toBe("reallocate");
  });

  it("gates the merged Org-Memory routes too (no longer dock apps)", () => {
    expect(requiredPerm("/decisions")).toBe("view_capacity");
    expect(requiredPerm("/capabilities")).toBe("view_capacity");
    expect(requiredPerm("/learning")).toBe("view_capacity");
    expect(requiredPerm("/narratives")).toBe("view_executive");
  });

  it("leaves the desktop and open routes ungated", () => {
    expect(requiredPerm("/")).toBeUndefined();
    expect(requiredPerm("/projects")).toBeUndefined();
    expect(requiredPerm("/projects/p-atlas")).toBeUndefined();
    expect(requiredPerm("/goals")).toBeUndefined();
  });

  it("matches nested paths under a gated route", () => {
    expect(requiredPerm("/capabilities/anything")).toBe("view_capacity");
  });
});
