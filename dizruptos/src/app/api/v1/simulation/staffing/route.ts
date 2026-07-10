import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { staffingSimulation } from "@/server/services/intelligence-loader";
import { guarded, ok, fail, principalView } from "@/server/api";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return guarded(req, "api_sim_staffing", async () => {
    const principal = resolvePrincipal(req);
    const cap = req.nextUrl.searchParams.get("capabilityId");
    if (!cap) return fail(422, "INVALID_INPUT", "capabilityId is required");
    const name = req.nextUrl.searchParams.get("name") ?? "New Hire";
    const prof = Number(req.nextUrl.searchParams.get("proficiency") ?? "4");
    return ok(await staffingSimulation(cap, name, prof), { ...principalView(principal) });
  });
}
