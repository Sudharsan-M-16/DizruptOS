"use client";

// Capability Intelligence — an intelligence SURFACE, not a dashboard. It leads
// with reasoning ("why is this fragile?") over charts, answering: what exists,
// what's strategic, what's concentrated, what has no backup, who the experts
// are, and who could replace them. All values are COMPUTED live by the engine.

import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/primitives";
import {
  useCapabilityIntelligence,
  type CapAnalysis,
  type RiskLevel,
  type ExpertView,
} from "@/lib/hooks/use-capability-intelligence";

const riskTone: Record<RiskLevel, string> = {
  critical: "text-danger border-danger/40 bg-danger-soft",
  high: "text-warn border-warn/40 bg-warn-soft",
  medium: "text-info border-info/40 bg-info-soft",
  low: "text-ok border-ok/40 bg-ok-soft",
};

// Reasoning-first: turn the computed analysis into a plain-language explanation.
function why(c: CapAnalysis): string {
  const strat = c.strategicImportance === "critical" || c.strategicImportance === "high";
  if (c.busFactor === 0) return "No one is currently competent in this capability — an open gap.";
  if (c.busFactor === 1)
    return `Only one person can perform this${strat ? `, and it is strategically ${c.strategicImportance}` : ""}. If they leave or are unavailable, the capability stops — a single point of failure.`;
  if (c.busFactor === 2)
    return `Two people can perform this${c.topHolderShare >= 0.6 ? `, but depth is concentrated in one (${Math.round(c.topHolderShare * 100)}% of expertise)` : ""}. Thin backup coverage.`;
  return `${c.busFactor} people can perform this — healthy redundancy.`;
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="panel px-6 py-6">
      <div className="label-xs">{label}</div>
      <div className={cn("mt-1.5 font-display text-3xl font-semibold leading-none", tone)}>{value}</div>
    </div>
  );
}

export default function CapabilityIntelligencePage() {
  const { data, isLoading, isError, error, refetch } = useCapabilityIntelligence();

  if (isLoading)
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel h-28 animate-pulse" />
          ))}
        </div>
        <div className="panel h-64 animate-pulse" />
      </div>
    );

  if (isError || !data)
    return (
      <div className="panel flex flex-col items-start gap-3 p-8">
        <div className="text-lg font-semibold text-danger">Couldn&apos;t compute capability intelligence</div>
        <p className="text-sm text-fg-muted">{(error as Error)?.message ?? "The intelligence engine is unavailable."}</p>
        <button onClick={() => refetch()} className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-[#04281A]">
          Retry
        </button>
      </div>
    );

  const { health, capabilities, backupCoverage, successionExposure, experts } = data;
  const expertOf = (id: string): ExpertView | undefined => experts.find((e) => e.capabilityId === id);

  return (
    <div className="space-y-10">
      {/* computed org rollup */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Capabilities tracked" value={health.total} />
        <Stat label="Fragile (bus factor ≤ 1)" value={health.fragile} tone={health.fragile ? "text-danger" : "text-ok"} />
        <Stat label="No backup" value={health.noBackup} tone={health.noBackup ? "text-warn" : "text-ok"} />
        <Stat label="Backup coverage" value={`${Math.round(backupCoverage.pct * 100)}%`} tone="text-brand" />
      </div>

      {/* at-risk, reasoning-first */}
      <section>
        <SectionHeader
          title="Capabilities at risk"
          hint="Ranked by computed succession risk. Each explains why."
        />
        <div className="space-y-3">
          {capabilities.map((c) => {
            const ev = expertOf(c.id);
            return (
              <div key={c.id} className="panel p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-xl font-bold tracking-tight">{c.name}</span>
                  <span className={cn("rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase", riskTone[c.successionRisk])}>
                    {c.successionRisk} risk
                  </span>
                  <span className="rounded-md border border-line bg-ink-elevated px-2.5 py-0.5 text-xs text-fg-secondary">
                    {c.strategicImportance} importance
                  </span>
                  <span className="ml-auto font-mono text-sm text-fg-muted">
                    bus factor {c.busFactor} · {Math.round(c.concentration * 100)}% concentrated
                  </span>
                </div>
                <p className="mt-3 max-w-3xl text-base leading-7 text-fg-secondary">{why(c)}</p>
                {ev && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line-subtle pt-3 text-sm">
                    <span className="text-fg-muted">Expert:</span>
                    <span className="rounded-full bg-brand-soft px-2.5 py-0.5 font-medium text-brand">
                      {ev.primary?.userName ?? "—"} {ev.primary ? `(${ev.primary.proficiency}/5)` : ""}
                    </span>
                    <span className="text-fg-muted">Can replace:</span>
                    {ev.backups.length ? (
                      ev.backups.map((b) => (
                        <span key={b.userId} className="rounded-full border border-line px-2.5 py-0.5 text-fg-secondary">
                          {b.userName} ({b.proficiency}/5)
                        </span>
                      ))
                    ) : (
                      <span className="font-medium text-danger">no one — single point of failure</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* key-person risk */}
      {successionExposure.length > 0 && (
        <section>
          <SectionHeader title="Single points of failure" hint="People who solely hold a strategic capability." />
          <div className="grid gap-3 md:grid-cols-2">
            {successionExposure.map((p) => (
              <div key={p.userId} className="panel flex items-center gap-4 p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-danger-soft font-display text-lg font-bold text-danger">
                  {(p.userName ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </span>
                <div>
                  <div className="text-base font-semibold">{p.userName}</div>
                  <div className="text-sm text-fg-muted">
                    Sole holder of: {p.capabilities.join(", ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
