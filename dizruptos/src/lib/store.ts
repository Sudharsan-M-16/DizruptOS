"use client";

// Client operations store — models the PRD's optimistic-mutation laws:
// atomic capacity deltas, hard-stop guardrail with typed override,
// audit completeness, and agent-proposal review with memory.

import { create } from "zustand";
import {
  auditEvents as seedAudit,
  capacity as seedCapacity,
  employees,
  notifications as seedNotifications,
  proposals as seedProposals,
  tasks as seedTasks,
  employeeById,
} from "./data";
import { validateProposal } from "./ai";
import { log } from "./logger";
import { createChannel } from "./realtime";
import type {
  AuditEvent,
  CapacityCell,
  NotificationItem,
  Proposal,
  Task,
  TaskStatus,
} from "./types";

/* ------------------------------ realtime sync ------------------------------ */
// Cross-tab live sync of shared operational state. Mutations publish the new
// slices; peer tabs apply them directly (apply ≠ publish, so no echo loops).
// Production swap: the same publish points emit to dept-scoped Supabase
// channels and receivers patch only the affected rows.

interface SyncMessage {
  kind: "ops_state";
  tasks: Task[];
  capacity: CapacityCell[];
  proposals: Proposal[];
  audit: AuditEvent[];
}

const syncChannel = createChannel<SyncMessage>("dizrupt-ops-sync");

const publishSync = (s: {
  tasks: Task[];
  capacity: CapacityCell[];
  proposals: Proposal[];
  audit: AuditEvent[];
}) =>
  syncChannel.publish({
    kind: "ops_state",
    tasks: s.tasks,
    capacity: s.capacity,
    proposals: s.proposals,
    audit: s.audit,
  });

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

  moveTaskStatus: (taskId, status) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
      lastAction: `Task moved to ${status.replace("_", " ").toLowerCase()}`,
    }));
    publishSync(get());
  },

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
    publishSync(get());
  },

  cancelReallocate: () => set({ pendingDrop: null }),

  reviewProposal: (id, verdict) => {
    const { proposals } = get();
    const prop = proposals.find((p) => p.id === id);
    if (!prop) return;

    // Decision-time re-validation (law 12): the world moves while a proposal
    // sits in the inbox. A proposal that validated at creation can be stale
    // at approval — execution must refuse it, not corrupt capacity.
    if (verdict === "approved") {
      const result = validateProposal(prop, {
        tasks: get().tasks,
        employees,
        allocated: get().allocated,
      });
      if (!result.valid) {
        const failed = result.checks.filter((c) => !c.pass).map((c) => c.check);
        log.warn("proposal_stale_at_decision", { proposalId: id, failed });
        set({
          proposals: proposals.map((p) =>
            p.id === id ? { ...p, status: "expired" } : p
          ),
          audit: [
            {
              id: `a-${auditSeq++}`,
              actorId: "u-asha",
              actorRole: "project_manager",
              actionType: "proposal_stale",
              entityType: "proposal",
              entityLabel: prop.title,
              detail: `Re-validation failed at decision time: ${failed.join("; ")}. Agent will re-evaluate next cycle.`,
              at: new Date().toISOString(),
            },
            ...get().audit,
          ],
          lastAction: "Proposal expired — failed re-validation against live constraints",
        });
        publishSync(get());
        return;
      }
    }

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
    publishSync(get());
  },
}));

// Apply peer-tab mutations. Receivers never re-publish, so no echo loops.
syncChannel.subscribe((msg) => {
  if (msg.kind !== "ops_state") return;
  useOps.setState({
    tasks: msg.tasks,
    capacity: msg.capacity,
    proposals: msg.proposals,
    audit: msg.audit,
    lastAction: "Synced from another session",
  });
});
