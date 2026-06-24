// Executive alert engine — evaluates org state and produces typed, severity-ranked
// alerts. Runs on demand (POST /api/v1/alerts/run) and on a provider-level timer.
// All evaluators are resilient: they catch repository errors and never throw.

import { log } from "@/server/lib/logger";
import { getRepositories } from "@/server/repositories";

export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";
export type AlertCategory =
  | "risk" | "capacity" | "recommendation" | "simulation"
  | "calibration_drift" | "project_health" | "succession" | "digest";

export interface OrgAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  body: string;
  actionId?: string;
  evidence: { label: string; value: string | number }[];
  generatedAt: string;
  orgId: string;
  acknowledged: boolean;
}

const MAX_ALERTS = 200;
const alerts: OrgAlert[] = [];

function makeId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function pushAlert(
  alert: Omit<OrgAlert, "id" | "generatedAt" | "acknowledged">
): OrgAlert {
  const full: OrgAlert = {
    ...alert,
    id: makeId(),
    generatedAt: new Date().toISOString(),
    acknowledged: false,
  };
  alerts.unshift(full);
  if (alerts.length > MAX_ALERTS) alerts.splice(MAX_ALERTS);
  log("info", "alert_generated", {
    id: full.id,
    category: full.category,
    severity: full.severity,
  });
  return full;
}

export function listAlerts(
  orgId: string,
  opts?: {
    category?: AlertCategory;
    unacknowledged?: boolean;
    limit?: number;
  }
): OrgAlert[] {
  let result = alerts.filter((a) => a.orgId === orgId);
  if (opts?.category) result = result.filter((a) => a.category === opts.category);
  if (opts?.unacknowledged) result = result.filter((a) => !a.acknowledged);
  return result.slice(0, opts?.limit ?? 50);
}

export function acknowledgeAlert(id: string): boolean {
  const alert = alerts.find((a) => a.id === id);
  if (!alert) return false;
  alert.acknowledged = true;
  return true;
}

export function acknowledgeAll(orgId: string): number {
  let count = 0;
  alerts.forEach((a) => {
    if (a.orgId === orgId && !a.acknowledged) {
      a.acknowledged = true;
      count++;
    }
  });
  return count;
}

// ---- Evaluators ----

async function evalRiskAlerts(orgId: string): Promise<OrgAlert[]> {
  try {
    const repos = getRepositories();
    const risks = await repos.risks.list();
    const generated: OrgAlert[] = [];

    const escalated = risks.filter((r) => r.status === "ESCALATED");
    if (escalated.length > 0) {
      generated.push(
        pushAlert({
          category: "risk",
          severity: "critical",
          orgId,
          title: `${escalated.length} escalated risk${escalated.length > 1 ? "s" : ""} require executive attention`,
          body: escalated.map((r) => r.title).slice(0, 3).join("; ") + (escalated.length > 3 ? `… +${escalated.length - 3} more` : ""),
          actionId: "r-risks",
          evidence: [
            { label: "Escalated", value: escalated.length },
            { label: "Total open", value: risks.filter((r) => r.status !== "CLOSED").length },
          ],
        })
      );
    }

    const highImpact = risks.filter(
      (r) => r.impact === "critical" && r.status !== "CLOSED" && r.status !== "ACCEPTED"
    );
    if (highImpact.length > 0 && escalated.length === 0) {
      generated.push(
        pushAlert({
          category: "risk",
          severity: "high",
          orgId,
          title: `${highImpact.length} critical-impact risk${highImpact.length > 1 ? "s" : ""} open`,
          body: highImpact[0].title + (highImpact.length > 1 ? ` and ${highImpact.length - 1} more` : ""),
          actionId: "r-risks",
          evidence: [{ label: "Critical impact", value: highImpact.length }],
        })
      );
    }

    return generated;
  } catch {
    return [];
  }
}

async function evalCapacityAlerts(orgId: string): Promise<OrgAlert[]> {
  try {
    const repos = getRepositories();
    const people = await repos.employees.list();
    const generated: OrgAlert[] = [];

    const burnout = people.filter((e) => e.burnoutFlag);
    if (burnout.length > 0) {
      generated.push(
        pushAlert({
          category: "capacity",
          severity: burnout.length >= 3 ? "critical" : "high",
          orgId,
          title: `${burnout.length} team member${burnout.length > 1 ? "s" : ""} showing burnout signals`,
          body: burnout.map((e) => e.name).slice(0, 3).join(", ") + (burnout.length > 3 ? ` +${burnout.length - 3} more` : ""),
          actionId: "r-capacity",
          evidence: [
            { label: "Burnout flags", value: burnout.length },
            { label: "Team size", value: people.length },
          ],
        })
      );
    }

    return generated;
  } catch {
    return [];
  }
}

async function evalSuccessionAlerts(orgId: string): Promise<OrgAlert[]> {
  try {
    const repos = getRepositories();
    const people = await repos.employees.list();
    const generated: OrgAlert[] = [];

    const highFlight = people.filter((e) => typeof e.flightRisk === "number" && e.flightRisk >= 0.7);
    if (highFlight.length > 0) {
      generated.push(
        pushAlert({
          category: "succession",
          severity: highFlight.length >= 2 ? "high" : "medium",
          orgId,
          title: `${highFlight.length} key person${highFlight.length > 1 ? "s" : ""} flagged as high flight risk`,
          body: "Succession planning recommended for these roles.",
          actionId: "directory",
          evidence: [
            { label: "High flight risk", value: highFlight.length },
            { label: "Threshold", value: "≥ 70%" },
          ],
        })
      );
    }

    return generated;
  } catch {
    return [];
  }
}

async function evalProjectHealthAlerts(orgId: string): Promise<OrgAlert[]> {
  try {
    const repos = getRepositories();
    const projects = await repos.projects.list();
    const generated: OrgAlert[] = [];

    const critical = projects.filter((p) => p.health === "CRITICAL");
    const atRisk = projects.filter((p) => p.health === "AT_RISK" || p.health === "BLOCKED");

    if (critical.length > 0) {
      generated.push(
        pushAlert({
          category: "project_health",
          severity: "critical",
          orgId,
          title: `${critical.length} project${critical.length > 1 ? "s" : ""} in CRITICAL health`,
          body: critical.map((p) => p.name).join(", "),
          actionId: "matrix",
          evidence: [
            { label: "Critical", value: critical.length },
            { label: "At risk", value: atRisk.length },
            { label: "Total", value: projects.length },
          ],
        })
      );
    } else if (atRisk.length > 0) {
      generated.push(
        pushAlert({
          category: "project_health",
          severity: "high",
          orgId,
          title: `${atRisk.length} project${atRisk.length > 1 ? "s are" : " is"} at risk or blocked`,
          body: atRisk.map((p) => p.name).slice(0, 3).join(", "),
          actionId: "matrix",
          evidence: [{ label: "At risk / blocked", value: atRisk.length }],
        })
      );
    }

    return generated;
  } catch {
    return [];
  }
}

export async function runAlertEngine(orgId: string): Promise<OrgAlert[]> {
  log("info", "alert_engine_run", { orgId });
  const results = await Promise.allSettled([
    evalRiskAlerts(orgId),
    evalCapacityAlerts(orgId),
    evalSuccessionAlerts(orgId),
    evalProjectHealthAlerts(orgId),
  ]);

  const generated: OrgAlert[] = [];
  results.forEach((r) => {
    if (r.status === "fulfilled") generated.push(...r.value);
  });

  log("info", "alert_engine_done", { orgId, generated: generated.length });
  return generated;
}
