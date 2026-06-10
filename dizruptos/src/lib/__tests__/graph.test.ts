import { describe, expect, it } from "vitest";
import {
  edgesFrom,
  edgesTo,
  expertiseConcentration,
  reachable,
  relationships,
  wouldCreateCycle,
  type RelationshipEdge,
} from "../graph";

const mk = (
  s: string,
  type: RelationshipEdge["type"],
  t: string
): RelationshipEdge => ({
  id: `${s}->${t}`,
  source: { id: s, type: "task" },
  target: { id: t, type: "task" },
  type,
  strength: 1,
  confidence: 1,
  evidence: "declared",
});

describe("relationship traversal", () => {
  it("1-hop reads are directional", () => {
    expect(edgesFrom(relationships, "g-revenue", "funds")).toHaveLength(1);
    expect(edgesTo(relationships, "p-atlas", "funds")).toHaveLength(1);
    expect(edgesFrom(relationships, "p-atlas", "funds")).toHaveLength(0);
  });

  it("bounded BFS respects hop limit", () => {
    const oneHop = reachable(relationships, "u-sarah", 1).map((r) => r.ref.id);
    const threeHop = reachable(relationships, "u-sarah", 3).map((r) => r.ref.id);
    expect(threeHop.length).toBeGreaterThan(oneHop.length);
    expect(oneHop).toContain("cap-payments");
    // Vendor is 2 hops away (Sarah → capability → vendor) — not in 1-hop set
    expect(oneHop).not.toContain("v-clearsettle");
    expect(threeHop).toContain("v-clearsettle");
  });
});

describe("DAG cycle detection (PRD §2.4)", () => {
  const chain = [mk("A", "blocks", "B"), mk("B", "blocks", "C")];

  it("rejects an edge that closes a cycle, returning a closed path (PRD 422 format)", () => {
    const res = wouldCreateCycle(chain, "C", "A");
    expect(res.cycle).toBe(true);
    // Cycle path starts and ends on the same node: A → B → C → A
    expect(res.path[0]).toBe(res.path[res.path.length - 1]);
    expect(res.path).toContain("C");
    expect(res.path).toEqual(["A", "B", "C", "A"]);
  });

  it("accepts acyclic additions", () => {
    expect(wouldCreateCycle(chain, "A", "C").cycle).toBe(false);
    expect(wouldCreateCycle(chain, "C", "D").cycle).toBe(false);
  });

  it("rejects self-dependency", () => {
    expect(wouldCreateCycle(chain, "A", "A").cycle).toBe(true);
  });
});

describe("expertise concentration / bus factor (PRD §8.3)", () => {
  it("shares sum to 1 and sort descending", () => {
    const conc = expertiseConcentration(relationships, "cap-payments");
    expect(conc.length).toBe(2);
    expect(conc[0].holderId).toBe("u-sarah");
    const total = conc.reduce((s, c) => s + c.share, 0);
    expect(total).toBeCloseTo(1, 6);
    expect(conc[0].share).toBeGreaterThan(conc[1].share);
  });

  it("empty capability yields empty result, not NaN", () => {
    expect(expertiseConcentration(relationships, "cap-none")).toEqual([]);
  });
});
