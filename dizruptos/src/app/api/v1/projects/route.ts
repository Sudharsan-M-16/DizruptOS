// GET /api/v1/projects — portfolio; health computed server-side
// POST /api/v1/projects — create project; requires reallocate permission

import { type NextRequest } from "next/server";
import { getRepositories } from "@/server/repositories";
import { resolvePrincipal, requirePermission } from "@/server/services/authz";
import { guarded, ok, principalView } from "@/server/api";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "api_projects", async () => {
    const principal = resolvePrincipal(req);
    const repos = getRepositories();
    const data = await repos.projects.list();
    return ok(data, { backend: repos.backend, ...principalView(principal) });
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, "api_projects_create", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "reallocate");
    const body = await req.json().catch(() => null);
    if (!body?.name) {
      const { NextResponse } = await import("next/server");
      return NextResponse.json({ code: "INVALID_INPUT", message: "name is required" }, { status: 422 });
    }
    const repos = getRepositories();
    const project = await repos.projects.create({
      name: String(body.name),
      description: body.description ?? "",
      ownerId: body.ownerId ?? principal.id,
      departmentId: body.departmentId ?? "",
      health: "ON_TRACK",
      healthReasons: ["New project — no signals yet"],
      status: "ACTIVE",
      startDate: new Date().toISOString().slice(0, 10),
      targetDate: body.targetDate ?? "",
      budgetHours: Number(body.budgetHours ?? 0),
      consumedHours: 0,
      budgetMicro: Number(body.budgetMicro ?? 0),
      consumedMicro: 0,
      customer: body.customer || undefined,
    });
    log.info("project_created", { projectId: project.id, actor: principal.id });
    return ok(project, { backend: repos.backend, ...principalView(principal) });
  });
}
