import { describe, it, expect } from "vitest";

// Each test uses a unique orgId to avoid cross-test state bleed
// from the module-level `alerts` array in alert-engine.ts.

describe("alert-engine", () => {
  it("pushAlert / listAlerts round-trip", async () => {
    const { pushAlert, listAlerts } = await import("@/server/services/alert-engine");
    const orgId = `org-rt-${Date.now()}`;
    const alert = pushAlert({
      category: "risk",
      severity: "critical",
      orgId,
      title: "Test alert",
      body: "Test body",
      evidence: [{ label: "count", value: 3 }],
    });
    expect(alert.id).toMatch(/^alert-/);
    expect(alert.acknowledged).toBe(false);
    const found = listAlerts(orgId).find((a) => a.id === alert.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe("Test alert");
  });

  it("listAlerts filters by orgId", async () => {
    const { pushAlert, listAlerts } = await import("@/server/services/alert-engine");
    const orgA = `org-A-${Date.now()}`;
    const orgB = `org-B-${Date.now()}`;
    pushAlert({ category: "capacity", severity: "medium", orgId: orgA, title: "A", body: "", evidence: [] });
    pushAlert({ category: "capacity", severity: "medium", orgId: orgB, title: "B", body: "", evidence: [] });
    expect(listAlerts(orgA).every((a) => a.orgId === orgA)).toBe(true);
    expect(listAlerts(orgB).every((a) => a.orgId === orgB)).toBe(true);
  });

  it("listAlerts filters by category", async () => {
    const { pushAlert, listAlerts } = await import("@/server/services/alert-engine");
    const orgId = `org-cat-${Date.now()}`;
    pushAlert({ category: "risk", severity: "high", orgId, title: "Risk", body: "", evidence: [] });
    pushAlert({ category: "capacity", severity: "low", orgId, title: "Cap", body: "", evidence: [] });
    const riskOnly = listAlerts(orgId, { category: "risk" });
    expect(riskOnly.every((a) => a.category === "risk")).toBe(true);
    expect(riskOnly.length).toBeGreaterThanOrEqual(1);
  });

  it("acknowledgeAlert marks acknowledged", async () => {
    const { pushAlert, acknowledgeAlert, listAlerts } = await import("@/server/services/alert-engine");
    const orgId = `org-ack-${Date.now()}`;
    const a = pushAlert({ category: "recommendation", severity: "info", orgId, title: "Rec", body: "", evidence: [] });
    expect(acknowledgeAlert(a.id)).toBe(true);
    const found = listAlerts(orgId).find((x) => x.id === a.id);
    expect(found?.acknowledged).toBe(true);
  });

  it("acknowledgeAlert returns false for missing id", async () => {
    const { acknowledgeAlert } = await import("@/server/services/alert-engine");
    expect(acknowledgeAlert("nonexistent-xyz-999")).toBe(false);
  });

  it("acknowledgeAll clears all unacknowledged for org", async () => {
    const { pushAlert, acknowledgeAll, listAlerts } = await import("@/server/services/alert-engine");
    const orgId = `org-all-${Date.now()}`;
    pushAlert({ category: "risk", severity: "high", orgId, title: "E1", body: "", evidence: [] });
    pushAlert({ category: "capacity", severity: "medium", orgId, title: "E2", body: "", evidence: [] });
    const count = acknowledgeAll(orgId);
    expect(count).toBeGreaterThanOrEqual(2);
    expect(listAlerts(orgId, { unacknowledged: true }).length).toBe(0);
  });

  it("listAlerts with unacknowledged filter", async () => {
    const { pushAlert, acknowledgeAlert, listAlerts } = await import("@/server/services/alert-engine");
    const orgId = `org-unack-${Date.now()}`;
    const a = pushAlert({ category: "succession", severity: "medium", orgId, title: "F1", body: "", evidence: [] });
    pushAlert({ category: "succession", severity: "medium", orgId, title: "F2", body: "", evidence: [] });
    acknowledgeAlert(a.id);
    const unacked = listAlerts(orgId, { unacknowledged: true });
    expect(unacked.every((x) => !x.acknowledged)).toBe(true);
    expect(unacked.length).toBe(1);
  });

  it("listAlerts respects limit", async () => {
    const { pushAlert, listAlerts } = await import("@/server/services/alert-engine");
    const orgId = `org-lim-${Date.now()}`;
    for (let i = 0; i < 10; i++) {
      pushAlert({ category: "risk", severity: "info", orgId, title: `Alert ${i}`, body: "", evidence: [] });
    }
    expect(listAlerts(orgId, { limit: 3 }).length).toBe(3);
  });
});
