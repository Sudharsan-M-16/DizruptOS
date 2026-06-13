// GET /api/v1/employees — the roster, with financial fields redacted unless
// the caller holds view_financials (cost data is need-to-know, PRD §14.3).

import { type NextRequest } from "next/server";
import { getRepositories } from "@/server/repositories";
import { resolvePrincipal } from "@/server/services/authz";
import { roleCan } from "@/lib/personas";
import { guarded, ok, principalView } from "@/server/api";

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
