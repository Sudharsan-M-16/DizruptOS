// Generic relationship layer (PRD §21) — graph-native, not graph-inspired.
// Edges are typed records drawn from the canonical registry, with strength,
// confidence, and evidence provenance. The UI graph, impact analysis, and
// future digital-twin simulations all read from this single layer.
//
// Production mapping: this module mirrors the `entity_relationships` table.
// 1-hop traversals stay O(edges) here and O(1)-indexed in Postgres; 2–4 hop
// queries move to the materialized `entity_paths` cache (PRD §21.4).

export type EntityType =
  | "employee"
  | "team"
  | "project"
  | "task"
  | "capability"
  | "system"
  | "decision"
  | "risk"
  | "process"
  | "vendor"
  | "meeting"
  | "commitment"
  | "knowledge"
  | "goal"
  | "customer"
  | "service"
  | "revenue_stream";

/** Canonical relationship type registry (PRD §21.3). Closed set — additions
 *  require a schema migration, never ad-hoc strings. */
export type RelationshipType =
  | "owns"
  | "belongs_to"
  | "reports_to"
  | "has_expertise_in"
  | "assigned_to"
  | "made"
  | "owns_risk"
  | "made_commitment"
  | "delivers"
  | "executes"
  | "executed_by"
  | "produces"
  | "linked_to"
  | "exposes"
  | "depends_on"
  | "documented_by"
  | "implemented_by"
  | "delivers_value_to"
  | "threatened_by"
  | "enabled_by"
  | "supported_by"
  | "mitigates"
  | "made_in"
  | "causes"
  | "governs"
  | "generates"
  | "funds"
  | "serves"
  | "at_risk"
  | "supersedes"
  | "blocks";

export interface EntityRef {
  id: string;
  type: EntityType;
}

export interface RelationshipEdge {
  id: string;
  source: EntityRef;
  target: EntityRef;
  type: RelationshipType;
  strength: number; // 0–1: weak → load-bearing
  confidence: number; // 0–1: asserted vs derived
  evidence: "observed" | "declared" | "inferred" | "ai_derived";
}

let seq = 0;
const edge = (
  source: EntityRef,
  type: RelationshipType,
  target: EntityRef,
  opts: Partial<Pick<RelationshipEdge, "strength" | "confidence" | "evidence">> = {}
): RelationshipEdge => ({
  id: `rel-${++seq}`,
  source,
  target,
  type,
  strength: opts.strength ?? 1,
  confidence: opts.confidence ?? 1,
  evidence: opts.evidence ?? "declared",
});

const ref = (type: EntityType, id: string): EntityRef => ({ id, type });

/* ----------------------------- the seed graph ------------------------------ */
// The Atlas value chain: Goal → Project → Capability → Service/Vendor →
// Customer → Risk. This is the slice the dependency view renders, and the
// slice the "what breaks if Sarah leaves" scenario traverses.

export const relationships: RelationshipEdge[] = [
  // Strategy spine
  edge(ref("goal", "g-revenue"), "funds", ref("project", "p-atlas"), { strength: 1 }),
  edge(ref("goal", "g-expansion"), "linked_to", ref("project", "p-helio"), { strength: 0.8 }),
  edge(ref("project", "p-atlas"), "serves", ref("customer", "c-acme"), { strength: 1 }),

  // Execution
  edge(ref("project", "p-atlas"), "executed_by", ref("employee", "u-sarah"), { strength: 0.95, evidence: "observed" }),
  edge(ref("project", "p-helio"), "executed_by", ref("employee", "u-ahmed"), { strength: 0.7, evidence: "observed" }),
  edge(ref("project", "p-atlas"), "produces", ref("capability", "cap-payments"), { strength: 1 }),

  // Capability dependencies
  edge(ref("capability", "cap-payments"), "supported_by", ref("vendor", "v-clearsettle"), { strength: 0.85 }),
  edge(ref("capability", "cap-payments"), "threatened_by", ref("risk", "r-1"), { strength: 0.9, evidence: "inferred", confidence: 0.92 }),
  edge(ref("employee", "u-sarah"), "has_expertise_in", ref("capability", "cap-payments"), { strength: 0.93, evidence: "observed" }),
  edge(ref("employee", "u-ahmed"), "has_expertise_in", ref("capability", "cap-payments"), { strength: 0.61, evidence: "observed" }),

  // Risk causality
  edge(ref("vendor", "v-clearsettle"), "causes", ref("risk", "r-2"), { strength: 0.9, evidence: "observed", confidence: 0.95 }),
  edge(ref("employee", "u-sarah"), "owns_risk", ref("risk", "r-1"), { strength: 1 }),
  edge(ref("decision", "dec-1"), "mitigates", ref("risk", "r-1"), { strength: 0.6, confidence: 0.8 }),

  // Cross-training mitigation in motion
  edge(ref("employee", "u-sarah"), "depends_on", ref("employee", "u-ahmed"), { strength: 0.5, evidence: "declared", confidence: 0.75 }),
];

/* ------------------------------- traversal --------------------------------- */

export const edgesFrom = (
  graph: RelationshipEdge[],
  id: string,
  type?: RelationshipType
): RelationshipEdge[] =>
  graph.filter((e) => e.source.id === id && (!type || e.type === type));

export const edgesTo = (
  graph: RelationshipEdge[],
  id: string,
  type?: RelationshipType
): RelationshipEdge[] =>
  graph.filter((e) => e.target.id === id && (!type || e.type === type));

export const neighbors = (graph: RelationshipEdge[], id: string): EntityRef[] => {
  const seen = new Map<string, EntityRef>();
  for (const e of graph) {
    if (e.source.id === id) seen.set(e.target.id, e.target);
    if (e.target.id === id) seen.set(e.source.id, e.source);
  }
  return Array.from(seen.values());
};

/** Bounded BFS — the in-memory analogue of the entity_paths cache.
 *  Returns every entity reachable within `maxHops`, with its hop distance. */
export function reachable(
  graph: RelationshipEdge[],
  startId: string,
  maxHops = 3
): { ref: EntityRef; hops: number }[] {
  const out: { ref: EntityRef; hops: number }[] = [];
  const visited = new Set<string>([startId]);
  let frontier = [startId];
  for (let hop = 1; hop <= maxHops && frontier.length; hop++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const n of neighbors(graph, id)) {
        if (!visited.has(n.id)) {
          visited.add(n.id);
          out.push({ ref: n, hops: hop });
          next.push(n.id);
        }
      }
    }
    frontier = next;
  }
  return out;
}

/** Cycle guard for dependency edges (PRD §2.4: server-side DFS before any
 *  edge write; HTTP 422 with the cycle path on violation). */
export function wouldCreateCycle(
  graph: RelationshipEdge[],
  sourceId: string,
  targetId: string,
  type: RelationshipType = "blocks"
): { cycle: boolean; path: string[] } {
  // Adding source → target creates a cycle iff target already reaches source.
  const stack = [targetId];
  const parent = new Map<string, string>();
  const visited = new Set<string>([targetId]);
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === sourceId) {
      const path = [sourceId];
      let p: string | undefined = parent.get(sourceId);
      while (p) {
        path.push(p);
        p = parent.get(p);
      }
      return { cycle: true, path: [...path.reverse(), targetId] };
    }
    for (const e of edgesFrom(graph, cur, type)) {
      if (!visited.has(e.target.id)) {
        visited.add(e.target.id);
        parent.set(e.target.id, cur);
        stack.push(e.target.id);
      }
    }
  }
  return { cycle: false, path: [] };
}

/** Bus factor — expertise concentration on a capability (PRD §8.3).
 *  1.0 = one person holds effectively all depth; lower is healthier. */
export function expertiseConcentration(
  graph: RelationshipEdge[],
  capabilityId: string
): { holderId: string; share: number }[] {
  const holders = edgesTo(graph, capabilityId, "has_expertise_in");
  const total = holders.reduce((s, e) => s + e.strength, 0);
  if (total === 0) return [];
  return holders
    .map((e) => ({ holderId: e.source.id, share: e.strength / total }))
    .sort((a, b) => b.share - a.share);
}
