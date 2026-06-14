"use client";

// Learning Dashboard — the answer to one question: "are we getting smarter?".
// It scores the org's predictions against reality: recommendation accuracy,
// calibration (confidence vs outcome), learning velocity, repeated mistakes,
// and decision-outcome quality. Everything here is computed from the closed
// loop (accepted → measured recommendations), never surveyed.

import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/primitives";
import { useLearning } from "@/lib/hooks/use-executive";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw } from "lucide-react";

const trendMeta: Record<string, { icon: React.ElementType; tone: string; label: string }> = {
  improving: { icon: TrendingUp, tone: "text-ok", label: "Improving" },
  declining: { icon: TrendingDown, tone: "text-danger", label: "Declining" },
  flat: { icon: Minus, tone: "text-fg-muted", label: "Flat" },
  insufficient_data: { icon: Minus, tone: "text-fg-muted", label: "Insufficient data" },
};

function pct(n: number | null | undefined) {
  return n == null ? "—" : `${Math.round(n * 100)}%`;
}
function accTone(n: number | null | undefined) {
  return n == null ? "text-fg-muted" : n >= 0.7 ? "text-ok" : n >= 0.4 ? "text-warn" : "text-danger";
}

export default function LearningDashboardPage() {
  const learning = useLearning();

  if (learning.isLoading)
    return (
      <div className="space-y-4">
        <div className="panel h-40 animate-pulse" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="panel h-28 animate-pulse" />)}</div>
        <div className="panel h-64 animate-pulse" />
      </div>
    );

  if (learning.isError)
    return (
      <div className="panel flex flex-col items-start gap-3 p-8">
        <div className="text-lg font-semibold text-danger">Couldn&apos;t assemble the learning dashboard</div>
        <p className="text-sm text-fg-muted">{(learning.error as Error)?.message}</p>
        <button onClick={() => learning.refetch()} className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-[#04281A]">Retry</button>
      </div>
    );

  const d = learning.data!;
  const t = trendMeta[d.calibration.trend] ?? trendMeta.flat;
  const TrendIcon = t.icon;
  const funnel = [
    { label: "Surfaced", value: d.lifecycle.total },
    { label: "Acted on", value: d.lifecycle.accepted },
    { label: "Measured", value: d.lifecycle.measured },
  ];
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.value));

  return (
    <div className="space-y-8">
      {/* Verdict header */}
      <section className="panel relative overflow-hidden p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-5">
            <div
              className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(${d.calibration.avgAccuracy != null && d.calibration.avgAccuracy >= 0.7 ? "#10B981" : d.calibration.avgAccuracy != null && d.calibration.avgAccuracy >= 0.4 ? "#F59E0B" : "#EF4444"} ${(d.calibration.avgAccuracy ?? 0) * 360}deg, rgb(var(--ink-elevated)) 0deg)`,
              }}
            >
              <div className="grid h-[78px] w-[78px] place-items-center rounded-full bg-ink-surface">
                <span className="font-display text-3xl font-bold leading-none">{pct(d.calibration.avgAccuracy)}</span>
              </div>
            </div>
            <div>
              <div className="label-xs">Are we getting smarter?</div>
              <div className={cn("flex items-center gap-2 font-display text-2xl font-bold", t.tone)}>
                <TrendIcon size={22} /> {t.label}
              </div>
              <div className="mt-1 text-sm text-fg-muted">
                {d.calibration.observed} resolved prediction{d.calibration.observed === 1 ? "" : "s"} · {d.calibration.total} tracked
              </div>
            </div>
          </div>
          <p className="max-w-md text-base leading-7 text-fg-secondary md:ml-auto">{d.calibration.verdict}</p>
        </div>
      </section>

      {/* Top metrics */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Recommendation accuracy" value={pct(d.recommendationAccuracy)} tone={accTone(d.recommendationAccuracy)} hint="Predicted Δ vs measured Δ" />
        <Metric label="Calibration gap" value={pct(d.calibration.avgCalibrationGap)} tone={d.calibration.avgCalibrationGap != null && d.calibration.avgCalibrationGap > 0.2 ? "text-danger" : "text-ok"} hint="|confidence − accuracy| · 0 = perfect" />
        <Metric label="Learning velocity" value={pct(d.velocity.measuredOfAccepted)} hint="Acted-on recs that reached measurement" />
        <Metric label="Outcome quality" value={pct(d.outcomes.avgSuccessScore)} tone={accTone(d.outcomes.avgSuccessScore)} hint={`${d.outcomes.measured} decision outcomes measured`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lifecycle funnel */}
        <section className="panel p-6">
          <SectionHeader title="Loop conversion" hint="From surfaced to measured — where recommendations stall." />
          <div className="space-y-4">
            {funnel.map((f) => (
              <div key={f.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-fg-secondary">{f.label}</span>
                  <span className="font-mono text-fg-muted">{f.value}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-elevated">
                  <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(f.value / maxFunnel) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Accuracy by kind */}
        <section className="panel p-6">
          <SectionHeader title="Accuracy by prediction kind" hint="Which intelligence surfaces are best calibrated." />
          {Object.keys(d.calibration.byKind).length === 0 ? (
            <p className="text-sm text-fg-muted">No resolved predictions yet — accept and measure recommendations to populate this.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(d.calibration.byKind).map(([kind, k]) => (
                <div key={kind} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm capitalize text-fg-secondary">{kind}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-elevated">
                    <div className={cn("h-full rounded-full", (k.avgAccuracy ?? 0) >= 0.7 ? "bg-ok" : (k.avgAccuracy ?? 0) >= 0.4 ? "bg-warn" : "bg-danger")} style={{ width: `${(k.avgAccuracy ?? 0) * 100}%` }} />
                  </div>
                  <span className={cn("w-12 text-right font-mono text-sm", accTone(k.avgAccuracy))}>{pct(k.avgAccuracy)}</span>
                  <span className="w-16 text-right font-mono text-2xs text-fg-muted">{k.observed} obs</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* What we keep getting wrong / right */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <SectionHeader title="Blind spots" hint="Themes where mistakes repeat — the calibration warning system." />
          {d.learning.repeatedMistakes.length === 0 ? (
            <p className="text-sm text-fg-muted">No repeated mistakes detected.</p>
          ) : (
            <ul className="space-y-2">
              {d.learning.repeatedMistakes.map((m) => (
                <li key={m.theme} className="flex items-center gap-2.5 rounded-lg border border-danger/20 bg-danger-soft/40 px-3 py-2">
                  <AlertTriangle size={15} className="text-danger" />
                  <span className="flex-1 text-sm text-fg-secondary">{m.theme}</span>
                  <span className="font-mono text-xs text-danger">×{m.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel p-6">
          <SectionHeader title="Reusable knowledge" hint="Validated learnings worth carrying into the next decision." />
          {d.learning.reusable.length === 0 ? (
            <p className="text-sm text-fg-muted">No validated learnings captured yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {d.learning.reusable.slice(0, 6).map((l) => (
                <li key={l.title} className="flex items-start gap-2.5">
                  <RefreshCw size={15} className="mt-0.5 shrink-0 text-ok" />
                  <div>
                    <div className="text-sm font-semibold text-fg">{l.title}</div>
                    <div className="text-sm text-fg-muted">{l.insight}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, tone, hint }: { label: string; value: string; tone?: string; hint?: string }) {
  return (
    <div className="panel p-4">
      <div className="label-xs">{label}</div>
      <div className={cn("mt-1 font-display text-3xl font-bold leading-none", tone)}>{value}</div>
      {hint && <div className="mt-1.5 text-2xs text-fg-muted">{hint}</div>}
    </div>
  );
}
