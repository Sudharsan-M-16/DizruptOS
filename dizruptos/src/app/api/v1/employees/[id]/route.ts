// GET /api/v1/employees/:id — single-employee detail, same redaction rules
// as the roster endpoint.

import { type NextRequest } from "next/server";
import { getRepositories } from "@/server/repositories";
import { resolvePrincipal } from "@/server/services/authz";
import { roleCan } from "@/lib/personas";
import { fail, guarded, ok, principalView } from "@/server/api";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return guarded(req, "api_employee_detail", async () => {
    const principal = resolvePrincipal(req);
    const repos = getRepositories();
    const employee = await repos.employees.byId(params.id);
    if (!employee) return fail(404, "NOT_FOUND", `employee ${params.id}`);
    const canSeeCost = roleCan(principal.role, "view_financials");
    const data = canSeeCost
      ? employee
      : (() => {
          const { costPerHour: _cost, ...rest } = employee as typeof employee & {
            costPerHour?: number;
          };
          return rest;
        })();
    return ok(data, { backend: repos.backend, ...principalView(principal) });
  });
}
