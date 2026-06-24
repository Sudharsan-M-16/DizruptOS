"use client";

// The wedge: employees × weeks capacity matrix. Drag a task chip from a red
// row onto a green row — optimistic update, guardrail at ≥100%, audit on confirm.

import * as React from "react";
import { motion } from "framer-motion";
import { GripVertical, Info, Plane } from "lucide-react";
import { useOps } from "@/lib/store";
import { useSession } from "@/lib/session";
import { departments, employees, projectById, WEEKS } from "@/lib/data";
import {
  CapacityBar,
  EmpAvatar,
  Explain,
  PriorityDot,
} from "@/components/ui/primitives";
import { NumberTicker } from "@/components/ui/ascension";
import { Gauge } from "lucide-react";
import { cn, fmtDate, fmtPct, utilizationTone } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { CapacityPersonSidebar } from "@/components/desktop/capacity-person-sidebar";

const UNDERLOADED = 0.6; // below 60% = has room for more work

export default function CapacityPage() {
  const tasks = useOps((s) => s.tasks);
  const utilization = useOps((s) => s.utilization);
  const allocated = useOps((s) => s.allocated);
  const requestReallocate = useOps((s) => s.requestReallocate);
  const openTaskDrawer = useOps((s) => s.openTaskDrawer);

  const canSeeBurnout = useSession((s) => s.can("view_burnout"));
  const [deptFilter, setDeptFilter] = React.useState<string>("all");
  const [dragTaskId, setDragTaskId] = React.useState<string | null>(null);
  const [dropTarget, setDropTarget] = React.useState<string | null>(null);
  const [selectedEmpId, setSelectedEmpId] = React.useState<string | null>(null);

  const visible = employees.filter(
    (e) =>
      e.role !== "client" &&
      e.role !== "executive" &&
      (deptFilter === "all" || e.departmentId === deptFilter)
  );

  const dragTask = tasks.find((t) => t.id === dragTaskId);

  // Org-load summary for the visible slice — the heatmap's own headline.
  const nowPcts = visible.map((e) => utilization(e.id, WEEKS[0]));
  const avgLoad = nowPcts.reduce((s, p) => s + p, 0) / Math.max(1, nowPcts.length);
  const redCount = nowPcts.filter((p) => p >= 1).length;
  const warnCount = nowPcts.filter((p) => p >= 0.8 && p < 1).length;
  const freeCount = nowPcts.filter((p) => p < UNDERLOADED).length;

  return (
    <div className="relative flex h-full flex-col">
      {/* OS page header */}
      <div className="flex items-center gap-3 border-b border-line bg-ink-elevated/50 px-5 py-3.5 shrink-0">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#F9731622", border: "1px solid #F9731644" }}>
          <Gauge size={15} style={{ color: "#F97316" }} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Capacity Matrix</div>
          <div className="text-[11px] text-fg-muted">{visible.length} people · drag tasks to reallocate</div>
        </div>
      </div>
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Org-load strip */}
      <div className="panel flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <NumberTicker
            value={Math.round(avgLoad * 100)}
            suffix="%"
            className="font-display text-xl font-semibold"
          />
          <span className="text-xs text-fg-muted">avg load · this week</span>
        </div>
        <CapacityBar pct={avgLoad} className="w-44" />
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-danger">
            <span className="h-1.5 w-1.5 rounded-full bg-danger" />
            {redCount} overloaded
          </span>
          <span className="flex items-center gap-1.5 font-medium text-warn">
            <span className="h-1.5 w-1.5 rounded-full bg-warn" />
            {warnCount} near limit
          </span>
          <span className="flex items-center gap-1.5 font-medium text-ok">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            {visible.length - redCount - warnCount} healthy
          </span>
          <span className="flex items-center gap-1.5 font-medium text-info">
            <span className="h-1.5 w-1.5 rounded-full bg-info" />
            {freeCount} free for work
          </span>
        </div>
        <span className="ml-auto hidden text-xs text-fg-muted md:block">
          Click a person to see their work and move tasks
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {[{ id: "all", name: "All departments" }, ...departments].map((d) => (
          <button
            key={d.id}
            onClick={() => setDeptFilter(d.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              deptFilter === d.id
                ? "border-brand/50 bg-brand-soft text-fg"
                : "border-line bg-ink-surface text-fg-secondary hover:border-brand/30"
            )}
          >
            {d.name}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-4 text-xs text-fg-muted">
          <Legend tone="bg-ok" label="< 80%" />
          <Legend tone="bg-warn" label="80–99%" />
          <Legend tone="bg-danger" label="≥ 100%" />
          <span className="hidden items-center gap-1 lg:flex">
            <Info size={11} /> drag task chips between rows
          </span>
        </div>
      </div>

      {/* Matrix — scrolls horizontally below 1080px; density never collapses */}
      <div className="panel overflow-x-auto">
       <div className="min-w-[1080px]">
        {/* Week header */}
        <div className="grid grid-cols-[220px_1fr] border-b border-line-subtle bg-ink-elevated/40">
          <div className="label-xs px-4 py-2.5">Employee · this week</div>
          <div className="grid grid-cols-6">
            {WEEKS.map((w, i) => (
              <div
                key={w}
                className={cn(
                  "label-xs border-l border-line-subtle px-2 py-2.5 text-center",
                  i === 0 && "text-brand"
                )}
              >
                {fmtDate(w)}
                {i === 0 && " · now"}
              </div>
            ))}
          </div>
        </div>

        {visible.map((emp) => {
          const thisWeek = utilization(emp.id, WEEKS[0]);
          const empTasks = tasks.filter(
            (t) =>
              t.assigneeId === emp.id &&
              t.weekStart === WEEKS[0] &&
              t.status !== "COMPLETED"
          );
          const isTarget = dropTarget === emp.id;
          const projected =
            dragTask && isTarget
              ? (allocated(emp.id, dragTask.weekStart) + dragTask.estimatedHours) /
                emp.capacityHoursPerWeek
              : null;

          return (
            <div
              key={emp.id}
              onDragOver={(e) => {
                if (dragTask && dragTask.assigneeId !== emp.id) {
                  e.preventDefault();
                  setDropTarget(emp.id);
                }
              }}
              onDragLeave={() => setDropTarget((t) => (t === emp.id ? null : t))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragTask) requestReallocate(dragTask.id, emp.id);
                setDropTarget(null);
                setDragTaskId(null);
              }}
              className={cn(
                "grid grid-cols-[220px_1fr] border-b border-line-subtle transition-colors last:border-0",
                isTarget &&
                  (projected !== null && projected >= 1
                    ? "bg-danger-soft/40 ring-1 ring-inset ring-danger/40"
                    : "bg-ok-soft/30 ring-1 ring-inset ring-ok/40")
              )}
            >
              {/* Identity column — click to open the person sidebar */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedEmpId(emp.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedEmpId(emp.id); } }}
                className="flex cursor-pointer items-center gap-2.5 px-4 py-3 transition-colors hover:bg-ink-elevated/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand/50"
                title="View work & reassign"
              >
                <EmpAvatar initials={emp.initials} accent={emp.accent} size={30} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-semibold">{emp.name}</span>
                    {emp.burnoutFlag && canSeeBurnout && (
                      <span onClick={(e) => e.stopPropagation()}>
                        <Explain title="Burnout signals (manager-private)" signals={emp.burnoutSignals ?? []}>
                          <button className="h-2 w-2 rounded-full bg-danger shadow-[0_0_6px_#EF4444]" aria-label="Burnout flag" />
                        </Explain>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-fg-muted">
                    <span
                      className={cn(
                        "font-mono font-semibold",
                        utilizationTone(thisWeek) === "danger"
                          ? "text-danger"
                          : utilizationTone(thisWeek) === "warn"
                            ? "text-warn"
                            : "text-ok"
                      )}
                    >
                      {fmtPct(thisWeek)}
                    </span>
                    · {allocated(emp.id, WEEKS[0])}h / {emp.capacityHoursPerWeek}h
                    {isTarget && projected !== null && (
                      <span className={cn("font-mono font-semibold", projected >= 1 ? "text-danger" : "text-ok")}>
                        → {fmtPct(projected)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Week cells */}
              <div className="grid grid-cols-6">
                {WEEKS.map((w, wi) => {
                  const pct = utilization(emp.id, w);
                  const pto = emp.ptoDays.some((d) => d >= w && d < addDays(w, 7));
                  return (
                    <div
                      key={w}
                      className={cn(
                        "flex flex-col justify-center gap-1.5 border-l border-line-subtle px-2 py-2",
                        wi === 0 && "bg-brand-soft/[0.35]"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <CapacityBar pct={pct} className="flex-1" height={6} />
                        <span className="w-9 text-right font-mono text-xs text-fg-muted">
                          {fmtPct(pct)}
                        </span>
                        {pto && (
                          <span title="PTO in this week">
                            <Plane size={10} className="text-info" />
                          </span>
                        )}
                      </div>
                      {/* Task chips only in the live week — keeps density readable */}
                      {wi === 0 && empTasks.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {empTasks.slice(0, 3).map((t) => (
                            <motion.button
                              key={t.id}
                              layout
                              draggable
                              onDragStart={() => setDragTaskId(t.id)}
                              onDragEnd={() => {
                                setDragTaskId(null);
                                setDropTarget(null);
                              }}
                              onClick={() => openTaskDrawer(t.id)}
                              className={cn(
                                "group flex max-w-full cursor-grab items-center gap-1 rounded border border-line bg-ink-elevated px-1.5 py-0.5 text-xs text-fg-secondary transition-all hover:border-brand/50 hover:text-fg active:cursor-grabbing",
                                dragTaskId === t.id && "rotate-2 border-brand shadow-glow"
                              )}
                              title={`${t.title} · ${t.estimatedHours}h · ${projectById(t.projectId)?.code}`}
                            >
                              <GripVertical size={9} className="shrink-0 text-fg-faint" />
                              <PriorityDot priority={t.priority} />
                              <span className="truncate">{t.title}</span>
                              <span className="shrink-0 font-mono text-fg-muted">{t.estimatedHours}h</span>
                            </motion.button>
                          ))}
                          {empTasks.length > 3 && (
                            <span className="px-1 text-xs text-fg-faint">+{empTasks.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
       </div>
      </div>

      <p className="text-xs text-fg-muted">
        Capacity law: utilization = Σ estimated hours due in week ÷ weekly capacity.
        Mutations are atomic increments — drops that project ≥100% require a typed
        override reason and are written to the audit log.
      </p>
    </div>

      {/* Person sidebar — work, projects, skills + skill-aware reassign/assign */}
      <AnimatePresence>
        {selectedEmpId && (
          <CapacityPersonSidebar employeeId={selectedEmpId} onClose={() => setSelectedEmpId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", tone)} />
      {label}
    </span>
  );
}

function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
