// Computation Engine — Dependency Intelligence.
//
// Pure graph traversal over directed relationships (source depends_on/executes/
// threatened_by target). Computes what breaks if a node fails (blast radius),
// how many things lean on it (criticality), where dependency concentrates, and
// which nodes are fragile single points. Shared contract: score + evidence +
// explanation.

export interface DepEdge {
  sourceId: string;
  targetId: string;
  relationshipType?: string;
}

/** Nodes that directly depend on `id` (incoming edges → it). */
export function dependents(id: string, edges: DepEdge[]): string[] {
  return edges.filter((e) => e.targetId === id).map((e) => e.sourceId);
}

/** Transitive blast radius: everything (up to maxHops) that leans on `id`. */
export function blastRadius(id: string, edges: DepEdge[], maxHops = 4): { reached: string[]; hops: number } {
  const seen = new Set<string>();
  let frontier = [id];
  let hops = 0;
  while (frontier.length && hops < maxHops) {
    const next: string[] = [];
    for (const n of frontier) {
      for (const dep of dependents(n, edges)) {
        if (!seen.has(dep) && dep !== id) {
          seen.add(dep);
          next.push(dep);
        }
      }
    }
    frontier = next;
    hops++;
  }
  return { reached: [...seen], hops };
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface DependencyAnalysis {
  id: string;
  directDependents: number;
  blastRadius: number;
  criticality: RiskLevel;
  evidence: string[];
  explanation: string;
}

/** Criticality of a node = reach of its blast radius, banded. */
export function analyzeDependency(id: string, label: string, edges: DepEdge[]): DependencyAnalysis {
  const direct = dependents(id, edges).length;
  const br = blastRadius(id, edges);
  const reach = br.reached.length;
  const criticality: RiskLevel = reach >= 5 ? "critical" : reach >= 3 ? "high" : reach >= 1 ? "medium" : "low";
  return {
    id,
    directDependents: direct,
    blastRadius: reach,
    criticality,
    evidence: [
      `${direct} entit${direct === 1 ? "y depends" : "ies depend"} on it directly`,
      `${reach} entit${reach === 1 ? "y is" : "ies are"} in its ${br.hops}-hop blast radius`,
    ],
    explanation:
      reach === 0
        ? `${label} has no downstream dependents — failing it is locally contained.`
        : `If ${label} fails, ${reach} downstream entit${reach === 1 ? "y is" : "ies are"} affected within ${br.hops} hops${criticality === "critical" ? " — a critical hub" : ""}.`,
  };
}

/** Dependency concentration: the hubs everything leans on, ranked. */
export function dependencyConcentration(
  nodes: { id: string; label: string }[],
  edges: DepEdge[]
): { id: string; label: string; blastRadius: number; criticality: RiskLevel }[] {
  return nodes
    .map((n) => {
      const a = analyzeDependency(n.id, n.label, edges);
      return { id: n.id, label: n.label, blastRadius: a.blastRadius, criticality: a.criticality };
    })
    .sort((a, b) => b.blastRadius - a.blastRadius);
}
