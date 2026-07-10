// Unit tests for the executive alert engine — evaluators, state machine, lifecycle.
// Uses the module's exported functions directly (no HTTP layer needed).

import { describe, it, expect, beforeEach } from "vitest";
import {
  pushAlert, listAlerts, acknowledgeAlert, acknowledgeAll,
  type AlertSeverity, type AlertCategory,
} from "../../server/services/alert-engine";

// ── Helpers ───────────────────────────────────────────────────────────────────
const ORG = "test-org";

function makeAlert(overrides: Partial<{
  category: AlertCategory; severity: AlertSeverity; title: string; body: string;
}> = {}) {
  return pushAlert({
    orgId: ORG,
    category: overrides.category ?? "risk",
    severity: overrides.severity ?? "high",
    title: overrides.title ?? "Test alert",
    body: overrides.body ?? "Test body",
    evidence: [],
  });
}

// ── pushAlert ─────────────────────────────────────────────────────────────────
describe("pushAlert", () => {
  it("returns a full OrgAlert with id, generatedAt, acknowledged=false", () => {
    const alert = makeAlert();
    expect(alert.id).toMatch(/^alert-\d+-[a-z0-9]{4}$/);
    expect(alert.acknowledged).toBe(false);
    expect(typeof alert.generatedAt).toBe("string");
    expect(new Date(alert.generatedAt).getTime()).toBeGreaterThan(0);
  });

  it("assigns the correct orgId, category, severity, title", () => {
    const alert = makeAlert({ category: "capacity", severity: "critical", title: "3 burnout flags" });
    expect(alert.orgId).toBe(ORG);
    expect(alert.category).toBe("capacity");
    expect(alert.severity).toBe("critical");
    expect(alert.title).toBe("3 burnout flags");
  });
});

// ── listAlerts ────────────────────────────────────────────────────────────────
describe("listAlerts", () => {
  it("filters by orgId — other orgs' alerts are not visible", () => {
    makeAlert(); // ORG
    const other = listAlerts("different-org");
    // other org has no alerts (or only its own if tests run in sequence)
    const orgAlerts = listAlerts(ORG);
    expect(orgAlerts.every((a) => a.orgId === ORG)).toBe(true);
  });

  it("filters by category", () => {
    makeAlert({ category: "risk" });
    makeAlert({ category: "succession" });
    const risks = listAlerts(ORG, { category: "risk" });
    expect(risks.every((a) => a.category === "risk")).toBe(true);
  });

  it("filters unacknowledged only", () => {
    const alert = makeAlert({ title: "unacked-alert" });
    acknowledgeAlert(alert.id);
    const unacked = listAlerts(ORG, { unacknowledged: true });
    expect(unacked.find((a) => a.id === alert.id)).toBeUndefined();
  });

  it("respects limit", () => {
    const results = listAlerts(ORG, { limit: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });
});

// ── acknowledgeAlert ──────────────────────────────────────────────────────────
describe("acknowledgeAlert", () => {
  it("marks a specific alert as acknowledged", () => {
    const alert = makeAlert({ title: "ack-test" });
    expect(alert.acknowledged).toBe(false);
    const ok = acknowledgeAlert(alert.id);
    expect(ok).toBe(true);
    // Verify through list
    const all = listAlerts(ORG);
    const found = all.find((a) => a.id === alert.id);
    expect(found?.acknowledged).toBe(true);
  });

  it("returns false for an unknown id", () => {
    expect(acknowledgeAlert("nonexistent-id")).toBe(false);
  });
});

// ── acknowledgeAll ────────────────────────────────────────────────────────────
describe("acknowledgeAll", () => {
  it("acknowledges all unacknowledged alerts for the org", () => {
    makeAlert({ title: "bulk-a" });
    makeAlert({ title: "bulk-b" });
    const count = acknowledgeAll(ORG);
    expect(count).toBeGreaterThan(0);
    const remaining = listAlerts(ORG, { unacknowledged: true });
    expect(remaining.length).toBe(0);
  });

  it("returns 0 when all are already acknowledged", () => {
    acknowledgeAll(ORG); // ensure all acked
    const count = acknowledgeAll(ORG);
    expect(count).toBe(0);
  });
});

// ── Severity contract ─────────────────────────────────────────────────────────
describe("alert severity contract", () => {
  const validSeverities: AlertSeverity[] = ["critical", "high", "medium", "low", "info"];

  it("all defined severity levels are valid strings", () => {
    for (const s of validSeverities) {
      const a = pushAlert({ orgId: ORG, category: "risk", severity: s, title: `${s} alert`, body: "", evidence: [] });
      expect(a.severity).toBe(s);
    }
  });
});
