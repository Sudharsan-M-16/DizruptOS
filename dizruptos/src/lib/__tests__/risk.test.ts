import { describe, expect, it } from "vitest";
import { SEVERITY_MATRIX, severityOf } from "../risk";

// PRD §28.2 — the severity matrix is a product law, not an implementation
// detail. These tests pin every cell.

describe("risk severity matrix (PRD §28.2)", () => {
  it("matches the PRD table exactly", () => {
    expect(SEVERITY_MATRIX.low).toEqual({
      low: "Low",
      medium: "Low",
      high: "Medium",
      critical: "High",
    });
    expect(SEVERITY_MATRIX.medium).toEqual({
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Critical",
    });
    expect(SEVERITY_MATRIX.high).toEqual({
      low: "Medium",
      medium: "High",
      high: "Critical",
      critical: "Critical",
    });
  });

  it("severityOf reads probability × impact", () => {
    expect(severityOf({ probability: "high", impact: "critical" })).toBe("Critical");
    expect(severityOf({ probability: "low", impact: "low" })).toBe("Low");
    expect(severityOf({ probability: "medium", impact: "high" })).toBe("High");
  });
});
