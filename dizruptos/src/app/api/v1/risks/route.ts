// GET /api/v1/risks  — the register; severity computed server-side only
// POST /api/v1/risks — log a new risk; requires reallocate permission

import { type NextRequest } from "next/server";
import { getRepositories } from "@/server/repositories";
import { resolvePrincipal, requirePermission } from "@/server/services/authz";
import { guarded, ok, principalView } from "@/server/api";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "api_risks", async () => {
    const principal = resolvePrincipal(req);
    const repos = getRepositories();
    const data = await repos.risks.list();
    return ok(data, { backend: repos.backend, ...principalView(principal) });
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, "api_risks_create", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "reallocate");
    const body = await req.json().catch(() => null);
    if (!body?.title) {
      const { NextResponse } = await import("next/server");
      return NextResponse.json({ code: "INVALID_INPUT", message: "title is required" }, { status: 422 });
    }
    const repos = getRepositories();
    const risk = await repos.risks.create({
      title: String(body.title),
      category: body.category ?? "operational",
      probability: body.probability ?? "medium",
      impact: body.impact ?? "medium",
      ownerId: body.ownerId ?? principal.id,
      projectId: body.projectId || undefined,
      mitigationPlan: body.mitigationPlan ?? "",
      mitigationStatus: "not_started",
      status: "OPEN",
      createdAt: new Date().toISOString(),
      signals: [],
    });
    log.info("risk_logged", { riskId: risk.id, actor: principal.id });
    return ok(risk, { backend: repos.backend, ...principalView(principal) });
  });
}
