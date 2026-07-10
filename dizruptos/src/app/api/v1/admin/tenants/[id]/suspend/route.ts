// POST /api/v1/admin/tenants/[id]/suspend — suspend or reactivate a tenant.
//
// Suspension immediately blocks all new logins for the org (middleware checks
// organizations.suspended_at). Existing sessions expire naturally.
// Body: { suspend: true, reason: "..." } | { suspend: false }

import { type NextRequest } from "next/server";
import { resolvePrincipal, requirePermission } from "@/server/services/authz";
import { guarded, ok, fail } from "@/server/api";
import { createClient } from "@supabase/supabase-js";
import { env, isDemoMode } from "@/lib/env";

export const dynamic = "force-dynamic";

function adminClient() {
  if (isDemoMode || !env.supabaseUrl) return null;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(env.supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return guarded(req, "api_admin_tenant_suspend", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_audit"); // admin-gated

    let body: { suspend: boolean; reason?: string };
    try { body = await req.json(); }
    catch { return fail(400, "INVALID_INPUT", "Invalid JSON"); }

    const sb = adminClient();
    if (!sb) {
      return ok({
        demo: true,
        message: `Demo mode: would ${body.suspend ? "suspend" : "reactivate"} tenant ${id}`,
        org_id: id,
        suspended: body.suspend,
      });
    }

    const patch = body.suspend
      ? { suspended_at: new Date().toISOString(), suspend_reason: body.reason ?? "Administrative action" }
      : { suspended_at: null, suspend_reason: null };

    const { data, error } = await sb
      .from("organizations")
      .update(patch)
      .eq("id", id)
      .select("id,name,suspended_at,suspend_reason")
      .single();

    if (error) return fail(500, "INTERNAL", error.message);
    if (!data) return fail(404, "NOT_FOUND", `Tenant ${id} not found`);

    return ok({
      org_id:    data.id,
      name:      data.name,
      suspended: !!data.suspended_at,
      reason:    data.suspend_reason,
      at:        data.suspended_at,
    });
  });
}
