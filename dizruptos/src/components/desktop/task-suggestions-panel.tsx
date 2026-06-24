"use client";

// Task suggestions — turns "what this project needs" into one-click, skill-matched
// work. It reads a project and finds (1) tasks nobody owns yet, and (2) standard
// build steps the project is missing. Each suggestion names the best-fit person
// (right skills + most room), and approving it creates/assigns the task and
// notifies that person. This is the recommendation → action → assignment loop.

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, Sparkles, UserPlus, X } from "lucide-react";
import { employees, projectById, projects, WEEKS } from "@/lib/data";
import { useOps } from "@/lib/store";
import { isQualified, skillMatchScore } from "@/lib/skills";
import { EmpAvatar } from "@/components/ui/primitives";
import { cn, fmtPct } from "@/lib/utils";
import type { Employee, Task, TaskPriority } from "@/lib/types";

// Standard build steps every product project tends to need. If a project has no
// task carrying the label, we suggest adding it.
const BUILD_STEPS: { label: string; title: string; hours: number; priority: TaskPriority }[] = [
  { label: "design", title: "Design the screens", hours: 8, priority: "MEDIUM" },
  { label: "frontend", title: "Build the screens", hours: 12, priority: "HIGH" },
  { label: "backend", title: "Build the API", hours: 12, priority: "HIGH" },
  { label: "database", title: "Set up the database", hours: 8, priority: "MEDIUM" },
  { label: "testing", title: "Write tests for the main features", hours: 8, priority: "MEDIUM" },
];

export function TaskSuggestionsPanel({ scopeProjectId, onClose }: { scopeProjectId: string | "all"; onClose: () => void }) {
  const tasks = useOps((s) => s.tasks);
  const utilization = useOps((s) => s.utilization);
  const requestReallocate = useOps((s) => s.requestReallocate);
  const addTask = useOps((s) => s.addTask);
  const [done, setDone] = React.useState<Set<string>>(new Set());

  // Which projects to advise on: the selected one, or the ones that need help.
  const scopeProjects = scopeProjectId === "all"
    ? projects.filter((p) => p.health === "AT_RISK" || p.health === "DELAYED" || p.status === "PLANNING")
    : projects.filter((p) => p.id === scopeProjectId);
  const scopeIds = new Set(scopeProjects.map((p) => p.id));

  // Best-fit person for a given skill label: qualified, then most spare capacity.
  function bestFit(labels: string[]): { emp: Employee; load: number } | null {
    const t = { labels } as Pick<Task, "labels">;
    const ranked = employees
      .filter((e) => e.role !== "client" && e.role !== "executive")
      .map((e) => ({ emp: e, qualified: isQualified(e, t), score: skillMatchScore(e, t), load: utilization(e.id, WEEKS[1]) }))
      .filter((c) => c.qualified)
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.load - b.load));
    return ranked[0] ? { emp: ranked[0].emp, load: ranked[0].load } : null;
  }

  // (1) Existing tasks with no owner — suggest assigning to the best-fit person.
  const unstaffed = tasks
    .filter((t) => !t.assigneeId && t.status !== "COMPLETED" && scopeIds.has(t.projectId))
    .map((t) => ({ task: t, fit: bestFit(t.labels) }))
    .filter((s) => s.fit);

  // (2) Standard build steps a project is missing — suggest adding the task.
  const newSteps = scopeProjects.flatMap((p) => {
    const labelsPresent = new Set(tasks.filter((t) => t.projectId === p.id).flatMap((t) => t.labels));
    return BUILD_STEPS
      .filter((step) => !labelsPresent.has(step.label))
      .map((step) => ({ project: p, step, fit: bestFit([step.label]) }))
      .filter((s) => s.fit);
  });

  function assignExisting(taskId: string, empId: string, key: string) {
    requestReallocate(taskId, empId);
    setDone((d) => new Set(d).add(key));
  }
  function addAndAssign(projectId: string, title: string, label: string, hours: number, priority: TaskPriority, empId: string, key: string) {
    addTask({ title, projectId, assigneeId: empId, estimatedHours: hours, dueDate: isoIn(10), priority, status: "TO_DO", weekStart: WEEKS[1], });
    setDone((d) => new Set(d).add(key));
  }

  const nothing = unstaffed.length === 0 && newSteps.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-[120] flex justify-end bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-[400px] max-w-[90vw] flex-col border-l border-line bg-ink-surface shadow-2xl"
      >
        <div className="flex items-center gap-2.5 border-b border-line p-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#7C6CFF22", border: "1px solid #7C6CFF44" }}>
            <Sparkles size={15} style={{ color: "#7C6CFF" }} />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Suggested next steps</div>
            <div className="text-2xs text-fg-muted">
              {scopeProjectId === "all" ? "Projects that need attention" : projectById(scopeProjectId)?.name}
            </div>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full bg-ink-elevated text-fg-muted hover:text-fg"><X size={13} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-5">
          {nothing && (
            <div className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-fg-muted">
              Nothing to suggest — every task in scope has an owner and the standard steps exist.
            </div>
          )}

          {/* Unstaffed existing work */}
          {unstaffed.length > 0 && (
            <div>
              <div className="mb-2 text-2xs font-semibold uppercase tracking-wider text-warn">Tasks with no owner ({unstaffed.length})</div>
              <div className="space-y-1.5">
                {unstaffed.map(({ task, fit }) => {
                  const key = `assign-${task.id}`;
                  const proj = projectById(task.projectId);
                  return (
                    <SuggestionRow
                      key={key} done={done.has(key)}
                      title={task.title} sub={`${proj?.code} · ${task.estimatedHours}h`}
                      fit={fit!} actionLabel="Assign" actionIcon={UserPlus}
                      onAct={() => assignExisting(task.id, fit!.emp.id, key)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggested new build steps */}
          {newSteps.length > 0 && (
            <div>
              <div className="mb-2 text-2xs font-semibold uppercase tracking-wider text-brand">Suggested new tasks ({newSteps.length})</div>
              <div className="space-y-1.5">
                {newSteps.map(({ project, step, fit }) => {
                  const key = `new-${project.id}-${step.label}`;
                  return (
                    <SuggestionRow
                      key={key} done={done.has(key)}
                      title={step.title} sub={`${project.code} · ${step.hours}h · ${step.label}`}
                      fit={fit!} actionLabel="Add & assign" actionIcon={Plus}
                      onAct={() => addAndAssign(project.id, step.title, step.label, step.hours, step.priority, fit!.emp.id, key)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-line p-3 text-2xs text-fg-muted">
          Each suggestion is matched to the person with the right skills and the most room. Approving notifies them.
        </div>
      </motion.aside>
    </motion.div>
  );
}

function SuggestionRow({
  title, sub, fit, actionLabel, actionIcon: ActionIcon, onAct, done,
}: {
  title: string; sub: string; fit: { emp: Employee; load: number };
  actionLabel: string; actionIcon: React.ElementType; onAct: () => void; done: boolean;
}) {
  return (
    <div className={cn("rounded-lg border bg-ink-elevated/60 p-2.5 transition-opacity", done ? "border-ok/40 opacity-60" : "border-line")}>
      <div className="text-xs font-medium text-fg">{title}</div>
      <div className="mt-0.5 text-2xs text-fg-muted">{sub}</div>
      <div className="mt-2 flex items-center gap-2">
        <EmpAvatar initials={fit.emp.initials} accent={fit.emp.accent} size={22} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-2xs font-medium text-fg">{fit.emp.name}</div>
          <div className="text-[10px] text-fg-muted">best fit · {fmtPct(fit.load)} loaded</div>
        </div>
        {done ? (
          <span className="rounded-md bg-ok/15 px-2 py-1 text-2xs font-semibold text-ok">Done</span>
        ) : (
          <button
            onClick={onAct}
            className="flex items-center gap-1 rounded-md bg-brand/15 px-2 py-1 text-2xs font-semibold text-brand transition-colors hover:bg-brand/25"
          >
            <ActionIcon size={11} /> {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function isoIn(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}
