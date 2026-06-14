import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { orgHealthIntelligence } from "@/server/services/intelligence-loader";
import { guarded, ok, principalView } from "@/server/api";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return guarded(req, "api_org_health", async () => {
    const principal = resolvePrincipal(req);
    return ok(await orgHealthIntelligence(), { ...principalView(principal) });
  });
}
