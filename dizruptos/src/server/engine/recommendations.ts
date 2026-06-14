// Computation Engine — Recommendations.
//
// NOT AI chat — reasoning. Turns the computed intelligence (fragility,
// succession exposure, dependency criticality, decision retrospectives) into
// ranked, evidence-backed, traceable actions. Every recommendation says WHY,
// cites the evidence, and points at the entity it concerns.

export type RecoType =
  | "cross_train" | "assign_backup" | "reduce_concentration" | "review_dependency" | "revisit_decision";
export type Impact = "low" | "medium" | "high" | "critical";

export interface Recommendation {
  id: string;
  type: RecoType;
  title: string;
  rationale: string;
  evidence: string[];
  priority: number; // 0..1 (rank)
  impact: Impact;
  traceTo: { kind: string; id: string; label: string };
}

export interface RecoInputs {
  capabilities: { id: string; name: string; strategicImportance: Impact; busFactor: number; hasBackup: boolean; successionRisk: Impact; fragile: boolean }[];
  successionExposure: { userId: string; userName?: string; capabilities: string[] }[];
  dependencyHubs: { id: string; label: string; blastRadius: number; criticality: Impact }[];
  retrospectives: { decisionId: string; title: string; hindsight: string }[];
}

const IMPACT_W: Record<Impact, number> = { low: 0.25, medium: 0.5, high: 0.75, critical: 1 };

export function recommend(i: RecoInputs): Recommendation[] {
  const recs: Recommendation[] = [];

  // 1. Fragile / no-backup capabilities → cross-train
  for (const c of i.capabilities.filter((x) => x.fragile || !x.hasBackup)) {
    const priority = Math.min(1, 0.5 * IMPACT_W[c.strategicImportance] + 0.5 * IMPACT_W[c.successionRisk]);
    recs.push({
      id: `cross_train:${c.id}`,
      type: "cross_train",
      title: `Cross-train a backup for "${c.name}"`,
      rationale: `"${c.name}" has bus factor ${c.busFactor}${!c.hasBackup ? " (no competent backup)" : ""} and is ${c.strategicImportance} importance — a single departure removes the capability.`,
      evidence: [`bus factor ${c.busFactor}`, `succession risk ${c.successionRisk}`, `strategic importance ${c.strategicImportance}`],
      priority,
      impact: c.successionRisk,
      traceTo: { kind: "capability", id: c.id, label: c.name },
    });
  }

  // 2. Single points of failure (people) → assign backup owner
  for (const p of i.successionExposure) {
    recs.push({
      id: `assign_backup:${p.userId}`,
      type: "assign_backup",
      title: `Assign a backup owner for ${p.userName ?? "this person"}'s sole capabilities`,
      rationale: `${p.userName ?? "This person"} is the only competent holder of ${p.capabilities.join(", ")}; the org cannot absorb their departure.`,
      evidence: [`sole holder of ${p.capabilities.length} strategic capabilit${p.capabilities.length === 1 ? "y" : "ies"}: ${p.capabilities.join(", ")}`],
      priority: Math.min(1, 0.7 + 0.1 * p.capabilities.length),
      impact: p.capabilities.length >= 2 ? "critical" : "high",
      traceTo: { kind: "person", id: p.userId, label: p.userName ?? p.userId },
    });
  }

  // 3. Critical dependency hubs → review / add redundancy
  for (const h of i.dependencyHubs.filter((x) => x.criticality === "high" || x.criticality === "critical")) {
    recs.push({
      id: `review_dependency:${h.id}`,
      type: "review_dependency",
      title: `Reduce reliance on "${h.label}"`,
      rationale: `"${h.label}" is a ${h.criticality} dependency hub — ${h.blastRadius} entities fail downstream if it breaks.`,
      evidence: [`blast radius ${h.blastRadius}`, `criticality ${h.criticality}`],
      priority: Math.min(1, 0.4 + 0.1 * h.blastRadius),
      impact: h.criticality,
      traceTo: { kind: "node", id: h.id, label: h.label },
    });
  }

  // 4. Misjudged decisions → revisit
  for (const d of i.retrospectives.filter((x) => x.hindsight === "misjudged")) {
    recs.push({
      id: `revisit_decision:${d.decisionId}`,
      type: "revisit_decision",
      title: `Revisit decision "${d.title}"`,
      rationale: `"${d.title}" did not work out despite the confidence placed in it — extract the calibration lesson before similar decisions.`,
      evidence: [`hindsight: misjudged`],
      priority: 0.6,
      impact: "high",
      traceTo: { kind: "decision", id: d.decisionId, label: d.title },
    });
  }

  return recs.sort((a, b) => b.priority - a.priority);
}
