"use client";

// Right-side contextual drawer (420px, slides over content) — task deep detail
// with reassignment that reuses the same atomic reallocation path.

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightLeft,
  CalendarDays,
  Clock,
  GitBranch,
  Tag,
  X,
} from "lucide-react";
import Link from "next/link";
import { useOps } from "@/lib/store";
import { useSession } from "@/lib/session";
import { rankCandidates } from "@/lib/ai";
import { employeeById, employees, projectById, WEEKS } from "@/lib/data";
import {
  Button,
  CapacityBar,
  EmpAvatar,
  PriorityDot,
  TaskStatusPill,
} from "@/components/ui/primitives";
import { fmtDate, fmtPct, utilizationTone, cn } from "@/lib/utils";

export function TaskDrawer() {
  const drawerTaskId = useOps((s) => s.drawerTaskId);
  const openTaskDrawer = useOps((s) => s.openTaskDrawer);
  const tasks = useOps((s) => s.tasks);
  const utilization = useOps((s) => s.utilization);
  const requestReallocate = useOps((s) => s.requestReallocate);
  const canReallocate = useSession((s) => s.can("reallocate"));

  const task = tasks.find((t) => t.id === drawerTaskId);
  const assignee = employeeById(task?.assigneeId);
  const project = projectById(task?.projectId);
  // Task dependencies: what this task waits on, and what waits on it.
  const blockedBy = task ? (task.dependsOn ?? []).map((id) => tasks.find((t) => t.id === id)).filter(Boolean) as typeof tasks : [];
  const blocking = task ? tasks.filter((t) => (t.dependsOn ?? []).includes(task.id)) : [];

  // Smart staffing shortlist (§6.5) — shared ranking with the Allocation
  // Agent: skill match 45% + availability 55%, hard-capped by capacity.
  const candidates = React.useMemo(() => {
    if (!task) return [];
    const pool = employees.filter(
      (e) => e.role !== "client" && e.role !== "executive"
    );
    return rankCandidates(task, pool, (id) => utilization(id, task.weekStart))
      .slice(0, 4)
      .map(({ employee, projected, skillMatch }) => ({
        emp: employee,
        pct: utilization(employee.id, task.weekStart),
        projected,
        skillMatch,
      }));
  }, [task, utilization]);

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => openTaskDrawer(null)}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: 440 }}
            animate={{ x: 0 }}
            exit={{ x: 440 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="fixed inset-y-0 right-0 z-40 flex w-[420px] flex-col border-l border-line bg-ink-surface shadow-pop"
          >
            <div className="flex items-start gap-3 border-b border-line-subtle p-5">
              <PriorityDot priority={task.priority} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-semibold leading-snug">
                  {task.title}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <TaskStatusPill status={task.status} />
                  {project && (
                    <button
                      onClick={() => { openTaskDrawer(null); window.dispatchEvent(new CustomEvent("dizrupt:launch", { detail: { id: "matrix" } })); }}
                      className="rounded bg-ink-elevated px-1.5 py-px font-mono text-2xs text-fg-muted hover:text-brand"
                    >
                      {project.code} · {project.name}
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => openTaskDrawer(null)}
                className="rounded-lg p-1.5 text-fg-muted hover:bg-ink-elevated hover:text-fg"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* Facts grid */}
              <div className="grid grid-cols-2 gap-3">
                <Fact icon={CalendarDays} label="Due" value={fmtDate(task.dueDate)} />
                <Fact icon={Clock} label="Estimate" value={`${task.estimatedHours}h · ${task.loggedHours}h logged`} />
                <Fact icon={CalendarDays} label="Capacity week" value={`Wk of ${fmtDate(task.weekStart)}`} />
                <Fact
                  icon={GitBranch}
                  label="Dependencies"
                  value={task.dependsOn.length ? `${task.dependsOn.length} upstream` : "None"}
                />
              </div>

              {task.labels.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag size={12} className="text-fg-muted" />
                  {task.labels.map((l) => (
                    <span key={l} className="rounded-full border border-line bg-ink-elevated px-2 py-px text-2xs text-fg-secondary">
                      {l}
                    </span>
                  ))}
                </div>
              )}

              {/* Dependencies — who you're waiting on, and who's waiting on you */}
              {(blockedBy.length > 0 || blocking.length > 0) && (
                <div className="space-y-2">
                  {blockedBy.length > 0 && (
                    <div className="rounded-card border border-danger/25 bg-danger/[0.05] p-2.5">
                      <div className="label-xs mb-1 flex items-center gap-1.5 text-danger">⛔ Blocked by</div>
                      {blockedBy.map((b) => (
                        <div key={b.id} className="flex items-center gap-1.5 text-2xs text-fg-secondary">
                          <span className="truncate">{b.title}</span>
                          {b.assigneeId && <span className="text-fg-muted">· {employeeById(b.assigneeId)?.name.split(" ")[0]}</span>}
                          <span className="ml-auto shrink-0 text-fg-faint">{b.status.replace("_", " ").toLowerCase()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {blocking.length > 0 && (
                    <div className="rounded-card border border-warn/25 bg-warn/[0.05] p-2.5">
                      <div className="label-xs mb-1 flex items-center gap-1.5 text-warn">🔓 Blocking</div>
                      {blocking.map((b) => (
                        <div key={b.id} className="flex items-center gap-1.5 text-2xs text-fg-secondary">
                          <span className="truncate">{b.title}</span>
                          {b.assigneeId && <span className="text-fg-muted">· {employeeById(b.assigneeId)?.name.split(" ")[0]} is waiting</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Current assignee */}
              <div>
                <div className="label-xs mb-2">Assignee</div>
                {assignee ? (
                  <div className="panel flex items-center gap-3 p-3">
                    <EmpAvatar initials={assignee.initials} accent={assignee.accent} size={34} />
                    <div className="min-w-0 flex-1">
                      <button onClick={() => { openTaskDrawer(null); window.dispatchEvent(new CustomEvent("dizrupt:launch", { detail: { id: "r-capacity" } })); }} className="text-left text-xs font-semibold hover:text-brand">
                        {assignee.name}
                      </button>
                      <div className="text-2xs text-fg-muted">{assignee.title}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <CapacityBar pct={utilization(assignee.id, task.weekStart)} className="flex-1" height={5} />
                        <span
                          className={cn(
                            "font-mono text-2xs font-semibold",
                            `text-${utilizationTone(utilization(assignee.id, task.weekStart))}`
                          )}
                        >
                          {fmtPct(utilization(assignee.id, task.weekStart))}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-card border border-dashed border-line p-3 text-center text-2xs text-fg-muted">
                    Unassigned — route below
                  </div>
                )}
              </div>

              {/* Two-click reassignment — manager-only (RBAC: reallocate) */}
              {!canReallocate ? (
                <div className="rounded-card border border-line bg-ink-elevated p-3 text-2xs text-fg-muted">
                  <span className="flex items-center gap-1.5 font-medium text-fg-secondary"><ArrowRightLeft size={11} /> Reassignment is manager-only</span>
                  <p className="mt-1 leading-relaxed">Your role can update your own tasks but can&rsquo;t reassign work to other people. Ask a manager or resource planner to reassign.</p>
                </div>
              ) : (
              <div>
                <div className="label-xs mb-2 flex items-center gap-1.5">
                  <ArrowRightLeft size={11} />
                  Reassign — ranked by projected load
                </div>
                <div className="space-y-1.5">
                  {candidates.map(({ emp, pct, projected, skillMatch }) => (
                    <button
                      key={emp.id}
                      onClick={() => requestReallocate(task.id, emp.id)}
                      className="group flex w-full items-center gap-3 rounded-card border border-line bg-ink-elevated p-2.5 text-left transition-all hover:border-brand/40 hover:shadow-card-hover"
                    >
                      <EmpAvatar initials={emp.initials} accent={emp.accent} size={28} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium">{emp.name}</div>
                        <div className="flex items-center gap-1.5 text-2xs text-fg-muted">
                          <span className="truncate">{emp.title}</span>
                          {skillMatch > 0.5 && (
                            <span className="shrink-0 rounded bg-brand-soft px-1 font-mono text-brand">
                              match {skillMatch.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-2xs text-fg-secondary">
                          {fmtPct(pct)} →{" "}
                          <span className={projected >= 1 ? "text-danger font-semibold" : "text-ok font-semibold"}>
                            {fmtPct(projected)}
                          </span>
                        </div>
                        <div className="text-2xs text-fg-faint group-hover:text-brand">
                          {projected >= 1 ? "needs override" : "click to assign"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              )}
            </div>

            {canReallocate && (
              <div className="border-t border-line-subtle p-4 text-2xs text-fg-muted">
                Reassignments are optimistic (&lt;50ms) and confirmed atomically.
                Conflicts roll back with a refresh prompt.
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-card border border-line bg-ink-elevated p-2.5">
      <div className="label-xs flex items-center gap-1.5">
        <Icon size={10} />
        {label}
      </div>
      <div className="mt-1 text-xs font-medium text-fg">{value}</div>
    </div>
  );
}
