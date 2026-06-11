// POST /api/auth/login — demo-tier session issuance with the production shape:
// rate limiting, input validation, httpOnly cookie, single-session semantics
// (one cookie per browser; production adds the sessions-table singleton).
//
// Production swap: validate credentials via supabase.auth.signInWithPassword
// (Admin SDK), invalidate prior sessions, issue RS256 JWT + opaque refresh
// cookie. Request/response contract here is forward-compatible.

import { NextResponse, type NextRequest } from "next/server";

const VALID_PERSONAS = new Set([
  "u-asha",
  "u-noor",
  "u-priya",
  "u-ahmed",
  "u-elias",
]);

// In-memory rate limit: 10 attempts / IP / 15 min (PRD §14.1 step 3).
// Production: Redis or Postgres counter — serverless instances don't share memory.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { code: "RATE_LIMITED", message: "Too many attempts. Try again in 15 minutes." },
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
    return NextResponse.json(
      { code: "INVALID_PERSONA", message: "Unknown persona." },
      { status: 422 }
    );
  }

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
