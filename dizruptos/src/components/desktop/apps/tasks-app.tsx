"use client";

// Tasks — the enlarged "all my work" window. Opens when you click a task on Home
// (instead of a confusing jump to the old dashboard). A left filter rail (All /
// Today / Overdue / Pending / In Progress / Blocked / Critical / Done) drives a
// dense, readable table: task, project, status, priority, due, hours, assignee.
// Click any row to open its detail drawer. Scope is role-aware (an IC sees their
// own work; a leader also sees the projects/department they own).

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, CircleDot, Filter, Flame, Hourglass, ListChecks, OctagonX, ShieldAlert, Clock } from "lucide-react";
import { TODAY, employeeById, projects } from "@/lib/data";
import { useOps } from "@/lib/store";
import { PERSONAS, useSession } from "@/lib/session";
import type { Task } from "@/lib/types";
import { EmpAvatar } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  IN_PROGRESS: "#F59E0B", BLOCKED: "#EF4444", REVIEW: "#7C6CFF", TO_DO: "#38BDF8", BACKLOG: "#8A8F98", COMPLETED: "#10B981",
};
const PRIORITY_CLS: Record<string, string> = {
  URGENT: "bg-danger/15 text-danger", HIGH: "bg-warn/15 text-warn", MEDIUM: "bg-info/15 text-info", LOW: "bg-fg-muted/15 text-fg-muted",
};

type FilterId = "all" | "today" | "overdue" | "pending" | "in_progress" | "blocked" | "critical" | "done";

export function TasksApp() {
  const personaId = useSession((s) => s.personaId);
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  const allTasks = useOps((s) => s.tasks);
  const openTaskDrawer = useOps((s) => s.openTaskDrawer);
  const [filter, setFilter] = useState<FilterId>("all");

  const me = employeeById(persona.id);
  const ownedProjectIds = projects.filter((p) => p.ownerId === persona.id).map((p) => p.id);
  const deptProjectIds = projects.filter((p) => me?.departmentId && p.departmentId === me.departmentId).map((p) => p.id);
  const seesDept = persona.role === "executive" || persona.role === "dept_head" || persona.role === "admin";
  const scope = allTasks.filter((t) => t.assigneeId === persona.id || ownedProjectIds.includes(t.projectId) || (seesDept && deptProjectIds.includes(t.projectId)));

  const isCriticalProject = (id: string) => { const p = projects.find((x) => x.id === id); return p ? p.health === "CRITICAL" || p.health === "AT_RISK" || p.health === "DELAYED" : false; };

  const counts = useMemo(() => ({
    all: scope.filter((t) => t.status !== "COMPLETED").length,
    today: scope.filter((t) => t.status !== "COMPLETED" && t.dueDate === TODAY).length,
    overdue: scope.filter((t) => t.status !== "COMPLETED" && t.dueDate < TODAY).length,
    pending: scope.filter((t) => t.status === "TO_DO" || t.status === "BACKLOG").length,
    in_progress: scope.filter((t) => t.status === "IN_PROGRESS" || t.status === "REVIEW").length,
    blocked: scope.filter((t) => t.status === "BLOCKED").length,
    critical: scope.filter((t) => t.status !== "COMPLETED" && (t.priority === "URGENT" || t.status === "BLOCKED" || isCriticalProject(t.projectId))).length,
    done: scope.filter((t) => t.status === "COMPLETED").length,
  }), [scope]);

  const FILTERS: { id: FilterId; label: string; icon: React.ElementType; tone?: string }[] = [
    { id: "all", label: "All open", icon: ListChecks },
    { id: "today", label: "Due today", icon: CalendarClock, tone: "#F59E0B" },
    { id: "overdue", label: "Overdue", icon: OctagonX, tone: "#EF4444" },
    { id: "pending", label: "Pending", icon: Hourglass, tone: "#38BDF8" },
    { id: "in_progress", label: "In progress", icon: CircleDot, tone: "#F59E0B" },
    { id: "blocked", label: "Blocked", icon: ShieldAlert, tone: "#EF4444" },
    { id: "critical", label: "Critical", icon: Flame, tone: "#EF4444" },
    { id: "done", label: "Done", icon: CheckCircle2, tone: "#10B981" },
  ];

  const rows = useMemo(() => {
    const f = (t: Task) => {
      switch (filter) {
        case "today": return t.status !== "COMPLETED" && t.dueDate === TODAY;
        case "overdue": return t.status !== "COMPLETED" && t.dueDate < TODAY;
        case "pending": return t.status === "TO_DO" || t.status === "BACKLOG";
        case "in_progress": return t.status === "IN_PROGRESS" || t.status === "REVIEW";
        case "blocked": return t.status === "BLOCKED";
        case "critical": return t.status !== "COMPLETED" && (t.priority === "URGENT" || t.status === "BLOCKED" || isCriticalProject(t.projectId));
        case "done": return t.status === "COMPLETED";
        default: return t.status !== "COMPLETED";
      }
    };
    return scope.filter(f).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [scope, filter]);

  return (
    <div className="flex h-full min-h-0">
      {/* filter rail */}
      <aside className="flex w-[190px] shrink-0 flex-col gap-0.5 border-r border-line bg-ink-surface/60 p-2.5">
        <div className="flex items-center gap-1.5 px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-fg-muted"><Filter size={11} /> My tasks</div>
        {FILTERS.map((f) => {
          const Icon = f.icon;
          const active = filter === f.id;
          const n = counts[f.id];
          return (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors", active ? "text-fg" : "text-fg-secondary hover:bg-ink-elevated")}
              style={active ? { background: "var(--os-accent-soft,rgba(0,237,130,0.12))", boxShadow: "inset 2px 0 0 var(--os-accent,#00ED82)" } : undefined}>
              <Icon size={14} style={{ color: active ? "var(--os-accent,#00ED82)" : f.tone }} />
              <span className="flex-1">{f.label}</span>
              <span className={cn("rounded-full px-1.5 text-[10px] font-bold", active ? "bg-ink-elevated text-fg" : "text-fg-muted")}>{n}</span>
            </button>
          );
        })}
        <div className="mt-auto px-2 pt-2 text-2xs text-fg-faint">Click any task for full detail &amp; (manager) reassignment.</div>
      </aside>

      {/* table */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="grid grid-cols-[1fr_130px_110px_90px_92px_64px_40px] items-center gap-2 border-b border-line px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
          <span>Task</span><span>Project</span><span>Status</span><span>Priority</span><span>Due</span><span className="text-right">Hours</span><span></span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows.length === 0 && <div className="px-4 py-12 text-center text-xs text-fg-muted">No tasks here.</div>}
          {rows.map((t, i) => {
            const p = projects.find((x) => x.id === t.projectId);
            const a = employeeById(t.assigneeId);
            const overdue = t.dueDate < TODAY && t.status !== "COMPLETED";
            return (
              <button key={t.id} onClick={() => openTaskDrawer(t.id)}
                className={cn("grid w-full grid-cols-[1fr_130px_110px_90px_92px_64px_40px] items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-ink-elevated", i % 2 ? "bg-ink-surface/30" : "")}>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_TONE[t.status] }} />
                  <span className="truncate text-xs font-medium text-fg">{t.title}</span>
                </span>
                <span className="flex items-center gap-1.5 truncate">
                  <span className="rounded bg-ink-elevated px-1 py-px font-mono text-[10px] text-fg-muted">{p?.code}</span>
                  <span className="truncate text-2xs text-fg-secondary">{p?.name.split(" ")[0]}</span>
                </span>
                <span className="text-2xs capitalize text-fg-secondary">{t.status.replace("_", " ").toLowerCase()}</span>
                <span><span className={cn("rounded-md px-1.5 py-px text-[10px] font-semibold", PRIORITY_CLS[t.priority])}>{t.priority[0] + t.priority.slice(1).toLowerCase()}</span></span>
                <span className={cn("text-2xs", overdue ? "font-semibold text-danger" : "text-fg-muted")}>{overdue ? "overdue" : new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                <span className="flex items-center justify-end gap-1 font-mono text-2xs text-fg-muted"><Clock size={10} />{t.loggedHours ?? 0}/{t.estimatedHours}</span>
                <span className="flex justify-end">{a ? <EmpAvatar initials={a.initials} accent={a.accent} size={20} /> : <span className="h-5 w-5 rounded-full border border-dashed border-line" />}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
