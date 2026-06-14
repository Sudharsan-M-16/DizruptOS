// Computation Engine — Decision Intelligence.
//
// Decisions become scored, explainable graph objects. Pure functions over a
// DecisionNode (the decision + its links: approvals, outcomes, affected
// entities). Shares the engine contract: every result carries score +
// confidence + evidence + explanation — never a bare number.

export type ConfidenceLevel = "low" | "medium" | "high";
export type DecisionStatus =
  | "DRAFT" | "PROPOSED" | "APPROVED" | "ACTIVE" | "REJECTED" | "SUPERSEDED" | "REVERSED";
export type OutcomeStatus = "pending" | "succeeded" | "partial" | "failed" | "reversed";

export interface DecisionNode {
  id: string;
  title: string;
  rationale?: string | null;
  context?: string | null;
  confidenceLevel?: ConfidenceLevel | null;
  status: DecisionStatus;
  ownerId?: string | null;
  approverIds?: string[]; // distinct approvers from the approval objects
  affectedEntityCount?: number; // graph edges from this decision (blast radius)
  supersedesCount?: number; // decisions this one replaces (influence)
  outcomeStatus?: OutcomeStatus | null; // latest outcome, if any
  hasEvidence?: boolean; // an approval/outcome carried evidence
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface DecisionAnalysis {
  id: string;
  title: string;
  importance: number; // 0..1
  confidence: number; // 0..1
  blastRadius: number; // entities affected
  influence: number; // decisions superseded
  evidenceQuality: number; // 0..1
  stakeholderCoverage: number; // distinct people involved
  risk: RiskLevel;
  evidence: string[];
  explanation: string;
}

const CONF: Record<ConfidenceLevel, number> = { low: 0.3, medium: 0.6, high: 0.85 };

export function evidenceQuality(d: DecisionNode): number {
  let q = 0;
  if (d.rationale && d.rationale.trim().length > 20) q += 0.4;
  if (d.context && d.context.trim().length > 0) q += 0.2;
  if (d.hasEvidence) q += 0.2;
  if (d.outcomeStatus && d.outcomeStatus !== "pending") q += 0.2; // proven by an outcome
  return round(Math.min(1, q));
}

export function decisionConfidence(d: DecisionNode): number {
  const base = CONF[d.confidenceLevel ?? "medium"];
  // a recorded outcome adjusts stated confidence toward reality
  const adj =
    d.outcomeStatus === "succeeded" ? 0.1 :
    d.outcomeStatus === "failed" ? -0.25 :
    d.outcomeStatus === "partial" ? -0.05 : 0;
  return round(Math.max(0, Math.min(1, base * (0.6 + 0.4 * evidenceQuality(d)) + adj)));
}

export function decisionImportance(d: DecisionNode): number {
  const reach = Math.min(1, (d.affectedEntityCount ?? 0) / 5);
  const live = d.status === "ACTIVE" || d.status === "APPROVED" ? 0.3 : 0.1;
  const influence = Math.min(1, (d.supersedesCount ?? 0) / 3) * 0.2;
  return round(Math.min(1, 0.5 * reach + live + influence));
}

export function analyzeDecision(d: DecisionNode, stakeholders = new Set<string>()): DecisionAnalysis {
  const eq = evidenceQuality(d);
  const conf = decisionConfidence(d);
  const imp = decisionImportance(d);
  const blastRadius = d.affectedEntityCount ?? 0;

  if (d.ownerId) stakeholders.add(d.ownerId);
  (d.approverIds ?? []).forEach((a) => stakeholders.add(a));
  const stakeholderCoverage = stakeholders.size;

  const risk: RiskLevel =
    d.outcomeStatus === "failed" || d.status === "REVERSED" ? "critical" :
    conf < 0.4 && imp >= 0.5 ? "high" :
    eq < 0.4 ? "medium" : "low";

  const evidence: string[] = [];
  evidence.push(d.rationale ? `Rationale recorded (${eq >= 0.6 ? "substantive" : "thin"})` : "No rationale recorded");
  if (blastRadius) evidence.push(`Affects ${blastRadius} linked entit${blastRadius > 1 ? "ies" : "y"}`);
  evidence.push(`Stated confidence: ${d.confidenceLevel ?? "medium"}`);
  if (d.outcomeStatus) evidence.push(`Outcome so far: ${d.outcomeStatus}`);
  if ((d.supersedesCount ?? 0) > 0) evidence.push(`Supersedes ${d.supersedesCount} prior decision(s)`);

  const explanation =
    risk === "critical"
      ? `"${d.title}" has gone wrong (${d.outcomeStatus ?? d.status}) — high-priority retrospective material.`
      : eq < 0.4
        ? `"${d.title}" is under-evidenced: little rationale/outcome on record, so its confidence is weakly grounded.`
        : conf >= 0.7
          ? `"${d.title}" is well-grounded — clear rationale${d.outcomeStatus && d.outcomeStatus !== "pending" ? " and a measured outcome" : ""}.`
          : `"${d.title}" is a standard decision with moderate grounding; an outcome would raise confidence.`;

  return { id: d.id, title: d.title, importance: imp, confidence: conf, blastRadius, influence: d.supersedesCount ?? 0, evidenceQuality: eq, stakeholderCoverage, risk, evidence, explanation };
}

/* ------------------------------ retrospectives ----------------------------- */
// The platform learns from prior decisions: did the outcome match the
// confidence we had? Computed, explainable hindsight.

const OUTCOME_SUCCESS: Record<string, number | null> = {
  succeeded: 1, partial: 0.5, failed: 0, reversed: 0, pending: null,
};

export interface Retrospective {
  decisionId: string;
  title: string;
  successScore: number | null; // 0..1, null if no outcome yet
  statedConfidence: number; // 0..1
  confidenceAccuracy: number | null; // 1 = stated confidence matched reality
  evidenceQuality: number;
  hindsight: "validated" | "mixed" | "misjudged" | "too_early";
  explanation: string;
}

export function retrospective(d: DecisionNode): Retrospective {
  const success = d.outcomeStatus ? OUTCOME_SUCCESS[d.outcomeStatus] ?? null : null;
  const stated = CONF[d.confidenceLevel ?? "medium"];
  const accuracy = success === null ? null : round(1 - Math.abs(stated - success));
  const hindsight: Retrospective["hindsight"] =
    success === null ? "too_early" :
    success >= 0.75 ? "validated" :
    success <= 0.25 ? "misjudged" : "mixed";
  return {
    decisionId: d.id,
    title: d.title,
    successScore: success,
    statedConfidence: round(stated),
    confidenceAccuracy: accuracy,
    evidenceQuality: evidenceQuality(d),
    hindsight,
    explanation:
      success === null
        ? `"${d.title}" has no recorded outcome yet — no hindsight available.`
        : hindsight === "validated"
          ? `"${d.title}" succeeded; the ${d.confidenceLevel ?? "medium"} confidence was ${accuracy! >= 0.7 ? "well-calibrated" : "lower than warranted"}.`
          : hindsight === "misjudged"
            ? `"${d.title}" did not work out despite ${d.confidenceLevel ?? "medium"} confidence — a calibration miss worth studying.`
            : `"${d.title}" had a mixed outcome; confidence was partially borne out.`,
  };
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}
