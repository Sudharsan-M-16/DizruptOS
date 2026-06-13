// Repository factory — the ONLY place that knows which backend is live.
// Demo mode (no Supabase env) → in-memory seed. Production → PostgREST.
// Server-only: API routes and services import from here; client code never.

import { env } from "@/lib/env";
import { createMemoryRepositories } from "./memory";
import { createSupabaseRepositories } from "./supabase";
import type { Repositories } from "./types";

let cached: Repositories | null = null;

export function getRepositories(): Repositories {
  if (cached) return cached;
  if (env.mode === "production" && env.supabaseUrl) {
    // Service-role key is server-only; falls back to anon (RLS-scoped reads).
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.supabaseAnonKey ?? "";
    cached = createSupabaseRepositories({ url: env.supabaseUrl, key });
  } else {
    cached = createMemoryRepositories();
  }
  return cached;
}

export type { Repositories } from "./types";
export { RepositoryError } from "./types";
