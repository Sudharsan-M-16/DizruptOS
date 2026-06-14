// Computation Engine — Organizational Memory.
//
// Assembles the durable answer to "why did we decide this, and what came of
// it?" by linking a decision to its approvals (who/authority), outcomes (what
// happened), and learnings (what we now know). Pure: callers feed live records;
// this composes the memory record + the lineage chain. Shares the engine's
// explanation contract.

import type { DecisionNode, OutcomeStatus } from "./decision-intelligence";

export interface ApprovalRecord {
  id: string;
  approverRole: string;
  decidedBy?: string | null;
  status: string;
  rationale?: string | null;
}
export interface OutcomeRecord {
  id: string;
  status: OutcomeStatus;
  expected?: string | null;
  actual?: string | null;
  confidence?: number | null;
}
export interface LearningRecord {
  id: string;
  title: string;
  insight: string;
}

export interface MemoryRecord {
  decisionId: string;
  title: string;
  why: string; // rationale
  who: { ownerId?: string | null; approvers: string[] };
  evidence: string[];
  whatHappened: { status: OutcomeStatus | "unknown"; detail: string }[];
  learned: string[];
  repeatRecommendation: "yes" | "yes_with_changes" | "no" | "too_early";
  lineage: string[]; // decision → outcome → learning chain, human-readable
  explanation: string;
}

/** Compose the organizational-memory record for one decision. */
export function decisionMemory(
  decision: DecisionNode,
  approvals: ApprovalRecord[],
  outcomes: OutcomeRecord[],
  learnings: LearningRecord[]
): MemoryRecord {
  const approvers = approvals
    .map((a) => a.decidedBy ?? a.approverRole)
    .filter((x): x is string => !!x);

  const evidence: string[] = [];
  if (decision.rationale) evidence.push(`Rationale: ${decision.rationale}`);
  if (decision.context) evidence.push(`Context: ${decision.context}`);
  approvals.filter((a) => a.rationale).forEach((a) => evidence.push(`Approval (${a.approverRole}): ${a.rationale}`));

  const whatHappened = outcomes.length
    ? outcomes.map((o) => ({ status: o.status, detail: o.actual ?? o.expected ?? "—" }))
    : [{ status: "unknown" as const, detail: "No outcome recorded yet — the decision's effect is unmeasured." }];

  const learned = learnings.map((l) => `${l.title}: ${l.insight}`);

  // would we decide this again? — derived from the latest outcome + learnings
  const latest = outcomes[0]?.status;
  const repeatRecommendation: MemoryRecord["repeatRecommendation"] =
    !latest || latest === "pending" ? "too_early" :
    latest === "succeeded" ? "yes" :
    latest === "failed" || latest === "reversed" ? "no" : "yes_with_changes";

  const lineage = [`Decision: ${decision.title}`];
  outcomes.forEach((o) => lineage.push(`↳ Outcome (${o.status}): ${o.actual ?? o.expected ?? "—"}`));
  learnings.forEach((l) => lineage.push(`  ↳ Learning: ${l.title}`));

  const repeatText = {
    yes: "On the evidence so far, we would make this decision again.",
    yes_with_changes: "We would broadly repeat this, with adjustments informed by the partial outcome.",
    no: "We would not repeat this decision as made.",
    too_early: "It is too early to say whether we would repeat this — no outcome is recorded yet.",
  }[repeatRecommendation];

  return {
    decisionId: decision.id,
    title: decision.title,
    why: decision.rationale ?? "No rationale was recorded.",
    who: { ownerId: decision.ownerId, approvers },
    evidence,
    whatHappened,
    learned,
    repeatRecommendation,
    lineage,
    explanation:
      `"${decision.title}" was decided because: ${decision.rationale ?? "(no rationale)"}. ` +
      `${outcomes.length ? `What happened: ${whatHappened.map((w) => `${w.status} — ${w.detail}`).join("; ")}. ` : "No outcome is on record yet. "}` +
      `${learned.length ? `We learned: ${learnings.map((l) => l.title).join("; ")}. ` : ""}` +
      repeatText,
  };
}

/** Governance signals over the approval stream (Phase 6). */
export function governanceSignals(approvals: { status: string; approverRole: string }[]) {
  const byRole = new Map<string, number>();
  for (const a of approvals) byRole.set(a.approverRole, (byRole.get(a.approverRole) ?? 0) + 1);
  const total = approvals.length || 1;
  const top = [...byRole.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    pending: approvals.filter((a) => a.status === "pending").length,
    approved: approvals.filter((a) => a.status === "approved").length,
    declined: approvals.filter((a) => a.status === "declined").length,
    // governance concentration: share decided by the single busiest approver tier
    ownershipConcentration: top ? Math.round((top[1] / total) * 100) / 100 : 0,
    busiestApprover: top?.[0] ?? null,
  };
}
