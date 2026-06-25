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
  projects as seedProjects,
  employeeById,
  projectById,
} from "./data";
import { validateProposal } from "./ai";
import { useSession } from "./session";
import { log } from "./logger";
import { createChannel } from "./realtime";
import { useMemo } from "react";
import type {
  AuditEvent,
  CapacityCell,
  HealthStatus,
  NotificationItem,
  Project,
  ProjectStatus,
  Proposal,
  Task,
  TaskStatus,
} from "./types";

/** Mutable, syncable overrides for a project's lifecycle fields. The static
 *  seed stays the source of identity; managers change status/health/stage and it
 *  reflects everywhere, live. */
export type ProjectOverride = Partial<Pick<Project, "status" | "health" | "healthReasons">>;

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
  projectOverrides: Record<string, ProjectOverride>;
  extraProjects: Project[];
}

const syncChannel = createChannel<SyncMessage>("dizrupt-ops-sync");

const publishSync = (s: {
  tasks: Task[];
  capacity: CapacityCell[];
  proposals: Proposal[];
  audit: AuditEvent[];
  projectOverrides: Record<string, ProjectOverride>;
  extraProjects: Project[];
}) =>
  syncChannel.publish({
    kind: "ops_state",
    tasks: s.tasks,
    capacity: s.capacity,
    proposals: s.proposals,
    audit: s.audit,
    projectOverrides: s.projectOverrides,
    extraProjects: s.extraProjects,
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
  /** Live project lifecycle changes (status/health), keyed by project id. */
  projectOverrides: Record<string, ProjectOverride>;
  /** Projects created during the session — live everywhere, synced cross-tab. */
  extraProjects: Project[];
  paletteOpen: boolean;
  drawerTaskId: string | null;
  pendingDrop: PendingDrop | null; // guardrail modal state
  lastAction: string | null;
  // The most recent committed reallocation — drives the capacity "close the loop"
  // flash (source row ticks down, target row ticks up). `at` makes each move a
  // fresh signal even when the same pair moves twice.
  lastMove: { fromId: string | null; toId: string; at: number } | null;

  setPaletteOpen: (open: boolean) => void;
  openTaskDrawer: (id: string | null) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  addNotification: (item: NotificationItem) => void;
  /** OS access auditing — record a role-denied app open into the audit trail. */
  recordAccessDenied: (label: string) => void;
  /** Stable Kanban mutation — swap for a distributed backend call later. */
  moveTask: (taskId: string, sourceCol: TaskStatus, destCol: TaskStatus, newIndex: number) => void;

  utilization: (employeeId: string, weekStart: string) => number;
  allocated: (employeeId: string, weekStart: string) => number;

  moveTaskStatus: (taskId: string, status: TaskStatus) => void;
  requestReallocate: (taskId: string, toEmployeeId: string) => void;
  confirmReallocate: (overrideReason?: string) => void;
  cancelReallocate: () => void;

  reviewProposal: (id: string, verdict: "approved" | "rejected") => void;
  /** Manager moves a project's stage/health. Live + audited + notified. */
  setProjectStage: (projectId: string, patch: ProjectOverride) => void;
  /** Manager creates a project — lands in the live store so it shows everywhere. */
  addProject: (p: Omit<Project, "id" | "code" | "velocityTrend">) => void;
  addTask: (task: Omit<Task, "id" | "loggedHours" | "labels" | "dependsOn">) => void;
  /** Self-service: an employee picks up an UNOWNED task for themselves. No
   *  manager grant needed, but bounded — only unassigned tasks, only to the
   *  current user, only if it keeps them under 100%. */
  claimTask: (taskId: string) => void;
  /** Client sign-off: the customer approves a deliverable awaiting their review
   *  on THEIR project — it completes and the team is notified. Live everywhere. */
  clientApproveTask: (taskId: string) => void;
  /** Assignee refines their own estimate, or manager sets it. Writes to audit. */
  updateTaskEstimate: (taskId: string, hours: number) => void;
}

const applyDelta = (
  capacity: CapacityCell[],
  employeeId: string,
  weekStart: string,
  delta: number
): CapacityCell[] => {
  const exists = capacity.some(
    (c) => c.employeeId === employeeId && c.weekStart === weekStart
  );
  if (!exists) {
    return [
      ...capacity,
      { employeeId, weekStart, allocatedHours: Math.max(0, delta), loggedHours: 0 },
    ];
  }
  return capacity.map((c) =>
    c.employeeId === employeeId && c.weekStart === weekStart
      ? { ...c, allocatedHours: Math.max(0, c.allocatedHours + delta) }
      : c
  );
};

// When a task completes, anyone whose task was waiting on it (and is a different
// person) gets an "you're unblocked" ping — the task-dependency notification.
function unblockNotifs(completedTaskId: string, tasks: Task[]): NotificationItem[] {
  const completed = tasks.find((t) => t.id === completedTaskId);
  if (!completed) return [];
  return tasks
    .filter((t) =>
      t.status !== "COMPLETED" &&
      (t.dependsOn ?? []).includes(completedTaskId) &&
      t.assigneeId && t.assigneeId !== completed.assigneeId
    )
    .map((t) => ({
      id: `n-unblock-${completedTaskId}-${t.id}-${Date.now()}`,
      klass: "manager_review" as const,
      title: "You're unblocked 🔓",
      body: `'${completed.title}' is done — you can start '${t.title}'.`,
      at: new Date().toISOString(),
      read: false,
      entityRef: "/tasks",
      recipientId: t.assigneeId,
    }));
}

let auditSeq = 100;

// Audit completeness law: every event is attributed to the persona actually
// signed in — never a hardcoded actor.
const currentActor = () => {
  const p = useSession.getState().persona();
  return { actorId: p.id, actorRole: p.role };
};

export const useOps = create<OpsState>((set, get) => ({
  tasks: seedTasks,
  capacity: seedCapacity,
  proposals: seedProposals,
  audit: seedAudit,
  notifications: seedNotifications,
  projectOverrides: {},
  extraProjects: [],
  paletteOpen: false,
  drawerTaskId: null,
  pendingDrop: null,
  lastAction: null,
  lastMove: null,

  setPaletteOpen: (open) => set({ paletteOpen: open }),
  openTaskDrawer: (id) => set({ drawerTaskId: id }),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  addNotification: (item) =>
    set((s) => ({
      notifications: [item, ...s.notifications].slice(0, 60), // cap at 60 items
    })),

  recordAccessDenied: (label) =>
    set((s) => ({
      audit: [
        { id: `a-${auditSeq++}`, ...currentActor(), actionType: "access_denied", entityType: "app", entityLabel: label, detail: `Role lacks permission to open ${label}`, at: new Date().toISOString() },
        ...s.audit,
      ],
      lastAction: `Access denied — ${label}`,
    })),

  // Optimistic move across Kanban columns. Pure on the flat task list: re-status
  // the task and splice it to `newIndex` within the destination column's order.
  // The (taskId, sourceCol, destCol, newIndex) contract is intentionally stable
  // so a CRDT/backend mutation can drop straight in here.
  moveTask: (taskId, _sourceCol, destCol, newIndex) => {
    // RBAC: without `reallocate`, you may only move tasks assigned to you.
    const me = useSession.getState().persona();
    const owns = get().tasks.find((t) => t.id === taskId);
    if (owns && owns.assigneeId && owns.assigneeId !== me.id && !useSession.getState().can("reallocate")) {
      set({ lastAction: "Not permitted — you can only move your own tasks." });
      return;
    }
    set((s) => {
      const task = s.tasks.find((t) => t.id === taskId);
      if (!task) return s;
      const without = s.tasks.filter((t) => t.id !== taskId);
      const moved = { ...task, status: destCol };
      const destItems = without.filter((t) => t.status === destCol);
      const clamped = Math.max(0, Math.min(newIndex, destItems.length));
      let insertAt: number;
      if (destItems.length === 0) {
        insertAt = without.length;
      } else if (clamped >= destItems.length) {
        insertAt = without.indexOf(destItems[destItems.length - 1]) + 1;
      } else {
        insertAt = without.indexOf(destItems[clamped]);
      }
      const next = [...without.slice(0, insertAt), moved, ...without.slice(insertAt)];
      const extra = destCol === "COMPLETED" ? unblockNotifs(taskId, next) : [];
      return {
        tasks: next,
        notifications: extra.length ? [...extra, ...s.notifications] : s.notifications,
        lastAction: `Task → ${destCol.replace("_", " ").toLowerCase()}`,
      };
    });
    publishSync(get());
  },

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
    // RBAC: same rule as the Kanban — without `reallocate` you may only change
    // the status of tasks assigned to you.
    const me = useSession.getState().persona();
    const t0 = get().tasks.find((t) => t.id === taskId);
    if (t0 && t0.assigneeId && t0.assigneeId !== me.id && !useSession.getState().can("reallocate")) {
      set({ lastAction: "Not permitted — you can only update your own tasks." });
      return;
    }
    set((s) => {
      const tasks = s.tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
      const extra = status === "COMPLETED" ? unblockNotifs(taskId, tasks) : [];
      return {
        tasks,
        notifications: extra.length ? [...extra, ...s.notifications] : s.notifications,
        lastAction: `Task moved to ${status.replace("_", " ").toLowerCase()}`,
      };
    });
    publishSync(get());
  },

  // Step 1 of the North Star flow — compute projection, trip guardrail if ≥100%
  requestReallocate: (taskId, toEmployeeId) => {
    // RBAC (server-of-record): reassigning work requires the `reallocate` grant.
    // This is the authority check — the UI hides the control too, but a denied
    // mutation here is what actually protects the data.
    if (!useSession.getState().can("reallocate")) {
      set({ lastAction: "Not permitted — reassigning tasks requires manager access." });
      return;
    }
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
    if (!useSession.getState().can("reallocate")) { set({ pendingDrop: null, lastAction: "Not permitted — reassigning tasks requires manager access." }); return; }
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

    // Both sides of the move, before → after, for the dual-sided notification.
    const pctOf = (capSlice: CapacityCell[], empId: string) => {
      const emp = employeeById(empId);
      if (!emp) return 0;
      const hours =
        capSlice.find((c) => c.employeeId === empId && c.weekStart === task.weekStart)
          ?.allocatedHours ?? 0;
      return Math.round((hours / emp.capacityHoursPerWeek) * 100);
    };
    const fromBefore = from ? pctOf(capacity, from) : null;
    const fromAfter = from ? pctOf(cap, from) : null;
    const toBefore = pctOf(capacity, to);
    const toAfter = pctOf(cap, to);

    const event: AuditEvent = {
      id: `a-${auditSeq++}`,
      ...currentActor(),
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

    // Dual-sided story: the toast names both people; and we deliver a
    // notification ADDRESSED to each person affected — the one who picked up the
    // work, and the one it was moved off — so nobody learns about a change to
    // their week second-hand.
    const relievedBit =
      fromEmp && fromBefore !== null
        ? `Relieved ${fromEmp.name.split(" ")[0]} ${fromBefore}% → ${fromAfter}%`
        : "Assigned from backlog";
    const loadedBit = `loaded ${toEmp?.name.split(" ")[0]} ${toBefore}% → ${toAfter}%`;
    const at = new Date().toISOString();

    const newNotifs: NotificationItem[] = [];
    // → the person who now owns the task
    newNotifs.push({
      id: `n-assign-${auditSeq}`,
      klass: "manager_review",
      title: `New task assigned to you — ${task.estimatedHours}h`,
      body: `'${task.title}' is now yours (week of ${task.weekStart.slice(5)}). Your week: ${toBefore}% → ${toAfter}%.`,
      at, read: false, entityRef: "/tasks", recipientId: to,
    });
    // → the person it was moved off (if any)
    if (from && fromEmp) {
      newNotifs.push({
        id: `n-relieve-${auditSeq}`,
        klass: "informational",
        title: "A task was moved off your plate",
        body: `'${task.title}' (${task.estimatedHours}h) went to ${toEmp?.name}. Your week: ${fromBefore}% → ${fromAfter}%.`,
        at, read: false, entityRef: "/capacity", recipientId: from,
      });
    }
    // → managers: heads-up if this move tips the receiver over 100%
    if (toAfter >= 100) {
      newNotifs.push({
        id: `n-overload-${auditSeq}`,
        klass: "critical_action",
        title: `${toEmp?.name.split(" ")[0]} is now overloaded`,
        body: `'${task.title}' pushed ${toEmp?.name} to ${toAfter}% (week of ${task.weekStart.slice(5)}). Consider moving other work off them.`,
        at, read: false, entityRef: "/capacity",
      });
    }

    set({
      tasks: tasks.map((t) =>
        t.id === task.id ? { ...t, assigneeId: to } : t
      ),
      capacity: cap,
      audit: [event, ...get().audit],
      pendingDrop: null,
      notifications: [...newNotifs, ...get().notifications],
      lastAction: `${relievedBit} · ${loadedBit} (${task.estimatedHours}h)`,
      lastMove: { fromId: from ?? null, toId: to, at: Date.now() },
    });
    publishSync(get());
  },

  cancelReallocate: () => set({ pendingDrop: null }),

  setProjectStage: (projectId, patch) => {
    // RBAC: changing a project's stage is a manager action (same grant as
    // reallocating work). ICs and clients can never reach this.
    if (!useSession.getState().can("reallocate")) {
      set({ lastAction: "Not permitted — only managers can change a project's stage." });
      return;
    }
    const project = projectById(projectId);
    if (!project) return;
    const prev = get().projectOverrides[projectId] ?? {};
    const merged: ProjectOverride = { ...prev, ...patch };
    const newStatus = merged.status ?? project.status;
    const newHealth = merged.health ?? project.health;

    const event: AuditEvent = {
      id: `a-${auditSeq++}`,
      ...currentActor(),
      actionType: "project_status_changed",
      entityType: "project",
      entityLabel: project.name,
      detail: `${project.name} → ${newStatus.toLowerCase()} · ${newHealth.replace("_", " ").toLowerCase()}.`,
      at: new Date().toISOString(),
    };
    log.info("project_stage_changed", { projectId, status: newStatus, health: newHealth });

    set((s) => ({
      projectOverrides: { ...s.projectOverrides, [projectId]: merged },
      audit: [event, ...s.audit],
      notifications: [
        {
          id: `n-proj-${auditSeq}`,
          klass: newStatus === "COMPLETED" ? "informational" as const : "manager_review" as const,
          title: newStatus === "COMPLETED" ? `${project.name} marked done` : `${project.name} updated`,
          body: `Now ${newStatus.toLowerCase()} · ${newHealth.replace("_", " ").toLowerCase()}.`,
          at: new Date().toISOString(),
          read: false,
          entityRef: "/projects",
        },
        ...s.notifications,
      ],
      lastAction: `${project.name} → ${newStatus.toLowerCase()}`,
    }));
    publishSync(get());
  },

  addProject: (p) => {
    if (!useSession.getState().can("reallocate")) {
      set({ lastAction: "Not permitted — only managers can create projects." });
      return;
    }
    const code = (p.name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase()) || "PRJ";
    const project: Project = { ...p, id: `p-${Date.now()}`, code, velocityTrend: [0, 0, 0, 0, 0, 0] };
    const event: AuditEvent = {
      id: `a-${auditSeq++}`,
      ...currentActor(),
      actionType: "project_created",
      entityType: "project",
      entityLabel: project.name,
      detail: `Created project '${project.name}' (${project.status.toLowerCase()}).`,
      at: new Date().toISOString(),
    };
    set((s) => ({
      extraProjects: [...s.extraProjects, project],
      audit: [event, ...s.audit],
      notifications: [
        { id: `n-newproj-${auditSeq}`, klass: "informational" as const, title: `New project: ${project.name}`, body: `${project.name} was created. It's now on the board.`, at: new Date().toISOString(), read: false, entityRef: "/projects" },
        ...s.notifications,
      ],
      lastAction: `Project "${project.name}" created`,
    }));
    publishSync(get());
  },

  reviewProposal: (id, verdict) => {
    if (!useSession.getState().can("review_proposals")) { set({ lastAction: "Not permitted — reviewing agent proposals requires manager access." }); return; }
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
              ...currentActor(),
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
      ...currentActor(),
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

  addTask: (task) => {
    const session = useSession.getState();
    const me = session.persona();

    // Employees can only create tasks assigned to themselves.
    // Assigning to someone else requires the reallocate grant (managers+).
    if (task.assigneeId && task.assigneeId !== me.id && !session.can("reallocate")) {
      set({ lastAction: "Not permitted — you can only create tasks for yourself." });
      return;
    }

    const id = `t-${Date.now()}`;
    const newTask: Task = {
      id,
      loggedHours: 0,
      labels: [],
      dependsOn: [],
      ...task,
    };
    let cap = get().capacity;
    if (newTask.assigneeId) {
      cap = applyDelta(cap, newTask.assigneeId, newTask.weekStart, newTask.estimatedHours);
    }
    const event: AuditEvent = {
      id: `a-${auditSeq++}`,
      ...currentActor(),
      actionType: "task_created",
      entityType: "task",
      entityLabel: newTask.title,
      detail: `Task created: ${newTask.estimatedHours}h est, due ${newTask.dueDate}, priority ${newTask.priority}${newTask.assigneeId && newTask.assigneeId !== me.id ? " · manager-assigned" : ""}.`,
      at: new Date().toISOString(),
    };
    // If a manager created this for someone else, tell that person directly.
    const assignNotif: NotificationItem[] =
      newTask.assigneeId && newTask.assigneeId !== me.id
        ? [{
            id: `n-newtask-${auditSeq++}`,
            klass: "manager_review",
            title: `New task assigned to you — ${newTask.estimatedHours}h`,
            body: `'${newTask.title}' was assigned to you (due ${newTask.dueDate}).`,
            at: new Date().toISOString(),
            read: false,
            entityRef: "/tasks",
            recipientId: newTask.assigneeId,
          }]
        : [];

    set((s) => ({
      tasks: [...s.tasks, newTask],
      capacity: cap,
      audit: [event, ...s.audit],
      notifications: [...assignNotif, ...s.notifications],
      lastAction: `Task "${newTask.title}" created`,
    }));
    publishSync(get());
    // Fire-and-forget write-through to the live backend (if available).
    // Failures are silent — the local state is already updated.
    fetch("/api/v1/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTask.title,
        projectId: newTask.projectId,
        assigneeId: newTask.assigneeId,
        status: newTask.status,
        priority: newTask.priority,
        estimatedHours: newTask.estimatedHours,
        weekStart: newTask.weekStart,
        dueDate: newTask.dueDate,
      }),
      credentials: "include",
    }).catch(() => {/* demo fallback */ });
  },

  claimTask: (taskId) => {
    const me = useSession.getState().persona();
    const emp = employeeById(me.id);
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (!emp) { set({ lastAction: "Only team members can pick up tasks." }); return; }
    if (task.assigneeId) { set({ lastAction: "That task already has an owner." }); return; }
    const projected = (get().allocated(me.id, task.weekStart) + task.estimatedHours) / emp.capacityHoursPerWeek;
    if (projected >= 1) { set({ lastAction: "That would put you over 100% this week — check with your manager first." }); return; }

    const cap = applyDelta(get().capacity, me.id, task.weekStart, task.estimatedHours);
    const event: AuditEvent = {
      id: `a-${auditSeq++}`,
      ...currentActor(),
      actionType: "task_claimed",
      entityType: "task",
      entityLabel: task.title,
      detail: `${emp.name} picked up '${task.title}' (${task.estimatedHours}h, week of ${task.weekStart.slice(5)}) — self-service.`,
      at: new Date().toISOString(),
    };
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, assigneeId: me.id } : t)),
      capacity: cap,
      audit: [event, ...s.audit],
      notifications: [
        {
          id: `n-claim-${auditSeq}`,
          klass: "informational" as const,
          title: "You picked up a task",
          body: `'${task.title}' (${task.estimatedHours}h) is now yours. Nice — that keeps the project moving.`,
          at: new Date().toISOString(),
          read: false,
          entityRef: "/tasks",
          recipientId: me.id,
        },
        ...s.notifications,
      ],
      lastAction: `You picked up "${task.title}"`,
    }));
    publishSync(get());
  },

  clientApproveTask: (taskId) => {
    const me = useSession.getState().persona();
    if (me.role !== "client") { set({ lastAction: "Only the client can approve their deliverables." }); return; }
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const proj = projectById(task.projectId);
    // Scope: the client can only approve work on a project booked under their name.
    if (!proj || proj.customer !== (me as { customer?: string }).customer) {
      set({ lastAction: "Not your project." });
      return;
    }
    if (task.status !== "CLIENT_REVIEW" && task.status !== "REVIEW") return;

    const event: AuditEvent = {
      id: `a-${auditSeq++}`,
      ...currentActor(),
      actionType: "client_approved",
      entityType: "task",
      entityLabel: task.title,
      detail: `${me.name} (client) approved '${task.title}'.`,
      at: new Date().toISOString(),
    };
    set((s) => {
      const tasks = s.tasks.map((t) => (t.id === taskId ? { ...t, status: "COMPLETED" as TaskStatus } : t));
      return {
        tasks,
        audit: [event, ...s.audit],
        notifications: [
          {
            id: `n-clientok-${auditSeq}`,
            klass: "informational" as const,
            title: `Client approved: ${task.title}`,
            body: `${me.name} signed off on '${task.title}'. It's marked done.`,
            at: new Date().toISOString(),
            read: false,
            entityRef: "/projects",
            recipientId: task.assigneeId,
          },
          ...unblockNotifs(taskId, tasks),
          ...s.notifications,
        ],
        lastAction: `Approved "${task.title}" — thanks!`,
      };
    });
    publishSync(get());
  },

  updateTaskEstimate: (taskId, hours) => {
    const session = useSession.getState();
    const me = session.persona();
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Only the assignee or someone with reallocate (manager) can set the estimate.
    const isAssignee = task.assigneeId === me.id;
    const isManager = session.can("reallocate");
    if (!isAssignee && !isManager) {
      set({ lastAction: "Not permitted — only the assignee or a manager can update the estimate." });
      return;
    }

    const prev = task.estimatedHours;
    const delta = hours - prev;

    // Adjust capacity: remove old allocation, add new.
    let cap = get().capacity;
    if (task.assigneeId) {
      if (prev > 0) cap = applyDelta(cap, task.assigneeId, task.weekStart, -prev);
      cap = applyDelta(cap, task.assigneeId, task.weekStart, hours);
    }

    const event: AuditEvent = {
      id: `a-${auditSeq++}`,
      ...currentActor(),
      actionType: "task_estimated",
      entityType: "task",
      entityLabel: task.title,
      detail: isAssignee
        ? `Engineer refined estimate: ${prev || "?"}h → ${hours}h (${delta >= 0 ? "+" : ""}${delta}h)`
        : `Manager set estimate: ${prev || "?"}h → ${hours}h`,
      at: new Date().toISOString(),
    };

    set((s) => ({
      tasks: s.tasks.map((t) => t.id === taskId ? { ...t, estimatedHours: hours } : t),
      capacity: cap,
      audit: [event, ...s.audit],
      lastAction: `Estimate updated: ${hours}h`,
    }));
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
    projectOverrides: msg.projectOverrides ?? {},
    extraProjects: msg.extraProjects ?? [],
    lastAction: "Synced from another session",
  });
});

/* ----------------------------- live projects ------------------------------ */
// Merge the static project seed with any live overrides. Components that show a
// project's status/health should read THESE so manager changes appear live,
// everywhere, for every login.
export function mergeProject(p: Project, overrides: Record<string, ProjectOverride>): Project {
  const o = overrides[p.id];
  return o ? { ...p, ...o } : p;
}

/** Hook: all projects (seed + session-created) with live status/health applied.
 *  Memoized so the array reference is stable across renders. */
export function useLiveProjects(): Project[] {
  const overrides = useOps((s) => s.projectOverrides);
  const extra = useOps((s) => s.extraProjects);
  return useMemo(
    () => [...seedProjects.map((p) => mergeProject(p, overrides)), ...extra],
    [overrides, extra]
  );
}

/** Hook: a single project with live status/health applied. */
export function useLiveProject(id?: string): Project | undefined {
  const overrides = useOps((s) => s.projectOverrides);
  const p = seedProjects.find((x) => x.id === id);
  return p ? mergeProject(p, overrides) : undefined;
}
