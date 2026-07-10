// Computation Engine — Organizational Health.
//
// The rollup signal: not a survey, but a weighted composite of the platform's
// computed sub-signals (capability fragility, succession exposure, dependency
// concentration, workload pressure, governance bottlenecks, decision grounding).
// Each driver is itself computed by another engine module — org-health just
// composes them, so it stays a thin, explainable aggregator.

export interface HealthInputs {
  capabilityFragility: number; // 0..1 share of capabilities with bus factor ≤ 1
  successionExposure: number; // 0..1 share of strategic caps with a sole holder
  dependencyConcentration: number; // 0..1 normalized hub concentration
  workloadPressure: number; // 0..1 share of people over capacity
  governanceBottleneck: number; // 0..1 pending/total approvals
  decisionGrounding: number; // 0..1 share of active decisions with an outcome
}

const WEIGHTS: Record<keyof HealthInputs, number> = {
  capabilityFragility: 0.25,
  successionExposure: 0.2,
  dependencyConcentration: 0.15,
  workloadPressure: 0.2,
  governanceBottleneck: 0.1,
  decisionGrounding: 0.1, // this one is a POSITIVE signal (inverted below)
};

export interface HealthResult {
  score: number; // 0..100, higher = healthier
  band: "healthy" | "watch" | "strained" | "critical";
  drivers: { signal: string; value: number; weight: number; hurts: boolean }[];
  topConcerns: string[];
  explanation: string;
}

export function organizationalHealth(i: HealthInputs): HealthResult {
  // risk components (higher = worse) vs positive components (higher = better)
  const risk =
    WEIGHTS.capabilityFragility * i.capabilityFragility +
    WEIGHTS.successionExposure * i.successionExposure +
    WEIGHTS.dependencyConcentration * i.dependencyConcentration +
    WEIGHTS.workloadPressure * i.workloadPressure +
    WEIGHTS.governanceBottleneck * i.governanceBottleneck +
    WEIGHTS.decisionGrounding * (1 - i.decisionGrounding); // ungrounded decisions hurt

  const score = Math.round((1 - Math.min(1, risk)) * 100);
  const band: HealthResult["band"] =
    score >= 80 ? "healthy" : score >= 65 ? "watch" : score >= 50 ? "strained" : "critical";

  const drivers = [
    { signal: "Capability fragility", value: i.capabilityFragility, weight: WEIGHTS.capabilityFragility, hurts: true },
    { signal: "Succession exposure", value: i.successionExposure, weight: WEIGHTS.successionExposure, hurts: true },
    { signal: "Dependency concentration", value: i.dependencyConcentration, weight: WEIGHTS.dependencyConcentration, hurts: true },
    { signal: "Workload pressure", value: i.workloadPressure, weight: WEIGHTS.workloadPressure, hurts: true },
    { signal: "Governance bottleneck", value: i.governanceBottleneck, weight: WEIGHTS.governanceBottleneck, hurts: true },
    { signal: "Decision grounding", value: i.decisionGrounding, weight: WEIGHTS.decisionGrounding, hurts: false },
  ];

  const topConcerns = drivers
    .filter((d) => d.hurts)
    .map((d) => ({ ...d, impact: d.value * d.weight }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .filter((d) => d.value > 0.2)
    .map((d) => `${d.signal} (${Math.round(d.value * 100)}%)`);

  return {
    score,
    band,
    drivers,
    topConcerns,
    explanation:
      `Organizational health is ${score}/100 (${band}). ` +
      (topConcerns.length
        ? `Largest drags: ${topConcerns.join(", ")}.`
        : `No single signal dominates — the org is broadly balanced.`),
  };
}
