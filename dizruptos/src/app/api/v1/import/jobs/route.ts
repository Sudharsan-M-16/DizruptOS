// GET /api/v1/import/jobs — list recent import jobs (last N, newest first).
// Requires view_audit permission.

import { type NextRequest } from "next/server";
import { resolvePrincipal, requirePermission } from "@/server/services/authz";
import { guarded, ok } from "@/server/api";
import { listJobs } from "@/server/services/import-jobs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "import_jobs_list", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_audit");
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? "20");
    return ok(listJobs(Math.min(limit, 50)));
  });
}
