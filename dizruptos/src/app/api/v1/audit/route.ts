// GET /api/v1/audit — the immutable ledger, read side. Gated on view_audit
// (admin, dept_head). There is intentionally no write surface here: audit
// entries are appended only by mutation routes, never directly by clients.

import { type NextRequest } from "next/server";
import { getRepositories } from "@/server/repositories";
import { requirePermission, resolvePrincipal } from "@/server/services/authz";
import { guarded, ok, principalView } from "@/server/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "api_audit", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_audit");
    const limitRaw = req.nextUrl.searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitRaw) || 100, 1), 500);
    const repos = getRepositories();
    const data = await repos.audit.list(limit);
    return ok(data, { backend: repos.backend, ...principalView(principal) });
  });
}
