// Computation Engine — People Intelligence (the Human Intelligence Layer).
//
// People are not rows; they are nodes whose value is COMPUTED from the graph:
// what they uniquely know, how concentrated the org's knowledge is in them, how
// many things break if they leave. Pure functions over (people × capability
// graph × relationships). Shares the engine's evidence/explanation contract so
// every finding is explainable, not a black-box score.

import { busFactor, COMPETENT, type CapabilityNode, type RiskLevel } from "./capability-intelligence";

export interface PersonRef {
  id: string;
  name: string;
  role: string;
  departmentId?: string | null;
}

/** A person-touching graph edge (from entity_relationships). */
export interface GraphEdge {
  sourceId: string;
  targetId: string;
}

/** Shared engine output contract: a value + the evidence + a plain explanation. */
export interface PersonIntelligence {
  id: string;
  name: string;
  role: string;
  // expertise
  primaryExpertise: string[]; // capabilities they lead (top proficiency, ≥ EXPERT-ish)
  secondaryExpertise: string[]; // competent but not lead
  strategicCoverage: number; // # strategic capabilities they can perform
  soleStrategicCapabilities: string[]; // strategic caps only they can perform
  replacementCandidates: Record<string, string[]>; // capability → who can replace them
  // centrality / dependency
  degreeCentrality: number; // graph edges touching them
  knowledgeConcentration: number; // 0..1 avg share of expertise they hold
  orgDependencyScore: number; // 0..1 how dependent the org is on them
  successionRisk: RiskLevel;
  irreplaceable: boolean;
  // shared explanation/evidence model
  evidence: string[];
  explanation: string;
}

/** Compute the human-intelligence layer for everyone. */
export function analyzePeople(
  people: PersonRef[],
  capabilities: CapabilityNode[],
  edges: GraphEdge[]
): PersonIntelligence[] {
  // index capabilities by holder for O(1) per-person lookup
  const maxDegree = Math.max(1, ...people.map((p) => degree(p.id, edges)));

  return people
    .map((p) => analyzePerson(p, capabilities, edges, maxDegree))
    .sort((a, b) => b.orgDependencyScore - a.orgDependencyScore);
}

function degree(personId: string, edges: GraphEdge[]): number {
  return edges.filter((e) => e.sourceId === personId || e.targetId === personId).length;
}

function analyzePerson(
  p: PersonRef,
  capabilities: CapabilityNode[],
  edges: GraphEdge[],
  maxDegree: number
): PersonIntelligence {
  const mine = capabilities
    .map((c) => ({ cap: c, holder: c.holders.find((h) => h.userId === p.id) }))
    .filter((x): x is { cap: CapabilityNode; holder: NonNullable<typeof x.holder> } => !!x.holder);

  const primaryExpertise: string[] = [];
  const secondaryExpertise: string[] = [];
  const soleStrategic: string[] = [];
  const replacementCandidates: Record<string, string[]> = {};
  let concentrationSum = 0;
  let strategicCoverage = 0;

  for (const { cap, holder } of mine) {
    const competentHolders = cap.holders.filter((h) => h.proficiency >= COMPETENT);
    const isTop = [...cap.holders].sort((a, b) => b.proficiency - a.proficiency)[0]?.userId === p.id;
    if (holder.proficiency >= COMPETENT) (isTop ? primaryExpertise : secondaryExpertise).push(cap.name);

    const strategic = cap.strategicImportance === "high" || cap.strategicImportance === "critical";
    if (strategic && holder.proficiency >= COMPETENT) strategicCoverage++;
    if (strategic && competentHolders.length === 1 && competentHolders[0].userId === p.id)
      soleStrategic.push(cap.name);

    // who could replace them on this capability
    replacementCandidates[cap.name] = competentHolders
      .filter((h) => h.userId !== p.id)
      .map((h) => h.userName ?? h.userId);

    // their share of this capability's total expertise
    const total = cap.holders.reduce((s, h) => s + h.proficiency, 0);
    if (total > 0) concentrationSum += holder.proficiency / total;
  }

  const knowledgeConcentration = mine.length ? round(concentrationSum / mine.length) : 0;
  const deg = degree(p.id, edges);
  const degreeCentrality = deg;

  // org dependency: weighted blend of unique strategic knowledge, breadth of
  // strategic coverage, knowledge concentration, and graph centrality. 0..1.
  const dep =
    0.45 * Math.min(1, soleStrategic.length / 2) +
    0.2 * Math.min(1, strategicCoverage / 3) +
    0.2 * knowledgeConcentration +
    0.15 * (deg / maxDegree);
  const orgDependencyScore = round(dep);

  const successionRisk: RiskLevel =
    soleStrategic.length >= 2 ? "critical" : soleStrategic.length === 1 ? "high" : orgDependencyScore >= 0.5 ? "medium" : "low";
  const irreplaceable = soleStrategic.length > 0;

  // evidence + explanation (shared model)
  const evidence: string[] = [];
  if (soleStrategic.length) evidence.push(`Sole competent holder of strategic capability: ${soleStrategic.join(", ")}`);
  if (strategicCoverage) evidence.push(`Covers ${strategicCoverage} strategic capabilit${strategicCoverage > 1 ? "ies" : "y"}`);
  if (knowledgeConcentration >= 0.5) evidence.push(`Holds ${Math.round(knowledgeConcentration * 100)}% of the expertise in their capabilities`);
  if (deg) evidence.push(`Connected to ${deg} entities in the org graph (degree centrality)`);

  const explanation = irreplaceable
    ? `${p.name} is a single point of failure: they are the only person who can perform ${soleStrategic.join(" and ")}. If they leave, that capability stops until someone is trained.`
    : orgDependencyScore >= 0.5
      ? `${p.name} carries significant organizational load across ${strategicCoverage} strategic capabilities; losing them would strain delivery even though backups exist.`
      : `${p.name} has healthy backup coverage — their departure would be absorbable.`;

  return {
    id: p.id,
    name: p.name,
    role: p.role,
    primaryExpertise,
    secondaryExpertise,
    strategicCoverage,
    soleStrategicCapabilities: soleStrategic,
    replacementCandidates,
    degreeCentrality,
    knowledgeConcentration,
    orgDependencyScore,
    successionRisk,
    irreplaceable,
    evidence,
    explanation,
  };
}

/** "If this person leaves" — the impact set, computed from capabilities + graph. */
export function departureImpact(
  personId: string,
  capabilities: CapabilityNode[],
  edges: GraphEdge[]
): { lostCapabilities: string[]; weakenedCapabilities: string[]; connectedEntities: number } {
  const lost: string[] = [];
  const weakened: string[] = [];
  for (const c of capabilities) {
    const competent = c.holders.filter((h) => h.proficiency >= COMPETENT);
    if (!competent.some((h) => h.userId === personId)) continue;
    if (competent.length === 1) lost.push(c.name);
    else weakened.push(c.name);
  }
  return { lostCapabilities: lost, weakenedCapabilities: weakened, connectedEntities: degree(personId, edges) };
}

/** Org rollup: who's critical / irreplaceable / overloaded with knowledge. */
export function peopleHealth(analyses: PersonIntelligence[]) {
  return {
    total: analyses.length,
    irreplaceable: analyses.filter((a) => a.irreplaceable).length,
    highDependency: analyses.filter((a) => a.orgDependencyScore >= 0.5).length,
    criticalPeople: analyses.filter((a) => a.successionRisk === "critical" || a.successionRisk === "high").map((a) => a.name),
  };
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}
