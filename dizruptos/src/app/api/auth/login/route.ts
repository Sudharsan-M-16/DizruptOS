// POST /api/auth/login — demo-tier session issuance with the production shape:
// rate limiting, input validation, httpOnly cookie, single-session semantics
// (one cookie per browser; production adds the sessions-table singleton).
//
// Production swap: validate credentials via supabase.auth.signInWithPassword
// (Admin SDK), invalidate prior sessions, issue RS256 JWT + opaque refresh
// cookie. Request/response contract here is forward-compatible.

import { NextResponse, type NextRequest } from "next/server";
import { securityEvent } from "@/server/services/security-audit";
import { PERSONAS } from "@/lib/personas";

// Valid personas are derived from the canonical list, so adding a role/login in
// one place keeps demo sign-in working everywhere (no second hardcoded set).
const VALID_PERSONAS = new Set(PERSONAS.map((p) => p.id));

// Brute-force protection — FAILURE-based. Only invalid attempts count toward the
// lockout, and a successful sign-in clears the counter. This protects against
// credential guessing without ever locking out legitimate (demo) sign-ins.
const failures = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

function lockedOut(ip: string): boolean {
  const entry = failures.get(ip);
  if (!entry || entry.resetAt < Date.now()) return false;
  return entry.count >= MAX_FAILURES;
}
function recordFailure(ip: string) {
  const now = Date.now();
  const entry = failures.get(ip);
  if (!entry || entry.resetAt < now) failures.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count += 1;
}
function clearFailures(ip: string) {
  failures.delete(ip);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (lockedOut(ip)) {
    return NextResponse.json(
      { code: "RATE_LIMITED", message: "Too many failed attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { code: "INVALID_BODY", message: "Expected JSON body." },
      { status: 400 }
    );
  }

  const personaId = (body as { personaId?: unknown })?.personaId;
  if (typeof personaId !== "string" || !VALID_PERSONAS.has(personaId)) {
    recordFailure(ip);
    void securityEvent("auth_failure", { ip, outcome: "failure", meta: { reason: "invalid_persona" } });
    return NextResponse.json(
      { code: "INVALID_PERSONA", message: "Unknown persona." },
      { status: 422 }
    );
  }

  clearFailures(ip); // legitimate sign-in resets the brute-force counter
  void securityEvent("auth_success", { actorId: personaId, ip, outcome: "success" });
  const res = NextResponse.json({ ok: true, personaId });
  res.cookies.set("dz_session", personaId, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days, mirroring the refresh-cookie window
  });
  return res;
}
