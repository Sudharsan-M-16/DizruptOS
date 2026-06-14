// Computation Engine — Risk Intelligence.
//
// Moves beyond a static register: a risk's true weight is its severity AMPLIFIED
// by what the threatened entity propagates to (dependency-adjusted), plus
// concentration risk surfaced from the capability/people layers. Pure functions
// over (risks × graph). Shared contract: score + evidence + explanation.

import { blastRadius, type DepEdge } from "./dependency-intelligence";

export type Severity = "Low" | "Medium" | "High" | "Critical";
const SEV_WEIGHT: Record<Severity, number> = { Low: 0.25, Medium: 0.5, High: 0.75, Critical: 1 };

export interface RiskNode {
  id: string;
  title: string;
  severity: Severity;
  /** the entity this risk threatens (project/service/capability id) */
  threatensId?: string | null;
}

export interface RiskAnalysis {
  id: string;
  title: string;
  severity: Severity;
  baseScore: number; // 0..1 from severity
  propagation: number; // entities reachable from the threatened node
  adjustedScore: number; // 0..1 severity amplified by propagation
  band: "low" | "medium" | "high" | "critical";
  evidence: string[];
  explanation: string;
}

/** Dependency-adjusted risk: severity × (1 + blast-radius factor). */
export function analyzeRisk(r: RiskNode, edges: DepEdge[]): RiskAnalysis {
  const base = SEV_WEIGHT[r.severity];
  const propagation = r.threatensId ? blastRadius(r.threatensId, edges).reached.length : 0;
  const amp = 1 + Math.min(1, propagation / 5); // up to 2× for wide blast radius
  const adjusted = Math.min(1, base * amp);
  const band: RiskAnalysis["band"] =
    adjusted >= 0.85 ? "critical" : adjusted >= 0.6 ? "high" : adjusted >= 0.35 ? "medium" : "low";
  return {
    id: r.id,
    title: r.title,
    severity: r.severity,
    baseScore: round(base),
    propagation,
    adjustedScore: round(adjusted),
    band,
    evidence: [
      `Base severity: ${r.severity}`,
      r.threatensId ? `Threatened entity propagates to ${propagation} downstream entit${propagation === 1 ? "y" : "ies"}` : "No mapped downstream propagation",
    ],
    explanation:
      propagation > 0
        ? `"${r.title}" is ${r.severity} on its own, but the entity it threatens has ${propagation} dependents — so its effective risk is ${band}, higher than the register shows.`
        : `"${r.title}" is ${r.severity}; no downstream propagation is mapped, so register severity stands.`,
  };
}

/** Cascading risk: rank risks by dependency-adjusted score (worst first). */
export function rankRisks(risks: RiskNode[], edges: DepEdge[]): RiskAnalysis[] {
  return risks.map((r) => analyzeRisk(r, edges)).sort((a, b) => b.adjustedScore - a.adjustedScore);
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}
