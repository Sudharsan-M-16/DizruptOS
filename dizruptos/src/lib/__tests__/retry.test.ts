import { describe, expect, it, vi } from "vitest";
import { withRetry } from "../retry";

describe("withRetry", () => {
  it("resolves immediately if the first attempt succeeds", async () => {
    const fn = vi.fn().mockResolvedValueOnce("ok");
    const result = await withRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and resolves when fn eventually succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("transient"))
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValueOnce("recovered");
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 0 });
    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after maxAttempts exhausted", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("permanent failure"));
    await expect(withRetry(fn, { maxAttempts: 2, baseDelayMs: 0 })).rejects.toThrow(
      "permanent failure"
    );
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry 4xx client errors", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Request failed (404)"));
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 0 })).rejects.toThrow(
      "(404)"
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not retry 401 unauthorized", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Request failed (401)"));
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 0 })).rejects.toThrow(
      "(401)"
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("respects custom shouldRetry predicate", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("custom"));
    // shouldRetry always returns false — no retry
    await expect(
      withRetry(fn, { maxAttempts: 5, baseDelayMs: 0, shouldRetry: () => false })
    ).rejects.toThrow("custom");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
