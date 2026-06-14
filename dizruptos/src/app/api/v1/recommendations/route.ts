import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { recommendationsIntel } from "@/server/services/intelligence-loader";
import { guarded, ok, principalView } from "@/server/api";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return guarded(req, "api_recommendations", async () => {
    const principal = resolvePrincipal(req);
    return ok(await recommendationsIntel(), { ...principalView(principal) });
  });
}
