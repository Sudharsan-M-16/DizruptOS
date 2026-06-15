// SCIM 2.0 Users resource — RFC 7644.
// Enterprise IdPs (Okta, Azure AD, OneLogin) hit this to provision/deprovision users.
//
// Auth: Bearer token in Authorization header, validated against SCIM_TOKEN env var.
// In production: per-tenant tokens stored in tenant_settings, looked up by org.

import { type NextRequest, NextResponse } from "next/server";
import { metrics } from "@/lib/telemetry";

const SCIM_TOKEN = process.env.SCIM_TOKEN;

function scimError(status: number, scimType: string, detail: string) {
  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
    status: String(status),
    scimType,
    detail,
  }, { status });
}

function verifyToken(req: NextRequest): boolean {
  if (!SCIM_TOKEN) return true; // open in demo mode
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${SCIM_TOKEN}`;
}

function toScimUser(user: Record<string, unknown>, base: string) {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: user.id,
    externalId: user.externalId,
    userName: user.email,
    name: { formatted: user.name, givenName: String(user.name ?? "").split(" ")[0], familyName: String(user.name ?? "").split(" ").slice(1).join(" ") },
    displayName: user.name,
    active: user.active ?? true,
    emails: [{ value: user.email, primary: true, type: "work" }],
    "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
      department: user.department,
      organization: user.orgId,
    },
    meta: {
      resourceType: "User",
      location: `${base}/api/v1/scim/Users/${user.id}`,
      created: user.createdAt,
      lastModified: user.updatedAt ?? user.createdAt,
    },
  };
}

// GET /api/v1/scim/Users — list with optional filter
export async function GET(req: NextRequest) {
  if (!verifyToken(req)) return scimError(401, "invalidCredentials", "Bearer token invalid");

  const filter = req.nextUrl.searchParams.get("filter");
  const startIndex = parseInt(req.nextUrl.searchParams.get("startIndex") ?? "1");
  const count = Math.min(parseInt(req.nextUrl.searchParams.get("count") ?? "100"), 200);

  // In production: query users table with org_id scoping + SCIM filter parsing.
  // Demo: return a stub list.
  const stubUsers: Record<string, unknown>[] = [
    { id: "u-demo-1", externalId: "okta-001", email: "noor@example.com", name: "Noor Patel", active: true, department: "Engineering", orgId: "org-1", createdAt: "2026-01-01T00:00:00Z" },
    { id: "u-demo-2", externalId: "okta-002", email: "asha@example.com", name: "Asha Reyes", active: true, department: "Engineering", orgId: "org-1", createdAt: "2026-01-01T00:00:00Z" },
  ];

  const filtered = filter
    ? stubUsers.filter((u) => {
        const m = filter.match(/userName eq "(.+?)"/);
        return m ? u.email === m[1] : true;
      })
    : stubUsers;

  const base = req.nextUrl.origin;
  metrics.importRows.inc({ connector: "scim", action: "list" }, filtered.length);

  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: filtered.length,
    startIndex,
    itemsPerPage: Math.min(count, filtered.length),
    Resources: filtered.slice(startIndex - 1, startIndex - 1 + count).map((u) => toScimUser(u, base)),
  });
}

// POST /api/v1/scim/Users — provision a new user
export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return scimError(401, "invalidCredentials", "Bearer token invalid");

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return scimError(400, "invalidSyntax", "Invalid JSON"); }

  const userName = body.userName as string | undefined;
  const displayName = (body.displayName ?? body.name as Record<string, string>)?.toString();
  if (!userName) return scimError(400, "invalidValue", "userName is required");

  // Production path:
  //   1. supabase.auth.admin.inviteUserByEmail(userName, { data: { role, org_id, dept } })
  //   2. upsert into public.users
  //   3. return 201 with SCIM representation

  const newUser = {
    id: `scim-${Date.now()}`,
    externalId: body.externalId,
    email: userName,
    name: displayName ?? userName,
    active: body.active ?? true,
    department: (body["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"] as Record<string, string>)?.department,
    orgId: "org-1",
    createdAt: new Date().toISOString(),
  };

  metrics.importRows.inc({ connector: "scim", action: "create" });
  console.log(JSON.stringify({ ts: new Date().toISOString(), level: "info", event: "scim_user_provisioned", ctx: { email: userName } }));

  return NextResponse.json(toScimUser(newUser, req.nextUrl.origin), { status: 201 });
}
