// Change-authority workflow (PRD §6 graduated authority).
//
// The model the operator asked for, end to end:
//   • A manager submits a change. `authorizeChange` decides its tier.
//   • If `direct` → applied immediately; the higher order is NOTIFIED.
//   • If `requires_approval` → STAGED for a senior role to accept/decline;
//     the approver + higher order are notified. On accept it applies; on
//     decline it is recorded with a reason. Every step is auditable.
//   • If `denied` → rejected outright (e.g. setting computed health).
//
// Admin (highest role) has unrestricted authority and can act on anything in
// the queue. Pure + injectable: the side-effects (apply / notify / audit /
// persist) are passed in, so this works against memory today and Supabase next
// without changing the decision logic.

import {
  authorizeChange,
  canApprove,
  type ChangeRequest,
  type ChangeVerdict,
  type ChangeType,
} from "@/lib/rbac";
import type { Role } from "@/lib/types";

export interface Principal {
  id: string;
  role: Role;
}

export interface StagedChange {
  id: string;
  type: ChangeType;
  summary: string;
  payload: unknown;
  requestedBy: Principal;
  approverRole: Role;
  notifyRoles: Role[];
  status: "pending" | "approved" | "declined";
  createdAt: string;
  decidedBy?: Principal;
  decidedAt?: string;
  declineReason?: string;
}

/** Side-effects the workflow needs — injected so the core stays pure/testable. */
export interface ChangeEffects {
  apply: (type: ChangeType, payload: unknown) => void; // the actual mutation
  notify: (roles: Role[], message: string) => void; // oversight fan-out
  audit: (event: string, detail: Record<string, unknown>) => void;
  stage: (c: StagedChange) => void; // persist a pending request
  resolveStaged: (id: string, patch: Partial<StagedChange>) => void;
}

export interface SubmitInput {
  type: ChangeType;
  summary: string;
  payload: unknown;
  magnitude?: number;
  actor: Principal;
}

export interface SubmitResult {
  outcome: "applied" | "staged" | "denied";
  verdict: ChangeVerdict;
  staged?: StagedChange;
}

let counter = 0;
const newId = () => `chg-${Date.now()}-${++counter}`;

/** Submit a change; apply directly, stage for approval, or deny. */
export function submitChange(input: SubmitInput, fx: ChangeEffects): SubmitResult {
  const req: ChangeRequest = {
    type: input.type,
    actorRole: input.actor.role,
    magnitude: input.magnitude,
  };
  const verdict = authorizeChange(req);

  if (verdict.authority === "denied") {
    fx.audit("change_denied", { type: input.type, actor: input.actor.id, reason: verdict.reason });
    return { outcome: "denied", verdict };
  }

  if (verdict.authority === "direct") {
    fx.apply(input.type, input.payload);
    fx.audit("change_applied_direct", { type: input.type, actor: input.actor.id, summary: input.summary });
    if (verdict.notifyRoles.length)
      fx.notify(verdict.notifyRoles, `${input.actor.role} applied: ${input.summary}`);
    return { outcome: "applied", verdict };
  }

  // requires_approval → stage it
  const staged: StagedChange = {
    id: newId(),
    type: input.type,
    summary: input.summary,
    payload: input.payload,
    requestedBy: input.actor,
    approverRole: verdict.approverRole ?? "admin",
    notifyRoles: verdict.notifyRoles,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  fx.stage(staged);
  fx.audit("change_staged", { id: staged.id, type: input.type, actor: input.actor.id, approver: staged.approverRole });
  fx.notify([staged.approverRole, ...verdict.notifyRoles], `${input.actor.role} requests approval: ${input.summary}`);
  return { outcome: "staged", verdict, staged };
}

export type DecisionResult =
  | { ok: true; applied: boolean; status: "approved" | "declined" }
  | { ok: false; error: "ALREADY_DECIDED" | "INSUFFICIENT_AUTHORITY" };

/** A senior role accepts or declines a staged change. */
export function decideChange(
  staged: StagedChange,
  approver: Principal,
  accept: boolean,
  fx: ChangeEffects,
  declineReason?: string
): DecisionResult {
  if (staged.status !== "pending") return { ok: false, error: "ALREADY_DECIDED" };
  if (!canApprove(approver.role, staged.approverRole))
    return { ok: false, error: "INSUFFICIENT_AUTHORITY" };

  const now = new Date().toISOString();
  if (accept) {
    fx.apply(staged.type, staged.payload);
    fx.resolveStaged(staged.id, { status: "approved", decidedBy: approver, decidedAt: now });
    fx.audit("change_approved", { id: staged.id, approver: approver.id, type: staged.type });
    fx.notify([staged.requestedBy.role, ...staged.notifyRoles], `${approver.role} approved: ${staged.summary}`);
    return { ok: true, applied: true, status: "approved" };
  }
  fx.resolveStaged(staged.id, { status: "declined", decidedBy: approver, decidedAt: now, declineReason });
  fx.audit("change_declined", { id: staged.id, approver: approver.id, reason: declineReason });
  fx.notify([staged.requestedBy.role], `${approver.role} declined: ${staged.summary}${declineReason ? ` — ${declineReason}` : ""}`);
  return { ok: true, applied: false, status: "declined" };
}
