// GET /api/v1/people/intelligence — the Human Intelligence Layer, computed.
// Per-person expertise, succession risk, org-dependency, knowledge concentration
// and graph degree centrality — served through repositories → loader → engine.

import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { peopleIntelligence } from "@/server/services/people-loader";
import { guarded, ok, principalView } from "@/server/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "api_people_intelligence", async () => {
    const principal = resolvePrincipal(req);
    const data = await peopleIntelligence();
    return ok(data, { ...principalView(principal) });
  });
}
