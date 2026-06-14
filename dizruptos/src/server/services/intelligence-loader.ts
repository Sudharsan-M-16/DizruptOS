// Loaders for the graph/health engines — compose live repositories, run the
// pure engines. (Server reads via service_role; tenant scoping is enforced by
// RLS for direct access and applied here when org context is threaded through.)

import { getRepositories } from "@/server/repositories";
import { dependency, risk, orgHealth, capability, orgMemory, simulation, decision, recommendations, lifecycle, calibration, outcome, learning, narratives, copilot } from "@/server/engine";
import type { DepEdge } from "@/server/engine/dependency-intelligence";
import type { Severity } from "@/server/engine/risk-intelligence";
import type { RecommendationRecord, RecommendationStatus } from "@/server/repositories/types";
import type { Role } from "@/lib/types";
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

/** Pure computation pass — the engine's current ranked recommendations. */
async function computeRecommendations() {
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
  return recommendations.recommend({
    capabilities: analyses,
    successionExposure: succession,
    dependencyHubs: hubs,
    retrospectives: retros,
  });
}

/** The shape the UI/copilot consume: the computed recommendation enriched with
 *  its persisted lifecycle state + prediction/outcome (the closed loop). */
export interface LiveRecommendation extends recommendations.Recommendation {
  status: RecommendationStatus;
  confidence: number | null;
  baselineValue: number | null;
  expectedDelta: number | null;
  actualValue: number | null;
  accuracy: number | null;
  acceptedAt: string | null;
  measuredAt: string | null;
  nextStates: RecommendationStatus[];
}

/** The learning-loop payoff: recommendations become first-class operational
 *  entities. We compute the ranked set, PERSIST any new ones as `pending`
 *  (idempotent — never clobbering lifecycle state), then merge each with its
 *  stored lifecycle + prediction + outcome so nothing is a dead suggestion. */
export async function recommendationsIntel(): Promise<{ recommendations: LiveRecommendation[] }> {
  const repos = getRepositories();
  const computed = await computeRecommendations();

  // Persist newly-surfaced recommendations so they enter the lifecycle.
  await repos.recommendations.upsertComputed(
    computed.map((r) => ({
      id: r.id, type: r.type, title: r.title, rationale: r.rationale, impact: r.impact, priority: r.priority,
      evidence: r.evidence, traceKind: r.traceTo.kind, traceId: r.traceTo.id, traceLabel: r.traceTo.label,
    }))
  );

  const persisted = await repos.recommendations.list();
  const byId = new Map(persisted.map((p) => [p.id, p]));

  // Union: live computed recs (current truth) + any persisted recs that the
  // engine no longer surfaces but that still carry an open/measured lifecycle.
  const merged: LiveRecommendation[] = [];
  const seen = new Set<string>();
  const enrich = (base: recommendations.Recommendation, p?: RecommendationRecord): LiveRecommendation => ({
    ...base,
    status: p?.status ?? "pending",
    confidence: p?.confidence ?? null,
    baselineValue: p?.baselineValue ?? null,
    expectedDelta: p?.expectedDelta ?? null,
    actualValue: p?.actualValue ?? null,
    accuracy: p?.accuracy ?? null,
    acceptedAt: p?.acceptedAt ?? null,
    measuredAt: p?.measuredAt ?? null,
    nextStates: lifecycle.nextStates((p?.status ?? "pending") as lifecycle.LifecycleStatus) as RecommendationStatus[],
  });

  for (const r of computed) {
    seen.add(r.id);
    merged.push(enrich(r, byId.get(r.id)));
  }
  // Recommendations the engine no longer raises but that are mid-lifecycle
  // (accepted/completed/measured) stay visible until measured — no dead ends.
  for (const p of persisted) {
    if (seen.has(p.id) || p.status === "pending" || p.status === "rejected") continue;
    merged.push(enrich(persistedToBase(p), p));
  }

  return { recommendations: merged };
}

function persistedToBase(p: RecommendationRecord): recommendations.Recommendation {
  return {
    id: p.id, type: p.type as recommendations.RecoType, title: p.title,
    rationale: p.rationale ?? "", evidence: p.evidence, priority: p.priority ?? 0,
    impact: (p.impact ?? "medium") as recommendations.Impact,
    traceTo: { kind: p.traceKind ?? "", id: p.traceId ?? "", label: p.traceLabel ?? "" },
  };
}

/** Apply a lifecycle transition. Validates the state machine, writes back a
 *  PREDICTION on accept and scores ACCURACY on measure, persists, and audits.
 *  This is the engine of the learning loop: act → predict → measure → calibrate. */
export async function transitionRecommendation(
  id: string,
  to: RecommendationStatus,
  actor: { id: string; role: Role; name: string },
  opts?: { confidence?: number; expectedDelta?: number; actualValue?: number; rationale?: string }
): Promise<RecommendationRecord> {
  const repos = getRepositories();
  const current = await repos.recommendations.byId(id);
  if (!current) {
    // The rec may be computed-but-not-yet-persisted; force a persist pass.
    await recommendationsIntel();
  }
  const rec = current ?? (await repos.recommendations.byId(id));
  if (!rec) throw new (await import("@/server/repositories")).RepositoryError("NOT_FOUND", `recommendation ${id}`);

  if (!lifecycle.canTransition(rec.status as lifecycle.LifecycleStatus, to as lifecycle.LifecycleStatus)) {
    throw new (await import("@/server/repositories")).RepositoryError(
      "CONFLICT", `cannot move recommendation from ${rec.status} to ${to}`
    );
  }

  const now = new Date().toISOString();
  // actor_id is a uuid FK to users; demo persona ids (e.g. "u-noor") aren't
  // uuids and don't exist in the live table, so only persist a real one.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actor.id);
  const patch: import("@/server/repositories/types").RecommendationPatch = isUuid ? { actorId: actor.id } : {};

  if (to === "accepted") {
    // Prediction writeback — commit, on the record, to expected impact.
    const pred = lifecycle.buildPrediction({
      impact: rec.impact ?? "medium", priority: rec.priority ?? 0.5,
      confidence: opts?.confidence, baselineValue: rec.baselineValue ?? undefined, expectedDelta: opts?.expectedDelta,
    });
    patch.confidence = pred.confidence;
    patch.baselineValue = pred.baselineValue;
    patch.expectedDelta = pred.expectedDelta;
    patch.acceptedAt = now;
  }
  if (to === "rejected" || to === "deferred") patch.decidedAt = now;
  if (to === "measured") {
    const actualValue = opts?.actualValue ?? 0;
    const m = lifecycle.measureAccuracy({
      baselineValue: rec.baselineValue, expectedDelta: rec.expectedDelta, actualValue,
    });
    patch.actualValue = actualValue;
    patch.accuracy = m.accuracy;
    patch.measuredAt = now;
  }

  const updated = await repos.recommendations.transition(id, to, patch);

  // Best-effort audit — never let an audit write failure undo a persisted
  // lifecycle transition.
  try {
    await repos.audit.append({
      id: `aud-rec-${Date.now()}`,
      actorId: actor.id, actorRole: actor.role,
      actionType: `recommendation_${to}`,
      entityType: "recommendation", entityLabel: rec.title,
      detail: opts?.rationale ?? `Recommendation moved to ${to}`,
      at: now,
    });
  } catch { /* audit is observability, not the source of truth */ }

  return updated;
}

/** Learning Intelligence — "are we getting smarter?". Feeds the calibration
 *  engine REAL resolved predictions (measured recommendations carry
 *  confidence + expected vs actual), and rolls up outcome quality + captured
 *  learnings into one accountability surface. */
export async function learningIntelligence() {
  const repos = getRepositories();
  const [recs, outcomes, learnings] = await Promise.all([
    repos.recommendations.list(),
    repos.outcomes.list(),
    repos.learnings.list(),
  ]);

  // Recommendation predictions → calibration.
  const recPreds: calibration.Prediction[] = recs
    .filter((r) => r.confidence != null)
    .map((r) => ({
      id: r.id, kind: "recommendation" as const,
      statement: r.title,
      predictedValue: r.expectedDelta ?? 0,
      confidence: r.confidence ?? 0.5,
      actualValue: r.status === "measured" && r.baselineValue != null && r.actualValue != null
        ? Math.max(0, Math.min(1, r.baselineValue - r.actualValue))
        : null,
    }));

  const report = calibration.calibrationReport(recPreds);

  // Outcome quality (decision outcomes) as a second accuracy lens.
  const outcomeSummary = outcome.outcomeQualitySummary(
    outcomes.map((o) => ({ id: o.id, decisionId: o.decisionId, status: o.status, actual: o.actual, confidence: o.confidence }))
  );

  const learningIntel = learning.analyzeLearnings(
    learnings.map((l) => ({ id: l.id, title: l.title, insight: l.insight, decisionId: l.decisionId, capabilityId: l.capabilityId, projectId: l.projectId }))
  );

  const lifecycleCounts = recs.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1; return acc;
  }, {});

  return {
    calibration: report,
    recommendationAccuracy: report.byKind.recommendation?.avgAccuracy ?? null,
    outcomes: outcomeSummary,
    learning: learningIntel,
    lifecycle: {
      total: recs.length,
      counts: lifecycleCounts,
      accepted: recs.filter((r) => r.acceptedAt).length,
      measured: recs.filter((r) => r.status === "measured").length,
    },
    velocity: {
      // Learning velocity: share of acted-on recs that have been measured.
      measuredOfAccepted: recs.filter((r) => r.acceptedAt).length
        ? Math.round((recs.filter((r) => r.status === "measured").length / recs.filter((r) => r.acceptedAt).length) * 1000) / 1000
        : null,
    },
  };
}

/** Executive Narrative — a written, periodized brief composed from the live
 *  engines (health, recommendations, lifecycle, calibration, outcomes, learning,
 *  risk). Deterministic prose over real numbers; the in-product narrative the
 *  sprint asked for (not a markdown file). */
export async function executiveNarrative(period: narratives.Period = "weekly") {
  const repos = getRepositories();
  const [health, recs, learn, risksI, persisted] = await Promise.all([
    orgHealthIntelligence(),
    recommendationsIntel(),
    learningIntelligence(),
    riskIntelligence(),
    repos.recommendations.list(),
  ]);

  const acted = persisted
    .filter((r) => r.acceptedAt || r.status === "completed" || r.status === "measured")
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
    .map((r) => ({ title: r.title, status: r.status }));

  return narratives.composeNarrative({
    period,
    health: { score: health.health.score, band: health.health.band, topConcerns: health.health.topConcerns },
    recommendations: recs.recommendations.map((r) => ({ title: r.title, impact: r.impact, priority: r.priority, status: r.status })),
    acted,
    calibration: {
      avgAccuracy: learn.calibration.avgAccuracy,
      avgCalibrationGap: learn.calibration.avgCalibrationGap,
      observed: learn.calibration.observed,
      trend: learn.calibration.trend,
    },
    outcomes: { measured: learn.outcomes.measured, avgSuccessScore: learn.outcomes.avgSuccessScore, failing: learn.outcomes.failing },
    learning: { reusableCount: learn.learning.reusable.length, repeatedMistakes: learn.learning.repeatedMistakes },
    risks: risksI.risks.map((r) => ({ title: r.title, band: r.band })),
  });
}

export async function askCopilot(question: string) {
  const { peopleIntelligence } = await import("./people-loader");
  const repos = getRepositories();
  const [capGraph, health, recs, risksI, ppl, learn, persistedRecs, decisions, outcomes] = await Promise.all([
    loadCapabilityGraph(),
    orgHealthIntelligence(),
    recommendationsIntel(),
    riskIntelligence(),
    peopleIntelligence(),
    learningIntelligence(),
    repos.recommendations.list(),
    repos.decisions.list(),
    repos.outcomes.list(),
  ]);

  const measured = persistedRecs.filter((r) => r.status === "measured" && r.accuracy != null);
  const bestDecisions = decisions
    .filter((d) => outcomes.some((o) => o.decisionId === d.id && o.status === "succeeded"))
    .map((d) => ({ title: d.title }));
  const learningCtx = {
    worked: [...measured].sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0)).map((r) => ({ title: r.title, accuracy: r.accuracy ?? 0 })),
    failed: [...measured].sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0)).map((r) => ({ title: r.title, accuracy: r.accuracy ?? 0 })),
    recentlyActed: persistedRecs
      .filter((r) => r.acceptedAt || r.status === "completed" || r.status === "accepted")
      .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
      .map((r) => ({ title: r.title, status: r.status })),
    avgAccuracy: learn.calibration.avgAccuracy,
    calibrationGap: learn.calibration.avgCalibrationGap,
    blindSpots: learn.learning.repeatedMistakes.map((m) => m.theme),
    bestDecisions,
  };

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
    learning: learningCtx,
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
