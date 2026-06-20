// GET /api/v1/copilot?q= — the graph-grounded executive advisor. Deterministic;
// answers from the live engines/memory with evidence + source (no hallucination).
import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { askCopilot } from "@/server/services/intelligence-loader";
import { guarded, ok, fail, principalView } from "@/server/api";
import { log } from "@/server/lib/logger";
import { withSpan } from "@/lib/telemetry";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return guarded(req, "api_copilot", async () => {
    const principal = resolvePrincipal(req);
    const q = req.nextUrl.searchParams.get("q");
    if (!q) return fail(422, "INVALID_INPUT", "q (question) required");
    const requestId = req.headers.get("x-request-id") ?? undefined;
    return withSpan("copilot.answer", { "copilot.q_length": q.length, principal: principal.role }, async () => {
      try {
        const result = await askCopilot(q);
        log("info", "copilot_answered", { intent: result.intent, requestId });
        return ok(result, { ...principalView(principal) });
      } catch (err) {
        log("error", "copilot_failed", { err: String(err), requestId });
        throw err;
      }
    });
  });
}
