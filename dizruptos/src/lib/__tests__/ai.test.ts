import { describe, expect, it } from "vitest";
import {
  buildExplanation,
  compressProjectContext,
  rankCandidates,
  validateProposal,
} from "../ai";
import { employees, projects, tasks, proposals, TODAY } from "../data";
import type { Proposal, Task } from "../types";

const allocated = (employeeId: string, _week: string) =>
  ({ "u-ahmed": 26, "u-jonas": 30, "u-sarah": 45 })[employeeId] ?? 20;

describe("proposal validation engine (law 12)", () => {
  const base = proposals.find((p) => p.id === "pr-1")!; // move 9h Sarah→Ahmed

  it("passes a healthy reallocation", () => {
    const res = validateProposal(base, { tasks, employees, allocated });
    expect(res.valid).toBe(true);
    expect(res.checks.every((c) => c.pass)).toBe(true);
  });

  it("fails when projected utilization reaches 100%", () => {
    // Ahmed at 36h/40 → +9h projects to 112.5%
    const res = validateProposal(base, {
      tasks,
      employees,
      allocated: () => 36,
    });
    expect(res.valid).toBe(false);
    expect(res.checks.find((c) => !c.pass)!.check).toMatch(/under 100%/);
  });

  it("fails on PTO conflict in the target week", () => {
    const task = tasks.find((t) => t.id === "t-10")!;
    const fatigued = employees.map((e) =>
      e.id === "u-ahmed" ? { ...e, ptoDays: [task.weekStart] } : e
    );
    const res = validateProposal(base, { tasks, employees: fatigued, allocated });
    expect(res.valid).toBe(false);
    expect(res.checks.find((c) => !c.pass)!.check).toMatch(/PTO/);
  });

  it("fails when an upstream dependency is BLOCKED", () => {
    const task = tasks.find((t) => t.id === "t-3")!; // pr-1's target task
    const withDep: Task[] = tasks.map((t) =>
      t.id === task.id ? { ...t, dependsOn: ["t-4"] } : t // t-4 is BLOCKED in seed
    );
    const res = validateProposal(base, { tasks: withDep, employees, allocated });
    expect(res.valid).toBe(false);
    expect(res.checks.find((c) => !c.pass)!.check).toMatch(/dependency/);
  });

  it("treats advisory actions as constraint-free", () => {
    const advisory: Proposal = { ...base, action: { kind: "escalate" } };
    const res = validateProposal(advisory, { tasks, employees, allocated });
    expect(res.valid).toBe(true);
  });

  it("fails safely when the task vanished (soft-deleted between cycles)", () => {
    const res = validateProposal(
      { ...base, action: { ...base.action, taskId: "t-ghost" } },
      { tasks, employees, allocated }
    );
    expect(res.valid).toBe(false);
  });
});

describe("context compression (PRD §11.6)", () => {
  it("compresses a project to a sub-1k-token vector", () => {
    const atlas = projects.find((p) => p.id === "p-atlas")!;
    const ctx = compressProjectContext(atlas, tasks, () => 0.9, TODAY);
    expect(ctx.approx_tokens).toBeLessThan(1000);
    expect(ctx.overdue_pct).toBeGreaterThan(0); // Chatbot has overdue work
    expect(ctx.critical_path_blocked).toBe(true); // t-4 is URGENT + BLOCKED
    expect(ctx.velocity_ratio).toBeLessThan(1); // declining velocity
    expect(ctx.budget_burn_ratio).toBeCloseTo(998 / 1200, 3);
  });
});

describe("explanation assembly (PRD §15.5 / §23.4)", () => {
  it("suppresses sub-threshold confidence and sorts descending", () => {
    const out = buildExplanation([
      { description: "weak hunch", confidence: 0.4 },
      { description: "vendor 8 days late", confidence: 0.78 },
      { description: "QA at 112%", confidence: 0.92 },
    ]);
    expect(out).toBe("QA at 112% (92%) · vendor 8 days late (78%)");
  });

  it("returns 'Insufficient data' rather than guessing", () => {
    expect(buildExplanation([])).toBe("Insufficient data");
    expect(buildExplanation([{ description: "x", confidence: 0.3 }])).toBe("");
  });
});

describe("staffing candidate ranking (PRD §6.5)", () => {
  it("an expert at high load ranks below a skilled person with headroom", () => {
    const task = tasks.find((t) => t.id === "t-10")!; // labels: ["compliance"]
    const ranked = rankCandidates(
      task,
      employees.filter((e) => ["u-sarah", "u-ahmed"].includes(e.id)),
      (id) => (id === "u-sarah" ? 1.12 : 0.65)
    );
    expect(ranked[0].employee.id).toBe("u-ahmed");
  });

  it("never proposes the current assignee", () => {
    const task = tasks.find((t) => t.id === "t-1")!; // assigned to Sarah
    const ranked = rankCandidates(task, employees, () => 0.5);
    expect(ranked.some((r) => r.employee.id === task.assigneeId)).toBe(false);
  });
});
