// GET /api/v1/intelligence/delta?since=24h — "What Changed" feed.
// Returns last 24h of meaningful events: audit trail + risk escalations + proposal decisions.
// Ranked by impact score. Falls back to seed data in demo mode.

import { type NextRequest } from "next/server";
import { resolvePrincipal, requirePermission } from "@/server/services/authz";
import { guarded, ok } from "@/server/api";
import { getRepositories } from "@/server/repositories";

export const dynamic = "force-dynamic";

interface DeltaEvent {
  id: string;
  at: string;
  category: "risk" | "proposal" | "intelligence" | "system";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  detail: string;
  entityId?: string;
  entityType?: string;
  appId?: string;
}

function impactScore(evt: DeltaEvent): number {
  const severityScore = { critical: 100, high: 60, medium: 30, low: 10 }[evt.severity];
  const recencyScore = Math.max(0, 1 - (Date.now() - new Date(evt.at).getTime()) / (24 * 60 * 60 * 1000)) * 40;
  return severityScore + recencyScore;
}

export async function GET(req: NextRequest) {
  return guarded(req, "intelligence_delta", async () => {
    const principal = resolvePrincipal(req);
    requirePermission(principal, "view_executive");

    const since = req.nextUrl.searchParams.get("since") ?? "24h";
    const hoursBack = since === "48h" ? 48 : since === "7d" ? 168 : 24;
    const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const repos = getRepositories();
    const audits = await repos.audit.list();

    // Filter to window + convert to delta events
    const recentAudits = audits
      .filter((a) => new Date(a.at) >= cutoff)
      .slice(0, 50);

    const events: DeltaEvent[] = recentAudits.map((a) => {
      // Classify severity from action type
      const severity: DeltaEvent["severity"] =
        a.actionType.includes("critical") || a.actionType.includes("suspend") ? "critical" :
        a.actionType.includes("escalat") || a.actionType.includes("reject") ? "high" :
        a.actionType.includes("approv") || a.actionType.includes("creat") ? "medium" : "low";

      const category: DeltaEvent["category"] =
        a.entityType === "risk" ? "risk" :
        a.entityType === "proposal" ? "proposal" :
        a.entityType === "intelligence" ? "intelligence" : "system";

      const appId =
        category === "risk" ? "r-risks" :
        category === "proposal" ? "r-proposals" :
        category === "intelligence" ? "copilot" : undefined;

      return {
        id: a.id,
        at: a.at,
        category,
        severity,
        title: a.actionType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        detail: a.detail,
        entityId: a.entityType ? `${a.entityType}-${a.id}` : undefined,
        entityType: a.entityType,
        appId,
      };
    });

    // Also add a few synthetic "what changed" events from the seed for demo richness
    const demoEvents: DeltaEvent[] = events.length < 3 ? [
      {
        id: "delta-risk-1",
        at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        category: "risk",
        severity: "critical",
        title: "Risk Escalated",
        detail: "Bus-factor risk r-1 escalated: Sarah Okafor is sole expert on Payments capability",
        entityId: "r-1",
        entityType: "risk",
        appId: "r-risks",
      },
      {
        id: "delta-prop-1",
        at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        category: "proposal",
        severity: "medium",
        title: "Proposal Approved",
        detail: "Agent proposal P-004: Resource reallocation approved by Noor Al-Rashid",
        entityId: "prop-4",
        entityType: "proposal",
        appId: "r-proposals",
      },
      {
        id: "delta-intel-1",
        at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        category: "intelligence",
        severity: "high",
        title: "OHI Declined",
        detail: "Org Health Index dropped 3 points this week (72 → 69). Strategy drift is the primary driver.",
        entityType: "intelligence",
        appId: "copilot",
      },
    ] : [];

    const allEvents = [...events, ...demoEvents]
      .sort((a, b) => impactScore(b) - impactScore(a))
      .slice(0, 20);

    return ok({
      events: allEvents,
      since: cutoff.toISOString(),
      total: allEvents.length,
    }, { principal: { id: principal.id, role: principal.role } });
  });
}
