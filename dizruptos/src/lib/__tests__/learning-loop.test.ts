import { describe, it, expect } from "vitest";
import { analyzeOutcome, outcomeQualitySummary } from "@/server/engine/outcome-intelligence";
import { analyzeLearnings } from "@/server/engine/learning-intelligence";
import { recommend } from "@/server/engine/recommendations";

describe("outcome intelligence", () => {
  it("scores success and flags failures", () => {
    expect(analyzeOutcome({ id: "o", decisionId: "d", status: "succeeded", actual: "shipped", confidence: 0.9 }).successScore).toBe(1);
    const fail = analyzeOutcome({ id: "o2", decisionId: "d2", status: "failed", strategic: true });
    expect(fail.successScore).toBe(0);
    expect(fail.strategicImpact).toBe("high");
  });
  it("summarizes average success across measured outcomes", () => {
    const s = outcomeQualitySummary([
      { id: "1", decisionId: "d", status: "succeeded" },
      { id: "2", decisionId: "d", status: "partial" },
      { id: "3", decisionId: "d", status: "pending" },
    ]);
    expect(s.measured).toBe(2);
    expect(s.avgSuccessScore).toBe(0.75);
  });
});

describe("learning intelligence", () => {
  it("separates reusable learnings and groups by capability", () => {
    const r = analyzeLearnings([
      { id: "l1", title: "Dual-write bounds risk", insight: "...", capabilityName: "Payments", hindsight: "validated" },
      { id: "l2", title: "Vendor lock-in", insight: "...", capabilityName: "Vendor", hindsight: "misjudged" },
    ]);
    expect(r.reusable.map((x) => x.title)).toContain("Dual-write bounds risk");
    expect(r.repeatedMistakes[0].theme).toBe("Vendor");
    expect(r.capabilityLessons["Payments"]).toContain("Dual-write bounds risk");
  });
});

describe("recommendation engine (the learning-loop payoff)", () => {
  const recs = recommend({
    capabilities: [
      { id: "fin", name: "Finance & Modeling", strategicImportance: "high", busFactor: 1, hasBackup: false, successionRisk: "critical", fragile: true },
      { id: "fe", name: "Frontend", strategicImportance: "medium", busFactor: 3, hasBackup: true, successionRisk: "low", fragile: false },
    ],
    successionExposure: [{ userId: "noor", userName: "Noor", capabilities: ["Finance & Modeling"] }],
    dependencyHubs: [{ id: "pay-api", label: "Payments API", blastRadius: 5, criticality: "critical" }],
    retrospectives: [{ decisionId: "d1", title: "Vendor consolidation", hindsight: "misjudged" }],
  });

  it("generates evidence-backed, traceable recommendations and ranks them", () => {
    expect(recs.length).toBeGreaterThanOrEqual(4);
    for (const r of recs) {
      expect(r.evidence.length).toBeGreaterThan(0);
      expect(r.rationale.length).toBeGreaterThan(0);
      expect(r.traceTo.id).toBeTruthy();
    }
    // sorted by priority desc
    expect(recs[0].priority).toBeGreaterThanOrEqual(recs[recs.length - 1].priority);
  });

  it("does not recommend cross-training a healthy capability", () => {
    expect(recs.find((r) => r.id === "cross_train:fe")).toBeUndefined();
  });

  it("recommends revisiting a misjudged decision", () => {
    expect(recs.find((r) => r.type === "revisit_decision")).toBeTruthy();
  });
});
