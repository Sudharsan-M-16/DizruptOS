// Intelligence loader — the seam between the repository layer and the pure
// computation engine. Assembles the capability graph from repositories, then
// hands it to the engine. Keeps layers clean: repos fetch, engine computes,
// API serves; no computation in routes, no fetching in the engine.

import { getRepositories, RepositoryError } from "@/server/repositories";
import { createMemoryRepositories } from "@/server/repositories/memory";
import { capability } from "@/server/engine";
import type { CapabilityNode } from "@/server/engine/capability-intelligence";

/** Live capability graph in the engine's input shape. */
export async function loadCapabilityGraph(): Promise<CapabilityNode[]> {
  let repos = getRepositories();
  let caps, edges;
  try {
    [caps, edges] = await Promise.all([
      repos.capabilities.list(),
      repos.employeeCapabilities.list(),
    ]);
  } catch (err) {
    if (!(err instanceof RepositoryError)) repos = createMemoryRepositories();
    [caps, edges] = await Promise.all([
      repos.capabilities.list(),
      repos.employeeCapabilities.list(),
    ]);
  }
  return caps.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category ?? undefined,
    strategicImportance: c.strategicImportance,
    holders: edges
      .filter((e) => e.capabilityId === c.id)
      .map((e) => ({ userId: e.userId, userName: e.userName ?? undefined, proficiency: e.proficiency })),
  }));
}

/** The full Capability Intelligence payload — every question the surface asks. */
export async function capabilityIntelligence() {
  const nodes = await loadCapabilityGraph();
  return {
    health: capability.capabilityHealth(nodes), // org rollup
    capabilities: capability.rankByRisk(nodes), // ranked most-at-risk first
    scarcity: capability.capabilityScarcity(nodes), // fewest holders first
    backupCoverage: capability.backupCoverage(nodes), // covered vs uncovered
    successionExposure: capability.successionExposure(nodes), // single points of failure
    experts: nodes.map(capability.experts), // who knows / who can replace
  };
}
