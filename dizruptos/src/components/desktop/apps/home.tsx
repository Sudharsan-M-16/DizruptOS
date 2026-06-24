"use client";

// Home — the desktop's personal command surface. Everything here is about the
// person who logged in: their workload, their tasks classified into Today /
// Pending / Critical (each grouped under the project it belongs to), what those
// tasks are blocked on, the projects they carry, the team around them, and the
// risks that need their attention. One glance = "what's my day." Launch buttons
// fire `dizrupt:launch` to open the matching app window. Token surfaces only.

import { memo, useState } from "react";
import {
  AlertTriangle, ArrowUpRight, CalendarClock, CircleDot, Clock, Flame, Hourglass,
  Link2, ShieldAlert,
} from "lucide-react";
import { TODAY, departments, employeeById, employees, projects, tasks as seedTasks, WEEKS } from "@/lib/data";
import { PERSONAS, useSession } from "@/lib/session";
import { useOps } from "@/lib/store";
import type { Task } from "@/lib/types";
import { EmpAvatar, CapacityBar, HealthPill } from "@/components/ui/primitives";
import { OrgHealthSparkline } from "@/components/ui/org-health-sparkline";
import { isQualified, skillMatchScore } from "@/lib/skills";
import { cn, fmtPct, utilizationTone } from "@/lib/utils";
import { Plus, Sparkles } from "lucide-react";

const launch = (id: string) => window.dispatchEvent(new CustomEvent("dizrupt:launch", { detail: { id } }));
// open the Tasks app pre-filtered (today / overdue / pending / critical / …)
const openTasks = (filter: string) => window.dispatchEvent(new CustomEvent("dizrupt:open-tasks", { detail: { filter } }));

const STATUS_TONE: Record<string, string> = {
  IN_PROGRESS: "#F59E0B", BLOCKED: "#EF4444", REVIEW: "#7C6CFF", TO_DO: "#38BDF8", BACKLOG: "#8A8F98", COMPLETED: "#10B981",
};
const PRIORITY_CLS: Record<string, string> = {
  URGENT: "bg-danger/15 text-danger", HIGH: "bg-warn/15 text-warn", MEDIUM: "bg-info/15 text-info", LOW: "bg-fg-muted/15 text-fg-muted",
};

type Segment = "today" | "pending" | "critical";

export const HomeApp = memo(function HomeApp() {
  const personaId = useSession((s) => s.personaId);
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  const utilization = useOps((s) => s.utilization);
  const allTasks = useOps((s) => s.tasks);
  const week = WEEKS[0];
  // open on whatever needs attention first: Critical → Today/overdue → Pending.
  const [seg, setSeg] = useState<Segment>(() => pickDefaultSegment());

  const overrides = useOps((s) => s.projectOverrides);
  const healthOf = (id: string) => overrides[id]?.health ?? projects.find((p) => p.id === id)?.health;
  const taskById = (id: string) => allTasks.find((t) => t.id === id) ?? seedTasks.find((t) => t.id === id);
  const projectById = (id: string) => {
    const p = projects.find((x) => x.id === id);
    return p && overrides[id] ? { ...p, ...overrides[id] } : p;
  };
  const isCriticalProject = (id: string) => {
    const h = healthOf(id);
    return h === "CRITICAL" || h === "AT_RISK" || h === "DELAYED";
  };
  const me = employeeById(persona.id);

  // Scope: an individual contributor sees their own tasks; a leader also sees the
  // work they're accountable for — tasks in projects they own, and (for dept
  // heads / execs) tasks across their department. Keeps Home meaningful per role.
  const ownedProjectIds = projects.filter((p) => p.ownerId === persona.id).map((p) => p.id);
  const deptProjectIds = projects.filter((p) => me?.departmentId && p.departmentId === me.departmentId).map((p) => p.id);
  const seesDept = persona.role === "executive" || persona.role === "dept_head" || persona.role === "admin";
  const myTasks = allTasks.filter((t) =>
    t.status !== "COMPLETED" &&
    (t.assigneeId === persona.id || ownedProjectIds.includes(t.projectId) || (seesDept && deptProjectIds.includes(t.projectId)))
  );

  // ----- classification (each task carries its project; see TaskRow) -----
  const today = myTasks.filter((t) => t.dueDate <= TODAY);                 // due today or overdue
  const pending = myTasks.filter((t) => t.status === "TO_DO" || t.status === "BACKLOG");
  const critical = myTasks.filter((t) => t.priority === "URGENT" || t.status === "BLOCKED" || isCriticalProject(t.projectId));
  const segTasks = seg === "today" ? today : seg === "pending" ? pending : critical;

  const myProjectIds = Array.from(new Set([...myTasks.map((t) => t.projectId), ...projects.filter((p) => p.ownerId === persona.id).map((p) => p.id)]));
  const myProjects = projects.filter((p) => myProjectIds.includes(p.id));
  const blocked = myTasks.filter((t) => (t.dependsOn?.length ?? 0) > 0 || t.status === "BLOCKED");
  const myUtil = utilization(persona.id, week);
  const myDept = departments.find((d) => d.id === me?.departmentId);
  const teammates = employees.filter((e) => me?.departmentId && e.departmentId === me.departmentId && e.role !== "client" && e.id !== persona.id);
  const criticalProjects = myProjects.filter((p) => isCriticalProject(p.id));

  // group the active segment's tasks under their project
  const grouped = Object.values(
    segTasks.reduce<Record<string, { pid: string; items: Task[] }>>((acc, t) => {
      (acc[t.projectId] ??= { pid: t.projectId, items: [] }).items.push(t);
      return acc;
    }, {})
  );

  const SEGMENTS: { id: Segment; label: string; icon: React.ElementType; count: number; tone: string }[] = [
    { id: "today", label: "Today", icon: CalendarClock, count: today.length, tone: "#F59E0B" },
    { id: "pending", label: "Pending", icon: Hourglass, count: pending.length, tone: "#38BDF8" },
    { id: "critical", label: "Critical", icon: ShieldAlert, count: critical.length, tone: "#EF4444" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex items-start gap-3.5">
        <EmpAvatar initials={persona.initials} accent={persona.accent} size={46} />
        <div className="min-w-0">
          <div className="flex items-baseline gap-2.5">
            <h1 className="font-display text-xl font-bold tracking-tight">{greeting()}, {persona.name.split(" ")[0]}.</h1>
            <span className="hidden text-2xs font-medium text-fg-muted sm:inline">{longDate()}</span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-fg-secondary">{dailyBrief({ persona, myUtil, today, pending, critical, criticalProjects })}</p>
        </div>
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <LaunchBtn id="tasks" label="All Tasks" />
          <LaunchBtn id="matrix" label="Board" />
          <LaunchBtn id="directory" label="Team" />
        </div>
      </div>

      {/* org health sparkline — live 7-day trend from health-history API */}
      <div className="mt-3">
        <OrgHealthSparkline days={7} />
      </div>

      {/* self-service: an IC with spare capacity can pick up matching work */}
      {me && (persona.role === "employee" || persona.role === "team_lead") && myUtil < 0.75 && (
        <SelfServiceBanner meId={persona.id} />
      )}

      {/* stat row — task cards open the enlarged Tasks app */}
      <div className="mt-3 grid grid-cols-4 gap-2.5">
        <Stat label="Your load" value={fmtPct(myUtil)} valueClass={utilizationTone(myUtil) === "danger" ? "text-danger" : utilizationTone(myUtil) === "warn" ? "text-warn" : "text-ok"} icon={Flame} sub={`${me?.capacityHoursPerWeek ?? 40}h week`} />
        <Stat label="Today / overdue" value={String(today.length)} icon={CalendarClock} sub="open Tasks ↗" onClick={() => openTasks("today_overdue")} />
        <Stat label="Pending" value={String(pending.length)} icon={Hourglass} sub="open Tasks ↗" onClick={() => openTasks("pending")} />
        <Stat label="Critical" value={String(critical.length)} valueClass={critical.length ? "text-danger" : undefined} icon={ShieldAlert} sub="open Tasks ↗" onClick={() => openTasks("critical")} />
      </div>

      <div className="mt-4 grid min-h-0 flex-1 grid-cols-[1.35fr_1fr] gap-4 overflow-hidden">
        {/* left: classified task center */}
        <div className="flex min-h-0 flex-col">
          <div className="mb-2 inline-flex rounded-xl border border-line bg-ink-surface p-0.5">
            {SEGMENTS.map((s) => {
              const Icon = s.icon;
              const active = seg === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSeg(s.id)}
                  className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", active ? "text-fg" : "text-fg-muted hover:text-fg-secondary")}
                  style={active ? { background: "rgb(var(--ink-elevated))" } : undefined}
                >
                  <Icon size={13} style={{ color: active ? s.tone : undefined }} />
                  {s.label}
                  <span className={cn("rounded-full px-1.5 text-[10px] font-bold", active ? "text-black" : "bg-ink-elevated text-fg-muted")} style={active ? { background: s.tone } : undefined}>{s.count}</span>
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {grouped.length === 0 && <Empty>{seg === "today" ? "Nothing due today — you're ahead." : seg === "pending" ? "No pending work — all picked up." : "No critical items. Nicely held."}</Empty>}
            {grouped.map((g) => {
              const p = projectById(g.pid);
              return (
                <div key={g.pid}>
                  <button onClick={() => launch("matrix")} className="mb-1.5 flex w-full items-center gap-2 px-0.5 text-left">
                    <span className="rounded bg-ink-elevated px-1.5 py-px font-mono text-[10px] text-fg-muted">{p?.code}</span>
                    <span className="truncate text-2xs font-semibold text-fg-secondary">{p?.name}</span>
                    {p && <HealthPill health={p.health} className="ml-auto shrink-0" />}
                  </button>
                  <div className="space-y-1.5">
                    {g.items.map((t) => <TaskRow key={t.id} task={t} selfId={persona.id} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* right: dependencies, team, attention */}
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
          <Panel title="Blocked / depends on">
            <div className="space-y-1.5">
              {blocked.slice(0, 3).map((t) => {
                const blockers = (t.dependsOn ?? []).map(taskById).filter(Boolean) as Task[];
                return (
                  <div key={t.id} className="rounded-lg border border-danger/25 bg-danger/[0.05] px-2.5 py-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium"><AlertTriangle size={12} className="text-danger" /> {t.title}</div>
                    {blockers.length > 0 ? blockers.map((b) => (
                      <div key={b.id} className="mt-0.5 flex items-center gap-1.5 pl-4 text-2xs text-fg-muted">
                        <Link2 size={10} /> waiting on <span className="text-fg-secondary">{b.title}</span>
                        {b.assigneeId && <span className="text-fg-faint">· {employeeById(b.assigneeId)?.name.split(" ")[0]}</span>}
                      </div>
                    )) : <div className="mt-0.5 pl-4 text-2xs text-fg-muted">Marked blocked — needs unblocking.</div>}
                  </div>
                );
              })}
              {blocked.length === 0 && <Empty>Nothing blocked.</Empty>}
            </div>
          </Panel>

          <Panel title={`Your team${myDept ? ` · ${myDept.name}` : ""}`} action={<LaunchLink id="directory" label="Directory" />}>
            <div className="space-y-1">
              {teammates.slice(0, 4).map((e) => {
                const u = utilization(e.id, week);
                return (
                  <div key={e.id} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
                    <EmpAvatar initials={e.initials} accent={e.accent} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{e.name}</div>
                      <div className="truncate text-2xs text-fg-muted">{e.title}</div>
                    </div>
                    <CapacityBar pct={u} className="w-16" />
                  </div>
                );
              })}
              {teammates.length === 0 && <Empty>No teammates listed.</Empty>}
            </div>
          </Panel>

          {criticalProjects.length > 0 && (
            <Panel title="Needs your attention" action={<LaunchLink id="r-risks" label="Risks" />}>
              <div className="space-y-1.5">
                {criticalProjects.map((p) => (
                  <div key={p.id} className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger/[0.05] px-2.5 py-2">
                    <ShieldAlert size={13} className="mt-0.5 shrink-0 text-danger" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium">{p.name}</div>
                      <div className="truncate text-2xs text-fg-muted">{p.healthReasons?.[0]}</div>
                    </div>
                    <HealthPill health={p.health} className="ml-auto shrink-0" />
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
});

// Free-time self-service — when you have room, the system offers you matching
// work to pick up yourself. No manager approval needed; it keeps the project
// moving and is bounded by claimTask (stays under 100%, unowned tasks only).
function SelfServiceBanner({ meId }: { meId: string }) {
  const allTasks = useOps((s) => s.tasks);
  const claimTask = useOps((s) => s.claimTask);
  const me = employeeById(meId);
  if (!me) return null;
  const fits = allTasks
    .filter((t) => !t.assigneeId && t.status !== "COMPLETED" && isQualified(me, t))
    .sort((a, b) => skillMatchScore(me, b) - skillMatchScore(me, a))
    .slice(0, 3);
  if (fits.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-ok/30 bg-ok/[0.06] p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-ok">
        <Sparkles size={13} /> You&apos;ve got room this week — want to pick up more?
      </div>
      <p className="mt-0.5 text-2xs text-fg-muted">Work that matches your skills and has no owner yet. Picking one up moves the project forward.</p>
      <div className="mt-2 space-y-1.5">
        {fits.map((t) => {
          const p = projects.find((x) => x.id === t.projectId);
          return (
            <div key={t.id} className="flex items-center gap-2 rounded-lg border border-line bg-ink-surface px-2.5 py-1.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-fg">{t.title}</span>
                <span className="text-2xs text-fg-muted">{p?.code} · {t.estimatedHours}h</span>
              </span>
              <button
                onClick={() => claimTask(t.id)}
                className="flex shrink-0 items-center gap-1 rounded-md bg-ok/15 px-2 py-1 text-2xs font-semibold text-ok transition-colors hover:bg-ok/25"
              >
                <Plus size={11} /> Pick up
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskRow({ task: t, selfId }: { task: Task; selfId: string }) {
  const overdue = t.dueDate < TODAY && t.status !== "COMPLETED";
  const assignee = t.assigneeId && t.assigneeId !== selfId ? employeeById(t.assigneeId) : null;
  return (
    <button
      onClick={() => useOps.getState().openTaskDrawer(t.id)}
      className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-ink-surface px-2.5 py-2 text-left transition-colors hover:border-line-strong"
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_TONE[t.status] }} title={t.status} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-fg">{t.title}</span>
        <span className="mt-0.5 flex items-center gap-2 text-2xs text-fg-muted">
          <span className="capitalize">{t.status.replace("_", " ").toLowerCase()}</span>
          <span className="flex items-center gap-0.5"><Clock size={10} /> {t.loggedHours ?? 0}/{t.estimatedHours}h</span>
          <span className={cn(overdue ? "font-semibold text-danger" : "")}>{overdue ? "overdue" : `due ${shortDate(t.dueDate)}`}</span>
        </span>
      </span>
      {assignee && <EmpAvatar initials={assignee.initials} accent={assignee.accent} size={20} />}
      <span className={cn("shrink-0 rounded-md px-1.5 py-px text-[10px] font-semibold", PRIORITY_CLS[t.priority] ?? PRIORITY_CLS.MEDIUM)}>{t.priority[0] + t.priority.slice(1).toLowerCase()}</span>
    </button>
  );
}

function shortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Choose the tab that surfaces the most urgent work on login (read synchronously
// from the stores, so the right tab is shown on first paint — no flash).
function pickDefaultSegment(): Segment {
  const personaId = useSession.getState().personaId;
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  const me = employeeById(persona.id);
  const owned = projects.filter((p) => p.ownerId === persona.id).map((p) => p.id);
  const dept = projects.filter((p) => me?.departmentId && p.departmentId === me.departmentId).map((p) => p.id);
  const seesDept = persona.role === "executive" || persona.role === "dept_head" || persona.role === "admin";
  const crit = (id: string) => { const p = projects.find((x) => x.id === id); return !!p && (p.health === "CRITICAL" || p.health === "AT_RISK" || p.health === "DELAYED"); };
  const mine = useOps.getState().tasks.filter((t) => t.status !== "COMPLETED" && (t.assigneeId === persona.id || owned.includes(t.projectId) || (seesDept && dept.includes(t.projectId))));
  if (mine.some((t) => t.priority === "URGENT" || t.status === "BLOCKED" || crit(t.projectId))) return "critical";
  if (mine.some((t) => t.dueDate <= TODAY)) return "today";
  return "pending";
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function longDate() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

// A human, data-driven one-liner for the top of Home — "what's my day" at a glance.
function dailyBrief({ myUtil, today, pending, critical, criticalProjects }: { persona: unknown; myUtil: number; today: Task[]; pending: Task[]; critical: Task[]; criticalProjects: { name: string }[] }) {
  const overdue = today.filter((t) => t.dueDate < TODAY).length;
  const dueToday = today.length - overdue;
  const load = myUtil >= 1 ? "You're over capacity" : myUtil >= 0.85 ? "You're near your limit" : myUtil >= 0.5 ? "Your load looks healthy" : "You've got room to take more on";
  const bits: string[] = [];
  if (overdue) bits.push(`${overdue} overdue`);
  if (dueToday) bits.push(`${dueToday} due today`);
  if (critical.length) bits.push(`${critical.length} critical`);
  if (!overdue && !dueToday && pending.length) bits.push(`${pending.length} pending`);
  const tasksLine = bits.length ? bits.join(" · ") : "nothing pressing on your plate";
  const cp = criticalProjects[0];
  return `${load} — ${tasksLine}.${cp ? ` ${cp.name} needs your attention.` : ""}`;
}

function Stat({ label, value, sub, icon: Icon, valueClass, onClick }: { label: string; value: string; sub?: string; icon: React.ElementType; valueClass?: string; onClick?: () => void }) {
  const Tag: any = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={cn("rounded-xl border border-line bg-ink-surface p-3 text-left", onClick && "cursor-pointer transition-colors hover:border-line-strong hover:bg-ink-elevated")}>
      <div className="flex items-center gap-1.5 text-2xs text-fg-muted"><Icon size={12} /> {label}</div>
      <div className={cn("mt-1 font-display text-2xl font-bold tracking-tight", valueClass)}>{value}</div>
      {sub && <div className="text-2xs text-fg-faint">{sub}</div>}
    </Tag>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function LaunchBtn({ id, label }: { id: string; label: string }) {
  return <button onClick={() => launch(id)} className="rounded-lg border border-line bg-ink-surface px-2.5 py-1 text-2xs font-medium text-fg-secondary transition-colors hover:bg-ink-elevated">{label}</button>;
}
function LaunchLink({ id, label }: { id: string; label: string }) {
  return (
    <button onClick={() => launch(id)} className="flex items-center gap-1 text-2xs font-medium transition-colors hover:opacity-80" style={{ color: "var(--os-accent,#00ED82)" }}>
      {label} <ArrowUpRight size={11} />
    </button>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-line py-4 text-center text-2xs text-fg-faint">{children}</div>;
}
