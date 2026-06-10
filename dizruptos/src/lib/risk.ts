// Risk severity law (PRD §28.2) — auto-computed from probability × impact.
// Single source of truth; consumed by the register, project detail, and tests.

import type { Risk, RiskImpact, RiskProbability, RiskSeverity } from "./types";

export const SEVERITY_MATRIX: Record<
  RiskProbability,
  Record<RiskImpact, RiskSeverity>
> = {
  low: { low: "Low", medium: "Low", high: "Medium", critical: "High" },
  medium: { low: "Low", medium: "Medium", high: "High", critical: "Critical" },
  high: { low: "Medium", medium: "High", high: "Critical", critical: "Critical" },
};

export const severityOf = (r: Pick<Risk, "probability" | "impact">): RiskSeverity =>
  SEVERITY_MATRIX[r.probability][r.impact];

export const SEVERITY_RANK: Record<RiskSeverity, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Critical: 3,
};
