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
