import { describe, it, expect } from "vitest";
import {
  analyzeDecision,
  decisionConfidence,
  evidenceQuality,
  type DecisionNode,
} from "@/server/engine/decision-intelligence";
import { decisionMemory, governanceSignals } from "@/server/engine/org-memory";

// Mirrors the live ledger-first decision (de01) + its partial outcome + learning.
const LEDGER: DecisionNode = {
  id: "de01",
  title: "Ledger-first architecture",
  rationale: "Double-entry ledger is the durable source of truth; cutover risk is bounded by feature-flagged dual-write.",
  confidenceLevel: "high",
  status: "ACTIVE",
  ownerId: "priya",
  approverIds: [],
  affectedEntityCount: 1,
  outcomeStatus: "partial",
  hasEvidence: true,
};

describe("decision intelligence", () => {
  it("evidence quality rewards rationale + outcome", () => {
    expect(evidenceQuality(LEDGER)).toBeGreaterThanOrEqual(0.6);
    expect(evidenceQuality({ id: "x", title: "thin", status: "DRAFT" })).toBeLessThan(0.3);
  });

  it("a recorded outcome grounds confidence", () => {
    const undocumented = decisionConfidence({ id: "y", title: "y", status: "DRAFT", confidenceLevel: "high" });
    expect(decisionConfidence(LEDGER)).toBeGreaterThan(0); // proven, partial
    expect(undocumented).toBeLessThan(decisionConfidence({ ...LEDGER }) + 0.5); // sanity
  });

  it("analyze returns score + evidence + explanation (shared contract)", () => {
    const a = analyzeDecision(LEDGER);
    expect(a.evidenceQuality).toBeGreaterThan(0);
    expect(a.evidence.length).toBeGreaterThan(0);
    expect(a.explanation).toMatch(/Ledger-first/);
    expect(["low", "medium", "high", "critical"]).toContain(a.risk);
  });

  it("a failed outcome makes the decision critical retrospective material", () => {
    const failed = analyzeDecision({ ...LEDGER, outcomeStatus: "failed" });
    expect(failed.risk).toBe("critical");
  });
});

describe("organizational memory", () => {
  const memory = decisionMemory(
    LEDGER,
    [],
    [{ id: "o1", status: "partial", expected: "zero-downtime", actual: "dual-write live; rehearsal 40%", confidence: 0.7 }],
    [{ id: "l1", title: "Feature-flagged dual-write bounds cutover risk", insight: "parallel ledgers validated parity" }]
  );

  it("answers why / what-happened / learned", () => {
    expect(memory.why).toMatch(/durable source of truth/);
    expect(memory.whatHappened[0].status).toBe("partial");
    expect(memory.learned[0]).toMatch(/dual-write/);
  });

  it("derives a 'would we decide again' recommendation from the outcome", () => {
    expect(memory.repeatRecommendation).toBe("yes_with_changes"); // partial outcome
    const chain = memory.lineage.join(" | ");
    expect(chain).toMatch(/Decision/);
    expect(chain).toMatch(/Outcome/);
    expect(chain).toMatch(/Learning/);
  });

  it("too_early when no outcome is recorded", () => {
    const m = decisionMemory(LEDGER, [], [], []);
    expect(m.repeatRecommendation).toBe("too_early");
  });

  it("governance signals compute ownership concentration", () => {
    const g = governanceSignals([
      { status: "approved", approverRole: "dept_head" },
      { status: "pending", approverRole: "dept_head" },
      { status: "approved", approverRole: "admin" },
    ]);
    expect(g.pending).toBe(1);
    expect(g.busiestApprover).toBe("dept_head");
    expect(g.ownershipConcentration).toBeCloseTo(0.67, 1);
  });
});
