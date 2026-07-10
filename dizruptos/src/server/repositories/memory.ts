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
  { id: "cap-payments", name: "Backend & APIs", category: "engineering", strategicImportance: "critical" },
  { id: "cap-cloud", name: "Cloud & DevOps", category: "engineering", strategicImportance: "high" },
  { id: "cap-frontend", name: "Frontend", category: "engineering", strategicImportance: "medium" },
  { id: "cap-ai", name: "AI / ML", category: "engineering", strategicImportance: "critical" },
  { id: "cap-vendor", name: "Vendor Management", category: "operations", strategicImportance: "medium" },
];
const empCapSeed: EmployeeCapability[] = [
  // Backend — Sarah is the concentrated lead; Ahmed and Mei provide backup.
  { userId: "u-sarah", userName: "Sarah Okafor", capabilityId: "cap-payments", proficiency: 5, isPrimary: true },
  { userId: "u-ahmed", userName: "Ahmed Hassan", capabilityId: "cap-payments", proficiency: 4, isPrimary: false },
  { userId: "u-mei", userName: "Mei Lin", capabilityId: "cap-payments", proficiency: 4, isPrimary: false },
  // Cloud & DevOps
  { userId: "u-fatima", userName: "Fatima Zahra", capabilityId: "cap-cloud", proficiency: 5, isPrimary: true },
  { userId: "u-elias", userName: "Elias Brandt", capabilityId: "cap-cloud", proficiency: 3, isPrimary: false },
  // Frontend
  { userId: "u-diego", userName: "Diego Ruiz", capabilityId: "cap-frontend", proficiency: 5, isPrimary: true },
  // AI / ML — Zara is the ONLY person who can train the model (bus factor 1).
  { userId: "u-zara", userName: "Zara Iqbal", capabilityId: "cap-ai", proficiency: 5, isPrimary: true },
  // Vendor management
  { userId: "u-marcus", userName: "Marcus Bell", capabilityId: "cap-vendor", proficiency: 4, isPrimary: true },
];

// Decision-memory seed — demo mode previously had NO decision/outcome/learning
// graph (it lived only in the DB), leaving the memory + decisions surfaces empty
// offline. This small, coherent graph mirrors the kind of records the live DB
// holds so the Organizational Memory workspace + Decision Intelligence are
// demonstrable in demo mode, including the 0011 lineage ontology.
const decisionSeed: DecisionRecord[] = [
  { id: "dec-dualwrite", title: "Build the chatbot UI and AI model together", rationale: "Build both parts in parallel to hit the August launch, with weekly syncs to keep the teams aligned.", context: "AI Support Chatbot — CRITICAL project, launch at risk.", confidenceLevel: "high", status: "ACTIVE", ownerId: "u-sarah", projectId: "p-atlas", supersededBy: null, createdAt: "2026-03-02T09:00:00Z" },
  { id: "dec-vendor", title: "Use a single cloud vendor to save money", rationale: "Standardize on one provider for committed-use discounts.", context: "Cost-reduction effort.", confidenceLevel: "medium", status: "ACTIVE", ownerId: "u-noor", projectId: null, supersededBy: null, createdAt: "2026-02-10T09:00:00Z" },
  { id: "dec-frontend", title: "Use one shared design system across all apps", rationale: "Standardize the UI on reusable components to cut rework and speed delivery.", context: "Frontend speed effort.", confidenceLevel: "medium", status: "ACTIVE", ownerId: "u-lena", projectId: "p-orbit", supersededBy: null, createdAt: "2026-04-01T09:00:00Z" },
];
const outcomeSeed: OutcomeRecord[] = [
  { id: "out-dualwrite", decisionId: "dec-dualwrite", expected: "Chatbot ready for August with both parts built together.", actual: "On track, but the team is stretched thin — Sarah and Zara are both over 100%.", measured: "2026-06-10", status: "succeeded", confidence: 0.7, projectId: "p-atlas", capabilityId: "cap-payments", createdAt: "2026-06-10T09:00:00Z" },
  { id: "out-vendor", decisionId: "dec-vendor", expected: "15% lower cloud costs.", actual: "Costs rose ~8% after we lost the ability to negotiate between providers; lock-in increased.", measured: "2026-05-01", status: "failed", confidence: 0.8, projectId: null, capabilityId: "cap-vendor", createdAt: "2026-05-01T09:00:00Z" },
];
const learningSeed: LearningRecord[] = [
  { id: "learn-dualwrite", title: "Building UI and AI together hits the deadline but strains the team", insight: "Parallel builds work when you add review support early, so the leads don't tip over 100%.", decisionId: "dec-dualwrite", outcomeId: "out-dualwrite", capabilityId: "cap-payments", projectId: "p-atlas", createdAt: "2026-06-11T09:00:00Z" },
  { id: "learn-vendor", title: "One vendor removed our negotiating power", insight: "The savings were outweighed by lock-in and lost leverage; next time, price in the loss of leverage.", decisionId: "dec-vendor", outcomeId: "out-vendor", capabilityId: "cap-vendor", projectId: null, createdAt: "2026-05-02T09:00:00Z" },
];
const evidenceSeed: EvidenceRecord[] = [
  { id: "ev-dw1", decisionId: "dec-dualwrite", source: "Past projects", summary: "Building things one after another has missed launch dates before.", strength: "strong", createdAt: "2026-03-01T09:00:00Z" },
  { id: "ev-dw2", decisionId: "dec-dualwrite", source: "Team estimate", summary: "A parallel build fits the August date as long as reviews are staffed.", strength: "moderate", createdAt: "2026-03-01T10:00:00Z" },
  { id: "ev-v1", decisionId: "dec-vendor", source: "Finance model", summary: "Committed-use discounts modeled at 15% on current spend.", strength: "moderate", createdAt: "2026-02-09T09:00:00Z" },
];
const assumptionSeed: AssumptionRecord[] = [
  { id: "as-dw1", decisionId: "dec-dualwrite", statement: "The UI and AI teams can stay in sync with weekly check-ins.", status: "holds", criticality: "critical", createdAt: "2026-03-01T09:00:00Z" },
  { id: "as-v1", decisionId: "dec-vendor", statement: "We won't need to negotiate between cloud providers.", status: "violated", criticality: "high", createdAt: "2026-02-09T09:00:00Z" },
  { id: "as-v2", decisionId: "dec-vendor", statement: "Moving to one vendor is a one-time, bounded effort.", status: "unknown", criticality: "medium", createdAt: "2026-02-09T09:30:00Z" },
];
const hypothesisSeed: HypothesisRecord[] = [
  { id: "hy-dw1", decisionId: "dec-dualwrite", statement: "The chatbot launches in August with both parts ready.", status: "open", confidence: 0.6, createdAt: "2026-03-01T09:00:00Z" },
  { id: "hy-v1", decisionId: "dec-vendor", statement: "One vendor saves at least 15%.", status: "refuted", confidence: 0.6, createdAt: "2026-02-09T09:00:00Z" },
  { id: "hy-fe1", decisionId: "dec-frontend", statement: "A shared design system cuts UI rework by 30%.", status: "open", confidence: 0.55, createdAt: "2026-04-01T09:00:00Z" },
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
        { sourceId: "u-sarah", sourceType: "user", targetId: "cap-payments", targetType: "capability", relationshipType: "has_expertise_in" },
        { sourceId: "u-zara", sourceType: "user", targetId: "cap-ai", targetType: "capability", relationshipType: "has_expertise_in" },
      ],
    },
  };
}
