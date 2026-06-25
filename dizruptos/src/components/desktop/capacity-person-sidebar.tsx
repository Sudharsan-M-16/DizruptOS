"use client";

// Capacity person sidebar — click a person in the heatmap to see their current
// work, projects, and skills, and to move work around. This replaces the old
// standalone Operative Directory: managers can relieve an overloaded person or
// give an underloaded person work that fits their skills, right here.

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRightLeft, MapPin, Plane, Plus, X } from "lucide-react";
import { employeeById, employees, projectById, projects, WEEKS } from "@/lib/data";
import { useOps } from "@/lib/store";
import { useSession } from "@/lib/session";
import { isQualified, skillMatchScore } from "@/lib/skills";
import { EmpAvatar, CapacityBar, PriorityDot } from "@/components/ui/primitives";
import { cn, fmtPct, utilizationTone } from "@/lib/utils";
import type { Task } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = {
  executive: "Executive", dept_head: "Dept Head", project_manager: "Manager",
  team_lead: "Team Lead", employee: "Engineer", admin: "Admin", client: "Client",
};

const UNDERLOADED = 0.6; // below 60% = has room for more work

export function CapacityPersonSidebar({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const tasks = useOps((s) => s.tasks);
  const utilization = useOps((s) => s.utilization);
  const allocated = useOps((s) => s.allocated);
  const requestReallocate = useOps((s) => s.requestReallocate);
  const openTaskDrawer = useOps((s) => s.openTaskDrawer);
  const canReallocate = useSession((s) => s.can("reallocate"));
  const canSeeBurnout = useSession((s) => s.can("view_burnout"));

  const [moveTaskId, setMoveTaskId] = React.useState<string | null>(null);

  const emp = employeeById(employeeId);
  const week = WEEKS[0];
  if (!emp) return null;

  const util = utilization(emp.id, week);
  const tone = utilizationTone(util);
  const toneClass = tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : "text-ok";

  const myTasks = tasks.filter((t) => t.assigneeId === emp.id && t.status !== "COMPLETED");
  const myProjectIds = Array.from(new Set([
    ...projects.filter((p) => p.ownerId === emp.id).map((p) => p.id),
    ...myTasks.map((t) => t.projectId),
  ]));
  const isUnderloaded = util < UNDERLOADED;

  // Unassigned work that fits this person's skills (for the "give them work" flow).
  const fitsThem = tasks
    .filter((t) => !t.assigneeId && t.status !== "COMPLETED" && isQualified(emp, t))
    .sort((a, b) => skillMatchScore(emp, b) - skillMatchScore(emp, a));

  // Candidates to receive a task moved off this person: ranked by skill, then load.
  function candidatesFor(task: Task) {
    return employees
      .filter((e) => e.role !== "client" && e.id !== emp!.id)
      .map((e) => ({
        emp: e,
        qualified: isQualified(e, task),
        score: skillMatchScore(e, task),
        load: utilization(e.id, task.weekStart),
      }))
      .sort((a, b) =>
        a.qualified !== b.qualified ? Number(b.qualified) - Number(a.qualified)
          : b.score !== a.score ? b.score - a.score
            : a.load - b.load
      )
      .slice(0, 5);
  }

  function reassign(taskId: string, toId: string) {
    requestReallocate(taskId, toId);
    setMoveTaskId(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex justify-end bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-[380px] max-w-[88vw] flex-col border-l border-line bg-ink-surface shadow-2xl"
      >
        {/* header */}
        <div className="flex items-start gap-3 border-b border-line p-4">
          <EmpAvatar initials={emp.initials} accent={emp.accent} size={44} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="truncate font-display text-base font-bold tracking-tight">{emp.name}</h2>
              {emp.burnoutFlag && canSeeBurnout && <AlertTriangle size={13} className="shrink-0 text-danger" />}
            </div>
            <div className="truncate text-xs text-fg-secondary">{emp.title}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-2xs text-fg-muted">
              <span className="flex items-center gap-1"><MapPin size={10} /> {emp.location} · {emp.timezone}</span>
              <span className="rounded-full bg-ink-elevated px-1.5 py-px font-medium">{ROLE_LABEL[emp.role] ?? emp.role}</span>
            </div>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full bg-ink-elevated text-fg-muted hover:text-fg"><X size={13} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-5">
          {/* load */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-2xs">
              <span className="font-semibold uppercase tracking-wider text-fg-muted">This week</span>
              <span className={cn("font-mono font-semibold", toneClass)}>{fmtPct(util)} · {allocated(emp.id, week)}h / {emp.capacityHoursPerWeek}h</span>
            </div>
            <CapacityBar pct={util} />
            {isUnderloaded && (
              <div className="mt-1.5 flex items-center gap-1.5 text-2xs text-ok">
                <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Has room for more work
              </div>
            )}
            {util >= 1 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-2xs text-danger">
                <span className="h-1.5 w-1.5 rounded-full bg-danger" /> Overloaded — move some work off
              </div>
            )}
          </div>

          {/* burnout — manager-private */}
          {emp.burnoutFlag && canSeeBurnout && (
            <div className="space-y-1 rounded-xl border border-danger/30 bg-danger/[0.06] p-3">
              <div className="text-2xs font-semibold uppercase tracking-wider text-danger">Burnout signals (private)</div>
              {emp.burnoutSignals?.map((s) => (
                <div key={s} className="flex items-center gap-2 text-2xs text-danger"><AlertTriangle size={10} /> {s}</div>
              ))}
              {typeof emp.flightRisk === "number" && (
                <div className="mt-1 flex items-center gap-2 border-t border-danger/20 pt-1.5 text-2xs text-danger"><Plane size={10} /> Flight risk {Math.round(emp.flightRisk * 100)}%</div>
              )}
            </div>
          )}

          {/* current tasks + reassign */}
          <div>
            <div className="mb-2 text-2xs font-semibold uppercase tracking-wider text-fg-muted">Current tasks ({myTasks.length})</div>
            <div className="space-y-1.5">
              {myTasks.length === 0 && <div className="text-2xs text-fg-faint">No open tasks.</div>}
              {myTasks.map((t) => {
                const proj = projectById(t.projectId);
                const moving = moveTaskId === t.id;
                return (
                  <div key={t.id} className="rounded-lg border border-line bg-ink-elevated/60">
                    <div className="flex items-center gap-2 px-2.5 py-2">
                      <PriorityDot priority={t.priority} />
                      <button onClick={() => openTaskDrawer(t.id)} className="min-w-0 flex-1 text-left">
                        <div className="truncate text-xs font-medium text-fg">{t.title}</div>
                        <div className="truncate text-2xs text-fg-muted">{proj?.code} · {t.estimatedHours}h · {t.status.replace("_", " ").toLowerCase()}</div>
                      </button>
                      {canReallocate && (
                        <button
                          onClick={() => setMoveTaskId(moving ? null : t.id)}
                          className={cn("flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-1 text-2xs font-medium transition-colors", moving ? "border-brand/50 bg-brand/10 text-brand" : "border-line text-fg-muted hover:text-fg")}
                          title="Move to someone else"
                        >
                          <ArrowRightLeft size={10} /> Move
                        </button>
                      )}
                    </div>
                    {/* candidate picker — skill-ranked */}
                    {moving && (
                      <div className="border-t border-line px-2 py-1.5">
                        <div className="mb-1 px-0.5 text-2xs text-fg-faint">Best fit first — qualified people with the most room:</div>
                        <div className="space-y-0.5">
                          {candidatesFor(t).map((c) => (
                            <button
                              key={c.emp.id}
                              onClick={() => reassign(t.id, c.emp.id)}
                              className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-ink-elevated"
                            >
                              <EmpAvatar initials={c.emp.initials} accent={c.emp.accent} size={20} />
                              <span className="min-w-0 flex-1 truncate text-2xs font-medium text-fg">{c.emp.name}</span>
                              {c.qualified
                                ? <span className="shrink-0 rounded bg-ok/15 px-1 text-[10px] font-semibold text-ok">fits</span>
                                : <span className="shrink-0 rounded bg-warn/15 px-1 text-[10px] font-semibold text-warn">stretch</span>}
                              <span className={cn("w-9 shrink-0 text-right font-mono text-[10px]",
                                c.load >= 1 ? "text-danger" : c.load >= 0.8 ? "text-warn" : "text-ok")}>{fmtPct(c.load)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* give underloaded person matching work */}
          {canReallocate && isUnderloaded && fitsThem.length > 0 && (
            <div>
              <div className="mb-2 text-2xs font-semibold uppercase tracking-wider text-ok">Available work that fits</div>
              <div className="space-y-1.5">
                {fitsThem.slice(0, 4).map((t) => {
                  const proj = projectById(t.projectId);
                  return (
                    <div key={t.id} className="flex items-center gap-2 rounded-lg border border-ok/30 bg-ok/[0.05] px-2.5 py-2">
                      <PriorityDot priority={t.priority} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-fg">{t.title}</div>
                        <div className="truncate text-2xs text-fg-muted">{proj?.name} · {t.estimatedHours}h</div>
                      </div>
                      <button
                        onClick={() => reassign(t.id, emp.id)}
                        className="flex shrink-0 items-center gap-1 rounded-md bg-ok/15 px-1.5 py-1 text-2xs font-semibold text-ok transition-colors hover:bg-ok/25"
                      >
                        <Plus size={10} /> Assign
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* projects */}
          <div>
            <div className="mb-2 text-2xs font-semibold uppercase tracking-wider text-fg-muted">On projects ({myProjectIds.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {myProjectIds.map((id) => {
                const p = projectById(id);
                if (!p) return null;
                return (
                  <span key={id} className="flex items-center gap-1 rounded-full border border-line bg-ink-surface px-2 py-0.5 text-2xs text-fg-secondary">
                    <span className="font-mono text-fg-muted">{p.code}</span> {p.name.split(" ").slice(0, 2).join(" ")}
                  </span>
                );
              })}
              {myProjectIds.length === 0 && <span className="text-2xs text-fg-faint">Not on any project yet.</span>}
            </div>
          </div>

          {/* skills */}
          {emp.skills?.length ? (
            <div>
              <div className="mb-2 text-2xs font-semibold uppercase tracking-wider text-fg-muted">Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {emp.skills.map((s) => (
                  <span key={s} className="rounded-full border border-line bg-ink-surface px-2.5 py-1 text-2xs font-medium text-fg-secondary">{s}</span>
                ))}
              </div>
            </div>
          ) : null}

          {/* expertise depth */}
          {emp.expertise?.length ? (
            <div>
              <div className="mb-2 text-2xs font-semibold uppercase tracking-wider text-fg-muted">Expertise</div>
              <div className="space-y-1.5">
                {emp.expertise.map((x) => (
                  <div key={x.domain} className="flex items-center gap-2">
                    <span className="w-32 truncate text-2xs text-fg-secondary">{x.domain}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-elevated">
                      <div className="h-full rounded-full" style={{ width: `${x.depth * 100}%`, background: "var(--os-accent,#00ED82)" }} />
                    </div>
                    <span className="w-7 text-right font-mono text-[10px] text-fg-muted">{Math.round(x.depth * 100)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* joined */}
          <div className="border-t border-line-subtle pt-3 text-2xs text-fg-faint">
            Joined {new Date(emp.joinedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
}
