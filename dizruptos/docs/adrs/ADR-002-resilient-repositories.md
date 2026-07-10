# ADR-002: Resilient Repository Proxy (makeResilient)

**Status:** Accepted  
**Date:** 2026-06-15  
**Deciders:** Engineering team

## Context

The app needed to work in two modes: live Supabase (production) and in-memory seed (demo/testing). Every API route was implementing its own try/catch fallback logic, leading to duplication and inconsistency.

## Decision

A **Proxy-based `makeResilient()` wrapper** in `server/repositories/index.ts` intercepts every repository method call. On network failure or Supabase error, it auto-falls back to the in-memory seed. This is wired once at the repository factory level.

```typescript
// server/repositories/index.ts
function makeResilient<T>(live: T, memory: T): T {
  return new Proxy(live as object, {
    get(target, prop) {
      const fn = (target as Record<string, unknown>)[prop as string];
      if (typeof fn !== "function") return fn;
      return async (...args: unknown[]) => {
        try {
          return await (fn as Function).apply(target, args);
        } catch {
          return (memory as Record<string, unknown>)[prop as string](...args);
        }
      };
    },
  }) as T;
}
```

## Consequences

**Positive:**
- Zero 500s from Supabase unreachability across all 19 API routes
- Demo mode works identically to production mode from the client's perspective
- `X-Backend: memory` response header makes the active backend observable

**Negative:**
- Fallback data is always stale (seed). If live data diverges significantly, demo mode looks wrong.
- Silent fallback may mask real DB errors in development — check logs for `backend: "memory"` unexpectedly.

## Related

- ADR-001 (schema-authoritative design)
- `src/server/repositories/index.ts`
- `src/server/lib/circuit-breaker.ts` (explicit trip/reset control on top of this)
