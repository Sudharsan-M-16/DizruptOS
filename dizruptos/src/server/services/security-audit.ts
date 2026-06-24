// Structured security event log — emits to the JSON structured logger and
// fire-and-forgets a record into the audit repository for compliance trail.
// Never throws — security logging must not block the main request flow.

import { log } from "@/server/lib/logger";
import { getRepositories } from "@/server/repositories";

export type SecurityEventType =
  | "auth_success"
  | "auth_failure"
  | "auth_logout"
  | "rate_limit_hit"
  | "csrf_violation"
  | "permission_denied"
  | "org_suspended"
  | "invitation_sent"
  | "invitation_accepted"
  | "invitation_revoked"
  | "scim_provisioned"
  | "scim_deprovisioned"
  | "api_key_rotated"
  | "sso_initiated"
  | "sso_callback"
  | "import_complete"
  | "import_failed"
  | "data_export"
  | "admin_action";

export async function securityEvent(
  type: SecurityEventType,
  detail: {
    actorId?: string;
    actorRole?: string;
    ip?: string;
    resource?: string;
    outcome: "success" | "failure" | "blocked";
    meta?: Record<string, unknown>;
  }
): Promise<void> {
  const entry = {
    type,
    outcome: detail.outcome,
    actorId: detail.actorId ?? "anonymous",
    actorRole: detail.actorRole ?? "unknown",
    ip: detail.ip ? detail.ip.split(",")[0].trim() : "unknown",
    resource: detail.resource ?? "",
    meta: detail.meta ?? {},
    at: new Date().toISOString(),
  };

  log("info", "security_event", entry);

  // Best-effort persist to audit repo — never throw on failure.
  try {
    const repos = getRepositories();
    await repos.audit.append({
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actorId: entry.actorId,
      actorRole: (entry.actorRole ?? "employee") as never,
      actionType: `security.${type}`,
      entityType: "system",
      entityLabel: entry.resource || type,
      detail: JSON.stringify({ outcome: entry.outcome, ...entry.meta }),
      at: entry.at,
    });
  } catch {
    /* intentionally silent — never block the main flow */
  }
}
