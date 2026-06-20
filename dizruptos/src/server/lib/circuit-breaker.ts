// Circuit breaker — prevents cascading failures when a dependency (DB, AI) is down.
//
// States: CLOSED (normal) → OPEN (failing, reject fast) → HALF_OPEN (probe)
// The server/repositories/index.ts makeResilient() proxy is the primary layer;
// this utility sits above it for anything that needs explicit trip/reset control.

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  failureThreshold?: number;   // open after N consecutive failures (default 5)
  successThreshold?: number;   // close after N consecutive successes in HALF_OPEN (default 2)
  timeoutMs?: number;          // open → half-open after this many ms (default 60s)
  name?: string;
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private successes = 0;
  private openedAt = 0;
  private readonly threshold: number;
  private readonly successThreshold: number;
  private readonly timeout: number;
  readonly name: string;

  constructor(opts: CircuitBreakerOptions = {}) {
    this.threshold = opts.failureThreshold ?? 5;
    this.successThreshold = opts.successThreshold ?? 2;
    this.timeout = opts.timeoutMs ?? 60_000;
    this.name = opts.name ?? "circuit";
  }

  async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.openedAt < this.timeout) {
        if (fallback) return fallback();
        throw new Error(`CircuitBreaker[${this.name}] is OPEN — fast fail`);
      }
      this.state = "HALF_OPEN";
      this.successes = 0;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      if (fallback) return fallback();
      throw err;
    }
  }

  private onSuccess() {
    this.failures = 0;
    if (this.state === "HALF_OPEN") {
      this.successes++;
      if (this.successes >= this.successThreshold) this.state = "CLOSED";
    }
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.threshold || this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.openedAt = Date.now();
      this.failures = 0;
    }
  }

  getState(): CircuitState { return this.state; }
  reset() { this.state = "CLOSED"; this.failures = 0; this.successes = 0; }
}

// Singleton breakers for the two external dependencies
export const supabaseBreaker = new CircuitBreaker({ name: "supabase", failureThreshold: 5, timeoutMs: 30_000 });
export const anthropicBreaker = new CircuitBreaker({ name: "anthropic", failureThreshold: 3, timeoutMs: 60_000 });
