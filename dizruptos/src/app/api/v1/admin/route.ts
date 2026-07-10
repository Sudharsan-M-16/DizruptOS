// GET /api/v1/admin — platform super-admin: tenant overview + health.
// Access: admin role only. Audited on every call.

import { type NextRequest } from "next/server";
import { resolvePrincipal, requirePermission } from "@/server/services/authz";
import { getRepositories } from "@/server/repositories";
import { guarded, ok, principalView } from "@/server/api";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "api_admin", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_audit");

    const repos = getRepositories();
    const [employees, projects, risks, audit, proposals, recommendations] = await Promise.all([
      repos.employees.list(),
      repos.projects.list(),
      repos.risks.list(),
      repos.audit.list(50),
      repos.proposals.list(),
      repos.recommendations.list(),
    ]);

    await repos.audit.append({
      id: `aud-admin-${Date.now()}`,
      actorId: principal.id,
      actorRole: principal.role,
      actionType: "admin_dashboard_access",
      entityType: "platform",
      entityLabel: "admin overview",
      detail: "Platform admin dashboard accessed",
      at: new Date().toISOString(),
    });

    return ok({
      platform: {
        mode: process.env.NEXT_PUBLIC_SUPABASE_URL ? "live" : "demo",
        version: process.env.npm_package_version ?? "0.1.0",
        uptime: typeof process.uptime === "function" ? Math.round(process.uptime()) : null,
      },
      tenantStats: {
        users: employees.length,
        projects: projects.length,
        openRisks: risks.filter((r) => r.status !== "CLOSED" && r.status !== "ACCEPTED").length,
        pendingProposals: proposals.filter((p) => p.status === "pending").length,
        pendingRecommendations: recommendations.filter((r) => r.status === "pending").length,
      },
      recentActivity: audit.slice(0, 10).map((a) => ({
        action: a.actionType,
        actor: a.actorId,
        entity: a.entityLabel,
        at: a.at,
      })),
    }, { ...principalView(principal) });
  });
}
