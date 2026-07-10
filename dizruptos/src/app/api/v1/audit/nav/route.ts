// POST /api/v1/audit/nav — records successful client-side navigation events.
// Fire-and-forget from the desktop; always returns 204 (never blocks the UI).
// Logged to the in-memory / Supabase audit ledger as "app_open" events.

import { type NextRequest, NextResponse } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { getRepositories } from "@/server/repositories";
import { log } from "@/lib/logger";
import type { AuditEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const principal = resolvePrincipal(req);
    const body = await req.json().catch(() => ({}));

    const href: string = typeof body?.resource === "string" ? body.resource.slice(0, 256) : "/";
    const label: string = typeof body?.label === "string" ? body.label.slice(0, 100) : href;

    const event: AuditEvent = {
      id: `nav-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actorId: principal.id,
      actorRole: principal.role,
      actionType: "app_open",
      entityType: "nav",
      entityLabel: label,
      detail: `Navigated to ${href}`,
      at: new Date().toISOString(),
    };

    const repos = getRepositories();
    await repos.audit.append(event).catch((err: unknown) => {
      log.warn("nav_audit_append_failed", {
        err: err instanceof Error ? err.message : String(err),
      });
    });

    log.info("app_open", { actor: principal.id, href, label });
  } catch {
    // Swallow all errors — audit failures must never break navigation
  }

  return new NextResponse(null, { status: 204 });
}
