"use client";

// Employee profile — capacity ring, expertise depth, manager-private burnout
// panel, current load, and bus-factor context. LinkedIn card meets ops intel.

import { notFound } from "next/navigation";
function launchApp(id: string) {
  const ev = new CustomEvent("dizrupt:launch", { detail: { id } });
  window.dispatchEvent(ev);
  try { window.parent?.dispatchEvent(ev); } catch { /* cross-origin guard */ }
}
import { Flame, MapPin, Clock3, CalendarDays, ShieldAlert, User } from "lucide-react";
import { useOps } from "@/lib/store";
import { useSession } from "@/lib/session";
import {
  departmentById,
  employeeById,
  projectById,
  risks,
  WEEKS,
} from "@/lib/data";
import {
  CapacityBar,
  EmpAvatar,
  PriorityDot,
  TaskStatusPill,
} from "@/components/ui/primitives";
import { CapacityRing } from "@/components/ui/spark";
import { cn, fmtDate, fmtPct, utilizationTone } from "@/lib/utils";

export default function PersonPage({ params }: { params: { id: string } }) {
  const emp = employeeById(params.id);
  const canSeeBurnout = useSession((s) => s.can("view_burnout"));
  const utilization = useOps((s) => s.utilization);
  const allocated = useOps((s) => s.allocated);
  const tasks = useOps((s) => s.tasks);
  const openTaskDrawer = useOps((s) => s.openTaskDrawer);

  if (!emp) return notFound();

  const pct = utilization(emp.id, WEEKS[0]);
  const myTasks = tasks.filter(
    (t) => t.assigneeId === emp.id && t.status !== "COMPLETED"
  );
  const ownedRisks = risks.filter((r) => r.ownerId === emp.id);
  const dept = departmentById(emp.departmentId);

  return (
    <div className="flex h-full flex-col">
      {/* OS page header */}
      <div className="flex items-center gap-3 border-b border-line bg-ink-elevated/50 px-5 py-3.5 shrink-0">
        <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#818CF822", border: "1px solid #818CF844" }}>
          <User size={15} style={{ color: "#818CF8" }} />
        </span>
        <div>
          <div className="text-sm font-semibold">{emp.name}</div>
          <div className="text-[11px] text-fg-muted">{emp.title} · {dept?.name}</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
      <div className="grid gap-5 xl:grid-cols-3">
      {/* Identity card */}
      <div className="space-y-5">
        <div className="panel relative overflow-hidden p-6">
          <div
            className="absolute inset-x-0 top-0 h-20 opacity-30"
            style={{ background: `linear-gradient(135deg, ${emp.accent}55, transparent 70%)` }}
          />
          <div className="relative flex items-start gap-4">
            <EmpAvatar initials={emp.initials} accent={emp.accent} size={64} />
            <div className="min-w-0 pt-1">
              <h1 className="font-display text-lg font-semibold tracking-tight">{emp.name}</h1>
              <div className="text-xs text-fg-secondary">{emp.title}</div>
              <div className="mt-2 flex flex-wrap gap-3 text-2xs text-fg-muted">
                <span className="flex items-center gap-1"><MapPin size={10} /> {emp.location}</span>
                <span className="flex items-center gap-1"><Clock3 size={10} /> {emp.timezone}</span>
                <span className="flex items-center gap-1"><CalendarDays size={10} /> since {fmtDate(emp.joinedAt)}</span>
              </div>
            </div>
          </div>

          <div className="relative mt-5 flex items-center gap-5">
            <div className="relative">
              <CapacityRing pct={pct} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={cn(
                    "font-mono text-sm font-bold",
                    utilizationTone(pct) === "danger" ? "text-danger" : utilizationTone(pct) === "warn" ? "text-warn" : "text-ok"
                  )}
                >
                  {fmtPct(pct)}
                </span>
                <span className="text-2xs text-fg-muted">now</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {WEEKS.slice(0, 4).map((w) => {
                const p = utilization(emp.id, w);
                return (
                  <div key={w} className="flex items-center gap-2">
                    <span className="w-12 font-mono text-2xs text-fg-muted">{fmtDate(w)}</span>
                    <CapacityBar pct={p} className="flex-1" height={5} />
                    <span className="w-9 text-right font-mono text-2xs text-fg-secondary">{fmtPct(p)}</span>
                  </div>
                );
              })}
              <div className="text-2xs text-fg-muted">
                {allocated(emp.id, WEEKS[0])}h allocated of {emp.capacityHoursPerWeek}h · {dept?.name}
              </div>
            </div>
          </div>
        </div>

        {/* Manager-private intelligence — RBAC-gated, never employee-visible */}
        {(emp.burnoutFlag || emp.flightRisk !== undefined) && canSeeBurnout && (
          <div className="panel border-danger/25 p-5">
            <div className="label-xs mb-3 flex items-center gap-1.5 text-danger">
              <Flame size={11} /> Manager-private · never shown to the employee
            </div>
            {emp.burnoutFlag && (
              <ul className="space-y-1.5">
                {emp.burnoutSignals?.map((s, i) => (
                  <li key={i} className="flex gap-2 text-2xs leading-relaxed text-fg-secondary">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-danger" />
                    {s}
                  </li>
                ))}
              </ul>
            )}
            {emp.flightRisk !== undefined && (
              <div className="mt-3 flex items-center gap-2 border-t border-line-subtle pt-3">
                <span className="text-2xs text-fg-muted">Flight risk</span>
                <CapacityBar pct={emp.flightRisk * 1.25} className="flex-1" height={5} />
                <span className="font-mono text-2xs font-semibold text-warn">
                  {emp.flightRisk.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Skills & expertise */}
        <div className="panel p-5">
          <div className="label-xs mb-2.5">Skills — can do</div>
          <div className="flex flex-wrap gap-1.5">
            {emp.skills.map((s) => (
              <span key={s} className="rounded-full border border-line bg-ink-elevated px-2.5 py-0.5 text-2xs text-fg-secondary">
                {s}
              </span>
            ))}
          </div>
          <div className="label-xs mb-2.5 mt-4">Expertise — has done; others rely on</div>
          <div className="space-y-2">
            {emp.expertise.map((ex) => (
              <div key={ex.domain} className="flex items-center gap-2">
                <span className="w-44 truncate text-2xs text-fg-secondary">{ex.domain}</span>
                <CapacityBar pct={ex.depth * 0.79} className="flex-1" height={5} />
                <span className="font-mono text-2xs text-brand">{ex.depth.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Work column */}
      <div className="space-y-5 xl:col-span-2">
        <div className="panel p-5">
          <div className="label-xs mb-3">Active work — {myTasks.length} open tasks</div>
          <div className="space-y-2">
            {myTasks.map((t) => {
              const proj = projectById(t.projectId);
              return (
                <button
                  key={t.id}
                  onClick={() => openTaskDrawer(t.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-line bg-ink-elevated p-3 text-left transition-colors hover:border-brand/40"
                >
                  <PriorityDot priority={t.priority} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium">{t.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-2xs text-fg-muted">
                      <span className="font-mono text-brand">{proj?.code}</span>
                      due {fmtDate(t.dueDate)} · {t.estimatedHours}h est
                    </div>
                  </div>
                  <TaskStatusPill status={t.status} />
                </button>
              );
            })}
            {myTasks.length === 0 && (
              <p className="py-6 text-center text-2xs text-fg-muted">
                No open tasks this cycle.
              </p>
            )}
          </div>
        </div>

        {ownedRisks.length > 0 && (
          <div className="panel p-5">
            <div className="label-xs mb-3 flex items-center gap-1.5">
              <ShieldAlert size={11} className="text-warn" /> Risks owned
            </div>
            <div className="space-y-2">
              {ownedRisks.map((r) => (
                <button key={r.id} onClick={() => launchApp("home")} className="block w-full text-left rounded-lg border border-line bg-ink-elevated p-3 transition-colors hover:border-warn/40">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    {r.title}
                    <span className="ml-auto rounded-full bg-warn-soft px-2 py-px text-2xs text-warn">{r.status.toLowerCase()}</span>
                  </div>
                  <p className="mt-1 text-2xs text-fg-muted">{r.mitigationPlan}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PTO */}
        <div className="panel p-5">
          <div className="label-xs mb-2">Availability</div>
          {emp.ptoDays.length > 0 ? (
            <p className="text-2xs text-fg-secondary">
              PTO blocked: {emp.ptoDays.map(fmtDate).join(", ")} — these days are
              removed from the assignment canvas; assigning over leave is impossible.
            </p>
          ) : (
            <p className="text-2xs text-fg-muted">
              No PTO scheduled in the visible window.
              {emp.burnoutFlag && " The burnout agent has flagged this — see Agent Inbox."}
            </p>
          )}
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}
