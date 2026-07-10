// Computation Engine — Recommendation Lifecycle.
//
// Turns a recommendation from an ephemeral suggestion into a first-class
// operational entity that moves through a state machine and CLOSES THE LOOP:
//
//   created → acknowledged → accepted → completed → measured
//                          ↘ rejected
//                          ↘ deferred → (re-enters)
//
// On ACCEPT we write back a PREDICTION (confidence + baseline + expected delta).
// On MEASURE we record the ACTUAL value and score ACCURACY — the signal the
// calibration engine consumes. Pure; no DB, no React. The repository persists
// the fields this module computes.

export type LifecycleStatus =
  | "pending"        // computed, not yet seen/acted on
  | "acknowledged"   // a human has seen it
  | "accepted"       // committed to act → prediction written
  | "rejected"       // explicitly declined
  | "deferred"       // parked for later
  | "completed"      // the action was done; awaiting measurement
  | "measured";      // outcome observed → accuracy scored → feeds calibration

/** Allowed transitions. A recommendation never skips backwards into `pending`,
 *  and a terminal `measured`/`rejected` is final unless reopened to `deferred`. */
const TRANSITIONS: Record<LifecycleStatus, LifecycleStatus[]> = {
  pending:      ["acknowledged", "accepted", "rejected", "deferred"],
  acknowledged: ["accepted", "rejected", "deferred"],
  accepted:     ["completed", "rejected", "deferred"],
  deferred:     ["acknowledged", "accepted", "rejected"],
  completed:    ["measured"],
  rejected:     ["deferred"],
  measured:     [], // terminal
};

export function canTransition(from: LifecycleStatus, to: LifecycleStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStates(from: LifecycleStatus): LifecycleStatus[] {
  return TRANSITIONS[from] ?? [];
}

/** A prediction is written the moment a recommendation is ACCEPTED: we commit,
 *  on the record, to what we expect to happen and how sure we are — so we can be
 *  held accountable later. `impact` maps to a confidence prior when none given. */
const IMPACT_CONFIDENCE: Record<string, number> = { low: 0.4, medium: 0.55, high: 0.7, critical: 0.8 };

export interface PredictionWriteback {
  confidence: number;     // 0..1
  baselineValue: number;  // metric today (e.g. fragility 0..1)
  expectedDelta: number;  // expected improvement (signed; positive = better)
}

export function buildPrediction(args: {
  impact: string;
  priority: number;
  confidence?: number;
  baselineValue?: number;
  expectedDelta?: number;
}): PredictionWriteback {
  const confidence = clamp01(args.confidence ?? IMPACT_CONFIDENCE[args.impact] ?? 0.5);
  // Default baseline = current normalized risk implied by priority; expected
  // delta scales with both confidence and how strongly we ranked the action.
  const baselineValue = clamp01(args.baselineValue ?? args.priority);
  const expectedDelta = round(args.expectedDelta ?? clamp01(args.priority * confidence));
  return { confidence, baselineValue, expectedDelta };
}

/** When the outcome lands, score how close the prediction was. The prediction
 *  said baseline would improve by `expectedDelta`; `actualValue` is the observed
 *  post-action metric. Accuracy = 1 − |expected − observed delta|. */
export function measureAccuracy(args: {
  baselineValue: number | null;
  expectedDelta: number | null;
  actualValue: number; // observed metric after the action (same scale as baseline)
}): { actualDelta: number; accuracy: number } {
  const baseline = args.baselineValue ?? 0;
  const expected = args.expectedDelta ?? 0;
  // Improvement is a reduction in the risk metric (baseline → actual).
  const actualDelta = round(baseline - args.actualValue);
  const accuracy = round(Math.max(0, 1 - Math.abs(expected - actualDelta)));
  return { actualDelta, accuracy };
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }
function round(n: number) { return Math.round(n * 1000) / 1000; }
