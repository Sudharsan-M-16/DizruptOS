import { describe, it, expect } from "vitest";
import { answer, personFromQuestion, type CopilotContext } from "@/server/engine/copilot";
import { scorePrediction, calibrationReport } from "@/server/engine/calibration";

const ctx: CopilotContext = {
  capabilities: [
    { name: "Finance & Modeling", successionRisk: "critical", busFactor: 1, fragile: true, strategicImportance: "high" },
    { name: "Frontend", successionRisk: "low", busFactor: 3, fragile: false, strategicImportance: "medium" },
  ],
  health: { score: 71, band: "watch", topConcerns: ["Capability fragility (40%)", "Succession exposure (40%)"] },
  recommendations: [{ title: "Cross-train Finance backup", rationale: "bus factor 1", impact: "critical", priority: 0.9, evidence: ["bus factor 1"] }],
  succession: [{ userName: "Noor Al-Rashid", capabilities: ["Finance & Modeling"] }],
  people: [{ name: "Noor Al-Rashid", orgDependencyScore: 0.49, irreplaceable: true, successionRisk: "high" }],
  risks: [{ title: "Atlas migration slip", band: "critical" }],
  departure: { name: "Noor Al-Rashid", lost: ["Finance & Modeling"], weakened: [], explanation: "If Noor leaves, Finance & Modeling stops." },
};

describe("executive copilot (graph-grounded)", () => {
  it("routes 'what should I do?' to the top recommendation", () => {
    const a = answer("what should I do next?", ctx);
    expect(a.intent).toBe("highest_roi");
    expect(a.answer).toMatch(/Cross-train Finance backup/);
    expect(a.source).toBe("recommendations");
  });
  it("routes 'most fragile capability' to capability intelligence", () => {
    const a = answer("which capability is most fragile?", ctx);
    expect(a.intent).toBe("fragile_capability");
    expect(a.answer).toMatch(/Finance & Modeling/);
  });
  it("answers a departure question from the simulation", () => {
    const a = answer("what happens if Noor leaves?", ctx);
    expect(a.intent).toBe("departure_impact");
    expect(a.answer).toMatch(/Finance & Modeling/);
    expect(a.source).toBe("simulation.simulateDeparture");
  });
  it("answers irreplaceability from people intelligence", () => {
    const a = answer("who is irreplaceable?", ctx);
    expect(a.answer).toMatch(/Noor/);
  });
  it("defaults to org-health focus", () => {
    expect(answer("give me an overview", ctx).intent).toBe("focus_health");
  });
  it("every answer is grounded with a source", () => {
    for (const q of ["focus?", "biggest risk?", "most fragile?"]) expect(answer(q, ctx).source.length).toBeGreaterThan(0);
  });
  it("resolves a person name from a question", () => {
    expect(personFromQuestion("what if noor leaves", ["Noor Al-Rashid", "Asha Venkat"])).toBe("Noor Al-Rashid");
    expect(personFromQuestion("what if nobody leaves", ["Noor Al-Rashid"])).toBeNull();
  });
});

describe("calibration engine", () => {
  it("scores a resolved prediction's accuracy + calibration gap", () => {
    const s = scorePrediction({ id: "p", kind: "recommendation", statement: "reduce fragility 40%", predictedValue: 0.4, confidence: 0.8, actualValue: 0.35 });
    expect(s.observed).toBe(true);
    expect(s.accuracy).toBeCloseTo(0.95, 2); // |0.4-0.35|=0.05 → 0.95
    expect(s.calibrationGap).toBeCloseTo(0.15, 2); // |0.8-0.95|
  });
  it("unobserved predictions score null", () => {
    expect(scorePrediction({ id: "p", kind: "risk", statement: "x", predictedValue: 0.5, confidence: 0.6, actualValue: null }).observed).toBe(false);
  });
  it("rolls up accuracy + detects an improving trend", () => {
    const r = calibrationReport([
      { id: "1", kind: "recommendation", statement: "", predictedValue: 0.4, confidence: 0.8, actualValue: 0.4 },
      { id: "2", kind: "simulation", statement: "", predictedValue: 0.5, confidence: 0.7, actualValue: 0.45 },
      { id: "3", kind: "risk", statement: "", predictedValue: 0.6, confidence: 0.9, actualValue: null },
    ], 0.7);
    expect(r.observed).toBe(2);
    expect(r.avgAccuracy).toBeGreaterThan(0.8);
    expect(r.trend).toBe("improving");
    expect(r.verdict).toMatch(/accuracy/);
  });
});
