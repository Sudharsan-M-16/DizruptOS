// Computation Engine — Intelligence Calibration.
//
// "Are we getting smarter?" Given predictions (a recommendation/simulation made
// a claim with a confidence) and the later observed outcome, compute accuracy +
// calibration. Pure; shared contract. The write-back loop (storing predictions
// when a recommendation is acted on) is a UI/realtime concern; this layer scores
// whatever prediction↔outcome pairs it's handed.

export interface Prediction {
  id: string;
  kind: "recommendation" | "simulation" | "risk" | "succession" | "dependency";
  statement: string;
  predictedValue: number; // e.g. expected fragility reduction 0..1
  confidence: number; // 0..1 the engine's stated confidence
  actualValue?: number | null; // measured later; null = not yet observed
}

export interface PredictionScore {
  id: string;
  kind: Prediction["kind"];
  observed: boolean;
  error: number | null; // |predicted - actual|
  accuracy: number | null; // 1 - error
  calibrationGap: number | null; // |confidence - accuracy| (overconfidence detector)
}

export function scorePrediction(p: Prediction): PredictionScore {
  if (p.actualValue == null) {
    return { id: p.id, kind: p.kind, observed: false, error: null, accuracy: null, calibrationGap: null };
  }
  const error = Math.abs(p.predictedValue - p.actualValue);
  const accuracy = Math.max(0, 1 - error);
  return {
    id: p.id, kind: p.kind, observed: true,
    error: round(error), accuracy: round(accuracy),
    calibrationGap: round(Math.abs(p.confidence - accuracy)),
  };
}

export interface CalibrationReport {
  total: number;
  observed: number;
  byKind: Record<string, { observed: number; avgAccuracy: number | null }>;
  avgAccuracy: number | null;
  avgCalibrationGap: number | null; // 0 = perfectly calibrated; high = over/under-confident
  trend: "improving" | "declining" | "flat" | "insufficient_data";
  verdict: string;
}

/** Roll up prediction scores into "are we getting smarter?". `priorAvg` lets the
 *  caller pass last period's accuracy to compute a trend. */
export function calibrationReport(preds: Prediction[], priorAvgAccuracy?: number | null): CalibrationReport {
  const scored = preds.map(scorePrediction);
  const obs = scored.filter((s) => s.observed);
  const avg = obs.length ? round(obs.reduce((s, x) => s + (x.accuracy ?? 0), 0) / obs.length) : null;
  const gap = obs.length ? round(obs.reduce((s, x) => s + (x.calibrationGap ?? 0), 0) / obs.length) : null;

  const byKind: CalibrationReport["byKind"] = {};
  for (const s of scored) {
    const k = (byKind[s.kind] ??= { observed: 0, avgAccuracy: null });
    if (s.observed) {
      const prev = k.avgAccuracy ?? 0;
      k.avgAccuracy = round((prev * k.observed + (s.accuracy ?? 0)) / (k.observed + 1));
      k.observed++;
    }
  }

  let trend: CalibrationReport["trend"] = "insufficient_data";
  if (avg != null && priorAvgAccuracy != null) {
    trend = avg > priorAvgAccuracy + 0.02 ? "improving" : avg < priorAvgAccuracy - 0.02 ? "declining" : "flat";
  }

  return {
    total: preds.length, observed: obs.length, byKind, avgAccuracy: avg, avgCalibrationGap: gap, trend,
    verdict:
      avg == null ? "No outcomes observed yet — calibration unknown until predictions resolve."
      : `${Math.round(avg * 100)}% average accuracy across ${obs.length} resolved prediction(s); ` +
        (gap != null && gap > 0.2 ? `confidence is poorly calibrated (gap ${Math.round(gap * 100)}%).` : "confidence is reasonably calibrated.") +
        (trend === "improving" ? " Trend: improving." : trend === "declining" ? " Trend: declining." : ""),
  };
}

function round(n: number) { return Math.round(n * 1000) / 1000; }
