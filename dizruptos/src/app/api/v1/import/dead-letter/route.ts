import { type NextRequest } from "next/server";
import { resolvePrincipal, requirePermission } from "@/server/services/authz";
import { guarded, ok } from "@/server/api";
import { listDeadLettered, clearDeadLettered } from "@/server/services/import-jobs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "dead_letter_list", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_audit");
    return ok(listDeadLettered());
  });
}

export async function DELETE(req: NextRequest) {
  return guarded(req, "dead_letter_clear", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_audit");
    const jobId = req.nextUrl.searchParams.get("jobId");
    if (!jobId) return ok({ cleared: false, reason: "jobId required" });
    clearDeadLettered(jobId);
    return ok({ cleared: true, jobId });
  });
}
