import { describe, expect, it } from "vitest";
import { roleCan, PERSONAS } from "../session";

// RBAC permission matrix (PRD §14.3) — pinned so a UI refactor can never
// silently widen access. Client checks are UX; the same matrix ships to RLS.

describe("RBAC matrix", () => {
  it("employee sees no manager-private or financial surfaces", () => {
    expect(roleCan("employee", "view_burnout")).toBe(false);
    expect(roleCan("employee", "view_financials")).toBe(false);
    expect(roleCan("employee", "view_capacity")).toBe(false);
    expect(roleCan("employee", "reallocate")).toBe(false);
    expect(roleCan("employee", "review_proposals")).toBe(false);
    expect(roleCan("employee", "view_audit")).toBe(false);
  });

  it("executive reads everything strategic but cannot mutate operations", () => {
    expect(roleCan("executive", "view_executive")).toBe(true);
    expect(roleCan("executive", "view_financials")).toBe(true);
    expect(roleCan("executive", "view_capacity")).toBe(true);
    expect(roleCan("executive", "reallocate")).toBe(false); // read-only by design
    expect(roleCan("executive", "view_audit")).toBe(false);
  });

  it("project manager owns the wedge workflow but not financial dashboards", () => {
    expect(roleCan("project_manager", "view_capacity")).toBe(true);
    expect(roleCan("project_manager", "reallocate")).toBe(true);
    expect(roleCan("project_manager", "review_proposals")).toBe(true);
    expect(roleCan("project_manager", "view_burnout")).toBe(true);
    expect(roleCan("project_manager", "view_financials")).toBe(false);
    expect(roleCan("project_manager", "view_executive")).toBe(false);
  });

  it("admin can do everything in the matrix", () => {
    (
      [
        "view_capacity",
        "reallocate",
        "view_burnout",
        "view_financials",
        "view_audit",
        "review_proposals",
        "view_executive",
      ] as const
    ).forEach((perm) => expect(roleCan("admin", perm)).toBe(true));
  });

  it("client role has zero internal permissions", () => {
    (
      [
        "view_capacity",
        "reallocate",
        "view_burnout",
        "view_financials",
        "view_audit",
        "review_proposals",
        "view_executive",
      ] as const
    ).forEach((perm) => expect(roleCan("client", perm)).toBe(false));
  });

  it("demo personas cover all five privileged role tiers", () => {
    const roles = new Set(PERSONAS.map((p) => p.role));
    expect(roles).toEqual(
      new Set(["project_manager", "executive", "dept_head", "employee", "admin"])
    );
  });
});
