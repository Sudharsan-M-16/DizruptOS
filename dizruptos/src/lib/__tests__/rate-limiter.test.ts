import { describe, it, expect, beforeEach } from "vitest";
import { apiRateLimited, TIER_LIMITS, _resetHits } from "../rate-limiter";

beforeEach(() => {
  _resetHits();
});

describe("apiRateLimited — general tier (60 req/min)", () => {
  it("allows the first request", () => {
    const { limited } = apiRateLimited("1.2.3.4", "/api/v1/employees");
    expect(limited).toBe(false);
  });

  it("allows up to the limit", () => {
    const ip = "10.0.0.1";
    const path = "/api/v1/employees";
    for (let i = 0; i < TIER_LIMITS.general; i++) {
      expect(apiRateLimited(ip, path).limited).toBe(false);
    }
  });

  it("blocks the request AFTER the limit is exceeded", () => {
    const ip = "10.0.0.2";
    const path = "/api/v1/people";
    for (let i = 0; i < TIER_LIMITS.general; i++) {
      apiRateLimited(ip, path);
    }
    const { limited, retryAfter } = apiRateLimited(ip, path);
    expect(limited).toBe(true);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it("isolates IPs from each other", () => {
    const path = "/api/v1/employees";
    // exhaust ip-A
    for (let i = 0; i <= TIER_LIMITS.general; i++) apiRateLimited("ip-A", path);
    // ip-B is unaffected
    expect(apiRateLimited("ip-B", path).limited).toBe(false);
  });
});

describe("apiRateLimited — intelligence tier (10 req/min)", () => {
  it("applies the tighter intelligence limit", () => {
    const ip = "10.0.0.3";
    const path = "/api/v1/intelligence/graph";
    for (let i = 0; i < TIER_LIMITS.intelligence; i++) {
      expect(apiRateLimited(ip, path).limited).toBe(false);
    }
    // 11th request — over the intelligence limit
    const { limited } = apiRateLimited(ip, path);
    expect(limited).toBe(true);
  });

  it("intelligence and general tiers share no state", () => {
    const ip = "10.0.0.4";
    // exhaust intelligence
    for (let i = 0; i <= TIER_LIMITS.intelligence; i++) {
      apiRateLimited(ip, "/api/v1/intelligence/graph");
    }
    // general is unaffected
    expect(apiRateLimited(ip, "/api/v1/employees").limited).toBe(false);
  });
});

describe("apiRateLimited — exempt paths", () => {
  it("never limits /api/v1/audit/nav regardless of call count", () => {
    const ip = "10.0.0.5";
    for (let i = 0; i < 1000; i++) {
      expect(apiRateLimited(ip, "/api/v1/audit/nav").limited).toBe(false);
    }
  });
});

describe("apiRateLimited — Retry-After header value", () => {
  it("retryAfter is 0 for non-limited requests", () => {
    expect(apiRateLimited("10.0.0.6", "/api/v1/copilot").retryAfter).toBe(0);
  });

  it("retryAfter is a positive integer (seconds) when limited", () => {
    const ip = "10.0.0.7";
    const path = "/api/v1/intelligence/graph";
    for (let i = 0; i <= TIER_LIMITS.intelligence; i++) apiRateLimited(ip, path);
    const { retryAfter } = apiRateLimited(ip, path);
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThan(0);
  });
});
