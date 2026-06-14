// GET /api/v1/copilot?q= — the graph-grounded executive advisor. Deterministic;
// answers from the live engines/memory with evidence + source (no hallucination).
import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { askCopilot } from "@/server/services/intelligence-loader";
import { guarded, ok, fail, principalView } from "@/server/api";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return guarded(req, "api_copilot", async () => {
    const principal = resolvePrincipal(req);
    const q = req.nextUrl.searchParams.get("q");
    if (!q) return fail(422, "INVALID_INPUT", "q (question) required");
    return ok(await askCopilot(q), { ...principalView(principal) });
  });
}
