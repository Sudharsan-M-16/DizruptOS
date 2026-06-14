// POST /api/v1/recommendations/:id — drive a recommendation through its
// lifecycle (the act → predict → measure → calibrate loop).
//
// Body: { to: LifecycleStatus, confidence?, expectedDelta?, actualValue?, rationale? }
//
//   · `accept`  writes back a PREDICTION (confidence + baseline + expected delta)
//   · `measure` records the ACTUAL value and scores ACCURACY → feeds calibration
//   · invalid state-machine moves are refused 409; every move is audited
//
// Requires the `view_executive` permission — acting on org-level intelligence is
// a leadership surface, not an individual-contributor one.

import { type NextRequest } from "next/server";
import { requirePermission, resolvePrincipal } from "@/server/services/authz";
import { transitionRecommendation } from "@/server/services/intelligence-loader";
import { fail, guarded, ok, principalView } from "@/server/api";
import type { RecommendationStatus } from "@/server/repositories/types";

export const dynamic = "force-dynamic";

const ALLOWED: RecommendationStatus[] = [
  "acknowledged", "accepted", "rejected", "deferred", "completed", "measured",
];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return guarded(req, "api_recommendation_transition", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_executive");

    const body = (await req.json().catch(() => null)) as {
      to?: RecommendationStatus;
      confidence?: number;
      expectedDelta?: number;
      actualValue?: number;
      rationale?: string;
    } | null;

    if (!body?.to || !ALLOWED.includes(body.to)) {
      return fail(422, "INVALID_INPUT", `to must be one of: ${ALLOWED.join(", ")}`);
    }

    const updated = await transitionRecommendation(params.id, body.to, principal, {
      confidence: body.confidence,
      expectedDelta: body.expectedDelta,
      actualValue: body.actualValue,
      rationale: body.rationale,
    });

    return ok(updated, { ...principalView(principal) });
  });
}
