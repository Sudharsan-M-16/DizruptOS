import { describe, it, expect, beforeEach } from "vitest";
import {
  submitChange,
  decideChange,
  type ChangeEffects,
  type StagedChange,
  type Principal,
} from "@/server/services/change-authority";

// Recording fake for the injected side-effects.
function makeFx() {
  const log = { applied: [] as unknown[], notified: [] as { roles: string[]; msg: string }[], audited: [] as string[], staged: [] as StagedChange[] };
  const fx: ChangeEffects = {
    apply: (_t, p) => log.applied.push(p),
    notify: (roles, msg) => log.notified.push({ roles: roles as string[], msg }),
    audit: (e) => log.audited.push(e),
    stage: (c) => log.staged.push(c),
    resolveStaged: (id, patch) => {
      const s = log.staged.find((x) => x.id === id);
      if (s) Object.assign(s, patch);
    },
  };
  return { fx, log };
}

const mgr: Principal = { id: "u-asha", role: "project_manager" };
const dept: Principal = { id: "u-priya", role: "dept_head" };
const admin: Principal = { id: "u-elias", role: "admin" };

describe("change-authority workflow", () => {
  let env: ReturnType<typeof makeFx>;
  beforeEach(() => { env = makeFx(); });

  it("manager's within-capacity change applies directly and notifies higher order", () => {
    const r = submitChange({ type: "task_reassign", summary: "Move 8h", payload: { taskId: "t1" }, magnitude: 0.7, actor: mgr }, env.fx);
    expect(r.outcome).toBe("applied");
    expect(env.log.applied).toHaveLength(1);
    expect(env.log.notified.at(-1)?.roles).toContain("dept_head"); // oversight
    expect(env.log.audited).toContain("change_applied_direct");
  });

  it("a capacity-breaching change is STAGED for the dept head, not applied", () => {
    const r = submitChange({ type: "task_reassign", summary: "Push to 110%", payload: { taskId: "t2" }, magnitude: 1.1, actor: mgr }, env.fx);
    expect(r.outcome).toBe("staged");
    expect(env.log.applied).toHaveLength(0);
    expect(r.staged?.approverRole).toBe("dept_head");
    expect(env.log.notified.at(-1)?.roles).toContain("dept_head");
  });

  it("the senior role ACCEPTS a staged change → it applies", () => {
    const { staged } = submitChange({ type: "task_reassign", summary: "x", payload: { taskId: "t3" }, magnitude: 1.2, actor: mgr }, env.fx);
    const d = decideChange(staged!, dept, true, env.fx);
    expect(d).toEqual({ ok: true, applied: true, status: "approved" });
    expect(env.log.applied).toHaveLength(1);
    expect(env.log.audited).toContain("change_approved");
  });

  it("the senior role DECLINES → not applied, reason recorded, requester notified", () => {
    const { staged } = submitChange({ type: "task_reassign", summary: "y", payload: {}, magnitude: 1.2, actor: mgr }, env.fx);
    const d = decideChange(staged!, dept, false, env.fx, "Sarah is already maxed");
    expect(d).toEqual({ ok: true, applied: false, status: "declined" });
    expect(env.log.applied).toHaveLength(0);
    expect(staged!.declineReason).toBe("Sarah is already maxed");
  });

  it("admin can act on anything in the queue (unrestricted authority)", () => {
    const { staged } = submitChange({ type: "role_grant", summary: "grant pm", payload: {}, actor: mgr }, env.fx);
    expect(staged?.approverRole).toBe("admin");
    expect(decideChange(staged!, admin, true, env.fx).ok).toBe(true);
  });

  it("a peer/lower role CANNOT approve (insufficient authority)", () => {
    const { staged } = submitChange({ type: "task_reassign", summary: "z", payload: {}, magnitude: 1.2, actor: mgr }, env.fx);
    const d = decideChange(staged!, mgr, true, env.fx); // manager approving their own → denied
    expect(d).toEqual({ ok: false, error: "INSUFFICIENT_AUTHORITY" });
  });

  it("a change can't be decided twice", () => {
    const { staged } = submitChange({ type: "task_reassign", summary: "z", payload: {}, magnitude: 1.2, actor: mgr }, env.fx);
    decideChange(staged!, dept, true, env.fx);
    expect(decideChange(staged!, admin, false, env.fx)).toEqual({ ok: false, error: "ALREADY_DECIDED" });
  });

  it("denied changes (computed health) never apply or stage", () => {
    const r = submitChange({ type: "project_health", summary: "force green", payload: {}, actor: dept }, env.fx);
    expect(r.outcome).toBe("denied");
    expect(env.log.applied).toHaveLength(0);
    expect(env.log.staged).toHaveLength(0);
  });
});
