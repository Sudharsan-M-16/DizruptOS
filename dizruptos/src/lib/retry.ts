// Retry with exponential backoff + full jitter.
// Use at system boundaries (external API calls, DB operations outside TanStack Query).

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

const defaultShouldRetry = (error: unknown, attempt: number): boolean => {
  if (attempt >= 3) return false;
  if (error instanceof Error) {
    // Don't retry client errors (4xx) — only transient failures
    if (error.message.includes("(400)") || error.message.includes("(401)") ||
        error.message.includes("(403)") || error.message.includes("(404)")) {
      return false;
    }
  }
  return true;
};

function jitteredDelay(attempt: number, base: number, max: number): number {
  const exponential = Math.min(base * 2 ** attempt, max);
  // Full jitter: uniform [0, exponential] — avoids synchronized retries
  return Math.random() * exponential;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 500,
    maxDelayMs = 30_000,
    shouldRetry = defaultShouldRetry,
  } = opts;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!shouldRetry(err, attempt)) break;
      const delay = jitteredDelay(attempt, baseDelayMs, maxDelayMs);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
