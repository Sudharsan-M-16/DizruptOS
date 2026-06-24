"use client";

// Project detail: health explanation panel + premium Kanban with drag between
// columns (optimistic, motion-continuous), linked risks and decisions.

import * as React from "react";
import { notFound } from "next/navigation";
function launchApp(id: string) {
  const ev = new CustomEvent("dizrupt:launch", { detail: { id } });
  window.dispatchEvent(ev);
  try { window.parent?.dispatchEvent(ev); } catch { /* cross-origin guard */ }
}
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, FolderKanban, Link2, Plus, ShieldAlert, ScrollText, Sparkles, X } from "lucide-react";
import { useOps } from "@/lib/store";
import { useSession } from "@/lib/session";
import { severityOf } from "@/lib/risk";
import {
  decisions,
  employees,
  employeeById,
  projectById,
  risks,
  WEEKS,
} from "@/lib/data";
import type { TaskPriority } from "@/lib/types";
import {
  CapacityBar,
  EmpAvatar,
  HealthPill,
  PriorityDot,
  SeverityBadge,
  priorityColor,
} from "@/components/ui/primitives";
import { SparkBars } from "@/components/ui/spark";
import { cn, fmtDate, fmtMoney } from "@/lib/utils";
import type { TaskStatus } from "@/lib/types";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "BACKLOG", label: "Backlog" },
  { id: "TO_DO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "REVIEW", label: "Review" },
  { id: "CLIENT_REVIEW", label: "Client Review" },
  { id: "BLOCKED", label: "Blocked" },
  { id: "COMPLETED", label: "Done" },
];

function AddTaskPanel({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const addTask = useOps((s) => s.addTask);
  const canAssignOthers = useSession((s) => s.can("reallocate"));
  const meId = useSession((s) => s.personaId);

  // Employees can only self-assign. Managers see the full team.
  const pickableAssignees = canAssignOthers
    ? employees.filter((e) => e.role !== "client")
    : employees.filter((e) => e.id === meId);

  const [title, setTitle] = React.useState("");
  const [assigneeId, setAssigneeId] = React.useState(
    canAssignOthers ? "" : meId
  );
  // 0 = unestimated (engineer will fill in later).
  // Managers often don't know hours; engineers always do.
  const [hours, setHours] = React.useState(canAssignOthers ? 0 : 4);
  const [dueDate, setDueDate] = React.useState(
    new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)
  );
  const [priority, setPriority] = React.useState<TaskPriority>("MEDIUM");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      projectId,
      assigneeId: assigneeId || pickableAssignees[0]?.id,
      estimatedHours: hours,
      dueDate,
      priority,
      status: "TO_DO",
      weekStart: WEEKS[0],
    });
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.form
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-t-2xl border border-line bg-ink-surface p-6 shadow-2xl sm:rounded-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold tracking-tight">Add task</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full bg-ink-elevated text-fg-muted hover:text-fg"
          >
            <X size={13} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="label-xs mb-1 block">Task name</label>
            <input
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none ring-brand focus:border-brand focus:ring-1"
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="label-xs mb-1.5 block">
              Assignee
              {!canAssignOthers && (
                <span className="ml-2 text-fg-muted normal-case font-normal">— your tasks only</span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {pickableAssignees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setAssigneeId(emp.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors",
                    assigneeId === emp.id
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line bg-ink-elevated text-fg-secondary hover:border-brand/40"
                  )}
                >
                  <EmpAvatar initials={emp.initials} accent={emp.accent} size={16} />
                  {emp.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Hours */}
            <div>
              <label className="label-xs mb-1 block">
                Est. hours
                {canAssignOthers && (
                  <span className="ml-1 font-normal normal-case text-fg-muted">— engineer will refine</span>
                )}
              </label>
              <input
                type="number"
                min={0}
                max={80}
                placeholder={canAssignOthers ? "Leave 0 if unknown" : "How long will this take?"}
                value={hours || ""}
                onChange={(e) => setHours(Number(e.target.value) || 0)}
                className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none ring-brand focus:border-brand focus:ring-1"
              />
            </div>

            {/* Due date */}
            <div>
              <label className="label-xs mb-1 block">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-card border border-line bg-ink-elevated px-3 py-2 text-sm outline-none ring-brand focus:border-brand focus:ring-1"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="label-xs mb-1.5 block">Priority</label>
            <div className="flex gap-2">
              {(["URGENT", "HIGH", "MEDIUM", "LOW"] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex-1 rounded-card border py-1.5 text-2xs font-semibold uppercase tracking-wider transition-colors",
                    priority === p
                      ? p === "URGENT"
                        ? "border-danger bg-danger/10 text-danger"
                        : p === "HIGH"
                        ? "border-amber-500 bg-amber-500/10 text-amber-400"
                        : p === "MEDIUM"
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line bg-ink-elevated text-fg-muted"
                      : "border-line bg-ink-elevated text-fg-muted hover:border-brand/40"
                  )}
                >
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-5 w-full rounded-card bg-brand py-2.5 text-sm font-semibold text-ink shadow-[0_0_20px_#00ED8244] transition-opacity hover:opacity-90"
        >
          Add task
        </button>
      </motion.form>
    </motion.div>
  );
}

function InlineEstimate({ task }: { task: { id: string; estimatedHours: number; assigneeId?: string } }) {
  const updateTaskEstimate = useOps((s) => s.updateTaskEstimate);
  const meId = useSession((s) => s.personaId);
  const canEdit = useSession((s) => s.can("reallocate")) || task.assigneeId === meId;
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(String(task.estimatedHours || ""));

  if (!canEdit) {
    return (
      <span className="font-mono text-2xs text-fg-muted">
        {task.estimatedHours ? `${task.estimatedHours}h` : "?h"}
      </span>
    );
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        min={1}
        max={80}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          const h = parseInt(val);
          if (h > 0) updateTaskEstimate(task.id, h);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-10 rounded border border-brand bg-ink-surface px-1 font-mono text-2xs text-brand outline-none"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setEditing(true); setVal(String(task.estimatedHours || "")); }}
      className={cn(
        "rounded px-1 font-mono text-2xs transition-colors hover:bg-brand-soft",
        task.estimatedHours === 0 ? "text-warn animate-pulse" : "text-fg-muted"
      )}
      title={task.estimatedHours === 0 ? "Click to set your estimate" : "Click to refine estimate"}
    >
      {task.estimatedHours === 0 ? "set hrs" : `${task.estimatedHours}h`}
    </button>
  );
}

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const project = projectById(params.id);
  const tasks = useOps((s) => s.tasks);
  const moveTaskStatus = useOps((s) => s.moveTaskStatus);
  const openTaskDrawer = useOps((s) => s.openTaskDrawer);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overCol, setOverCol] = React.useState<TaskStatus | null>(null);
  const [addingTask, setAddingTask] = React.useState(false);

  if (!project) return notFound();
  const owner = employeeById(project.ownerId);
  const projTasks = tasks.filter((t) => t.projectId === project.id);
  const linkedRisks = risks.filter((r) => r.projectId === project.id);
  const linkedDecisions = decisions.filter((d) => d.projectId === project.id);

  return (
    <div className="flex h-full flex-col">
      {/* OS page header */}
      <div className="flex items-center gap-3 border-b border-line bg-ink-elevated/50 px-5 py-3.5 shrink-0">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#34D39922", border: "1px solid #34D39944" }}>
          <FolderKanban size={15} style={{ color: "#34D399" }} />
        </span>
        <div>
          <div className="text-sm font-semibold">{project.name}</div>
          <div className="text-[11px] text-fg-muted">{project.code} · {project.status}</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
      <div className="space-y-5">
      {/* Header */}
      <div className="panel p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span className="rounded-lg bg-brand-soft px-2.5 py-1.5 font-mono text-sm font-bold text-brand">
            {project.code}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-lg font-semibold tracking-tight">
                {project.name}
              </h1>
              <HealthPill health={project.health} pulse />
              {project.customer && (
                <span className="rounded-full border border-line bg-ink-elevated px-2.5 py-0.5 text-2xs text-fg-secondary">
                  {project.customer}
                </span>
              )}
            </div>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-fg-secondary">
              {project.description}
            </p>
          </div>
          <div className="flex items-center gap-6 text-2xs">
            <HeaderStat label="Budget" value={fmtMoney(project.budgetMicro)} sub={`${Math.round((project.consumedMicro / project.budgetMicro) * 100)}% consumed`} />
            <HeaderStat label="Hours" value={`${project.consumedHours}/${project.budgetHours}`} sub="logged vs plan" />
            <HeaderStat label="Target" value={fmtDate(project.targetDate)} sub={owner ? `Owner: ${owner.name.split(" ")[0]}` : ""} />
            <div className="h-10 w-28">
              <SparkBars data={project.velocityTrend} color={project.health === "CRITICAL" ? "#EF4444" : "#00ED82"} />
            </div>
          </div>
        </div>

        {/* Health explanation panel — never just a color badge */}
        <div className="mt-4 rounded-card border border-line-subtle bg-ink-elevated/50 p-3.5">
          <div className="label-xs mb-2 flex items-center gap-1.5 text-brand">
            <Sparkles size={11} /> Why this status — stored causal signals
          </div>
          <div className="grid gap-1.5 md:grid-cols-2">
            {project.healthReasons.map((r, i) => (
              <div key={i} className="flex gap-2 text-2xs leading-relaxed text-fg-secondary">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand/70" />
                {r}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-secondary">Board</h2>
        <button
          onClick={() => setAddingTask(true)}
          className="flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-soft px-3 py-1 text-2xs font-semibold text-brand hover:bg-brand/20 transition-colors"
        >
          <Plus size={11} /> Add task
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {COLUMNS.map((col) => {
          const colTasks = projTasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(col.id);
              }}
              onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) moveTaskStatus(dragId, col.id);
                setDragId(null);
                setOverCol(null);
              }}
              className={cn(
                "flex min-h-[280px] flex-col rounded-card border border-line-subtle bg-ink-surface/60 transition-colors",
                overCol === col.id && "border-brand/50 bg-brand-soft/20"
              )}
            >
              <div className="flex items-center gap-2 px-3 py-2.5">
                <span
                  className={cn(
                    "text-2xs font-semibold uppercase tracking-wider",
                    col.id === "BLOCKED" ? "text-danger" : col.id === "COMPLETED" ? "text-ok" : "text-fg-secondary"
                  )}
                >
                  {col.label}
                </span>
                <span className="rounded-full bg-ink-elevated px-1.5 font-mono text-2xs text-fg-muted">
                  {colTasks.length}
                </span>
              </div>
              <div className="flex-1 space-y-2 px-2 pb-2">
                <AnimatePresence>
                  {colTasks.map((t) => {
                    const assignee = employeeById(t.assigneeId);
                    return (
                      <motion.div
                        key={t.id}
                        layout
                        layoutId={t.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        draggable
                        onDragStart={() => setDragId(t.id)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => openTaskDrawer(t.id)}
                        className={cn(
                          "cursor-grab overflow-hidden rounded-lg border border-line bg-ink-elevated shadow-card transition-shadow hover:border-brand/40 active:cursor-grabbing",
                          dragId === t.id && "rotate-2 border-brand shadow-glow"
                        )}
                        style={{ borderLeftWidth: 3, borderLeftColor: priorityColor(t.priority) }}
                      >
                        <div className="p-2.5">
                          <div className="text-2xs font-medium leading-snug text-fg">
                            {t.title}
                          </div>
                          <div className="mt-2 flex items-center gap-1.5">
                            <PriorityDot priority={t.priority} />
                            <InlineEstimate task={t} />
                            {(t.dependsOn?.length ?? 0) > 0 && (
                              <span className="flex items-center gap-0.5 text-2xs text-fg-faint">
                                <Link2 size={9} />
                                {t.dependsOn?.length}
                              </span>
                            )}
                            <span className="ml-auto flex items-center gap-1 text-2xs text-fg-muted">
                              <CalendarDays size={9} />
                              {fmtDate(t.dueDate)}
                            </span>
                            {assignee && (
                              <EmpAvatar initials={assignee.initials} accent={assignee.accent} size={18} />
                            )}
                          </div>
                          {t.subtasks && (
                            <div className="mt-2">
                              <CapacityBar pct={(t.subtasks.done / t.subtasks.total) * 0.79} height={3} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Linked entities — the organizational graph in context */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-4">
          <div className="label-xs mb-3 flex items-center gap-1.5">
            <ShieldAlert size={11} className="text-warn" /> Linked risks
          </div>
          <div className="space-y-2">
            {linkedRisks.length === 0 && (
              <p className="text-2xs text-fg-muted">No risks linked to this project.</p>
            )}
            {linkedRisks.map((r) => (
              <button key={r.id} onClick={() => launchApp("home")} className="flex w-full items-center gap-3 rounded-lg border border-line bg-ink-elevated p-2.5 transition-colors hover:border-warn/40">
                <SeverityBadge severity={severityOf(r)} />
                <span className="min-w-0 flex-1 truncate text-xs">{r.title}</span>
                <span className="text-2xs text-fg-muted">{r.status.toLowerCase()}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="panel p-4">
          <div className="label-xs mb-3 flex items-center gap-1.5">
            <ScrollText size={11} className="text-brand-secondary" /> Linked decisions
          </div>
          <div className="space-y-2">
            {linkedDecisions.length === 0 && (
              <p className="text-2xs text-fg-muted">No recorded decisions yet.</p>
            )}
            {linkedDecisions.map((d) => (
              <button key={d.id} onClick={() => launchApp("home")} className="block w-full text-left rounded-lg border border-line bg-ink-elevated p-2.5 transition-colors hover:border-brand/40">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-medium">{d.title}</span>
                  <span className="ml-auto rounded-full bg-brand-soft px-2 py-px text-2xs text-brand">{d.status.toLowerCase()}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-2xs text-fg-muted">{d.rationale}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
      </div>
      </div>
      <AnimatePresence>
        {addingTask && (
          <AddTaskPanel projectId={project.id} onClose={() => setAddingTask(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function HeaderStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="text-right">
      <div className="label-xs">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-semibold">{value}</div>
      <div className="text-2xs text-fg-muted">{sub}</div>
    </div>
  );
}
