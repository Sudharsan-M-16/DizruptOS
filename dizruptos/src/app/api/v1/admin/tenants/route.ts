// GET  /api/v1/admin/tenants — list all tenants (admin only)
// POST /api/v1/admin/tenants — provision a new tenant

import { type NextRequest } from "next/server";
import { resolvePrincipal, requirePermission } from "@/server/services/authz";
import { guarded, ok, fail, principalView } from "@/server/api";
import { getRepositories } from "@/server/repositories";

export const dynamic = "force-dynamic";

interface TenantRecord {
  id: string;
  slug: string;
  name: string;
  plan: "starter" | "growth" | "enterprise";
  ssoEnabled: boolean;
  scimEnabled: boolean;
  createdAt: string;
  userCount: number;
}

function getTenantsStub(): TenantRecord[] {
  return [{
    id: "org-1",
    slug: "acme",
    name: "Acme Corp",
    plan: "enterprise",
    ssoEnabled: false,
    scimEnabled: false,
    createdAt: "2026-01-01T00:00:00Z",
    userCount: 5,
  }];
}

export async function GET(req: NextRequest) {
  return guarded(req, "api_admin_tenants", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_audit");

    const tenants = getTenantsStub();
    return ok({ tenants, total: tenants.length }, { ...principalView(principal) });
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, "api_admin_tenants_create", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_audit");

    let body: { slug: string; name: string; plan?: string; adminEmail?: string };
    try { body = await req.json(); }
    catch { return fail(400, "INVALID_INPUT", "Invalid JSON body"); }

    if (!body.slug || !body.name) return fail(400, "INVALID_INPUT", "slug and name required");
    if (!/^[a-z0-9-]{3,32}$/.test(body.slug)) return fail(400, "INVALID_INPUT", "slug must be 3-32 lowercase alphanumeric + hyphens");

    const repos = getRepositories();
    const now = new Date().toISOString();

    const newTenant: TenantRecord = {
      id: `org-${Date.now()}`,
      slug: body.slug,
      name: body.name,
      plan: (body.plan as TenantRecord["plan"]) ?? "starter",
      ssoEnabled: false,
      scimEnabled: false,
      createdAt: now,
      userCount: 0,
    };

    await repos.audit.append({
      id: `aud-tenant-${Date.now()}`,
      actorId: principal.id,
      actorRole: principal.role,
      actionType: "tenant_provisioned",
      entityType: "tenant",
      entityLabel: body.name,
      detail: `New tenant provisioned: ${body.slug} (${body.plan ?? "starter"} plan)`,
      at: now,
    });

    return ok({ tenant: newTenant }, { ...principalView(principal) });
  });
}
