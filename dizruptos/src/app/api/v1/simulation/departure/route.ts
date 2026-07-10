// GET /api/v1/simulation/departure?personId= — "what happens if this person
// leaves?" computed off the live graph (capability + dependency engines).
import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { departureSimulation } from "@/server/services/intelligence-loader";
import { guarded, ok, fail, principalView } from "@/server/api";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return guarded(req, "api_sim_departure", async () => {
    const principal = resolvePrincipal(req);
    const personId = req.nextUrl.searchParams.get("personId");
    if (!personId) return fail(422, "INVALID_INPUT", "personId is required");
    return ok(await departureSimulation(personId), { ...principalView(principal) });
  });
}
