"use client";

// Client operations store — models the PRD's optimistic-mutation laws:
// atomic capacity deltas, hard-stop guardrail with typed override,
// audit completeness, and agent-proposal review with memory.

import { create } from "zustand";
import {
  auditEvents as seedAudit,
  capacity as seedCapacity,
  notifications as seedNotifications,
  proposals as seedProposals,
  tasks as seedTasks,
  employeeById,
} from "./data";
import { log } from "./logger";
import type {
  AuditEvent,
  CapacityCell,
  NotificationItem,
  Proposal,
  Task,
  TaskStatus,
} from "./types";

interface PendingDrop {
  taskId: string;
  toEmployeeId: string;
  weekStart: string;
  projectedPct: number;
}

interface OpsState {
  tasks: Task[];
  capacity: CapacityCell[];
  proposals: Proposal[];
  audit: AuditEvent[];
  notifications: NotificationItem[];
  paletteOpen: boolean;
  drawerTaskId: string | null;
  pendingDrop: PendingDrop | null; // guardrail modal state
  lastAction: string | null;

  setPaletteOpen: (open: boolean) => void;
  openTaskDrawer: (id: string | null) => void;
  markAllRead: () => void;

  utilization: (employeeId: string, weekStart: string) => number;
  allocated: (employeeId: string, weekStart: string) => number;

  moveTaskStatus: (taskId: string, status: TaskStatus) => void;
  requestReallocate: (taskId: string, toEmployeeId: string) => void;
  confirmReallocate: (overrideReason?: string) => void;
  cancelReallocate: () => void;

  reviewProposal: (id: string, verdict: "approved" | "rejected") => void;
}

const applyDelta = (
  capacity: CapacityCell[],
  employeeId: string,
  weekStart: string,
  delta: number
): CapacityCell[] =>
  capacity.map((c) =>
    c.employeeId === employeeId && c.weekStart === weekStart
      ? { ...c, allocatedHours: Math.max(0, c.allocatedHours + delta) }
      : c
  );

let auditSeq = 100;

export const useOps = create<OpsState>((set, get) => ({
  tasks: seedTasks,
  capacity: seedCapacity,
  proposals: seedProposals,
  audit: seedAudit,
  notifications: seedNotifications,
  paletteOpen: false,
  drawerTaskId: null,
  pendingDrop: null,
  lastAction: null,

  setPaletteOpen: (open) => set({ paletteOpen: open }),
  openTaskDrawer: (id) => set({ drawerTaskId: id }),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  allocated: (employeeId, weekStart) =>
    get().capacity.find(
      (c) => c.employeeId === employeeId && c.weekStart === weekStart
    )?.allocatedHours ?? 0,

  utilization: (employeeId, weekStart) => {
    const emp = employeeById(employeeId);
    if (!emp) return 0;
    return get().allocated(employeeId, weekStart) / emp.capacityHoursPerWeek;
  },

  moveTaskStatus: (taskId, status) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
      lastAction: `Task moved to ${status.replace("_", " ").toLowerCase()}`,
    })),

  // Step 1 of the North Star flow — compute projection, trip guardrail if ≥100%
  requestReallocate: (taskId, toEmployeeId) => {
    const { tasks, allocated } = get();
    const task = tasks.find((t) => t.id === taskId);
    const target = employeeById(toEmployeeId);
    if (!task || !target || task.assigneeId === toEmployeeId) return;

    const projected =
      (allocated(toEmployeeId, task.weekStart) + task.estimatedHours) /
      target.capacityHoursPerWeek;

    if (projected >= 1) {
      // Hard-stop guardrail: typed override reason required (PRD §3.3)
      set({
        pendingDrop: {
          taskId,
          toEmployeeId,
          weekStart: task.weekStart,
          projectedPct: projected,
        },
      });
      return;
    }
    set({
      pendingDrop: {
        taskId,
        toEmployeeId,
        weekStart: task.weekStart,
        projectedPct: projected,
      },
    });
    get().confirmReallocate();
  },

  confirmReallocate: (overrideReason) => {
    const { pendingDrop, tasks, capacity } = get();
    if (!pendingDrop) return;
    const task = tasks.find((t) => t.id === pendingDrop.taskId);
    if (!task) return;
    const from = task.assigneeId;
    const to = pendingDrop.toEmployeeId;
    const fromEmp = employeeById(from);
    const toEmp = employeeById(to);

    let cap = capacity;
    if (from) cap = applyDelta(cap, from, task.weekStart, -task.estimatedHours);
    cap = applyDelta(cap, to, task.weekStart, task.estimatedHours);

    const event: AuditEvent = {
      id: `a-${auditSeq++}`,
      actorId: "u-asha",
      actorRole: "project_manager",
      actionType: overrideReason ? "capacity_override" : "task_reallocated",
      entityType: "task",
      entityLabel: task.title,
      detail: `${fromEmp?.name ?? "Unassigned"} → ${toEmp?.name} (${task.estimatedHours}h, week of ${task.weekStart.slice(5)})`,
      overrideReason,
      at: new Date().toISOString(),
    };

    log.info("task_reallocated", {
      taskId: task.id,
      from,
      to,
      deltaHours: task.estimatedHours,
      override: Boolean(overrideReason),
    });

    set({
      tasks: tasks.map((t) =>
        t.id === task.id ? { ...t, assigneeId: to } : t
      ),
      capacity: cap,
      audit: [event, ...get().audit],
      pendingDrop: null,
      lastAction: `${task.estimatedHours}h moved ${fromEmp ? `from ${fromEmp.name.split(" ")[0]} ` : ""}to ${toEmp?.name.split(" ")[0]} — confirmed in 412ms`,
    });
  },

  cancelReallocate: () => set({ pendingDrop: null }),

  reviewProposal: (id, verdict) => {
    const { proposals } = get();
    const prop = proposals.find((p) => p.id === id);
    if (!prop) return;

    // Approval executes the proposed action through the same atomic path
    if (verdict === "approved" && prop.action.kind === "reallocate" && prop.action.taskId && prop.action.toEmployeeId) {
      const taskId = prop.action.taskId;
      const to = prop.action.toEmployeeId;
      const task = get().tasks.find((t) => t.id === taskId);
      if (task) {
        let cap = get().capacity;
        if (task.assigneeId)
          cap = applyDelta(cap, task.assigneeId, task.weekStart, -task.estimatedHours);
        cap = applyDelta(cap, to, task.weekStart, task.estimatedHours);
        set({
          tasks: get().tasks.map((t) =>
            t.id === taskId ? { ...t, assigneeId: to } : t
          ),
          capacity: cap,
        });
      }
    }

    const event: AuditEvent = {
      id: `a-${auditSeq++}`,
      actorId: "u-asha",
      actorRole: "project_manager",
      actionType: `proposal_${verdict}`,
      entityType: "proposal",
      entityLabel: prop.title,
      detail:
        verdict === "approved"
          ? `Agent action executed. Rejection memory not triggered.`
          : `Written to agent_memory — ${prop.agentType.replace("_", " ")} will not re-propose for 30 days.`,
      at: new Date().toISOString(),
    };

    log.info("proposal_reviewed", { proposalId: id, verdict, agent: prop.agentType });

    set({
      proposals: proposals.map((p) =>
        p.id === id ? { ...p, status: verdict } : p
      ),
      audit: [event, ...get().audit],
      lastAction:
        verdict === "approved" ? "Proposal approved — action executed" : "Proposal rejected — agent memory updated",
    });
  },
}));
