// GET  /api/v1/invitations          — list invitations for caller's org (admin/manager)
// POST /api/v1/invitations          — send invitation to email with role
//
// Demo mode: log intent + return mock success (no DB write, no email sent).
// Live mode: insert to invitations table + call supabase.auth.admin.inviteUserByEmail.

import { type NextRequest } from "next/server";
import { resolvePrincipal, requirePermission } from "@/server/services/authz";
import { guarded, ok, fail } from "@/server/api";
import { getRepositories } from "@/server/repositories";
import { log } from "@/server/lib/logger";
import { createClient } from "@supabase/supabase-js";
import { env, isDemoMode } from "@/lib/env";
import { InvitationCreateSchema, parseBody } from "@/lib/schemas";

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
  return guarded(req, "invitations_list", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "review_proposals"); // admin / dept_head / pm

    const sb = adminClient();
    if (!sb) {
      // Demo mode: return empty list
      return ok({ invitations: [], total: 0 }, { principal: { id: principal.id, role: principal.role } });
    }

    const { data, error } = await sb
      .from("invitations")
      .select("id, email, role, status, invited_by, expires_at, created_at, message")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      log("error", "invitations_list_failed", { error: error.message });
      return fail(500, "STORAGE_ERROR", "Failed to list invitations.");
    }

    return ok({ invitations: data ?? [], total: data?.length ?? 0 }, {
      principal: { id: principal.id, role: principal.role },
    });
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, "invitations_create", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "review_proposals");

    let raw: unknown;
    try { raw = await req.json(); }
    catch { return fail(400, "INVALID_INPUT", "Invalid JSON body."); }

    const parsed = parseBody(InvitationCreateSchema, raw);
    if ("error" in parsed) return fail(422, "INVALID_INPUT", parsed.error);
    const { email: emailRaw, role, message } = parsed.data;
    const email = emailRaw.toLowerCase();

    const now = new Date().toISOString();
    const repos = getRepositories();

    log("info", "invitation_sending", { actorId: principal.id, email, role });

    // Demo mode: log + return mock token
    const sb = adminClient();
    if (!sb) {
      const mockToken = `demo-${crypto.randomUUID()}`;
      await repos.audit.append({
        id: `aud-inv-${Date.now()}`,
        actorId: principal.id,
        actorRole: principal.role,
        actionType: "invitation_sent",
        entityType: "invitation",
        entityLabel: email,
        detail: `Invitation sent to ${email} as ${role}${message ? ` — "${message}"` : ""} (demo mode — no email sent)`,
        at: now,
      });
      return ok({
        id: `inv-demo-${Date.now()}`,
        email,
        role,
        token: mockToken,
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        mode: "demo",
      });
    }

    // Live mode: insert invitation row
    const { data: inv, error: insertErr } = await sb
      .from("invitations")
      .insert({
        email,
        role,
        message: message ?? null,
        invited_by: principal.id,
        // org_id will be set by RLS / session context — use principal's org
        org_id: null, // populated by DB default via auth_org() in RLS context
      })
      .select("id, token, expires_at")
      .single();

    if (insertErr) {
      if (insertErr.code === "23505") {
        return fail(409, "CONFLICT", `An invitation is already pending for ${email}.`);
      }
      log("error", "invitation_insert_failed", { error: insertErr.message, email });
      return fail(500, "STORAGE_ERROR", "Failed to create invitation.");
    }

    // Send the actual invite email via Supabase Auth
    const origin = req.headers.get("origin") ?? `https://${req.headers.get("host")}`;
    const { error: inviteErr } = await sb.auth.admin.inviteUserByEmail(email, {
      data: { role, invitation_token: inv.token },
      redirectTo: `${origin}/accept-invite?token=${inv.token}`,
    });

    if (inviteErr) {
      log("warn", "invitation_email_failed", { error: inviteErr.message, email });
      // Don't fail the request — invitation row exists; user can resend
    }

    await repos.audit.append({
      id: `aud-inv-${Date.now()}`,
      actorId: principal.id,
      actorRole: principal.role,
      actionType: "invitation_sent",
      entityType: "invitation",
      entityLabel: email,
      detail: `Invitation sent to ${email} as ${role}`,
      at: now,
    });

    return ok({
      id: inv.id,
      email,
      role,
      token: inv.token,
      status: "pending",
      expiresAt: inv.expires_at,
    }, { principal: { id: principal.id, role: principal.role } });
  });
}
