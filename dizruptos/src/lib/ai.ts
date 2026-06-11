// AI infrastructure — the deterministic layer beneath the models.
//
// Doctrine: LLMs are the last step, not the first. Context is compressed to
// numeric vectors before any model call (≤1k tokens), recommendations are
// validated against hard constraints before surfacing AND re-validated at
// decision time, and explanations are assembled from stored causal signals —
// never regenerated free-text. Everything in this file runs without an API key.

import type { CapacityCell, Employee, Project, Proposal, Task } from "./types";

/* ----------------------- context compression (PRD §11.6) ------------------- */
// Raw entity dumps never reach a model. A sprint/project context compresses to
// seven floats + one bool; 90%+ of agent calls stay under 1,000 tokens.

export interface CompressedContext {
  velocity_ratio: number; // current vs rolling-3 average
  completion_pct: number;
  overdue_pct: number;
  critical_path_blocked: boolean;
  team_max_utilization: number;
  budget_burn_ratio: number;
  days_ratio: number; // remaining ÷ total
  approx_tokens: number; // serialized size estimate for cost governance
}

export function compressProjectContext(
  project: Project,
  tasks: Task[],
  utilizationOf: (employeeId: string) => number,
  today: string
): CompressedContext {
  const projTasks = tasks.filter((t) => t.projectId === project.id);
  const total = projTasks.length || 1;
  const completed = projTasks.filter((t) => t.status === "COMPLETED").length;
  const overdue = projTasks.filter(
    (t) => t.status !== "COMPLETED" && t.dueDate < today
  ).length;

  const v = project.velocityTrend;
  const rolling3 =
    v.length >= 4 ? (v[v.length - 4] + v[v.length - 3] + v[v.length - 2]) / 3 : v[0] || 1;
  const current = v[v.length - 1] ?? 0;

  const assignees = Array.from(
    new Set(projTasks.map((t) => t.assigneeId).filter(Boolean))
  ) as string[];
  const teamMax = assignees.reduce((m, id) => Math.max(m, utilizationOf(id)), 0);

  const start = Date.parse(project.startDate);
  const target = Date.parse(project.targetDate);
  const now = Date.parse(today);
  const daysRatio =
    target > start ? Math.max(0, (target - now) / (target - start)) : 0;

  const ctx = {
    velocity_ratio: rolling3 > 0 ? current / rolling3 : 0,
    completion_pct: completed / total,
    overdue_pct: overdue / total,
    critical_path_blocked: projTasks.some(
      (t) => t.status === "BLOCKED" && (t.priority === "URGENT" || t.priority === "HIGH")
    ),
    team_max_utilization: teamMax,
    budget_burn_ratio:
      project.budgetHours > 0 ? project.consumedHours / project.budgetHours : 0,
    days_ratio: daysRatio,
  };
  // ~4 chars/token heuristic on the serialized payload.
  const approx_tokens = Math.ceil(JSON.stringify(ctx).length / 4);
  return { ...ctx, approx_tokens };
}

/* ------------------- proposal validation engine (law 12) ------------------- */
// Every agent recommendation is checked against hard constraints before it is
// shown — and AGAIN at decision time, because the world moves while a proposal
// sits in the inbox. A proposal that validated at creation can be stale at
// approval; execution must refuse it.

export interface ValidationContext {
  tasks: Task[];
  employees: Employee[];
  allocated: (employeeId: string, weekStart: string) => number;
}

export interface ValidationResult {
  valid: boolean;
  checks: { check: string; pass: boolean }[];
}

export function validateProposal(
  proposal: Proposal,
  ctx: ValidationContext
): ValidationResult {
  const checks: { check: string; pass: boolean }[] = [];
  const { action } = proposal;

  if (action.kind === "reallocate" && action.taskId && action.toEmployeeId) {
    const task = ctx.tasks.find((t) => t.id === action.taskId);
    const target = ctx.employees.find((e) => e.id === action.toEmployeeId);

    if (!task || !target) {
      checks.push({ check: "Task and target employee still exist", pass: false });
      return { valid: false, checks };
    }
    checks.push({ check: "Task and target employee still exist", pass: true });

    // Capacity hard cap — projected utilization stays under 100%.
    const projected =
      (ctx.allocated(target.id, task.weekStart) + task.estimatedHours) /
      target.capacityHoursPerWeek;
    checks.push({
      check: `Target under 100% after move (projected ${(projected * 100).toFixed(0)}%)`,
      pass: projected < 1,
    });

    // PTO hard block — assignment over leave is impossible (PRD §3.4).
    const weekEnd = addDays(task.weekStart, 7);
    const ptoConflict = target.ptoDays.some(
      (d) => d >= task.weekStart && d < weekEnd
    );
    checks.push({ check: "No PTO block in target week", pass: !ptoConflict });

    // Dependency lock — blocked upstream work can't be force-staffed.
    const upstreamBlocked = task.dependsOn.some((id) => {
      const dep = ctx.tasks.find((t) => t.id === id);
      return dep && dep.status === "BLOCKED";
    });
    checks.push({ check: "No blocked upstream dependency", pass: !upstreamBlocked });

    // Already-assigned no-op guard.
    checks.push({
      check: "Move changes the assignee",
      pass: task.assigneeId !== target.id,
    });
  } else {
    // Non-reallocation actions (escalate, reduce_load, shift_deadline) carry
    // no hard capacity constraints; they are advisory by construction.
    checks.push({ check: "Advisory action — no hard constraints", pass: true });
  }

  return { valid: checks.every((c) => c.pass), checks };
}

/* ----------------- explanation assembly (PRD §23.4 pattern) ---------------- */
// Explanations read stored causal signals: instantaneous, deterministic,
// auditable. The model is only consulted to PROPOSE signals, never to render
// the explanation a manager acts on.

export function buildExplanation(
  signals: { description: string; confidence: number }[]
): string {
  if (signals.length === 0) return "Insufficient data";
  return signals
    .filter((s) => s.confidence >= 0.65) // below threshold: suppressed (PRD §15.5)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
    .map((s) => `${s.description} (${Math.round(s.confidence * 100)}%)`)
    .join(" · ");
}

/* -------------------- expert discovery / staffing ranking ------------------ */
// Smart staffing (PRD §6.5): rank candidates by skill match × availability.
// Pure function — the Allocation Agent and the TaskDrawer shortlist share it.

export function rankCandidates(
  task: Task,
  candidates: Employee[],
  utilizationOf: (employeeId: string) => number
): { employee: Employee; skillMatch: number; projected: number; score: number }[] {
  const wanted = new Set(task.labels.map((l) => l.toLowerCase()));

  return candidates
    .filter((e) => e.id !== task.assigneeId)
    .map((employee) => {
      const skills = employee.skills.map((s) => s.toLowerCase());
      const hits = skills.filter((s) =>
        Array.from(wanted).some((w) => s.includes(w) || w.includes(s))
      ).length;
      const skillMatch = wanted.size === 0 ? 0.5 : Math.min(1, hits / wanted.size);

      const projected =
        utilizationOf(employee.id) +
        task.estimatedHours / employee.capacityHoursPerWeek;

      // Availability dominates slightly: an expert at 110% is not a candidate.
      const availability = Math.max(0, 1 - projected);
      const score = skillMatch * 0.45 + availability * 0.55;
      return { employee, skillMatch, projected, score };
    })
    .sort((a, b) => b.score - a.score);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
