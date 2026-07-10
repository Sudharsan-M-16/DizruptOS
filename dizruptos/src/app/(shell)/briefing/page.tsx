"use client";

// Executive Briefing — the leadership operating console. NOT a dashboard: a
// reasoning workspace that answers "what should I worry about, why, and what do
// I do next?" by consuming the live intelligence engines (org-health +
// recommendations). Every line shows reasoning + evidence, never a bare score.

import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/primitives";
import { useOrgHealth, useRecommendations, type Impact } from "@/lib/hooks/use-executive";

const bandTone: Record<string, string> = {
  healthy: "text-ok", watch: "text-warn", strained: "text-warn", critical: "text-danger",
};
const impactTone: Record<Impact, string> = {
  critical: "border-danger/50 text-danger bg-danger-soft",
  high: "border-warn/50 text-warn bg-warn-soft",
  medium: "border-info/50 text-info bg-info-soft",
  low: "border-ok/50 text-ok bg-ok-soft",
};

export default function BriefingPage() {
  const health = useOrgHealth();
  const recs = useRecommendations();

  if (health.isLoading || recs.isLoading)
    return (
      <div className="space-y-6">
        <div className="panel h-40 animate-pulse" />
        <div className="panel h-72 animate-pulse" />
      </div>
    );

  if (health.isError || recs.isError)
    return (
      <div className="panel flex flex-col items-start gap-3 p-8">
        <div className="text-lg font-semibold text-danger">Couldn&apos;t assemble the briefing</div>
        <p className="text-sm text-fg-muted">{(health.error as Error)?.message ?? (recs.error as Error)?.message}</p>
        <button onClick={() => { health.refetch(); recs.refetch(); }} className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-[#04281A]">Retry</button>
      </div>
    );

  const h = health.data!.health;
  const recommendations = recs.data ?? [];
  const ring = h.score >= 80 ? "#10B981" : h.score >= 65 ? "#F59E0B" : h.score >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="space-y-10">
      {/* What should I worry about — org health, explained */}
      <section className="panel p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-5">
            <div
              className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
              style={{ background: `conic-gradient(${ring} ${h.score * 3.6}deg, rgb(var(--ink-elevated)) 0deg)` }}
            >
              <div className="grid h-[78px] w-[78px] place-items-center rounded-full bg-ink-surface">
                <span className="font-display text-3xl font-bold leading-none">{h.score}</span>
              </div>
            </div>
            <div>
              <div className="label-xs">Organizational health</div>
              <div className={cn("font-display text-2xl font-bold capitalize", bandTone[h.band])}>{h.band}</div>
              <div className="mt-1 text-sm text-fg-muted">Computed, not surveyed — from the live graph.</div>
            </div>
          </div>
          <div className="md:ml-auto md:max-w-md">
            <div className="label-xs mb-2">What should you worry about</div>
            {h.topConcerns.length ? (
              <ul className="space-y-1.5">
                {h.topConcerns.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-base text-fg-secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-warn" /> {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-base text-fg-secondary">No single signal dominates — the org is broadly balanced.</p>
            )}
          </div>
        </div>
        {/* the drivers behind the score */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line-subtle pt-5 md:grid-cols-3 lg:grid-cols-6">
          {h.drivers.map((d) => (
            <div key={d.signal}>
              <div className="text-2xs uppercase tracking-wide text-fg-muted">{d.signal}</div>
              <div className={cn("mt-1 font-mono text-lg font-semibold", d.hurts && d.value > 0.4 ? "text-warn" : "text-fg")}>
                {Math.round(d.value * 100)}%
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What should I do next — ROI-ranked recommendations with reasoning */}
      <section>
        <SectionHeader
          title="What to do next"
          hint="Recommendations ranked by impact. Each shows why, the evidence, and what it touches."
        />
        <div className="space-y-3">
          {recommendations.length === 0 && (
            <div className="panel p-6 text-fg-muted">No active recommendations — nothing urgent to act on.</div>
          )}
          {recommendations.map((r, i) => (
            <div key={r.id} className="panel p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-elevated font-mono text-xs text-fg-muted">
                  {i + 1}
                </span>
                <span className="font-display text-lg font-bold tracking-tight">{r.title}</span>
                <span className={cn("rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase", impactTone[r.impact])}>
                  {r.impact} impact
                </span>
                <span className="ml-auto font-mono text-xs text-fg-muted">priority {Math.round(r.priority * 100)}%</span>
              </div>
              <p className="mt-3 max-w-3xl text-base leading-7 text-fg-secondary">{r.rationale}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line-subtle pt-3">
                <span className="text-xs text-fg-muted">Evidence:</span>
                {r.evidence.map((e) => (
                  <span key={e} className="rounded-full border border-line bg-ink-elevated px-2.5 py-0.5 text-xs text-fg-secondary">{e}</span>
                ))}
                <span className="ml-auto text-xs text-fg-muted">
                  concerns <span className="text-fg-secondary">{r.traceTo.label}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
