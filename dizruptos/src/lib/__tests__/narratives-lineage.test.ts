import { describe, it, expect } from "vitest";
import { composeNarrative, type NarrativeInputs } from "@/server/engine/narratives";
import { decisionMemory } from "@/server/engine/org-memory";
import type { DecisionNode } from "@/server/engine/decision-intelligence";

const baseNarrative = (over: Partial<NarrativeInputs> = {}): NarrativeInputs => ({
  period: "weekly",
  health: { score: 72, band: "watch", topConcerns: ["succession exposure", "vendor concentration"] },
  recommendations: [
    { title: "Cross-train Finance", impact: "critical", priority: 0.9, status: "pending" },
    { title: "Reduce vendor reliance", impact: "high", priority: 0.7, status: "accepted" },
  ],
  acted: [{ title: "Reduce vendor reliance", status: "accepted" }],
  calibration: { avgAccuracy: 0.83, avgCalibrationGap: 0.08, observed: 3, trend: "improving" },
  outcomes: { measured: 2, avgSuccessScore: 0.6, failing: 1 },
  learning: { reusableCount: 1, repeatedMistakes: [{ theme: "Vendor", count: 2 }] },
  risks: [{ title: "Key-person dependency", band: "high" }],
  ...over,
});

describe("executive narratives", () => {
  it("composes a grounded weekly brief with the accountability section", () => {
    const n = composeNarrative(baseNarrative());
    expect(n.title).toBe("Weekly Executive Brief");
    expect(n.headline).toContain("72/100");
    const headings = n.sections.map((s) => s.heading);
    expect(headings).toContain("The situation");
    expect(headings).toContain("What changed");
    expect(headings).toContain("What to do next");
    expect(headings).toContain("Are we getting smarter?");
    // weekly omits the standalone risk section
    expect(headings).not.toContain("Risk posture");
    const smarter = n.sections.find((s) => s.heading === "Are we getting smarter?")!;
    expect(smarter.body).toContain("83%");
    expect(smarter.body).toMatch(/improving/i);
  });

  it("monthly review adds risk posture", () => {
    const n = composeNarrative(baseNarrative({ period: "monthly" }));
    expect(n.title).toBe("Monthly Organizational Review");
    expect(n.sections.map((s) => s.heading)).toContain("Risk posture");
  });

  it("is honest when no predictions have resolved", () => {
    const n = composeNarrative(baseNarrative({ calibration: { avgAccuracy: null, avgCalibrationGap: null, observed: 0, trend: "insufficient_data" } }));
    const smarter = n.sections.find((s) => s.heading === "Are we getting smarter?")!;
    expect(smarter.body).toMatch(/no predictions have resolved/i);
    expect(n.confidence).toMatch(/provisional/i);
  });

  it("reflects an at-risk org in the headline", () => {
    const n = composeNarrative(baseNarrative({ health: { score: 41, band: "critical", topConcerns: ["fragility", "workload"] } }));
    expect(n.headline).toMatch(/at risk/i);
  });
});

describe("decision lineage in organizational memory", () => {
  const node: DecisionNode = {
    id: "dec-vendor", title: "Consolidate to a single cloud vendor",
    rationale: "Reduce overhead via committed-use discounts.", context: "Cost initiative.",
    confidenceLevel: "medium", status: "ACTIVE", ownerId: "u-noor",
  };

  it("surfaces evidence, assumptions, hypotheses and a lineage chain", () => {
    const m = decisionMemory(
      node,
      [],
      [{ id: "o", status: "failed", actual: "Cost rose 8%" }],
      [{ id: "l", title: "Lost leverage", insight: "Consolidation removed negotiating leverage." }],
      {
        evidence: [{ source: "Finance model", summary: "15% discount modeled", strength: "moderate" }],
        assumptions: [{ statement: "We won't need multi-cloud leverage", status: "violated", criticality: "high" }],
        hypotheses: [{ statement: "≥15% net savings", status: "refuted", confidence: 0.6 }],
      }
    );
    expect(m.assumptions).toHaveLength(1);
    expect(m.hypotheses[0].status).toBe("refuted");
    expect(m.violatedAssumptions).toContain("We won't need multi-cloud leverage");
    expect(m.lineage.some((l) => l.includes("Evidence"))).toBe(true);
    expect(m.lineage.some((l) => l.includes("Assumption [violated]"))).toBe(true);
    // a failed outcome → would not repeat
    expect(m.repeatRecommendation).toBe("no");
    expect(m.explanation).toMatch(/critical assumption no longer holds/i);
  });

  it("downgrades 'would repeat' when a success rested on a violated assumption", () => {
    const m = decisionMemory(
      { ...node, title: "Lucky win" },
      [],
      [{ id: "o", status: "succeeded", actual: "Worked out" }],
      [],
      { assumptions: [{ statement: "Market stays flat", status: "violated", criticality: "critical" }] }
    );
    // success would normally be "yes"; the broken critical assumption makes it conditional
    expect(m.repeatRecommendation).toBe("yes_with_changes");
  });

  it("still works with no lineage provided (backward compatible)", () => {
    const m = decisionMemory(node, [], [], []);
    expect(m.assumptions).toEqual([]);
    expect(m.violatedAssumptions).toEqual([]);
    expect(m.lineage[0]).toContain("Decision:");
  });
});
