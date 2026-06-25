"use client";

// Client Portal — what a customer sees when they log in. Deliberately narrow:
// only THEIR project(s). Designed to be understood in one glance by a non-
// technical client — a friendly status line, a progress ring, a Design → Build →
// Test → Launch timeline, then what's happening now / next / done, the team, and
// (only if relevant) a calm "what we're watching" note. No company data, no
// capacity %, no burnout, no financials, no other projects or people.

import * as React from "react";
import { BadgeCheck, Check, ChevronRight, CircleDot, Clock, LogOut, Send, ShieldAlert } from "lucide-react";
import { useOps } from "@/lib/store";
import { useSession, PERSONAS } from "@/lib/session";
import { projects, risks as seedRisks, employeeById } from "@/lib/data";
import { EmpAvatar } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { HealthStatus, Task } from "@/lib/types";

const HEALTH: Record<HealthStatus, { label: string; tone: string; line: string }> = {
  ON_TRACK: { label: "On track", tone: "ok", line: "Everything's on plan for your delivery date." },
  DELAYED: { label: "A little behind", tone: "warn", line: "A few things slipped — the team is catching up." },
  AT_RISK: { label: "Needs attention", tone: "warn", line: "Some parts are at risk — the team is on it." },
  BLOCKED: { label: "Blocked", tone: "danger", line: "Work is blocked and being escalated for you." },
  CRITICAL: { label: "Behind schedule", tone: "danger", line: "We're behind — the team has this as top priority." },
};

const toneText: Record<string, string> = { ok: "text-ok", warn: "text-warn", danger: "text-danger" };
const toneHex: Record<string, string> = { ok: "#10B981", warn: "#F59E0B", danger: "#EF4444" };

// The build journey, in words a client understands.
const PHASES: { key: string; label: string; labels: string[] }[] = [
  { key: "design", label: "Design", labels: ["design"] },
  { key: "build", label: "Build", labels: ["frontend", "backend", "database", "ai", "data", "devops"] },
  { key: "test", label: "Test", labels: ["testing"] },
  { key: "launch", label: "Launch", labels: ["launch"] },
];

export function ClientPortal() {
  const persona = useSession((s) => s.persona());
  const setPersona = useSession((s) => s.setPersona);
  const liveTasks = useOps((s) => s.tasks);
  const overrides = useOps((s) => s.projectOverrides);

  const myProjects = projects
    .filter((p) => p.customer === persona.customer)
    .map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p));

  return (
    <div className="h-screen overflow-y-auto bg-ink text-fg">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-ink-surface/85 px-6 py-3.5 backdrop-blur">
        <span className="grid h-9 w-9 place-items-center rounded-xl text-sm font-bold text-ink" style={{ background: persona.accent }}>
          {persona.initials}
        </span>
        <div className="flex-1">
          <div className="text-sm font-semibold">{persona.name}</div>
          <div className="text-2xs text-fg-muted">Your project, in plain English</div>
        </div>
        <select
          aria-label="Switch login"
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

      <main className="mx-auto max-w-3xl space-y-8 px-6 py-8">
        {myProjects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-fg-muted">
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
  const clientApproveTask = useOps((s) => s.clientApproveTask);
  const h = HEALTH[project.health];
  const done = tasks.filter((t) => t.status === "COMPLETED");
  const awaitingApproval = tasks.filter((t) => t.status === "CLIENT_REVIEW" || t.status === "REVIEW");
  const active = tasks.filter((t) => ["IN_PROGRESS", "BLOCKED"].includes(t.status));
  const upcoming = tasks.filter((t) => ["TO_DO", "BACKLOG"].includes(t.status));
  const pct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;

  const team = Array.from(new Set(tasks.map((t) => t.assigneeId).filter(Boolean) as string[]))
    .map((id) => employeeById(id))
    .filter(Boolean);

  const clientRisks = seedRisks.filter(
    (r) => r.projectId === project.id && r.category !== "people" && r.status !== "CLOSED"
  );

  // Phase progress from task labels.
  const phaseInfo = PHASES.map((ph) => {
    const phTasks = tasks.filter((t) => t.labels?.some((l) => ph.labels.includes(l)));
    const phDone = phTasks.filter((t) => t.status === "COMPLETED").length;
    const ratio = phTasks.length ? phDone / phTasks.length : null; // null = no work in this phase
    return { ...ph, count: phTasks.length, ratio };
  });
  const currentPhaseIdx = phaseInfo.findIndex((p) => p.ratio !== null && p.ratio < 1);

  const targetDate = new Date(project.targetDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  return (
    <section className="space-y-6">
      {/* hero — friendly status + progress ring */}
      <div className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-ink-surface to-ink-elevated/40">
        <div className="flex flex-col gap-6 p-7 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-semibold", `${toneText[h.tone]}`)} style={{ background: `${toneHex[h.tone]}1a` }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: toneHex[h.tone] }} /> {h.label}
              </span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight">{project.name}</h1>
            <p className={cn("mt-2 text-sm leading-relaxed", toneText[h.tone])}>{h.line}</p>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-fg-muted">{project.description}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink-surface/60 px-3 py-1.5 text-2xs text-fg-secondary">
              <Clock size={12} /> Delivery target: <span className="font-semibold text-fg">{targetDate}</span>
            </div>
          </div>
          <ProgressRing pct={pct} tone={toneHex[h.tone]} done={done.length} total={tasks.length} />
        </div>

        {/* phase timeline */}
        <div className="border-t border-line bg-ink/30 px-7 py-5">
          <div className="flex items-center justify-between">
            {phaseInfo.map((ph, i) => {
              const complete = ph.ratio === 1;
              const current = i === currentPhaseIdx;
              const dim = ph.ratio === null && i > (currentPhaseIdx === -1 ? PHASES.length : currentPhaseIdx);
              return (
                <React.Fragment key={ph.key}>
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <span
                      className={cn("grid h-8 w-8 place-items-center rounded-full border text-2xs font-bold transition-colors",
                        complete ? "border-ok bg-ok/15 text-ok"
                          : current ? "border-brand bg-brand/15 text-brand"
                            : "border-line bg-ink-elevated text-fg-faint")}
                    >
                      {complete ? <Check size={14} /> : current ? <CircleDot size={14} /> : i + 1}
                    </span>
                    <span className={cn("text-2xs font-medium", complete ? "text-ok" : current ? "text-fg" : dim ? "text-fg-faint" : "text-fg-muted")}>{ph.label}</span>
                  </div>
                  {i < phaseInfo.length - 1 && (
                    <div className="mx-1 h-px flex-1" style={{ background: complete ? toneHex.ok : "rgb(var(--line))" }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* gentle watch note */}
      {(h.tone === "danger" || clientRisks.length > 0) && (
        <div className="rounded-2xl border p-4" style={{ borderColor: `${toneHex[h.tone === "danger" ? "danger" : "warn"]}55`, background: `${toneHex[h.tone === "danger" ? "danger" : "warn"]}12` }}>
          <div className={cn("flex items-center gap-2 text-xs font-semibold", h.tone === "danger" ? toneText.danger : toneText.warn)}>
            <ShieldAlert size={14} /> What we&apos;re watching
          </div>
          <ul className="mt-2 space-y-1 text-xs text-fg-secondary">
            {h.tone === "danger" && <li>• We&apos;re behind the target date — the team is focused on recovery.</li>}
            {clientRisks.map((r) => <li key={r.id}>• {r.title}{r.status === "ESCALATED" ? " (being escalated)" : ""}</li>)}
          </ul>
        </div>
      )}

      {/* needs your approval */}
      {awaitingApproval.length > 0 && (
        <Block title="Waiting on your approval" hint="Sign off so the team can move on">
          <div className="space-y-2">
            {awaitingApproval.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/[0.05] px-3.5 py-3">
                <BadgeCheck size={16} className="shrink-0 text-brand" />
                <span className="min-w-0 flex-1 text-sm text-fg">{t.title}</span>
                <button
                  onClick={() => clientApproveTask(t.id)}
                  className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-ink transition-opacity hover:opacity-90"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </Block>
      )}

      {/* happening now */}
      <Block title="Happening now" hint="What the team is actively working on">
        {active.length === 0 ? <Empty>Nothing in progress right now.</Empty> : (
          <div className="grid gap-2 sm:grid-cols-2">
            {active.map((t) => (
              <div key={t.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-ink-surface px-3.5 py-3">
                <CircleDot size={14} className="shrink-0 text-warn" />
                <span className="text-sm text-fg">{t.title}</span>
              </div>
            ))}
          </div>
        )}
      </Block>

      {/* up next + done */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Block title="Coming up" hint="Planned next">
          <List tasks={upcoming} icon={ChevronRight} tone="muted" empty="Nothing queued." />
        </Block>
        <Block title="Recently done" hint="Completed work">
          <List tasks={done} icon={Check} tone="ok" empty="Nothing completed yet." />
        </Block>
      </div>

      {/* team */}
      <Block title="Your team" hint={`${team.length} ${team.length === 1 ? "person" : "people"} on your project`}>
        <div className="flex flex-wrap gap-3">
          {team.map((e) => e && (
            <div key={e.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-ink-surface px-3 py-2">
              <EmpAvatar initials={e.initials} accent={e.accent} size={30} />
              <div>
                <div className="text-xs font-semibold">{e.name}</div>
                <div className="text-2xs text-fg-muted">{e.title}</div>
              </div>
            </div>
          ))}
          {team.length === 0 && <Empty>The team is being assigned.</Empty>}
        </div>
      </Block>

      {/* message the team */}
      <Block title="Message the team" hint="Questions or feedback go straight to your project team">
        <MessageTeam projectName={project.name} />
      </Block>
    </section>
  );
}

function MessageTeam({ projectName }: { projectName: string }) {
  const persona = useSession((s) => s.persona());
  const addNotification = useOps((s) => s.addNotification);
  const [text, setText] = React.useState("");
  const [sent, setSent] = React.useState(false);

  function send() {
    const body = text.trim();
    if (!body) return;
    addNotification({
      id: `n-clientmsg-${Date.now()}`,
      klass: "manager_review",
      title: `Message from ${persona.name} (${projectName})`,
      body,
      at: new Date().toISOString(),
      read: false,
      entityRef: "/projects",
    });
    setText("");
    setSent(true);
    window.setTimeout(() => setSent(false), 4000);
  }

  return (
    <div className="rounded-xl border border-line bg-ink-surface p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Ask a question or share feedback…"
        className="w-full resize-none rounded-lg border border-line bg-ink-elevated px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-brand"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className={cn("text-2xs transition-opacity", sent ? "text-ok opacity-100" : "opacity-0")}>Sent to your team ✓</span>
        <button
          onClick={send}
          disabled={!text.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Send size={12} /> Send
        </button>
      </div>
    </div>
  );
}

function ProgressRing({ pct, tone, done, total }: { pct: number; tone: string; done: number; total: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div className="relative grid shrink-0 place-items-center">
      <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(var(--ink-elevated))" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={tone} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-2xl font-bold tracking-tight">{pct}%</span>
        <span className="text-2xs text-fg-muted">{done}/{total} done</span>
      </div>
    </div>
  );
}

function Block({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 flex items-baseline gap-2">
        <h2 className="font-display text-base font-bold tracking-tight">{title}</h2>
        <span className="text-2xs text-fg-muted">{hint}</span>
      </div>
      {children}
    </section>
  );
}

function List({ tasks, icon: Icon, tone, empty }: { tasks: Task[]; icon: React.ElementType; tone: string; empty: string }) {
  if (tasks.length === 0) return <Empty>{empty}</Empty>;
  return (
    <div className="space-y-1.5">
      {tasks.map((t) => (
        <div key={t.id} className="flex items-center gap-2 rounded-lg border border-line bg-ink-surface px-3 py-2 text-xs text-fg-secondary">
          <Icon size={13} className={tone === "ok" ? "text-ok" : "text-fg-muted"} />
          <span className={cn("truncate", tone === "ok" && "line-through opacity-70")}>{t.title}</span>
        </div>
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-line py-5 text-center text-2xs text-fg-faint">{children}</div>;
}
