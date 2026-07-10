// GET /api/v1/intelligence/learning — the Learning Dashboard data: calibration
// over real resolved predictions, recommendation lifecycle rollup, outcome
// quality, and captured learnings. Answers "are we getting smarter?".

import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { learningIntelligence } from "@/server/services/intelligence-loader";
import { guarded, ok, principalView } from "@/server/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "api_learning", async () => {
    const principal = resolvePrincipal(req);
    return ok(await learningIntelligence(), { ...principalView(principal) });
  });
}
