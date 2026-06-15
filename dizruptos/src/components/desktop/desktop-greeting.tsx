"use client";

// The desktop "good morning" block — the wallpaper greeting. Time-aware
// (morning / afternoon / evening), with a large live clock, the full date, and
// a one-line brief of what matters today. macOS/iOS lock-screen inspired
// typography that sits behind the windows as a calm backdrop.

import { useEffect, useState } from "react";
import { TODAY, WEEKS, employeeById, employees, projects } from "@/lib/data";
import { PERSONAS, useSession } from "@/lib/session";
import { useOps } from "@/lib/store";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);
  return now;
}

function timeGreeting(h: number) {
  if (h < 5) return "You're up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

// A role-aware lead-in so the brief reads personally for whoever's signed in.
function roleLead(role: string) {
  if (role === "executive") return "Across the org —";
  if (role === "dept_head") return "Your department —";
  if (role === "project_manager" || role === "team_lead") return "Your team —";
  return "Your week —";
}

export function DesktopGreeting() {
  const now = useClock();
  const personaId = useSession((s) => s.personaId);
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  const tasks = useOps((s) => s.tasks);
  const utilization = useOps((s) => s.utilization);
  const week = WEEKS[0];

  // a light, role-aware brief (own work + projects you own / your department)
  const me = employeeById(persona.id);
  const owned = projects.filter((p) => p.ownerId === persona.id).map((p) => p.id);
  const dept = projects.filter((p) => me?.departmentId && p.departmentId === me.departmentId).map((p) => p.id);
  const seesDept = persona.role === "executive" || persona.role === "dept_head" || persona.role === "admin";
  const mine = tasks.filter((t) => t.status !== "COMPLETED" && (t.assigneeId === persona.id || owned.includes(t.projectId) || (seesDept && dept.includes(t.projectId))));
  const dueToday = mine.filter((t) => t.dueDate === TODAY).length;
  const overdue = mine.filter((t) => t.dueDate < TODAY).length;
  const critical = mine.filter((t) => t.priority === "URGENT" || t.status === "BLOCKED").length;

  const bits: string[] = [];
  if (overdue) bits.push(`${overdue} overdue`);
  if (dueToday) bits.push(`${dueToday} due today`);
  if (critical) bits.push(`${critical} critical`);
  const brief = bits.length ? bits.join(" · ") : "a clear runway, nothing pressing";

  // second line: team availability + the project most worth your attention
  const teammates = employees.filter((e) => me?.departmentId && e.departmentId === me.departmentId && e.role !== "client");
  const headroom = teammates.filter((e) => utilization(e.id, week) < 0.8).length;
  const myProjects = projects.filter((p) => owned.includes(p.id) || mine.some((t) => t.projectId === p.id));
  const topFocus = myProjects.find((p) => p.health === "CRITICAL") ?? myProjects.find((p) => p.health === "AT_RISK" || p.health === "DELAYED") ?? myProjects[0];

  // The work that actually needs you today — clickable straight from the wallpaper.
  const focusTasks = mine
    .filter((t) => t.priority === "URGENT" || t.status === "BLOCKED" || t.dueDate <= TODAY)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
    .slice(0, 4);
  const focusProjects = [...myProjects].sort((a, b) => HEALTH_RANK[a.health] - HEALTH_RANK[b.health]).slice(0, 4);

  const openTask = (id: string) => useOps.getState().openTaskDrawer(id);
  const openProject = (id: string) => window.dispatchEvent(new CustomEvent("dizrupt:open-route", { detail: { href: `/projects/${id}`, title: "Project" } }));

  const hour = now?.getHours() ?? 9;

  return (
    <div className="pointer-events-none absolute left-9 top-8 max-w-[420px] select-none" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}>
      <div className="font-display text-[64px] font-bold leading-none tracking-tight tabular-nums text-fg">
        {now ? now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }) : "—"}
      </div>
      <div className="mt-2 font-display text-xl font-bold tracking-tight text-fg">
        {timeGreeting(hour)}, {persona.name.split(" ")[0]}.
      </div>
      <div className="mt-0.5 text-sm font-medium text-fg-secondary">
        {persona.title}{me?.location ? ` · ${me.location}` : ""}{me?.timezone ? ` (${me.timezone})` : ""}
      </div>
      <div className="mt-1 flex items-center gap-2 text-sm text-fg-secondary">
        <span>{now ? now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : " "}</span>
        <span className="h-1 w-1 rounded-full bg-fg-faint" />
        <span className="text-fg-muted">{roleLead(persona.role)} {brief}</span>
      </div>
      {(teammates.length > 0 || topFocus) && (
        <div className="mt-1 flex items-center gap-2 text-2xs text-fg-muted">
          {teammates.length > 0 && <span>{headroom} of {teammates.length} teammates have headroom</span>}
          {teammates.length > 0 && topFocus && <span className="h-1 w-1 rounded-full bg-fg-faint" />}
          {topFocus && <span>Top focus: <span className="text-fg-secondary">{topFocus.name}</span> · {topFocus.health.replace("_", " ").toLowerCase()}</span>}
        </div>
      )}

      {/* interactive "what needs you today" — click a task for detail, a project for its board */}
      {focusTasks.length > 0 && (
        <div className="pointer-events-auto mt-4" style={{ textShadow: "none" }}>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">Needs you today</div>
          <div className="space-y-1">
            {focusTasks.map((t) => {
              const overdue = t.dueDate < TODAY;
              return (
                <button key={t.id} onClick={() => openTask(t.id)} title="Open task details"
                  className="flex w-full items-center gap-2 rounded-lg border border-line bg-[rgb(var(--ink-elevated)/0.66)] px-2.5 py-1.5 text-left backdrop-blur-md transition-colors hover:bg-[rgb(var(--ink-elevated)/0.9)]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: STATUS_TONE[t.status] ?? "#8A8F98" }} />
                  <span className="truncate text-xs font-medium text-fg">{t.title}</span>
                  <span className={`ml-auto shrink-0 text-2xs ${overdue ? "font-semibold text-danger" : "text-fg-muted"}`}>{overdue ? "overdue" : t.dueDate === TODAY ? "today" : t.priority.toLowerCase()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {focusProjects.length > 0 && (
        <div className="pointer-events-auto mt-3" style={{ textShadow: "none" }}>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">Your projects</div>
          <div className="flex flex-wrap gap-1.5">
            {focusProjects.map((p) => (
              <button key={p.id} onClick={() => openProject(p.id)} title="Open project"
                className="flex items-center gap-1.5 rounded-full border border-line bg-[rgb(var(--ink-elevated)/0.66)] px-2.5 py-1 text-2xs backdrop-blur-md transition-colors hover:bg-[rgb(var(--ink-elevated)/0.9)]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: HEALTH_TONE[p.health] ?? "#8A8F98" }} />
                <span className="text-fg-secondary">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = { IN_PROGRESS: "#F59E0B", BLOCKED: "#EF4444", REVIEW: "#7C6CFF", TO_DO: "#38BDF8", BACKLOG: "#8A8F98", COMPLETED: "#10B981" };
const HEALTH_TONE: Record<string, string> = { CRITICAL: "#EF4444", AT_RISK: "#F59E0B", DELAYED: "#F59E0B", ON_TRACK: "#10B981", PLANNING: "#38BDF8" };
const HEALTH_RANK: Record<string, number> = { CRITICAL: 0, AT_RISK: 1, DELAYED: 2, ON_TRACK: 3, PLANNING: 4 };
