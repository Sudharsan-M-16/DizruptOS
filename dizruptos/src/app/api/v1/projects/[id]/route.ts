// GET /api/v1/projects/:id — a single project. 404 (NOT_FOUND) maps through
// the shared error contract when the id is unknown.

import { type NextRequest } from "next/server";
import { getRepositories } from "@/server/repositories";
import { resolvePrincipal } from "@/server/services/authz";
import { RepositoryError } from "@/server/repositories";
import { guarded, ok, principalView } from "@/server/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return guarded(req, "api_project_detail", async () => {
    const principal = resolvePrincipal(req);
    const repos = getRepositories();
    const project = await repos.projects.byId(params.id);
    if (!project) throw new RepositoryError("NOT_FOUND", `project ${params.id}`);
    return ok(project, { backend: repos.backend, ...principalView(principal) });
  });
}
