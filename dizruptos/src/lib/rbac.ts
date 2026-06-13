// Dynamic-view scoping (PRD §6) — the same URL shows a different system
// depending on who is looking. This module is the single source of truth for
// "what slice of the data does this persona get":
//
//   admin            → everything, full control (governance queue included)
//   executive        → portfolio-level items tagged for executives
//   dept_head        → department scope (superset of manager scope here)
//   project_manager  → team scope: proposals about their people
//   employee         → personal scope: only items where they are the subject
//
// Production mapping: these predicates become Postgres RLS policies on the
// same columns (visibility roles array, subject_id) — call sites don't change.

import type { Proposal, Risk, Role } from "./types";

/** The proposal slice a persona's inbox shows. */
export function proposalsForRole(
  proposals: Proposal[],
  role: Role,
  personaEmployeeId: string
): Proposal[] {
  if (role === "admin") return proposals; // full visibility, full control
  if (role === "employee" || role === "client")
    return proposals.filter((p) => p.subjectId === personaEmployeeId);
  return proposals.filter((p) => p.visibility.includes(role));
}

/** Can this persona act (approve/reject) on this specific proposal? */
export function canActOnProposal(
  p: Proposal,
  role: Role,
  personaEmployeeId: string
): boolean {
  if (role === "admin") return true;
  if (role === "employee" || role === "client")
    return p.subjectId === personaEmployeeId;
  return p.visibility.includes(role);
}

/** Risk slice: employees see risks that touch them — owned by them or on a
 *  project they execute; managers and above see the full register. */
export function risksForRole(
  risks: Risk[],
  role: Role,
  personaEmployeeId: string,
  isOnProject: (employeeId: string, projectId?: string) => boolean
): Risk[] {
  if (role === "employee" || role === "client") {
    return risks.filter(
      (r) =>
        r.ownerId === personaEmployeeId ||
        isOnProject(personaEmployeeId, r.projectId)
    );
  }
  return risks;
}

// ============================================================================
// CHANGE AUTHORITY (graduated approval, PRD §6/§28) — the model the operator
// asked for: a manager applies small changes directly, but a change above a
// threshold is staged for a higher-order approver. Either way, the roles above
// the actor are NOTIFIED, so authority is delegated without losing oversight.
//
// One pure function decides; the API guardrail (reassign), the proposal layer,
// and the notification fan-out all read the same verdict, so behavior is
// identical at every call site (and mirrors as Postgres policy later).
// ============================================================================

/** Strict seniority rank — admin (highest) sees and does everything. */
const ROLE_RANK: Record<Role, number> = {
  client: 0,
  employee: 1,
  team_lead: 2,
  project_manager: 3,
  dept_head: 4,
  executive: 5,
  admin: 6,
};

/** Roles strictly senior to `role` — the "higher order" that gets notified. */
export function rolesAbove(role: Role): Role[] {
  return (Object.keys(ROLE_RANK) as Role[])
    .filter((r) => ROLE_RANK[r] > ROLE_RANK[role])
    .sort((a, b) => ROLE_RANK[a] - ROLE_RANK[b]);
}

/** The next approver up the chain (immediate senior). */
export function nextApprover(role: Role): Role | undefined {
  return rolesAbove(role)[0];
}

/** The highest role sees the whole organization — nothing is scoped away. */
export function canSeeEverything(role: Role): boolean {
  return role === "admin";
}

/** Numeric seniority (exported for approval checks). Admin is highest. */
export function rankOf(role: Role): number {
  return ROLE_RANK[role];
}

/** Can `approverRole` sign off a change that requires `requiredRole`?
 *  Seniority is sufficient — a more senior role can always approve, and admin
 *  approves anything. */
export function canApprove(approverRole: Role, requiredRole: Role): boolean {
  return ROLE_RANK[approverRole] >= ROLE_RANK[requiredRole];
}

export type ChangeType =
  | "task_reassign"
  | "task_estimate"
  | "capacity_override"
  | "project_budget"
  | "project_health" // computed-only; humans never set it
  | "risk_status"
  | "decision_record"
  | "role_grant"
  | "headcount_change";

export interface ChangeRequest {
  type: ChangeType;
  actorRole: Role;
  /** Normalized 0..1 impact: projected utilization, |budget delta|, etc. */
  magnitude?: number;
}

export type Authority = "direct" | "requires_approval" | "denied";

export interface ChangeVerdict {
  authority: Authority;
  /** Who must sign off when authority === "requires_approval". */
  approverRole?: Role;
  /** Higher-order roles to notify regardless of authority (oversight). */
  notifyRoles: Role[];
  reason: string;
}

/**
 * Decide whether a change is applied directly, needs higher-order approval, or
 * is denied — and who to notify. Admin is unrestricted. Thresholds encode the
 * "small change = direct, big change = approval" rule the operator described.
 */
export function authorizeChange(req: ChangeRequest): ChangeVerdict {
  const { type, actorRole, magnitude = 0 } = req;
  const notify = rolesAbove(actorRole); // oversight is never lost

  if (actorRole === "admin")
    return { authority: "direct", notifyRoles: [], reason: "Admin has unrestricted authority over the organization." };

  const direct = (reason: string): ChangeVerdict => ({ authority: "direct", notifyRoles: notify, reason });
  const approve = (reason: string, approver: Role | undefined = nextApprover(actorRole)): ChangeVerdict => ({
    authority: "requires_approval",
    approverRole: approver,
    notifyRoles: notify,
    reason,
  });
  const deny = (reason: string): ChangeVerdict => ({ authority: "denied", notifyRoles: [], reason });

  const isManagerPlus = ROLE_RANK[actorRole] >= ROLE_RANK.project_manager;
  const isDeptPlus = ROLE_RANK[actorRole] >= ROLE_RANK.dept_head;

  switch (type) {
    case "project_health":
      return deny("Health is computed from signals — it is never set by hand.");

    case "task_reassign":
    case "task_estimate":
      if (!isManagerPlus) return approve("Employees route task changes to their manager.");
      // Capacity-aware threshold: pushing someone to/over 100% needs sign-off.
      return magnitude >= 1.0
        ? approve(`Projected utilization ${Math.round(magnitude * 100)}% ≥ 100% — needs higher-order sign-off.`)
        : direct("Within capacity — applied directly; higher-order notified.");

    case "capacity_override":
      // An explicit override is always a higher-order event.
      return approve("Capacity override (≥100%) always requires higher-order approval.");

    case "project_budget":
      if (!isDeptPlus) return approve("Budget changes route to the department head.");
      return magnitude >= 0.1
        ? approve(`Budget delta ${Math.round(magnitude * 100)}% ≥ 10% — needs executive approval.`, "executive")
        : direct("Minor budget adjustment (<10%) — applied directly; higher-order notified.");

    case "risk_status":
    case "decision_record":
      return isManagerPlus
        ? direct("Managers record risk/decision updates directly; higher-order notified.")
        : approve("Routed to your manager for confirmation.");

    case "role_grant":
    case "headcount_change":
      return approve("Identity and headcount changes require the highest authority.", "admin");

    default:
      return isDeptPlus
        ? direct("Applied directly; higher-order notified.")
        : approve("Routed for approval.");
  }
}

/** Inbox framing per role — the page reads differently for each viewer. */
export function inboxFraming(role: Role): {
  title: string;
  hint: string;
  approveLabel: string;
  rejectLabel: string;
} {
  if (role === "admin")
    return {
      title: "Governance queue — full control",
      hint: "Every proposal in the org, including security and RBAC grants. Your verdicts execute immediately.",
      approveLabel: "Approve",
      rejectLabel: "Deny",
    };
  if (role === "employee" || role === "client")
    return {
      title: "Your requests",
      hint: "Actions that concern you personally. Accepting confirms; flagging routes it back to your manager with your reason.",
      approveLabel: "Accept",
      rejectLabel: "Flag back",
    };
  return {
    title: "Agent Negotiation Inbox",
    hint: "Agents propose, you decide — every verdict lands in the audit log and agent memory.",
    approveLabel: "Approve",
    rejectLabel: "Reject",
  };
}
