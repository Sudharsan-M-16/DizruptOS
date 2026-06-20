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

// Fallback SSO seed for demo mode only — live mode reads from tenant_sso_configs.
const SSO_CONFIG_DEMO: Record<string, { protocol: "saml" | "oidc"; ssoUrl: string; entityId: string }> = {
  "org-1": { protocol: "saml", ssoUrl: "https://idp.example.com/saml/sso", entityId: "dizrupt-sp" },
  "org-demo": { protocol: "oidc", ssoUrl: "https://accounts.google.com/o/oauth2/v2/auth", entityId: "dizrupt-demo" },
};

const isDev = process.env.NODE_ENV !== "production";

function withCacheHeaders(res: NextResponse, pathname: string, method: string): NextResponse {
  if (method === "GET" && pathname.startsWith("/api/v1/intelligence")) {
    res.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=30");
  }
  return res;
}

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

// Tiered API rate limiting — in-memory per edge isolate (production: Redis/Upstash).
// Intelligence routes are compute-heavy (LLM + graph traversal): 10 req/min.
// Everything else: 60 req/min. Audit/nav is exempt (fire-and-forget from UI).
const apiHits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const TIER_LIMITS: Record<string, number> = { intelligence: 10, general: 60 };

function apiRateLimited(ip: string, pathname: string): { limited: boolean; retryAfter: number } {
  if (pathname === "/api/v1/audit/nav") return { limited: false, retryAfter: 0 };
  const tier = pathname.startsWith("/api/v1/intelligence") ? "intelligence" : "general";
  const max = TIER_LIMITS[tier];
  const key = `${ip}:${tier}`;
  const now = Date.now();
  const entry = apiHits.get(key);
  if (!entry || entry.resetAt < now) {
    apiHits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false, retryAfter: 0 };
  }
  entry.count += 1;
  const limited = entry.count > max;
  return { limited, retryAfter: limited ? Math.ceil((entry.resetAt - now) / 1000) : 0 };
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Propagate a request ID for distributed tracing correlation.
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  // Per-tenant SSO initiation routing — routes /api/auth/sso?tenant=<orgId>
  // to the correct IdP for that tenant. In live mode, look up from tenant_sso_configs
  // table. In demo mode, routes from the seed above.
  if (pathname === "/api/auth/sso") {
    const tenantId = req.nextUrl.searchParams.get("tenant") ?? "";
    // Live mode: look up SSO config from DB. Demo mode: use in-memory seed.
    let cfg: { protocol: "saml" | "oidc"; ssoUrl: string; entityId: string } | undefined;
    const srKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (authConfigured && srKey) {
      try {
        const sbUrl = env.supabaseUrl!.replace(/\/$/, "");
        const dbRes = await fetch(
          `${sbUrl}/rest/v1/tenant_sso_configs?org_id=eq.${tenantId}&select=protocol,sso_url,entity_id&limit=1`,
          { headers: { apikey: srKey, Authorization: `Bearer ${srKey}` }, cache: "no-store" }
        );
        if (dbRes.ok) {
          const rows = (await dbRes.json()) as Array<{ protocol: string; sso_url: string; entity_id: string }>;
          if (rows[0]) cfg = { protocol: rows[0].protocol as "saml" | "oidc", ssoUrl: rows[0].sso_url, entityId: rows[0].entity_id };
        }
      } catch { /* fall through to demo seed */ }
    }
    if (!cfg) cfg = SSO_CONFIG_DEMO[tenantId];
    if (!cfg) {
      const res = NextResponse.json(
        { error: { code: "SSO_NOT_CONFIGURED", message: `No SSO configured for tenant: ${tenantId || "(none)"}` } },
        { status: 404 }
      );
      res.headers.set("X-Request-ID", requestId);
      return withSecurityHeaders(res);
    }
    const dest = new URL(cfg.ssoUrl);
    dest.searchParams.set("RelayState", tenantId);
    if (cfg.protocol === "oidc") {
      dest.searchParams.set("client_id", cfg.entityId);
      dest.searchParams.set("response_type", "code");
      dest.searchParams.set("scope", "openid email profile");
    } else {
      // SAML: add SAMLRequest placeholder (real impl uses node-saml to build AuthnRequest)
      dest.searchParams.set("SAMLRequest", `[AuthnRequest:${cfg.entityId}]`);
    }
    const res = NextResponse.redirect(dest);
    res.headers.set("X-Request-ID", requestId);
    return withSecurityHeaders(res);
  }

  if (pathname.startsWith("/api/v1")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
    const { limited, retryAfter } = apiRateLimited(ip, pathname);
    if (limited) {
      const res = NextResponse.json({ code: "RATE_LIMITED" }, { status: 429 });
      if (retryAfter > 0) res.headers.set("Retry-After", String(retryAfter));
      return withSecurityHeaders(res);
    }
  }

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.includes(".");

  if (isPublic) {
    const res = NextResponse.next();
    res.headers.set("X-Request-ID", requestId);
    return withSecurityHeaders(res);
  }

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
    res.headers.set("X-Request-ID", requestId);
    const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (user) {
      // Check org suspension
      const orgId = (user.app_metadata?.org_id as string) ?? null;
      if (orgId) {
        const { data: activeOrg } = await supabase.from("active_organizations").select("id").eq("id", orgId).maybeSingle();
        if (!activeOrg) {
          const suspendRes = NextResponse.json({ code: "ORG_SUSPENDED", message: "Your organization has been suspended." }, { status: 403 });
          suspendRes.headers.set("X-Request-ID", requestId);
          return withSecurityHeaders(suspendRes);
        }
      }
      return withCacheHeaders(withSecurityHeaders(res), pathname, req.method);
    }
    // Expired or invalid session — clear cookies and redirect to login
    if (error?.message?.includes("expired") || error?.message?.includes("invalid")) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("reason", "session_expired");
      loginUrl.searchParams.delete("from");
      loginUrl.searchParams.set("from", pathname);
      const redirectRes = NextResponse.redirect(loginUrl);
      redirectRes.cookies.delete("dz_session");
      return withSecurityHeaders(redirectRes);
    }
    // else fall through to the demo cookie gate
  }

  // ---- demo: the opaque dz_session cookie gate ----
  const session = req.cookies.get("dz_session");
  if (!session?.value) return unauthenticated();
  const res = NextResponse.next();
  res.headers.set("X-Request-ID", requestId);
  return withCacheHeaders(withSecurityHeaders(res), pathname, req.method);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
