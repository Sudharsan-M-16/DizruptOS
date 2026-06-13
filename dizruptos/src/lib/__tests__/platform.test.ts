// Platform layer tests — the capacity laws as pure services, and the
// repository contracts that both backends must satisfy.

import { describe, expect, it } from "vitest";
import {
  applyDeltas,
  planReallocation,
  utilizationOf,
} from "../../server/services/allocation";
import { createMemoryRepositories } from "../../server/repositories/memory";
import { employees, tasks, capacity } from "../data";

const sarah = employees.find((e) => e.id === "u-sarah")!;
const ahmed = employees.find((e) => e.id === "u-ahmed")!;
const someTask = tasks.find((t) => t.assigneeId === "u-sarah")!;

describe("allocation service — the capacity laws", () => {
  it("projects target utilization before any mutation", () => {
    const plan = planReallocation({ task: someTask, target: ahmed, capacity });
    expect(plan.ok).toBe(true);
    expect(plan.projected).toBeGreaterThan(0);
    expect(plan.deltas).toHaveLength(2); // off the source, onto the target
  });

  it("trips the hard-stop guardrail at >= 100%", () => {
    const fullCapacity = capacity.map((c) =>
      c.employeeId === ahmed.id && c.weekStart === someTask.weekStart
        ? { ...c, allocatedHours: ahmed.capacityHoursPerWeek }
        : c
    );
    const plan = planReallocation({ task: someTask, target: ahmed, capacity: fullCapacity });
    expect(plan.requiresOverride).toBe(true);
  });

  it("refuses no-op moves to the same assignee", () => {
    const plan = planReallocation({ task: someTask, target: sarah, capacity });
    expect(plan.ok).toBe(false);
    expect(plan.reason).toBe("SAME_ASSIGNEE");
  });

  it("delta application is conservative: total hours are preserved", () => {
    const plan = planReallocation({ task: someTask, target: ahmed, capacity });
    const before = capacity.reduce((s, c) => s + c.allocatedHours, 0);
    const after = applyDeltas(capacity, plan.deltas).reduce(
      (s, c) => s + c.allocatedHours,
      0
    );
    expect(after).toBe(before); // moved, never created or destroyed
  });

  it("utilizationOf divides by the person's own weekly capacity", () => {
    const u = utilizationOf(capacity, sarah, someTask.weekStart);
    expect(u).toBeGreaterThan(0);
    expect(u).toBeLessThan(2);
  });
});

describe("memory repository — contract behavior", () => {
  it("reassign moves the task and both capacity deltas atomically", async () => {
    const repos = createMemoryRepositories();
    const task = (await repos.tasks.list()).find((t) => t.assigneeId)!;
    const from = task.assigneeId!;
    const to = employees.find((e) => e.id !== from && e.role !== "client")!.id;

    const before = await repos.capacity.forWeek(task.weekStart);
    const beforeTotal = before.reduce((s, c) => s + c.allocatedHours, 0);

    await repos.tasks.reassign(task.id, to);

    const moved = await repos.tasks.byId(task.id);
    expect(moved?.assigneeId).toBe(to);

    const after = await repos.capacity.forWeek(task.weekStart);
    const afterTotal = after.reduce((s, c) => s + c.allocatedHours, 0);
    expect(afterTotal).toBe(beforeTotal);
  });

  it("audit is append-only: the interface exposes no mutation of history", async () => {
    const repos = createMemoryRepositories();
    const auditApi = repos.audit as unknown as Record<string, unknown>;
    expect(auditApi.update).toBeUndefined();
    expect(auditApi.delete).toBeUndefined();
    expect(auditApi.remove).toBeUndefined();
  });

  it("rejects reassign to unknown targets", async () => {
    const repos = createMemoryRepositories();
    const task = (await repos.tasks.list())[0];
    await expect(repos.tasks.reassign(task.id, "u-ghost")).rejects.toThrow();
  });
});
