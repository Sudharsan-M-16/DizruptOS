// In-memory repository — the demo-mode backend. Same contracts, same laws
// (atomic reassign, insert-only audit) as the Supabase implementation, so
// services and API routes cannot tell the difference.

import {
  auditEvents,
  capacity as seedCapacity,
  employees,
  proposals as seedProposals,
  tasks as seedTasks,
} from "@/lib/data";
import type {
  AuditEvent,
  CapacityCell,
  Proposal,
  Task,
} from "@/lib/types";
import { projects, risks } from "@/lib/data";
import {
  RepositoryError,
  type Approval,
  type AssumptionRecord,
  type Capability,
  type DecisionRecord,
  type EmployeeCapability,
  type EvidenceRecord,
  type HypothesisRecord,
  type LearningRecord,
  type OutcomeRecord,
  type RecommendationRecord,
  type Repositories,
} from "./types";

// Capability graph seed — mirrors supabase/seed_capabilities.sql so demo mode
// computes the same intelligence as the live backend.
const capSeed: Capability[] = [
  { id: "cap-payments", name: "Payments Systems", category: "engineering", strategicImportance: "critical" },
  { id: "cap-cloud", name: "Cloud Infrastructure", category: "engineering", strategicImportance: "high" },
  { id: "cap-frontend", name: "Frontend Engineering", category: "engineering", strategicImportance: "medium" },
  { id: "cap-finance", name: "Finance & Modeling", category: "finance", strategicImportance: "high" },
  { id: "cap-vendor", name: "Vendor Negotiation", category: "operations", strategicImportance: "medium" },
];
const empCapSeed: EmployeeCapability[] = [
  { userId: "u-ahmed", userName: "Ahmed Hassan", capabilityId: "cap-payments", proficiency: 5, isPrimary: true },
  { userId: "u-priya", userName: "Priya Sharma", capabilityId: "cap-payments", proficiency: 3, isPrimary: false },
  { userId: "u-ahmed", userName: "Ahmed Hassan", capabilityId: "cap-cloud", proficiency: 4, isPrimary: true },
  { userId: "u-elias", userName: "Elias Brandt", capabilityId: "cap-cloud", proficiency: 4, isPrimary: true },
  { userId: "u-asha", userName: "Asha Venkat", capabilityId: "cap-frontend", proficiency: 4, isPrimary: true },
  { userId: "u-ahmed", userName: "Ahmed Hassan", capabilityId: "cap-frontend", proficiency: 3, isPrimary: false },
  { userId: "u-priya", userName: "Priya Sharma", capabilityId: "cap-frontend", proficiency: 3, isPrimary: false },
  { userId: "u-noor", userName: "Noor Al-Rashid", capabilityId: "cap-finance", proficiency: 5, isPrimary: true },
  { userId: "u-noor", userName: "Noor Al-Rashid", capabilityId: "cap-vendor", proficiency: 4, isPrimary: true },
];

// Decision-memory seed — demo mode previously had NO decision/outcome/learning
// graph (it lived only in the DB), leaving the memory + decisions surfaces empty
// offline. This small, coherent graph mirrors the kind of records the live DB
// holds so the Organizational Memory workspace + Decision Intelligence are
// demonstrable in demo mode, including the 0011 lineage ontology.
const decisionSeed: DecisionRecord[] = [
  { id: "dec-dualwrite", title: "Dual-write Payments cutover", rationale: "Migrate Atlas Payments with a feature-flagged dual-write to bound cutover risk and allow instant rollback.", context: "Atlas Payments Migration — CRITICAL project, Acme Corp exposure $4.2M ARR.", confidenceLevel: "high", status: "ACTIVE", ownerId: "u-ahmed", projectId: "p-atlas", supersededBy: null, createdAt: "2026-03-02T09:00:00Z" },
  { id: "dec-vendor", title: "Consolidate to a single cloud vendor", rationale: "Reduce overhead by standardizing on one provider for committed-use discounts.", context: "Cost-reduction initiative.", confidenceLevel: "medium", status: "ACTIVE", ownerId: "u-noor", projectId: null, supersededBy: null, createdAt: "2026-02-10T09:00:00Z" },
  { id: "dec-frontend", title: "Adopt a design-system-first frontend", rationale: "Standardize UI on a tokenized design system to cut rework and speed delivery.", context: "Frontend velocity initiative.", confidenceLevel: "medium", status: "ACTIVE", ownerId: "u-asha", projectId: null, supersededBy: null, createdAt: "2026-04-01T09:00:00Z" },
];
const outcomeSeed: OutcomeRecord[] = [
  { id: "out-dualwrite", decisionId: "dec-dualwrite", expected: "Zero-downtime cutover, rollback within 5 min if needed.", actual: "Cutover completed with one 8-minute partial degradation; rollback path validated.", measured: "2026-04-15", status: "succeeded", confidence: 0.9, projectId: "p-atlas", capabilityId: "cap-payments", createdAt: "2026-04-15T09:00:00Z" },
  { id: "out-vendor", decisionId: "dec-vendor", expected: "15% infra cost reduction.", actual: "Cost rose ~8% after losing multi-cloud leverage; lock-in increased.", measured: "2026-05-01", status: "failed", confidence: 0.8, projectId: null, capabilityId: "cap-vendor", createdAt: "2026-05-01T09:00:00Z" },
];
const learningSeed: LearningRecord[] = [
  { id: "learn-dualwrite", title: "Feature-flagged dual-write bounds cutover risk", insight: "Reversible cutovers with a validated rollback consistently de-risk critical migrations.", decisionId: "dec-dualwrite", outcomeId: "out-dualwrite", capabilityId: "cap-payments", projectId: "p-atlas", createdAt: "2026-04-16T09:00:00Z" },
  { id: "learn-vendor", title: "Single-vendor consolidation removed negotiating leverage", insight: "Consolidation savings were outweighed by lost multi-cloud leverage and lock-in; model leverage loss next time.", decisionId: "dec-vendor", outcomeId: "out-vendor", capabilityId: "cap-vendor", projectId: null, createdAt: "2026-05-02T09:00:00Z" },
];
const evidenceSeed: EvidenceRecord[] = [
  { id: "ev-dw1", decisionId: "dec-dualwrite", source: "Incident history", summary: "Prior big-bang cutovers caused 2 multi-hour outages in 18 months.", strength: "strong", createdAt: "2026-03-01T09:00:00Z" },
  { id: "ev-dw2", decisionId: "dec-dualwrite", source: "Load test", summary: "Dual-write adds <12ms p99 latency at projected volume.", strength: "moderate", createdAt: "2026-03-01T10:00:00Z" },
  { id: "ev-v1", decisionId: "dec-vendor", source: "Finance model", summary: "Committed-use discounts modeled at 15% on current spend.", strength: "moderate", createdAt: "2026-02-09T09:00:00Z" },
];
const assumptionSeed: AssumptionRecord[] = [
  { id: "as-dw1", decisionId: "dec-dualwrite", statement: "Rollback can complete within 5 minutes.", status: "holds", criticality: "critical", createdAt: "2026-03-01T09:00:00Z" },
  { id: "as-v1", decisionId: "dec-vendor", statement: "We will not need multi-cloud negotiating leverage.", status: "violated", criticality: "high", createdAt: "2026-02-09T09:00:00Z" },
  { id: "as-v2", decisionId: "dec-vendor", statement: "Migration effort is one-time and bounded.", status: "unknown", criticality: "medium", createdAt: "2026-02-09T09:30:00Z" },
];
const hypothesisSeed: HypothesisRecord[] = [
  { id: "hy-dw1", decisionId: "dec-dualwrite", statement: "Cutover completes with zero customer-visible downtime.", status: "refuted", confidence: 0.8, createdAt: "2026-03-01T09:00:00Z" },
  { id: "hy-v1", decisionId: "dec-vendor", statement: "Consolidation yields ≥15% net infra savings.", status: "refuted", confidence: 0.6, createdAt: "2026-02-09T09:00:00Z" },
  { id: "hy-fe1", decisionId: "dec-frontend", statement: "Design-system adoption cuts UI rework by 30%.", status: "open", confidence: 0.55, createdAt: "2026-04-01T09:00:00Z" },
];

// Server-side state: module-scope copies so API mutations persist for the
// process lifetime (the demo analogue of a database).
let tasks: Task[] = seedTasks.map((t) => ({ ...t }));
let capacity: CapacityCell[] = seedCapacity.map((c) => ({ ...c }));
let proposals: Proposal[] = seedProposals.map((p) => ({ ...p }));
const audit: AuditEvent[] = [...auditEvents];
const approvals: Approval[] = [];
// Recommendation lifecycle store — the demo analogue of the `recommendations`
// table (migration 0010). Persists for the process lifetime so lifecycle
// transitions and prediction writeback survive across requests in demo mode.
const recommendations: RecommendationRecord[] = [];

export function createMemoryRepositories(): Repositories {
  return {
    backend: "memory",

    employees: {
      list: async () => employees,
      byId: async (id) => employees.find((e) => e.id === id) ?? null,
      create: async (e) => {
        const initials = e.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        const colors = ["#00ED82", "#F97316", "#6366F1", "#EC4899", "#0EA5E9"];
        const emp = { ...e, id: `u-${Date.now()}`, initials, accent: colors[employees.length % colors.length], expertise: [], ptoDays: [], burnoutScore: 0 };
        (employees as import("@/lib/types").Employee[]).push(emp);
        return emp;
      },
    },

    tasks: {
      list: async () => tasks,
      byId: async (id) => tasks.find((t) => t.id === id) ?? null,
      create: async (t) => {
        const task = { ...t, id: `task-${Date.now()}`, loggedHours: 0, labels: [], dependsOn: [] };
        tasks = [...tasks, task];
        return task;
      },
      reassign: async (taskId, toEmployeeId) => {
        const task = tasks.find((t) => t.id === taskId);
        const target = employees.find((e) => e.id === toEmployeeId);
        if (!task) throw new RepositoryError("NOT_FOUND", `task ${taskId}`);
        if (!target) throw new RepositoryError("NOT_FOUND", `employee ${toEmployeeId}`);

        // Atomic unit: reassignment + both capacity deltas succeed together.
        const apply = (empId: string, delta: number) => {
          capacity = capacity.map((c) =>
            c.employeeId === empId && c.weekStart === task.weekStart
              ? { ...c, allocatedHours: Math.max(0, c.allocatedHours + delta) }
              : c
          );
        };
        if (task.assigneeId) apply(task.assigneeId, -task.estimatedHours);
        apply(toEmployeeId, task.estimatedHours);
        tasks = tasks.map((t) =>
          t.id === taskId ? { ...t, assigneeId: toEmployeeId } : t
        );
      },
    },

    capacity: {
      list: async () => capacity,
      forWeek: async (weekStart) => capacity.filter((c) => c.weekStart === weekStart),
    },

    proposals: {
      list: async () => proposals,
      setStatus: async (id, status) => {
        if (!proposals.some((p) => p.id === id))
          throw new RepositoryError("NOT_FOUND", `proposal ${id}`);
        proposals = proposals.map((p) => (p.id === id ? { ...p, status } : p));
      },
    },

    projects: {
      list: async () => projects,
      byId: async (id) => projects.find((p) => p.id === id) ?? null,
      create: async (p) => {
        const code = p.name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "PRJ";
        const proj = { ...p, id: `p-${Date.now()}`, code, velocityTrend: [] };
        (projects as import("@/lib/types").Project[]).push(proj);
        return proj;
      },
    },

    risks: {
      list: async () => risks,
      create: async (r) => {
        const risk = { ...r, id: `risk-${Date.now()}` };
        (risks as import("@/lib/types").Risk[]).push(risk);
        return risk;
      },
    },

    audit: {
      list: async (limit = 100) => audit.slice(0, limit),
      append: async (event) => {
        audit.unshift(event);
      },
    },

    approvals: {
      list: async (limit = 100) => approvals.slice(0, limit),
      listPending: async (approverRole) =>
        approvals.filter((a) => a.status === "pending" && (!approverRole || a.approverRole === approverRole)),
      create: async (a) => {
        const rec = {
          id: `apr-${Date.now()}-${approvals.length}`,
          changeType: a.changeType,
          summary: a.summary,
          payload: a.payload ?? {},
          requesterId: a.requesterId,
          requesterRole: a.requesterRole,
          approverRole: a.approverRole,
          authorityTier: a.authorityTier,
          escalationPath: a.escalationPath ?? [],
          rationale: a.rationale ?? null,
          evidence: a.evidence ?? {},
          affectedEntities: a.affectedEntities ?? [],
          status: a.status ?? "pending",
          decidedBy: null,
          decidedAt: null,
          declineReason: null,
          createdAt: new Date().toISOString(),
        };
        approvals.unshift(rec);
        return rec;
      },
      decide: async (id, status, decidedBy, declineReason) => {
        const rec = approvals.find((a) => a.id === id);
        if (!rec) throw new RepositoryError("NOT_FOUND", `approval ${id}`);
        rec.status = status;
        rec.decidedBy = decidedBy;
        rec.decidedAt = new Date().toISOString();
        rec.declineReason = declineReason ?? null;
      },
    },

    recommendations: {
      list: async () => recommendations.map((r) => ({ ...r })),
      byId: async (id) => {
        const r = recommendations.find((x) => x.id === id);
        return r ? { ...r } : null;
      },
      upsertComputed: async (recs) => {
        const now = new Date().toISOString();
        for (const r of recs) {
          if (recommendations.some((x) => x.id === r.id)) continue; // never clobber lifecycle
          recommendations.push({
            id: r.id, type: r.type, title: r.title,
            rationale: r.rationale ?? null, impact: r.impact ?? null, priority: r.priority ?? null,
            evidence: r.evidence ?? [], traceKind: r.traceKind ?? null, traceId: r.traceId ?? null, traceLabel: r.traceLabel ?? null,
            status: "pending", actorId: null,
            confidence: null, baselineValue: null, expectedDelta: null,
            actualValue: null, accuracy: null,
            acceptedAt: null, decidedAt: null, measuredAt: null,
            createdAt: now, updatedAt: now,
          });
        }
      },
      transition: async (id, status, patch) => {
        const rec = recommendations.find((x) => x.id === id);
        if (!rec) throw new RepositoryError("NOT_FOUND", `recommendation ${id}`);
        rec.status = status;
        rec.updatedAt = new Date().toISOString();
        for (const k of ["actorId", "confidence", "baselineValue", "expectedDelta", "actualValue", "accuracy", "acceptedAt", "decidedAt", "measuredAt"] as const) {
          if (patch[k] !== undefined) (rec as unknown as Record<string, unknown>)[k] = patch[k];
        }
        return { ...rec };
      },
    },

    capabilities: { list: async () => capSeed },
    employeeCapabilities: { list: async () => empCapSeed },
    // Decision-memory entities: a coherent demo graph (mirrors the live DB) so
    // the Decision Intelligence + Organizational Memory surfaces work offline.
    decisions: {
      list: async () => decisionSeed.map((d) => ({ ...d })),
      byId: async (id) => decisionSeed.find((d) => d.id === id) ?? null,
    },
    outcomes: { list: async () => outcomeSeed.map((o) => ({ ...o })) },
    learnings: { list: async () => learningSeed.map((l) => ({ ...l })) },
    lineage: {
      evidence: async () => evidenceSeed.map((e) => ({ ...e })),
      assumptions: async () => assumptionSeed.map((a) => ({ ...a })),
      hypotheses: async () => hypothesisSeed.map((h) => ({ ...h })),
    },
    // Person-touching edges for degree centrality (demo set; live reads entity_relationships).
    relationships: {
      list: async () => [
        { sourceId: "u-ahmed", sourceType: "user", targetId: "u-priya", targetType: "user", relationshipType: "reports_to" },
        { sourceId: "u-asha", sourceType: "user", targetId: "u-priya", targetType: "user", relationshipType: "reports_to" },
        { sourceId: "u-ahmed", sourceType: "user", targetId: "cap-payments", targetType: "capability", relationshipType: "has_expertise_in" },
        { sourceId: "u-noor", sourceType: "user", targetId: "cap-finance", targetType: "capability", relationshipType: "has_expertise_in" },
      ],
    },
  };
}
