// GET /api/v1/search?q=<query>&type=<entityType>&k=<topK>
//
// Semantic search over org entities using TF-IDF embeddings built from the
// live repository data. Powers "who owns payment risk?", "which projects are
// at risk?", "find engineers with React capability" in Spotlight and the
// AI Copilot context injector.

import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { guarded, ok, fail } from "@/server/api";
import { getRepositories } from "@/server/repositories";
import { semanticSearch, type EntityVector } from "@/server/services/embeddings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "api_search", async () => {
    resolvePrincipal(req);

    const q       = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const typeRaw = req.nextUrl.searchParams.get("type") as EntityVector["entityType"] | null;
    const topK    = Math.max(1, Math.min(20,
      parseInt(req.nextUrl.searchParams.get("k") ?? "5", 10) || 5
    ));

    if (!q) return fail(400, "INVALID_INPUT", "Query parameter `q` is required.");

    const repos   = getRepositories();
    const results = await semanticSearch(q, repos, { topK, entityType: typeRaw ?? undefined });

    return ok(results, { count: results.length });
  });
}
