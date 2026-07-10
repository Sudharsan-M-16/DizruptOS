import { describe, it, expect } from "vitest";
import {
  canTransition,
  nextStates,
  buildPrediction,
  measureAccuracy,
} from "@/server/engine/recommendation-lifecycle";
import { answer, type CopilotContext } from "@/server/engine/copilot";

describe("recommendation lifecycle state machine", () => {
  it("permits valid transitions and forbids invalid ones", () => {
    expect(canTransition("pending", "accepted")).toBe(true);
    expect(canTransition("accepted", "completed")).toBe(true);
    expect(canTransition("completed", "measured")).toBe(true);
    // cannot skip or reverse
    expect(canTransition("pending", "measured")).toBe(false);
    expect(canTransition("measured", "accepted")).toBe(false); // terminal
    expect(canTransition("accepted", "measured")).toBe(false); // must complete first
  });

  it("offers the right next states", () => {
    expect(nextStates("pending")).toContain("accepted");
    expect(nextStates("measured")).toEqual([]);
  });
});

describe("prediction writeback (on accept)", () => {
  it("derives confidence from impact when none provided and clamps to 0..1", () => {
    const p = buildPrediction({ impact: "critical", priority: 0.9 });
    expect(p.confidence).toBe(0.8);
    expect(p.baselineValue).toBeLessThanOrEqual(1);
    expect(p.expectedDelta).toBeGreaterThan(0);
  });
  it("honors an explicit confidence", () => {
    expect(buildPrediction({ impact: "low", priority: 0.5, confidence: 0.65 }).confidence).toBe(0.65);
  });
});

describe("accuracy scoring (on measure)", () => {
  it("scores a perfect prediction at 1.0", () => {
    // predicted the metric would improve by 0.3; baseline 0.8 → actual 0.5 = delta 0.3
    const m = measureAccuracy({ baselineValue: 0.8, expectedDelta: 0.3, actualValue: 0.5 });
    expect(m.actualDelta).toBe(0.3);
    expect(m.accuracy).toBe(1);
  });
  it("penalizes a missed prediction", () => {
    // expected 0.3 improvement but nothing moved
    const m = measureAccuracy({ baselineValue: 0.8, expectedDelta: 0.3, actualValue: 0.8 });
    expect(m.actualDelta).toBe(0);
    expect(m.accuracy).toBeCloseTo(0.7, 5);
  });
});

describe("copilot learning intents (grounded, no hallucination)", () => {
  const base: CopilotContext = {
    capabilities: [], health: { score: 70, band: "watch", topConcerns: [] },
    recommendations: [], succession: [], people: [], risks: [],
    learning: {
      worked: [{ title: "Cross-train Payments", accuracy: 0.9 }],
      failed: [{ title: "Reduce vendor reliance", accuracy: 0.2 }],
      recentlyActed: [{ title: "Cross-train Payments", status: "completed" }],
      avgAccuracy: 0.55,
      calibrationGap: 0.35,
      blindSpots: ["Vendor"],
      bestDecisions: [{ title: "Dual-write rollout" }],
    },
  };

  it("answers which recommendations worked, citing accuracy", () => {
    const a = answer("which recommendations worked?", base);
    expect(a.intent).toBe("recs_that_worked");
    expect(a.answer).toContain("Cross-train Payments");
    expect(a.source).toBe("learning.calibration");
  });

  it("surfaces blind spots / poor calibration", () => {
    const a = answer("what are we consistently wrong about?", base);
    expect(a.intent).toBe("blind_spots");
    expect(a.answer).toContain("Vendor");
  });

  it("answers what changed this week from lifecycle data", () => {
    const a = answer("what changed this week?", base);
    expect(a.intent).toBe("what_changed");
    expect(a.answer).toContain("Cross-train Payments");
  });

  it("does not fabricate when there is no learning data", () => {
    const a = answer("which recommendations failed?", { ...base, learning: null });
    expect(a.answer).toMatch(/no measured recommendations/i);
    expect(a.evidence).toEqual([]);
  });
});
