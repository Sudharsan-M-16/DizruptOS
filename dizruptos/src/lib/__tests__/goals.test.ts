import { beforeEach, describe, expect, it } from "vitest";
import { useOps } from "../store";

// Goals & OKRs are live like tasks/projects: created goals land in the store and
// key-result edits are recorded, so they sync cross-tab/login instead of dying in
// local component state (the bug this pins against).

const initial = useOps.getState();
beforeEach(() => useOps.setState(initial, true));

describe("live goals & OKRs", () => {
  it("addGoal lands a new OKR in the synced store with an id + zero progress", () => {
    const before = useOps.getState().extraGoals.length;
    useOps.getState().addGoal({
      title: "Cut support response time in half",
      ownerId: "u-noor",
      targetDate: "2026-09-30",
      keyResults: [{ title: "Median reply < 3s", progress: 0 }],
    });
    const goals = useOps.getState().extraGoals;
    expect(goals.length).toBe(before + 1);
    const g = goals[goals.length - 1];
    expect(g.id).toMatch(/^goal-/);
    expect(g.progress).toBe(0);
    expect(g.keyResults).toHaveLength(1);
  });

  it("addGoal writes an audit event", () => {
    const beforeAudit = useOps.getState().audit.length;
    useOps.getState().addGoal({ title: "Ship onboarding v2", ownerId: "u-asha", targetDate: "2026-08-01", keyResults: [{ title: "Wizard done", progress: 0 }] });
    const audit = useOps.getState().audit;
    expect(audit.length).toBe(beforeAudit + 1);
    expect(audit[0].actionType).toBe("goal_created");
  });

  it("setKeyResultProgress records a clamped edit keyed by goal + KR title", () => {
    useOps.getState().setKeyResultProgress("goal-x", "KR one", 1.5);
    expect(useOps.getState().goalKr["goal-x"]["KR one"]).toBe(1); // clamped to 1
    useOps.getState().setKeyResultProgress("goal-x", "KR one", -0.5);
    expect(useOps.getState().goalKr["goal-x"]["KR one"]).toBe(0); // clamped to 0
  });
});
