import { type NextRequest } from "next/server";
import { resolvePrincipal } from "@/server/services/authz";
import { guarded, ok } from "@/server/api";
import { getRepositories } from "@/server/repositories";
import { listAlerts } from "@/server/services/alert-engine";
import { log } from "@/server/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, "digest", async () => {
    resolvePrincipal(req);
    const orgId = "demo";
    const type = (req.nextUrl.searchParams.get("type") ?? "daily") as "daily" | "weekly";
    const repos = getRepositories();

    const [peopleRes, risksRes] = await Promise.allSettled([
      repos.employees.list(),
      repos.risks.list(),
    ]);

    const people = peopleRes.status === "fulfilled" ? peopleRes.value : [];
    const risks = risksRes.status === "fulfilled" ? risksRes.value : [];
    const unackedAlerts = listAlerts(orgId, { unacknowledged: true, limit: 10 });

    const escalatedRisks = risks.filter(
      (r) => r.status === "ESCALATED" || r.impact === "critical"
    );

    const digest = {
      type,
      orgId,
      generatedAt: new Date().toISOString(),
      period: type === "daily" ? "Last 24 hours" : "Last 7 days",
      headline:
        escalatedRisks.length > 0
          ? `${type === "daily" ? "Today" : "This week"}: ${escalatedRisks.length} escalated risk${escalatedRisks.length > 1 ? "s" : ""} require attention.`
          : type === "daily"
          ? "Everything looks healthy today."
          : "Strong week — no critical issues.",
      sections: [
        {
          title: "Attention Required",
          items: unackedAlerts.slice(0, 5).map((a) => ({
            severity: a.severity,
            text: a.title,
            actionId: a.actionId,
          })),
        },
        {
          title: "Risk Posture",
          items: [
            { label: "Escalated risks", value: escalatedRisks.length },
            { label: "Total open risks", value: risks.filter((r) => r.status !== "CLOSED").length },
          ],
        },
        {
          title: "Team",
          items: [{ label: "Total headcount", value: people.length }],
        },
      ],
      unacknowledgedAlerts: unackedAlerts.length,
    };

    log("info", "digest_generated", { type, orgId, alertCount: unackedAlerts.length });
    return ok(digest);
  });
}
