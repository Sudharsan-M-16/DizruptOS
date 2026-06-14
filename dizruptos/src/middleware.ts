// Edge middleware — route protection + security headers on every response.
//
// Session model (demo tier): POST /api/auth/login sets an httpOnly `dz_session`
// cookie; this middleware refuses shell routes without it. Production swap
// (PRD §14.1–14.2): the cookie becomes the opaque Supabase session reference,
// and this file additionally calls the token-introspection endpoint. The
// redirect topology and header policy do not change.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "./lib/env";

// Real-auth is active only when Supabase is fully configured; otherwise the demo
// `dz_session` gate runs and nothing about the demo changes.
const authConfigured = env.mode === "production" && !!env.supabaseUrl && !!env.supabaseAnonKey;

const PUBLIC_PATHS = ["/login", "/welcome", "/auth", "/api/auth", "/api/health", "/api/ready"];

const isDev = process.env.NODE_ENV !== "production";

function withSecurityHeaders(res: NextResponse): NextResponse {
  // OWASP secure-header baseline. CSP allows self + inline styles (Tailwind
  // runtime styles + next/font) and Google Fonts fetch at build only.
  // Dev only: Next.js Fast Refresh requires eval; never shipped to production.
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`, // inline: Next runtime + theme no-flash script
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' ws: wss:", // Supabase Realtime joins this list in production
      // Same-origin only: the DizruptOS desktop embeds its own routes as windows
      // (iframes) — never third parties.
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  res.headers.set("X-DNS-Prefetch-Control", "off");
  return res;
}

// API rate limit: 120 req/min/IP across /api/v1 (login has its own stricter
// limiter). In-memory per edge isolate — production swaps to Redis/Upstash.
const apiHits = new Map<string, { count: number; resetAt: number }>();
const API_WINDOW_MS = 60_000;
const API_MAX = 120;

function apiRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = apiHits.get(ip);
  if (!entry || entry.resetAt < now) {
    apiHits.set(ip, { count: 1, resetAt: now + API_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > API_MAX;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/v1")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
    if (apiRateLimited(ip)) {
      return withSecurityHeaders(
        NextResponse.json({ code: "RATE_LIMITED" }, { status: 429 })
      );
    }
  }

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.includes(".");

  if (isPublic) return withSecurityHeaders(NextResponse.next());

  const unauthenticated = () => {
    if (pathname.startsWith("/api/")) {
      return withSecurityHeaders(NextResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 }));
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return withSecurityHeaders(NextResponse.redirect(url));
  };

  // ---- production: a real Supabase session is sufficient (and gets refreshed).
  // We do NOT *require* it, because the demo personas still authenticate with the
  // opaque dz_session cookie even when Supabase is configured — so a real session
  // OR the demo cookie passes. (Retire the demo cookie once real users exist.)
  if (authConfigured) {
    const res = NextResponse.next();
    const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return withSecurityHeaders(res); // real session → allow + refresh
    // else fall through to the demo cookie gate
  }

  // ---- demo: the opaque dz_session cookie gate ----
  const session = req.cookies.get("dz_session");
  if (!session?.value) return unauthenticated();
  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
