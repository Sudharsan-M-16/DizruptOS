// GET /api/v1/projects — the portfolio. Any authenticated principal may read
// projects (organizational facts). Health/severity are computed server-side
// in the domain layer, never accepted from a client.

import { type NextRequest } from "next/server";
import { getRepositories } from "@/server/repositories";
import { resolvePrincipal } from "@/server/services/authz";
import { guarded, ok, principalView } from "@/server/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "api_projects", async () => {
    const principal = resolvePrincipal(req);
    const repos = getRepositories();
    const data = await repos.projects.list();
    return ok(data, { backend: repos.backend, ...principalView(principal) });
  });
}
