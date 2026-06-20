// GET    /api/v1/invitations/[token]   — validate token, return invite details
// POST   /api/v1/invitations/[token]   — accept or decline { action: "accept"|"decline" }
// DELETE /api/v1/invitations/[token]   — revoke (admin/manager only)

import { type NextRequest } from "next/server";
import { resolvePrincipal, requirePermission } from "@/server/services/authz";
import { guarded, ok, fail } from "@/server/api";
import { getRepositories } from "@/server/repositories";
import { log } from "@/server/lib/logger";
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

// No auth required — token IS the credential for GET/POST
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return guarded(req, "invitation_validate", async () => {
    const sb = adminClient();
    if (!sb) {
      // Demo mode: return a mock valid invitation
      if (token.startsWith("demo-")) {
        return ok({
          email: "invited@example.com",
          role: "employee",
          orgName: "Demo Corp",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: "pending",
        });
      }
      return fail(404, "NOT_FOUND", "Invitation not found.");
    }

    const { data: inv, error } = await sb
      .from("invitations")
      .select("id, email, role, status, expires_at, org_id, organizations(name)")
      .eq("token", token)
      .maybeSingle();

    if (error || !inv) return fail(404, "NOT_FOUND", "Invitation not found.");
    if (inv.status !== "pending") return fail(410, "EXPIRED_OR_USED", `Invitation is ${inv.status}.`);
    if (new Date(inv.expires_at) < new Date()) {
      // Mark expired in DB
      await sb.from("invitations").update({ status: "expired" }).eq("token", token);
      return fail(410, "EXPIRED_OR_USED", "Invitation has expired.");
    }

    const orgsData = inv.organizations as { name: string }[] | { name: string } | null;
    const orgName = (Array.isArray(orgsData) ? orgsData[0]?.name : orgsData?.name) ?? "Your organization";
    return ok({ email: inv.email, role: inv.role, orgName, expiresAt: inv.expires_at, status: inv.status });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return guarded(req, "invitation_respond", async () => {
    let body: { action?: string };
    try { body = await req.json(); }
    catch { return fail(400, "INVALID_INPUT", "Invalid JSON body."); }

    const action = body.action;
    if (action !== "accept" && action !== "decline") {
      return fail(422, "INVALID_ACTION", "action must be 'accept' or 'decline'.");
    }

    const sb = adminClient();
    const repos = getRepositories();
    const now = new Date().toISOString();

    if (!sb) {
      // Demo mode dry-run
      log("info", `invitation_${action}`, { token: token.slice(0, 12), mode: "demo" });
      await repos.audit.append({
        id: `aud-inv-${Date.now()}`,
        actorId: "demo",
        actorRole: "employee",
        actionType: `invitation_${action}ed`,
        entityType: "invitation",
        entityLabel: token.slice(0, 12),
        detail: `Invitation ${action}ed (demo mode)`,
        at: now,
      });
      return ok({ status: action === "accept" ? "accepted" : "declined", mode: "demo" });
    }

    const { data: inv, error } = await sb
      .from("invitations")
      .select("id, email, role, status, expires_at, org_id")
      .eq("token", token)
      .maybeSingle();

    if (error || !inv) return fail(404, "NOT_FOUND", "Invitation not found.");
    if (inv.status !== "pending") return fail(410, "EXPIRED_OR_USED", `Invitation is already ${inv.status}.`);
    if (new Date(inv.expires_at) < new Date()) {
      await sb.from("invitations").update({ status: "expired" }).eq("token", token);
      return fail(410, "EXPIRED_OR_USED", "Invitation has expired.");
    }

    if (action === "accept") {
      // Upsert user row — trigger on auth.users INSERT will set org_id from metadata on sign-in
      // Best-effort: pre-create user row; auth trigger will do it properly on sign-in
      try {
        await sb.from("users").upsert({ email: inv.email, org_id: inv.org_id, role: inv.role }, { onConflict: "email" });
      } catch { /* ignore — trigger handles this on sign-in */ }

      const { error: updateErr } = await sb
        .from("invitations")
        .update({ status: "accepted", accepted_by: null, updated_at: now })
        .eq("token", token);

      if (updateErr) {
        log("error", "invitation_accept_failed", { error: updateErr.message });
        return fail(500, "STORAGE_ERROR", "Failed to accept invitation.");
      }
    } else {
      await sb.from("invitations").update({ status: "declined", updated_at: now }).eq("token", token);
    }

    log("info", `invitation_${action}ed`, { token: token.slice(0, 12), email: inv.email, role: inv.role });
    await repos.audit.append({
      id: `aud-inv-${Date.now()}`,
      actorId: inv.email,
      actorRole: inv.role as never,
      actionType: `invitation_${action}ed`,
      entityType: "invitation",
      entityLabel: inv.email,
      detail: `Invitation ${action}ed for ${inv.email} as ${inv.role}`,
      at: now,
    });

    return ok({ status: action === "accept" ? "accepted" : "declined" });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return guarded(req, "invitation_revoke", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "review_proposals");

    const sb = adminClient();
    const repos = getRepositories();
    const now = new Date().toISOString();

    if (!sb) {
      log("info", "invitation_revoke", { token: token.slice(0, 12), mode: "demo" });
      return ok({ status: "revoked", mode: "demo" });
    }

    const { data: inv, error: findErr } = await sb
      .from("invitations")
      .select("id, email, status")
      .eq("token", token)
      .maybeSingle();

    if (findErr || !inv) return fail(404, "NOT_FOUND", "Invitation not found.");
    if (inv.status !== "pending") return fail(409, "CONFLICT", `Invitation is already ${inv.status}.`);

    const { error: updateErr } = await sb
      .from("invitations")
      .update({ status: "revoked", updated_at: now })
      .eq("token", token);

    if (updateErr) return fail(500, "STORAGE_ERROR", "Failed to revoke invitation.");

    await repos.audit.append({
      id: `aud-inv-${Date.now()}`,
      actorId: principal.id,
      actorRole: principal.role,
      actionType: "invitation_revoked",
      entityType: "invitation",
      entityLabel: inv.email,
      detail: `Invitation revoked for ${inv.email} by ${principal.id}`,
      at: now,
    });

    return ok({ status: "revoked" });
  });
}
