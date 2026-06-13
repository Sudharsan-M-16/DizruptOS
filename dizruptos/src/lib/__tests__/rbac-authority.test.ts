import { describe, it, expect } from "vitest";
import {
  authorizeChange,
  rolesAbove,
  nextApprover,
  canSeeEverything,
} from "@/lib/rbac";

describe("change authority — graduated approval", () => {
  it("admin is unrestricted (everything direct, nothing to escalate)", () => {
    for (const type of ["task_reassign", "project_budget", "role_grant", "headcount_change"] as const) {
      const v = authorizeChange({ type, actorRole: "admin", magnitude: 5 });
      expect(v.authority).toBe("direct");
      expect(v.notifyRoles).toEqual([]);
    }
  });

  it("manager applies a within-capacity reassign DIRECTLY but notifies higher order", () => {
    const v = authorizeChange({ type: "task_reassign", actorRole: "project_manager", magnitude: 0.72 });
    expect(v.authority).toBe("direct");
    expect(v.notifyRoles).toContain("dept_head");
    expect(v.notifyRoles).toContain("executive");
    expect(v.notifyRoles).toContain("admin");
  });

  it("a reassign that breaches 100% needs higher-order APPROVAL", () => {
    const v = authorizeChange({ type: "task_reassign", actorRole: "project_manager", magnitude: 1.05 });
    expect(v.authority).toBe("requires_approval");
    expect(v.approverRole).toBe("dept_head");
    expect(v.notifyRoles.length).toBeGreaterThan(0);
  });

  it("an employee's task change is always routed up for approval", () => {
    const v = authorizeChange({ type: "task_reassign", actorRole: "employee", magnitude: 0.3 });
    expect(v.authority).toBe("requires_approval");
  });

  it("budget: dept head direct under 10%, executive approval at/over 10%", () => {
    expect(authorizeChange({ type: "project_budget", actorRole: "dept_head", magnitude: 0.05 }).authority).toBe("direct");
    const big = authorizeChange({ type: "project_budget", actorRole: "dept_head", magnitude: 0.2 });
    expect(big.authority).toBe("requires_approval");
    expect(big.approverRole).toBe("executive");
  });

  it("role grants & headcount always require the highest authority (admin)", () => {
    const v = authorizeChange({ type: "role_grant", actorRole: "project_manager" });
    expect(v.authority).toBe("requires_approval");
    expect(v.approverRole).toBe("admin");
  });

  it("computed health can never be set by hand", () => {
    expect(authorizeChange({ type: "project_health", actorRole: "dept_head" }).authority).toBe("denied");
  });

  it("managers record risk/decision updates directly with oversight", () => {
    expect(authorizeChange({ type: "decision_record", actorRole: "project_manager" }).authority).toBe("direct");
  });
});

describe("seniority helpers", () => {
  it("rolesAbove returns strictly senior roles in ascending rank", () => {
    expect(rolesAbove("project_manager")).toEqual(["dept_head", "executive", "admin"]);
    expect(rolesAbove("admin")).toEqual([]);
  });
  it("nextApprover is the immediate senior", () => {
    expect(nextApprover("project_manager")).toBe("dept_head");
    expect(nextApprover("dept_head")).toBe("executive");
  });
  it("only the highest role sees everything", () => {
    expect(canSeeEverything("admin")).toBe(true);
    expect(canSeeEverything("executive")).toBe(false);
    expect(canSeeEverything("employee")).toBe(false);
  });
});
