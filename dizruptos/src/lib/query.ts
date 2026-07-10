// TanStack Query foundation (Option A — schema-authoritative live data).
//
// Conventions
// -----------
// • Query keys are tuples: [domain, scope?, id?] — e.g. ["projects","list"],
//   ["projects","detail", id], ["risks","list"]. Always go through `qk` so
//   invalidation is consistent and typo-proof.
// • Reads hit the versioned API (`/api/v1/*`), which resolves to the live
//   Supabase repositories in production mode. The API is the single contract;
//   the DB schema is the source of truth behind it (no parallel domain model).
// • Mutations invalidate the smallest correct key set (see `invalidate`).
//
// This module is intentionally framework-thin so every route can adopt it
// incrementally as the schema-authoritative migration lands entity by entity.

import { QueryClient } from "@tanstack/react-query";

// Exponential backoff with full jitter (AWS pattern): avoids thundering-herd
// on reconnect. Caps at 30s so the UI never freezes for long.
function retryDelay(attemptIndex: number): number {
  const base = Math.min(1000 * 2 ** attemptIndex, 30_000);
  return base * (0.5 + Math.random() * 0.5);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s — org data changes on human timescales
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay,
    },
    mutations: {
      retry: 2,
      retryDelay,
    },
  },
});

/** Canonical query-key factory. Add domains here, never inline string keys. */
export const qk = {
  projects: {
    all: ["projects"] as const,
    list: () => ["projects", "list"] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
  },
  risks: {
    all: ["risks"] as const,
    list: () => ["risks", "list"] as const,
  },
  employees: {
    all: ["employees"] as const,
    list: () => ["employees", "list"] as const,
    detail: (id: string) => ["employees", "detail", id] as const,
  },
  capacity: { all: ["capacity"] as const, list: () => ["capacity", "list"] as const },
  proposals: { all: ["proposals"] as const, list: () => ["proposals", "list"] as const },
  audit: { all: ["audit"] as const, list: () => ["audit", "list"] as const },
} as const;

/** Invalidate a whole domain (broad) — the default after a mutation. */
export function invalidateDomain(domain: keyof typeof qk) {
  return queryClient.invalidateQueries({ queryKey: [domain] });
}

/** Typed fetch against the v1 API envelope `{ apiVersion, data, ... }`. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api/v1/${path}`, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.code ?? `Request failed (${res.status})`);
  }
  const env = await res.json();
  return env.data as T;
}

/** Typed mutating call (POST/PATCH) against the v1 envelope. */
export async function apiSend<T>(path: string, body: unknown, method: "POST" | "PATCH" = "POST"): Promise<T> {
  const res = await fetch(`/api/v1/${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const env = await res.json().catch(() => null);
    throw new Error(env?.message ?? env?.code ?? `Request failed (${res.status})`);
  }
  const env = await res.json();
  return env.data as T;
}
