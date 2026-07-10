import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { guarded, ok } from "@/server/api";
import {
  listAlerts,
  runAlertEngine,
  acknowledgeAll,
  type AlertCategory,
} from "@/server/services/alert-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "alerts_list", async () => {
    const principal = resolvePrincipal(req);
    const orgId = "demo";
    const cat = req.nextUrl.searchParams.get("category") as AlertCategory | null;
    const unacked = req.nextUrl.searchParams.get("unacknowledged") === "true";
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "50"), 200);
    return ok(listAlerts(orgId, { category: cat ?? undefined, unacknowledged: unacked, limit }));
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, "alerts_action", async () => {
    resolvePrincipal(req);
    const orgId = "demo";
    let body: { action?: string } = {};
    try { body = await req.json(); } catch { /* no body is fine */ }

    if (body?.action === "acknowledge_all") {
      const count = acknowledgeAll(orgId);
      return ok({ acknowledged: count });
    }

    const generated = await runAlertEngine(orgId);
    return ok({ generated: generated.length, alerts: generated });
  });
}
