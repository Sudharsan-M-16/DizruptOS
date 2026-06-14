// People Intelligence loader — assembles the human-intelligence inputs from the
// live graph (capabilities + holders + relationships) and runs the engine.
// People are derived from capability holders + graph nodes, so this works
// identically on memory and Supabase without depending on the people↔users
// model reconciliation.

import { getRepositories } from "@/server/repositories";
import { people as peopleEngine, capability } from "@/server/engine";
import type { CapabilityNode } from "@/server/engine/capability-intelligence";
import type { PersonRef, GraphEdge } from "@/server/engine/people-intelligence";

async function buildContext() {
  const repos = getRepositories();
  const [caps, edges, rels] = await Promise.all([
    repos.capabilities.list(),
    repos.employeeCapabilities.list(),
    repos.relationships.list(),
  ]);

  const nodes: CapabilityNode[] = caps.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category ?? undefined,
    strategicImportance: c.strategicImportance,
    holders: edges
      .filter((e) => e.capabilityId === c.id)
      .map((e) => ({ userId: e.userId, userName: e.userName ?? undefined, proficiency: e.proficiency })),
  }));

  // People = distinct holders (id + name come from the capability edges).
  const seen = new Map<string, PersonRef>();
  for (const e of edges) {
    if (!seen.has(e.userId)) seen.set(e.userId, { id: e.userId, name: e.userName ?? e.userId, role: "" });
  }
  const people = [...seen.values()];

  const personEdges: GraphEdge[] = rels
    .filter((r) => r.sourceType === "user" || r.targetType === "user")
    .map((r) => ({ sourceId: r.sourceId, targetId: r.targetId }));

  return { nodes, people, personEdges };
}

/** The People Intelligence payload — every question the surface asks. */
export async function peopleIntelligence() {
  const { nodes, people, personEdges } = await buildContext();
  const analyses = peopleEngine.analyzePeople(people, nodes, personEdges);
  return {
    health: peopleEngine.peopleHealth(analyses),
    people: analyses, // already sorted by org-dependency
    capabilityHealth: capability.capabilityHealth(nodes), // shared context
  };
}

/** "What happens if this person leaves?" — computed impact set. */
export async function personDepartureImpact(personId: string) {
  const { nodes, personEdges } = await buildContext();
  return peopleEngine.departureImpact(personId, nodes, personEdges);
}
