"use client";

// Command Center — the Resource Manager's Monday morning in one screen.
// Answers the persona's three questions: who has capacity, what's at risk, can we absorb more.

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Crosshair,
  Flame,
  Inbox,
  OctagonAlert,
  Zap,
} from "lucide-react";
import { CriticalFrame, NumberTicker } from "@/components/ui/ascension";
import { useOps } from "@/lib/store";
import { useSession } from "@/lib/session";
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
  MetricTile,
  SectionHeader,
} from "@/components/ui/primitives";
import { SparkArea, SparkBars } from "@/components/ui/spark";
import { cn, fmtPct, timeAgo, utilizationTone } from "@/lib/utils";

const stagger = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.25 },
  }),
};

export default function CommandCenter() {
  const utilization = useOps((s) => s.utilization);
  const proposals = useOps((s) => s.proposals);
  const audit = useOps((s) => s.audit);
  const canSeeBurnout = useSession((s) => s.can("view_burnout"));
  const week = WEEKS[0];

  const active = employees.filter((e) => e.role !== "client");
  const overloaded = active.filter((e) => utilization(e.id, week) >= 1);
  const available = active
    .filter((e) => utilization(e.id, week) < 0.8)
    .sort((a, b) => utilization(a.id, week) - utilization(b.id, week));
  const overRate = overloaded.length / active.length;
  const critical = projects.filter((p) => p.health === "CRITICAL" || p.health === "AT_RISK" || p.health === "DELAYED");
  const pending = proposals.filter((p) => p.status === "pending");
  const overdueCommitments = commitments.filter((c) => c.status === "overdue");

  // The operator queue: the three highest-leverage actions, computed from
  // live state, each one click from resolution. This is the screen's answer
  // to "what matters right now?"
  const compromise = pending.find((p) => p.conflict);
  const worstOverload = overloaded.sort(
    (a, b) => utilization(b.id, week) - utilization(a.id, week)
  )[0];

  return (
    <div className="space-y-6">
      {/* Situation banner — the single most important thing, framed once */}
      <motion.section custom={0} initial="hidden" animate="show" variants={stagger}>
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
              <h2 className="mt-1.5 font-display text-[17px] font-semibold leading-snug tracking-tight">
                Atlas Payments Migration is CRITICAL —{" "}
                <span className="text-danger">$4.2M ARR exposed</span>
              </h2>
              <p className="mt-1 text-2xs leading-relaxed text-fg-secondary">
                7 tasks overdue · QA at 112% · velocity −38% vs 3-sprint average ·
                vendor settlement file 8 days late. The negotiation coordinator has a
                compromise staged.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
              {compromise && (
                <Link href="/proposals">
                  <Button className="w-full">
                    <Zap size={12} /> Review compromise
                  </Button>
                </Link>
              )}
              {worstOverload && (
                <Link href="/capacity">
                  <Button variant="secondary" className="w-full">
                    <Flame size={12} /> Relieve {worstOverload.name.split(" ")[0]} ·{" "}
                    {fmtPct(utilization(worstOverload.id, week))}
                  </Button>
                </Link>
              )}
              <Link href="/projects/p-atlas">
                <Button variant="secondary" className="w-full">
                  <Crosshair size={12} /> Open Atlas
                </Button>
              </Link>
            </div>
          </div>
        </CriticalFrame>
      </motion.section>

      {/* Metric row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          <MetricTile
            key="m1"
            label="Over-allocation rate"
            value={<NumberTicker value={Math.round(overRate * 100)} suffix="%" />}
            delta="−9 pts vs last week"
            deltaGood
            explanation={`${overloaded.length} of ${active.length} active people at ≥100% this week. Target < 10%.`}
            signals={[
              ...overloaded.map(
                (e) => `${e.name} at ${fmtPct(utilization(e.id, week))} — ${e.title}`
              ),
              "Definition: Σ estimated hours due this week ÷ weekly capacity ≥ 1.0",
            ]}
            spark={<SparkBars data={[22, 19, 17, 14, 12, Math.round(overRate * 100)]} color="#F59E0B" />}
          />,
          <MetricTile
            key="m2"
            label="Projects needing attention"
            value={`${critical.length} of ${projects.length}`}
            delta="Atlas degraded to Critical"
            deltaGood={false}
            explanation="Health is auto-calculated from overdue ratio, stalled dependencies, and velocity — never manually set."
            signals={critical.map((p) => `${p.name}: ${p.healthReasons[0]}`)}
            spark={<SparkArea data={[1, 1, 2, 2, 3, critical.length]} color="#EF4444" />}
          />,
          <MetricTile
            key="m3"
            label="Agent proposals pending"
            value={<NumberTicker value={pending.length} />}
            explanation="Negotiation coordinator already merged 1 burnout/delivery conflict into a single compromise card."
            signals={pending.map((p) => `${p.title} (${Math.round(p.confidence * 100)}% confidence)`)}
            spark={<SparkBars data={[2, 4, 3, 5, 4, pending.length]} color="#6366F1" />}
          />,
          <MetricTile
            key="m4"
            label="Commitments overdue"
            value={<NumberTicker value={overdueCommitments.length} />}
            explanation="Promises by named people — tracked separately from tasks. Oldest: vendor spec sign-off, due Jun 9."
            signals={commitments.map(
              (c) =>
                `${employeeById(c.ownerId)?.name} → ${employeeById(c.toId)?.name}: ${c.title} (${c.status})`
            )}
            spark={<SparkArea data={[0, 1, 0, 1, 1, overdueCommitments.length]} color="#F59E0B" />}
          />,
        ].map((tile, i) => (
          <motion.div key={i} custom={i} initial="hidden" animate="show" variants={stagger}>
            {tile}
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Capacity hotlist — the wedge, two clicks from resolution */}
        <motion.section custom={4} initial="hidden" animate="show" variants={stagger} className="xl:col-span-3">
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
            })].slice(0, 5).map((e) => {
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

        {/* Agent inbox preview */}
        <motion.section custom={5} initial="hidden" animate="show" variants={stagger} className="xl:col-span-2">
          <SectionHeader
            title="Needs your decision"
            hint="Agents propose, you decide — in two clicks."
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

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Portfolio strip */}
        <motion.section custom={6} initial="hidden" animate="show" variants={stagger} className="xl:col-span-3">
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

        {/* Live audit feed */}
        <motion.section custom={7} initial="hidden" animate="show" variants={stagger} className="xl:col-span-2">
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
            {audit.slice(0, 6).map((a) => {
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
      </div>
    </div>
  );
}
