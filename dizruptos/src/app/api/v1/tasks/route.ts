// GET /api/v1/tasks  — full task list for the authenticated principal
// POST /api/v1/tasks — create a task; returns the persisted record

import { type NextRequest } from "next/server";
import { getRepositories } from "@/server/repositories";
import { resolvePrincipal } from "@/server/services/authz";
import { guarded, ok, principalView } from "@/server/api";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "api_tasks", async () => {
    const principal = resolvePrincipal(req);
    const repos = getRepositories();
    const data = await repos.tasks.list();
    return ok(data, { backend: repos.backend, ...principalView(principal) });
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, "api_tasks_create", async () => {
    const principal = resolvePrincipal(req);
    const body = await req.json().catch(() => null);
    if (!body?.title) {
      const { NextResponse } = await import("next/server");
      return NextResponse.json({ code: "INVALID_INPUT", message: "title is required" }, { status: 422 });
    }
    const repos = getRepositories();
    const { WEEKS } = await import("@/lib/data");
    const task = await repos.tasks.create({
      title: String(body.title),
      projectId: body.projectId ?? "",
      assigneeId: body.assigneeId ?? "",
      status: body.status ?? "TODO",
      priority: body.priority ?? "MEDIUM",
      estimatedHours: Number(body.estimatedHours ?? 4),
      dueDate: body.dueDate ?? "",
      weekStart: body.weekStart ?? WEEKS[0],
    });
    log.info("task_created", { taskId: task.id, actor: principal.id });
    return ok(task, { backend: repos.backend, ...principalView(principal) });
  });
}
