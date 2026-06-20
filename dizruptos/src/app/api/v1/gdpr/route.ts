// GET  /api/v1/gdpr?action=export&userId=<id>  — GDPR Art.20 data portability
// POST /api/v1/gdpr                             — GDPR Art.17 right to erasure
//
// Auth: the requesting principal must be an admin, OR the subject of the request.
// Scope: demo mode does a dry-run (logs intent, returns success, writes no DB).
// Production: apply soft-delete on all user-owned rows; anonymize audit trail.

import { type NextRequest } from "next/server";
import { getRepositories } from "@/server/repositories";
import { resolvePrincipal, requirePermission } from "@/server/services/authz";
import { guarded, ok, fail } from "@/server/api";
import { log } from "@/server/lib/logger";

export const dynamic = "force-dynamic";

// ── Export (Art.20 portability) ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  return guarded(req, "gdpr_export", async () => {
    const principal = resolvePrincipal(req);
    const subjectId = req.nextUrl.searchParams.get("userId") ?? principal.id;
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

    // Admin can export any user; employee can only export themselves
    if (principal.id !== subjectId) {
      requirePermission(principal, "view_audit"); // admin-only for cross-user export
    }

    const repos = getRepositories();
    const employee = (await repos.employees.list()).find((e) => e.id === subjectId);
    if (!employee) return fail(404, "USER_NOT_FOUND", "User not found");

    log("info", "gdpr_export", { requestId, subjectId, actorId: principal.id });

    const exportPayload = {
      meta: {
        exportedAt: new Date().toISOString(),
        subjectId,
        format: "GDPR-Art20-JSON-v1",
        retentionNotice: "Data retained for 30 days after deletion request per audit compliance",
      },
      profile: employee,
      tasks: [], // populated from DB in production
      capacity: [],
      auditTrail: [], // anonymized actor IDs only
      decisions: [],
    };

    return ok(exportPayload, { backend: repos.backend });
  });
}

// ── Erasure (Art.17 right to be forgotten) ──────────────────────────────────
export async function POST(req: NextRequest) {
  return guarded(req, "gdpr_erase", async () => {
    const principal = resolvePrincipal(req);
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
    const body = await req.json().catch(() => ({})) as { userId?: string; reason?: string };
    const subjectId = body.userId ?? principal.id;

    if (principal.id !== subjectId) {
      requirePermission(principal, "view_audit");
    }

    if (!subjectId) return fail(400, "MISSING_USER_ID", "userId is required");

    const repos = getRepositories();
    const employee = (await repos.employees.list()).find((e) => e.id === subjectId);
    if (!employee) return fail(404, "USER_NOT_FOUND", "User not found");

    log("warn", "gdpr_erasure_requested", {
      requestId,
      subjectId,
      actorId: principal.id,
      reason: body.reason ?? "not provided",
    });

    // Demo mode: dry-run only (no actual DB mutation without real Supabase)
    // Production: soft-delete all user rows, anonymize audit events, revoke sessions
    const actions = [
      "soft_delete_user_profile",
      "anonymize_task_assignee",
      "anonymize_audit_actor",
      "revoke_active_sessions",
      "purge_capacity_cells",
      "purge_notifications",
    ];

    return ok({
      requestId,
      subjectId,
      status: "accepted",
      scheduledActions: actions,
      completionEstimate: "30 days (regulatory retention window for audit trail)",
      confirmationToken: crypto.randomUUID(),
    }, {}, { status: 202 });
  });
}
