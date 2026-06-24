"use client";

// Client Portal — what a customer sees when they log in. It is deliberately
// narrow: only THEIR project(s). Plain-language status, what's being worked on,
// who's on the team, and anything that puts their delivery at risk. No company
// data, no capacity %, no burnout, no financials, no other projects or people.

import * as React from "react";
import { CheckCircle2, CircleDot, Clock, LogOut, ShieldAlert, Sparkles } from "lucide-react";
import { useOps } from "@/lib/store";
import { useSession, PERSONAS } from "@/lib/session";
import { projects, risks as seedRisks, employeeById } from "@/lib/data";
import { EmpAvatar } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { HealthStatus, Task } from "@/lib/types";

const HEALTH: Record<HealthStatus, { label: string; tone: string; msg: string }> = {
  ON_TRACK: { label: "On track", tone: "ok", msg: "Everything is going to plan." },
  DELAYED: { label: "Slightly behind", tone: "warn", msg: "A few things are running late — the team is catching up." },
  AT_RISK: { label: "Needs attention", tone: "warn", msg: "Some parts are at risk — the team is on it." },
  BLOCKED: { label: "Blocked", tone: "danger", msg: "Work is blocked and being escalated." },
  CRITICAL: { label: "Behind schedule", tone: "danger", msg: "This project is behind — the team is focused on getting it back on track." },
};

const toneText: Record<string, string> = { ok: "text-ok", warn: "text-warn", danger: "text-danger" };
const toneBg: Record<string, string> = { ok: "bg-ok/10 border-ok/30", warn: "bg-warn/10 border-warn/30", danger: "bg-danger/10 border-danger/30" };

export function ClientPortal() {
  const persona = useSession((s) => s.persona());
  const setPersona = useSession((s) => s.setPersona);
  const liveTasks = useOps((s) => s.tasks);

  // The client only ever sees the project(s) booked under their name.
  const myProjects = projects.filter((p) => p.customer === persona.customer);

  return (
    <div className="min-h-screen bg-ink text-fg">
      {/* header */}
      <header className="flex items-center gap-3 border-b border-line bg-ink-surface/80 px-6 py-3.5 backdrop-blur">
        <span className="grid h-9 w-9 place-items-center rounded-xl font-bold text-ink" style={{ background: persona.accent }}>
          {persona.initials}
        </span>
        <div className="flex-1">
          <div className="text-sm font-semibold">{persona.name}</div>
          <div className="text-2xs text-fg-muted">Client portal · your project status</div>
        </div>
        {/* demo convenience: jump back to an internal login */}
        <label className="sr-only" htmlFor="cp-switch">Switch login</label>
        <select
          id="cp-switch"
          value={persona.id}
          onChange={(e) => setPersona(e.target.value)}
          className="rounded-lg border border-line bg-ink-elevated px-2.5 py-1.5 text-xs text-fg-secondary outline-none focus:border-brand"
        >
          {PERSONAS.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.title}</option>)}
        </select>
        <a href="/login" className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-fg-muted transition-colors hover:text-fg">
          <LogOut size={12} /> Sign out
        </a>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        {myProjects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-fg-muted">
            No projects are linked to your account yet. Your account manager will be in touch.
          </div>
        )}
        {myProjects.map((p) => (
          <ProjectStatus key={p.id} project={p} tasks={liveTasks.filter((t) => t.projectId === p.id)} />
        ))}
      </main>
    </div>
  );
}

function ProjectStatus({ project, tasks }: { project: (typeof projects)[number]; tasks: Task[] }) {
  const h = HEALTH[project.health];
  const done = tasks.filter((t) => t.status === "COMPLETED");
  const active = tasks.filter((t) => ["IN_PROGRESS", "REVIEW", "CLIENT_REVIEW", "BLOCKED"].includes(t.status));
  const upcoming = tasks.filter((t) => ["TO_DO", "BACKLOG"].includes(t.status));
  const pct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;

  // Team: people with work on this project — names + roles only, no internal metrics.
  const team = Array.from(new Set(tasks.map((t) => t.assigneeId).filter(Boolean) as string[]))
    .map((id) => employeeById(id))
    .filter(Boolean);

  // Only delivery-relevant risks — never internal people/burnout risks.
  const clientRisks = seedRisks.filter(
    (r) => r.projectId === project.id && r.category !== "people" && r.status !== "CLOSED"
  );

  const targetDate = new Date(project.targetDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  return (
    <section className="space-y-5">
      {/* hero status */}
      <div className="rounded-2xl border border-line bg-ink-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{project.name}</h1>
            <p className="mt-1 max-w-lg text-sm text-fg-secondary">{project.description}</p>
          </div>
          <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", toneBg[h.tone], toneText[h.tone])}>
            {h.label}
          </span>
        </div>

        <p className={cn("mt-4 text-sm", toneText[h.tone])}>{h.msg}</p>

        {/* progress */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-2xs text-fg-muted">
            <span>{done.length} of {tasks.length} tasks done</span>
            <span className="font-mono">{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-elevated">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: h.tone === "danger" ? "#EF4444" : h.tone === "warn" ? "#F59E0B" : "#10B981" }} />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-2xs text-fg-muted">
            <Clock size={11} /> Target delivery: <span className="text-fg-secondary">{targetDate}</span>
          </div>
        </div>
      </div>

      {/* deadline / risk flags */}
      {(h.tone === "danger" || clientRisks.length > 0) && (
        <div className={cn("rounded-xl border p-4", h.tone === "danger" ? toneBg.danger : toneBg.warn)}>
          <div className={cn("flex items-center gap-2 text-xs font-semibold", h.tone === "danger" ? toneText.danger : toneText.warn)}>
            <ShieldAlert size={13} /> Things we're watching
          </div>
          <ul className="mt-2 space-y-1 text-xs text-fg-secondary">
            {h.tone === "danger" && <li>• This project is behind its target date — the team has it as top priority.</li>}
            {clientRisks.map((r) => (
              <li key={r.id}>• {r.title}{r.status === "ESCALATED" ? " (being escalated)" : ""}</li>
            ))}
          </ul>
        </div>
      )}

      {/* work columns */}
      <div className="grid gap-3 sm:grid-cols-3">
        <TaskColumn title="Done" icon={CheckCircle2} tone="ok" tasks={done} />
        <TaskColumn title="In progress" icon={CircleDot} tone="warn" tasks={active} />
        <TaskColumn title="Coming up" icon={Sparkles} tone="muted" tasks={upcoming} />
      </div>

      {/* team */}
      <div className="rounded-2xl border border-line bg-ink-surface p-5">
        <div className="mb-3 text-2xs font-semibold uppercase tracking-wider text-fg-muted">Your team ({team.length})</div>
        <div className="flex flex-wrap gap-3">
          {team.map((e) => e && (
            <div key={e.id} className="flex items-center gap-2">
              <EmpAvatar initials={e.initials} accent={e.accent} size={28} />
              <div>
                <div className="text-xs font-medium">{e.name}</div>
                <div className="text-2xs text-fg-muted">{e.title}</div>
              </div>
            </div>
          ))}
          {team.length === 0 && <div className="text-xs text-fg-faint">The team is being assigned.</div>}
        </div>
      </div>
    </section>
  );
}

function TaskColumn({ title, icon: Icon, tone, tasks }: { title: string; icon: React.ElementType; tone: string; tasks: Task[] }) {
  return (
    <div className="rounded-xl border border-line bg-ink-surface p-3">
      <div className="mb-2 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
        <Icon size={12} className={tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-fg-muted"} />
        {title} <span className="ml-auto font-mono">{tasks.length}</span>
      </div>
      <div className="space-y-1.5">
        {tasks.length === 0 && <div className="px-1 py-2 text-2xs text-fg-faint">Nothing here.</div>}
        {tasks.map((t) => (
          <div key={t.id} className="rounded-lg border border-line bg-ink-elevated/60 px-2.5 py-1.5 text-xs text-fg-secondary">
            {t.title}
          </div>
        ))}
      </div>
    </div>
  );
}
