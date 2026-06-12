// Dynamic-view scoping — the demo's RBAC must be exact: no proposal may leak
// across role boundaries, and the same item must never await two different
// arbiters at once.

import { describe, expect, it } from "vitest";
import { proposalsForRole, canActOnProposal, risksForRole, inboxFraming } from "../rbac";
import { proposals, risks } from "../data";

describe("proposalsForRole", () => {
  it("admin sees everything, including the governance queue", () => {
    const slice = proposalsForRole(proposals, "admin", "u-elias");
    expect(slice.length).toBe(proposals.length);
    expect(slice.some((p) => p.visibility.includes("admin"))).toBe(true);
  });

  it("employee sees only items where they are the subject", () => {
    const slice = proposalsForRole(proposals, "employee", "u-ahmed");
    expect(slice.length).toBeGreaterThan(0);
    expect(slice.every((p) => p.subjectId === "u-ahmed")).toBe(true);
  });

  it("employee never sees admin governance items", () => {
    const slice = proposalsForRole(proposals, "employee", "u-ahmed");
    expect(slice.some((p) => p.visibility.includes("admin") && p.visibility.length === 1)).toBe(false);
  });

  it("manager sees team scope but not admin-only items", () => {
    const slice = proposalsForRole(proposals, "project_manager", "u-asha");
    expect(slice.every((p) => p.visibility.includes("project_manager"))).toBe(true);
    expect(slice.some((p) => p.id === "pr-9" || p.id === "pr-10")).toBe(false);
  });

  it("manager and employee inboxes never contain the same pending item", () => {
    const mgr = proposalsForRole(proposals, "project_manager", "u-asha").map((p) => p.id);
    const emp = proposalsForRole(proposals, "employee", "u-ahmed").map((p) => p.id);
    expect(mgr.filter((id) => emp.includes(id))).toEqual([]);
  });
});

describe("canActOnProposal", () => {
  it("admin can act on anything", () => {
    expect(proposals.every((p) => canActOnProposal(p, "admin", "u-elias"))).toBe(true);
  });

  it("employee can act only on their own items", () => {
    const mine = proposals.find((p) => p.subjectId === "u-ahmed" && p.visibility.includes("employee"))!;
    const notMine = proposals.find((p) => p.visibility.includes("admin") && p.visibility.length === 1)!;
    expect(canActOnProposal(mine, "employee", "u-ahmed")).toBe(true);
    expect(canActOnProposal(notMine, "employee", "u-ahmed")).toBe(false);
  });
});

describe("risksForRole", () => {
  const onAtlas = (empId: string, projectId?: string) =>
    projectId === "p-atlas" && empId === "u-ahmed";

  it("managers see the full register", () => {
    expect(risksForRole(risks, "project_manager", "u-asha", onAtlas).length).toBe(risks.length);
  });

  it("employees see only risks that touch them", () => {
    const slice = risksForRole(risks, "employee", "u-ahmed", onAtlas);
    expect(slice.length).toBeLessThan(risks.length);
    expect(
      slice.every((r) => r.ownerId === "u-ahmed" || r.projectId === "p-atlas")
    ).toBe(true);
  });
});

describe("inboxFraming", () => {
  it("frames each role differently", () => {
    const titles = new Set([
      inboxFraming("admin").title,
      inboxFraming("employee").title,
      inboxFraming("project_manager").title,
    ]);
    expect(titles.size).toBe(3);
  });
});
