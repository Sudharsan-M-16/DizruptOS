// Computation Engine — Scenario Simulation.
//
// "Simulate the future": apply a hypothetical mutation to the live graph and
// recompute the intelligence, returning the BEFORE → AFTER delta with a reasoned
// explanation. Pure — composes the capability + dependency engines, no DB.
// Foundation for workforce / capability / dependency / project / decision sims.

import { capabilityHealth, busFactor, COMPETENT, type CapabilityNode } from "./capability-intelligence";
import { blastRadius, type DepEdge } from "./dependency-intelligence";

/* --------------------------------- mutators -------------------------------- */
function withoutHolder(caps: CapabilityNode[], userId: string): CapabilityNode[] {
  return caps.map((c) => ({ ...c, holders: c.holders.filter((h) => h.userId !== userId) }));
}
function withHolder(caps: CapabilityNode[], capabilityId: string, holder: { userId: string; userName?: string; proficiency: number }): CapabilityNode[] {
  return caps.map((c) => (c.id === capabilityId ? { ...c, holders: [...c.holders, holder] } : c));
}

export interface SimResult<T> {
  scenario: string;
  before: T;
  after: T;
  evidence: string[];
  explanation: string;
}

/* ------------------------------ departure sim ------------------------------ */
export interface DepartureResult extends SimResult<ReturnType<typeof capabilityHealth>> {
  lostCapabilities: string[]; // would have ZERO competent holders after departure
  weakenedCapabilities: string[]; // still covered but thinner
  graphReach: number; // entities connected in the org graph
}

export function simulateDeparture(
  userId: string,
  userName: string,
  caps: CapabilityNode[],
  edges: DepEdge[]
): DepartureResult {
  const before = capabilityHealth(caps);
  const after = capabilityHealth(withoutHolder(caps, userId));

  const held = caps.filter((c) => c.holders.some((h) => h.userId === userId && h.proficiency >= COMPETENT));
  const lost: string[] = [];
  const weakened: string[] = [];
  for (const c of held) {
    const bfBefore = busFactor(c.holders);
    const bfAfter = busFactor(c.holders.filter((h) => h.userId !== userId));
    if (bfAfter === 0) lost.push(c.name);
    else if (bfAfter < bfBefore) weakened.push(c.name);
  }
  const graphReach = blastRadius(userId, edges).reached.length;

  return {
    scenario: `Departure: ${userName}`,
    before,
    after,
    lostCapabilities: lost,
    weakenedCapabilities: weakened,
    graphReach,
    evidence: [
      lost.length ? `${lost.length} capabilit${lost.length === 1 ? "y loses its only competent holder" : "ies lose their only competent holder"}: ${lost.join(", ")}` : "No capability is left without a competent holder",
      weakened.length ? `${weakened.length} capabilit${weakened.length === 1 ? "y is" : "ies are"} weakened: ${weakened.join(", ")}` : "No additional capabilities weakened",
      `Fragile capabilities: ${before.fragile} → ${after.fragile}`,
      `Connected to ${graphReach} entities in the org graph`,
    ],
    explanation:
      lost.length > 0
        ? `If ${userName} leaves, the organization immediately loses the ability to perform ${lost.join(" and ")} (no trained backup). Fragile capabilities rise ${before.fragile}→${after.fragile}. Mitigation: cross-train a backup before any transition.`
        : `If ${userName} leaves, all their capabilities retain a competent holder; impact is absorbable (fragile ${before.fragile}→${after.fragile}).`,
  };
}

/* ------------------------------ staffing sim ------------------------------- */
export function simulateStaffing(
  additions: { capabilityId: string; capabilityName: string; userName: string; proficiency: number }[],
  caps: CapabilityNode[]
): SimResult<ReturnType<typeof capabilityHealth>> {
  let after = caps;
  for (const a of additions) {
    after = withHolder(after, a.capabilityId, { userId: `hire:${a.userName}`, userName: a.userName, proficiency: a.proficiency });
  }
  const b = capabilityHealth(caps);
  const aft = capabilityHealth(after);
  return {
    scenario: `Hire: ${additions.map((a) => `${a.userName}→${a.capabilityName}`).join(", ")}`,
    before: b,
    after: aft,
    evidence: [
      `Fragile capabilities: ${b.fragile} → ${aft.fragile}`,
      `No-backup capabilities: ${b.noBackup} → ${aft.noBackup}`,
    ],
    explanation:
      aft.fragile < b.fragile || aft.noBackup < b.noBackup
        ? `This hiring plan reduces fragility (${b.fragile}→${aft.fragile}) and closes ${b.noBackup - aft.noBackup} backup gap(s).`
        : `This hiring plan does not change capability fragility — consider targeting an at-risk capability instead.`,
  };
}

/* --------------------------- project / node slip --------------------------- */
export function simulateNodeFailure(nodeId: string, label: string, edges: DepEdge[]) {
  const br = blastRadius(nodeId, edges);
  return {
    scenario: `Failure: ${label}`,
    affectedEntities: br.reached,
    affectedCount: br.reached.length,
    hops: br.hops,
    evidence: [`${br.reached.length} downstream entit${br.reached.length === 1 ? "y" : "ies"} within ${br.hops} hops`],
    explanation:
      br.reached.length > 0
        ? `If ${label} fails or slips, ${br.reached.length} downstream entit${br.reached.length === 1 ? "y is" : "ies are"} impacted within ${br.hops} hops — plan mitigation for the blast radius, not just the node.`
        : `${label} has no mapped downstream dependents — failure is locally contained.`,
  };
}
