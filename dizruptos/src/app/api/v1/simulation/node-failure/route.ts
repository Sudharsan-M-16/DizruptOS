import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { nodeFailureSimulation } from "@/server/services/intelligence-loader";
import { guarded, ok, fail, principalView } from "@/server/api";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return guarded(req, "api_sim_node", async () => {
    const principal = resolvePrincipal(req);
    const id = req.nextUrl.searchParams.get("nodeId");
    if (!id) return fail(422, "INVALID_INPUT", "nodeId is required");
    const label = req.nextUrl.searchParams.get("label") ?? id;
    return ok(await nodeFailureSimulation(id, label), { ...principalView(principal) });
  });
}
