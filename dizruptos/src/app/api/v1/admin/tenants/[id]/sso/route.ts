// GET/PUT /api/v1/admin/tenants/[id]/sso — per-tenant SSO configuration.
//
// Only callable with the service-role key or an admin-role session.
// GET: return the SSO config for a tenant (secrets redacted).
// PUT: upsert the SSO config (full config including secrets).
// DELETE: disable SSO for a tenant.

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return guarded(req, "api_admin_sso_get", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_audit"); // admin-only

    const sb = adminClient();
    if (!sb) {
      return ok({
        demo: true,
        message: "SSO config is stored in DB in production mode. Configure Supabase to manage SSO.",
        sampleConfig: {
          protocol: "saml",
          saml_idp_entity_id: "https://idp.example.com/saml",
          saml_idp_sso_url: "https://idp.example.com/sso",
          enabled: true,
          auto_provision: true,
          default_role: "employee",
        },
      });
    }

    const { data, error } = await sb
      .from("tenant_sso_configs")
      .select("id,org_id,protocol,saml_idp_entity_id,saml_idp_sso_url,saml_sp_entity_id,saml_attribute_email,saml_attribute_role,oidc_issuer,oidc_client_id,oidc_scopes,auto_provision,default_role,enabled,verified_at,last_login_at,created_at,updated_at")
      .eq("org_id", id)
      .maybeSingle();

    if (error) return fail(500, "INTERNAL", error.message);
    if (!data) return fail(404, "NOT_FOUND", `No SSO config for tenant ${id}`);

    return ok(data);
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return guarded(req, "api_admin_sso_put", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_audit");

    let body: Record<string, unknown>;
    try { body = await req.json(); }
    catch { return fail(400, "INVALID_INPUT", "Invalid JSON"); }

    const sb = adminClient();
    if (!sb) return fail(503, "UNAVAILABLE", "Database not configured (demo mode).");

    const config = {
      org_id:               id,
      protocol:             body.protocol ?? "saml",
      saml_idp_entity_id:   body.saml_idp_entity_id ?? null,
      saml_idp_sso_url:     body.saml_idp_sso_url ?? null,
      saml_idp_certificate: body.saml_idp_certificate ?? null,
      saml_sp_entity_id:    body.saml_sp_entity_id ?? null,
      saml_attribute_email: body.saml_attribute_email ?? "email",
      saml_attribute_role:  body.saml_attribute_role ?? "role",
      oidc_issuer:          body.oidc_issuer ?? null,
      oidc_client_id:       body.oidc_client_id ?? null,
      oidc_client_secret:   body.oidc_client_secret ?? null,
      oidc_scopes:          body.oidc_scopes ?? "openid email profile",
      auto_provision:       body.auto_provision ?? true,
      default_role:         body.default_role ?? "employee",
      enabled:              body.enabled ?? true,
      updated_at:           new Date().toISOString(),
    };

    const { data, error } = await sb
      .from("tenant_sso_configs")
      .upsert(config, { onConflict: "org_id" })
      .select("id,org_id,protocol,enabled,auto_provision,updated_at")
      .single();

    if (error) return fail(500, "INTERNAL", error.message);
    return ok(data);
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return guarded(req, "api_admin_sso_delete", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_audit");

    const sb = adminClient();
    if (!sb) return fail(503, "UNAVAILABLE", "Database not configured (demo mode).");

    const { error } = await sb
      .from("tenant_sso_configs")
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq("org_id", id);

    if (error) return fail(500, "INTERNAL", error.message);
    return ok({ disabled: true, org_id: id });
  });
}
