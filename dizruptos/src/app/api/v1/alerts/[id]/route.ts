import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { guarded, ok, fail } from "@/server/api";
import { acknowledgeAlert } from "@/server/services/alert-engine";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return guarded(req, "alert_ack", async () => {
    resolvePrincipal(req);
    const { id } = await params;
    const success = acknowledgeAlert(id);
    if (!success) return fail(404, "NOT_FOUND", `Alert ${id} not found`);
    return ok({ acknowledged: true, id });
  });
}
