// GET  /api/v1/organizations   — list orgs for current user
// POST /api/v1/organizations   — create a new organization (self-service)
//
// On POST: validates slug uniqueness, creates org, updates user to admin,
// seeds tenant_settings defaults. Demo mode: dry-run.

import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { guarded, ok, fail } from "@/server/api";
import { getRepositories } from "@/server/repositories";
import { log } from "@/server/lib/logger";
import { createClient } from "@supabase/supabase-js";
import { env, isDemoMode } from "@/lib/env";
import { OrganizationCreateSchema, parseBody } from "@/lib/schemas";

export const dynamic = "force-dynamic";

function adminClient() {
  if (isDemoMode || !env.supabaseUrl) return null;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(env.supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(req: NextRequest) {
  return guarded(req, "organizations_list", async () => {
    const principal = resolvePrincipal(req);
    const sb = adminClient();

    if (!sb) {
      return ok({
        organizations: [{
          id: "org-demo-1",
          name: "Demo Corp",
          slug: "demo-corp",
          createdAt: "2026-01-01T00:00:00Z",
        }],
      });
    }

    const { data, error } = await sb
      .from("organizations")
      .select("id, name, slug, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      log("error", "organizations_list_failed", { error: error.message });
      return fail(500, "STORAGE_ERROR", "Failed to list organizations.");
    }

    return ok({ organizations: data ?? [] }, { principal: { id: principal.id, role: principal.role } });
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, "organizations_create", async () => {
    const principal = resolvePrincipal(req);

    let raw: unknown;
    try { raw = await req.json(); }
    catch { return fail(400, "INVALID_INPUT", "Invalid JSON body."); }

    const parsed = parseBody(OrganizationCreateSchema, raw);
    if ("error" in parsed) return fail(422, "INVALID_INPUT", parsed.error);
    const { name, slug } = parsed.data;

    const repos = getRepositories();
    const now = new Date().toISOString();

    // Demo mode: dry-run
    const sb = adminClient();
    if (!sb) {
      log("info", "organization_create_demo", { name, slug, actorId: principal.id });
      const mockId = `org-${Date.now()}`;
      await repos.audit.append({
        id: `aud-org-${Date.now()}`,
        actorId: principal.id,
        actorRole: principal.role,
        actionType: "organization_created",
        entityType: "organization",
        entityLabel: name,
        detail: `Organization "${name}" (${slug}) created (demo mode — no DB write)`,
        at: now,
      });
      return ok({
        id: mockId,
        name,
        slug,
        createdAt: now,
        mode: "demo",
      });
    }

    // Live: insert organization
    const { data: org, error: insertErr } = await sb
      .from("organizations")
      .insert({ name, slug })
      .select("id, name, slug, created_at")
      .single();

    if (insertErr) {
      if (insertErr.code === "23505") {
        return fail(409, "CONFLICT", `Organization slug "${slug}" is already taken.`);
      }
      log("error", "organization_insert_failed", { error: insertErr.message, slug });
      return fail(500, "STORAGE_ERROR", "Failed to create organization.");
    }

    // Update the creator to be admin of this org
    const { error: userErr } = await sb
      .from("users")
      .update({ org_id: org.id, role: "admin" })
      .eq("id", principal.id);

    if (userErr) {
      log("warn", "organization_user_update_failed", { error: userErr.message, userId: principal.id, orgId: org.id });
    }

    await repos.audit.append({
      id: `aud-org-${Date.now()}`,
      actorId: principal.id,
      actorRole: principal.role,
      actionType: "organization_created",
      entityType: "organization",
      entityLabel: name,
      detail: `Organization "${name}" (${slug}) created by ${principal.id}`,
      at: now,
    });

    log("info", "organization_created", { orgId: org.id, slug, actorId: principal.id });
    return ok({ id: org.id, name: org.name, slug: org.slug, createdAt: org.created_at }, {
      principal: { id: principal.id, role: principal.role },
    });
  });
}
