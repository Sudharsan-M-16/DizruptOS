// GET /api/v1/employees — roster (cost fields gated by view_financials)
// POST /api/v1/employees — add a team member; requires reallocate permission

import { type NextRequest } from "next/server";
import { getRepositories } from "@/server/repositories";
import { resolvePrincipal, requirePermission } from "@/server/services/authz";
import { roleCan } from "@/lib/personas";
import { guarded, ok, principalView } from "@/server/api";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "api_employees", async () => {
    const principal = resolvePrincipal(req);
    const repos = getRepositories();
    const all = await repos.employees.list();
    const canSeeCost = roleCan(principal.role, "view_financials");
    const data = all.map((e) => {
      if (canSeeCost) return e;
      const { costPerHour: _cost, ...rest } = e as typeof e & { costPerHour?: number };
      return rest;
    });
    return ok(data, { backend: repos.backend, ...principalView(principal) });
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, "api_employees_create", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "reallocate");
    const body = await req.json().catch(() => null);
    if (!body?.name) {
      const { NextResponse } = await import("next/server");
      return NextResponse.json({ code: "INVALID_INPUT", message: "name is required" }, { status: 422 });
    }
    const repos = getRepositories();
    const employee = await repos.employees.create({
      name: String(body.name),
      role: body.role ?? "employee",
      title: body.title ?? null,
      departmentId: body.departmentId ?? "",
      capacityHoursPerWeek: Number(body.capacityHoursPerWeek ?? 40),
      skills: body.skills ?? [],
      location: body.location ?? "Remote",
      timezone: body.timezone ?? "UTC",
      joinedAt: new Date().toISOString().slice(0, 10),
    });
    log.info("employee_created", { employeeId: employee.id, actor: principal.id });
    return ok(employee, { backend: repos.backend, ...principalView(principal) });
  });
}
