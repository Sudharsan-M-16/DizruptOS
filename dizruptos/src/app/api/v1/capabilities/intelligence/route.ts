// GET /api/v1/capabilities/intelligence — COMPUTED capability intelligence,
// served through the clean stack: repositories → loader → engine → API.
// Bus factor, concentration, succession risk, expert discovery, backup coverage
// and org capability-health are computed live, never stored.

import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { capabilityIntelligence } from "@/server/services/capability-loader";
import { guarded, ok, principalView } from "@/server/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "api_capability_intelligence", async () => {
    const principal = resolvePrincipal(req);
    const data = await capabilityIntelligence();
    return ok(data, { ...principalView(principal) });
  });
}
