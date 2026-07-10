// GET   /api/v1/notifications?unread=true&limit=20  — list notifications for current user
// PATCH /api/v1/notifications                        — mark all read
// PATCH /api/v1/notifications?id=<id>               — mark single notification read

import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
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

export async function GET(req: NextRequest) {
  return guarded(req, "notifications_list", async () => {
    const principal = resolvePrincipal(req);
    const sp = req.nextUrl.searchParams;
    const unreadOnly = sp.get("unread") === "true";
    const limit = Math.min(parseInt(sp.get("limit") ?? "20", 10), 100);

    const sb = adminClient();
    if (!sb) {
      // Demo mode: return in-memory notifications from the store-compatible format
      const repos = getRepositories();
      const audits = (await repos.audit.list()).slice(0, limit);
      return ok({
        notifications: audits.map((a) => ({
          id: a.id,
          userId: principal.id,
          klass: "system",
          type: a.actionType,
          title: a.actionType.replace(/_/g, " "),
          body: a.detail,
          read: false,
          createdAt: a.at,
        })),
        unreadCount: audits.length,
      });
    }

    let query = sb
      .from("notifications")
      .select("id, user_id, klass, type, title, body, entity_type, entity_id, read, created_at")
      .eq("user_id", principal.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) query = query.eq("read", false);

    const { data, error } = await query;
    if (error) {
      log("error", "notifications_list_failed", { error: error.message });
      return fail(500, "STORAGE_ERROR", "Failed to load notifications.");
    }

    const unreadCount = (data ?? []).filter((n) => !n.read).length;
    return ok({ notifications: data ?? [], unreadCount }, {
      principal: { id: principal.id, role: principal.role },
    });
  });
}

export async function PATCH(req: NextRequest) {
  return guarded(req, "notifications_mark_read", async () => {
    const principal = resolvePrincipal(req);
    const sp = req.nextUrl.searchParams;
    const id = sp.get("id");

    const sb = adminClient();
    if (!sb) {
      return ok({ updated: id ? 1 : 0, mode: "demo" });
    }

    let updateQuery = sb
      .from("notifications")
      .update({ read: true })
      .eq("user_id", principal.id);

    if (id) {
      updateQuery = updateQuery.eq("id", id);
    }

    const { error, count } = await updateQuery;
    if (error) {
      log("error", "notifications_mark_read_failed", { error: error.message });
      return fail(500, "STORAGE_ERROR", "Failed to update notifications.");
    }

    return ok({ updated: count ?? 0 });
  });
}
