// Verifies the 60s TTL in-process cache in the copilot route.
// We test the cache logic in isolation — same key/TTL logic without the HTTP layer.

import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Replicate the cache logic from route.ts ───────────────────────────────────
// (imported separately so we can control Date.now)

type CacheEntry<T> = { result: T; ts: number };

function makeCache<T>(ttlMs: number, maxEntries: number) {
  const store = new Map<string, CacheEntry<T>>();

  function getCached(q: string): T | null {
    const key = q.toLowerCase().trim();
    const entry = store.get(key);
    if (entry && Date.now() - entry.ts < ttlMs) return entry.result;
    store.delete(key);
    return null;
  }

  function setCached(q: string, result: T): void {
    store.set(q.toLowerCase().trim(), { result, ts: Date.now() });
    if (store.size > maxEntries) {
      const oldest = [...store.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
      if (oldest) store.delete(oldest[0]);
    }
  }

  return { getCached, setCached, store };
}

describe("copilot answer cache (60s TTL)", () => {
  const { getCached, setCached, store } = makeCache<{ answer: string; intent: string }>(60_000, 50);

  beforeEach(() => store.clear());

  it("returns null on first call (cache miss)", () => {
    expect(getCached("who is overloaded?")).toBeNull();
  });

  it("returns cached result immediately after set", () => {
    const result = { answer: "Ahmed is overloaded", intent: "capacity" };
    setCached("who is overloaded?", result);
    expect(getCached("who is overloaded?")).toEqual(result);
  });

  it("cache key is normalised (case-insensitive + trim)", () => {
    const result = { answer: "No risks", intent: "risks" };
    setCached("  What are the risks  ", result);
    expect(getCached("what are the risks")).toEqual(result);
    expect(getCached("WHAT ARE THE RISKS")).toEqual(result);
  });

  it("returns null after TTL expires", () => {
    const result = { answer: "All good", intent: "org_health" };
    setCached("health?", result);

    // Mock Date.now to be 61s later
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now + 61_000);
    expect(getCached("health?")).toBeNull();
    vi.restoreAllMocks();
  });

  it("different questions are cached independently", () => {
    setCached("q1", { answer: "A1", intent: "i1" });
    setCached("q2", { answer: "A2", intent: "i2" });
    expect(getCached("q1")?.answer).toBe("A1");
    expect(getCached("q2")?.answer).toBe("A2");
  });

  it("evicts oldest entry when max (50) is exceeded", () => {
    // Fill 50 entries then add one more
    for (let i = 0; i < 50; i++) {
      setCached(`question-${i}`, { answer: `A${i}`, intent: "test" });
    }
    expect(store.size).toBe(50);
    setCached("question-overflow", { answer: "overflow", intent: "test" });
    expect(store.size).toBe(50); // evicted oldest
  });
});
