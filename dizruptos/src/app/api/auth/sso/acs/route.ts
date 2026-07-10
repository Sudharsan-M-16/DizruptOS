// SAML Assertion Consumer Service (ACS) — POST endpoint that receives the
// IdP's SAMLResponse, validates the assertion, extracts claims, and establishes
// a session. Wire in node-saml for production XML parsing + signature validation.

import { type NextRequest, NextResponse } from "next/server";
import { metrics } from "@/lib/telemetry";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const samlResponse = body.get("SAMLResponse");
    const relayState = body.get("RelayState");

    if (!samlResponse) {
      metrics.authEvents.inc({ event: "saml_acs_missing_response" });
      return NextResponse.json({ error: "SAMLResponse missing" }, { status: 400 });
    }

    // Production path:
    //   1. base64-decode SAMLResponse
    //   2. validate XML signature against IdP certificate
    //   3. extract NameID (email), attributes (role, org_id, groups)
    //   4. upsert user in users table (on_auth_user_created hook style)
    //   5. issue Supabase session via Admin API (supabase.auth.admin.generateLink)
    //   6. redirect to returnTo from RelayState

    let returnTo = "/";
    if (relayState) {
      try {
        const decoded = JSON.parse(Buffer.from(String(relayState), "base64url").toString());
        returnTo = decoded.returnTo ?? "/";
      } catch { /* ignore malformed relay state */ }
    }

    metrics.authEvents.inc({ event: "saml_acs_received" });

    // Stub response until node-saml is wired:
    return NextResponse.json({
      status: "saml_acs_stub",
      message: "SAML ACS received. Wire node-saml to validate the assertion and establish a session.",
      samlResponseLength: String(samlResponse).length,
      returnTo,
    });

  } catch (err) {
    metrics.authEvents.inc({ event: "saml_acs_error" });
    console.error(JSON.stringify({ ts: new Date().toISOString(), level: "error", event: "saml_acs_error", ctx: { error: String(err) } }));
    return NextResponse.json({ error: "SAML processing failed" }, { status: 500 });
  }
}
