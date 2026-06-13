// GET /api/v1/proposals — the role-scoped proposal slice, served from the
// repository layer with server-side authorization. The same `proposalsForRole`
// predicate the UI uses runs HERE, so an employee cannot fetch the governance
// queue by calling the API directly (no trust assumptions).

import { NextResponse, type NextRequest } from "next/server";
import { getRepositories } from "@/server/repositories";

export const dynamic = "force-dynamic"; // session-scoped, never static
import { AuthzError, resolvePrincipal } from "@/server/services/authz";
import { proposalsForRole } from "@/lib/rbac";
import { log } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const principal = resolvePrincipal(req);
    const repos = getRepositories();
    const all = await repos.proposals.list();
    const scoped = proposalsForRole(all, principal.role, principal.id);

    return NextResponse.json({
      apiVersion: "v1",
      backend: repos.backend,
      principal: { id: principal.id, role: principal.role },
      count: scoped.length,
      data: scoped,
    });
  } catch (err) {
    if (err instanceof AuthzError) {
      return NextResponse.json({ code: err.code }, { status: err.status });
    }
    log.error("api_proposals_failed", { error: String(err) });
    return NextResponse.json(
      { code: "INTERNAL", message: "Proposal fetch failed." },
      { status: 500 }
    );
  }
}
