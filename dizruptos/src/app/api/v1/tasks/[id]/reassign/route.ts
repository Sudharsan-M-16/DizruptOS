// POST /api/v1/tasks/:id/reassign — the atomic reallocation, server-enforced.
//
// Body: { toEmployeeId: string, overrideReason?: string }
//
// Laws enforced here (PRD §3.3, §11):
//   · requires the `reallocate` permission — client UI state is not trusted
//   · the guardrail runs server-side: a move projecting ≥100% utilization is
//     refused with 409 OVERRIDE_REQUIRED unless a typed reason accompanies it
//   · the reassignment and both capacity deltas commit as one unit
//   · every applied move (and every override) lands in the audit ledger

import { type NextRequest } from "next/server";
import { getRepositories } from "@/server/repositories";
import { requirePermission, resolvePrincipal } from "@/server/services/authz";
import { planReallocation } from "@/server/services/allocation";
import { fail, guarded, ok, principalView } from "@/server/api";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return guarded(req, "api_task_reassign", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "reallocate");

    const body = (await req.json().catch(() => null)) as {
      toEmployeeId?: string;
      overrideReason?: string;
    } | null;
    if (!body || typeof body.toEmployeeId !== "string" || !body.toEmployeeId) {
      return fail(422, "INVALID_INPUT", "toEmployeeId is required.");
    }

    const repos = getRepositories();
    const [task, target, capacity] = await Promise.all([
      repos.tasks.byId(params.id),
      repos.employees.byId(body.toEmployeeId),
      repos.capacity.list(),
    ]);

    const plan = planReallocation({ task: task ?? undefined, target: target ?? undefined, capacity });
    if (!plan.ok) {
      if (plan.reason === "SAME_ASSIGNEE")
        return fail(409, "SAME_ASSIGNEE", "Task already assigned to that employee.");
      return fail(404, "NOT_FOUND", plan.reason ?? "unknown");
    }

    const override = body.overrideReason?.trim();
    if (plan.requiresOverride && !override) {
      return fail(
        409,
        "OVERRIDE_REQUIRED",
        `Move projects target to ${(plan.projected * 100).toFixed(0)}% — a typed override reason is required.`
      );
    }

    await repos.tasks.reassign(params.id, body.toEmployeeId);
    await repos.audit.append({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      actorId: principal.id,
      actorRole: principal.role,
      actionType: plan.requiresOverride ? "REALLOCATE_OVERRIDE" : "REALLOCATE",
      entityType: "task",
      entityLabel: task!.title,
      detail: `Reassigned to ${target!.name} · projected ${(plan.projected * 100).toFixed(0)}%`,
      overrideReason: override || undefined,
      at: new Date().toISOString(),
    });
    log.info("task_reassigned", {
      taskId: params.id,
      to: body.toEmployeeId,
      actor: principal.id,
      projected: plan.projected,
      override: Boolean(override),
    });

    return ok(
      { taskId: params.id, toEmployeeId: body.toEmployeeId, projected: plan.projected },
      { backend: repos.backend, ...principalView(principal) }
    );
  });
}
