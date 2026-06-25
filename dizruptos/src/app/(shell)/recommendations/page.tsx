"use client";

// Recommendations — "what should we do next?" in plain language, grounded in the
// live seed. Three things a manager actually acts on: relieve overloaded people,
// staff work nobody owns, and add the next build steps a project is missing.
// Every suggestion names the best-fit person (right skills + most room) and why.
// Acting happens in the Project Matrix (the live native surface) via the button.

import * as React from "react";
import { ArrowRightLeft, Flame, Sparkles, UserPlus, KanbanSquare } from "lucide-react";
import { employees, projectById, WEEKS } from "@/lib/data";
import { useOps, useLiveProjects } from "@/lib/store";
import { isQualified, skillMatchScore } from "@/lib/skills";
import { EmpAvatar } from "@/components/ui/primitives";
import { cn, fmtPct } from "@/lib/utils";
import type { Employee, Task } from "@/lib/types";

const BUILD_STEPS: { label: string; title: string }[] = [
  { label: "design", title: "Design the screens" },
  { label: "frontend", title: "Build the screens" },
  { label: "backend", title: "Build the API" },
  { label: "database", title: "Set up the database" },
  { label: "testing", title: "Write tests for the main features" },
];

function launchMatrix() {
  const evt = new CustomEvent("dizrupt:launch", { detail: { id: "matrix" } });
  window.dispatchEvent(evt);
  window.parent?.dispatchEvent(evt);
}

export default function RecommendationsPage() {
  const tasks = useOps((s) => s.tasks);
  const utilization = useOps((s) => s.utilization);
  const projects = useLiveProjects(); // includes session-created projects
  const week = WEEKS[0];

  // Best-fit recipient for a set of skills: qualified, then most spare capacity.
  const bestFit = React.useCallback((labels: string[], excludeId?: string): { emp: Employee; load: number } | null => {
    const t = { labels } as Pick<Task, "labels">;
    const ranked = employees
      .filter((e) => e.role !== "client" && e.role !== "executive" && e.id !== excludeId)
      .map((e) => ({ emp: e, qualified: isQualified(e, t), score: skillMatchScore(e, t), load: utilization(e.id, week) }))
      .filter((c) => c.qualified)
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.load - b.load));
    return ranked[0] ? { emp: ranked[0].emp, load: ranked[0].load } : null;
  }, [utilization, week]);

  // 1) Relieve overload — for each person over 100%, move one movable task to a fit.
  const overloadRecs = employees
    .filter((e) => utilization(e.id, week) >= 1)
    .map((e) => {
      const movable = tasks
        .filter((t) => t.assigneeId === e.id && t.status !== "COMPLETED" && t.status !== "BLOCKED")
        .sort((a, b) => a.estimatedHours - b.estimatedHours)[0];
      if (!movable) return null;
      const fit = bestFit(movable.labels, e.id);
      if (!fit) return null;
      return { person: e, task: movable, fit, load: utilization(e.id, week) };
    })
    .filter(Boolean) as { person: Employee; task: Task; fit: { emp: Employee; load: number }; load: number }[];

  // 2) Staff unowned work — unassigned tasks → best fit.
  const unstaffed = tasks
    .filter((t) => !t.assigneeId && t.status !== "COMPLETED")
    .map((t) => ({ task: t, fit: bestFit(t.labels) }))
    .filter((s) => s.fit) as { task: Task; fit: { emp: Employee; load: number } }[];

  // 3) Suggested next steps — standard build steps a project is missing. A
  // project qualifies if it needs attention (at-risk/delayed/planning) OR it's
  // just getting started (few tasks) — so a NEW project added as admin
  // immediately gets a recommended plan of what to build.
  const taskCountByProject = (id: string) => tasks.filter((t) => t.projectId === id).length;
  const needy = projects.filter(
    (p) => p.status !== "COMPLETED" && p.status !== "CANCELLED" &&
      (p.health === "AT_RISK" || p.health === "DELAYED" || p.status === "PLANNING" || taskCountByProject(p.id) < 3)
  );
  const nextSteps = needy.flatMap((p) => {
    const present = new Set(tasks.filter((t) => t.projectId === p.id).flatMap((t) => t.labels));
    return BUILD_STEPS
      .filter((s) => !present.has(s.label))
      .map((s) => ({ project: p, step: s, fit: bestFit([s.label]) }))
      .filter((s) => s.fit) as { project: typeof projects[number]; step: { label: string; title: string }; fit: { emp: Employee; load: number } }[];
  });

  const total = overloadRecs.length + unstaffed.length + nextSteps.length;

  return (
    <div className="space-y-6">
      <header className="panel p-6">
        <div className="label-xs">Recommendations</div>
        <h1 className="font-display text-2xl font-bold tracking-tight">What to do next</h1>
        <p className="mt-1 max-w-xl text-sm text-fg-muted">
          {total} suggestions from the live plan — who&apos;s overloaded, what work has no owner, and the next steps each
          project needs. Each one is matched to the person with the right skills and the most room.
        </p>
      </header>

      {total === 0 && (
        <div className="panel p-8 text-center text-sm text-fg-muted">Nothing to recommend right now — load is balanced and every task has an owner.</div>
      )}

      {/* Relieve overload */}
      {overloadRecs.length > 0 && (
        <Section title="Relieve overloaded people" icon={Flame} tone="#EF4444" hint="These people are over 100% this week.">
          {overloadRecs.map(({ person, task, fit, load }) => (
            <RecRow
              key={`ov-${task.id}`}
              title={`Move “${task.title}” off ${person.name.split(" ")[0]}`}
              reason={`${person.name} is at ${fmtPct(load)}. ${fit.emp.name} has the right skills and is at ${fmtPct(fit.load)}.`}
              fit={fit} icon={ArrowRightLeft}
            />
          ))}
        </Section>
      )}

      {/* Staff unowned work */}
      {unstaffed.length > 0 && (
        <Section title="Staff work with no owner" icon={UserPlus} tone="#F59E0B" hint="Tasks nobody is assigned to yet.">
          {unstaffed.map(({ task, fit }) => {
            const p = projectById(task.projectId);
            return (
              <RecRow
                key={`un-${task.id}`}
                title={`Assign “${task.title}”`}
                reason={`${p?.name} · ${task.estimatedHours}h. Best fit: ${fit.emp.name} (${fit.emp.title}), at ${fmtPct(fit.load)}.`}
                fit={fit} icon={UserPlus}
              />
            );
          })}
        </Section>
      )}

      {/* Suggested next steps */}
      {nextSteps.length > 0 && (
        <Section title="Suggested next steps" icon={Sparkles} tone="#7C6CFF" hint="Standard build steps these projects are missing.">
          {nextSteps.map(({ project, step, fit }) => (
            <RecRow
              key={`ns-${project.id}-${step.label}`}
              title={`Add “${step.title}” to ${project.name}`}
              reason={`This project has no ${step.label} task yet. Best fit: ${fit.emp.name}, at ${fmtPct(fit.load)}.`}
              fit={fit} icon={Sparkles}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, tone, hint, children }: { title: string; icon: React.ElementType; tone: string; hint: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${tone}22`, border: `1px solid ${tone}44` }}>
          <Icon size={14} style={{ color: tone }} />
        </span>
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
        <span className="text-2xs text-fg-muted">· {hint}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function RecRow({ title, reason, fit, icon: Icon }: { title: string; reason: string; fit: { emp: Employee; load: number }; icon: React.ElementType }) {
  return (
    <div className="panel flex flex-wrap items-center gap-3 p-4">
      <Icon size={15} className="shrink-0 text-fg-muted" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-0.5 text-xs text-fg-muted">{reason}</div>
      </div>
      <div className="flex items-center gap-2">
        <EmpAvatar initials={fit.emp.initials} accent={fit.emp.accent} size={26} />
        <div className="text-right">
          <div className="text-2xs font-medium text-fg">{fit.emp.name.split(" ")[0]}</div>
          <div className={cn("text-[10px]", fit.load >= 1 ? "text-danger" : fit.load >= 0.8 ? "text-warn" : "text-ok")}>{fmtPct(fit.load)} loaded</div>
        </div>
      </div>
      <button
        onClick={launchMatrix}
        className="flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/20"
      >
        <KanbanSquare size={12} /> Apply in Matrix
      </button>
    </div>
  );
}
