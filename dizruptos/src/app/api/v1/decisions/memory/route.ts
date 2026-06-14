// GET /api/v1/decisions/memory — Decision Intelligence + Organizational Memory,
// computed live: per-decision score/risk/evidence plus the memory record
// (why / who / what happened / what we learned / would we repeat) and
// governance concentration. repositories → loader → engines → API.

import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { decisionIntelligence } from "@/server/services/decision-loader";
import { guarded, ok, principalView } from "@/server/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "api_decision_memory", async () => {
    const principal = resolvePrincipal(req);
    const data = await decisionIntelligence();
    return ok(data, { ...principalView(principal) });
  });
}
