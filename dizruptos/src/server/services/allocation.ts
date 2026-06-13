// Allocation service — the capacity laws as pure functions (PRD §3, §11).
// No storage, no UI: services compute, repositories persist, routes authorize.
// The client store and the API both call THESE so the math can never fork.

import type { CapacityCell, Employee, Task } from "@/lib/types";

export interface ReallocationPlan {
  ok: boolean;
  reason?: "TASK_NOT_FOUND" | "TARGET_NOT_FOUND" | "SAME_ASSIGNEE";
  /** Target's utilization if the move happens (0–n, 1 = 100%). */
  projected: number;
  /** Hard-stop guardrail: ≥100% requires a typed override reason (PRD §3.3). */
  requiresOverride: boolean;
  deltas: { employeeId: string; weekStart: string; deltaHours: number }[];
}

export function utilizationOf(
  capacity: CapacityCell[],
  employee: Employee,
  weekStart: string
): number {
  const hours =
    capacity.find(
      (c) => c.employeeId === employee.id && c.weekStart === weekStart
    )?.allocatedHours ?? 0;
  return hours / employee.capacityHoursPerWeek;
}

/** Compute everything a reallocation needs BEFORE anything mutates:
 *  projection, guardrail decision, and the exact atomic delta set. */
export function planReallocation(args: {
  task: Task | undefined;
  target: Employee | undefined;
  capacity: CapacityCell[];
}): ReallocationPlan {
  const { task, target, capacity } = args;
  const fail = (reason: ReallocationPlan["reason"]): ReallocationPlan => ({
    ok: false,
    reason,
    projected: 0,
    requiresOverride: false,
    deltas: [],
  });

  if (!task) return fail("TASK_NOT_FOUND");
  if (!target) return fail("TARGET_NOT_FOUND");
  if (task.assigneeId === target.id) return fail("SAME_ASSIGNEE");

  const current =
    capacity.find(
      (c) => c.employeeId === target.id && c.weekStart === task.weekStart
    )?.allocatedHours ?? 0;
  const projected = (current + task.estimatedHours) / target.capacityHoursPerWeek;

  const deltas = [
    ...(task.assigneeId
      ? [{ employeeId: task.assigneeId, weekStart: task.weekStart, deltaHours: -task.estimatedHours }]
      : []),
    { employeeId: target.id, weekStart: task.weekStart, deltaHours: task.estimatedHours },
  ];

  return { ok: true, projected, requiresOverride: projected >= 1, deltas };
}

/** Apply a delta set immutably — the in-memory analogue of the SQL transaction. */
export function applyDeltas(
  capacity: CapacityCell[],
  deltas: ReallocationPlan["deltas"]
): CapacityCell[] {
  return deltas.reduce(
    (cap, d) =>
      cap.map((c) =>
        c.employeeId === d.employeeId && c.weekStart === d.weekStart
          ? { ...c, allocatedHours: Math.max(0, c.allocatedHours + d.deltaHours) }
          : c
      ),
    capacity
  );
}
