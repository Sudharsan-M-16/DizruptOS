import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { dependencyIntelligence } from "@/server/services/intelligence-loader";
import { guarded, ok, principalView } from "@/server/api";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return guarded(req, "api_dep_intel", async () => {
    const principal = resolvePrincipal(req);
    return ok(await dependencyIntelligence(), { ...principalView(principal) });
  });
}
