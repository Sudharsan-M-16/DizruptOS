import { describe, it, expect } from "vitest";
import {
  analyzePeople,
  departureImpact,
  peopleHealth,
  type PersonRef,
  type GraphEdge,
} from "@/server/engine/people-intelligence";
import type { CapabilityNode } from "@/server/engine/capability-intelligence";

// Mirrors the live seed.
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
const PEOPLE: PersonRef[] = [
  { id: "ahmed", name: "Ahmed", role: "employee" },
  { id: "priya", name: "Priya", role: "dept_head" },
  { id: "elias", name: "Elias", role: "admin" },
  { id: "noor", name: "Noor", role: "executive" },
];
const EDGES: GraphEdge[] = [
  { sourceId: "ahmed", targetId: "priya" },
  { sourceId: "ahmed", targetId: "pay" },
  { sourceId: "noor", targetId: "fin" },
];

describe("people intelligence (human layer)", () => {
  const analyses = analyzePeople(PEOPLE, CAPS, EDGES);
  const byId = (id: string) => analyses.find((a) => a.id === id)!;

  it("flags the sole holder of a strategic capability as irreplaceable", () => {
    const noor = byId("noor");
    expect(noor.irreplaceable).toBe(true);
    expect(noor.soleStrategicCapabilities).toContain("Finance & Modeling");
    // Vendor Negotiation is medium (not strategic), so exactly ONE sole strategic → "high".
    expect(noor.successionRisk).toBe("high");
  });

  it("computes replacement candidates from the graph", () => {
    const ahmed = byId("ahmed");
    expect(ahmed.replacementCandidates["Payments Systems"]).toContain("Priya");
    const noor = byId("noor");
    expect(noor.replacementCandidates["Finance & Modeling"]).toEqual([]); // nobody
  });

  it("ranks people by org-dependency (most depended-on first)", () => {
    // Noor (sole strategic holder) should outrank someone with full backup.
    expect(analyses[0].orgDependencyScore).toBeGreaterThanOrEqual(analyses[analyses.length - 1].orgDependencyScore);
    expect(["noor", "ahmed"]).toContain(analyses[0].id);
  });

  it("every finding carries evidence + a plain-language explanation", () => {
    for (const a of analyses) {
      expect(typeof a.explanation).toBe("string");
      expect(a.explanation.length).toBeGreaterThan(0);
      expect(Array.isArray(a.evidence)).toBe(true);
    }
  });

  it("departureImpact computes lost vs weakened capabilities", () => {
    const noor = departureImpact("noor", CAPS, EDGES);
    expect(noor.lostCapabilities).toEqual(expect.arrayContaining(["Finance & Modeling", "Vendor Negotiation"]));
    const ahmed = departureImpact("ahmed", CAPS, EDGES);
    expect(ahmed.weakenedCapabilities).toContain("Payments Systems"); // Priya remains
    expect(ahmed.weakenedCapabilities).toContain("Cloud Infrastructure"); // Elias remains
  });

  it("peopleHealth rolls up irreplaceable / critical people", () => {
    const h = peopleHealth(analyses);
    expect(h.total).toBe(4);
    expect(h.irreplaceable).toBeGreaterThanOrEqual(1);
    expect(h.criticalPeople).toContain("Noor");
  });
});
