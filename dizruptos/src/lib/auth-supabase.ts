// Real-auth scaffolding (Supabase Auth) — env-gated so demo mode is untouched.
//
// HOW IT GOES LIVE (no code change needed once configured):
//   1. Set in dizruptos/.env.local — NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.
//   2. In Supabase → Authentication: enable Email (magic link) and/or Google/MS.
//   3. Add an Auth Hook (or a SQL trigger) that mints `app_metadata.role` and
//      `app_metadata.org_id` into the JWT from your `users` table.
//   4. Set the callback URL to `${origin}/auth/callback`.
// Until then, `isAuthConfigured` is false and the app runs the demo persona flow.

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { env, isDemoMode } from "./env";
import type { Role } from "./types";

/** The cookie store shape a Route Handler / Server Component hands us. */
export interface CookieStore {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => void;
}

export const isAuthConfigured = !isDemoMode && !!env.supabaseUrl && !!env.supabaseAnonKey;

/** Claims we expect the Auth Hook to mint into the JWT. */
export interface SessionClaims {
  userId: string;
  email?: string;
  role: Role;
  orgId?: string;
}

/** Browser-side Supabase client (anon). Returns null in demo mode. */
export function browserClient() {
  if (!isAuthConfigured) return null;
  return createBrowserClient(env.supabaseUrl!, env.supabaseAnonKey!);
}

/**
 * Server-side Supabase client bound to a Next.js cookie store. Pass the cookie
 * adapter from a Route Handler / Server Component. Returns null in demo mode.
 */
export function serverClient(cookies: CookieStore) {
  if (!isAuthConfigured) return null;
  return createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: { getAll: cookies.getAll, setAll: cookies.setAll },
  });
}

/* ------------------------------ sign-in / out ----------------------------- */
// These run in the browser. They no-op (return a clear error) in demo mode, so
// the login page can call them unconditionally.

const NOT_CONFIGURED = { ok: false as const, error: "Real auth is not configured (demo mode)." };

export async function signInWithMagicLink(email: string) {
  const sb = browserClient();
  if (!sb) return NOT_CONFIGURED;
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` },
  });
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}

export async function signInWithOAuth(provider: "google" | "azure") {
  const sb = browserClient();
  if (!sb) return NOT_CONFIGURED;
  const { error } = await sb.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
  });
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}

export async function signOutSupabase() {
  const sb = browserClient();
  if (!sb) return;
  await sb.auth.signOut();
}

/** Pull our typed claims off a Supabase user (role/org from app_metadata). */
export function claimsFromUser(user: {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
} | null | undefined): SessionClaims | null {
  if (!user) return null;
  const meta = user.app_metadata ?? {};
  const role = (meta.role as Role) ?? "employee";
  return { userId: user.id, email: user.email, role, orgId: meta.org_id as string | undefined };
}
