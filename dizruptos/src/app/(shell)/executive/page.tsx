"use client";

// Executive Intelligence Command Center — summary plus drill-down.
// Big tiles with explanations, portfolio matrix, revenue-at-risk, morning brief.

import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, Sparkles } from "lucide-react";
import { useOps } from "@/lib/store";
import { employees, goals, projects, risks, WEEKS } from "@/lib/data";
import {
  CapacityBar,
  Explain,
  HealthPill,
  MetricTile,
  SectionHeader,
} from "@/components/ui/primitives";
import { SparkArea } from "@/components/ui/spark";
import { NumberTicker } from "@/components/ui/ascension";
import { cn, fmtPct } from "@/lib/utils";

const driftSeries = [
  { w: "Apr 27", drift: 12, ohi: 78 },
  { w: "May 4", drift: 14, ohi: 77 },
  { w: "May 11", drift: 16, ohi: 76 },
  { w: "May 18", drift: 18, ohi: 74 },
  { w: "May 25", drift: 21, ohi: 73 },
  { w: "Jun 1", drift: 22, ohi: 72 },
  { w: "Jun 8", drift: 23, ohi: 72 },
];

export default function ExecutivePage() {
  const utilization = useOps((s) => s.utilization);
  const active = employees.filter((e) => e.role !== "client");
  const overRate =
    active.filter((e) => utilization(e.id, WEEKS[0]) >= 1).length / active.length;

  // Revenue at risk ($4.2M) = ARR of customers on CRITICAL projects (PRD §22.2)
  const burnoutRate =
    active.filter((e) => e.burnoutFlag).length / active.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricTile
          label="Revenue at risk"
          value={<NumberTicker value={4.2} prefix="$" suffix="M" decimals={1} />}
          delta="Acme Corp exposure"
          deltaGood={false}
          explanation="Σ ARR of customers linked to CRITICAL projects. Traced via Project → serves → Customer edges."
          signals={[
            "Acme Corp ($4.2M ARR) depends on Atlas Payments Migration — CRITICAL",
            "Capability 'Payments' threatened by bus-factor risk r-1",
            "Renewal signed (KR 90%) but delivery slippage voids goodwill",
          ]}
          spark={<SparkArea data={[1.1, 1.4, 2.0, 2.8, 3.6, 4.2]} color="#EF4444" />}
        />
        <MetricTile
          label="Strategy drift"
          value={<NumberTicker value={23} suffix="%" />}
          delta="+2 pts this week"
          deltaGood={false}
          explanation="Hours on work not linked to active goals ÷ total hours. 21–35% = Moderate Drift → immediate manager review."
          signals={[
            "Drift = 100 − (goal-linked hours ÷ total hours × 100)",
            "Largest unlinked block: internal tooling requests (34h last week)",
            "Threshold table: >35% triggers executive alert",
          ]}
          spark={<SparkArea data={driftSeries.map((d) => d.drift)} color="#F59E0B" />}
        />
        <MetricTile
          label="Org Health Index"
          value={<NumberTicker value={72} />}
          delta="−6 since May"
          deltaGood={false}
          explanation="Weighted: fairness 20% · manager effectiveness 25% · stability 15% · psych safety 20% · recognition 10% · meetings 10%. Target > 75."
          signals={[
            "Workload fairness degraded: Gini of utilization up 0.08",
            "1 burnout flag active (Sarah Okafor) — weighs on fairness axis",
            "Meeting health stable: 14% of hours in meetings",
          ]}
          spark={<SparkArea data={driftSeries.map((d) => d.ohi)} color="#6366F1" />}
        />
        <MetricTile
          label="Burnout flag rate"
          value={<NumberTicker value={Math.round(burnoutRate * 100)} suffix="%" />}
          delta="target < 5%"
          deltaGood={burnoutRate < 0.05}
          explanation="Flagged ÷ active. Signals: >50h × 3 weeks, no PTO 90d+, ≥100% utilization 7d+, reassignment churn."
          signals={active.filter((e) => e.burnoutFlag).map((e) => `${e.name} — ${e.burnoutSignals?.[0]}`)}
          spark={<SparkArea data={[0, 0, 3, 6, 6, Math.round(burnoutRate * 100)]} color="#EF4444" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Drift + OHI chart */}
        <section className="panel p-5 xl:col-span-3">
          <SectionHeader
            title="Strategy drift vs organizational health — 7 weeks"
            hint="When drift climbs, OHI follows it down two weeks later. The causal pair to watch."
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={driftSeries} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="gDrift" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOhi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgb(var(--line-subtle))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="w" tick={{ fill: "rgb(var(--fg-muted))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgb(var(--fg-muted))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <ReTooltip
                  contentStyle={{
                    background: "rgb(var(--ink-elevated))",
                    border: "1px solid rgb(var(--line))",
                    borderRadius: 10,
                    fontSize: 11,
                  }}
                  labelStyle={{ color: "rgb(var(--fg-secondary))" }}
                />
                <Area type="monotone" dataKey="ohi" name="OHI" stroke="#6366F1" strokeWidth={2} fill="url(#gOhi)" />
                <Area type="monotone" dataKey="drift" name="Drift %" stroke="#F59E0B" strokeWidth={2} fill="url(#gDrift)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Morning brief */}
        <section className="panel p-5 xl:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={13} className="text-brand" />
            <div>
              <div className="font-display text-sm font-semibold">Daily Brief — Wed, Jun 10</div>
              <div className="text-2xs text-fg-muted">
                AI-generated · every claim links to its source entity
              </div>
            </div>
          </div>
          <div className="space-y-3 text-xs leading-relaxed">
            <BriefBlock tone="danger" title="Critical attention">
              <BriefLine href="/projects/p-atlas">Atlas at CRITICAL: 7 overdue · QA 112% · velocity −38%</BriefLine>
              <BriefLine href="/people/u-sarah">Sarah Okafor burnout flag — review privately</BriefLine>
            </BriefBlock>
            <BriefBlock tone="brand" title="Review required (3)">
              <BriefLine href="/proposals">2 agent proposals awaiting decision — 1 is a coordinated compromise</BriefLine>
              <BriefLine href="/risks">Vendor slippage risk ESCALATED to account director</BriefLine>
            </BriefBlock>
            <BriefBlock tone="ok" title="No action needed">
              <span className="text-fg-muted">Pulse and Orbit on track · Helio design handoff recovered 2 of 4 lost days.</span>
            </BriefBlock>
          </div>
          <div className="mt-4 border-t border-line-subtle pt-3 text-2xs text-fg-muted">
            AI-Generated — verify before sharing · sources attributed inline
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Portfolio matrix */}
        <section className="xl:col-span-3">
          <SectionHeader title="Portfolio health matrix" hint="Budget burn vs schedule — health badges are computed, with causes one click away." />
          <div className="panel overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line-subtle bg-ink-elevated/40">
                  {["Project", "Health", "Burn", "Velocity", "Why"].map((h) => (
                    <th key={h} className="label-xs px-4 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-b border-line-subtle last:border-0 hover:bg-ink-elevated/40">
                    <td className="px-4 py-3">
                      <Link href={`/projects/${p.id}`} className="flex items-center gap-2 text-xs font-medium hover:text-brand">
                        <span className="font-mono text-2xs text-fg-muted">{p.code}</span>
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><HealthPill health={p.health} /></td>
                    <td className="px-4 py-3">
                      <div className="flex w-28 items-center gap-2">
                        <CapacityBar pct={(p.consumedHours / p.budgetHours) * 0.8} className="flex-1" height={5} />
                        <span className="font-mono text-2xs text-fg-secondary">
                          {Math.round((p.consumedHours / p.budgetHours) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-7 w-20">
                        <SparkArea data={p.velocityTrend} color={p.health === "CRITICAL" ? "#EF4444" : "#10B981"} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Explain title={`${p.name} health`} signals={p.healthReasons} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* OKR scorecard */}
        <section className="xl:col-span-2">
          <SectionHeader
            title="OKR scorecard"
            hint="Goal → project → hours, fully traceable."
            right={
              <Link href="/goals" className="flex items-center gap-1 text-2xs text-brand hover:underline">
                All goals <ArrowRight size={11} />
              </Link>
            }
          />
          <div className="space-y-2.5">
            {goals.map((g) => (
              <Link key={g.id} href="/goals" className="panel panel-hover block p-3.5">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-semibold">{g.title}</span>
                  <span
                    className={cn(
                      "ml-auto font-mono text-2xs font-semibold",
                      g.progress >= 0.6 ? "text-ok" : g.progress >= 0.4 ? "text-warn" : "text-danger"
                    )}
                  >
                    {fmtPct(g.progress)}
                  </span>
                </div>
                <CapacityBar pct={g.progress * 0.79} className="mt-2" height={5} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function BriefBlock({
  tone,
  title,
  children,
}: {
  tone: "danger" | "brand" | "ok";
  title: string;
  children: React.ReactNode;
}) {
  const tones = {
    danger: "border-danger/30 text-danger",
    brand: "border-brand/30 text-brand",
    ok: "border-ok/30 text-ok",
  };
  return (
    <div className={cn("rounded-lg border bg-ink-elevated/50 p-3", tones[tone].split(" ")[0])}>
      <div className={cn("label-xs mb-1.5", tones[tone].split(" ")[1])}>{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function BriefLine({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block text-2xs leading-relaxed text-fg-secondary transition-colors hover:text-fg">
      • {children}
    </Link>
  );
}
