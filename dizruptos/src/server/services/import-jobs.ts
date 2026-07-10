// In-memory import job tracker — ring buffer of the last 50 import jobs.
// Provides status tracking for CSV imports and webhook ingestion runs.
// Survives process restarts only in the same process; for persistence,
// wire to the audit table (a future enhancement).

export type JobStatus = "pending" | "running" | "success" | "failed" | "partial";

export interface ImportJob {
  id: string;
  entity: string;
  source: "csv" | "jira" | "linear" | "github" | "hris_bulk";
  status: JobStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  parsed: number;
  imported: number;
  errors: { row?: number; message: string }[];
  triggeredBy: string;
}

const MAX_JOBS = 50;
const jobs: ImportJob[] = [];

export function createJob(opts: Pick<ImportJob, "entity" | "source" | "triggeredBy">): ImportJob {
  const job: ImportJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    entity: opts.entity,
    source: opts.source,
    triggeredBy: opts.triggeredBy,
    status: "pending",
    startedAt: new Date().toISOString(),
    parsed: 0,
    imported: 0,
    errors: [],
  };
  jobs.push(job);
  if (jobs.length > MAX_JOBS) jobs.shift();
  return job;
}

export function updateJob(id: string, update: Partial<ImportJob>): void {
  const job = jobs.find((j) => j.id === id);
  if (job) Object.assign(job, update);
}

export function finishJob(
  id: string,
  result: { status: JobStatus; parsed: number; imported: number; errors: ImportJob["errors"] }
): void {
  const job = jobs.find((j) => j.id === id);
  if (!job) return;
  const now = Date.now();
  Object.assign(job, {
    ...result,
    finishedAt: new Date().toISOString(),
    durationMs: now - new Date(job.startedAt).getTime(),
  });
}

export function listJobs(limit = 20): ImportJob[] {
  return jobs.slice(-Math.min(limit, MAX_JOBS)).reverse();
}

export function getJob(id: string): ImportJob | undefined {
  return jobs.find((j) => j.id === id);
}

// ---- Retry queue ----

export interface RetryItem {
  jobId: string;
  entity: string;
  source: ImportJob["source"];
  payload: unknown;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number;
  lastError: string;
  deadLettered: boolean;
}

const MAX_RETRY_ATTEMPTS = 3;
const retryQueue: RetryItem[] = [];

export function enqueueRetry(opts: {
  jobId: string;
  entity: string;
  source: ImportJob["source"];
  payload: unknown;
  error: string;
}): RetryItem {
  const existing = retryQueue.find((r) => r.jobId === opts.jobId);
  if (existing) {
    existing.attempts += 1;
    existing.lastError = opts.error;
    existing.nextRetryAt = Date.now() + Math.pow(2, existing.attempts) * 1000;
    existing.deadLettered = existing.attempts >= existing.maxAttempts;
    return existing;
  }
  const item: RetryItem = {
    jobId: opts.jobId,
    entity: opts.entity,
    source: opts.source,
    payload: opts.payload,
    attempts: 1,
    maxAttempts: MAX_RETRY_ATTEMPTS,
    nextRetryAt: Date.now() + 2000,
    lastError: opts.error,
    deadLettered: false,
  };
  retryQueue.push(item);
  return item;
}

export function listDeadLettered(): RetryItem[] {
  return retryQueue.filter((r) => r.deadLettered);
}

export function listPendingRetries(): RetryItem[] {
  return retryQueue.filter((r) => !r.deadLettered && r.nextRetryAt <= Date.now());
}

export function clearDeadLettered(jobId: string): void {
  const idx = retryQueue.findIndex((r) => r.jobId === jobId);
  if (idx !== -1) retryQueue.splice(idx, 1);
}

// ---- Dedup fingerprint ----
// Prevents the same external event (same source + externalId) from being
// imported twice within a 5-minute window. Idempotency at the task level.
const dedupSeen = new Map<string, number>(); // fingerprint → expiresAt
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

export function isDuplicate(source: string, externalId: string): boolean {
  const key = `${source}:${externalId}`;
  const expiresAt = dedupSeen.get(key);
  if (expiresAt && expiresAt > Date.now()) return true;
  dedupSeen.set(key, Date.now() + DEDUP_WINDOW_MS);
  // Prune expired entries (cap memory)
  if (dedupSeen.size > 1000) {
    const now = Date.now();
    for (const [k, exp] of dedupSeen) if (exp <= now) dedupSeen.delete(k);
  }
  return false;
}
