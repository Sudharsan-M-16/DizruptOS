"use client";

// The hero product preview — no longer a still-life. This is a working
// miniature of the Command Center: the sidebar actually switches views, the
// heatmap responds to hover with a live readout, agent proposals accept and
// leave with a green flash, and the KPI numbers breathe on an interval.
// Visitors are supposed to touch it and feel the product answer back.

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Flame,
  GitBranch,
  Inbox,
  LayoutDashboard,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { DizruptMark } from "@/components/ui/logo";
import { NumberTicker } from "@/components/ui/ascension";
import { cn } from "@/lib/utils";

const NAMES = ["Sarah K", "Dev M", "Priya S", "Jon T", "Mara L"];
const HEAT = [
  [0.62, 0.81, 0.44, 0.93, 1.13, 0.55, 0.88, 0.67],
  [0.48, 0.59, 1.08, 0.74, 0.52, 0.96, 0.61, 0.7],
  [0.83, 0.66, 0.57, 0.49, 0.71, 0.78, 0.69, 0.58],
  [0.55, 0.92, 0.73, 0.64, 0.6, 0.51, 0.97, 0.85],
  [0.45, 0.52, 0.61, 0.68, 0.74, 0.8, 0.58, 0.49],
];

function heatColor(v: number) {
  if (v > 1) return "rgba(239,68,68,0.8)";
  if (v > 0.85) return "rgba(245,158,11,0.7)";
  return `rgba(0,237,130,${0.18 + v * 0.45})`;
}

const SPARK = [34, 48, 41, 62, 55, 74, 68, 86, 79, 95];

const RISKS = [
  { title: "Atlas Payments migration slip", sev: "Crit", chip: "border-danger/50 text-danger", tone: "text-danger", trend: "↑ rising", trendTone: "text-danger" },
  { title: "Payments bus-factor — Sarah K", sev: "High", chip: "border-warn/50 text-warn", tone: "text-warn", trend: "↑ rising", trendTone: "text-warn" },
  { title: "Northwind SLA breach exposure", sev: "High", chip: "border-warn/50 text-warn", tone: "text-warn", trend: "→ steady", trendTone: "text-fg-muted" },
  { title: "Vendor consolidation delay", sev: "Med", chip: "border-info/50 text-info", tone: "text-info", trend: "↓ easing", trendTone: "text-ok" },
];

// A small live constellation — central node pulses, blast-radius edges animate.
function ConstellationGraph() {
  const EDGES = [
    [70, 90, 170, 45], [70, 90, 170, 135], [170, 45, 270, 90],
    [170, 135, 270, 90], [270, 90, 340, 50], [270, 90, 340, 130],
    [170, 45, 170, 135],
  ];
  const NODES: [number, number, number, string, string][] = [
    [70, 90, 10, "#00ED82", "Sarah K"],
    [170, 45, 7, "#2BD9FF", "Atlas"],
    [170, 135, 7, "#2BD9FF", "Payments API"],
    [270, 90, 10, "#00ED82", "Identity"],
    [340, 50, 6, "#F59E0B", "Vendor SLA"],
    [340, 130, 6, "#EF4444", "Risk R-12"],
  ];
  return (
    <svg viewBox="0 0 380 180" className="h-[calc(100%-4px)] w-full">
      {EDGES.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(0,237,130,0.4)"
          strokeWidth="1.4"
          strokeDasharray={i === 6 ? "4 4" : "60"}
          strokeDashoffset="60"
        >
          <animate attributeName="stroke-dashoffset" from="60" to="0" dur="0.9s" begin={`${i * 0.08}s`} fill="freeze" />
        </line>
      ))}
      {NODES.map(([x, y, r, c, label], i) => (
        <g key={i}>
          {i === 0 && (
            <circle cx={x} cy={y} r={r} fill="none" stroke={c} strokeWidth="1.5" opacity="0.6">
              <animate attributeName="r" values={`${r};${r + 9};${r}`} dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" />
            </circle>
          )}
          <circle cx={x} cy={y} r={r} fill={c} opacity={0.92} />
          <text x={x + r + 5} y={y + 4} fill="#989CA3" fontSize="12" fontFamily="monospace">
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

type View = "command" | "capacity" | "inbox" | "risk" | "graph";

const PROPOSALS = [
  { id: 1, t: "Rebalance Sarah → Dev (12h of Atlas QA)", tone: "border-brand/40", chip: "98% fit", chipTone: "text-brand" },
  { id: 2, t: "Slip Atlas QA gate by 2 days", tone: "border-warn/40", chip: "compromise", chipTone: "text-warn" },
  { id: 3, t: "Escalate vendor SLA breach to legal", tone: "border-danger/40", chip: "urgent", chipTone: "text-danger" },
];

function Heatmap({ rows, onCell }: { rows: number; onCell: (s: string | null) => void }) {
  return (
    <div className="space-y-1.5">
      {HEAT.slice(0, rows).map((row, r) => (
        <div key={r} className="flex items-center gap-1.5">
          <span className="w-14 truncate text-[11px] font-medium text-fg-muted">{NAMES[r]}</span>
          {row.map((v, c) => (
            <button
              key={c}
              type="button"
              tabIndex={-1}
              onPointerEnter={() => onCell(`${NAMES[r]} · week ${c + 1} · ${Math.round(v * 100)}% load`)}
              onPointerLeave={() => onCell(null)}
              className="h-5 flex-1 cursor-crosshair rounded-[3px] transition-transform duration-150 hover:scale-y-[1.4] hover:ring-1 hover:ring-white/40"
              style={{ background: heatColor(v) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function InboxList({ compact }: { compact?: boolean }) {
  const [done, setDone] = React.useState<number[]>([]);
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {PROPOSALS.filter((p) => !done.includes(p.id)).map((p) => (
          <motion.div
            key={p.id}
            layout
            exit={{ opacity: 0, x: 36, transition: { duration: 0.25 } }}
            className={cn(
              "rounded-lg border bg-ink-elevated/70 px-3 py-2.5 transition-colors hover:bg-ink-elevated",
              p.tone
            )}
          >
            <div className="text-xs font-medium leading-snug text-fg-secondary">{p.t}</div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className={cn("font-mono text-[11px]", p.chipTone)}>{p.chip}</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setDone((d) => [...d, p.id])}
                  className="rounded bg-brand px-2 py-0.5 text-[11px] font-bold text-[#04281A] transition-transform hover:scale-105 active:scale-95"
                >
                  Accept
                </button>
                {!compact && (
                  <span className="rounded border border-line px-2 py-0.5 text-[11px] text-fg-muted">
                    Defer
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {done.length === PROPOSALS.length && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg border border-ok/40 bg-ok-soft px-3 py-2.5 text-xs font-medium text-ok"
        >
          <Check size={13} /> Inbox zero — every decision on the record.
        </motion.div>
      )}
    </div>
  );
}

export function ProductFrame() {
  const [view, setView] = React.useState<View>("command");
  const [cell, setCell] = React.useState<string | null>(null);
  // breathing utilization — the dashboard reads "alive" without being noisy
  const [util, setUtil] = React.useState(73);
  React.useEffect(() => {
    const id = setInterval(() => setUtil(70 + Math.round(Math.random() * 6)), 2600);
    return () => clearInterval(id);
  }, []);

  const NAV: { id: View; icon: React.ElementType; label: string; badge?: string }[] = [
    { id: "command", icon: LayoutDashboard, label: "Command Center" },
    { id: "capacity", icon: Flame, label: "Capacity" },
    { id: "inbox", icon: Inbox, label: "Agent Inbox", badge: "3" },
    { id: "risk", icon: ShieldAlert, label: "Risk Register" },
    { id: "graph", icon: GitBranch, label: "Graph" },
  ];

  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl border border-line bg-ink text-left">
      {/* mini sidebar — actually switches views */}
      <div className="hidden w-48 shrink-0 flex-col border-r border-line-subtle bg-ink-surface/80 p-3 md:flex">
        <div className="mb-4 flex items-center gap-2">
          <DizruptMark size={20} />
          <span className="font-display text-sm font-bold tracking-tight">DIZRUPT</span>
        </div>
        {NAV.map((i) => (
          <button
            key={i.label}
            type="button"
            onClick={() => i.id && setView(i.id)}
            disabled={!i.id}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-2 text-xs transition-colors",
              i.id === view
                ? "bg-brand-soft text-fg"
                : i.id
                  ? "text-fg-muted hover:bg-white/[0.04] hover:text-fg-secondary"
                  : "cursor-default text-fg-faint"
            )}
          >
            <i.icon size={13} className={i.id === view ? "text-brand" : ""} />
            <span className="flex-1 text-left">{i.label}</span>
            {i.badge && (
              <span className="rounded-full bg-brand px-1.5 font-mono text-[10px] font-bold text-[#04281A]">
                {i.badge}
              </span>
            )}
          </button>
        ))}
        <div className="mt-auto rounded-md border border-line-subtle bg-ink-elevated p-2.5">
          <div className="text-[10px] uppercase tracking-widest text-fg-muted">Org pulse</div>
          <div className="mt-1 flex items-center gap-1.5">
            <Zap size={11} className="text-brand" />
            <span className="font-mono text-xs font-semibold text-brand">LIVE</span>
            <span className="relative ml-auto flex h-1.5 w-1.5">
              <span className="absolute h-full w-full animate-ping rounded-full bg-brand opacity-60" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-brand" />
            </span>
          </div>
        </div>
      </div>

      {/* main canvas */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        {/* situation banner / hover readout */}
        <div
          className={cn(
            "rounded-lg border px-3 py-2 transition-colors",
            cell ? "border-brand/40 bg-brand-soft" : "border-danger/40 bg-danger-soft"
          )}
        >
          {cell ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-brand">
              <Flame size={12} /> {cell}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs font-semibold text-danger">
                <ShieldAlert size={12} />
                Atlas Payments Migration is CRITICAL — $4.2M ARR exposed
              </div>
              <div className="mt-0.5 text-[11px] text-fg-muted">
                Sarah at 113% · API freeze in 6 days · 2 one-click resolutions ready
              </div>
            </>
          )}
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Execution Score", value: 94, suffix: "", tone: "text-brand" },
            { label: "Org Utilization", value: util, suffix: "%", tone: "text-fg" },
            { label: "Open Risks", value: 7, suffix: "", tone: "text-warn" },
          ].map((k) => (
            <div key={k.label} className="rounded-lg border border-line-subtle bg-ink-surface/90 p-2.5">
              <div className="text-[10px] uppercase tracking-widest text-fg-muted">{k.label}</div>
              <div className={`mt-1 font-display text-xl font-semibold leading-none ${k.tone}`}>
                <NumberTicker value={k.value} suffix={k.suffix} />
              </div>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {view === "command" && (
            <motion.div
              key="command"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-5"
            >
              <div className="rounded-lg border border-line-subtle bg-ink-surface/90 p-3 sm:col-span-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-fg-muted">
                    Capacity · next 8 weeks · hover a cell
                  </span>
                  <span className="font-mono text-[11px] text-brand">avg {util}%</span>
                </div>
                <Heatmap rows={4} onCell={setCell} />
                <div className="mt-3 border-t border-line-subtle pt-2">
                  <span className="text-[10px] uppercase tracking-widest text-fg-muted">Velocity</span>
                  <svg viewBox="0 0 200 40" className="mt-1 h-10 w-full" preserveAspectRatio="none">
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
              <div className="rounded-lg border border-line-subtle bg-ink-surface/90 p-3 sm:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-fg-muted">Agent proposals</span>
                  <span className="rounded-full bg-brand px-1.5 font-mono text-[10px] font-bold text-[#04281A]">3</span>
                </div>
                <InboxList compact />
              </div>
            </motion.div>
          )}

          {view === "capacity" && (
            <motion.div
              key="capacity"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="min-h-0 flex-1 rounded-lg border border-line-subtle bg-ink-surface/90 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-fg-muted">
                  Full heatmap · hover anyone
                </span>
                <span className="font-mono text-[11px] text-warn">Sarah K breaches 113% in WK 5</span>
              </div>
              <Heatmap rows={5} onCell={setCell} />
              <div className="mt-3 flex items-center gap-4 border-t border-line-subtle pt-2 text-[11px] text-fg-muted">
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-brand/60" /> healthy</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-warn/70" /> &gt;85%</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-danger/80" /> overload</span>
              </div>
            </motion.div>
          )}

          {view === "inbox" && (
            <motion.div
              key="inbox"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="min-h-0 flex-1 rounded-lg border border-line-subtle bg-ink-surface/90 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-fg-muted">
                  Agents propose · you decide — try Accept
                </span>
              </div>
              <InboxList />
            </motion.div>
          )}

          {view === "risk" && (
            <motion.div
              key="risk"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="min-h-0 flex-1 rounded-lg border border-line-subtle bg-ink-surface/90 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-fg-muted">
                  Open risks · ranked by exposure
                </span>
                <span className="font-mono text-[11px] text-danger">1 critical · 2 high</span>
              </div>
              <div className="space-y-1.5">
                {RISKS.map((r) => (
                  <div
                    key={r.title}
                    className="flex items-center gap-2.5 rounded-md border border-line-subtle bg-ink-elevated/70 px-2.5 py-2 transition-colors hover:bg-ink-elevated"
                  >
                    <ShieldAlert size={13} className={cn("shrink-0", r.tone)} />
                    <span className="flex-1 truncate text-xs text-fg-secondary">{r.title}</span>
                    <span className={cn("font-mono text-[11px]", r.trendTone)}>{r.trend}</span>
                    <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase", r.chip)}>
                      {r.sev}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === "graph" && (
            <motion.div
              key="graph"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="min-h-0 flex-1 rounded-lg border border-line-subtle bg-ink-surface/90 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-fg-muted">
                  Dependency graph · blast radius from Sarah K
                </span>
                <span className="font-mono text-[11px] text-warn">6 entities · 3 hops</span>
              </div>
              <ConstellationGraph />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
