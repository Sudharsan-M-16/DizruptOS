"use client";

// Executive Intelligence Command Center — summary plus drill-down.
// Big tiles with explanations, portfolio matrix, revenue-at-risk, morning brief.

/** Launch an OS app from anywhere — works both on the desktop and inside embedded iframes. */
function launchApp(id: string) {
  const ev = new CustomEvent("dizrupt:launch", { detail: { id } });
  window.dispatchEvent(ev);
  try { window.parent?.dispatchEvent(ev); } catch { /* cross-origin guard */ }
}
import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ArrowRight, Bot, Send, Shield, Sparkles, X } from "lucide-react";
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

// ── Inline Copilot quick-ask ─────────────────────────────────────────────────
function CopilotQuickAsk() {
  const [q, setQ] = React.useState("");
  const [answer, setAnswer] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const ask = async () => {
    if (!q.trim()) return;
    setLoading(true); setAnswer(null);
    try {
      const res = await fetch(`/api/v1/copilot?q=${encodeURIComponent(q.trim())}`);
      const d = await res.json();
      setAnswer(d.data?.answer ?? "No answer available.");
    } catch { setAnswer("Could not reach the AI. Try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="panel p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <Bot size={13} className="text-brand" />
        <span className="label-xs text-fg-muted">Ask the AI</span>
      </div>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="What should I focus on today?"
          className="h-9 flex-1 rounded-lg bg-ink-elevated/60 px-3 text-[13px] text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-brand/30"
          aria-label="Ask AI a question about your organization"
        />
        <button
          onClick={ask}
          disabled={loading || !q.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand transition-all hover:bg-brand/20 disabled:opacity-40"
          aria-label="Send question"
        >
          <Send size={13} />
        </button>
      </div>
      {(loading || answer) && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-ink-elevated/50 p-3">
          {loading ? (
            <span className="text-xs text-fg-muted animate-pulse">Thinking…</span>
          ) : (
            <>
              <p className="flex-1 text-xs leading-relaxed text-fg-secondary">{answer}</p>
              <button onClick={() => { setAnswer(null); setQ(""); }} className="shrink-0 text-fg-faint hover:text-fg" aria-label="Dismiss answer">
                <X size={12} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── What Changed feed ─────────────────────────────────────────────────────────
interface DeltaEvent {
  id: string; at: string; category: string; severity: string;
  title: string; detail: string; appId?: string;
}

function WhatChanged() {
  const [events, setEvents] = React.useState<DeltaEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/v1/intelligence/delta?since=24h")
      .then(r => r.json())
      .then(d => setEvents(d.data?.events ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const severityColor = (s: string) =>
    s === "critical" ? "#EF4444" : s === "high" ? "#F59E0B" : s === "medium" ? "#00ED82" : "rgb(var(--fg-muted))";

  return (
    <section className="panel p-5">
      <SectionHeader title="What changed — last 24h" hint="Events ranked by impact. Click to investigate." />
      <div className="space-y-2" aria-live="polite" aria-atomic="false">
        {loading && <p className="text-xs text-fg-muted animate-pulse">Loading changes…</p>}
        {!loading && events.length === 0 && <p className="text-xs text-fg-muted">No significant changes in the last 24h.</p>}
        {events.slice(0, 6).map((evt) => (
          <button
            key={evt.id}
            onClick={() => evt.appId && launchApp(evt.appId)}
            disabled={!evt.appId}
            className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-all hover:bg-ink-elevated/50 disabled:cursor-default"
          >
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: severityColor(evt.severity) }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-fg">{evt.title}</span>
                <span className="text-2xs text-fg-faint">{new Date(evt.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <p className="mt-0.5 truncate text-2xs text-fg-muted">{evt.detail}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Fragility Map ─────────────────────────────────────────────────────────────
function FragilityMap() {
  // Bus-factor: capabilities held by only 1 expert
  const busFactor = employees.reduce<Record<string, string[]>>((acc, emp) => {
    (emp.skills ?? []).forEach((skill: string) => {
      if (!acc[skill]) acc[skill] = [];
      acc[skill].push(emp.name);
    });
    return acc;
  }, {});
  const spof = Object.entries(busFactor)
    .filter(([, owners]) => owners.length === 1)
    .sort(() => Math.random() - 0.5) // shuffle for demo variety
    .slice(0, 5);

  const burnoutPeople = employees.filter((e) => e.burnoutFlag);

  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-center gap-2">
        <Shield size={13} className="text-danger" />
        <div>
          <div className="font-display text-sm font-semibold">Fragility Map</div>
          <div className="text-2xs text-fg-muted">Single points of failure in your org</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {spof.map(([skill, owners]) => (
          <button key={skill} onClick={() => launchApp("directory")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all hover:bg-ink-elevated/50">
            <AlertTriangle size={11} className="shrink-0 text-warn" />
            <span className="flex-1 truncate text-xs"><span className="font-medium text-fg">{skill}</span> <span className="text-fg-muted">— sole expert: {owners[0]}</span></span>
            <span className="label-xs text-danger">BUS FACTOR 1</span>
          </button>
        ))}
        {burnoutPeople.length > 0 && burnoutPeople.map((p) => (
          <button key={p.id} onClick={() => launchApp("directory")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all hover:bg-ink-elevated/50">
            <AlertTriangle size={11} className="shrink-0 text-danger" />
            <span className="flex-1 truncate text-xs"><span className="font-medium text-fg">{p.name}</span> <span className="text-fg-muted">— burnout flag active</span></span>
            <span className="label-xs text-danger">BURNOUT RISK</span>
          </button>
        ))}
        {spof.length === 0 && burnoutPeople.length === 0 && (
          <p className="text-xs text-fg-muted">No critical fragility points detected.</p>
        )}
      </div>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
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
      {/* Inline Copilot quick-ask */}
      <CopilotQuickAsk />
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
          spark={<SparkArea data={driftSeries.map((d) => d.ohi)} color="#00ED82" />}
        />
        <MetricTile
          label="Burnout flag rate"
          value={<NumberTicker value={Math.round(burnoutRate * 100)} suffix="%" />}
          delta="target < 5%"
          deltaGood={burnoutRate < 0.05}
          explanation="Flagged ÷ active. Signals: >50h × 3 weeks, no PTO 90d+, ≥100% utilization 7d+, reassignment churn."
          signals={active.filter((e) => e.burnoutFlag).map((e) => `${e.name} — ${e.burnoutSignals?.[0] ?? "Review required"}`)}
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
                    <stop offset="0%" stopColor="#00ED82" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00ED82" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgb(var(--line-subtle))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="w" tick={{ fill: "rgb(var(--fg-muted))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgb(var(--fg-muted))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <ReTooltip
                  contentStyle={{
                    background: "rgb(var(--ink-elevated))",
                    border: "1px solid rgb(var(--line))",
                    borderRadius: 10,
                    fontSize: 13,
                  }}
                  labelStyle={{ color: "rgb(var(--fg-secondary))" }}
                />
                <Area type="monotone" dataKey="ohi" name="OHI" stroke="#00ED82" strokeWidth={2} fill="url(#gOhi)" />
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
              <BriefLine appId="matrix">Atlas at CRITICAL: 7 overdue · QA 112% · velocity −38%</BriefLine>
              <BriefLine appId="directory">Sarah Okafor burnout flag — review privately</BriefLine>
            </BriefBlock>
            <BriefBlock tone="brand" title="Review required (3)">
              <BriefLine appId="home">2 agent proposals awaiting decision — 1 is a coordinated compromise</BriefLine>
              <BriefLine appId="home">Vendor slippage risk ESCALATED to account director</BriefLine>
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

      {/* What Changed + Fragility Map */}
      <div className="grid gap-6 xl:grid-cols-2">
        <WhatChanged />
        <FragilityMap />
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
                      <button onClick={() => launchApp("matrix")} className="flex items-center gap-2 text-xs font-medium hover:text-brand">
                        <span className="font-mono text-2xs text-fg-muted">{p.code}</span>
                        {p.name}
                      </button>
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
              <button onClick={() => launchApp("home")} className="flex items-center gap-1 text-2xs text-brand hover:underline">
                All goals <ArrowRight size={11} />
              </button>
            }
          />
          <div className="space-y-2.5">
            {goals.map((g) => (
              <button key={g.id} onClick={() => launchApp("home")} className="panel panel-hover block w-full p-3.5 text-left">
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
              </button>
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

function BriefLine({ appId, children }: { appId: string; children: React.ReactNode }) {
  return (
    <button onClick={() => launchApp(appId)} className="block w-full text-left text-2xs leading-relaxed text-fg-secondary transition-colors hover:text-fg">
      • {children}
    </button>
  );
}
