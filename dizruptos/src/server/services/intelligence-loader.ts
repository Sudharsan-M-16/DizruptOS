// Loaders for the graph/health engines — compose live repositories, run the
// pure engines. (Server reads via service_role; tenant scoping is enforced by
// RLS for direct access and applied here when org context is threaded through.)

import { getRepositories } from "@/server/repositories";
import { dependency, risk, orgHealth, capability, orgMemory, simulation, decision, recommendations, copilot } from "@/server/engine";
import type { DepEdge } from "@/server/engine/dependency-intelligence";
import type { Severity } from "@/server/engine/risk-intelligence";
import { loadCapabilityGraph } from "./capability-loader";
import { severityOf } from "@/lib/risk";

async function edges(): Promise<{ edges: DepEdge[]; nodes: { id: string; label: string }[] }> {
  const rels = await getRepositories().relationships.list();
  const edges = rels.map((r) => ({ sourceId: r.sourceId, targetId: r.targetId, relationshipType: r.relationshipType }));
  const ids = new Set<string>();
  rels.forEach((r) => { ids.add(r.sourceId); ids.add(r.targetId); });
  return { edges, nodes: [...ids].map((id) => ({ id, label: id })) };
}

export async function nodeFailureSimulation(nodeId: string, label: string) {
  const { edges: e } = await edges();
  return simulation.simulateNodeFailure(nodeId, label, e);
}

export async function staffingSimulation(capabilityId: string, userName: string, proficiency: number) {
  const caps = await loadCapabilityGraph();
  const capabilityName = caps.find((c) => c.id === capabilityId)?.name ?? capabilityId;
  return simulation.simulateStaffing([{ capabilityId, capabilityName, userName, proficiency }], caps);
}

/** The learning-loop payoff: ranked, evidence-backed, traceable recommendations. */
export async function recommendationsIntel() {
  const repos = getRepositories();
  const [capGraph, ge, decisions, outcomes] = await Promise.all([
    loadCapabilityGraph(),
    edges(),
    repos.decisions.list(),
    repos.outcomes.list(),
  ]);
  const analyses = capability.rankByRisk(capGraph).map((a) => ({
    id: a.id, name: a.name, strategicImportance: a.strategicImportance,
    busFactor: a.busFactor, hasBackup: a.hasBackup, successionRisk: a.successionRisk, fragile: a.fragile,
  }));
  const succession = capability.successionExposure(capGraph);
  const hubs = dependency.dependencyConcentration(ge.nodes, ge.edges).map((h) => ({
    id: h.id, label: h.label, blastRadius: h.blastRadius, criticality: h.criticality,
  }));
  const retros = decisions.map((d) => {
    const os = outcomes.find((o) => o.decisionId === d.id)?.status ?? null;
    const r = decision.retrospective({
      id: d.id, title: d.title, status: d.status as never,
      confidenceLevel: d.confidenceLevel ?? undefined, outcomeStatus: os, rationale: d.rationale,
    });
    return { decisionId: r.decisionId, title: r.title, hindsight: r.hindsight };
  });
  return {
    recommendations: recommendations.recommend({
      capabilities: analyses,
      successionExposure: succession,
      dependencyHubs: hubs,
      retrospectives: retros,
    }),
  };
}

export async function askCopilot(question: string) {
  const { peopleIntelligence } = await import("./people-loader");
  const [capGraph, health, recs, risksI, ppl] = await Promise.all([
    loadCapabilityGraph(),
    orgHealthIntelligence(),
    recommendationsIntel(),
    riskIntelligence(),
    peopleIntelligence(),
  ]);

  let departure: { name: string; lost: string[]; weakened: string[]; explanation: string } | null = null;
  const names = ppl.people.map((p) => p.name);
  const matched = copilot.personFromQuestion(question, names);
  if (matched) {
    const person = ppl.people.find((p) => p.name === matched)!;
    const sim = await departureSimulation(person.id);
    departure = { name: matched, lost: sim.lostCapabilities, weakened: sim.weakenedCapabilities, explanation: sim.explanation };
  }

  const ctx = {
    capabilities: capability.rankByRisk(capGraph).map((c) => ({
      name: c.name, successionRisk: c.successionRisk, busFactor: c.busFactor, fragile: c.fragile, strategicImportance: c.strategicImportance,
    })),
    health: health.health,
    recommendations: recs.recommendations.map((r) => ({ title: r.title, rationale: r.rationale, impact: r.impact, priority: r.priority, evidence: r.evidence })),
    succession: capability.successionExposure(capGraph),
    people: ppl.people.map((p) => ({ name: p.name, orgDependencyScore: p.orgDependencyScore, irreplaceable: p.irreplaceable, successionRisk: p.successionRisk })),
    risks: risksI.risks.map((r) => ({ title: r.title, band: r.band })),
    departure,
  };
  return copilot.answer(question, ctx);
}

export async function departureSimulation(personId: string) {
  const [caps, { edges: e }] = await Promise.all([loadCapabilityGraph(), edges()]);
  const userName = caps.flatMap((c) => c.holders).find((h) => h.userId === personId)?.userName ?? personId;
  return simulation.simulateDeparture(personId, userName, caps, e);
}

export async function dependencyIntelligence() {
  const { edges: e, nodes } = await edges();
  return { hubs: dependency.dependencyConcentration(nodes, e) };
}

export async function riskIntelligence() {
  const repos = getRepositories();
  const [risks, { edges: e }] = await Promise.all([repos.risks.list(), edges()]);
  const nodes = risks.map((r) => ({
    id: r.id,
    title: r.title,
    severity: severityOf(r) as Severity,
    threatensId: r.projectId ?? null,
  }));
  return { risks: risk.rankRisks(nodes, e) };
}

export async function orgHealthIntelligence() {
  const repos = getRepositories();
  const [capGraph, decisions, outcomes, approvals, capacity] = await Promise.all([
    loadCapabilityGraph(),
    repos.decisions.list(),
    repos.outcomes.list(),
    repos.approvals.list(),
    repos.capacity.list(),
  ]);
  const capHealth = capability.capabilityHealth(capGraph);
  const gov = orgMemory.governanceSignals(approvals.map((a) => ({ status: a.status, approverRole: a.approverRole })));

  const total = capHealth.total || 1;
  const overloaded = capacity.filter((c) => c.allocatedHours >= 40).length;
  const grounded = decisions.length
    ? decisions.filter((d) => outcomes.some((o) => o.decisionId === d.id)).length / decisions.length
    : 0;

  const inputs = {
    capabilityFragility: capHealth.fragile / total,
    successionExposure: capHealth.strategicAtRisk / total,
    dependencyConcentration: 0.3, // placeholder until dependency hubs are normalized org-wide
    workloadPressure: capacity.length ? overloaded / capacity.length : 0,
    governanceBottleneck: (gov.pending) / Math.max(1, approvals.length),
    decisionGrounding: grounded,
  };
  return { health: orgHealth.organizationalHealth(inputs), inputs, capabilityHealth: capHealth, governance: gov };
}
