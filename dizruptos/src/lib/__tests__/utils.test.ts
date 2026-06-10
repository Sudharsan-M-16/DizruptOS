import { describe, expect, it } from "vitest";
import { fmtMoney, fmtPct, timeUntil, utilizationTone } from "../utils";

describe("capacity color law (PRD §3.1)", () => {
  it("green below 80%", () => {
    expect(utilizationTone(0)).toBe("ok");
    expect(utilizationTone(0.79)).toBe("ok");
  });
  it("yellow 80–99%", () => {
    expect(utilizationTone(0.8)).toBe("warn");
    expect(utilizationTone(0.99)).toBe("warn");
  });
  it("red at and above 100% (over-allocation boundary is inclusive)", () => {
    expect(utilizationTone(1.0)).toBe("danger");
    expect(utilizationTone(1.12)).toBe("danger");
  });
});

describe("financial integer purity (PRD law 5)", () => {
  it("renders micro-units without float drift", () => {
    expect(fmtMoney(1_000_000)).toBe("$1");
    expect(fmtMoney(180_000_000_000)).toBe("$180k");
    expect(fmtMoney(4_200_000_000_000)).toBe("$4.2M");
  });
});

describe("formatting", () => {
  it("fmtPct rounds to whole percent", () => {
    expect(fmtPct(0.794)).toBe("79%");
    expect(fmtPct(1.12)).toBe("112%");
  });
  it("timeUntil never renders negative durations", () => {
    expect(timeUntil("2026-06-12T06:00:00Z", "2026-06-10T07:00:00Z")).toBe("in 47h");
    expect(timeUntil("2026-06-13T07:00:00Z", "2026-06-10T07:00:00Z")).toBe("in 3d");
    expect(timeUntil("2026-06-09T07:00:00Z", "2026-06-10T07:00:00Z")).toBe("expired");
  });
});
