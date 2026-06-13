// PATCH /api/v1/proposals/:id — record a human verdict on an agent proposal.
//
// Body: { action: "approve" | "reject" }
//
// Authorization is the same dynamic-view predicate the inbox uses: the
// proposal must be visible to THIS principal (role visibility, or the
// employee is the subject). A principal cannot decide a proposal they could
// not see — even by guessing ids. Every verdict is appended to the ledger.

import { type NextRequest } from "next/server";
import { getRepositories } from "@/server/repositories";
import { resolvePrincipal } from "@/server/services/authz";
import { proposalsForRole } from "@/lib/rbac";
import { fail, guarded, ok, principalView } from "@/server/api";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

const VERDICTS = { approve: "approved", reject: "rejected" } as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return guarded(req, "api_proposal_decide", async () => {
    const principal = resolvePrincipal(req);
    const body = (await req.json().catch(() => null)) as {
      action?: keyof typeof VERDICTS;
    } | null;
    if (!body?.action || !(body.action in VERDICTS)) {
      return fail(422, "INVALID_INPUT", 'action must be "approve" or "reject".');
    }

    const repos = getRepositories();
    const all = await repos.proposals.list();
    const visible = proposalsForRole(all, principal.role, principal.id);
    const proposal = visible.find((p) => p.id === params.id);
    // 404 (not 403) for invisible ids — do not leak proposal existence.
    if (!proposal) return fail(404, "NOT_FOUND", `proposal ${params.id}`);
    if (proposal.status !== "pending") {
      return fail(409, "CONFLICT", `proposal already ${proposal.status}.`);
    }

    const status = VERDICTS[body.action];
    await repos.proposals.setStatus(params.id, status);
    await repos.audit.append({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      actorId: principal.id,
      actorRole: principal.role,
      actionType: `PROPOSAL_${body.action.toUpperCase()}`,
      entityType: "proposal",
      entityLabel: proposal.title,
      detail: `${proposal.agentType} proposal ${status} by ${principal.name}`,
      at: new Date().toISOString(),
    });
    log.info("proposal_decided", { id: params.id, status, actor: principal.id });

    return ok(
      { id: params.id, status },
      { backend: repos.backend, ...principalView(principal) }
    );
  });
}
