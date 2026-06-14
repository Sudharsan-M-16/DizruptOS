import { describe, it, expect } from "vitest";
import { simulateDeparture, simulateStaffing, simulateNodeFailure } from "@/server/engine/simulation";
import { retrospective, type DecisionNode } from "@/server/engine/decision-intelligence";
import type { CapabilityNode } from "@/server/engine/capability-intelligence";
import type { DepEdge } from "@/server/engine/dependency-intelligence";

const CAPS: CapabilityNode[] = [
  { id: "pay", name: "Payments Systems", strategicImportance: "critical",
    holders: [{ userId: "ahmed", userName: "Ahmed", proficiency: 5 }, { userId: "priya", userName: "Priya", proficiency: 3 }] },
  { id: "cloud", name: "Cloud Infrastructure", strategicImportance: "high",
    holders: [{ userId: "ahmed", userName: "Ahmed", proficiency: 4 }, { userId: "elias", userName: "Elias", proficiency: 4 }] },
  { id: "fin", name: "Finance & Modeling", strategicImportance: "high",
    holders: [{ userId: "noor", userName: "Noor", proficiency: 5 }] },
  { id: "vendor", name: "Vendor Negotiation", strategicImportance: "medium",
    holders: [{ userId: "noor", userName: "Noor", proficiency: 4 }] },
];
const EDGES: DepEdge[] = [{ sourceId: "x", targetId: "noor" }, { sourceId: "y", targetId: "x" }];

describe("departure simulation", () => {
  it("a sole holder's departure LOSES capabilities", () => {
    const r = simulateDeparture("noor", "Noor", CAPS, EDGES);
    expect(r.lostCapabilities).toEqual(expect.arrayContaining(["Finance & Modeling", "Vendor Negotiation"]));
    expect(r.after.fragile).toBeGreaterThanOrEqual(r.before.fragile);
    expect(r.explanation).toMatch(/Noor/);
  });

  it("a backed-up person's departure only WEAKENS", () => {
    const r = simulateDeparture("ahmed", "Ahmed", CAPS, EDGES);
    expect(r.lostCapabilities).toEqual([]); // Priya/Elias cover
    expect(r.weakenedCapabilities).toEqual(expect.arrayContaining(["Payments Systems", "Cloud Infrastructure"]));
  });

  it("staffing a backup reduces fragility", () => {
    const r = simulateStaffing(
      [{ capabilityId: "fin", capabilityName: "Finance & Modeling", userName: "New Hire", proficiency: 4 }],
      CAPS
    );
    expect(r.after.noBackup).toBeLessThan(r.before.noBackup);
  });

  it("node failure computes blast radius", () => {
    const r = simulateNodeFailure("noor", "Noor", EDGES);
    expect(r.affectedCount).toBe(2); // x → y transitively
  });
});

describe("decision retrospectives", () => {
  it("a succeeded outcome with high confidence is validated", () => {
    const d: DecisionNode = { id: "d", title: "T", status: "ACTIVE", confidenceLevel: "high", outcomeStatus: "succeeded", rationale: "well reasoned rationale here" };
    const r = retrospective(d);
    expect(r.hindsight).toBe("validated");
    expect(r.successScore).toBe(1);
  });
  it("a failed outcome with high confidence is misjudged", () => {
    const r = retrospective({ id: "d", title: "T", status: "ACTIVE", confidenceLevel: "high", outcomeStatus: "failed" });
    expect(r.hindsight).toBe("misjudged");
  });
  it("no outcome → too early", () => {
    expect(retrospective({ id: "d", title: "T", status: "DRAFT" }).hindsight).toBe("too_early");
  });
});
