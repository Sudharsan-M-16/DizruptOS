// POST /api/auth/logout — revoke the session cookie.
// In live mode, also signs out from Supabase so the JWT is invalidated server-side.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { securityEvent } from "@/server/services/security-audit";

const authConfigured = env.mode === "production" && !!env.supabaseUrl && !!env.supabaseAnonKey;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const session = req.cookies.get("dz_session")?.value;
  void securityEvent("auth_logout", { actorId: session, ip, outcome: "success" });
  const res = NextResponse.json({ ok: true });

  // Revoke Supabase session if auth is configured
  if (authConfigured) {
    try {
      const sb = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (cookiesToSet) =>
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            ),
        },
      });
      await sb.auth.signOut();
    } catch {
      // Best-effort — always clear the local cookie below
    }
  }

  res.cookies.set("dz_session", "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
