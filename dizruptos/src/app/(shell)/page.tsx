"use client";

// Command Center — the Resource Manager's Monday morning in one screen.
// Answers the persona's three questions: who has capacity, what's at risk, can we absorb more.

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Crosshair,
  Flame,
  Inbox,
  ListChecks,
  OctagonAlert,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { CriticalFrame, NumberTicker } from "@/components/ui/ascension";
import { useOps } from "@/lib/store";
import { PERSONAS, useSession } from "@/lib/session";
import { proposalsForRole } from "@/lib/rbac";
import {
  commitments,
  employeeById,
  employees,
  projects,
  WEEKS,
} from "@/lib/data";
import {
  Button,
  CapacityBar,
  EmpAvatar,
  Explain,
  HealthPill,
  SectionHeader,
} from "@/components/ui/primitives";
import { SparkArea } from "@/components/ui/spark";
import { cn, fmtPct, timeAgo, utilizationTone } from "@/lib/utils";

// Each pulse stat drills into the page that explains/acts on it — the number
// is a doorway, not just a readout.
const PULSE_HREF: Record<string, string> = {
  "Over-allocation": "/capacity",
  "Projects at risk": "/projects",
  "Awaiting decision": "/proposals",
  "Commitments overdue": "/people",
  "Your load": "/capacity",
  "Open tasks": "/projects",
  "Your requests": "/proposals",
  "Projects you're on": "/projects",
};

// Hero metric visual identity — icon + accent per stat (Monday-style KPI tiles,
// rendered in DIZRUPT's dark palette with a tinted corner gradient).
const PULSE_META: Record<string, { icon: React.ElementType; accent: string }> = {
  "Over-allocation": { icon: Flame, accent: "#F59E0B" },
  "Projects at risk": { icon: ShieldAlert, accent: "#EF4444" },
  "Awaiting decision": { icon: Inbox, accent: "#00ED82" },
  "Commitments overdue": { icon: Clock, accent: "#38BDF8" },
  "Your load": { icon: Flame, accent: "#F59E0B" },
  "Open tasks": { icon: ListChecks, accent: "#2BD9FF" },
  "Your requests": { icon: Inbox, accent: "#00ED82" },
  "Projects you're on": { icon: Crosshair, accent: "#38BDF8" },
};

export default function CommandCenter() {
  const utilization = useOps((s) => s.utilization);
  const allProposals = useOps((s) => s.proposals);
  const tasks = useOps((s) => s.tasks);
  const audit = useOps((s) => s.audit);
  const canSeeBurnout = useSession((s) => s.can("view_burnout"));
  const canReview = useSession((s) => s.can("review_proposals"));
  const canSeeCapacity = useSession((s) => s.can("view_capacity"));
  const canSeeAudit = useSession((s) => s.can("view_audit"));
  const personaId = useSession((s) => s.personaId);
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  const isEmployee = persona.role === "employee" || persona.role === "client";
  const week = WEEKS[0];

  const active = employees.filter((e) => e.role !== "client");
  const overloaded = active.filter((e) => utilization(e.id, week) >= 1);
  const available = active
    .filter((e) => utilization(e.id, week) < 0.8)
    .sort((a, b) => utilization(a.id, week) - utilization(b.id, week));
  const overRate = overloaded.length / active.length;
  const critical = projects.filter((p) => p.health === "CRITICAL" || p.health === "AT_RISK" || p.health === "DELAYED");
  // Dynamic view: every count and queue is the viewer's slice, never the org's.
  const proposals = proposalsForRole(allProposals, persona.role, persona.id);
  const pending = proposals.filter((p) => p.status === "pending");
  const overdueCommitments = commitments.filter((c) => c.status === "overdue");

  // Employee personal slice
  const myUtil = utilization(persona.id, week);
  const myTasks = tasks.filter(
    (t) => t.assigneeId === persona.id && t.status !== "COMPLETED"
  );
  const myDueThisWeek = myTasks.filter((t) => t.weekStart === week);

  // The pulse strip is the viewer's pulse, not the org's: managers read the
  // org; employees read their own week.
  const pulseStats = isEmployee
    ? [
        {
          label: "Your load",
          value: <NumberTicker value={Math.round(myUtil * 100)} suffix="%" />,
          delta: myUtil >= 1 ? "over capacity" : myUtil >= 0.8 ? "near limit" : "healthy",
          good: myUtil < 0.8,
          signals: [
            `${Math.round(myUtil * 100)}% of your ${employeeById(persona.id)?.capacityHoursPerWeek ?? 40}h week is allocated`,
            "Definition: Σ estimated hours due this week ÷ your weekly capacity",
          ],
        },
        {
          label: "Open tasks",
          value: <NumberTicker value={myTasks.length} />,
          delta: `${myDueThisWeek.length} due this week`,
          good: myDueThisWeek.length <= 2,
          signals: myTasks.map((t) => `${t.title} (${t.estimatedHours}h · ${t.status.replace("_", " ").toLowerCase()})`),
        },
        {
          label: "Your requests",
          value: <NumberTicker value={pending.length} />,
          delta: pending.length ? "needs your reply" : "all clear",
          good: pending.length === 0,
          signals: pending.map((p) => p.title),
        },
        {
          label: "Projects you're on",
          value: <NumberTicker value={new Set(myTasks.map((t) => t.projectId)).size} />,
          delta: "see portfolio below",
          good: true,
          signals: Array.from(new Set(myTasks.map((t) => t.projectId))).map(
            (id) => projects.find((p) => p.id === id)?.name ?? id
          ),
        },
      ]
    : [
        {
          label: "Over-allocation",
          value: <NumberTicker value={Math.round(overRate * 100)} suffix="%" />,
          delta: "−9 pts wk/wk",
          good: true,
          signals: [
            ...overloaded.map(
              (e) => `${e.name} at ${fmtPct(utilization(e.id, week))} — ${e.title}`
            ),
            "Definition: Σ estimated hours due this week ÷ weekly capacity ≥ 1.0",
          ],
        },
        {
          label: "Projects at risk",
          value: (
            <>
              <NumberTicker value={critical.length} />
              <span className="text-sm font-normal text-fg-muted"> / {projects.length}</span>
            </>
          ),
          delta: "Atlas → Critical",
          good: false,
          signals: critical.map((p) => `${p.name}: ${p.healthReasons[0]}`),
        },
        {
          label: "Awaiting decision",
          value: <NumberTicker value={pending.length} />,
          delta: "1 compromise staged",
          good: true,
          signals: pending.map(
            (p) => `${p.title} (${Math.round(p.confidence * 100)}% confidence)`
          ),
        },
        {
          label: "Commitments overdue",
          value: <NumberTicker value={overdueCommitments.length} />,
          delta: "oldest due Jun 9",
          good: false,
          signals: commitments.map(
            (c) =>
              `${employeeById(c.ownerId)?.name} → ${employeeById(c.toId)?.name}: ${c.title} (${c.status})`
          ),
        },
      ];

  // The operator queue: the three highest-leverage actions, computed from
  // live state, each one click from resolution. This is the screen's answer
  // to "what matters right now?"
  const compromise = pending.find((p) => p.conflict);
  const worstOverload = overloaded.sort(
    (a, b) => utilization(b.id, week) - utilization(a.id, week)
  )[0];

  return (
    <div className="space-y-10">
      {/* Situation banner — the single most important thing, framed once */}
      <motion.section custom={0} initial={false}>
        <CriticalFrame tone="danger">
          <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2">
                  <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-danger opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
                </span>
                <span className="label-xs text-danger">Situation · right now</span>
              </div>
              <h2 className="mt-1.5 font-display text-xl font-bold leading-snug tracking-tight">
                Atlas Payments Migration is CRITICAL —{" "}
                <span className="text-danger">$4.2M ARR exposed</span>
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-fg-secondary">
                7 tasks overdue · QA at 112% · velocity −38% vs 3-sprint average ·
                vendor settlement file 8 days late. The negotiation coordinator has a
                compromise staged.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
              {/* Actions are permissions, not decoration: employees see the
                  situation but can't arbitrate it. */}
              {canReview && compromise && (
                <Link href="/proposals">
                  <Button className="w-full">
                    <Zap size={12} /> Review compromise
                  </Button>
                </Link>
              )}
              {canSeeCapacity && worstOverload && (
                <Link href="/capacity">
                  <Button variant="secondary" className="w-full">
                    <Flame size={12} /> Relieve {worstOverload.name.split(" ")[0]} ·{" "}
                    {fmtPct(utilization(worstOverload.id, week))}
                  </Button>
                </Link>
              )}
              <Link href="/projects/p-atlas">
                <Button variant={canReview ? "secondary" : "primary"} className="w-full">
                  <Crosshair size={12} /> Open Atlas
                </Button>
              </Link>
            </div>
          </div>
        </CriticalFrame>
      </motion.section>

      {/* Hero metric tiles — the first glance. Each is a premium KPI card
          (tinted by its accent), fully clickable to its page, with the Explain
          popover and trend kept interactive above the click layer. */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {pulseStats.map((s) => {
          const meta = PULSE_META[s.label] ?? { icon: Zap, accent: "#00ED82" };
          const Icon = meta.icon;
          return (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-card border border-line p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
              style={{
                background: `radial-gradient(120% 120% at 0% 0%, ${meta.accent}1f, transparent 55%), rgb(var(--ink-surface))`,
                boxShadow: `inset 0 1px 0 0 rgb(255 255 255 / 0.04)`,
              }}
            >
              {/* full-card click target (under the content) */}
              <Link
                href={PULSE_HREF[s.label] ?? "/"}
                aria-label={`Open ${s.label}`}
                className="absolute inset-0 z-0"
              />
              <div className="pointer-events-none relative z-10">
                <div className="flex items-start justify-between">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-xl border"
                    style={{ borderColor: `${meta.accent}40`, background: `${meta.accent}14`, color: meta.accent }}
                  >
                    <Icon size={20} />
                  </span>
                  <span className="pointer-events-auto relative z-20">
                    <Explain title={s.label} signals={s.signals} />
                  </span>
                </div>
                <div className="mt-5 font-display text-[2.5rem] font-bold leading-none tracking-tight">
                  {s.value}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-fg-muted">{s.label}</span>
                  <span className={cn("shrink-0 text-xs font-semibold", s.good ? "text-ok" : "text-warn")}>
                    {s.delta}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-7 xl:grid-cols-5">
        {/* Capacity hotlist — managers only; employees get their own week */}
        {canSeeCapacity ? (
        <motion.section custom={4} initial={false} className="xl:col-span-3">
          <SectionHeader
            title="Capacity hotlist — week of Jun 8"
            hint="Click a person to open the heatmap; resolve overloads by dragging work to green."
            right={
              <Link href="/capacity">
                <Button variant="secondary">
                  <Flame size={12} /> Open heatmap <ArrowRight size={12} />
                </Button>
              </Link>
            }
          />
          <div className="panel divide-y divide-line-subtle">
            {[...overloaded, ...active.filter((e) => {
              const u = utilization(e.id, week);
              return u >= 0.8 && u < 1;
            })].slice(0, 4).map((e) => {
              const pct = utilization(e.id, week);
              return (
                <Link
                  key={e.id}
                  href="/capacity"
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-elevated/60"
                >
                  <EmpAvatar initials={e.initials} accent={e.accent} size={30} />
                  <div className="w-44 min-w-0">
                    <div className="truncate text-xs font-semibold">{e.name}</div>
                    <div className="truncate text-2xs text-fg-muted">{e.title}</div>
                  </div>
                  <CapacityBar pct={pct} className="flex-1" />
                  <span
                    className={cn(
                      "w-12 text-right font-mono text-xs font-semibold",
                      utilizationTone(pct) === "danger"
                        ? "text-danger"
                        : utilizationTone(pct) === "warn"
                          ? "text-warn"
                          : "text-ok"
                    )}
                  >
                    {fmtPct(pct)}
                  </span>
                  {e.burnoutFlag && canSeeBurnout && (
                    <Explain
                      title="Burnout signals (manager-private)"
                      signals={e.burnoutSignals ?? []}
                    >
                      <button className="rounded-full border border-danger/40 bg-danger-soft px-2 py-px text-2xs font-semibold text-danger">
                        burnout
                      </button>
                    </Explain>
                  )}
                </Link>
              );
            })}
            <div className="flex items-center gap-2 px-4 py-2.5 text-2xs text-fg-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" />
              Most available: {available.slice(0, 3).map((e) => `${e.name.split(" ")[0]} (${fmtPct(utilization(e.id, week))})`).join(" · ")}
            </div>
          </div>
        </motion.section>
        ) : (
        /* ----------------------- Your week (employee) ----------------------- */
        <motion.section custom={4} initial={false} className="xl:col-span-3">
          <SectionHeader
            title={`Your week — ${persona.name.split(" ")[0]}`}
            hint="What's on your plate, in the order it's due."
          />
          <div className="panel divide-y divide-line-subtle">
            <div className="flex items-center gap-4 px-4 py-3.5">
              <span className="label-xs w-24 shrink-0">Your load</span>
              <CapacityBar pct={myUtil} className="flex-1" />
              <span className="w-12 text-right font-mono text-xs font-semibold text-ok">
                {fmtPct(myUtil)}
              </span>
            </div>
            {myTasks.slice(0, 5).map((t) => (
              <button
                key={t.id}
                onClick={() => useOps.getState().openTaskDrawer(t.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-elevated/60"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{t.title}</span>
                  <span className="text-2xs text-fg-muted">
                    {projects.find((pr) => pr.id === t.projectId)?.name} · week of {t.weekStart.slice(5)}
                  </span>
                </span>
                <span className="font-mono text-2xs text-fg-secondary">{t.estimatedHours}h</span>
                <span className="rounded-full border border-line bg-ink-elevated px-2 py-px text-2xs capitalize text-fg-secondary">
                  {t.status.replace("_", " ").toLowerCase()}
                </span>
              </button>
            ))}
          </div>
        </motion.section>
        )}

        {/* Agent inbox preview — scoped: managers decide, employees respond */}
        <motion.section custom={5} initial={false} className="xl:col-span-2">
          <SectionHeader
            title={isEmployee ? "Your requests" : "Needs your decision"}
            hint={
              isEmployee
                ? "Agents and managers stage things here that concern you."
                : "Agents propose, you decide — in two clicks."
            }
            right={
              <Link href="/proposals">
                <Button variant="secondary">
                  <Inbox size={12} /> Inbox <ArrowRight size={12} />
                </Button>
              </Link>
            }
          />
          <div className="space-y-2.5">
            {pending.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                href="/proposals"
                className="panel panel-hover block p-3.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-px text-2xs font-semibold",
                      p.priority >= 100
                        ? "bg-danger-soft text-danger"
                        : p.priority >= 70
                          ? "bg-warn-soft text-warn"
                          : "bg-brand-soft text-brand"
                    )}
                  >
                    {p.agentType.replace("_", " ")}
                  </span>
                  {p.conflict && (
                    <span className="rounded-full border border-line bg-ink-elevated px-2 py-px text-2xs text-fg-secondary">
                      coordinated compromise
                    </span>
                  )}
                  <span className="ml-auto font-mono text-2xs text-fg-muted">
                    {Math.round(p.confidence * 100)}%
                  </span>
                </div>
                <div className="mt-2 text-xs font-semibold leading-snug">{p.title}</div>
                <p className="mt-1 line-clamp-2 text-2xs leading-relaxed text-fg-secondary">
                  {p.summary}
                </p>
              </Link>
            ))}
          </div>
        </motion.section>
      </div>

      <div className="grid gap-7 xl:grid-cols-5">
        {/* Portfolio strip */}
        <motion.section
          initial={false}
          className={cn("xl:col-span-3", !canSeeAudit && "xl:col-span-5")}
        >
          <SectionHeader title="Portfolio health" hint="Click any project for the causal breakdown." />
          <div className="grid gap-3 md:grid-cols-2">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="panel panel-hover p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-ink-elevated px-1.5 py-px font-mono text-2xs text-fg-muted">
                    {p.code}
                  </span>
                  <span className="truncate text-xs font-semibold">{p.name}</span>
                  <HealthPill health={p.health} pulse className="ml-auto" />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-9 flex-1">
                    <SparkArea
                      data={p.velocityTrend}
                      color={p.health === "CRITICAL" ? "#EF4444" : p.health === "ON_TRACK" ? "#10B981" : "#F59E0B"}
                    />
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-fg-secondary">
                      {Math.round((p.consumedHours / p.budgetHours) * 100)}% budget
                    </div>
                    <div className="text-2xs text-fg-muted">velocity 6-sprint</div>
                  </div>
                </div>
                <p className="mt-2.5 truncate border-t border-line-subtle pt-2 text-2xs text-fg-muted">
                  {p.healthReasons[0]}
                </p>
              </Link>
            ))}
          </div>
        </motion.section>

        {/* Live audit feed — permission-gated (view_audit) */}
        {canSeeAudit && (
        <motion.section custom={7} initial={false} className="xl:col-span-2">
          <SectionHeader
            title="Activity — audit trail"
            hint="Insert-only. Every state change, attributed."
            right={
              <Link href="/audit">
                <Button variant="ghost">
                  Full log <ArrowRight size={12} />
                </Button>
              </Link>
            }
          />
          <div className="panel divide-y divide-line-subtle">
            {audit.slice(0, 4).map((a) => {
              const actor = employeeById(a.actorId);
              return (
                <div key={a.id} className="flex gap-3 px-4 py-3">
                  {actor && (
                    <EmpAvatar initials={actor.initials} accent={actor.accent} size={24} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-2xs text-brand">
                        {a.actionType}
                      </span>
                      <span className="ml-auto shrink-0 text-2xs text-fg-faint">
                        {timeAgo(a.at)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-2xs text-fg-secondary">
                      <span className="text-fg">{a.entityLabel}</span> — {a.detail}
                    </p>
                    {a.overrideReason && (
                      <p className="mt-1 flex items-center gap-1 text-2xs text-warn">
                        <OctagonAlert size={10} /> override: “{a.overrideReason}”
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
        )}
      </div>
    </div>
  );
}
