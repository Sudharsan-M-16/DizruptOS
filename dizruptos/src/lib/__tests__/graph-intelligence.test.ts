import { describe, it, expect } from "vitest";
import { blastRadius, analyzeDependency, dependencyConcentration, type DepEdge } from "@/server/engine/dependency-intelligence";
import { analyzeRisk, rankRisks } from "@/server/engine/risk-intelligence";
import { organizationalHealth } from "@/server/engine/org-health";

// A small dependency graph: payments-api is a hub many things lean on.
// edges: source depends_on target.  (atlas → payments-api), (billing → payments-api),
// (checkout → billing), (reporting → atlas)
const EDGES: DepEdge[] = [
  { sourceId: "atlas", targetId: "payments-api" },
  { sourceId: "billing", targetId: "payments-api" },
  { sourceId: "checkout", targetId: "billing" },
  { sourceId: "reporting", targetId: "atlas" },
];

describe("dependency intelligence", () => {
  it("blast radius follows transitive dependents", () => {
    const br = blastRadius("payments-api", EDGES);
    // atlas + billing depend directly; checkout via billing; reporting via atlas
    expect(br.reached.sort()).toEqual(["atlas", "billing", "checkout", "reporting"]);
  });

  it("a hub is critical; a leaf is contained", () => {
    expect(analyzeDependency("payments-api", "Payments API", EDGES).criticality).toBe("high");
    expect(analyzeDependency("reporting", "Reporting", EDGES).blastRadius).toBe(0);
  });

  it("concentration ranks hubs first", () => {
    const ranked = dependencyConcentration(
      [{ id: "payments-api", label: "Payments API" }, { id: "reporting", label: "Reporting" }],
      EDGES
    );
    expect(ranked[0].id).toBe("payments-api");
  });
});

describe("risk intelligence", () => {
  it("dependency-adjusted risk amplifies severity by blast radius", () => {
    const onHub = analyzeRisk({ id: "r1", title: "Payments outage", severity: "High", threatensId: "payments-api" }, EDGES);
    const onLeaf = analyzeRisk({ id: "r2", title: "Reporting glitch", severity: "High", threatensId: "reporting" }, EDGES);
    expect(onHub.adjustedScore).toBeGreaterThan(onLeaf.adjustedScore);
    expect(onHub.propagation).toBeGreaterThan(0);
  });

  it("ranks the widest-propagating risk first", () => {
    const ranked = rankRisks(
      [
        { id: "r2", title: "Reporting glitch", severity: "High", threatensId: "reporting" },
        { id: "r1", title: "Payments outage", severity: "High", threatensId: "payments-api" },
      ],
      EDGES
    );
    expect(ranked[0].id).toBe("r1");
  });
});

describe("organizational health rollup", () => {
  it("a fragile, overloaded org scores lower than a balanced one", () => {
    const bad = organizationalHealth({
      capabilityFragility: 0.6, successionExposure: 0.5, dependencyConcentration: 0.5,
      workloadPressure: 0.7, governanceBottleneck: 0.4, decisionGrounding: 0.2,
    });
    const good = organizationalHealth({
      capabilityFragility: 0.1, successionExposure: 0.1, dependencyConcentration: 0.1,
      workloadPressure: 0.1, governanceBottleneck: 0.0, decisionGrounding: 0.9,
    });
    expect(good.score).toBeGreaterThan(bad.score);
    expect(bad.band === "strained" || bad.band === "critical").toBe(true);
    expect(good.band).toBe("healthy");
  });

  it("surfaces the top concerns with evidence", () => {
    const r = organizationalHealth({
      capabilityFragility: 0.6, successionExposure: 0.5, dependencyConcentration: 0.2,
      workloadPressure: 0.55, governanceBottleneck: 0.1, decisionGrounding: 0.5,
    });
    expect(r.topConcerns.length).toBeGreaterThan(0);
    expect(r.explanation).toMatch(/health is \d+\/100/);
  });
});
