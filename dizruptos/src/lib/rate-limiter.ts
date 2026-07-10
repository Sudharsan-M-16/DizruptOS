// Tiered API rate limiter — extracted from middleware so it can be unit-tested
// without the Edge runtime. Middleware imports and calls apiRateLimited().
//
// Tiers:
//   intelligence  10 req/min  (LLM + graph traversal — CPU/cost heavy)
//   general       60 req/min  (everything else)
//   exempt        audit/nav fire-and-forget — never limited

const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;

export const TIER_LIMITS: Record<string, number> = { intelligence: 10, general: 60 };

export function apiRateLimited(
  ip: string,
  pathname: string
): { limited: boolean; retryAfter: number } {
  if (pathname === "/api/v1/audit/nav") return { limited: false, retryAfter: 0 };
  const tier = pathname.startsWith("/api/v1/intelligence") ? "intelligence" : "general";
  const max = TIER_LIMITS[tier];
  const key = `${ip}:${tier}`;
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false, retryAfter: 0 };
  }
  entry.count += 1;
  const limited = entry.count > max;
  return {
    limited,
    retryAfter: limited ? Math.ceil((entry.resetAt - now) / 1000) : 0,
  };
}

/** Test helper — resets all counters. Never called in production. */
export function _resetHits(): void {
  hits.clear();
}
