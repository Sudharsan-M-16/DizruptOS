// Computation Engine — Outcome Intelligence.
//
// Scores the OUTCOME object itself (vs retrospectives, which grade the decision).
// Pure; shared contract (score + explanation + evidence + confidence).

export type OutcomeStatus = "pending" | "succeeded" | "partial" | "failed" | "reversed";

export interface OutcomeNode {
  id: string;
  decisionId: string;
  status: OutcomeStatus;
  expected?: string | null;
  actual?: string | null;
  confidence?: number | null; // recorded confidence in the measurement (0..1)
  strategic?: boolean; // touches a strategic capability/project
}

const SUCCESS: Record<OutcomeStatus, number | null> = {
  succeeded: 1, partial: 0.5, failed: 0, reversed: 0, pending: null,
};

export interface OutcomeAnalysis {
  id: string;
  decisionId: string;
  successScore: number | null; // 0..1
  variance: "as_expected" | "better" | "worse" | "unknown";
  quality: number; // 0..1 — measured + has actual + confident
  strategicImpact: "low" | "medium" | "high";
  evidence: string[];
  explanation: string;
}

export function analyzeOutcome(o: OutcomeNode): OutcomeAnalysis {
  const success = SUCCESS[o.status];
  const hasActual = !!(o.actual && o.actual.trim().length > 0);
  const quality = Math.round(((hasActual ? 0.5 : 0) + (o.confidence ?? 0) * 0.5) * 1000) / 1000;
  const variance: OutcomeAnalysis["variance"] =
    success === null ? "unknown" : success >= 0.75 ? "as_expected" : success <= 0.25 ? "worse" : "as_expected";
  const strategicImpact = o.strategic ? (success !== null && success < 0.5 ? "high" : "medium") : "low";

  return {
    id: o.id,
    decisionId: o.decisionId,
    successScore: success,
    variance,
    quality,
    strategicImpact,
    evidence: [
      `Status: ${o.status}`,
      hasActual ? "Actual result recorded" : "No measured actual yet",
      o.confidence != null ? `Measurement confidence: ${Math.round(o.confidence * 100)}%` : "Unmeasured confidence",
    ],
    explanation:
      success === null
        ? `Outcome is still pending — no success signal yet.`
        : success >= 0.75
          ? `Outcome succeeded; the decision delivered close to what was expected.`
          : success <= 0.25
            ? `Outcome failed — expected vs actual diverged sharply${o.strategic ? " on a strategic surface" : ""}.`
            : `Outcome was partial — some of the expected value was realized.`,
  };
}

export function outcomeQualitySummary(outcomes: OutcomeNode[]) {
  const a = outcomes.map(analyzeOutcome);
  const measured = a.filter((x) => x.successScore !== null);
  const avgSuccess = measured.length ? measured.reduce((s, x) => s + (x.successScore ?? 0), 0) / measured.length : null;
  return {
    total: a.length,
    measured: measured.length,
    avgSuccessScore: avgSuccess == null ? null : Math.round(avgSuccess * 1000) / 1000,
    failing: a.filter((x) => x.successScore !== null && x.successScore <= 0.25).length,
  };
}
