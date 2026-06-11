"use client";

// Project detail: health explanation panel + premium Kanban with drag between
// columns (optimistic, motion-continuous), linked risks and decisions.

import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Link2, ShieldAlert, ScrollText, Sparkles } from "lucide-react";
import { useOps } from "@/lib/store";
import { severityOf } from "@/lib/risk";
import {
  decisions,
  employeeById,
  projectById,
  risks,
} from "@/lib/data";
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
  { id: "BLOCKED", label: "Blocked" },
  { id: "COMPLETED", label: "Done" },
];

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const project = projectById(params.id);
  const tasks = useOps((s) => s.tasks);
  const moveTaskStatus = useOps((s) => s.moveTaskStatus);
  const openTaskDrawer = useOps((s) => s.openTaskDrawer);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overCol, setOverCol] = React.useState<TaskStatus | null>(null);

  if (!project) return notFound();
  const owner = employeeById(project.ownerId);
  const projTasks = tasks.filter((t) => t.projectId === project.id);
  const linkedRisks = risks.filter((r) => r.projectId === project.id);
  const linkedDecisions = decisions.filter((d) => d.projectId === project.id);

  return (
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
                            <span className="font-mono text-2xs text-fg-muted">
                              {t.estimatedHours}h
                            </span>
                            {t.dependsOn.length > 0 && (
                              <span className="flex items-center gap-0.5 text-2xs text-fg-faint">
                                <Link2 size={9} />
                                {t.dependsOn.length}
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
              <Link key={r.id} href="/risks" className="flex items-center gap-3 rounded-lg border border-line bg-ink-elevated p-2.5 transition-colors hover:border-warn/40">
                <SeverityBadge severity={severityOf(r)} />
                <span className="min-w-0 flex-1 truncate text-xs">{r.title}</span>
                <span className="text-2xs text-fg-muted">{r.status.toLowerCase()}</span>
              </Link>
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
              <Link key={d.id} href="/decisions" className="block rounded-lg border border-line bg-ink-elevated p-2.5 transition-colors hover:border-brand/40">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-medium">{d.title}</span>
                  <span className="ml-auto rounded-full bg-brand-soft px-2 py-px text-2xs text-brand">{d.status.toLowerCase()}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-2xs text-fg-muted">{d.rationale}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
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
