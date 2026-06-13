import { describe, it, expect } from "vitest";
import {
  busFactor,
  concentration,
  successionRisk,
  analyzeCapability,
  rankByRisk,
  capabilityHealth,
  experts,
  backupCoverage,
  successionExposure,
  type CapabilityNode,
} from "@/server/engine/capability-intelligence";

// Mirrors the live seed (supabase/seed_capabilities.sql).
const PAYMENTS: CapabilityNode = {
  id: "ca01", name: "Payments Systems", strategicImportance: "critical",
  holders: [{ userId: "ahmed", proficiency: 5 }, { userId: "priya", proficiency: 3 }],
};
const CLOUD: CapabilityNode = {
  id: "ca02", name: "Cloud Infrastructure", strategicImportance: "high",
  holders: [{ userId: "ahmed", proficiency: 4 }, { userId: "elias", proficiency: 4 }],
};
const FRONTEND: CapabilityNode = {
  id: "ca03", name: "Frontend Engineering", strategicImportance: "medium",
  holders: [{ userId: "asha", proficiency: 4 }, { userId: "ahmed", proficiency: 3 }, { userId: "priya", proficiency: 3 }],
};
const FINANCE: CapabilityNode = {
  id: "ca04", name: "Finance & Modeling", strategicImportance: "high",
  holders: [{ userId: "noor", proficiency: 5 }],
};
const ALL = [PAYMENTS, CLOUD, FRONTEND, FINANCE];

describe("capability computation engine", () => {
  it("bus factor counts competent (≥3) holders", () => {
    expect(busFactor(PAYMENTS.holders)).toBe(2);
    expect(busFactor(FINANCE.holders)).toBe(1);
    expect(busFactor(FRONTEND.holders)).toBe(3);
  });

  it("concentration: a sole holder is fully concentrated; shared is lower", () => {
    expect(concentration(FINANCE.holders)).toEqual({ hhi: 1, topShare: 1 });
    const c = concentration(CLOUD.holders); // 4,4 → even split
    expect(c.topShare).toBe(0.5);
    expect(c.hhi).toBe(0.5);
  });

  it("succession risk weights bus factor by strategic importance", () => {
    expect(successionRisk(FINANCE.holders, "high")).toBe("critical"); // sole + strategic
    expect(successionRisk(PAYMENTS.holders, "critical")).toBe("high"); // 2 competent, critical
    expect(successionRisk(FRONTEND.holders, "medium")).toBe("low"); // 3 holders
  });

  it("analyzeCapability flags fragility and backup correctly", () => {
    const fin = analyzeCapability(FINANCE);
    expect(fin.busFactor).toBe(1);
    expect(fin.hasBackup).toBe(false);
    expect(fin.fragile).toBe(true);

    const fe = analyzeCapability(FRONTEND);
    expect(fe.hasBackup).toBe(true);
    expect(fe.fragile).toBe(false);
  });

  it("rankByRisk surfaces the most fragile strategic capability first", () => {
    const ranked = rankByRisk(ALL);
    // Finance (sole holder, high importance) is the single point of failure.
    expect(ranked[0].name).toBe("Finance & Modeling");
    expect(ranked[0].successionRisk).toBe("critical");
  });

  it("experts: identifies the primary and who can replace them", () => {
    const e = experts(PAYMENTS);
    expect(e.primary?.userId).toBe("ahmed");
    expect(e.backups.map((b) => b.userId)).toEqual(["priya"]); // competent backup
    const fin = experts(FINANCE);
    expect(fin.primary?.userId).toBe("noor");
    expect(fin.backups).toHaveLength(0); // nobody can replace
  });

  it("backupCoverage: org-wide redundancy ratio", () => {
    const cov = backupCoverage(ALL); // Cloud + Frontend covered; Payments covered (bf2); Finance not
    expect(cov.covered).toBe(3);
    expect(cov.uncovered).toBe(1);
    expect(cov.pct).toBe(0.75);
  });

  it("successionExposure: single point of failure on a strategic capability", () => {
    const spof = successionExposure(ALL);
    expect(spof).toHaveLength(1);
    expect(spof[0].userId).toBe("noor");
    expect(spof[0].capabilities).toContain("Finance & Modeling");
  });

  it("capabilityHealth produces a real org-level rollup", () => {
    const h = capabilityHealth(ALL);
    expect(h.total).toBe(4);
    expect(h.noBackup).toBe(1); // only Finance has bus factor < 2
    expect(h.fragile).toBe(1);
    expect(h.strategicAtRisk).toBeGreaterThanOrEqual(1);
    expect(h.atRiskCapabilities).toContain("Finance & Modeling");
  });
});
