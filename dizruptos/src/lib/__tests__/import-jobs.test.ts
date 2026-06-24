import { describe, it, expect, beforeEach } from "vitest";
import {
  createJob, updateJob, finishJob, listJobs, getJob,
  enqueueRetry, listDeadLettered, listPendingRetries, clearDeadLettered,
} from "@/server/services/import-jobs";

// Reset module-level state between tests by clearing the private jobs array.
// We do this by creating fresh jobs and relying on ordering.

describe("import-jobs ring buffer", () => {
  it("createJob returns a job with pending status and correct fields", () => {
    const job = createJob({ entity: "employees", source: "csv", triggeredBy: "alice" });
    expect(job.id).toMatch(/^job-\d+-[a-z0-9]+$/);
    expect(job.entity).toBe("employees");
    expect(job.source).toBe("csv");
    expect(job.triggeredBy).toBe("alice");
    expect(job.status).toBe("pending");
    expect(job.parsed).toBe(0);
    expect(job.imported).toBe(0);
    expect(job.errors).toEqual([]);
    expect(job.startedAt).toBeTruthy();
  });

  it("getJob retrieves the job by id", () => {
    const job = createJob({ entity: "capabilities", source: "csv", triggeredBy: "bob" });
    const found = getJob(job.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(job.id);
  });

  it("updateJob mutates the job in-place", () => {
    const job = createJob({ entity: "tasks", source: "jira", triggeredBy: "webhook" });
    updateJob(job.id, { status: "running", parsed: 5 });
    const updated = getJob(job.id);
    expect(updated?.status).toBe("running");
    expect(updated?.parsed).toBe(5);
  });

  it("finishJob sets finishedAt and durationMs", () => {
    const job = createJob({ entity: "decisions", source: "github", triggeredBy: "webhook" });
    finishJob(job.id, { status: "success", parsed: 3, imported: 3, errors: [] });
    const finished = getJob(job.id);
    expect(finished?.status).toBe("success");
    expect(finished?.parsed).toBe(3);
    expect(finished?.imported).toBe(3);
    expect(finished?.finishedAt).toBeTruthy();
    expect(finished?.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("finishJob with errors sets partial status correctly", () => {
    const job = createJob({ entity: "employees", source: "csv", triggeredBy: "charlie" });
    finishJob(job.id, {
      status: "partial",
      parsed: 10,
      imported: 8,
      errors: [{ row: 3, message: "Missing email" }, { row: 7, message: "Invalid role" }],
    });
    const finished = getJob(job.id);
    expect(finished?.status).toBe("partial");
    expect(finished?.errors).toHaveLength(2);
  });

  it("listJobs returns newest first", () => {
    const j1 = createJob({ entity: "a", source: "csv", triggeredBy: "x" });
    const j2 = createJob({ entity: "b", source: "csv", triggeredBy: "x" });
    const list = listJobs(5);
    // j2 is newer, should appear first
    const idxJ1 = list.findIndex((j) => j.id === j1.id);
    const idxJ2 = list.findIndex((j) => j.id === j2.id);
    expect(idxJ2).toBeLessThan(idxJ1);
  });

  it("listJobs respects the limit parameter", () => {
    // Create several jobs
    for (let i = 0; i < 5; i++) {
      createJob({ entity: `entity-${i}`, source: "csv", triggeredBy: "test" });
    }
    const list = listJobs(3);
    expect(list.length).toBeLessThanOrEqual(3);
  });

  it("getJob returns undefined for unknown id", () => {
    expect(getJob("nonexistent-id-xyz")).toBeUndefined();
  });

  it("finishJob on unknown id is a no-op", () => {
    expect(() =>
      finishJob("unknown-id", { status: "failed", parsed: 0, imported: 0, errors: [] })
    ).not.toThrow();
  });
});

describe("retry queue", () => {
  it("enqueueRetry creates a new item", () => {
    const jid = `rj-${Date.now()}-1`;
    const item = enqueueRetry({
      jobId: jid, entity: "people", source: "csv", payload: {}, error: "Timeout",
    });
    expect(item.attempts).toBe(1);
    expect(item.deadLettered).toBe(false);
    expect(item.lastError).toBe("Timeout");
  });

  it("enqueueRetry increments attempts on re-queue", () => {
    const jid = `rj-${Date.now()}-2`;
    enqueueRetry({ jobId: jid, entity: "people", source: "csv", payload: {}, error: "E1" });
    const item = enqueueRetry({ jobId: jid, entity: "people", source: "csv", payload: {}, error: "E2" });
    expect(item.attempts).toBe(2);
    expect(item.lastError).toBe("E2");
  });

  it("dead-letters after 3 attempts", () => {
    const jid = `rj-${Date.now()}-3`;
    for (let i = 0; i < 3; i++) {
      enqueueRetry({ jobId: jid, entity: "people", source: "csv", payload: {}, error: "err" });
    }
    const dead = listDeadLettered().find((r) => r.jobId === jid);
    expect(dead?.deadLettered).toBe(true);
  });

  it("clearDeadLettered removes item", () => {
    const jid = `rj-${Date.now()}-4`;
    for (let i = 0; i < 3; i++) {
      enqueueRetry({ jobId: jid, entity: "people", source: "csv", payload: {}, error: "err" });
    }
    expect(listDeadLettered().find((r) => r.jobId === jid)).toBeDefined();
    clearDeadLettered(jid);
    expect(listDeadLettered().find((r) => r.jobId === jid)).toBeUndefined();
  });

  it("listPendingRetries returns items with nextRetryAt in the past", () => {
    const jid = `rj-${Date.now()}-5`;
    const item = enqueueRetry({ jobId: jid, entity: "people", source: "csv", payload: {}, error: "err" });
    // Patch nextRetryAt to a past timestamp to simulate due retry
    item.nextRetryAt = Date.now() - 1000;
    const pending = listPendingRetries();
    expect(pending.find((r) => r.jobId === jid)).toBeDefined();
  });
});
