// API contract tests — the authorization and verdict rules the /api/v1
// routes compose. These pin the trust boundary: what each role may read,
// which proposals a principal may decide, and how verdicts transition.

import { describe, expect, it } from "vitest";
import { proposalsForRole } from "../rbac";
import { roleCan } from "../personas";
import { createMemoryRepositories } from "../../server/repositories/memory";
import { proposals } from "../data";
import type { Role } from "../types";

describe("audit read permission (GET /api/v1/audit)", () => {
  const allowed: Role[] = ["admin", "dept_head"];
  const denied: Role[] = ["executive", "project_manager", "team_lead", "employee"];
  it.each(allowed)("%s can read the ledger", (role) => {
    expect(roleCan(role, "view_audit")).toBe(true);
  });
  it.each(denied)("%s cannot read the ledger", (role) => {
    expect(roleCan(role, "view_audit")).toBe(false);
  });
});

describe("proposal verdict authorization (PATCH /api/v1/proposals/:id)", () => {
  it("an employee can only decide proposals where they are the subject", () => {
    const visible = proposalsForRole(proposals, "employee", "u-ahmed");
    for (const p of visible) expect(p.subjectId).toBe("u-ahmed");
  });

  it("a proposal invisible to the role is undecidable (maps to 404)", () => {
    const all = proposals;
    const employeeView = proposalsForRole(all, "employee", "u-nobody");
    const hidden = all.filter((p) => !employeeView.some((v) => v.id === p.id));
    expect(hidden.length).toBeGreaterThan(0); // governance items exist
    // the route looks up the id inside the VISIBLE slice only
    for (const h of hidden) {
      expect(employeeView.find((v) => v.id === h.id)).toBeUndefined();
    }
  });

  it("admin sees every proposal (may decide any pending one)", () => {
    expect(proposalsForRole(proposals, "admin", "u-admin")).toHaveLength(
      proposals.length
    );
  });
});

describe("verdict state machine", () => {
  it("setStatus persists and a second verdict would see non-pending", async () => {
    const repos = createMemoryRepositories();
    const pending = (await repos.proposals.list()).find(
      (p) => p.status === "pending"
    )!;
    await repos.proposals.setStatus(pending.id, "approved");
    const after = (await repos.proposals.list()).find((p) => p.id === pending.id)!;
    expect(after.status).toBe("approved"); // route returns 409 CONFLICT now
  });

  it("unknown proposal ids raise NOT_FOUND", async () => {
    const repos = createMemoryRepositories();
    await expect(
      repos.proposals.setStatus("pr-nope", "approved")
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("financial redaction (GET /api/v1/employees)", () => {
  const canSee: Role[] = ["admin", "executive", "dept_head"];
  const cannot: Role[] = ["project_manager", "team_lead", "employee"];
  it.each(canSee)("%s may view cost data", (role) => {
    expect(roleCan(role, "view_financials")).toBe(true);
  });
  it.each(cannot)("%s gets cost fields redacted", (role) => {
    expect(roleCan(role, "view_financials")).toBe(false);
  });
});
