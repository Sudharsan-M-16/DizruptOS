// Decision Intelligence + Organizational Memory loader.
// Assembles each decision with its approvals / outcomes / learnings / graph
// links, then runs the engines. Repos fetch, engines compute, route serves.

import { getRepositories } from "@/server/repositories";
import { decision as di, orgMemory } from "@/server/engine";
import type { DecisionNode, DecisionStatus } from "@/server/engine/decision-intelligence";

function linkedToDecision(affected: unknown, decisionId: string): boolean {
  try {
    return JSON.stringify(affected ?? "").includes(decisionId);
  } catch {
    return false;
  }
}

export async function decisionIntelligence() {
  const repos = getRepositories();
  // Lineage tables (migration 0011) may not exist on every backend yet — read
  // them tolerantly so the memory surface still works before the migration runs.
  const lineageSafe = async (): Promise<[
    Awaited<ReturnType<typeof repos.lineage.evidence>>,
    Awaited<ReturnType<typeof repos.lineage.assumptions>>,
    Awaited<ReturnType<typeof repos.lineage.hypotheses>>,
  ]> => {
    try {
      return await Promise.all([repos.lineage.evidence(), repos.lineage.assumptions(), repos.lineage.hypotheses()]);
    } catch {
      return [[], [], []];
    }
  };
  const [decisions, outcomes, learnings, approvals, rels, [evidence, assumptions, hypotheses]] = await Promise.all([
    repos.decisions.list(),
    repos.outcomes.list(),
    repos.learnings.list(),
    repos.approvals.list(),
    repos.relationships.list(),
    lineageSafe(),
  ]);

  const stakeholders = new Set<string>();
  const items = decisions.map((d) => {
    const dOutcomes = outcomes.filter((o) => o.decisionId === d.id);
    const dLearnings = learnings.filter((l) => l.decisionId === d.id);
    const dEvidence = evidence.filter((e) => e.decisionId === d.id);
    const dAssumptions = assumptions.filter((a) => a.decisionId === d.id);
    const dHypotheses = hypotheses.filter((h) => h.decisionId === d.id);
    const dApprovals = approvals.filter((a) => linkedToDecision(a.affectedEntities, d.id));
    const affectedEntityCount = rels.filter((r) => r.sourceId === d.id || r.targetId === d.id).length;

    const node: DecisionNode = {
      id: d.id,
      title: d.title,
      rationale: d.rationale,
      context: d.context,
      confidenceLevel: d.confidenceLevel ?? undefined,
      status: d.status as DecisionStatus,
      ownerId: d.ownerId,
      approverIds: dApprovals.map((a) => a.decidedBy ?? a.approverRole),
      affectedEntityCount,
      outcomeStatus: dOutcomes[0]?.status ?? null,
      hasEvidence: dApprovals.length > 0 || dOutcomes.length > 0,
    };

    return {
      analysis: di.analyzeDecision(node, stakeholders),
      memory: orgMemory.decisionMemory(
        node,
        dApprovals.map((a) => ({ id: a.id, approverRole: a.approverRole, decidedBy: a.decidedBy, status: a.status, rationale: a.rationale })),
        dOutcomes.map((o) => ({ id: o.id, status: o.status, expected: o.expected, actual: o.actual, confidence: o.confidence })),
        dLearnings.map((l) => ({ id: l.id, title: l.title, insight: l.insight })),
        {
          evidence: dEvidence.map((e) => ({ source: e.source, summary: e.summary, strength: e.strength })),
          assumptions: dAssumptions.map((a) => ({ statement: a.statement, status: a.status, criticality: a.criticality })),
          hypotheses: dHypotheses.map((h) => ({ statement: h.statement, status: h.status, confidence: h.confidence })),
        }
      ),
    };
  });

  return {
    decisions: items,
    governance: orgMemory.governanceSignals(approvals.map((a) => ({ status: a.status, approverRole: a.approverRole }))),
  };
}
