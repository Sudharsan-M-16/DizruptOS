// Supabase repository — production persistence over PostgREST. Implemented as
// a thin typed fetch client (no SDK dependency: smaller surface, no bundle
// weight, and the REST contract is stable). Activated by the env factory when
// NEXT_PUBLIC_SUPABASE_URL + key are configured; RLS policies in supabase/
// enforce the same role scoping the app computes client-side.
//
// Table mapping (see supabase/ schema): employees, tasks, capacity_cells,
// proposals, risks, audit_events. The reassign RPC wraps task update + both
// capacity deltas in one Postgres function (true transactional atomicity).

import type {
  AuditEvent,
  CapacityCell,
  Employee,
  Project,
  Proposal,
  Risk,
  Task,
} from "@/lib/types";
import {
  RepositoryError,
  type Approval,
  type Capability,
  type EmployeeCapability,
  type RecommendationRecord,
  type Repositories,
} from "./types";

interface SupabaseConfig {
  url: string;
  /** Server routes use the service-role key; never ships to the client. */
  key: string;
}

async function rest<T>(
  cfg: SupabaseConfig,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new RepositoryError(
      res.status === 404 ? "NOT_FOUND" : "STORAGE_UNAVAILABLE",
      `PostgREST ${res.status} on ${path}: ${body.slice(0, 200)}`
    );
  }
  // 204 No Content / Prefer: return=minimal yield an empty body — tolerate it
  // rather than blowing up in JSON.parse (callers that ignore the result rely
  // on this).
  const text = await res.text();
  return (text ? JSON.parse(text) : (undefined as T));
}

export function createSupabaseRepositories(cfg: SupabaseConfig): Repositories {
  return {
    backend: "supabase",

    // Schema-authoritative (Option A): the table is `users`, not `employees`.
    // Map snake→camel; fields the schema doesn't carry (title/location/expertise/
    // pto/burnout — demo-only) default cleanly until modeled as columns.
    employees: {
      list: async () =>
        (await rest<UserRow[]>(cfg, "users?deleted_at=is.null&select=*")).map(fromUserRow),
      byId: async (id) =>
        (await rest<UserRow[]>(cfg, `users?id=eq.${id}&select=*`)).map(fromUserRow)[0] ?? null,
    },

    tasks: {
      list: async () => (await rest<TaskRow[]>(cfg, "tasks?deleted_at=is.null&select=*")).map(fromTaskRow),
      byId: async (id) =>
        (await rest<TaskRow[]>(cfg, `tasks?id=eq.${id}&select=*`)).map(fromTaskRow)[0] ?? null,
      // Transactional reassign via Postgres function — task update and both
      // capacity deltas commit or roll back together.
      reassign: async (taskId, toEmployeeId) => {
        await rest(cfg, "rpc/reassign_task", {
          method: "POST",
          body: JSON.stringify({ p_task_id: taskId, p_to_employee_id: toEmployeeId }),
        });
      },
    },

    // Table is `capacity_logs` (not capacity_cells); map snake→camel.
    capacity: {
      list: async () => (await rest<CapacityRow[]>(cfg, "capacity_logs?select=*")).map(fromCapacityRow),
      forWeek: async (weekStart) =>
        (await rest<CapacityRow[]>(cfg, `capacity_logs?week_start=eq.${weekStart}&select=*`)).map(fromCapacityRow),
    },

    proposals: {
      list: async () => (await rest<ProposalRow[]>(cfg, "proposals?select=*")).map(fromProposalRow),
      setStatus: async (id, status) => {
        await rest(cfg, `proposals?id=eq.${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
      },
    },

    projects: {
      list: async () => (await rest<ProjectRow[]>(cfg, "projects?deleted_at=is.null&select=*")).map(fromProjectRow),
      byId: async (id) =>
        (await rest<ProjectRow[]>(cfg, `projects?id=eq.${id}&select=*`)).map(fromProjectRow)[0] ?? null,
    },

    risks: {
      list: async () => (await rest<RiskRow[]>(cfg, "risks?deleted_at=is.null&select=*")).map(fromRiskRow),
    },

    audit: {
      list: async (limit = 100) =>
        (await rest<AuditRow[]>(cfg, `audit_events?select=*&order=created_at.desc&limit=${limit}`)).map(fromAuditRow),
      append: async (event) => {
        // INSERT-only: the table's RLS revokes UPDATE/DELETE even from the
        // service role's API surface (see supabase/ policies).
        await rest(cfg, "audit_events", {
          method: "POST",
          body: JSON.stringify(event),
        });
      },
    },

    approvals: {
      list: async (limit = 100) =>
        (await rest<ApprovalRow[]>(cfg, `approvals?select=*&order=created_at.desc&limit=${limit}`)).map(fromApprovalRow),
      listPending: async (approverRole) => {
        const q = approverRole ? `&approver_role=eq.${approverRole}` : "";
        return (await rest<ApprovalRow[]>(cfg, `approvals?status=eq.pending${q}&select=*&order=created_at.desc`)).map(fromApprovalRow);
      },
      create: async (a) => {
        const rows = await rest<ApprovalRow[]>(cfg, "approvals", {
          method: "POST",
          body: JSON.stringify({
            change_type: a.changeType,
            summary: a.summary,
            payload: a.payload ?? {},
            requester_id: a.requesterId,
            requester_role: a.requesterRole,
            approver_role: a.approverRole,
            authority_tier: a.authorityTier,
            escalation_path: a.escalationPath ?? [],
            rationale: a.rationale ?? null,
            evidence: a.evidence ?? {},
            affected_entities: a.affectedEntities ?? [],
            status: a.status ?? "pending",
          }),
        });
        return fromApprovalRow(rows[0]);
      },
      decide: async (id, status, decidedBy, declineReason) => {
        await rest(cfg, `approvals?id=eq.${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            status,
            decided_by: decidedBy,
            decided_at: new Date().toISOString(),
            decline_reason: declineReason ?? null,
          }),
        });
      },
    },

    capabilities: {
      list: async () => {
        const rows = await rest<{ id: string; name: string; category: string | null; strategic_importance: Capability["strategicImportance"] }[]>(
          cfg, "capabilities?select=id,name,category,strategic_importance"
        );
        return rows.map((r) => ({ id: r.id, name: r.name, category: r.category, strategicImportance: r.strategic_importance }));
      },
    },

    decisions: {
      list: async () => (await rest<DecisionRow[]>(cfg, "decisions?deleted_at=is.null&select=*&order=created_at.desc")).map(fromDecisionRow),
      byId: async (id) => (await rest<DecisionRow[]>(cfg, `decisions?id=eq.${id}&select=*`)).map(fromDecisionRow)[0] ?? null,
    },
    outcomes: {
      list: async () => (await rest<OutcomeRowDb[]>(cfg, "outcomes?select=*")).map(fromOutcomeRow),
    },
    learnings: {
      list: async () => (await rest<LearningRowDb[]>(cfg, "learnings?select=*")).map(fromLearningRow),
    },

    lineage: {
      evidence: async () =>
        (await rest<EvidenceRow[]>(cfg, "decision_evidence?select=*&order=created_at")).map((r) => ({
          id: r.id, decisionId: r.decision_id, source: r.source, summary: r.summary, strength: r.strength, createdAt: r.created_at,
        })),
      assumptions: async () =>
        (await rest<AssumptionRow[]>(cfg, "decision_assumptions?select=*&order=created_at")).map((r) => ({
          id: r.id, decisionId: r.decision_id, statement: r.statement, status: r.status, criticality: r.criticality, createdAt: r.created_at,
        })),
      hypotheses: async () =>
        (await rest<HypothesisRow[]>(cfg, "decision_hypotheses?select=*&order=created_at")).map((r) => ({
          id: r.id, decisionId: r.decision_id, statement: r.statement, status: r.status, confidence: r.confidence, createdAt: r.created_at,
        })),
    },

    recommendations: {
      list: async () =>
        (await rest<RecommendationRow[]>(cfg, "recommendations?select=*&order=priority.desc.nullslast")).map(fromRecommendationRow),
      byId: async (id) =>
        (await rest<RecommendationRow[]>(cfg, `recommendations?id=eq.${id}&select=*`)).map(fromRecommendationRow)[0] ?? null,
      upsertComputed: async (recs) => {
        if (recs.length === 0) return;
        // Idempotent seed: insert new engine keys, leave existing lifecycle rows
        // untouched (ignore-duplicates on the `id` primary key).
        await rest(cfg, "recommendations?on_conflict=id", {
          method: "POST",
          headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
          body: JSON.stringify(
            recs.map((r) => ({
              id: r.id, type: r.type, title: r.title,
              rationale: r.rationale ?? null, impact: r.impact ?? null, priority: r.priority ?? null,
              evidence: r.evidence ?? [], trace_kind: r.traceKind ?? null, trace_id: r.traceId ?? null, trace_label: r.traceLabel ?? null,
              status: "pending",
            }))
          ),
        });
      },
      transition: async (id, status, patch) => {
        const body: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
        const map: Record<string, string> = {
          actorId: "actor_id", confidence: "confidence", baselineValue: "baseline_value", expectedDelta: "expected_delta",
          actualValue: "actual_value", accuracy: "accuracy", acceptedAt: "accepted_at", decidedAt: "decided_at", measuredAt: "measured_at",
        };
        for (const [k, col] of Object.entries(map)) {
          const v = (patch as Record<string, unknown>)[k];
          if (v !== undefined) body[col] = v;
        }
        const rows = await rest<RecommendationRow[]>(cfg, `recommendations?id=eq.${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        if (!rows[0]) throw new RepositoryError("NOT_FOUND", `recommendation ${id}`);
        return fromRecommendationRow(rows[0]);
      },
    },

    relationships: {
      list: async () => {
        const rows = await rest<{ source_id: string; source_type: string; target_id: string; target_type: string; relationship_type: string }[]>(
          cfg, "entity_relationships?select=source_id,source_type,target_id,target_type,relationship_type&valid_until=is.null"
        );
        return rows.map((r) => ({
          sourceId: r.source_id, sourceType: r.source_type,
          targetId: r.target_id, targetType: r.target_type,
          relationshipType: r.relationship_type,
        }));
      },
    },

    employeeCapabilities: {
      list: async () => {
        // PostgREST embedding pulls the holder's name in one round-trip.
        const rows = await rest<{ user_id: string; capability_id: string; proficiency: number; is_primary: boolean; users: { full_name: string } | null }[]>(
          cfg, "employee_capabilities?select=user_id,capability_id,proficiency,is_primary,users(full_name)"
        );
        return rows.map<EmployeeCapability>((r) => ({
          userId: r.user_id,
          userName: r.users?.full_name ?? null,
          capabilityId: r.capability_id,
          proficiency: r.proficiency,
          isPrimary: r.is_primary,
        }));
      },
    },
  };
}

/* ---------------- core entities: snake row → camelCase model --------------- */
// Schema-authoritative mappers (Option A). Fields the schema doesn't carry
// (project code/velocityTrend/start/target dates, task dependsOn) are demo-only
// and default cleanly; they are NOT a second source of truth.
interface TaskRow {
  id: string; title: string; project_id: string | null; assignee_id: string | null;
  status: Task["status"]; priority: Task["priority"]; estimated_hours: number;
  logged_hours: number; due_date: string | null; week_start: string | null; labels: string[] | null;
}
function fromTaskRow(r: TaskRow): Task {
  return {
    id: r.id, title: r.title, projectId: r.project_id ?? "", assigneeId: r.assignee_id ?? undefined,
    status: r.status, priority: r.priority, estimatedHours: r.estimated_hours, loggedHours: r.logged_hours,
    dueDate: r.due_date ?? "", weekStart: r.week_start ?? "", labels: r.labels ?? [], dependsOn: [],
  };
}

interface ProjectRow {
  id: string; name: string; description: string | null; department_id: string | null; owner_id: string | null;
  status: Project["status"]; health_status: Project["health"]; health_reasons: string[] | null;
  budget_hours: number; consumed_hours: number; budget_amount: number; consumed_amount: number;
  customer_id: string | null; goal_id: string | null;
}
function fromProjectRow(r: ProjectRow): Project {
  return {
    id: r.id, name: r.name, code: r.name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "PRJ",
    description: r.description ?? "", departmentId: r.department_id ?? "", ownerId: r.owner_id ?? "",
    status: r.status, health: r.health_status, healthReasons: r.health_reasons ?? [],
    budgetHours: r.budget_hours, consumedHours: r.consumed_hours, budgetMicro: r.budget_amount, consumedMicro: r.consumed_amount,
    startDate: "", targetDate: "", customer: r.customer_id ?? undefined, goalId: r.goal_id ?? undefined, velocityTrend: [],
  };
}

interface RiskRow {
  id: string; title: string; category: Risk["category"]; probability: Risk["probability"]; impact: Risk["impact"];
  owner_id: string | null; project_id: string | null; mitigation_plan: string | null;
  mitigation_status: Risk["mitigationStatus"]; status: Risk["status"]; signals: string[] | null; created_at: string;
}
function fromRiskRow(r: RiskRow): Risk {
  return {
    id: r.id, title: r.title, category: r.category, probability: r.probability, impact: r.impact,
    ownerId: r.owner_id ?? "", projectId: r.project_id ?? undefined, mitigationPlan: r.mitigation_plan ?? "",
    mitigationStatus: r.mitigation_status, status: r.status, createdAt: r.created_at, signals: r.signals ?? [],
  };
}

interface AuditRow {
  id: string; actor_id: string | null; actor_role: string | null; action_type: string;
  entity_type: string | null; entity_label: string | null; override_reason: string | null; created_at: string;
}
function fromAuditRow(r: AuditRow): AuditEvent {
  return {
    id: r.id, actorId: r.actor_id ?? "", actorRole: (r.actor_role ?? "employee") as AuditEvent["actorRole"],
    actionType: r.action_type, entityType: r.entity_type ?? "", entityLabel: r.entity_label ?? "",
    detail: r.action_type.replace(/_/g, " "), overrideReason: r.override_reason ?? undefined, at: r.created_at,
  };
}

interface ProposalRow {
  id: string; agent_type: Proposal["agentType"]; title: string; summary: string | null;
  reasoning: string[] | null; confidence: number | null; priority: number; status: Proposal["status"];
}
function fromProposalRow(r: ProposalRow): Proposal {
  return {
    id: r.id, agentType: r.agent_type, title: r.title, summary: r.summary ?? "",
    visibility: ["admin", "executive", "dept_head", "project_manager"], // table has no per-role column; refined when memberships land
    subjectId: undefined, reasoning: r.reasoning ?? [], action: { kind: "reallocate" },
    confidence: r.confidence ?? 0.5, priority: r.priority, status: r.status,
  } as Proposal;
}

/* ----------------------- decisions / outcomes / learnings ----------------- */
interface DecisionRow {
  id: string; title: string; rationale: string | null; context: string | null;
  confidence_level: "low" | "medium" | "high" | null; status: string;
  owner_id: string | null; project_id: string | null; superseded_by: string | null; created_at: string;
}
function fromDecisionRow(r: DecisionRow): import("./types").DecisionRecord {
  return { id: r.id, title: r.title, rationale: r.rationale, context: r.context, confidenceLevel: r.confidence_level, status: r.status, ownerId: r.owner_id, projectId: r.project_id, supersededBy: r.superseded_by, createdAt: r.created_at };
}
interface OutcomeRowDb {
  id: string; decision_id: string; expected: string | null; actual: string | null; measured: string | null;
  status: import("./types").OutcomeRecord["status"]; confidence: number | null; project_id: string | null; capability_id: string | null; created_at: string;
}
function fromOutcomeRow(r: OutcomeRowDb): import("./types").OutcomeRecord {
  return { id: r.id, decisionId: r.decision_id, expected: r.expected, actual: r.actual, measured: r.measured, status: r.status, confidence: r.confidence, projectId: r.project_id, capabilityId: r.capability_id, createdAt: r.created_at };
}
interface LearningRowDb {
  id: string; title: string; insight: string; decision_id: string | null; outcome_id: string | null; capability_id: string | null; project_id: string | null; created_at: string;
}
function fromLearningRow(r: LearningRowDb): import("./types").LearningRecord {
  return { id: r.id, title: r.title, insight: r.insight, decisionId: r.decision_id, outcomeId: r.outcome_id, capabilityId: r.capability_id, projectId: r.project_id, createdAt: r.created_at };
}

interface EvidenceRow { id: string; decision_id: string; source: string | null; summary: string; strength: "weak" | "moderate" | "strong"; created_at: string; }
interface AssumptionRow { id: string; decision_id: string; statement: string; status: "holds" | "violated" | "unknown"; criticality: "low" | "medium" | "high" | "critical"; created_at: string; }
interface HypothesisRow { id: string; decision_id: string; statement: string; status: "open" | "confirmed" | "refuted"; confidence: number | null; created_at: string; }

interface RecommendationRow {
  id: string; type: string; title: string; rationale: string | null; impact: string | null; priority: number | null;
  evidence: string[] | null; trace_kind: string | null; trace_id: string | null; trace_label: string | null;
  status: RecommendationRecord["status"]; actor_id: string | null;
  confidence: number | null; baseline_value: number | null; expected_delta: number | null;
  actual_value: number | null; accuracy: number | null;
  accepted_at: string | null; decided_at: string | null; measured_at: string | null;
  created_at: string; updated_at: string;
}
function fromRecommendationRow(r: RecommendationRow): RecommendationRecord {
  return {
    id: r.id, type: r.type, title: r.title, rationale: r.rationale, impact: r.impact, priority: r.priority,
    evidence: r.evidence ?? [], traceKind: r.trace_kind, traceId: r.trace_id, traceLabel: r.trace_label,
    status: r.status, actorId: r.actor_id,
    confidence: r.confidence, baselineValue: r.baseline_value, expectedDelta: r.expected_delta,
    actualValue: r.actual_value, accuracy: r.accuracy,
    acceptedAt: r.accepted_at, decidedAt: r.decided_at, measuredAt: r.measured_at,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

/* ----------------------------- users → Employee --------------------------- */
interface UserRow {
  id: string;
  full_name: string;
  role: Employee["role"];
  department_id: string | null;
  manager_id: string | null;
  capacity_hours_per_week: number;
  skill_tags: string[] | null;
  timezone: string | null;
  created_at: string;
  // 0008 — now first-class columns (schema-authoritative, no parallel model)
  title: string | null;
  location: string | null;
  pto_days: string[] | null;
  burnout_flag: boolean | null;
  burnout_signals: string[] | null;
  flight_risk: number | null;
  accent: string | null;
}
const ACCENTS = ["#00ED82", "#2BD9FF", "#F59E0B", "#A78BFA", "#38BDF8", "#FB7185"];
function initialsOf(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function fromUserRow(r: UserRow): Employee {
  return {
    id: r.id,
    name: r.full_name,
    initials: initialsOf(r.full_name),
    role: r.role,
    title: r.title ?? "",
    departmentId: r.department_id ?? "",
    managerId: r.manager_id ?? undefined,
    capacityHoursPerWeek: r.capacity_hours_per_week,
    skills: r.skill_tags ?? [],
    expertise: [], // intentionally derived from employee_capabilities, never stored
    timezone: r.timezone ?? "UTC",
    location: r.location ?? "",
    joinedAt: r.created_at,
    ptoDays: r.pto_days ?? [],
    burnoutFlag: r.burnout_flag ?? undefined,
    burnoutSignals: r.burnout_signals ?? undefined,
    flightRisk: r.flight_risk ?? undefined,
    accent: r.accent ?? ACCENTS[Math.abs(hashStr(r.id)) % ACCENTS.length],
  };
}
function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/* -------------------------- capacity_logs → CapacityCell ------------------- */
interface CapacityRow {
  user_id: string;
  week_start: string;
  allocated_hours: number;
  logged_hours: number;
}
function fromCapacityRow(r: CapacityRow): CapacityCell {
  return {
    employeeId: r.user_id,
    weekStart: r.week_start,
    allocatedHours: r.allocated_hours,
    loggedHours: r.logged_hours ?? 0,
  };
}

/** snake_case row exactly as the `approvals` table returns it. */
interface ApprovalRow {
  id: string;
  change_type: string;
  summary: string;
  payload: unknown;
  requester_id: string | null;
  requester_role: string;
  approver_role: string;
  authority_tier: Approval["authorityTier"];
  escalation_path: string[];
  rationale: string | null;
  evidence: unknown;
  affected_entities: unknown;
  status: Approval["status"];
  decided_by: string | null;
  decided_at: string | null;
  decline_reason: string | null;
  created_at: string;
}

// 1:1 column → camelCase view (schema-authoritative; no synthesized fields).
function fromApprovalRow(r: ApprovalRow): Approval {
  return {
    id: r.id,
    changeType: r.change_type,
    summary: r.summary,
    payload: r.payload,
    requesterId: r.requester_id,
    requesterRole: r.requester_role,
    approverRole: r.approver_role,
    authorityTier: r.authority_tier,
    escalationPath: r.escalation_path ?? [],
    rationale: r.rationale,
    evidence: r.evidence,
    affectedEntities: r.affected_entities,
    status: r.status,
    decidedBy: r.decided_by,
    decidedAt: r.decided_at,
    declineReason: r.decline_reason,
    createdAt: r.created_at,
  };
}
