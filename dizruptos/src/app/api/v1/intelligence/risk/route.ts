import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { riskIntelligence } from "@/server/services/intelligence-loader";
import { guarded, ok, principalView } from "@/server/api";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return guarded(req, "api_risk_intel", async () => {
    const principal = resolvePrincipal(req);
    return ok(await riskIntelligence(), { ...principalView(principal) });
  });
}
