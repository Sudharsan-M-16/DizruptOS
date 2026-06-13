// GET /api/v1/capacity?week=YYYY-MM-DD — capacity cells with computed
// utilization. Permission-gated server-side (view_capacity): an employee
// calling this directly gets 403, exactly like the UI hides the page.

import { NextResponse, type NextRequest } from "next/server";
import { getRepositories } from "@/server/repositories";

export const dynamic = "force-dynamic"; // session-scoped, never static
import {
  AuthzError,
  requirePermission,
  resolvePrincipal,
} from "@/server/services/authz";
import { utilizationOf } from "@/server/services/allocation";
import { log } from "@/lib/logger";

const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  try {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_capacity");

    const week = req.nextUrl.searchParams.get("week");
    if (week && !WEEK_RE.test(week)) {
      return NextResponse.json(
        { code: "INVALID_INPUT", message: "week must be YYYY-MM-DD" },
        { status: 422 }
      );
    }

    const repos = getRepositories();
    const [cells, employees] = await Promise.all([
      week ? repos.capacity.forWeek(week) : repos.capacity.list(),
      repos.employees.list(),
    ]);
    const byId = new Map(employees.map((e) => [e.id, e]));

    return NextResponse.json({
      apiVersion: "v1",
      backend: repos.backend,
      count: cells.length,
      data: cells.map((c) => {
        const emp = byId.get(c.employeeId);
        return {
          ...c,
          utilization: emp
            ? Number(utilizationOf(cells, emp, c.weekStart).toFixed(3))
            : null,
        };
      }),
    });
  } catch (err) {
    if (err instanceof AuthzError) {
      return NextResponse.json({ code: err.code }, { status: err.status });
    }
    log.error("api_capacity_failed", { error: String(err) });
    return NextResponse.json(
      { code: "INTERNAL", message: "Capacity fetch failed." },
      { status: 500 }
    );
  }
}
