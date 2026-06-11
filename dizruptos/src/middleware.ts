// Edge middleware — route protection + security headers on every response.
//
// Session model (demo tier): POST /api/auth/login sets an httpOnly `dz_session`
// cookie; this middleware refuses shell routes without it. Production swap
// (PRD §14.1–14.2): the cookie becomes the opaque Supabase session reference,
// and this file additionally calls the token-introspection endpoint. The
// redirect topology and header policy do not change.

import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/welcome", "/api/auth", "/api/health"];

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
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  res.headers.set("X-DNS-Prefetch-Control", "off");
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.includes(".");

  if (isPublic) return withSecurityHeaders(NextResponse.next());

  const session = req.cookies.get("dz_session");
  if (!session?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
