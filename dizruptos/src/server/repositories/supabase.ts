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
  return (await res.json()) as T;
}

export function createSupabaseRepositories(cfg: SupabaseConfig): Repositories {
  return {
    backend: "supabase",

    employees: {
      list: () => rest<Employee[]>(cfg, "employees?select=*"),
      byId: async (id) =>
        (await rest<Employee[]>(cfg, `employees?id=eq.${id}&select=*`))[0] ?? null,
    },

    tasks: {
      list: () => rest<Task[]>(cfg, "tasks?select=*"),
      byId: async (id) =>
        (await rest<Task[]>(cfg, `tasks?id=eq.${id}&select=*`))[0] ?? null,
      // Transactional reassign via Postgres function — task update and both
      // capacity deltas commit or roll back together.
      reassign: async (taskId, toEmployeeId) => {
        await rest(cfg, "rpc/reassign_task", {
          method: "POST",
          body: JSON.stringify({ p_task_id: taskId, p_to_employee_id: toEmployeeId }),
        });
      },
    },

    capacity: {
      list: () => rest<CapacityCell[]>(cfg, "capacity_cells?select=*"),
      forWeek: (weekStart) =>
        rest<CapacityCell[]>(cfg, `capacity_cells?week_start=eq.${weekStart}&select=*`),
    },

    proposals: {
      list: () => rest<Proposal[]>(cfg, "proposals?select=*"),
      setStatus: async (id, status) => {
        await rest(cfg, `proposals?id=eq.${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
      },
    },

    projects: {
      list: () => rest<Project[]>(cfg, "projects?select=*"),
      byId: async (id) =>
        (await rest<Project[]>(cfg, `projects?id=eq.${id}&select=*`))[0] ?? null,
    },

    risks: {
      list: () => rest<Risk[]>(cfg, "risks?select=*"),
    },

    audit: {
      list: (limit = 100) =>
        rest<AuditEvent[]>(cfg, `audit_events?select=*&order=at.desc&limit=${limit}`),
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
