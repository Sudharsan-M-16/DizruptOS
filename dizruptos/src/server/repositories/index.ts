// Repository factory — the ONLY place that knows which backend is live.
// Demo mode (no Supabase env) → in-memory seed. Production → PostgREST.
// Server-only: API routes and services import from here; client code never.

import { env } from "@/lib/env";
import { createMemoryRepositories } from "./memory";
import { createSupabaseRepositories } from "./supabase";
import type { Repositories } from "./types";
import { RepositoryError } from "./types";

let cached: Repositories | null = null;

/** Wrap a single sub-repo so any non-domain network error retries against the
 *  in-memory seed. Transparent to callers — they never need try/catch. */
function wrapRepo<T extends object>(live: T, mem: T): T {
  const proxy = {} as T;
  for (const key of Object.keys(live) as Array<keyof T>) {
    const method = live[key];
    if (typeof method === "function") {
      (proxy as Record<string, unknown>)[key as string] = async (...args: unknown[]) => {
        try {
          return await (method as (...a: unknown[]) => unknown).apply(live, args);
        } catch (err) {
          if (err instanceof RepositoryError) throw err; // domain errors propagate
          return (mem[key] as (...a: unknown[]) => unknown).apply(mem, args);
        }
      };
    } else {
      (proxy as Record<string, unknown>)[key as string] = method;
    }
  }
  return proxy;
}

/** Build a Repositories object where every sub-repo auto-falls-back to memory
 *  on Supabase network/connection errors. Keeps all callers error-free. */
function makeResilient(live: Repositories, mem: Repositories): Repositories {
  return {
    employees: wrapRepo(live.employees, mem.employees),
    tasks: wrapRepo(live.tasks, mem.tasks),
    capacity: wrapRepo(live.capacity, mem.capacity),
    projects: wrapRepo(live.projects, mem.projects),
    proposals: wrapRepo(live.proposals, mem.proposals),
    risks: wrapRepo(live.risks, mem.risks),
    audit: wrapRepo(live.audit, mem.audit),
    approvals: wrapRepo(live.approvals, mem.approvals),
    capabilities: wrapRepo(live.capabilities, mem.capabilities),
    employeeCapabilities: wrapRepo(live.employeeCapabilities, mem.employeeCapabilities),
    relationships: wrapRepo(live.relationships, mem.relationships),
    decisions: wrapRepo(live.decisions, mem.decisions),
    outcomes: wrapRepo(live.outcomes, mem.outcomes),
    learnings: wrapRepo(live.learnings, mem.learnings),
    lineage: wrapRepo(live.lineage, mem.lineage),
    recommendations: wrapRepo(live.recommendations, mem.recommendations),
    backend: live.backend,
  };
}

export function getRepositories(): Repositories {
  if (cached) return cached;
  // DZ_DEMO_DATA=1 forces the in-memory seed for ALL data reads/writes even when
  // Supabase is configured — so the API/engines and the UI share one dataset
  // (the lib/data seed). Supabase still handles auth. Without this flag a stale
  // DB seed would make API-backed surfaces (alerts, risks, narratives) disagree
  // with the UI. Default off → real Postgres in production.
  const forceDemoData = process.env.DZ_DEMO_DATA === "1";
  if (!forceDemoData && env.mode === "production" && env.supabaseUrl) {
    // Service-role key is server-only; falls back to anon (RLS-scoped reads).
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.supabaseAnonKey ?? "";
    const live = createSupabaseRepositories({ url: env.supabaseUrl, key });
    cached = makeResilient(live, createMemoryRepositories());
  } else {
    cached = createMemoryRepositories();
  }
  return cached;
}

export type { Repositories } from "./types";
export { RepositoryError } from "./types";
