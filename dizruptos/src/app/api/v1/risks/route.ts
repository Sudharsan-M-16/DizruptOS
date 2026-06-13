// GET /api/v1/risks — the register. Any authenticated principal may read
// risks (they are organizational facts, not secrets); severity is always
// computed server-side, never accepted from a client.

import { type NextRequest } from "next/server";
import { getRepositories } from "@/server/repositories";
import { resolvePrincipal } from "@/server/services/authz";
import { guarded, ok, principalView } from "@/server/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "api_risks", async () => {
    const principal = resolvePrincipal(req);
    const repos = getRepositories();
    const data = await repos.risks.list();
    return ok(data, { backend: repos.backend, ...principalView(principal) });
  });
}
