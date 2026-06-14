// GET /api/v1/intelligence/narrative?period=weekly|monthly|quarterly — the
// in-product Executive Narrative: a written brief composed from the live
// engines. Deterministic, grounded, periodized.

import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { executiveNarrative } from "@/server/services/intelligence-loader";
import { guarded, ok, principalView } from "@/server/api";
import type { Period } from "@/server/engine/narratives";

export const dynamic = "force-dynamic";

const PERIODS: Period[] = ["weekly", "monthly", "quarterly"];

export async function GET(req: NextRequest) {
  return guarded(req, "api_narrative", async () => {
    const principal = resolvePrincipal(req);
    const p = req.nextUrl.searchParams.get("period") as Period | null;
    const period: Period = p && PERIODS.includes(p) ? p : "weekly";
    return ok(await executiveNarrative(period), { ...principalView(principal) });
  });
}
