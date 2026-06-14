"use client";

// Recommendation Center — the operational workspace where intelligence becomes
// ACTION. Every recommendation is a first-class entity moving through a
// lifecycle: pending → accepted (prediction written) → completed → measured
// (accuracy scored → feeds calibration). No dead recommendations; every one
// shows its reasoning, evidence, what it touches, and where it is in the loop.

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/primitives";
import {
  useRecommendations,
  useRecommendationTransition,
  type Impact,
  type RecStatus,
  type Recommendation,
} from "@/lib/hooks/use-executive";
import { Check, Clock, X, FlaskConical, CircleDot, CheckCircle2 } from "lucide-react";

const impactTone: Record<Impact, string> = {
  critical: "border-danger/50 text-danger bg-danger-soft",
  high: "border-warn/50 text-warn bg-warn-soft",
  medium: "border-info/50 text-info bg-info-soft",
  low: "border-ok/50 text-ok bg-ok-soft",
};

const statusMeta: Record<RecStatus, { label: string; tone: string; icon: React.ElementType }> = {
  pending: { label: "Pending", tone: "text-fg-muted bg-ink-elevated border-line", icon: CircleDot },
  acknowledged: { label: "Acknowledged", tone: "text-info bg-info-soft border-info/40", icon: CircleDot },
  accepted: { label: "Accepted · predicted", tone: "text-brand bg-brand-soft border-brand/40", icon: Check },
  rejected: { label: "Rejected", tone: "text-fg-muted bg-ink-elevated border-line line-through", icon: X },
  deferred: { label: "Deferred", tone: "text-warn bg-warn-soft border-warn/40", icon: Clock },
  completed: { label: "Completed · awaiting measure", tone: "text-info bg-info-soft border-info/40", icon: CheckCircle2 },
  measured: { label: "Measured · loop closed", tone: "text-ok bg-ok-soft border-ok/40", icon: FlaskConical },
};

const STAGES: RecStatus[] = ["pending", "accepted", "completed", "measured"];

export default function RecommendationCenterPage() {
  const recs = useRecommendations();
  const transition = useRecommendationTransition();
  const [measuring, setMeasuring] = useState<string | null>(null);
  const [actual, setActual] = useState<string>("");

  if (recs.isLoading)
    return (
      <div className="space-y-4">
        <div className="panel h-24 animate-pulse" />
        {[0, 1, 2].map((i) => <div key={i} className="panel h-40 animate-pulse" />)}
      </div>
    );

  if (recs.isError)
    return (
      <div className="panel flex flex-col items-start gap-3 p-8">
        <div className="text-lg font-semibold text-danger">Couldn&apos;t load recommendations</div>
        <p className="text-sm text-fg-muted">{(recs.error as Error)?.message}</p>
        <button onClick={() => recs.refetch()} className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-[#04281A]">Retry</button>
      </div>
    );

  const list = recs.data ?? [];
  const open = list.filter((r) => r.status !== "measured" && r.status !== "rejected");
  const closed = list.filter((r) => r.status === "measured" || r.status === "rejected");
  const counts = {
    open: open.length,
    accepted: list.filter((r) => r.status === "accepted" || r.status === "completed").length,
    measured: list.filter((r) => r.status === "measured").length,
  };

  const act = (id: string, to: RecStatus, extra?: { actualValue?: number; confidence?: number }) =>
    transition.mutate({ id, to, ...extra });

  return (
    <div className="space-y-8">
      {/* Loop header — the strip that makes the closed loop legible */}
      <section className="panel p-6">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div>
            <div className="label-xs">Recommendation Center</div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Intelligence → Action → Outcome</h1>
            <p className="mt-1 max-w-xl text-sm text-fg-muted">
              Each recommendation is tracked end-to-end. Accepting one writes a prediction; measuring it scores
              accuracy and feeds calibration. Nothing dies as a suggestion.
            </p>
          </div>
          <div className="ml-auto flex gap-6">
            <Stat label="Open" value={counts.open} />
            <Stat label="In flight" value={counts.accepted} tone="text-brand" />
            <Stat label="Measured" value={counts.measured} tone="text-ok" />
          </div>
        </div>
      </section>

      {/* Open recommendations — actionable */}
      <section>
        <SectionHeader title="Open recommendations" hint="Ranked by impact. Drive each through its lifecycle." />
        <div className="space-y-3">
          {open.length === 0 && (
            <div className="panel p-6 text-fg-muted">Nothing open — every recommendation is measured or declined.</div>
          )}
          {open.map((r) => (
            <RecCard
              key={r.id} r={r} pending={transition.isPending}
              measuring={measuring === r.id} actual={actual}
              onActual={setActual}
              onMeasureOpen={() => { setMeasuring(r.id); setActual(""); }}
              onMeasureCancel={() => setMeasuring(null)}
              onAct={act}
            />
          ))}
        </div>
      </section>

      {/* Closed loop — measured + rejected, the learning record */}
      {closed.length > 0 && (
        <section>
          <SectionHeader title="Closed loop" hint="Measured outcomes (accuracy scored) and declined recommendations." />
          <div className="space-y-3">
            {closed.map((r) => (
              <RecCard key={r.id} r={r} pending={transition.isPending} measuring={false} actual="" onActual={() => {}} onMeasureOpen={() => {}} onMeasureCancel={() => {}} onAct={act} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="text-right">
      <div className="label-xs">{label}</div>
      <div className={cn("font-display text-3xl font-bold leading-none", tone)}>{value}</div>
    </div>
  );
}

function LifecycleRail({ status }: { status: RecStatus }) {
  const activeIdx = STAGES.indexOf(status === "acknowledged" || status === "deferred" ? "pending" : status);
  return (
    <div className="flex items-center gap-1.5">
      {STAGES.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-1.5 w-6 rounded-full transition-colors",
              i <= activeIdx && activeIdx >= 0 ? "bg-brand" : "bg-ink-elevated"
            )}
            title={s}
          />
        </div>
      ))}
    </div>
  );
}

function RecCard({
  r, pending, measuring, actual, onActual, onMeasureOpen, onMeasureCancel, onAct,
}: {
  r: Recommendation;
  pending: boolean;
  measuring: boolean;
  actual: string;
  onActual: (v: string) => void;
  onMeasureOpen: () => void;
  onMeasureCancel: () => void;
  onAct: (id: string, to: RecStatus, extra?: { actualValue?: number; confidence?: number }) => void;
}) {
  const meta = statusMeta[r.status];
  const Icon = meta.icon;
  const can = (s: RecStatus) => r.nextStates.includes(s);

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", meta.tone)}>
          <Icon size={12} /> {meta.label}
        </span>
        <span className="font-display text-lg font-bold tracking-tight">{r.title}</span>
        <span className={cn("rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase", impactTone[r.impact])}>
          {r.impact}
        </span>
        <span className="ml-auto font-mono text-xs text-fg-muted">priority {Math.round(r.priority * 100)}%</span>
      </div>

      <p className="mt-3 max-w-3xl text-base leading-7 text-fg-secondary">{r.rationale}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-fg-muted">Evidence:</span>
        {r.evidence.map((e) => (
          <span key={e} className="rounded-full border border-line bg-ink-elevated px-2.5 py-0.5 text-xs text-fg-secondary">{e}</span>
        ))}
        <span className="ml-auto text-xs text-fg-muted">
          concerns <span className="text-fg-secondary">{r.traceTo.label}</span>
        </span>
      </div>

      {/* Prediction / outcome ledger — the closed-loop receipt */}
      {(r.confidence != null || r.accuracy != null) && (
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-line-subtle bg-ink-elevated/40 p-3 sm:grid-cols-4">
          <Ledger label="Confidence" value={r.confidence != null ? `${Math.round(r.confidence * 100)}%` : "—"} />
          <Ledger label="Expected Δ" value={r.expectedDelta != null ? `+${r.expectedDelta.toFixed(2)}` : "—"} />
          <Ledger label="Actual" value={r.actualValue != null ? r.actualValue.toFixed(2) : "—"} />
          <Ledger
            label="Accuracy"
            value={r.accuracy != null ? `${Math.round(r.accuracy * 100)}%` : "—"}
            tone={r.accuracy == null ? undefined : r.accuracy >= 0.7 ? "text-ok" : r.accuracy >= 0.4 ? "text-warn" : "text-danger"}
          />
        </div>
      )}

      {/* Lifecycle controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-subtle pt-3">
        <LifecycleRail status={r.status} />
        <div className="ml-auto flex flex-wrap gap-2">
          {can("accepted") && (
            <ActBtn primary disabled={pending} onClick={() => onAct(r.id, "accepted")}>Accept · predict</ActBtn>
          )}
          {can("deferred") && (
            <ActBtn disabled={pending} onClick={() => onAct(r.id, "deferred")}>Defer</ActBtn>
          )}
          {can("rejected") && (
            <ActBtn disabled={pending} onClick={() => onAct(r.id, "rejected")}>Reject</ActBtn>
          )}
          {can("completed") && (
            <ActBtn primary disabled={pending} onClick={() => onAct(r.id, "completed")}>Mark done</ActBtn>
          )}
          {can("measured") && !measuring && (
            <ActBtn primary disabled={pending} onClick={onMeasureOpen}>Measure outcome</ActBtn>
          )}
        </div>
      </div>

      {/* Measurement form — record the observed post-action metric (0..1) */}
      {measuring && (
        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-brand/30 bg-brand-soft/30 p-3">
          <div>
            <label className="label-xs mb-1 block">Observed risk metric after action (0–1)</label>
            <input
              type="number" min={0} max={1} step={0.05} value={actual}
              onChange={(e) => onActual(e.target.value)}
              placeholder={r.baselineValue != null ? `was ${r.baselineValue.toFixed(2)}` : "0.00"}
              className="w-44 rounded-lg border border-line bg-ink-surface px-3 py-2 font-mono text-sm outline-none focus:border-brand"
            />
          </div>
          <ActBtn
            primary disabled={pending || actual === ""}
            onClick={() => { onAct(r.id, "measured", { actualValue: Number(actual) }); onMeasureCancel(); }}
          >
            Score accuracy
          </ActBtn>
          <ActBtn disabled={pending} onClick={onMeasureCancel}>Cancel</ActBtn>
          <span className="text-xs text-fg-muted">Lower than baseline = the risk dropped. Accuracy = how close to the predicted Δ.</span>
        </div>
      )}
    </div>
  );
}

function Ledger({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wide text-fg-muted">{label}</div>
      <div className={cn("mt-0.5 font-mono text-lg font-semibold", tone)}>{value}</div>
    </div>
  );
}

function ActBtn({ children, onClick, primary, disabled }: { children: React.ReactNode; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-40",
        primary
          ? "bg-brand text-[#04281A] hover:bg-brand/90"
          : "border border-line text-fg-secondary hover:bg-ink-elevated hover:text-fg"
      )}
    >
      {children}
    </button>
  );
}
