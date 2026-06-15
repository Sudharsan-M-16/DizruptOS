// SCIM 2.0 service provider info endpoint.
// RFC 7644 §4 — discovery of supported schemas and service provider config.

import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://dizrupt.app";

export async function GET() {
  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
    documentationUri: `${BASE}/docs/scim`,
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 200 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        type: "oauthbearertoken",
        name: "Bearer Token",
        description: "Authentication via SCIM bearer token (configured per-tenant in settings)",
        specUri: "http://www.rfc-editor.org/info/rfc6750",
        primary: true,
      },
    ],
    meta: {
      resourceType: "ServiceProviderConfig",
      location: `${BASE}/api/v1/scim`,
      created: "2026-06-15T00:00:00Z",
      lastModified: "2026-06-15T00:00:00Z",
    },
  });
}
