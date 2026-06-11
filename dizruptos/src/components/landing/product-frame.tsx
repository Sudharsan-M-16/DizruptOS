"use client";

// The hero product preview — a miniature Command Center rendered in pure DOM
// (the CSP forbids external images, and DOM stays crisp at any tilt). Every
// region mirrors a real screen in the product: KPI tiles, the capacity
// heatmap, the velocity chart, the agent inbox.

import * as React from "react";
import { Flame, GitBranch, Inbox, LayoutDashboard, ShieldAlert, Users, Zap } from "lucide-react";
import { DizruptMark } from "@/components/ui/logo";
import { NumberTicker } from "@/components/ui/ascension";

const HEAT = [
  [0.62, 0.81, 0.44, 0.93, 0.71, 0.55, 0.88, 0.67],
  [0.48, 0.59, 1.08, 0.74, 0.52, 0.96, 0.61, 0.7],
  [0.83, 0.66, 0.57, 0.49, 1.13, 0.78, 0.69, 0.58],
  [0.55, 0.92, 0.73, 0.64, 0.6, 0.51, 0.97, 0.85],
];

function heatColor(v: number) {
  if (v > 1) return "rgba(239,68,68,0.75)";
  if (v > 0.85) return "rgba(245,158,11,0.65)";
  return `rgba(0,237,130,${0.18 + v * 0.45})`;
}

const SPARK = [34, 48, 41, 62, 55, 74, 68, 86, 79, 95];

export function ProductFrame() {
  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl border border-line bg-ink text-left">
      {/* mini sidebar */}
      <div className="hidden w-44 shrink-0 flex-col border-r border-line-subtle bg-ink-surface/80 p-3 md:flex">
        <div className="mb-4 flex items-center gap-2">
          <DizruptMark size={18} />
          <span className="font-display text-xs font-bold tracking-tight">DIZRUPT</span>
        </div>
        {[
          { icon: LayoutDashboard, label: "Command Center", active: true },
          { icon: Flame, label: "Capacity" },
          { icon: Users, label: "People" },
          { icon: ShieldAlert, label: "Risk Register" },
          { icon: Inbox, label: "Agent Inbox", badge: "3" },
          { icon: GitBranch, label: "Graph" },
        ].map((i) => (
          <div
            key={i.label}
            className={
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] " +
              (i.active ? "bg-brand-soft text-fg" : "text-fg-muted")
            }
          >
            <i.icon size={11} className={i.active ? "text-brand" : ""} />
            <span className="flex-1">{i.label}</span>
            {i.badge && (
              <span className="rounded-full bg-brand px-1 font-mono text-[8px] font-bold text-[#04281A]">
                {i.badge}
              </span>
            )}
          </div>
        ))}
        <div className="mt-auto rounded-md border border-line-subtle bg-ink-elevated p-2">
          <div className="text-[8px] uppercase tracking-widest text-fg-muted">Org pulse</div>
          <div className="mt-1 flex items-center gap-1.5">
            <Zap size={10} className="text-brand" />
            <span className="font-mono text-[10px] font-semibold text-brand">LIVE</span>
          </div>
        </div>
      </div>

      {/* main canvas */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        {/* situation banner */}
        <div className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-danger">
            <ShieldAlert size={11} />
            Atlas Payments Migration is CRITICAL — $4.2M ARR exposed
          </div>
          <div className="mt-0.5 text-[9px] text-fg-muted">
            Sarah at 113% · API freeze in 6 days · 2 one-click resolutions ready
          </div>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Execution Score", value: 94, suffix: "", tone: "text-brand" },
            { label: "Org Utilization", value: 73, suffix: "%", tone: "text-fg" },
            { label: "Open Risks", value: 7, suffix: "", tone: "text-warn" },
          ].map((k) => (
            <div key={k.label} className="rounded-lg border border-line-subtle bg-ink-surface/90 p-2.5">
              <div className="text-[8px] uppercase tracking-widest text-fg-muted">{k.label}</div>
              <div className={`mt-1 font-display text-lg font-semibold leading-none ${k.tone}`}>
                <NumberTicker value={k.value} suffix={k.suffix} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-5">
          {/* capacity heatmap */}
          <div className="rounded-lg border border-line-subtle bg-ink-surface/90 p-2.5 sm:col-span-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[8px] uppercase tracking-widest text-fg-muted">
                Capacity · next 8 weeks
              </span>
              <span className="font-mono text-[9px] text-brand">avg 73%</span>
            </div>
            <div className="space-y-1.5">
              {HEAT.map((row, r) => (
                <div key={r} className="flex items-center gap-1.5">
                  <span className="w-10 truncate text-[8px] text-fg-muted">
                    {["Sarah K", "Dev M", "Priya S", "Jon T"][r]}
                  </span>
                  {row.map((v, c) => (
                    <div
                      key={c}
                      className="h-4 flex-1 rounded-[3px]"
                      style={{ background: heatColor(v) }}
                    />
                  ))}
                </div>
              ))}
            </div>
            {/* velocity spark */}
            <div className="mt-3 border-t border-line-subtle pt-2">
              <span className="text-[8px] uppercase tracking-widest text-fg-muted">Velocity</span>
              <svg viewBox="0 0 200 40" className="mt-1 h-9 w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lpSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ED82" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#00ED82" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  fill="url(#lpSpark)"
                  points={`0,40 ${SPARK.map((v, i) => `${(i / (SPARK.length - 1)) * 200},${40 - (v / 100) * 38}`).join(" ")} 200,40`}
                />
                <polyline
                  fill="none"
                  stroke="#00ED82"
                  strokeWidth="1.5"
                  points={SPARK.map((v, i) => `${(i / (SPARK.length - 1)) * 200},${40 - (v / 100) * 38}`).join(" ")}
                />
              </svg>
            </div>
          </div>

          {/* agent inbox */}
          <div className="rounded-lg border border-line-subtle bg-ink-surface/90 p-2.5 sm:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[8px] uppercase tracking-widest text-fg-muted">Agent proposals</span>
              <span className="rounded-full bg-brand px-1.5 font-mono text-[8px] font-bold text-[#04281A]">3</span>
            </div>
            <div className="space-y-1.5">
              {[
                { t: "Rebalance Sarah → Dev (12h)", tone: "border-brand/40", chip: "98% fit", chipTone: "text-brand" },
                { t: "Slip Atlas QA gate by 2 days", tone: "border-warn/40", chip: "compromise", chipTone: "text-warn" },
                { t: "Escalate vendor SLA breach", tone: "border-danger/40", chip: "urgent", chipTone: "text-danger" },
              ].map((p) => (
                <div key={p.t} className={`rounded-md border ${p.tone} bg-ink-elevated/70 px-2 py-1.5`}>
                  <div className="text-[9px] font-medium text-fg-secondary">{p.t}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className={`font-mono text-[8px] ${p.chipTone}`}>{p.chip}</span>
                    <div className="flex gap-1">
                      <span className="rounded bg-brand px-1.5 py-px text-[8px] font-bold text-[#04281A]">Accept</span>
                      <span className="rounded border border-line px-1.5 py-px text-[8px] text-fg-muted">Defer</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 border-t border-line-subtle pt-2 text-[8px] leading-relaxed text-fg-muted">
              Every proposal carries its causal chain — accept, counter, or defer with full audit.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
