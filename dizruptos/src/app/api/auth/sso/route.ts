// SSO entry point — supports SAML 2.0 (IdP-initiated + SP-initiated) and OIDC.
//
// Enterprise configuration (per-tenant, stored in DB):
//   SAML:  idpEntityId, idpSsoUrl, idpCertificate, spEntityId, spAcsUrl
//   OIDC:  issuer, clientId, clientSecret, scopes
//
// This scaffold provides the SP-initiated SAML flow and the OIDC redirect.
// Wire in a real SAML library (e.g. node-saml, @boxyhq/saml20) for production.
//
// Flow:
//   GET /api/auth/sso?org=<orgSlug>           → redirect to IdP login
//   POST /api/auth/sso/acs                    → SAML Assertion Consumer Service
//   GET  /api/auth/sso/oidc/callback          → OIDC authorization code exchange

import { type NextRequest, NextResponse } from "next/server";

interface SsoConfig {
  protocol: "saml" | "oidc";
  idpEntityId?: string;
  idpSsoUrl?: string;
  oidcIssuer?: string;
  oidcClientId?: string;
  scopes?: string[];
}

// In production: load from DB per org slug.
function getSsoConfig(orgSlug: string): SsoConfig | null {
  const raw = process.env[`SSO_CONFIG_${orgSlug.toUpperCase()}`];
  if (!raw) return null;
  try { return JSON.parse(raw) as SsoConfig; } catch { return null; }
}

export async function GET(req: NextRequest) {
  const orgSlug = req.nextUrl.searchParams.get("org");
  if (!orgSlug) {
    return NextResponse.json({ error: "org parameter required" }, { status: 400 });
  }

  const cfg = getSsoConfig(orgSlug);
  if (!cfg) {
    return NextResponse.json({
      error: "SSO not configured for this organization",
      docs: "/docs/sso-setup",
    }, { status: 404 });
  }

  const relayState = Buffer.from(JSON.stringify({
    org: orgSlug,
    returnTo: req.nextUrl.searchParams.get("returnTo") ?? "/",
    ts: Date.now(),
  })).toString("base64url");

  if (cfg.protocol === "saml") {
    // Production: use node-saml to build the AuthnRequest XML + sign it.
    // Stub: redirect to IdP SSO URL with RelayState.
    if (!cfg.idpSsoUrl) {
      return NextResponse.json({ error: "IdP SSO URL not configured" }, { status: 503 });
    }
    const samlUrl = new URL(cfg.idpSsoUrl);
    samlUrl.searchParams.set("RelayState", relayState);
    // SAMLRequest would be the base64url-encoded AuthnRequest XML (add with node-saml).
    samlUrl.searchParams.set("SAMLRequest", "__AUTHN_REQUEST__");
    return NextResponse.redirect(samlUrl.toString());
  }

  if (cfg.protocol === "oidc") {
    if (!cfg.oidcIssuer || !cfg.oidcClientId) {
      return NextResponse.json({ error: "OIDC not configured" }, { status: 503 });
    }
    const authUrl = new URL(`${cfg.oidcIssuer}/authorize`);
    authUrl.searchParams.set("client_id", cfg.oidcClientId);
    authUrl.searchParams.set("redirect_uri", `${req.nextUrl.origin}/api/auth/sso/oidc/callback`);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", (cfg.scopes ?? ["openid", "email", "profile"]).join(" "));
    authUrl.searchParams.set("state", relayState);
    return NextResponse.redirect(authUrl.toString());
  }

  return NextResponse.json({ error: "Unsupported SSO protocol" }, { status: 400 });
}
